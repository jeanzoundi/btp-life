import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { BesoinsService } from '../carriere/besoins.service';
import { PnjService } from '../carriere/pnj.service';
import { SubmitMissionDto } from './dto/submit-mission.dto';
import { calculerScoreMission } from './mission-scoring';

@Injectable()
export class MissionsService {
  /**
   * Part de l'XP conservée quand on rejoue une mission déjà réussie (« entraînement »).
   *
   * Le contenu du jeu est fini (~21 500 XP en tout premier passage) alors que la courbe de niveau
   * vise le niveau 100 (~2,46 M XP). Sans rejeu payant, la progression butait sur un plafond dur
   * au niveau 12. Ce taux rouvre la progression sans casser l'anti-farm : le rejeu ne rapporte
   * QUE de l'XP — jamais d'argent, de réputation, de badge ni de compétence — et coûte de
   * l'énergie, donc il n'est ni gratuit ni automatisable à l'infini.
   */
  static readonly TAUX_ENTRAINEMENT = 0.25;

  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly besoins: BesoinsService,
    private readonly pnj: PnjService,
  ) {}

  async disponibles(userId: string, query: { type?: string; niveauMax?: string }) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    const niveau = carriere?.niveau ?? 1;

    const missions = await this.prisma.mission.findMany({
      where: {
        statut: 'PUBLIE',
        niveauRequis: { lte: query.niveauMax ? Number(query.niveauMax) : niveau },
        ...(query.type ? { type: query.type as never } : {}),
      },
      orderBy: { niveauRequis: 'asc' },
    });

    const userMissions = await this.prisma.userMission.findMany({ where: { userId } });
    const statutParMission = new Map(userMissions.map((um) => [um.missionId, um]));

    return missions.map((mission) => ({
      ...mission,
      userStatut: statutParMission.get(mission.id)?.statut ?? 'DISPONIBLE',
      meilleurScore: statutParMission.get(mission.id)?.meilleurScore ?? null,
      verrouillee: mission.niveauRequis > niveau,
    }));
  }

  async detail(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { contenus: { orderBy: { ordre: 'asc' } }, chantier: true, badge: true },
    });
    if (!mission) throw new NotFoundException('Mission introuvable');

    // On ne renvoie jamais les bonnes réponses / correction avant soumission.
    const contenusPublics = mission.contenus.map(({ bonnesReponses: _br, correctionPedagogique: _cp, ...rest }) => rest);

    const userMission = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    return { ...mission, contenus: contenusPublics, userMission };
  }

  async start(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission || mission.statut !== 'PUBLIE') throw new NotFoundException('Mission introuvable');

    return this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      create: { userId, missionId, statut: 'EN_COURS', demarreeLe: new Date() },
      update: { statut: 'EN_COURS', demarreeLe: new Date() },
    });
  }

  /**
   * Temps de réalisation retenu pour le bonus chrono, résistant à la triche.
   *
   * - Si le serveur a horodaté le démarrage (/start), c'est LUI qui fait foi : le client ne peut
   *   pas prétendre avoir répondu instantanément.
   * - Sinon (mission jouée hors ligne, /start jamais arrivé), on accepte la valeur du client mais
   *   avec un plancher : nul ne répond à une question en moins de PLANCHER_SEC_PAR_QUESTION.
   */
  private tempsUtiliseFiable(
    tempsClient: number | null | undefined,
    demarreeLe: Date | null,
    nbQuestions: number,
  ): number {
    const PLANCHER_SEC_PAR_QUESTION = 3;
    const plancher = nbQuestions * PLANCHER_SEC_PAR_QUESTION;

    if (demarreeLe) {
      const ecouleServeur = Math.round((Date.now() - demarreeLe.getTime()) / 1000);
      return Math.max(0, ecouleServeur);
    }

    const client = typeof tempsClient === 'number' && Number.isFinite(tempsClient) ? Math.max(0, Math.round(tempsClient)) : plancher;
    return Math.max(plancher, client);
  }

  async submit(userId: string, missionId: string, dto: SubmitMissionDto) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { contenus: { orderBy: { ordre: 'asc' } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable');
    if (mission.contenus.length === 0) throw new BadRequestException('Mission sans contenu');

    const existing = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    // Anti-triche chrono : le temps annoncé par le client n'est jamais cru sur parole (sinon on
    // enverrait tempsUtiliseSec: 0 pour empocher le bonus maximal à chaque fois). Quand le /start
    // a bien eu lieu, le serveur mesure lui-même la durée écoulée. Sinon (mission jouée hors ligne,
    // le /start n'ayant pas pu aboutir), on retombe sur la valeur client mais plancher compris :
    // un humain ne répond pas à une question en moins de quelques secondes.
    const tempsUtiliseSec = this.tempsUtiliseFiable(
      dto.tempsUtiliseSec,
      existing?.demarreeLe ?? null,
      mission.contenus.length,
    );

    const resultat = calculerScoreMission({
      contenus: mission.contenus,
      reponses: dto.reponses,
      scoreMax: mission.scoreMax,
      conditionReussite: mission.conditionReussite,
      dureeLimiteSec: mission.dureeLimiteSec,
      tempsUtiliseSec,
    });

    // Anti-triche : une mission déjà réussie peut être rejouée pour améliorer sa note, mais le rejeu
    // ne rapporte plus rien (XP/argent/réputation/badge/compétences). Sinon on farmerait des missions
    // faciles à l'infini. Seul le meilleur score reste mis à jour (fierté / classement).
    const dejaReussie = existing?.statut === 'REUSSIE';

    const userMission = await this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      create: {
        userId,
        missionId,
        statut: resultat.reussie ? 'REUSSIE' : 'ECHOUEE',
        score: resultat.score,
        tempsUtiliseSec,
        reponses: dto.reponses as Prisma.InputJsonValue,
        erreurs: resultat.items.filter((i) => !i.correct).map((i) => i.contenuId),
        tentatives: 1,
        meilleurScore: resultat.score,
        termineeLe: new Date(),
      },
      update: {
        statut: resultat.reussie ? 'REUSSIE' : 'ECHOUEE',
        score: resultat.score,
        tempsUtiliseSec,
        reponses: dto.reponses as Prisma.InputJsonValue,
        erreurs: resultat.items.filter((i) => !i.correct).map((i) => i.contenuId),
        tentatives: { increment: 1 },
        meilleurScore: Math.max(resultat.score, existing?.meilleurScore ?? 0),
        termineeLe: new Date(),
      },
    });

    // XP : la réussite paie plus, mais l'échec n'est jamais puni à zéro (pédagogie de l'échec).
    // L'état du personnage (énergie/moral/faim/social) module légèrement les gains — jamais en dessous de 70 %.
    //
    // Rejeu d'une mission déjà réussie = « entraînement » : il rapporte une fraction de l'XP
    // (TAUX_ENTRAINEMENT), mais jamais d'argent, de réputation, de badge ni de compétence. Sans
    // cette soupape, le contenu du jeu (fini) plafonnait la progression au niveau 12 alors que la
    // courbe et les missions vont jusqu'à 100 : plus aucun joueur assidu ne pouvait avancer.
    // L'économie reste protégée (pas de farm d'argent/réputation), seul le temps investi paie.
    const besoinsActuels = await this.besoins.actualiser(userId);
    const facteurBesoins = BesoinsService.facteurPerformance(besoinsActuels);
    const xpBase = resultat.reussie ? resultat.score * 2 : Math.round(resultat.score * 0.5);
    const xpPlein = Math.round(xpBase * facteurBesoins);
    const xpGagne = dejaReussie ? Math.round(xpPlein * MissionsService.TAUX_ENTRAINEMENT) : xpPlein;
    const reputationDelta = dejaReussie ? 0 : resultat.reputationDelta + (resultat.reussie ? 2 : -1);
    // Montants x10 par rapport à l'origine pour rester proportionnels aux budgets de chantier
    // (en millions) — voir CONDITIONS_CHANTIER/apportPersonnelRequis dans chantiers.service.ts.
    const argentDelta = dejaReussie ? 0 : resultat.budgetDelta + (resultat.reussie ? 500 : 100);

    const carriereAvant = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { niveau: true } });
    if (!dejaReussie || xpGagne > 0) {
      await this.progression.appliquerDelta(userId, {
        xp: xpGagne,
        reputation: reputationDelta,
        argentVirtuel: argentDelta,
      });
      // Jouer une mission demande de la concentration : petit coût d'énergie et de faim.
      // Le rejeu coûte aussi — sinon l'entraînement serait gratuit et se ferait en boucle sans fin.
      await this.besoins.consommer(userId, { energie: 3, faim: 2 });
    }
    const carriereApres = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { niveau: true } });

    let badgeObtenu: Awaited<ReturnType<ProgressionService['attribuerBadgeSiAbsent']>> | null = null;
    if (resultat.reussie && !dejaReussie && mission.badgeId) {
      badgeObtenu = await this.progression.attribuerBadgeSiAbsent(userId, mission.badgeId, missionId);
    }

    const competencesMaj: unknown[] = [];
    if (resultat.reussie && !dejaReussie && Array.isArray(mission.competences)) {
      for (const competenceId of mission.competences as string[]) {
        const maj = await this.progression.validerCompetence(userId, competenceId, resultat.score, 'mission');
        competencesMaj.push(maj);
      }
    }

    // Le PNJ hiérarchique du joueur réagit aux moments qui comptent — première réussite,
    // premier échec, montée de niveau — pas à chaque tentative, pour ne jamais spammer.
    // `existing` peut déjà exister avec le statut EN_COURS (posé par /start avant chaque
    // mission) : on se base sur `termineeLe`, qui ne se remplit qu'à une vraie soumission.
    if (resultat.reussie && existing?.statut !== 'REUSSIE') {
      await this.pnj.surMissionReussie(userId, mission.titre);
    } else if (!resultat.reussie && !existing?.termineeLe) {
      await this.pnj.surMissionEchouee(userId, mission.titre);
    }
    if ((carriereApres?.niveau ?? 1) > (carriereAvant?.niveau ?? 1)) {
      await this.pnj.surNiveauSuperieur(userId, carriereApres?.niveau ?? 1);
    }

    const correction = mission.contenus.map((contenu) => ({
      contenuId: contenu.id,
      correctionPedagogique: contenu.correctionPedagogique,
      bonnesReponses: contenu.bonnesReponses,
      resultat: resultat.items.find((i) => i.contenuId === contenu.id),
    }));

    return {
      userMission,
      score: resultat.score,
      scoreMax: mission.scoreMax,
      reussie: resultat.reussie,
      rejeuSansRecompense: dejaReussie,
      bonusChrono: resultat.bonusChrono,
      securiteEchec: resultat.securiteEchec,
      xpGagne,
      facteurBesoins,
      reputationDelta,
      argentDelta,
      niveauAvant: carriereAvant?.niveau ?? 1,
      niveauApres: carriereApres?.niveau ?? 1,
      badgeObtenu,
      competencesMaj,
      correction,
    };
  }
}
