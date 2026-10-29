import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EnLigneService, nettoyerMessage, nomPublic, REGLES_EN_LIGNE } from './en-ligne.service';

const MAINTENANT = new Date('2026-10-26T18:00:00.000Z');
const ilYa = (ms: number) => new Date(MAINTENANT.getTime() - ms);
const voisin = (surcharge: Record<string, unknown> = {}) => ({
  userId: 'u2', x: 10, z: -20, lieu: null, emote: 'salut', emoteLe: ilYa(2_000),
  user: { pseudo: 'kader225', banni: false, avatar: { nomPersonnage: 'Kader', config: { personnage: 'awa' } } },
  ...surcharge,
});

describe('le chat du quartier', () => {
  it('nettoie les messages et refuse le vide, le trop long et les liens', () => {
    expect(nettoyerMessage('  Bonjour\n\tle   quartier ​ ')).toBe('Bonjour le quartier');
    expect(() => nettoyerMessage('   ')).toThrow(BadRequestException);
    expect(() => nettoyerMessage('a'.repeat(REGLES_EN_LIGNE.longueurMessage + 1))).toThrow(BadRequestException);
    expect(() => nettoyerMessage('Viens voir https://exemple.org')).toThrow('Les liens ne passent pas');
    expect(() => nettoyerMessage('promo sur casques-pas-chers.com')).toThrow(BadRequestException);
    expect(nettoyerMessage('Rendez-vous à 14 h. au dépôt, il reste 3,5 m³ de béton')).toContain('3,5 m³');
  });
  it('montre le nom du personnage ou le pseudo, jamais le nom réel', () => {
    expect(nomPublic({ pseudo: 'kader225', avatar: { nomPersonnage: 'Kader' } })).toBe('Kader');
    expect(nomPublic({ pseudo: 'kader225', avatar: null })).toBe('kader225');
    expect(nomPublic({ pseudo: null, avatar: null })).toBe('Bâtisseur');
  });
});

function fakePrisma(overrides: { voisins?: unknown[]; dernier?: { texte: string; createdAt: Date } | null; banni?: boolean; signale?: { userId: string; masque: boolean } | null; enAttente?: number } = {}) {
  return {
    presenceMonde: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue(overrides.voisins ?? [voisin()]),
    },
    messageQuartier: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'm2', texte: 'Qui vient au maquis ?', createdAt: ilYa(1_000), userId: 'u2', user: voisin().user },
        { id: 'm1', texte: 'Salut le quartier', createdAt: ilYa(60_000), userId: 'u3', user: { pseudo: 'awa', banni: false, avatar: null } },
      ]),
      findFirst: jest.fn().mockResolvedValue(overrides.dernier ?? null),
      create: jest.fn().mockResolvedValue({ id: 'm3', createdAt: MAINTENANT }),
      findUnique: jest.fn().mockResolvedValue(overrides.signale === undefined ? { userId: 'u2', masque: false } : overrides.signale),
      update: jest.fn().mockResolvedValue({}),
    },
    signalementMessage: {
      create: jest.fn().mockResolvedValue({ id: 's1' }),
      count: jest.fn().mockResolvedValue(overrides.enAttente ?? 1),
    },
    user: { findUnique: jest.fn().mockResolvedValue({ pseudo: 'moi', banni: overrides.banni ?? false, avatar: { nomPersonnage: 'Aya' } }) },
  };
}
async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({ providers: [EnLigneService, { provide: PrismaService, useValue: prisma }] }).compile();
  return module.get(EnLigneService);
}

describe('EnLigneService', () => {
  it('enregistre la position bornée à la ville et l’émote, puis renvoie les voisins récents', async () => {
    const prisma = fakePrisma();
    const svc = await service(prisma);
    const voisins = await svc.signaler('u1', { x: 900, z: -40, emote: 'danse' }, MAINTENANT);
    expect(prisma.presenceMonde.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1' },
      update: { x: 118, z: -40, lieu: null, emote: 'danse', emoteLe: MAINTENANT },
    }));
    const filtre = prisma.presenceMonde.findMany.mock.calls[0][0].where;
    expect(filtre).toEqual({ userId: { not: 'u1' }, majLe: { gte: ilYa(REGLES_EN_LIGNE.presenceMs) }, user: { banni: false } });
    expect(voisins).toEqual([{ userId: 'u2', nom: 'Kader', avatarConfig: { personnage: 'awa' }, x: 10, z: -20, lieu: null, emote: 'salut' }]);
  });
  it('ignore une émote inconnue et éteint celles de plus de quelques secondes', async () => {
    const prisma = fakePrisma({ voisins: [voisin({ emoteLe: ilYa(REGLES_EN_LIGNE.emoteMs + 1) })] });
    const svc = await service(prisma);
    const voisins = await svc.signaler('u1', { x: 0, z: 0, emote: 'insulte' }, MAINTENANT);
    expect(prisma.presenceMonde.upsert.mock.calls[0][0].update).toEqual({ x: 0, z: 0, lieu: null });
    expect(voisins[0].emote).toBeNull();
  });
  it('rend les messages dans l’ordre de lecture, sans les messages retirés ni ceux des comptes bannis', async () => {
    const prisma = fakePrisma();
    const svc = await service(prisma);
    const messages = await svc.messages();
    expect(messages.map((m) => [m.nom, m.texte])).toEqual([['awa', 'Salut le quartier'], ['Kader', 'Qui vient au maquis ?']]);
    expect(prisma.messageQuartier.findMany.mock.calls[0][0].where).toEqual({ masque: false, user: { banni: false } });
    await svc.messages(ilYa(5_000).toISOString());
    expect(prisma.messageQuartier.findMany.mock.calls[1][0].where).toEqual({ masque: false, user: { banni: false }, createdAt: { gt: ilYa(5_000) } });
  });
  it('masque les grossièretés et retire les numéros avant de publier, et refuse un message qui n’était qu’une insulte', async () => {
    const prisma = fakePrisma();
    const svc = await service(prisma);
    await expect(svc.ecrire('u1', 'Quel connard, appelle au 07 08 09 10 11', MAINTENANT)).resolves.toMatchObject({ texte: 'Quel *******, appelle au [numéro masqué]', modere: true });
    expect(prisma.messageQuartier.create).toHaveBeenCalledWith(expect.objectContaining({ data: { userId: 'u1', texte: 'Quel *******, appelle au [numéro masqué]' } }));
    await expect(svc.ecrire('u1', 'On coule demain', MAINTENANT)).resolves.toMatchObject({ modere: false });
    await expect(svc.ecrire('u1', 'CONNARD !!!', MAINTENANT)).rejects.toThrow('reste correct');
    await expect(svc.ecrire('u1', '0708091011', MAINTENANT)).rejects.toThrow('reste correct');
  });
  it('publie un message, mais pas en rafale, pas deux fois le même, et pas depuis un compte banni', async () => {
    const svc = await service(fakePrisma());
    await expect(svc.ecrire('u1', ' On coule demain ! ', MAINTENANT)).resolves.toMatchObject({ id: 'm3', nom: 'Aya', texte: 'On coule demain !' });
    await expect((await service(fakePrisma({ dernier: { texte: 'Salut', createdAt: ilYa(1_000) } }))).ecrire('u1', 'Encore', MAINTENANT)).rejects.toThrow(BadRequestException);
    await expect((await service(fakePrisma({ dernier: { texte: 'Salut', createdAt: ilYa(10_000) } }))).ecrire('u1', 'salut', MAINTENANT)).rejects.toThrow('même chose');
    await expect((await service(fakePrisma({ banni: true }))).ecrire('u1', 'Bonjour', MAINTENANT)).rejects.toThrow(ForbiddenException);
  });
});

describe('les signalements du chat', () => {
  it('enregistre le signalement d’un message d’un autre joueur', async () => {
    const prisma = fakePrisma();
    await expect((await service(prisma)).signalerMessage('u1', 'm2', 'insulte')).resolves.toEqual({ signale: true, retire: false });
    expect(prisma.signalementMessage.create).toHaveBeenCalledWith({ data: { messageId: 'm2', signaleurId: 'u1', motif: 'insulte' } });
    expect(prisma.messageQuartier.update).not.toHaveBeenCalled();
  });
  it('retire le message du chat au troisième signalement en attente', async () => {
    const prisma = fakePrisma({ enAttente: REGLES_EN_LIGNE.signalementsPourRetirer });
    await expect((await service(prisma)).signalerMessage('u1', 'm2', 'harcelement')).resolves.toEqual({ signale: true, retire: true });
    expect(prisma.signalementMessage.count).toHaveBeenCalledWith({ where: { messageId: 'm2', traiteLe: null } });
    expect(prisma.messageQuartier.update).toHaveBeenCalledWith({ where: { id: 'm2' }, data: { masque: true } });
  });
  it('ne compte qu’une fois le même joueur, refuse son propre message et un message disparu', async () => {
    const deja = fakePrisma();
    deja.signalementMessage.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' }));
    await expect((await service(deja)).signalerMessage('u1', 'm2', 'spam')).resolves.toEqual({ signale: true, retire: false });
    expect(deja.signalementMessage.count).not.toHaveBeenCalled();
    await expect((await service(fakePrisma({ signale: { userId: 'u1', masque: false } }))).signalerMessage('u1', 'm2', 'spam')).rejects.toThrow(BadRequestException);
    await expect((await service(fakePrisma({ signale: null }))).signalerMessage('u1', 'm9', 'spam')).rejects.toThrow(NotFoundException);
  });
});
