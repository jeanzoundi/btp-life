import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// L'entreprise du joueur, sur le modèle EntrepriseVirtuelle : un capital, une équipe salariée, et chaque jour une activité.
// Le chiffre d'affaires dépend de la capacité de l'équipe et de la réputation de l'entreprise ; les salaires et les frais
// fixes partent du capital. Une journée bénéficiaire fait monter la réputation ; quand le capital ne suffit plus, le dernier
// embauché part. Calculé à la lecture, jour par jour (trente jours au plus d'un coup), sans tâche planifiée.

export const POSTES_ENTREPRISE = {
  macon: { nom: 'Maçon', salaireMensuel: 90_000, productivite: 1 },
  ferrailleur: { nom: 'Ferrailleur', salaireMensuel: 95_000, productivite: 1 },
  coffreur: { nom: 'Coffreur', salaireMensuel: 95_000, productivite: 1 },
  'chef-equipe': { nom: 'Chef d’équipe', salaireMensuel: 150_000, productivite: 1.6 },
  'conducteur-travaux': { nom: 'Conducteur de travaux', salaireMensuel: 280_000, productivite: 2.4 },
} as const;
export type PosteEntreprise = keyof typeof POSTES_ENTREPRISE;
export const POSTES = Object.keys(POSTES_ENTREPRISE) as PosteEntreprise[];
export const REGLES_ENTREPRISE = { niveauMin: 12, apportMin: 100_000, equipeMax: 12, chiffreParProductivite: 6_500, fraisFixesJour: 2_500, joursMax: 30 } as const;

export interface Employe { poste: PosteEntreprise; nom: string; embaucheLe: string }
export interface Activite { equipe: Employe[]; majLe: string; journal: { jour: string; chiffre: number; charges: number; resultat: number }[] }

const PRENOMS = ['Moussa', 'Serge', 'Adama', 'Jean-Marc', 'Ibrahim', 'Christian', 'Karim', 'Rodrigue', 'Salif', 'Hervé', 'Aïcha', 'Mariam'];
const NOMS = ['Koné', 'Kouassi', 'Traoré', 'Yao', 'Bamba', 'Diabaté', 'Coulibaly', 'Kouamé', 'N’Guessan', 'Ouattara', 'Gnagne', 'Touré'];
export const nomEmploye = (rang: number) => `${PRENOMS[rang % PRENOMS.length]} ${NOMS[(rang * 5 + 3) % NOMS.length]}`;

export function lireActivite(brut: unknown, maintenant: Date): Activite {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const equipe = Array.isArray(c.equipe) ? c.equipe.flatMap((e): Employe[] => {
    const x = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
    return POSTES.includes(x.poste as PosteEntreprise) ? [{ poste: x.poste as PosteEntreprise, nom: typeof x.nom === 'string' ? x.nom : 'Ouvrier', embaucheLe: typeof x.embaucheLe === 'string' ? x.embaucheLe : maintenant.toISOString() }] : [];
  }).slice(0, REGLES_ENTREPRISE.equipeMax) : [];
  const majLe = typeof c.majLe === 'string' && Number.isFinite(Date.parse(c.majLe)) ? c.majLe : maintenant.toISOString();
  const journal = Array.isArray(c.journal) ? (c.journal as Activite['journal']).slice(-14) : [];
  return { equipe, majLe, journal };
}

/** Une journée d'activité : chiffre d'affaires, charges, résultat ; le capital et la réputation qui en découlent. */
export function journeeEntreprise(capital: number, reputation: number, equipe: readonly Employe[]) {
  const productivite = equipe.reduce((s, e) => s + POSTES_ENTREPRISE[e.poste].productivite, 0);
  const chiffre = Math.round(productivite * REGLES_ENTREPRISE.chiffreParProductivite * (.6 + reputation / 125));
  const charges = Math.round(equipe.reduce((s, e) => s + POSTES_ENTREPRISE[e.poste].salaireMensuel, 0) / 30 + REGLES_ENTREPRISE.fraisFixesJour);
  const resultat = chiffre - charges;
  let suivant = capital + resultat, equipeSuivante = [...equipe], rep = reputation;
  if (suivant < 0) { equipeSuivante = equipeSuivante.slice(0, -1); suivant = 0; rep = Math.max(0, rep - 3); }
  else if (resultat > 0) rep = Math.min(100, rep + 1);
  return { chiffre, charges, resultat, capital: suivant, reputation: rep, equipe: equipeSuivante };
}

/** Les journées écoulées depuis la dernière mise à jour, une par une. */
export function rattraper(capital: number, reputation: number, activite: Activite, maintenant: Date) {
  const jours = Math.min(REGLES_ENTREPRISE.joursMax, Math.floor((maintenant.getTime() - Date.parse(activite.majLe)) / 86_400_000));
  let etat = { capital, reputation, equipe: activite.equipe };
  const journal = [...activite.journal];
  for (let j = 0; j < jours; j++) {
    const r = journeeEntreprise(etat.capital, etat.reputation, etat.equipe);
    etat = { capital: r.capital, reputation: r.reputation, equipe: r.equipe };
    journal.push({ jour: new Date(Date.parse(activite.majLe) + (j + 1) * 86_400_000).toISOString().slice(0, 10), chiffre: r.chiffre, charges: r.charges, resultat: r.resultat });
  }
  const majLe = jours > 0 ? new Date(Date.parse(activite.majLe) + jours * 86_400_000).toISOString() : activite.majLe;
  return { ...etat, activite: { equipe: etat.equipe, majLe: jours >= REGLES_ENTREPRISE.joursMax ? maintenant.toISOString() : majLe, journal: journal.slice(-14) }, jours };
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class EntrepriseService {
  constructor(private readonly prisma: PrismaService) {}

  private transaction<T>(operation: (tx: Tx) => Promise<T>) {
    return this.prisma.$transaction(operation, { isolationLevel: 'Serializable', timeout: 10_000 });
  }

  /** L'entreprise à jour (journées rattrapées et enregistrées), ou rien. */
  private async aJour(tx: Tx, userId: string, maintenant: Date) {
    const e = await tx.entrepriseVirtuelle.findFirst({ where: { userId } });
    if (!e) return null;
    const r = rattraper(e.capitalVirtuel, e.reputationEntreprise, lireActivite(e.employes, maintenant), maintenant);
    if (r.jours > 0) await tx.entrepriseVirtuelle.update({ where: { id: e.id }, data: { capitalVirtuel: r.capital, reputationEntreprise: r.reputation, employes: r.activite as unknown as Prisma.InputJsonValue } });
    return { id: e.id, nom: e.nom, capital: r.capital, reputation: r.reputation, activite: r.activite };
  }

  private vue(e: NonNullable<Awaited<ReturnType<EntrepriseService['aJour']>>>) {
    const prevision = journeeEntreprise(e.capital, e.reputation, e.activite.equipe);
    return {
      nom: e.nom, capital: e.capital, reputation: e.reputation, equipe: e.activite.equipe.map(x => ({ ...x, ...POSTES_ENTREPRISE[x.poste] })),
      journal: e.activite.journal, prevision: { chiffre: prevision.chiffre, charges: prevision.charges, resultat: prevision.resultat },
      postes: POSTES.map(poste => ({ poste, ...POSTES_ENTREPRISE[poste] })),
    };
  }

  private async eligibilite(tx: Tx, userId: string) {
    const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { niveau: true, argentVirtuel: true, profilActuel: { select: { famille: true } } } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    const eligible = carriere.niveau >= REGLES_ENTREPRISE.niveauMin || carriere.profilActuel?.famille === 'ENTREPRENEUR';
    return { carriere, eligible };
  }

  async etat(userId: string) {
    return this.transaction(async tx => {
      const e = await this.aJour(tx, userId, new Date());
      if (e) return { entreprise: this.vue(e), eligible: true };
      const { eligible } = await this.eligibilite(tx, userId);
      return { entreprise: null, eligible, regles: REGLES_ENTREPRISE };
    });
  }

  async creer(userId: string, nom: string, apport: number) {
    const propre = nom.trim();
    if (!propre || propre.length > 60) throw new BadRequestException('Nom d’entreprise invalide (60 caractères au plus).');
    if (!Number.isInteger(apport) || apport < REGLES_ENTREPRISE.apportMin) throw new BadRequestException(`Apport minimum : ${REGLES_ENTREPRISE.apportMin.toLocaleString('fr-FR')} F.`);
    return this.transaction(async tx => {
      if (await tx.entrepriseVirtuelle.findFirst({ where: { userId }, select: { id: true } })) throw new ConflictException('Tu as déjà une entreprise.');
      const { carriere, eligible } = await this.eligibilite(tx, userId);
      if (!eligible) throw new BadRequestException(`Il faut le niveau ${REGLES_ENTREPRISE.niveauMin} (ou la filière entrepreneur) pour créer ton entreprise.`);
      if (carriere.argentVirtuel < apport) throw new BadRequestException('Solde insuffisant pour cet apport.');
      await tx.userCarriere.update({ where: { userId }, data: { argentVirtuel: { decrement: apport } } });
      const activite: Activite = { equipe: [], majLe: new Date().toISOString(), journal: [] };
      const e = await tx.entrepriseVirtuelle.create({ data: { userId, nom: propre, capitalVirtuel: apport, employes: activite as unknown as Prisma.InputJsonValue, reputationEntreprise: 50 } });
      return { entreprise: this.vue({ id: e.id, nom: e.nom, capital: apport, reputation: 50, activite }), eligible: true };
    });
  }

  /** Apport (montant positif : du compte vers le capital) ou dividende (négatif : du capital vers le compte). */
  async mouvement(userId: string, montant: number) {
    if (!Number.isInteger(montant) || montant === 0) throw new BadRequestException('Montant invalide');
    return this.transaction(async tx => {
      const e = await this.aJour(tx, userId, new Date());
      if (!e) throw new NotFoundException('Pas d’entreprise');
      const { carriere } = await this.eligibilite(tx, userId);
      if (montant > 0 && carriere.argentVirtuel < montant) throw new BadRequestException('Solde insuffisant pour cet apport.');
      if (montant < 0 && e.capital < -montant) throw new BadRequestException('Capital insuffisant pour ce dividende.');
      await tx.userCarriere.update({ where: { userId }, data: { argentVirtuel: { decrement: montant } } });
      await tx.entrepriseVirtuelle.update({ where: { id: e.id }, data: { capitalVirtuel: e.capital + montant } });
      return { entreprise: this.vue({ ...e, capital: e.capital + montant }), eligible: true };
    });
  }

  /** Embaucher : il faut de quoi payer le premier mois de salaire. */
  async embaucher(userId: string, poste: PosteEntreprise) {
    if (!POSTES.includes(poste)) throw new BadRequestException('Poste inconnu');
    const maintenant = new Date();
    return this.transaction(async tx => {
      const e = await this.aJour(tx, userId, maintenant);
      if (!e) throw new NotFoundException('Pas d’entreprise');
      if (e.activite.equipe.length >= REGLES_ENTREPRISE.equipeMax) throw new BadRequestException('Équipe complète.');
      if (e.capital < POSTES_ENTREPRISE[poste].salaireMensuel) throw new BadRequestException(`Il faut un mois de salaire en capital : ${POSTES_ENTREPRISE[poste].salaireMensuel.toLocaleString('fr-FR')} F.`);
      const recrue: Employe = { poste, nom: nomEmploye(e.activite.equipe.length + e.activite.journal.length), embaucheLe: maintenant.toISOString() };
      const activite: Activite = { ...e.activite, equipe: [...e.activite.equipe, recrue] };
      await tx.entrepriseVirtuelle.update({ where: { id: e.id }, data: { employes: activite as unknown as Prisma.InputJsonValue } });
      return { entreprise: this.vue({ ...e, activite }), eligible: true };
    });
  }

  /** Licencier : une indemnité d'un quart de salaire mensuel, payée par le capital. */
  async licencier(userId: string, rang: number) {
    return this.transaction(async tx => {
      const e = await this.aJour(tx, userId, new Date());
      if (!e) throw new NotFoundException('Pas d’entreprise');
      const employe = e.activite.equipe[rang];
      if (!Number.isInteger(rang) || !employe) throw new BadRequestException('Employé inconnu');
      const indemnite = Math.round(POSTES_ENTREPRISE[employe.poste].salaireMensuel / 4);
      const activite: Activite = { ...e.activite, equipe: e.activite.equipe.filter((_, i) => i !== rang) };
      const capital = Math.max(0, e.capital - indemnite);
      await tx.entrepriseVirtuelle.update({ where: { id: e.id }, data: { capitalVirtuel: capital, employes: activite as unknown as Prisma.InputJsonValue } });
      return { entreprise: this.vue({ ...e, capital, activite }), eligible: true };
    });
  }
}
