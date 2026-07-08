import { Test } from '@nestjs/testing';
import { BesoinsService } from './besoins.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BesoinsService.facteurPerformance', () => {
  it('vaut 1.0 quand toutes les jauges sont pleines', () => {
    expect(BesoinsService.facteurPerformance({ energie: 100, moral: 100, faim: 100, social: 100 })).toBeCloseTo(1);
  });

  it('vaut le plancher 0.7 quand toutes les jauges sont à 0', () => {
    expect(BesoinsService.facteurPerformance({ energie: 0, moral: 0, faim: 0, social: 0 })).toBeCloseTo(0.7);
  });

  it('interpole linéairement entre 0.7 et 1.0 selon la moyenne des jauges', () => {
    expect(BesoinsService.facteurPerformance({ energie: 50, moral: 50, faim: 50, social: 50 })).toBeCloseTo(0.85);
  });

  it('ne descend jamais sous 0.7 même avec des valeurs négatives incohérentes', () => {
    expect(BesoinsService.facteurPerformance({ energie: -50, moral: -50, faim: -50, social: -50 })).toBeCloseTo(0.7);
  });
});

describe('BesoinsService.actualiser', () => {
  const MAINTENANT = new Date('2026-07-08T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(MAINTENANT);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  async function service(carriere: Record<string, unknown>) {
    const prisma = {
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue(carriere),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...carriere, ...data })),
      },
    };
    const module = await Test.createTestingModule({
      providers: [BesoinsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return { svc: module.get(BesoinsService), prisma };
  }

  it('fait décliner chaque jauge proportionnellement aux heures écoulées depuis la dernière mise à jour', async () => {
    const ilYA5h = new Date(MAINTENANT.getTime() - 5 * 3_600_000);
    const { svc } = await service({
      userId: 'u1',
      energie: 100,
      faim: 100,
      social: 100,
      moral: 100,
      derniereMajBesoins: ilYA5h,
    });
    const resultat = await svc.actualiser('u1');
    // Taux/heure : énergie 4, faim 6, social 2, moral 1 → sur 5h : -20, -30, -10, -5
    expect(resultat.energie).toBe(80);
    expect(resultat.faim).toBe(70);
    expect(resultat.social).toBe(90);
    expect(resultat.moral).toBe(95);
  });

  it('ne fait jamais descendre une jauge sous 0, même après une très longue absence', async () => {
    const ilYALongtemps = new Date(MAINTENANT.getTime() - 1000 * 3_600_000); // 1000h, bien au-delà du plafond de 72h
    const { svc } = await service({
      userId: 'u1',
      energie: 100,
      faim: 100,
      social: 100,
      moral: 100,
      derniereMajBesoins: ilYALongtemps,
    });
    const resultat = await svc.actualiser('u1');
    expect(resultat.energie).toBe(0);
    expect(resultat.faim).toBe(0);
  });

  it('ne fait pas décliner les jauges si la dernière mise à jour est à l’instant présent', async () => {
    const { svc } = await service({
      userId: 'u1',
      energie: 100,
      faim: 100,
      social: 100,
      moral: 100,
      derniereMajBesoins: MAINTENANT,
    });
    const resultat = await svc.actualiser('u1');
    expect(resultat.energie).toBe(100);
    expect(resultat.faim).toBe(100);
  });
});

describe('BesoinsService.agir', () => {
  async function service(carriere: Record<string, unknown>) {
    const prisma = {
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue(carriere),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...carriere, ...data })),
      },
    };
    const module = await Test.createTestingModule({
      providers: [BesoinsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return { svc: module.get(BesoinsService), prisma };
  }

  it('restaure la jauge ciblée au maximum et applique le bonus de moral', async () => {
    const { svc } = await service({
      userId: 'u1',
      energie: 40,
      faim: 100,
      social: 100,
      moral: 50,
      derniereMajBesoins: new Date(),
    });
    const resultat = await svc.agir('u1', 'repos');
    expect(resultat.change).toBe(true);
    expect(resultat.carriere.energie).toBe(100);
    expect(resultat.carriere.moral).toBe(54); // bonusMoral du repos = 4
  });

  it('ne fait rien et prévient si la jauge est déjà quasi pleine (>= 98)', async () => {
    const { svc, prisma } = await service({
      userId: 'u1',
      energie: 99,
      faim: 100,
      social: 100,
      moral: 80,
      derniereMajBesoins: new Date(),
    });
    const resultat = await svc.agir('u1', 'repos');
    expect(resultat.change).toBe(false);
    expect(resultat.message).toContain('maximum');
    // Un seul appel update : celui d'actualiser(), aucun second pour l'action elle-même.
    expect(prisma.userCarriere.update).toHaveBeenCalledTimes(1);
  });

  it('ne dépasse jamais 100 pour le moral même en cumulant des bonus', async () => {
    const { svc } = await service({
      userId: 'u1',
      energie: 40,
      faim: 100,
      social: 100,
      moral: 99,
      derniereMajBesoins: new Date(),
    });
    const resultat = await svc.agir('u1', 'repos');
    expect(resultat.carriere.moral).toBe(100);
  });
});
