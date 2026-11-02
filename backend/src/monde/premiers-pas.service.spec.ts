import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { ETAPES_PREMIERS_PAS, lirePremiersPas, NIVEAU_MAX_GUIDE, PremiersPasService, RECOMPENSES_PREMIERS_PAS } from './premiers-pas.service';

// Par défaut, une séance réussie est enregistrée au laboratoire : l'étape « première paie » est payable.
const SEANCE_REUSSIE = { laboratoire: { etapes: 1, cycles: 0, seances: 1, derniereRecompenseLe: null } };
const SANS_SEANCE = { laboratoire: { etapes: 0, cycles: 0, seances: 2, derniereRecompenseLe: null } };
function fakePrisma(overrides: { premiersPas?: unknown; niveau?: number; progresLieux?: unknown; chantierQuartier?: unknown } = {}) {
  const etat: Record<string, unknown> = {
    userId: 'u1', premiersPas: overrides.premiersPas ?? null, niveau: overrides.niveau ?? 1,
    progresLieux: 'progresLieux' in overrides ? overrides.progresLieux : SEANCE_REUSSIE, chantierQuartier: overrides.chantierQuartier ?? null,
  };
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

describe('la première journée guidée', () => {
  it('renvoie la récompense validée même si sa notification échoue', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    progression.notifierNiveau.mockRejectedValueOnce(new Error('Indisponible'));
    await expect(svc.valider('u1', 'logement')).resolves.toMatchObject({ faites: ['logement'], recompense: RECOMPENSES_PREMIERS_PAS.etape });
    await expect(svc.valider('u1', 'logement')).resolves.toMatchObject({ recompense: null });
    expect(progression.appliquerDelta).toHaveBeenCalledTimes(1);
  });
  it('recommence un conflit annulé par PostgreSQL', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    prisma.$transaction.mockRejectedValueOnce({ code: 'P2034' });
    await expect(svc.valider('u1', 'logement')).resolves.toMatchObject({ faites: ['logement'] });
    expect(progression.appliquerDelta).toHaveBeenCalledTimes(1);
  });
  it('ne garde que les étapes connues, une fois chacune et dans l’ordre du guide', () => {
    expect(lirePremiersPas({ faites: ['paie', 'inconnue', 'logement', 'logement'], termineLe: 'pas une date' })).toEqual({ faites: ['logement', 'paie'], termineLe: null });
    expect(lirePremiersPas(null)).toEqual({ faites: [], termineLe: null });
  });
  it('compte la séance réussie de l’ancien guide comme la première paie, et oublie ses autres gestes', () => {
    expect(lirePremiersPas({ faites: ['deplacement', 'telephone', 'lieu', 'seance', 'quartier'], termineLe: null })).toEqual({ faites: ['travail'], termineLe: null });
  });
  it('récompense chaque étape une seule fois', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    await expect(svc.valider('u1', 'logement')).resolves.toMatchObject({ faites: ['logement'], afficher: true, recompense: RECOMPENSES_PREMIERS_PAS.etape });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', RECOMPENSES_PREMIERS_PAS.etape, prisma);
    expect(progression.notifierNiveau).toHaveBeenCalledWith('u1', 1, 2);
    await expect(svc.valider('u1', 'logement')).resolves.toMatchObject({ faites: ['logement'], recompense: null });
    expect(progression.appliquerDelta).toHaveBeenCalledTimes(1);
    await expect(svc.valider('u1', 'sauter')).rejects.toThrow(BadRequestException);
  });
  it('suit la journée : on vérifie sa paie une fois payé, puis on choisit son prochain objectif', async () => {
    const { prisma } = fakePrisma();
    const svc = await service(prisma);
    await expect(svc.valider('u1', 'paie')).rejects.toThrow('Gagne d’abord ta première paie');
    await expect(svc.valider('u1', 'objectif')).rejects.toThrow('Vérifie d’abord ta paie');
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
    await expect(svc.valider('u1', 'travail')).resolves.toMatchObject({ faites: ['travail'] });
    await expect(svc.valider('u1', 'paie')).resolves.toMatchObject({ faites: ['travail', 'paie'] });
    await expect(svc.valider('u1', 'objectif')).resolves.toMatchObject({ faites: ['travail', 'paie', 'objectif'], afficher: true });
  });
  it('ajoute le bonus de fin à la dernière étape, puis le guide ne s’affiche plus', async () => {
    const { prisma, etat } = fakePrisma({ premiersPas: { faites: ['travail', 'paie', 'objectif'], termineLe: null } });
    const svc = await service(prisma);
    const r = await svc.valider('u1', 'logement');
    expect(r).toMatchObject({ faites: [...ETAPES_PREMIERS_PAS], afficher: false });
    expect(r.recompense).toEqual({ argentVirtuel: 2_500, xp: 65 });
    expect(etat.premiersPas).toMatchObject({ termineLe: expect.any(String) });
  });
  it('un guide fini ne paie plus rien, pas même une étape que l’ancien guide n’avait pas', async () => {
    const { prisma } = fakePrisma({ premiersPas: { faites: ['deplacement', 'telephone', 'lieu', 'seance', 'quartier'], termineLe: '2026-10-20T10:00:00.000Z' } });
    const svc = await service(prisma);
    await expect(svc.valider('u1', 'logement')).resolves.toMatchObject({ afficher: false, recompense: null });
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
  });
  it('ne paie pas un joueur qui connaît déjà le jeu', async () => {
    const { prisma } = fakePrisma({ niveau: NIVEAU_MAX_GUIDE + 1 });
    await expect((await service(prisma)).valider('u1', 'logement')).rejects.toThrow(ForbiddenException);
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
  });
  it('ne paie la première paie qu’une fois une séance réussie ou une journée avec Yao enregistrée', async () => {
    const rien = fakePrisma({ progresLieux: SANS_SEANCE });
    await expect((await service(rien.prisma)).valider('u1', 'travail')).rejects.toThrow(BadRequestException);
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
    const avecSeance = fakePrisma();
    await expect((await service(avecSeance.prisma)).valider('u1', 'travail')).resolves.toMatchObject({ faites: ['travail'], recompense: RECOMPENSES_PREMIERS_PAS.etape });
    const avecJournee = fakePrisma({ progresLieux: SANS_SEANCE, chantierQuartier: { jours: 1, journees: 1, livraisons: 0, derniereRecompenseLe: '2026-10-30T09:00:00.000Z' } });
    await expect((await service(avecJournee.prisma)).valider('u1', 'travail')).resolves.toMatchObject({ faites: ['travail'], recompense: RECOMPENSES_PREMIERS_PAS.etape });
  });
  it('ne montre pas le guide à un joueur qui connaît déjà le jeu', async () => {
    const { prisma } = fakePrisma({ niveau: NIVEAU_MAX_GUIDE + 1 });
    await expect((await service(prisma)).etat('u1')).resolves.toMatchObject({ faites: [], afficher: false });
  });
});
