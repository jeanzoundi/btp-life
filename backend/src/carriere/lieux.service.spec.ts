import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import { COMPETENCES_LIEUX, DELAI_RECOMPENSE_MS, ETAPES_LIEUX, gainsSeance, LieuxService, lireProgresLieux } from './lieux.service';
import { ProgressionService } from './progression.service';

const BESOINS_PLEINS = { energie: 100, moral: 100, faim: 100, social: 100 };

function fakePrisma(overrides: { progresLieux?: unknown } = {}) {
  const etat: Record<string, unknown> = { userId: 'u1', progresLieux: null, ...overrides };
  const prisma = {
    userCarriere: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...etat })),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { Object.assign(etat, data); return Promise.resolve({ ...etat }); }),
    },
    competence: { findUnique: jest.fn().mockImplementation(({ where }: { where: { slug: string } }) => Promise.resolve({ id: `c-${where.slug}`, nom: `Compétence ${where.slug}` })) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return prisma;
}

async function service(prisma: ReturnType<typeof fakePrisma>, besoins = BESOINS_PLEINS) {
  const progression = { appliquerDelta: jest.fn(), validerCompetence: jest.fn() };
  const besoinsService = { actualiser: jest.fn().mockResolvedValue(besoins), consommer: jest.fn() };
  const module = await Test.createTestingModule({
    providers: [
      LieuxService,
      { provide: PrismaService, useValue: prisma },
      { provide: ProgressionService, useValue: progression },
      { provide: BesoinsService, useValue: besoinsService },
    ],
  }).compile();
  return { svc: module.get(LieuxService), progression, besoins: besoinsService };
}

/** Progression écrite au dernier update, pour un lieu. */
const progresEcrit = (prisma: ReturnType<typeof fakePrisma>, slug: string) =>
  (prisma.userCarriere.update.mock.calls.at(-1)![0].data.progresLieux as Record<string, Record<string, unknown>>)[slug];

describe('COMPETENCES_LIEUX', () => {
  it('donne à chaque étape une compétence seedée', () => {
    const seedees = ['bases-btp', 'securite-n1', 'lecture-plans', 'beton-ferraillage', 'maconnerie', 'metre-devis', 'word-rapport', 'excel-btp', 'autocad-lecture', 'revit-bim', 'gestion-humaine', 'decision-chantier', 'geotechnique', 'technologie-batiment', 'topographie', 'controle-qualite', 'reception-travaux'];
    for (const [slug, competences] of Object.entries(COMPETENCES_LIEUX)) {
      expect(competences.length).toBe(ETAPES_LIEUX[slug]);
      for (const c of competences) expect(seedees).toContain(c);
    }
  });
});

describe('lireProgresLieux', () => {
  it('borne une progression abîmée et repart de zéro pour un lieu absent', () => {
    const lu = lireProgresLieux({ laboratoire: { etapes: 99, cycles: -3, seances: 'x', derniereRecompenseLe: 'pas une date' }, inconnu: { etapes: 2 } });
    expect(lu.laboratoire).toEqual({ etapes: 7, cycles: 0, seances: 0, derniereRecompenseLe: null });
    expect(lu.mairie).toEqual({ etapes: 0, cycles: 0, seances: 0, derniereRecompenseLe: null });
    expect(lu).not.toHaveProperty('inconnu');
  });
});

describe('gainsSeance', () => {
  it('paie la réussite, et l’échec ne rapporte jamais zéro XP', () => {
    expect(gainsSeance(100)).toEqual({ compte: true, xp: 50, argent: 2000 });
    expect(gainsSeance(40)).toEqual({ compte: true, xp: 26, argent: 1100 });
    expect(gainsSeance(30)).toEqual({ compte: false, xp: 6, argent: 0 });
  });
});

describe('LieuxService.seance', () => {
  it('refuse un lieu inconnu', async () => {
    const { svc } = await service(fakePrisma());
    await expect(svc.seance('u1', 'casino', 0, 90)).rejects.toThrow(BadRequestException);
  });

  it('refuse une étape qui n’est pas celle du jour', async () => {
    const prisma = fakePrisma({ progresLieux: { laboratoire: { etapes: 2, cycles: 0, seances: 2 } } });
    const { svc, progression } = await service(prisma);
    await expect(svc.seance('u1', 'laboratoire', 0, 90)).rejects.toThrow(ConflictException);
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
  });

  it('valide l’étape, paie selon la note et l’état du personnage, et fatigue un peu', async () => {
    const prisma = fakePrisma();
    const { svc, progression, besoins } = await service(prisma, { energie: 40, moral: 40, faim: 40, social: 40 });
    const resultat = await svc.seance('u1', 'laboratoire', 0, 100);
    // Facteur des besoins réel (0,7 + 0,4 × 0,3 = 0,82) : c'est le mécanisme qu'on veut vérifier.
    expect(resultat.gains).toMatchObject({ xp: 41, argent: 2000, reputation: 1, entrainement: false, facteurBesoins: .82 });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 41, argentVirtuel: 2000, reputation: 1 });
    expect(besoins.consommer).toHaveBeenCalledWith('u1', { energie: 5, faim: 4 });
    expect(progresEcrit(prisma, 'laboratoire')).toMatchObject({ etapes: 1, cycles: 0, seances: 1 });
    expect(resultat.progres.etapes).toBe(1);
    // La compétence de l'étape (contrôle qualité au laboratoire) gagne 30 % de la note.
    expect(progression.validerCompetence).toHaveBeenCalledWith('u1', 'c-controle-qualite', 30, 'lieu:laboratoire');
    expect(resultat.gains.competence).toEqual({ slug: 'controle-qualite', nom: 'Compétence controle-qualite', xp: 30 });
  });

  it('fait travailler une compétence propre à chaque étape', async () => {
    const prisma = fakePrisma({ progresLieux: { 'bureau-etudes': { etapes: 2, cycles: 0, seances: 2 } } });
    const { svc, progression } = await service(prisma);
    await svc.seance('u1', 'bureau-etudes', 2, 80);
    expect(progression.validerCompetence).toHaveBeenCalledWith('u1', 'c-geotechnique', 24, 'lieu:bureau-etudes');
  });

  it('une séance sous 40 ne valide pas l’étape et ne paie pas', async () => {
    const prisma = fakePrisma({ progresLieux: { mairie: { etapes: 3, cycles: 1, seances: 9 } } });
    const { svc, progression } = await service(prisma);
    const resultat = await svc.seance('u1', 'mairie', 3, 30);
    expect(resultat.progres).toMatchObject({ etapes: 3, cycles: 1, seances: 10 });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 6, argentVirtuel: 0, reputation: 0 });
    expect(progression.validerCompetence).not.toHaveBeenCalled();
  });

  it('la dernière étape boucle le cycle, puis le suivant repart de la première', async () => {
    const prisma = fakePrisma({ progresLieux: { fournisseur: { etapes: 4, cycles: 0, seances: 4 } } });
    const { svc } = await service(prisma);
    const fin = await svc.seance('u1', 'fournisseur', 4, 80);
    expect(fin.progres).toMatchObject({ etapes: 5, cycles: 1 });
    expect(fin.gains.reputation).toBe(3);
    // Le cycle suivant commence à l'étape 0, plus tard (hors délai de récompense).
    prisma.userCarriere.update({ data: { progresLieux: { fournisseur: { ...fin.progres, derniereRecompenseLe: new Date(Date.now() - DELAI_RECOMPENSE_MS).toISOString() } } } });
    const suite = await svc.seance('u1', 'fournisseur', 0, 80);
    expect(suite.progres).toMatchObject({ etapes: 1, cycles: 1 });
  });

  it('dans les 20 minutes d’une séance payée : entraînement, la progression avance sans argent', async () => {
    const recente = new Date(Date.now() - 5 * 60_000).toISOString();
    const prisma = fakePrisma({ progresLieux: { laboratoire: { etapes: 1, cycles: 0, seances: 1, derniereRecompenseLe: recente } } });
    const { svc, progression } = await service(prisma);
    const resultat = await svc.seance('u1', 'laboratoire', 1, 100);
    expect(resultat.gains).toMatchObject({ xp: 13, argent: 0, reputation: 0, entrainement: true });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 13, argentVirtuel: 0, reputation: 0 });
    expect(progression.validerCompetence).not.toHaveBeenCalled();
    expect(progresEcrit(prisma, 'laboratoire')).toMatchObject({ etapes: 2, derniereRecompenseLe: recente });
    expect(Date.parse(resultat.gains.prochaineRecompenseLe)).toBe(Date.parse(recente) + DELAI_RECOMPENSE_MS);
  });
});
