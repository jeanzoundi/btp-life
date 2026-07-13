import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MissionsService } from './missions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { BesoinsService } from '../carriere/besoins.service';
import { PnjService } from '../carriere/pnj.service';

const BESOINS_PLEINS = { energie: 100, moral: 100, faim: 100, social: 100 };

function missionQuiz(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mission-1',
    titre: 'Sécurité chantier',
    badgeId: null,
    competences: [] as string[],
    scoreMax: 100,
    conditionReussite: 60,
    dureeLimiteSec: null,
    contenus: [
      {
        id: 'c1',
        typeQuestion: 'QCM',
        options: [{ id: 'a', label: 'Bonne réponse' }, { id: 'b', label: 'Mauvaise réponse' }],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La bonne réponse est a.',
      },
    ],
    ...overrides,
  };
}

function missionDecision(overrides: Record<string, unknown> = {}) {
  return missionQuiz({
    contenus: [
      {
        id: 'c1',
        typeQuestion: 'CHOIX_CONSEQUENCE',
        options: [
          { id: 'risque', label: 'Continuer sans sécuriser', points: 20, consequences: { reputation: -5, budget: -200000 } },
          { id: 'stop', label: 'Sécuriser la zone', points: 100, consequences: { reputation: 3, budget: -1000 } },
        ],
        bonnesReponses: 'stop',
        correctionPedagogique: 'Sécuriser la zone est le bon réflexe.',
      },
    ],
    ...overrides,
  });
}

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    mission: { findUnique: jest.fn().mockResolvedValue(missionQuiz()) },
    userMission: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockImplementation(({ create, update }: { create: object; update: object }) =>
        Promise.resolve({ id: 'um1', ...(create ?? update) }),
      ),
    },
    userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 1 }) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of Object.keys(defaut)) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const progression = {
    appliquerDelta: jest.fn().mockResolvedValue({}),
    attribuerBadgeSiAbsent: jest.fn().mockResolvedValue({ id: 'badge-attr-1' }),
    validerCompetence: jest.fn().mockResolvedValue({ niveauActuel: 1 }),
  };
  const besoins = {
    actualiser: jest.fn().mockResolvedValue(BESOINS_PLEINS),
    consommer: jest.fn().mockResolvedValue({}),
  };
  const pnj = {
    surMissionReussie: jest.fn().mockResolvedValue(undefined),
    surMissionEchouee: jest.fn().mockResolvedValue(undefined),
    surNiveauSuperieur: jest.fn().mockResolvedValue(undefined),
  };

  const module = await Test.createTestingModule({
    providers: [
      MissionsService,
      { provide: PrismaService, useValue: prisma },
      { provide: ProgressionService, useValue: progression },
      { provide: BesoinsService, useValue: besoins },
      { provide: PnjService, useValue: pnj },
    ],
  }).compile();
  return { svc: module.get(MissionsService), prisma, progression, besoins, pnj };
}

describe('MissionsService.submit', () => {
  it("échoue proprement si la mission n'existe pas", async () => {
    const prisma = fakePrisma({ mission: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.submit('u1', 'inconnue', { reponses: {} })).rejects.toThrow(NotFoundException);
  });

  it('échoue proprement si la mission ne contient aucun contenu', async () => {
    const prisma = fakePrisma({ mission: { findUnique: jest.fn().mockResolvedValue(missionQuiz({ contenus: [] })) } });
    const { svc } = await service(prisma);
    await expect(svc.submit('u1', 'mission-1', { reponses: {} })).rejects.toThrow(BadRequestException);
  });

  it('une réussite paie double xp, +500 F et +2 de réputation, avec les besoins au maximum', async () => {
    const prisma = fakePrisma();
    const { svc, progression, besoins, pnj } = await service(prisma);

    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: ['a'] } });

    expect(resultat.reussie).toBe(true);
    expect(resultat.score).toBe(100);
    expect(resultat.facteurBesoins).toBe(1);
    expect(resultat.xpGagne).toBe(200); // score(100) * 2 * facteur(1)
    expect(resultat.reputationDelta).toBe(2); // 0 (pas de conséquence) + 2 (bonus réussite)
    expect(resultat.argentDelta).toBe(500); // 0 (pas de conséquence) + 500 (bonus réussite)

    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 200, reputation: 2, argentVirtuel: 500 });
    expect(besoins.consommer).toHaveBeenCalledWith('u1', { energie: 3, faim: 2 });
    expect(pnj.surMissionReussie).toHaveBeenCalledWith('u1', 'Sécurité chantier');
    expect(pnj.surMissionEchouee).not.toHaveBeenCalled();
  });

  it("un échec paie moitié moins (jamais zéro net) et fait légèrement baisser la réputation", async () => {
    const prisma = fakePrisma();
    const { svc, progression, pnj } = await service(prisma);

    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: ['b'] } });

    expect(resultat.reussie).toBe(false);
    expect(resultat.score).toBe(0);
    expect(resultat.xpGagne).toBe(0); // round(0 * 0.5)
    expect(resultat.reputationDelta).toBe(-1); // 0 + (-1) d'échec
    expect(resultat.argentDelta).toBe(100); // 0 + 100 de consolation

    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 0, reputation: -1, argentVirtuel: 100 });
    expect(pnj.surMissionEchouee).toHaveBeenCalledWith('u1', 'Sécurité chantier');
    expect(pnj.surMissionReussie).not.toHaveBeenCalled();
  });

  it('une décision à conséquences répercute son budget/réputation en plus du bonus ou malus de réussite', async () => {
    const prisma = fakePrisma({ mission: { findUnique: jest.fn().mockResolvedValue(missionDecision()) } });
    const { svc, progression } = await service(prisma);

    // Choisit l'option "risque" : mauvaise réponse (20/100 < seuil de réussite 60) avec conséquences négatives.
    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: 'risque' } });

    expect(resultat.reussie).toBe(false);
    expect(resultat.score).toBe(20);
    expect(resultat.reputationDelta).toBe(-6); // -5 (conséquence) + -1 (échec)
    expect(resultat.argentDelta).toBe(-199900); // -200000 (conséquence) + 100 (consolation)
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 10, reputation: -6, argentVirtuel: -199900 });
  });

  it('signale une montée de niveau au PNJ hiérarchique quand elle se produit, jamais sinon', async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn()
          .mockResolvedValueOnce({ niveau: 1 }) // lu avant appliquerDelta
          .mockResolvedValueOnce({ niveau: 2 }), // lu après appliquerDelta
      },
    });
    const { svc, pnj } = await service(prisma);

    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: ['a'] } });

    expect(resultat.niveauAvant).toBe(1);
    expect(resultat.niveauApres).toBe(2);
    expect(pnj.surNiveauSuperieur).toHaveBeenCalledWith('u1', 2);
  });

  it("ne déclenche pas la notification de montée de niveau quand le niveau ne change pas", async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 5 }) } });
    const { svc, pnj } = await service(prisma);

    await svc.submit('u1', 'mission-1', { reponses: { c1: ['a'] } });

    expect(pnj.surNiveauSuperieur).not.toHaveBeenCalled();
  });

  it('une nouvelle tentative ne fait jamais baisser le meilleur score déjà acquis, et incrémente le compteur', async () => {
    const prisma = fakePrisma({
      userMission: {
        findUnique: jest.fn().mockResolvedValue({ statut: 'REUSSIE', meilleurScore: 80, termineeLe: new Date('2026-01-01') }),
        upsert: jest.fn().mockImplementation(({ update }: { update: { meilleurScore: number; tentatives: unknown } }) =>
          Promise.resolve({ id: 'um1', ...update }),
        ),
      },
    });
    const { svc, prisma: p, pnj } = await service(prisma);

    // Cette tentative échoue (score 0), en dessous du meilleur score déjà acquis (80).
    await svc.submit('u1', 'mission-1', { reponses: { c1: ['b'] } });

    const appelUpsert = p.userMission.upsert.mock.calls[0][0];
    expect(appelUpsert.update.meilleurScore).toBe(80);
    expect(appelUpsert.update.tentatives).toEqual({ increment: 1 });
    // La mission a déjà été terminée avec succès par le passé : ni "première réussite" ni "premier échec" à signaler.
    expect(pnj.surMissionEchouee).not.toHaveBeenCalled();
  });

  it('attribue le badge de la mission une fois réussie, sans le redemander si déjà obtenu (délégué à ProgressionService)', async () => {
    const prisma = fakePrisma({ mission: { findUnique: jest.fn().mockResolvedValue(missionQuiz({ badgeId: 'badge-securite' })) } });
    const { svc, progression } = await service(prisma);

    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: ['a'] } });

    expect(progression.attribuerBadgeSiAbsent).toHaveBeenCalledWith('u1', 'badge-securite', 'mission-1');
    expect(resultat.badgeObtenu).toEqual({ id: 'badge-attr-1' });
  });

  it("ne tente pas d'attribuer de badge en cas d'échec", async () => {
    const prisma = fakePrisma({ mission: { findUnique: jest.fn().mockResolvedValue(missionQuiz({ badgeId: 'badge-securite' })) } });
    const { svc, progression } = await service(prisma);

    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: ['b'] } });

    expect(progression.attribuerBadgeSiAbsent).not.toHaveBeenCalled();
    expect(resultat.badgeObtenu).toBeNull();
  });

  it('valide les compétences liées à la mission uniquement en cas de réussite', async () => {
    const prisma = fakePrisma({ mission: { findUnique: jest.fn().mockResolvedValue(missionQuiz({ competences: ['comp-securite'] })) } });
    const { svc, progression } = await service(prisma);

    const resultat = await svc.submit('u1', 'mission-1', { reponses: { c1: ['a'] } });

    expect(progression.validerCompetence).toHaveBeenCalledWith('u1', 'comp-securite', 100, 'mission');
    expect(resultat.competencesMaj).toEqual([{ niveauActuel: 1 }]);
  });
});

describe('MissionsService.disponibles', () => {
  it('marque verrouillée toute mission dont le niveau requis dépasse le niveau du joueur', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 5 }) },
      mission: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'm-facile', niveauRequis: 3 },
          { id: 'm-dure', niveauRequis: 10 },
        ]),
      },
      userMission: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);

    const resultat = await svc.disponibles('u1', {});

    expect(resultat.find((m) => m.id === 'm-facile')?.verrouillee).toBe(false);
    expect(resultat.find((m) => m.id === 'm-dure')?.verrouillee).toBe(true);
  });

  it('reprend le statut et le meilleur score déjà enregistrés pour le joueur', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 5 }) },
      mission: { findMany: jest.fn().mockResolvedValue([{ id: 'm1', niveauRequis: 1 }]) },
      userMission: { findMany: jest.fn().mockResolvedValue([{ missionId: 'm1', statut: 'REUSSIE', meilleurScore: 90 }]) },
    });
    const { svc } = await service(prisma);

    const resultat = await svc.disponibles('u1', {});

    expect(resultat[0].userStatut).toBe('REUSSIE');
    expect(resultat[0].meilleurScore).toBe(90);
  });
});
