import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { PnjService } from '../carriere/pnj.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  // Fusion clé par clé (pas un simple spread final, qui écraserait entièrement une clé déjà
  // fusionnée comme userCarriere et ferait disparaître ses mocks par défaut non redéfinis).
  const defaut: Record<string, object> = {
    userCarriere: {
      findUnique: jest.fn().mockResolvedValue({ profilActuelId: 'profil-source', niveau: 3, reputation: 60 }),
      update: jest.fn().mockResolvedValue({}),
    },
    reglePromotion: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    competence: { findUnique: jest.fn().mockResolvedValue(null) },
    userCompetence: { findUnique: jest.fn().mockResolvedValue(null) },
    userChantier: { count: jest.fn().mockResolvedValue(0) },
    userMission: { findUnique: jest.fn().mockResolvedValue(null) },
    demandePromotion: { create: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: 'demande-1', ...data })) },
    carriereHistorique: { create: jest.fn().mockResolvedValue({}) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of Object.keys(defaut)) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const progression = { appliquerDelta: jest.fn().mockResolvedValue({}) };
  const pnj = { surPromotion: jest.fn().mockResolvedValue(undefined) };
  const module = await Test.createTestingModule({
    providers: [
      PromotionsService,
      { provide: PrismaService, useValue: prisma },
      { provide: ProgressionService, useValue: progression },
      { provide: PnjService, useValue: pnj },
    ],
  }).compile();
  return { svc: module.get(PromotionsService), progression, pnj };
}

describe('PromotionsService.eligibles', () => {
  it('renvoie un tableau vide si le joueur n’a pas encore de profil', async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuelId: null }) } });
    const { svc } = await service(prisma);
    expect(await svc.eligibles('u1')).toEqual([]);
  });

  it('marque une règle éligible quand toutes les conditions (niveau, réputation) sont satisfaites', async () => {
    const prisma = fakePrisma({
      reglePromotion: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'r1', conditions: { niveauMin: 2, reputationMin: 50 }, profilCible: { nom: 'Chef' } },
        ]),
      },
    });
    const { svc } = await service(prisma);
    const [resultat] = await svc.eligibles('u1');
    expect(resultat.eligible).toBe(true);
    expect(resultat.manquants).toEqual([]);
  });

  it('liste précisément ce qui manque quand niveau ET réputation sont insuffisants', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuelId: 'profil-source', niveau: 1, reputation: 10 }) },
      reglePromotion: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'r1', conditions: { niveauMin: 5, reputationMin: 80 }, profilCible: { nom: 'Chef' } },
        ]),
      },
    });
    const { svc } = await service(prisma);
    const [resultat] = await svc.eligibles('u1');
    expect(resultat.eligible).toBe(false);
    expect(resultat.manquants).toEqual(['Réputation 80 requise', 'Niveau 5 requis']);
  });

  it('exige le nombre de chantiers réussis (note A ou B) demandé', async () => {
    const prisma = fakePrisma({
      reglePromotion: {
        findMany: jest.fn().mockResolvedValue([{ id: 'r1', conditions: { chantiersReussis: 3 }, profilCible: {} }]),
      },
      userChantier: { count: jest.fn().mockResolvedValue(1) },
    });
    const { svc } = await service(prisma);
    const [resultat] = await svc.eligibles('u1');
    expect(resultat.eligible).toBe(false);
    expect(resultat.manquants).toEqual(['3 chantiers réussis requis']);
  });

  it('exige la réussite de l’examen de passage désigné', async () => {
    const prisma = fakePrisma({
      reglePromotion: {
        findMany: jest.fn().mockResolvedValue([{ id: 'r1', conditions: { examenMissionId: 'mission-x' }, profilCible: {} }]),
      },
      userMission: { findUnique: jest.fn().mockResolvedValue({ statut: 'ECHOUEE' }) },
    });
    const { svc } = await service(prisma);
    const [resultat] = await svc.eligibles('u1');
    expect(resultat.manquants).toContain('Examen de passage non réussi');
  });
});

describe('PromotionsService.demander', () => {
  const regle = {
    id: 'r1',
    profilSourceId: 'profil-source',
    profilCibleId: 'profil-cible',
    conditions: {},
    profilSource: { nom: 'Stagiaire' },
    profilCible: { nom: "Chef d'équipe" },
  };

  it('accepte la promotion quand les conditions sont remplies : met à jour le profil, l’historique, l’XP et prévient le PNJ', async () => {
    const prisma = fakePrisma({ reglePromotion: { findUnique: jest.fn().mockResolvedValue(regle) } });
    const { svc, progression, pnj } = await service(prisma);

    const demande = await svc.demander('u1', 'r1');

    expect(demande.statut).toBe('ACCEPTEE');
    expect(prisma.userCarriere.update).toHaveBeenCalledWith({ where: { userId: 'u1' }, data: { profilActuelId: 'profil-cible' } });
    expect(prisma.carriereHistorique.create).toHaveBeenCalled();
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 100, reputation: 5, argentVirtuel: 200 });
    expect(pnj.surPromotion).toHaveBeenCalledWith('u1', 'Stagiaire', "Chef d'équipe");
  });

  it('refuse la promotion sans rien modifier si une condition manque', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuelId: 'profil-source', niveau: 1, reputation: 0 }) },
      reglePromotion: {
        findUnique: jest.fn().mockResolvedValue({ ...regle, conditions: { niveauMin: 10 } }),
      },
    });
    const { svc, progression, pnj } = await service(prisma);

    const demande = await svc.demander('u1', 'r1');

    expect(demande.statut).toBe('REFUSEE');
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
    expect(pnj.surPromotion).not.toHaveBeenCalled();
  });

  it('refuse avec une exception si la règle ne correspond pas au profil actuel du joueur', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuelId: 'autre-profil', niveau: 5, reputation: 90 }) },
      reglePromotion: { findUnique: jest.fn().mockResolvedValue(regle) },
    });
    const { svc } = await service(prisma);
    await expect(svc.demander('u1', 'r1')).rejects.toThrow(BadRequestException);
  });

  it('lève une NotFoundException si la règle de promotion n’existe pas', async () => {
    const prisma = fakePrisma({ reglePromotion: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.demander('u1', 'inconnue')).rejects.toThrow(NotFoundException);
  });
});
