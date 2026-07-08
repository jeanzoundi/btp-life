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
      create: { userId, missionId, statut: 'EN_COURS' },
      update: { statut: 'EN_COURS' },
    });
  }

  async submit(userId: string, missionId: string, dto: SubmitMissionDto) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      include: { contenus: { orderBy: { ordre: 'asc' } } },
    });
    if (!mission) throw new NotFoundException('Mission introuvable');
    if (mission.contenus.length === 0) throw new BadRequestException('Mission sans contenu');

    const resultat = calculerScoreMission({
      contenus: mission.contenus,
      reponses: dto.reponses,
      scoreMax: mission.scoreMax,
      conditionReussite: mission.conditionReussite,
      dureeLimiteSec: mission.dureeLimiteSec,
      tempsUtiliseSec: dto.tempsUtiliseSec,
    });

    const existing = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    const userMission = await this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      create: {
        userId,
        missionId,
        statut: resultat.reussie ? 'REUSSIE' : 'ECHOUEE',
        score: resultat.score,
        tempsUtiliseSec: dto.tempsUtiliseSec,
        reponses: dto.reponses as Prisma.InputJsonValue,
        erreurs: resultat.items.filter((i) => !i.correct).map((i) => i.contenuId),
        tentatives: 1,
        meilleurScore: resultat.score,
        termineeLe: new Date(),
      },
      update: {
        statut: resultat.reussie ? 'REUSSIE' : 'ECHOUEE',
        score: resultat.score,
        tempsUtiliseSec: dto.tempsUtiliseSec,
        reponses: dto.reponses as Prisma.InputJsonValue,
        erreurs: resultat.items.filter((i) => !i.correct).map((i) => i.contenuId),
        tentatives: { increment: 1 },
        meilleurScore: Math.max(resultat.score, existing?.meilleurScore ?? 0),
        termineeLe: new Date(),
      },
    });

    // XP : la réussite paie plus, mais l'échec n'est jamais puni à zéro (pédagogie de l'échec).
    // L'état du personnage (énergie/moral/faim/social) module légèrement les gains — jamais en dessous de 70 %.
    const besoinsActuels = await this.besoins.actualiser(userId);
    const facteurBesoins = BesoinsService.facteurPerformance(besoinsActuels);
    const xpBase = resultat.reussie ? resultat.score * 2 : Math.round(resultat.score * 0.5);
    const xpGagne = Math.round(xpBase * facteurBesoins);
    const reputationDelta = resultat.reputationDelta + (resultat.reussie ? 2 : -1);
    const argentDelta = resultat.budgetDelta + (resultat.reussie ? 50 : 10);

    const carriereAvant = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { niveau: true } });
    await this.progression.appliquerDelta(userId, {
      xp: xpGagne,
      reputation: reputationDelta,
      argentVirtuel: argentDelta,
    });
    // Jouer une mission demande de la concentration : petit coût d'énergie et de faim.
    await this.besoins.consommer(userId, { energie: 3, faim: 2 });
    const carriereApres = await this.prisma.userCarriere.findUnique({ where: { userId }, select: { niveau: true } });

    let badgeObtenu: Awaited<ReturnType<ProgressionService['attribuerBadgeSiAbsent']>> | null = null;
    if (resultat.reussie && mission.badgeId) {
      badgeObtenu = await this.progression.attribuerBadgeSiAbsent(userId, mission.badgeId, missionId);
    }

    const competencesMaj: unknown[] = [];
    if (resultat.reussie && Array.isArray(mission.competences)) {
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
