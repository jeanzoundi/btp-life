import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { cleJour, cleSemaine, DefisService, lireDefi, lireEtatDefis, tirer } from './defis.service';

const EVENEMENTS = [
  { id: 'e1', type: 'DEFI_JOUR', config: { slug: 'seance', titre: 'Une séance', description: 'Une séance chez un mentor.', objectif: { type: 'seances_lieu', cible: 1 }, recompense: { xp: 25, argent: 1000 } } },
  { id: 'e2', type: 'DEFI_JOUR', config: { slug: 'mission', titre: 'Mission accomplie', objectif: { type: 'missions', cible: 1 }, recompense: { xp: 30, argent: 1200 } } },
  { id: 'e3', type: 'DEFI_JOUR', config: { slug: 'trajet', titre: 'En route', objectif: { type: 'trajets', cible: 1 }, recompense: { xp: 10, argent: 300 } } },
  { id: 'e4', type: 'DEFI_SEMAINE', config: { slug: 'habitue', titre: 'Habitué du quartier', objectif: { type: 'seances_lieu', cible: 5 }, recompense: { xp: 150, argent: 6000, reputation: 3 } } },
  { id: 'e5', type: 'DEFI_JOUR', config: { slug: 'casse', titre: 'Défi mal saisi', objectif: { type: 'inconnu', cible: 1 } } },
];
const IMPREVUS = [{
  id: 'i1', titre: 'Inspection surprise', description: 'L’inspecteur arrive sans prévenir.', declencheur: { slug: 'inspection', lieu: 'chantier' },
  options: [
    { texte: 'Je l’accueille avec le registre', retour: 'Tout est en ordre.', effets: { xp: 20, reputation: 3 } },
    { texte: 'Je propose une enveloppe', retour: 'Corruption : amende.', effets: { argent: -5000, reputation: -5 } },
  ],
}];

function fakePrisma(overrides: { defis?: unknown; seances?: number; missions?: number; campagne?: unknown } = {}) {
  const maintenant = new Date();
  const etat: Record<string, unknown> = {
    userId: 'u1', niveau: 3, campagne: overrides.campagne ?? { chapitres: 2 },
    progresLieux: { laboratoire: { etapes: 1, cycles: 0, seances: overrides.seances ?? 3 } },
    defis: 'defis' in overrides ? overrides.defis : {
      jour: cleJour(maintenant), semaine: cleSemaine(maintenant), baseJour: { seances: 2, chapitres: 2 }, baseSemaine: { seances: 0, chapitres: 0 },
      trajets: { jour: 1, semaine: 1 }, reclames: {},
    },
  };
  const prisma = {
    userCarriere: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...etat })),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { Object.assign(etat, data); return Promise.resolve({ ...etat }); }),
    },
    evenement: { findMany: jest.fn().mockResolvedValue(EVENEMENTS) },
    imprevu: { findMany: jest.fn().mockResolvedValue(IMPREVUS) },
    userMission: { count: jest.fn().mockResolvedValue(overrides.missions ?? 0) },
    userCours: { count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return { prisma, etat };
}

async function service(prisma: ReturnType<typeof fakePrisma>['prisma']) {
  const progression = { appliquerDelta: jest.fn().mockResolvedValue({ niveau: 3 }), notifierNiveau: jest.fn() };
  const module = await Test.createTestingModule({
    providers: [DefisService, { provide: PrismaService, useValue: prisma }, { provide: ProgressionService, useValue: progression }],
  }).compile();
  return { svc: module.get(DefisService), progression };
}

describe('les périodes et le tirage des défis', () => {
  it('nomme les jours et les semaines ISO', () => {
    expect(cleJour(new Date('2026-10-26T15:00:00Z'))).toBe('2026-10-26');
    expect(cleSemaine(new Date('2026-10-26T15:00:00Z'))).toBe('2026-S44');
    expect(cleSemaine(new Date('2027-01-01T08:00:00Z'))).toBe('2026-S53');
  });
  it('tire les mêmes défis toute la journée, et d’autres le lendemain', () => {
    const pool = Array.from({ length: 8 }, (_, i) => ({ slug: `d${i}` }));
    expect(tirer(pool, 3, 'u1:2026-10-26')).toEqual(tirer(pool, 3, 'u1:2026-10-26'));
    const jours = new Set(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'].map(j => tirer(pool, 3, `u1:${j}`).map(d => d.slug).join()));
    expect(jours.size).toBeGreaterThan(1);
  });
  it('écarte un défi mal saisi et borne les récompenses saisies dans l’administration', () => {
    expect(lireDefi({ slug: 'x', titre: 'X', objectif: { type: 'inconnu' } })).toBeNull();
    expect(lireDefi({ slug: 'x', titre: 'X', objectif: { type: 'cours', cible: 0 }, recompense: { xp: 99999, argent: -50 } }))
      .toMatchObject({ objectif: { cible: 1 }, recompense: { xp: 500, argent: 0 } });
  });
  it('repart d’un nouvel instantané au changement de jour, et garde l’état dans la journée', () => {
    const maintenant = new Date('2026-10-26T10:00:00Z');
    const hier = { jour: '2026-10-25', semaine: cleSemaine(maintenant), baseJour: { seances: 1, chapitres: 0 }, baseSemaine: { seances: 1, chapitres: 0 }, trajets: { jour: 4, semaine: 6 }, reclames: { seance: '2026-10-25', habitue: cleSemaine(maintenant) } };
    const { etat, change } = lireEtatDefis(hier, maintenant, { seances: 7, chapitres: 3 });
    expect(change).toBe(true);
    expect(etat.baseJour).toEqual({ seances: 7, chapitres: 3 });
    expect(etat.baseSemaine).toEqual({ seances: 1, chapitres: 0 });
    expect(etat.trajets).toEqual({ jour: 0, semaine: 6 });
    expect(etat.reclames).toEqual({ habitue: cleSemaine(maintenant) });
    expect(lireEtatDefis(etat, maintenant, { seances: 9, chapitres: 3 }).change).toBe(false);
  });
});

describe('DefisService.etat', () => {
  it('donne les défis du jour et de la semaine avec leur progression mesurée', async () => {
    const { prisma } = fakePrisma({ seances: 3, missions: 0 });
    const { svc } = await service(prisma);
    const r = await svc.etat('u1');
    expect(r.jour.map(d => d.slug).sort()).toEqual(['mission', 'seance', 'trajet']);
    expect(r.jour.find(d => d.slug === 'seance')).toMatchObject({ progres: 1, reclame: false, periode: 'jour' });
    expect(r.jour.find(d => d.slug === 'mission')?.progres).toBe(0);
    expect(r.jour.find(d => d.slug === 'trajet')?.progres).toBe(1);
    expect(r.semaine).toEqual([expect.objectContaining({ slug: 'habitue', progres: 3, periode: 'semaine' })]);
  });
  it('prend l’instantané du jour quand il n’existe pas encore', async () => {
    const { prisma, etat } = fakePrisma({ defis: null, seances: 4 });
    const { svc } = await service(prisma);
    const r = await svc.etat('u1');
    expect(prisma.userCarriere.update).toHaveBeenCalled();
    expect((etat.defis as { baseJour: { seances: number } }).baseJour.seances).toBe(4);
    expect(r.jour.find(d => d.slug === 'seance')?.progres).toBe(0);
  });
});

describe('DefisService.reclamer', () => {
  it('verse la récompense d’un défi réussi dans la transaction, une seule fois', async () => {
    const { prisma, etat } = fakePrisma();
    const { svc, progression } = await service(prisma);
    await expect(svc.reclamer('u1', 'seance')).resolves.toEqual({ slug: 'seance', recompense: { xp: 25, argent: 1000, reputation: 0 } });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 25, argentVirtuel: 1000, reputation: 0 }, prisma);
    expect((etat.defis as { reclames: Record<string, string> }).reclames.seance).toBe(cleJour(new Date()));
    await expect(svc.reclamer('u1', 'seance')).rejects.toThrow(ConflictException);
  });
  it('refuse un défi pas encore réussi, ou absent du programme', async () => {
    const { prisma } = fakePrisma({ missions: 0 });
    const { svc, progression } = await service(prisma);
    await expect(svc.reclamer('u1', 'mission')).rejects.toThrow(BadRequestException);
    await expect(svc.reclamer('u1', 'casse')).rejects.toThrow(NotFoundException);
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
  });
  it('compte un trajet pour le jour et la semaine', async () => {
    const { prisma, etat } = fakePrisma();
    const { svc } = await service(prisma);
    await svc.compterTrajet('u1');
    expect((etat.defis as { trajets: { jour: number; semaine: number } }).trajets).toEqual({ jour: 2, semaine: 2 });
  });
});

describe('l’imprévu du jour', () => {
  it('montre la situation et les options, sans en dévoiler les conséquences', async () => {
    const { prisma } = fakePrisma();
    const { svc } = await service(prisma);
    await expect(svc.imprevu('u1')).resolves.toEqual({
      imprevu: { slug: 'inspection', titre: 'Inspection surprise', description: 'L’inspecteur arrive sans prévenir.', options: ['Je l’accueille avec le registre', 'Je propose une enveloppe'] },
      decision: null,
    });
  });
  it('applique la décision une fois par jour, avec ses conséquences', async () => {
    const { prisma } = fakePrisma();
    const { svc, progression } = await service(prisma);
    await expect(svc.deciderImprevu('u1', 1)).resolves.toEqual({ option: 1, retour: 'Corruption : amende.', effets: { xp: 0, argent: -5000, reputation: -5 } });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 0, argentVirtuel: -5000, reputation: -5 }, prisma);
    await expect(svc.deciderImprevu('u1', 0)).rejects.toThrow(ConflictException);
    expect((await svc.imprevu('u1')).decision).toMatchObject({ option: 1, retour: 'Corruption : amende.' });
  });
  it('refuse une option inconnue', async () => {
    const { prisma } = fakePrisma();
    const { svc } = await service(prisma);
    await expect(svc.deciderImprevu('u1', 5)).rejects.toThrow(BadRequestException);
  });
});
