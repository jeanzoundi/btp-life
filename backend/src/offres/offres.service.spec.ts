import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OffresService } from './offres.service';
import { PrismaService } from '../prisma/prisma.service';

function offre(overrides: Record<string, unknown> = {}) {
  return {
    id: 'offre-1',
    profilRechercheId: 'profil-chef-chantier',
    niveauMin: 5,
    reputationMin: 300,
    chantiersRequis: 0,
    competencesRequises: [],
    testEntreeMissionId: null,
    ...overrides,
  };
}

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    candidature: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: 'cand-1', ...data })),
    },
    offreEmploi: { findUnique: jest.fn().mockResolvedValue(offre()) },
    userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 10, reputation: 500 }), update: jest.fn().mockResolvedValue({}) },
    userChantier: { count: jest.fn().mockResolvedValue(0) },
    competence: { findUnique: jest.fn().mockResolvedValue(null) },
    userCompetence: { findUnique: jest.fn().mockResolvedValue(null) },
    userMission: { findUnique: jest.fn().mockResolvedValue(null) },
    carriereHistorique: { create: jest.fn().mockResolvedValue({}) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of new Set([...Object.keys(defaut), ...Object.keys(overrides)])) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({
    providers: [OffresService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return { svc: module.get(OffresService), prisma };
}

describe('OffresService.mesCandidatures', () => {
  it('liste les candidatures du joueur, avec le détail de chaque offre', async () => {
    const prisma = fakePrisma({ candidature: { findMany: jest.fn().mockResolvedValue([{ id: 'c1', offre: { titre: 'Chef de chantier' } }]) } });
    const { svc } = await service(prisma);
    const resultat = await svc.mesCandidatures('u1');
    expect(resultat).toEqual([{ id: 'c1', offre: { titre: 'Chef de chantier' } }]);
  });
});

describe('OffresService.candidater', () => {
  it("échoue proprement si l'offre n'existe pas", async () => {
    const prisma = fakePrisma({ offreEmploi: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.candidater('u1', 'offre-x')).rejects.toThrow(NotFoundException);
  });

  it('accepte la candidature quand toutes les conditions sont remplies, et bascule le profil du joueur', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    const resultat = await svc.candidater('u1', 'offre-1') as { statut: string };

    expect(resultat.statut).toBe('ACCEPTEE');
    expect(p.userCarriere.update).toHaveBeenCalledWith({ where: { userId: 'u1' }, data: { profilActuelId: 'profil-chef-chantier' } });
    expect(p.carriereHistorique.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'EMBAUCHE' }) }));
  });

  it('refuse la candidature si le niveau ou la réputation sont insuffisants, sans jamais changer de profil', async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 2, reputation: 50 }), update: jest.fn() } });
    const { svc, prisma: p } = await service(prisma);
    const resultat = await svc.candidater('u1', 'offre-1') as unknown as { statut: string; feedback: { manquants: string[] } };

    expect(resultat.statut).toBe('REFUSEE');
    expect(resultat.feedback.manquants).toEqual(
      expect.arrayContaining([expect.stringContaining('Niveau'), expect.stringContaining('Réputation')]),
    );
    expect(p.userCarriere.update).not.toHaveBeenCalled();
  });

  it('refuse si le nombre de chantiers réalisés requis n\'est pas atteint', async () => {
    const prisma = fakePrisma({
      offreEmploi: { findUnique: jest.fn().mockResolvedValue(offre({ chantiersRequis: 3 })) },
      userChantier: { count: jest.fn().mockResolvedValue(1) },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.candidater('u1', 'offre-1') as unknown as { feedback: { manquants: string[] } };
    expect(resultat.feedback.manquants).toEqual(expect.arrayContaining([expect.stringContaining('chantier(s) réalisé(s)')]));
  });

  it("refuse si le test d'entrée n'a pas été réussi", async () => {
    const prisma = fakePrisma({
      offreEmploi: { findUnique: jest.fn().mockResolvedValue(offre({ testEntreeMissionId: 'mission-1' })) },
      userMission: { findUnique: jest.fn().mockResolvedValue({ statut: 'ECHOUEE', score: 30 }) },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.candidater('u1', 'offre-1') as unknown as { feedback: { manquants: string[] } };
    expect(resultat.feedback.manquants).toEqual(expect.arrayContaining([expect.stringContaining("Test d'entrée")]));
  });
});
