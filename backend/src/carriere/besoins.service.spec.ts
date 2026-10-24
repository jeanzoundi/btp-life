import { Test } from '@nestjs/testing';
import { BesoinsService, CARTE, effetArticle } from './besoins.service';
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
    let etat = { ...carriere };
    const appliquer = (data: Record<string, unknown>) => {
      for (const [cle, valeur] of Object.entries(data)) {
        if (valeur && typeof valeur === 'object' && 'decrement' in valeur) etat[cle] = Number(etat[cle]) - Number((valeur as { decrement: number }).decrement);
        else etat[cle] = valeur;
      }
      return etat;
    };
    const prisma = {
      userCarriere: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve(etat)),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve(appliquer(data))),
        updateMany: jest.fn().mockImplementation(({ data }) => { appliquer(data); return Promise.resolve({ count: 1 }); }),
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
    let etat = { ...carriere };
    const appliquer = (data: Record<string, unknown>) => {
      for (const [cle, valeur] of Object.entries(data)) {
        if (valeur && typeof valeur === 'object' && 'decrement' in valeur) etat[cle] = Number(etat[cle]) - Number((valeur as { decrement: number }).decrement);
        else etat[cle] = valeur;
      }
      return etat;
    };
    const prisma = {
      userCarriere: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve(etat)),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve(appliquer(data))),
        updateMany: jest.fn().mockImplementation(({ data }) => { appliquer(data); return Promise.resolve({ count: 1 }); }),
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

  it('le repos reste gratuit même à solde nul', async () => {
    const { svc } = await service({
      userId: 'u1',
      energie: 40,
      faim: 100,
      social: 100,
      moral: 50,
      argentVirtuel: 0,
      derniereMajBesoins: new Date(),
    });
    const resultat = await svc.agir('u1', 'repos');
    expect(resultat.change).toBe(true);
    expect(resultat.coutPaye).toBe(0);
  });

  it('refuse le repas si le solde est insuffisant, sans toucher aux jauges', async () => {
    const { svc, prisma } = await service({
      userId: 'u1',
      energie: 100,
      faim: 20,
      social: 100,
      moral: 50,
      argentVirtuel: 50,
      derniereMajBesoins: new Date(),
    });
    await expect(svc.agir('u1', 'repas')).rejects.toThrow("Pas assez d'argent");
    // Un seul appel update : celui d'actualiser(), aucune modification tentée pour l'action.
    expect(prisma.userCarriere.update).toHaveBeenCalledTimes(1);
  });

  it('débite le coût du repas quand le solde est suffisant', async () => {
    const { svc } = await service({
      userId: 'u1',
      energie: 100,
      faim: 20,
      social: 100,
      moral: 50,
      argentVirtuel: 5000,
      derniereMajBesoins: new Date(),
    });
    const resultat = await svc.agir('u1', 'repas');
    expect(resultat.change).toBe(true);
    expect(resultat.coutPaye).toBe(1200);
  });
});

describe('BesoinsService.agir avec un article de la carte', () => {
  async function service(carriere: Record<string, unknown>) {
    const etat: Record<string, unknown> = { userId: 'u1', energie: 60, faim: 30, social: 50, moral: 50, argentVirtuel: 5000, derniereMajBesoins: new Date(), ...carriere };
    const appliquer = (data: Record<string, unknown>) => {
      for (const [cle, valeur] of Object.entries(data)) {
        if (valeur && typeof valeur === 'object' && 'decrement' in valeur) etat[cle] = Number(etat[cle]) - Number((valeur as { decrement: number }).decrement);
        else etat[cle] = valeur;
      }
      return etat;
    };
    const prisma = {
      userCarriere: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...etat })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...appliquer(data) })),
        updateMany: jest.fn().mockImplementation(({ data }) => { appliquer(data); return Promise.resolve({ count: 1 }); }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [BesoinsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return { svc: module.get(BesoinsService), prisma };
  }

  it('ajoute les points de l’article sans dépasser 100, et débite son prix', async () => {
    const { svc } = await service({ faim: 70 });
    const resultat = await svc.agir('u1', 'repas', { article: 'attieke-carpe' });
    expect(resultat).toMatchObject({ change: true, coutPaye: 2500 });
    expect(resultat.carriere).toMatchObject({ faim: 100, moral: 53, argentVirtuel: 2500 });
  });

  it('touche plusieurs jauges à la fois (le café réveille autant qu’il rapproche)', async () => {
    const { svc } = await service({});
    const resultat = await svc.agir('u1', 'social', { article: 'cafe-noir' });
    expect(resultat.carriere).toMatchObject({ energie: 75, social: 60, faim: 30, argentVirtuel: 4700 });
  });

  it('à la table des collègues, le repas compte aussi pour le lien social', async () => {
    const { svc } = await service({});
    const resultat = await svc.agir('u1', 'repas', { article: 'garba', tablee: true });
    expect(resultat.carriere).toMatchObject({ faim: 80, social: 70, moral: 53 });
  });

  it('refuse un article inconnu, ou servi pour une autre action', async () => {
    const { svc } = await service({});
    await expect(svc.agir('u1', 'repas', { article: 'champagne' })).rejects.toThrow('Article inconnu');
    await expect(svc.agir('u1', 'repas', { article: 'cafe-noir' })).rejects.toThrow('Article inconnu');
    await expect(svc.agir('u1', 'repas', { article: 'constructor' })).rejects.toThrow('Article inconnu');
  });

  it('ne débite rien quand toutes les jauges visées sont déjà pleines', async () => {
    const { svc, prisma } = await service({ faim: 99 });
    const resultat = await svc.agir('u1', 'repas', { article: 'foutou-graine' });
    expect(resultat).toMatchObject({ change: false, coutPaye: 0 });
    expect(prisma.userCarriere.updateMany).not.toHaveBeenCalled();
  });

  it('refuse un article trop cher pour le solde', async () => {
    const { svc, prisma } = await service({ argentVirtuel: 800 });
    await expect(svc.agir('u1', 'repas', { article: 'garba' })).rejects.toThrow("Pas assez d'argent");
    expect(prisma.userCarriere.updateMany).not.toHaveBeenCalled();
  });

  it('au marché, la remise marchandée baisse le prix, plafonnée à 20 % et arrondie à 25 F', async () => {
    const { svc } = await service({});
    const resultat = await svc.agir('u1', 'repas', { article: 'choukouya', remise: .15 });
    expect(resultat.coutPaye).toBe(1275);
    expect((await svc.agir('u1', 'repas', { article: 'ananas', remise: .9 })).coutPaye).toBe(400);
    // Hors du marché, pas de remise.
    expect(effetArticle(CARTE.glace, { remise: .2 }).prix).toBe(1000);
  });

  it('le sport fatigue mais remonte le moral, et se refuse à bout de forces', async () => {
    const { svc } = await service({ energie: 60, social: 40, moral: 50 });
    const resultat = await svc.agir('u1', 'social', { article: 'match-foot', victoire: true });
    expect(resultat.carriere).toMatchObject({ energie: 40, social: 80, moral: 62 });
    expect(resultat.message).toContain('tirs au but');
    const fatigue = await service({ energie: 10 });
    await expect(fatigue.svc.agir('u1', 'social', { article: 'musculation' })).rejects.toThrow('Trop fatigué(e)');
  });

  it('le sport sert tant que le moral n’est pas au plus haut, même avec le social plein', async () => {
    const { svc } = await service({ energie: 80, social: 99, moral: 99 });
    expect((await svc.agir('u1', 'social', { article: 'musculation' })).change).toBe(false);
    const moralBas = await service({ energie: 80, social: 99, moral: 70 });
    expect((await moralBas.svc.agir('u1', 'social', { article: 'musculation' })).change).toBe(true);
    // Un plat, lui, ne se vend pas sans faim, même pour le moral.
    const repu = await service({ faim: 99, moral: 50 });
    expect((await repu.svc.agir('u1', 'repas', { article: 'garba' })).change).toBe(false);
  });
});
