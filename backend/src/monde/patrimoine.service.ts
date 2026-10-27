import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from '../carriere/besoins.service';
import { ProgressionService } from '../carriere/progression.service';
import { facteurEnergieTravail, facteurPrix, lireTraits } from '../carriere/traits';
import {
  confortLogement, coutMateriaux, ENERGIE_JOURNEE_TRAVAUX, ESSAIS_METRE, facteurFatigueOutils, INTERVALLE_JOURNEE_TRAVAUX_MS, LOGEMENTS, lirePatrimoine, NIVEAUX_LOGEMENT, OUTILS,
  reglerLoyer, RENOVATIONS, SEMAINE_MS, type NiveauLogement, type Patrimoine,
} from '../carriere/patrimoine';

// Le logement, l'outillage et les travaux du joueur. Le loyer se prélève paresseusement à la lecture (comme les besoins et
// l'épargne) : chaque semaine écoulée est payée si le solde suffit, sinon elle s'ajoute aux arriérés, qui pèsent sur le moral.
// Les travaux chez soi suivent le Grand chantier en petit : métré, commande au dépôt, puis une journée de travaux par
// journée du monde ; finis, ils rendent le logement plus confortable.

/** Moral perdu quand un loyer reste impayé alors que des arriérés courent déjà : le premier impayé est pardonné. */
export const MORAL_LOYER_IMPAYE = 10;

@Injectable()
export class PatrimoineService {
  private readonly logger = new Logger(PatrimoineService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly besoins: BesoinsService,
    private readonly progression: ProgressionService,
  ) {}

  /** Lit, règle le loyer échu et enregistre, dans la transaction donnée. */
  private async regle(tx: Prisma.TransactionClient, userId: string, maintenant: Date) {
    const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { patrimoine: true, argentVirtuel: true, moral: true } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    const avant = lirePatrimoine(carriere.patrimoine, maintenant);
    const r = reglerLoyer(avant, carriere.argentVirtuel, maintenant);
    const neuf = carriere.patrimoine === null || r.preleve > 0 || r.impaye > 0;
    if (neuf) {
      await tx.userCarriere.update({ where: { userId }, data: {
        patrimoine: r.patrimoine as unknown as Prisma.InputJsonValue, argentVirtuel: r.argent,
        ...(r.impaye > 0 && avant.logement.arrieres > 0 ? { moral: Math.max(0, carriere.moral - MORAL_LOYER_IMPAYE) } : {}),
      } });
    }
    return { patrimoine: r.patrimoine, argent: r.argent, preleve: r.preleve, impaye: r.impaye };
  }

  private transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(operation, { isolationLevel: 'Serializable', timeout: 10_000 });
  }

  private vue(p: Patrimoine, argent: number, mouvement: { preleve: number; impaye: number }) {
    const logement = LOGEMENTS[p.logement.niveau];
    return {
      argent,
      logement: { niveau: p.logement.niveau, ...logement, payeJusquau: p.logement.payeJusquau, arrieres: p.logement.arrieres, confortTotal: confortLogement(p) },
      logements: NIVEAUX_LOGEMENT.map(niveau => ({ niveau, ...LOGEMENTS[niveau] })),
      outils: Object.entries(OUTILS).map(([slug, o]) => ({ slug, ...o, possede: p.outils.includes(slug) })),
      renovations: Object.entries(RENOVATIONS).filter(([, r]) => r.logements.includes(p.logement.niveau)).map(([slug, r]) => ({
        slug, nom: r.nom, description: r.description, confort: r.confort, journees: r.journees, cout: coutMateriaux(r),
        faite: p.renovations.some(x => x.slug === slug && x.logement === p.logement.niveau),
      })),
      chantier: this.vueChantier(p),
      ...mouvement,
    };
  }

  /** Le chantier en cours chez le joueur : la réponse du métré n'est jamais envoyée avant qu'il soit validé. */
  private vueChantier(p: Patrimoine) {
    const c = p.chantier;
    if (!c) return null;
    const r = RENOVATIONS[c.slug];
    const metreFait = c.etape !== 'metre';
    return {
      slug: c.slug, nom: r.nom, etape: c.etape, journees: c.journees, journeesTotal: r.journees, confort: r.confort,
      essaisRestants: Math.max(0, ESSAIS_METRE - c.essais),
      metre: { question: r.metre.question, cotes: r.metre.cotes, unite: r.metre.unite, ...(metreFait ? { reponse: r.metre.reponse, explication: r.metre.explication } : {}) },
      devis: metreFait ? { materiaux: r.materiaux, total: coutMateriaux(r) } : null,
      prochaineJourneeLe: c.derniereJourneeLe ? new Date(Date.parse(c.derniereJourneeLe) + INTERVALLE_JOURNEE_TRAVAUX_MS).toISOString() : null,
    };
  }

  async etat(userId: string) {
    const maintenant = new Date();
    const r = await this.transaction(tx => this.regle(tx, userId, maintenant));
    return this.vue(r.patrimoine, r.argent, r);
  }

  /** Déménager : frais d'agence (une semaine du nouveau loyer) et première semaine payés d'avance, arriérés réglés avant. */
  async demenager(userId: string, niveau: NiveauLogement) {
    if (!NIVEAUX_LOGEMENT.includes(niveau)) throw new BadRequestException('Logement inconnu');
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      if (patrimoine.logement.arrieres > 0) throw new BadRequestException('Règle d’abord tes arriérés de loyer.');
      if (patrimoine.logement.niveau === niveau) throw new ConflictException('Tu habites déjà ce logement.');
      if (patrimoine.chantier) throw new BadRequestException('Termine ou abandonne d’abord les travaux en cours chez toi.');
      const cout = 2 * LOGEMENTS[niveau].loyerSemaine;
      if (argent < cout) throw new BadRequestException(`Pas assez d’argent pour déménager : ${cout.toLocaleString('fr-FR')} F (frais d’agence et première semaine).`);
      const suivant: Patrimoine = { ...patrimoine, logement: { niveau, payeJusquau: new Date(maintenant.getTime() + SEMAINE_MS).toISOString(), arrieres: 0 } };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue, argentVirtuel: argent - cout } });
      return { patrimoine: suivant, argent: argent - cout };
    });
    return this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 });
  }

  /** Régler tous les arriérés d'un coup. */
  async payerArrieres(userId: string) {
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      const du = patrimoine.logement.arrieres;
      if (!du) throw new ConflictException('Aucun arriéré à régler.');
      if (argent < du) throw new BadRequestException(`Pas assez d’argent : ${du.toLocaleString('fr-FR')} F d’arriérés.`);
      const suivant: Patrimoine = { ...patrimoine, logement: { ...patrimoine.logement, arrieres: 0 } };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue, argentVirtuel: argent - du } });
      return { patrimoine: suivant, argent: argent - du };
    });
    return this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 });
  }

  /** Acheter un outil : une fois, payé comptant. */
  async acheterOutil(userId: string, slug: string) {
    const outil = Object.prototype.hasOwnProperty.call(OUTILS, slug) ? OUTILS[slug] : undefined;
    if (!outil) throw new BadRequestException('Outil inconnu');
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      if (patrimoine.outils.includes(slug)) throw new ConflictException('Tu as déjà cet outil.');
      if (argent < outil.prix) throw new BadRequestException(`Pas assez d’argent : ${outil.prix.toLocaleString('fr-FR')} F.`);
      const suivant: Patrimoine = { ...patrimoine, outils: [...patrimoine.outils, slug] };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue, argentVirtuel: argent - outil.prix } });
      return { patrimoine: suivant, argent: argent - outil.prix };
    });
    return this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 });
  }

  /** Lancer des travaux chez soi : un chantier à la fois, prévu pour ce logement et pas encore fait. */
  async commencerRenovation(userId: string, slug: string) {
    const renovation = Object.prototype.hasOwnProperty.call(RENOVATIONS, slug) ? RENOVATIONS[slug] : undefined;
    if (!renovation) throw new BadRequestException('Travaux inconnus');
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      if (patrimoine.chantier) throw new ConflictException('Des travaux sont déjà en cours chez toi.');
      if (!renovation.logements.includes(patrimoine.logement.niveau)) throw new BadRequestException('Ces travaux ne se font pas dans ton logement actuel.');
      if (patrimoine.renovations.some(x => x.slug === slug && x.logement === patrimoine.logement.niveau)) throw new ConflictException('Ces travaux sont déjà faits chez toi.');
      const suivant: Patrimoine = { ...patrimoine, chantier: { slug, logement: patrimoine.logement.niveau, etape: 'metre', essais: 0, journees: 0, derniereJourneeLe: null } };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue } });
      return { patrimoine: suivant, argent };
    });
    return this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 });
  }

  /** Le métré : juste (à la tolérance près), il ouvre le devis ; après trois essais faux, la correction est donnée. */
  async metrer(userId: string, reponse: number) {
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      const c = patrimoine.chantier;
      if (!c || c.etape !== 'metre') throw new BadRequestException('Aucun métré à faire pour l’instant.');
      const { metre } = RENOVATIONS[c.slug];
      const juste = Number.isFinite(reponse) && Math.abs(reponse - metre.reponse) <= metre.tolerance;
      const essais = c.essais + 1;
      const passe = juste || essais >= ESSAIS_METRE;
      const suivant: Patrimoine = { ...patrimoine, chantier: { ...c, essais, etape: passe ? 'materiaux' : 'metre' } };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue } });
      return { patrimoine: suivant, argent, juste };
    });
    return { ...this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 }), juste: r.juste };
  }

  /** La commande au dépôt, au devis du métré (l'économe y gagne comme ailleurs). */
  async acheterMateriaux(userId: string) {
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      const c = patrimoine.chantier;
      if (!c || c.etape !== 'materiaux') throw new BadRequestException('Le métré doit être fait avant de commander.');
      const traits = (await tx.userCarriere.findUnique({ where: { userId }, select: { traits: true } }))?.traits;
      const cout = Math.round(coutMateriaux(RENOVATIONS[c.slug]) * facteurPrix(lireTraits(traits)));
      if (argent < cout) throw new BadRequestException(`Pas assez d’argent : ${cout.toLocaleString('fr-FR')} F de matériaux.`);
      const suivant: Patrimoine = { ...patrimoine, chantier: { ...c, etape: 'travaux' } };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue, argentVirtuel: argent - cout } });
      return { patrimoine: suivant, argent: argent - cout };
    });
    return this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 });
  }

  /** Une journée de travaux chez soi : une par journée du monde, au prix de l'énergie ; la dernière livre les travaux. */
  async journeeTravaux(userId: string) {
    const besoins = await this.besoins.actualiser(userId);
    if (besoins.energie < ENERGIE_JOURNEE_TRAVAUX) throw new BadRequestException('Trop fatigué pour une journée de travaux : repose-toi d’abord.');
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      const c = patrimoine.chantier;
      if (!c || c.etape !== 'travaux') throw new BadRequestException('Rien à faire chez toi : métré et matériaux d’abord.');
      if (c.derniereJourneeLe && maintenant.getTime() - Date.parse(c.derniereJourneeLe) < INTERVALLE_JOURNEE_TRAVAUX_MS) {
        throw new BadRequestException('Une journée de travaux par journée du monde : reviens demain.');
      }
      const renovation = RENOVATIONS[c.slug];
      const carriere = await tx.userCarriere.findUnique({ where: { userId }, select: { energie: true, traits: true } });
      if (!carriere) throw new NotFoundException('Carrière introuvable');
      if (carriere.energie < ENERGIE_JOURNEE_TRAVAUX) throw new BadRequestException('Trop fatigué pour les travaux.');
      const fatigue = Math.round(ENERGIE_JOURNEE_TRAVAUX * facteurEnergieTravail(lireTraits(carriere.traits)) * facteurFatigueOutils(patrimoine.outils));
      const journees = c.journees + 1;
      const termine = journees >= renovation.journees;
      const suivant: Patrimoine = termine
        ? { ...patrimoine, chantier: null, renovations: [...patrimoine.renovations, { slug: c.slug, logement: c.logement }] }
        : { ...patrimoine, chantier: { ...c, journees, derniereJourneeLe: maintenant.toISOString() } };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue, energie: Math.max(0, carriere.energie - fatigue) } });
      if (!termine) return { patrimoine: suivant, argent, termine, niveaux: null };
      const avant = await tx.userCarriere.findUnique({ where: { userId }, select: { niveau: true } });
      const apres = await this.progression.appliquerDelta(userId, { xp: renovation.xp }, tx);
      return { patrimoine: suivant, argent, termine, niveaux: avant && apres ? { avant: avant.niveau, apres: apres.niveau } : null };
    });
    if (r.niveaux) {
      try { await this.progression.notifierNiveau(userId, r.niveaux.avant, r.niveaux.apres); }
      catch { this.logger.warn('Notification indisponible après livraison des travaux'); }
    }
    return { ...this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 }), termine: r.termine };
  }

  /** Abandonner les travaux en cours (les matériaux achetés sont perdus). */
  async abandonnerRenovation(userId: string) {
    const maintenant = new Date();
    const r = await this.transaction(async tx => {
      const { patrimoine, argent } = await this.regle(tx, userId, maintenant);
      if (!patrimoine.chantier) throw new ConflictException('Aucuns travaux en cours.');
      const suivant: Patrimoine = { ...patrimoine, chantier: null };
      await tx.userCarriere.update({ where: { userId }, data: { patrimoine: suivant as unknown as Prisma.InputJsonValue } });
      return { patrimoine: suivant, argent };
    });
    return this.vue(r.patrimoine, r.argent, { preleve: 0, impaye: 0 });
  }
}
