import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AdminModerationController } from './admin-moderation.controller';

const AUTEUR = { id: 'u2', email: 'kader@exemple.ci', pseudo: 'kader225', banni: false };
const MESSAGE = { id: 'm1', texte: 'Quel *******', masque: true, createdAt: new Date('2026-10-29T08:00:00.000Z'), user: AUTEUR };

function fakePrisma(overrides: { message?: { userId: string } | null } = {}) {
  const prisma = {
    signalementMessage: {
      findMany: jest.fn().mockResolvedValue([
        { motif: 'insulte', creeLe: new Date('2026-10-29T08:05:00.000Z'), traiteLe: null, decision: null, message: MESSAGE },
        { motif: 'insulte', creeLe: new Date('2026-10-29T08:03:00.000Z'), traiteLe: null, decision: null, message: MESSAGE },
        { motif: 'harcelement', creeLe: new Date('2026-10-29T08:02:00.000Z'), traiteLe: null, decision: null, message: MESSAGE },
        { motif: 'spam', creeLe: new Date('2026-10-29T07:00:00.000Z'), traiteLe: null, decision: null, message: { ...MESSAGE, id: 'm2', texte: 'Achetez', masque: false } },
      ]),
      updateMany: jest.fn().mockReturnValue('signalements traités'),
    },
    messageQuartier: {
      findUnique: jest.fn().mockResolvedValue(overrides.message === undefined ? { userId: 'u2' } : overrides.message),
      update: jest.fn().mockReturnValue('message mis à jour'),
    },
    user: { update: jest.fn().mockReturnValue('auteur banni') },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  return prisma;
}
async function controleur(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({ controllers: [AdminModerationController], providers: [{ provide: PrismaService, useValue: prisma }] }).compile();
  return module.get(AdminModerationController);
}

describe('AdminModerationController', () => {
  it('regroupe les signalements en attente par message, avec le décompte des motifs', async () => {
    const prisma = fakePrisma();
    const liste = await (await controleur(prisma)).signalements();
    expect(prisma.signalementMessage.findMany.mock.calls[0][0].where).toEqual({ traiteLe: null });
    expect(liste).toEqual([
      expect.objectContaining({ messageId: 'm1', texte: 'Quel *******', retire: true, auteur: AUTEUR, signalements: 3, motifs: { insulte: 2, harcelement: 1 }, dernierLe: '2026-10-29T08:05:00.000Z' }),
      expect.objectContaining({ messageId: 'm2', signalements: 1, motifs: { spam: 1 }, retire: false }),
    ]);
    await (await controleur(prisma)).signalements('1');
    expect(prisma.signalementMessage.findMany.mock.calls[1][0].where).toEqual({ traiteLe: { not: null } });
  });

  it('bannir retire le message, clôt ses signalements et bannit l’auteur, en une transaction', async () => {
    const prisma = fakePrisma();
    await expect((await controleur(prisma)).decider('m1', { decision: 'bannir' })).resolves.toEqual({ messageId: 'm1', decision: 'banni' });
    expect(prisma.messageQuartier.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { masque: true } });
    expect(prisma.signalementMessage.updateMany).toHaveBeenCalledWith({ where: { messageId: 'm1', traiteLe: null }, data: { traiteLe: expect.any(Date), decision: 'banni' } });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u2' }, data: { banni: true } });
    expect(prisma.$transaction).toHaveBeenCalledWith(['message mis à jour', 'signalements traités', 'auteur banni']);
  });

  it('écarter remet le message dans le chat sans toucher au compte', async () => {
    const prisma = fakePrisma();
    await expect((await controleur(prisma)).decider('m1', { decision: 'ecarter' })).resolves.toEqual({ messageId: 'm1', decision: 'ecarte' });
    expect(prisma.messageQuartier.update).toHaveBeenCalledWith({ where: { id: 'm1' }, data: { masque: false } });
    expect(prisma.user.update).not.toHaveBeenCalled();
    await expect((await controleur(fakePrisma({ message: null }))).decider('m9', { decision: 'retirer' })).rejects.toThrow(NotFoundException);
  });
});
