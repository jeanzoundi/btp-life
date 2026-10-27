import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { ETAPES_PREMIERS_PAS, lirePremiersPas, NIVEAU_MAX_GUIDE, PremiersPasService, RECOMPENSES_PREMIERS_PAS } from './premiers-pas.service';

function fakePrisma(overrides: { premiersPas?: unknown; niveau?: number } = {}) {
  const etat: Record<string, unknown> = { userId: 'u1', premiersPas: overrides.premiersPas ?? null, niveau: overrides.niveau ?? 1 };
  const prisma = {
    userCarriere: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...etat })),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { Object.assign(etat, data); return Promise.resolve({ ...etat }); }),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return { prisma, etat };
}
const progression = { appliquerDelta: jest.fn(), notifierNiveau: jest.fn().mockResolvedValue(undefined) };
async function service(prisma: ReturnType<typeof fakePrisma>['prisma']) {
  progression.appliquerDelta.mockReset().mockResolvedValue({ niveau: 2 });
  progression.notifierNiveau.mockClear();
  const module = await Test.createTestingModule({
    providers: [PremiersPasService, { provide: PrismaService, useValue: prisma }, { provide: ProgressionService, useValue: progression }],
  }).compile();
  return module.get(PremiersPasService);
}

describe('le premier quart d’heure guidé', () => {
  it('renvoie la récompense validée même si sa notification échoue', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    progression.notifierNiveau.mockRejectedValueOnce(new Error('Indisponible'));
    await expect(svc.valider('u1', 'telephone')).resolves.toMatchObject({ faites: ['telephone'], recompense: RECOMPENSES_PREMIERS_PAS.etape });
    await expect(svc.valider('u1', 'telephone')).resolves.toMatchObject({ recompense: null });
    expect(progression.appliquerDelta).toHaveBeenCalledTimes(1);
  });
  it('recommence un conflit annulé par PostgreSQL', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    prisma.$transaction.mockRejectedValueOnce({ code: 'P2034' });
    await expect(svc.valider('u1', 'telephone')).resolves.toMatchObject({ faites: ['telephone'] });
    expect(progression.appliquerDelta).toHaveBeenCalledTimes(1);
  });
  it('ne garde que les étapes connues, une fois chacune et dans l’ordre du guide', () => {
    expect(lirePremiersPas({ faites: ['quartier', 'inconnue', 'telephone', 'telephone'], termineLe: 'pas une date' })).toEqual({ faites: ['telephone', 'quartier'], termineLe: null });
    expect(lirePremiersPas(null)).toEqual({ faites: [], termineLe: null });
  });
  it('récompense chaque étape une seule fois', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    await expect(svc.valider('u1', 'telephone')).resolves.toMatchObject({ faites: ['telephone'], afficher: true, recompense: RECOMPENSES_PREMIERS_PAS.etape });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', RECOMPENSES_PREMIERS_PAS.etape, prisma);
    expect(progression.notifierNiveau).toHaveBeenCalledWith('u1', 1, 2);
    await expect(svc.valider('u1', 'telephone')).resolves.toMatchObject({ faites: ['telephone'], recompense: null });
    expect(progression.appliquerDelta).toHaveBeenCalledTimes(1);
    await expect(svc.valider('u1', 'sauter')).rejects.toThrow(BadRequestException);
  });
  it('ajoute le bonus de fin à la dernière étape, puis le guide ne s’affiche plus', async () => {
    const { prisma, etat } = fakePrisma({ premiersPas: { faites: ['deplacement', 'telephone', 'lieu', 'seance'], termineLe: null } });
    const svc = await service(prisma);
    const r = await svc.valider('u1', 'quartier');
    expect(r).toMatchObject({ faites: [...ETAPES_PREMIERS_PAS], afficher: false });
    expect(r.recompense).toEqual({ argentVirtuel: 2_500, xp: 65 });
    expect(etat.premiersPas).toMatchObject({ termineLe: expect.any(String) });
  });
  it('ne montre pas le guide à un joueur qui connaît déjà le jeu', async () => {
    const { prisma } = fakePrisma({ niveau: NIVEAU_MAX_GUIDE + 1 });
    await expect((await service(prisma)).etat('u1')).resolves.toMatchObject({ faites: [], afficher: false });
  });
});
