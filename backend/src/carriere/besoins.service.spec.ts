import { Test } from '@nestjs/testing';
import { BesoinsService, CARTE, declinMonde, effetArticle, pleineForme } from './besoins.service';
import { PrismaService } from '../prisma/prisma.service';

const PLEIN = { energie: 100, faim: 100, social: 100, moral: 100, hygiene: 100, divertissement: 100 };

describe('BesoinsService.facteurPerformance', () => {
  it('ajoute 5 % en pleine forme (les six jauges à 70 ou plus), pas en dessous', () => {
    expect(BesoinsService.facteurPerformance(PLEIN)).toBeCloseTo(1.05);
    expect(BesoinsService.facteurPerformance({ ...PLEIN, energie: 70, faim: 70, social: 70, moral: 70, hygiene: 70, divertissement: 70 })).toBeCloseTo(0.91 + 0.05);
    expect(BesoinsService.facteurPerformance({ ...PLEIN, hygiene: 69 })).toBeCloseTo(0.7 + (569 / 6 / 100) * 0.3);
    expect(pleineForme({ energie: 100, faim: 100, social: 100, moral: 100 })).toBe(false);
  });

  it('fait la moyenne des six jauges : une douche oubliée pèse autant qu’un repas sauté', () => {
    expect(BesoinsService.facteurPerformance({ ...PLEIN, hygiene: 0, divertissement: 0 })).toBeCloseTo(0.7 + (400 / 6 / 100) * 0.3);
  });

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
    const { svc } = await service({ userId: 'u1', ...PLEIN, derniereMajBesoins: ilYA5h });
    const resultat = await svc.actualiser('u1');
    // Taux/heure : énergie 4, faim 6, social 2, moral 1, hygiène 2, divertissement 2 → sur 5h : -20, -30, -10, -5, -10, -10
    expect(resultat).toMatchObject({ energie: 80, faim: 70, social: 90, moral: 95, hygiene: 90, divertissement: 90 });
  });

  it('ne compte que des heures entières : le reste attend la prochaine lecture au lieu de se perdre', async () => {
    const ilYA100min = new Date(MAINTENANT.getTime() - 100 * 60_000);
    const { svc, prisma } = await service({ userId: 'u1', ...PLEIN, derniereMajBesoins: ilYA100min });
    const resultat = await svc.actualiser('u1');
    expect(resultat).toMatchObject({ faim: 94, moral: 99 });
    // L'heure appliquée seulement : les 40 minutes restantes compteront à la prochaine lecture.
    expect(resultat.derniereMajBesoins).toEqual(new Date(ilYA100min.getTime() + 3_600_000));
    const ilYA40min = new Date(MAINTENANT.getTime() - 40 * 60_000);
    const recent = await service({ userId: 'u1', ...PLEIN, derniereMajBesoins: ilYA40min });
    expect((await recent.svc.actualiser('u1')).moral).toBe(100);
    expect(recent.prisma.userCarriere.update).not.toHaveBeenCalled();
    expect(prisma.userCarriere.update).toHaveBeenCalledTimes(1);
  });

  it('ne fait jamais descendre une jauge sous 0, même après une très longue absence', async () => {
    const ilYALongtemps = new Date(MAINTENANT.getTime() - 1000 * 3_600_000); // 1000h, bien au-delà du plafond de 72h
    const { svc } = await service({ userId: 'u1', ...PLEIN, derniereMajBesoins: ilYALongtemps });
    const resultat = await svc.actualiser('u1');
    expect(resultat.energie).toBe(0);
    expect(resultat.faim).toBe(0);
    // Plafond de 72 h : l'hygiène (2/h) tombe à 0, le moral (1/h) garde 28 ; l'horloge repart de maintenant.
    expect(resultat).toMatchObject({ hygiene: 0, moral: 28, derniereMajBesoins: MAINTENANT });
  });

  it('ne fait pas décliner les jauges si la dernière mise à jour est à l’instant présent, et n’écrit rien', async () => {
    const { svc, prisma } = await service({ userId: 'u1', ...PLEIN, derniereMajBesoins: MAINTENANT });
    const resultat = await svc.actualiser('u1');
    expect(resultat.energie).toBe(100);
    expect(resultat.faim).toBe(100);
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
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
    // Aucune écriture : ni déclin (moins d'une heure écoulée), ni action.
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
    expect(prisma.userCarriere.updateMany).not.toHaveBeenCalled();
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
    // Aucune modification tentée pour l'action.
    expect(prisma.userCarriere.updateMany).not.toHaveBeenCalled();
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

  it('chez soi, cuisiner et recevoir un voisin coûtent moins cher qu’au maquis et au café', async () => {
    const { svc } = await service({});
    expect((await svc.agir('u1', 'repas', { article: 'cuisine-maison' })).coutPaye).toBe(600);
    expect((await svc.agir('u1', 'social', { article: 'voisin-maison' })).coutPaye).toBe(700);
    expect(CARTE['cuisine-maison'].prix).toBeLessThan(CARTE.garba.prix);
    expect(CARTE['voisin-maison'].effets.social).toBeGreaterThan(CARTE['jus-passion'].effets.social ?? 0);
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

/** Faux Prisma qui applique vraiment les écritures, pour suivre une carrière d'un appel à l'autre. */
async function serviceAvec(carriere: Record<string, unknown>) {
  const etat: Record<string, unknown> = { userId: 'u1', ...PLEIN, argentVirtuel: 5000, derniereMajBesoins: new Date(), ...carriere };
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

describe('BesoinsService.passerTemps (le temps du monde vivant)', () => {
  it('fait baisser les six jauges au rythme du monde, heure de jeu par heure de jeu', async () => {
    const { svc } = await serviceAvec({});
    // Par heure de jeu : énergie 4, faim 6, social 3, moral 1, hygiène 4, divertissement 4.
    expect(await svc.passerTemps('u1', 2)).toMatchObject({ energie: 92, faim: 88, social: 94, moral: 98, hygiene: 92, divertissement: 92 });
  });

  it('pendant le sommeil, l’énergie ne baisse pas et le reste deux fois moins vite', async () => {
    const { svc } = await serviceAvec({ energie: 30 });
    expect(await svc.passerTemps('u1', 10, true)).toMatchObject({ energie: 30, faim: 70, social: 85, moral: 95, hygiene: 80, divertissement: 80 });
  });

  it('borne une déclaration à une journée, ignore un temps négatif ou absurde, et s’arrête à 0', async () => {
    const { svc } = await serviceAvec({});
    expect(await svc.passerTemps('u1', 500)).toMatchObject({ energie: 4, faim: 0, social: 28, moral: 76, hygiene: 4, divertissement: 4 });
    const neutre = await serviceAvec({});
    expect(await neutre.svc.passerTemps('u1', -3)).toMatchObject(PLEIN);
    expect(await neutre.svc.passerTemps('u1', Number.NaN)).toMatchObject(PLEIN);
    expect(neutre.prisma.userCarriere.update).not.toHaveBeenCalled();
  });

  it('calcule le déclin que le jeu affiche entre deux déclarations (miroir : frontend/src/lib/humeurs.ts)', () => {
    expect(declinMonde({ ...PLEIN, faim: 50 }, 1.5)).toEqual({ energie: 94, faim: 41, social: 96, moral: 99, hygiene: 94, divertissement: 94 });
    expect(declinMonde({ ...PLEIN, energie: 20 }, 6, true)).toEqual({ energie: 20, faim: 82, social: 91, moral: 97, hygiene: 88, divertissement: 88 });
  });
});

describe('BesoinsService.agir : douche, soirée détente et sieste', () => {
  it('la douche remet l’hygiène à 100, gratuitement', async () => {
    const { svc } = await serviceAvec({ hygiene: 20, moral: 50, argentVirtuel: 0 });
    const resultat = await svc.agir('u1', 'hygiene');
    expect(resultat).toMatchObject({ change: true, coutPaye: 0 });
    expect(resultat.carriere).toMatchObject({ hygiene: 100, moral: 52 });
  });

  it('la soirée détente du mode classique remet le divertissement à 100 pour 800 F', async () => {
    const { svc } = await serviceAvec({ divertissement: 30, moral: 50 });
    const resultat = await svc.agir('u1', 'divertissement');
    expect(resultat).toMatchObject({ change: true, coutPaye: 800 });
    expect(resultat.carriere).toMatchObject({ divertissement: 100, moral: 54, argentVirtuel: 4200 });
  });

  it('la sieste ajoute de l’énergie gratuitement, sans valoir une nuit complète', async () => {
    const { svc } = await serviceAvec({ energie: 40, moral: 50, argentVirtuel: 0 });
    const resultat = await svc.agir('u1', 'repos', { article: 'sieste-maison' });
    expect(resultat).toMatchObject({ change: true, coutPaye: 0 });
    expect(resultat.carriere).toMatchObject({ energie: 75, moral: 51 });
    expect(resultat.message).toContain('sieste');
    expect((await (await serviceAvec({ energie: 80 })).svc.agir('u1', 'repos', { article: 'sieste-maison' })).carriere.energie).toBe(100);
  });

  it('refuse une action inconnue, même un nom hérité d’Object', async () => {
    const { svc } = await serviceAvec({});
    for (const action of ['voler', 'constructor', '__proto__', 'toString']) {
      await expect(svc.agir('u1', action as never)).rejects.toThrow('Action inconnue');
    }
  });
});

describe('BesoinsService.agir : articles qui touchent l’hygiène et le divertissement', () => {
  it('le match fait transpirer et amuse ; une hygiène basse n’empêche pas de jouer', async () => {
    const { svc } = await serviceAvec({ energie: 60, hygiene: 10, social: 40, divertissement: 40, moral: 50 });
    const resultat = await svc.agir('u1', 'social', { article: 'match-foot' });
    expect(resultat.carriere).toMatchObject({ energie: 40, hygiene: 0, social: 70, divertissement: 75, moral: 58 });
  });

  it('la pirogue sert tant que le divertissement n’est pas plein, même avec le social et le moral au plus haut', async () => {
    const { svc } = await serviceAvec({ divertissement: 20, social: 99, moral: 99 });
    const resultat = await svc.agir('u1', 'social', { article: 'pirogue' });
    expect(resultat).toMatchObject({ change: true, coutPaye: 2000 });
    expect(resultat.carriere.divertissement).toBe(65);
  });

  it('la télé de la maison est gratuite et plafonnée à 100 ; le coiffeur rafraîchit aussi', async () => {
    const { svc } = await serviceAvec({ divertissement: 80, argentVirtuel: 0 });
    const tele = await svc.agir('u1', 'divertissement', { article: 'tele-maison' });
    expect(tele).toMatchObject({ change: true, coutPaye: 0 });
    expect(tele.carriere.divertissement).toBe(100);
    expect((await svc.agir('u1', 'divertissement', { article: 'tele-maison' })).change).toBe(false);
    expect(CARTE.coiffure.effets.hygiene).toBeGreaterThan(0);
    expect(Object.values(CARTE).filter((a) => (a.effets.hygiene ?? 0) < 0).length).toBe(3);
  });
});
