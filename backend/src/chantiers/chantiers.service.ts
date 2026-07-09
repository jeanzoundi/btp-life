import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { BesoinsService } from '../carriere/besoins.service';
import { PnjService } from '../carriere/pnj.service';

// ─── Référentiel RH du simulateur ───
const POSTES: Record<string, { salaire: number; competenceBase: number }> = {
  'Manœuvre': { salaire: 8000, competenceBase: 40 },
  'Maçon': { salaire: 15000, competenceBase: 65 },
  'Ferrailleur': { salaire: 18000, competenceBase: 70 },
  'Coffreur': { salaire: 18000, competenceBase: 70 },
  "Chef d'équipe": { salaire: 28000, competenceBase: 85 },
};

const NOMS = ['Kouassi', 'Fatou', 'Ibrahim', 'Aya', 'Moussa', 'Adjoua', 'Salif', 'Awa', 'Yao', 'Mariam', 'Seydou', 'Akissi'];

const TAILLE_EQUIPE_MAX = 8;

// Les "grands chantiers" (zone industrielle du monde virtuel) demandent une vraie progression :
// petits chantiers d'abord, projets ambitieux ensuite — avec des seuils différents selon
// l'ambition du projet, et parfois un accès alternatif réservé à un poste précis (un pont, par
// exemple, reste accessible à un chef de chantier expérimenté ou un ingénieur structure même
// avant d'avoir atteint le niveau demandé aux autres joueurs).
export interface ConditionsChantier {
  niveauMin: number;
  /** Slugs de profil qui débloquent le chantier indépendamment du niveau (OU, pas ET). */
  postesAutorises?: string[];
}

export const CONDITIONS_CHANTIER: Record<string, ConditionsChantier> = {
  'amenagement-koumassi': { niveauMin: 4 },
  'villa-r1-marcory': { niveauMin: 5 },
  'route-abobo': { niveauMin: 5 },
  'pont-bassam': { niveauMin: 8, postesAutorises: ['chef-chantier', 'conducteur-travaux', 'ingenieur-structure'] },
  // Palier au-delà du plafond de promotion (niveau 9) : plus rien ne se débloque côté carrière,
  // mais les chantiers continuent de grandir jusqu'au niveau 20 pour donner un vrai objectif
  // à ceux qui rejouent des missions pour l'XP plutôt que pour une promotion.
  'assainissement-yopougon': { niveauMin: 10 },
  'groupe-scolaire-bouake': { niveauMin: 12 },
  'centre-sante-sanpedro': { niveauMin: 15 },
  'lotissement-anyama': { niveauMin: 18 },
  'complexe-industriel-sanpedro': {
    niveauMin: 20,
    postesAutorises: ['conducteur-travaux', 'ingenieur-structure', 'gerant'],
  },
};

export function conditionsChantierPour(slug: string): ConditionsChantier {
  return CONDITIONS_CHANTIER[slug] ?? { niveauMin: 1 };
}

export function chantierEstAccessible(slug: string, niveau: number, profilActuelSlug?: string | null): boolean {
  const conditions = conditionsChantierPour(slug);
  if (niveau >= conditions.niveauMin) return true;
  return !!profilActuelSlug && (conditions.postesAutorises?.includes(profilActuelSlug) ?? false);
}

// Apport personnel exigé pour démarrer un chantier : proportionnel à son ambition (niveauMin),
// pas à son budget (le budget du chantier est une caisse fictive à part, sans commune mesure
// avec l'argent personnel du joueur — voir argentVirtuel). Investir cet apport relie enfin la
// gestion de chantier à l'argent réellement gagné par le joueur, plutôt qu'un aller simple.
export function apportPersonnelRequis(niveauMin: number): number {
  return Math.max(300, niveauMin * 500);
}

interface Besoins {
  joursEstimes: number;
  equipeMin: number;
  materiaux: Record<string, number>;
}

interface Evenement {
  jour: number;
  type: string;
  texte: string;
}

function besoinsDe(phase: { besoins: unknown }): Besoins {
  const b = (phase.besoins ?? {}) as Partial<Besoins>;
  return {
    joursEstimes: b.joursEstimes ?? 5,
    equipeMin: b.equipeMin ?? 2,
    materiaux: b.materiaux ?? {},
  };
}

@Injectable()
export class ChantiersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly besoinsJoueur: BesoinsService,
    private readonly pnj: PnjService,
  ) {}

  mine(userId: string) {
    return this.prisma.userChantier.findMany({
      where: { userId },
      include: { chantier: { include: { phases: { orderBy: { ordre: 'asc' } } } }, ouvriers: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async detailMine(userId: string, userChantierId: string) {
    const userChantier = await this.prisma.userChantier.findFirst({
      where: { id: userChantierId, userId },
      include: {
        chantier: {
          include: { phases: { orderBy: { ordre: 'asc' }, include: { missions: true } }, ressources: true },
        },
        ouvriers: { orderBy: { poste: 'asc' } },
      },
    });
    if (!userChantier) throw new NotFoundException('Chantier introuvable');
    return { ...userChantier, postesDisponibles: POSTES, tailleEquipeMax: TAILLE_EQUIPE_MAX };
  }

  /** Chantiers disponibles, annotés du niveau requis et de l'éligibilité du joueur (zone industrielle). */
  async disponibles(userId: string) {
    const [chantiers, carriere] = await Promise.all([
      this.prisma.chantier.findMany({ where: { statut: 'DISPONIBLE' } }),
      this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } }),
    ]);
    const niveauJoueur = carriere?.niveau ?? 1;
    const profilSlug = carriere?.profilActuel?.slug ?? null;
    return chantiers.map((c) => {
      const conditions = conditionsChantierPour(c.slug);
      return {
        ...c,
        niveauRequis: conditions.niveauMin,
        posteAlternatif: conditions.postesAutorises?.length ? conditions.postesAutorises : undefined,
        verrouille: !chantierEstAccessible(c.slug, niveauJoueur, profilSlug),
        apportRequis: apportPersonnelRequis(conditions.niveauMin),
      };
    });
  }

  async demarrer(userId: string, chantierId: string) {
    const chantier = await this.prisma.chantier.findUnique({ where: { id: chantierId } });
    if (!chantier) throw new NotFoundException('Chantier introuvable');

    const conditions = conditionsChantierPour(chantier.slug);
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId }, include: { profilActuel: true } });
    const accessible = chantierEstAccessible(chantier.slug, carriere?.niveau ?? 1, carriere?.profilActuel?.slug);
    if (!accessible) {
      throw new BadRequestException(`Niveau ${conditions.niveauMin} requis pour ce chantier`);
    }

    const dejaEnCours = await this.prisma.userChantier.findFirst({
      where: { userId, chantierId, statut: 'en_cours' },
    });
    if (dejaEnCours) return dejaEnCours;

    // Démarrer exige un apport personnel (ta propre épargne, pas la caisse du chantier) —
    // ça relie enfin l'argent gagné en missions/chantiers à la gestion de chantier elle-même.
    const apport = apportPersonnelRequis(conditions.niveauMin);
    const argentDisponible = carriere?.argentVirtuel ?? 0;
    if (argentDisponible < apport) {
      throw new BadRequestException(
        `Apport personnel insuffisant : ${apport.toLocaleString('fr-FR')} F requis (solde ${argentDisponible.toLocaleString('fr-FR')} F)`,
      );
    }
    await this.progression.appliquerDelta(userId, { argentVirtuel: -apport });

    // Équipe de départ : un maçon et un manœuvre — le joueur recrute le reste.
    return this.prisma.userChantier.create({
      data: {
        userId,
        chantierId,
        statut: 'en_cours',
        phaseCourante: 0,
        budgetRestant: chantier.budget,
        joursRestants: chantier.delaiJours,
        stock: {},
        avancementPhases: {},
        evenementsLog: [
          {
            jour: 0,
            type: 'info',
            texte: `Ouverture du chantier — apport personnel investi : ${apport.toLocaleString('fr-FR')} F. Budget chantier ${chantier.budget.toLocaleString('fr-FR')} ${chantier.devise}, délai ${chantier.delaiJours} jours.`,
          },
        ] as unknown as Prisma.InputJsonValue,
        ouvriers: {
          create: [
            { nom: NOMS[Math.floor(Math.random() * NOMS.length)], poste: 'Maçon', competence: 65, salaireJournalier: POSTES['Maçon'].salaire },
            { nom: NOMS[Math.floor(Math.random() * NOMS.length)], poste: 'Manœuvre', competence: 40, salaireJournalier: POSTES['Manœuvre'].salaire },
          ],
        },
      },
      include: { ouvriers: true },
    });
  }

  /** Commande de matériaux : consomme le budget, alimente le stock (livraison immédiate en v1). */
  async commander(userId: string, userChantierId: string, ressourceId: string, quantite: number) {
    if (!quantite || quantite <= 0) throw new BadRequestException('Quantité invalide');
    const uc = await this.chantierEnCours(userId, userChantierId);

    const ressource = await this.prisma.chantierRessource.findFirst({
      where: { id: ressourceId, chantierId: uc.chantierId, type: 'MATERIAU' },
    });
    if (!ressource) throw new NotFoundException('Matériau introuvable pour ce chantier');

    const cout = Math.round(ressource.coutUnitaire * quantite);
    if (cout > uc.budgetRestant) {
      throw new BadRequestException(`Budget insuffisant : coût ${cout.toLocaleString('fr-FR')}, restant ${uc.budgetRestant.toLocaleString('fr-FR')}`);
    }

    const ref = ressource.ref as { nom?: string; unite?: string };
    const nom = ref.nom ?? 'materiau';
    const stock = { ...((uc.stock ?? {}) as Record<string, number>) };
    stock[nom] = (stock[nom] ?? 0) + quantite;

    return this.prisma.userChantier.update({
      where: { id: uc.id },
      data: {
        budgetRestant: { decrement: cout },
        stock: stock as Prisma.InputJsonValue,
        evenementsLog: this.ajouterEvenement(uc, {
          jour: this.jourCourant(uc),
          type: 'commande',
          texte: `Livraison : ${quantite} ${ref.unite ?? ''} de ${nom} (−${cout.toLocaleString('fr-FR')} F)`,
        }),
      },
      include: { ouvriers: true },
    });
  }

  /** Embauche d'un ouvrier à un poste du référentiel. */
  async embaucher(userId: string, userChantierId: string, poste: string) {
    const uc = await this.chantierEnCours(userId, userChantierId, { ouvriers: true });
    const infos = POSTES[poste];
    if (!infos) throw new BadRequestException(`Poste inconnu : ${poste}`);
    if (uc.ouvriers.length >= TAILLE_EQUIPE_MAX) {
      throw new BadRequestException(`Équipe complète (${TAILLE_EQUIPE_MAX} max) — licencie avant d'embaucher`);
    }

    const nomsPris = new Set(uc.ouvriers.map((o) => o.nom));
    const nomsLibres = NOMS.filter((n) => !nomsPris.has(n));
    const nom = nomsLibres.length ? nomsLibres[Math.floor(Math.random() * nomsLibres.length)] : `${NOMS[0]} ${uc.ouvriers.length}`;

    await this.prisma.ouvrierVirtuel.create({
      data: {
        userChantierId: uc.id,
        nom,
        poste,
        competence: infos.competenceBase + Math.floor(Math.random() * 15) - 5,
        salaireJournalier: infos.salaire,
        motivation: 80 + Math.floor(Math.random() * 15),
        rendement: 75 + Math.floor(Math.random() * 20),
      },
    });

    await this.prisma.userChantier.update({
      where: { id: uc.id },
      data: {
        evenementsLog: this.ajouterEvenement(uc, {
          jour: this.jourCourant(uc),
          type: 'rh',
          texte: `Embauche : ${nom}, ${poste} (${infos.salaire.toLocaleString('fr-FR')} F/jour)`,
        }),
      },
    });

    return this.detailMine(userId, userChantierId);
  }

  async licencier(userId: string, userChantierId: string, ouvrierId: string) {
    const uc = await this.chantierEnCours(userId, userChantierId, { ouvriers: true });
    const ouvrier = uc.ouvriers.find((o) => o.id === ouvrierId);
    if (!ouvrier) throw new NotFoundException('Ouvrier introuvable');

    await this.prisma.ouvrierVirtuel.delete({ where: { id: ouvrierId } });
    await this.prisma.userChantier.update({
      where: { id: uc.id },
      data: {
        // Licencier pèse sur le moral du reste de l'équipe.
        moralEquipe: Math.max(0, uc.moralEquipe - 5),
        evenementsLog: this.ajouterEvenement(uc, {
          jour: this.jourCourant(uc),
          type: 'rh',
          texte: `Départ : ${ouvrier.nom} (${ouvrier.poste}) quitte le chantier. L'équipe accuse le coup (moral −5).`,
        }),
      },
    });
    return this.detailMine(userId, userChantierId);
  }

  /** Bascule un ouvrier entre travail et repos (le repos récupère la fatigue, payé à moitié). */
  async basculerRepos(userId: string, userChantierId: string, ouvrierId: string) {
    const uc = await this.chantierEnCours(userId, userChantierId, { ouvriers: true });
    const ouvrier = uc.ouvriers.find((o) => o.id === ouvrierId);
    if (!ouvrier) throw new NotFoundException('Ouvrier introuvable');

    await this.prisma.ouvrierVirtuel.update({
      where: { id: ouvrierId },
      data: { statut: ouvrier.statut === 'actif' ? 'repos' : 'actif' },
    });
    return this.detailMine(userId, userChantierId);
  }

  /**
   * Cœur du simulateur : une journée de travail.
   * Consomme salaires + matériaux, produit de l'avancement selon la productivité
   * réelle de l'équipe, gère fatigue/moral/imprévus, clôt les phases puis le chantier.
   */
  async journee(userId: string, userChantierId: string) {
    const uc = await this.chantierEnCours(userId, userChantierId, { ouvriers: true, phases: true });
    const phases = uc.chantier.phases;
    const phase = phases[uc.phaseCourante];
    if (!phase) throw new BadRequestException('Toutes les phases sont terminées');

    const besoins = besoinsDe(phase);
    const actifs = uc.ouvriers.filter((o) => o.statut === 'actif');
    const reposants = uc.ouvriers.filter((o) => o.statut === 'repos');
    if (!actifs.length) throw new BadRequestException('Aucun ouvrier actif — embauche ou remets ton équipe au travail');

    const evenements: Evenement[] = [];
    const jour = this.jourCourant(uc) + 1;

    // 1. Salaires (repos payé à moitié)
    const salaires = actifs.reduce((s, o) => s + o.salaireJournalier, 0) + Math.round(reposants.reduce((s, o) => s + o.salaireJournalier, 0) / 2);
    if (salaires > uc.budgetRestant) {
      throw new BadRequestException(
        `Budget insuffisant pour payer la journée (${salaires.toLocaleString('fr-FR')} F de salaires). Licencie pour réduire la masse salariale, ou abandonne le chantier.`,
      );
    }

    // 2. Productivité de l'équipe active
    const forceEquipe = actifs.reduce((somme, o) => {
      const facteurFatigue = Math.max(0.3, 1 - o.fatigue / 140);
      const facteurMotivation = 0.6 + (o.motivation / 100) * 0.5;
      return somme + (o.competence / 70) * (o.rendement / 85) * facteurFatigue * facteurMotivation;
    }, 0);
    const facteurEffectif = Math.min(1.6, forceEquipe / besoins.equipeMin);
    let progressionJour = (100 / besoins.joursEstimes) * facteurEffectif;

    // 3. Matériaux consommés au prorata de l'avancement produit
    const stock = { ...((uc.stock ?? {}) as Record<string, number>) };
    let rupture = false;
    const partJour = progressionJour / 100;
    for (const [nom, total] of Object.entries(besoins.materiaux)) {
      const besoinJour = Math.ceil(total * partJour);
      if ((stock[nom] ?? 0) < besoinJour) {
        rupture = true;
        evenements.push({ jour, type: 'rupture', texte: `Rupture de stock : ${nom} (besoin ~${besoinJour}, en stock ${stock[nom] ?? 0}). Le travail tourne au ralenti.` });
      }
    }
    if (rupture) {
      progressionJour *= 0.25; // on bricole ce qu'on peut sans matériaux
    } else {
      for (const [nom, total] of Object.entries(besoins.materiaux)) {
        stock[nom] = Math.max(0, (stock[nom] ?? 0) - Math.ceil(total * partJour));
      }
    }

    // 4. Imprévu du jour (30 %)
    let deltaMoral = rupture ? -4 : 1;
    let deltaSecurite = 0;
    let deltaQualite = rupture ? -2 : 0;
    const tirage = Math.random();
    if (tirage < 0.08) {
      progressionJour *= 0.5;
      evenements.push({ jour, type: 'meteo', texte: 'Grosse pluie : le chantier tourne au ralenti toute la matinée.' });
    } else if (tirage < 0.14) {
      progressionJour *= 0.75;
      evenements.push({ jour, type: 'panne', texte: 'Panne de la bétonnière — réparation improvisée, un peu de temps perdu.' });
    } else if (tirage < 0.2) {
      deltaMoral += 4;
      evenements.push({ jour, type: 'visite', texte: 'Visite du client, impressionné par la tenue du chantier. L\'équipe bombe le torse (+moral).' });
    } else if (tirage < 0.26) {
      const fatigueMoyenne = actifs.reduce((s, o) => s + o.fatigue, 0) / actifs.length;
      if (fatigueMoyenne > 55) {
        deltaSecurite = -6;
        deltaMoral -= 3;
        evenements.push({ jour, type: 'securite', texte: 'Presque-accident : un ouvrier fatigué a glissé de l\'échafaudage. Plus de peur que de mal, mais la sécurité en prend un coup.' });
      } else {
        evenements.push({ jour, type: 'securite', texte: 'Quart d\'heure sécurité tenu ce matin — les bons réflexes sont là.' });
      }
    }

    // 5. Fatigue et motivation
    for (const o of actifs) {
      await this.prisma.ouvrierVirtuel.update({
        where: { id: o.id },
        data: {
          fatigue: Math.min(100, o.fatigue + 10 + Math.floor(Math.random() * 8)),
          motivation: Math.max(20, Math.min(100, o.motivation + (o.fatigue > 70 ? -4 : 1))),
        },
      });
      if (o.fatigue > 80) {
        evenements.push({ jour, type: 'rh', texte: `${o.nom} est épuisé (fatigue ${o.fatigue}) — pense au repos avant l'accident.` });
      }
    }
    for (const o of reposants) {
      await this.prisma.ouvrierVirtuel.update({
        where: { id: o.id },
        data: { fatigue: Math.max(0, o.fatigue - 40), motivation: Math.min(100, o.motivation + 5) },
      });
    }

    // Diriger une journée de chantier est prenant — coûte plus qu'une simple mission.
    await this.besoinsJoueur.consommer(userId, { energie: 8, faim: 6 });

    // 6. Avancement de la phase
    const avancements = { ...((uc.avancementPhases ?? {}) as Record<string, number>) };
    const cle = String(uc.phaseCourante);
    const avant = avancements[cle] ?? 0;
    const apres = Math.min(100, avant + progressionJour);
    avancements[cle] = Math.round(apres * 10) / 10;

    let phaseCourante = uc.phaseCourante;
    if (apres >= 100) {
      evenements.push({ jour, type: 'phase', texte: `Phase "${phase.nom}" terminée ! 🎉` });
      phaseCourante += 1;
    } else {
      evenements.push({
        jour,
        type: 'travail',
        texte: `Journée de travail : ${phase.nom} avance de ${Math.round(progressionJour)} % (${Math.round(apres)} %).`,
      });
    }

    // Avancement global pondéré par la durée estimée de chaque phase
    const totalJours = phases.reduce((s, p) => s + besoinsDe(p).joursEstimes, 0);
    const avancementGlobal = phases.reduce((s, p, i) => {
      const pct = i < phaseCourante ? 100 : (avancements[String(i)] ?? 0);
      return s + (pct / 100) * (besoinsDe(p).joursEstimes / totalJours);
    }, 0);

    const fini = phaseCourante >= phases.length;
    const joursRestants = uc.joursRestants - 1;

    const updated = await this.prisma.userChantier.update({
      where: { id: uc.id },
      data: {
        budgetRestant: { decrement: salaires },
        joursRestants,
        phaseCourante,
        stock: stock as Prisma.InputJsonValue,
        avancementPhases: avancements as Prisma.InputJsonValue,
        avancementPct: Math.round(avancementGlobal * 100),
        moralEquipe: Math.max(0, Math.min(100, uc.moralEquipe + deltaMoral)),
        securite: Math.max(0, Math.min(100, uc.securite + deltaSecurite)),
        qualite: Math.max(0, Math.min(100, uc.qualite + deltaQualite)),
        evenementsLog: this.ajouterEvenements(uc, evenements),
      },
    });

    if (fini) return this.livrer(userId, uc.id);
    if (joursRestants === 0) {
      await this.prisma.userChantier.update({
        where: { id: uc.id },
        data: {
          evenementsLog: this.ajouterEvenement(updated, { jour, type: 'delai', texte: '⚠ Délai contractuel atteint ! Chaque jour supplémentaire pénalisera la note finale.' }),
        },
      });
    }
    return this.detailMine(userId, userChantierId);
  }

  /** Abandon : le chantier se termine en échec (note D) — jamais de cul-de-sac. */
  async abandonner(userId: string, userChantierId: string) {
    const uc = await this.chantierEnCours(userId, userChantierId);

    const termine = await this.prisma.userChantier.update({
      where: { id: uc.id },
      data: {
        statut: 'termine',
        noteFinale: 'D',
        termineLe: new Date(),
        evenementsLog: this.ajouterEvenement(uc, {
          jour: this.jourCourant(uc),
          type: 'livraison',
          texte: '🏳 Chantier abandonné — le client récupère un ouvrage inachevé. Analyse le journal : budget, fatigue, stock… chaque échec enseigne.',
        }),
      },
      include: { chantier: true, ouvriers: true },
    });

    await this.progression.appliquerDelta(userId, { xp: 20, reputation: -5, argentVirtuel: 0 });
    await this.prisma.carriereHistorique.create({
      data: { userId, type: 'CHANTIER_LIVRE', details: { chantierId: uc.chantierId, note: 'D', abandon: true } },
    });
    await this.pnj.surChantierLivre(userId, uc.chantier.nom, 'D', uc.chantier.clientPnjId);

    return termine;
  }

  /** Livraison : note A-D sur qualité, sécurité, moral, budget et délai + récompenses. */
  private async livrer(userId: string, userChantierId: string) {
    const uc = await this.prisma.userChantier.findUniqueOrThrow({
      where: { id: userChantierId },
      include: { chantier: true },
    });

    const scoreBudget = Math.max(0, Math.min(100, (uc.budgetRestant / uc.chantier.budget) * 400)); // garder 25 % du budget = 100
    const scoreDelai = uc.joursRestants >= 0 ? 100 : Math.max(0, 100 + uc.joursRestants * 10); // -10 pts par jour de retard
    const score = uc.qualite * 0.3 + uc.securite * 0.25 + uc.moralEquipe * 0.1 + scoreBudget * 0.15 + scoreDelai * 0.2;
    const note = score >= 82 ? 'A' : score >= 65 ? 'B' : score >= 48 ? 'C' : 'D';

    const termine = await this.prisma.userChantier.update({
      where: { id: userChantierId },
      data: {
        statut: 'termine',
        avancementPct: 100,
        noteFinale: note,
        termineLe: new Date(),
        evenementsLog: this.ajouterEvenement(uc, {
          jour: this.jourCourant(uc),
          type: 'livraison',
          texte: `🏁 Chantier livré — note ${note} (qualité ${uc.qualite}, sécurité ${uc.securite}, budget restant ${uc.budgetRestant.toLocaleString('fr-FR')} F, ${uc.joursRestants >= 0 ? `${uc.joursRestants} j d'avance` : `${-uc.joursRestants} j de retard`}).`,
        }),
      },
      include: { chantier: true, ouvriers: true },
    });

    await this.progression.appliquerDelta(userId, {
      xp: note === 'A' ? 400 : note === 'B' ? 250 : note === 'C' ? 120 : 50,
      reputation: note === 'A' ? 10 : note === 'B' ? 5 : note === 'C' ? 0 : -5,
      argentVirtuel: (note === 'A' ? 800 : note === 'B' ? 500 : note === 'C' ? 200 : 0) + Math.round(uc.budgetRestant / 1000),
    });

    await this.prisma.carriereHistorique.create({
      data: { userId, type: 'CHANTIER_LIVRE', details: { chantierId: uc.chantierId, note } },
    });
    await this.pnj.surChantierLivre(userId, uc.chantier.nom, note, uc.chantier.clientPnjId);

    return termine;
  }

  // ─── Helpers ───

  private async chantierEnCours(userId: string, userChantierId: string, include?: { ouvriers?: boolean; phases?: boolean }) {
    const uc = await this.prisma.userChantier.findFirst({
      where: { id: userChantierId, userId },
      include: {
        ouvriers: include?.ouvriers ?? false,
        chantier: include?.phases ? { include: { phases: { orderBy: { ordre: 'asc' } } } } : true,
      },
    });
    if (!uc) throw new NotFoundException('Chantier introuvable');
    if (uc.statut !== 'en_cours') throw new BadRequestException('Ce chantier est terminé');
    return uc as typeof uc & { ouvriers: Array<{ id: string; nom: string; poste: string; competence: number; fatigue: number; motivation: number; rendement: number; salaireJournalier: number; statut: string }>; chantier: { phases: Array<{ nom: string; besoins: unknown }> } & { budget: number; devise: string } };
  }

  private jourCourant(uc: { evenementsLog: unknown }): number {
    const log = (uc.evenementsLog ?? []) as Evenement[];
    return log.reduce((max, e) => Math.max(max, e.jour ?? 0), 0);
  }

  private ajouterEvenement(uc: { evenementsLog: unknown }, evenement: Evenement): Prisma.InputJsonValue {
    return this.ajouterEvenements(uc, [evenement]);
  }

  private ajouterEvenements(uc: { evenementsLog: unknown }, nouveaux: Evenement[]): Prisma.InputJsonValue {
    const log = [...(((uc.evenementsLog ?? []) as Evenement[])), ...nouveaux];
    return log.slice(-40) as unknown as Prisma.InputJsonValue;
  }
}
