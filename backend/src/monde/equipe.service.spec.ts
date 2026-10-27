import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { coequipiersPresents, EquipeService, facteurEquipe, REGLES_EQUIPE } from './equipe.service';

const MAINTENANT = new Date('2026-10-27T12:00:00.000Z');
const ilYa = (ms: number) => new Date(MAINTENANT.getTime() - ms);

type Joueur = { id: string; pseudo: string; banni?: boolean; vuLe?: Date | null; lieu?: string | null };

/** Base en mémoire : joueurs (et leur présence), équipes, membres et invitations, avec les requêtes du service. */
function fakePrisma(joueurs: Joueur[]) {
  const users = new Map(joueurs.map((j) => [j.id, j]));
  const equipes = new Map<string, { id: string; chefId: string }>();
  const membres = new Map<string, { userId: string; equipeId: string; rejointLe: number }>();
  const invitations = new Map<string, { id: string; equipeId: string; deId: string; versId: string; creeLe: Date }>();
  let horloge = 0, numero = 0;
  const avecNom = (id: string) => ({ pseudo: users.get(id)!.pseudo, avatar: null });
  const presence = (id: string) => (users.get(id)?.vuLe ? { majLe: users.get(id)!.vuLe!, lieu: users.get(id)!.lieu ?? null } : null);
  const membresDe = (equipeId: string) => [...membres.values()].filter((m) => m.equipeId === equipeId).sort((a, b) => a.rejointLe - b.rejointLe);
  const prisma = {
    presenceMonde: {
      findUnique: jest.fn(({ where }) => Promise.resolve(users.get(where.userId)?.vuLe ? { majLe: users.get(where.userId)!.vuLe, user: { banni: !!users.get(where.userId)!.banni } } : null)),
      findMany: jest.fn(({ where }) => Promise.resolve([...users.values()]
        .filter((u) => u.id !== where.userId.not && u.lieu === where.lieu && u.vuLe && u.vuLe >= where.majLe.gte && !u.banni && membres.get(u.id)?.equipeId === where.user.membreEquipe.equipeId)
        .map((u) => ({ user: avecNom(u.id) })))),
    },
    membreEquipe: {
      findUnique: jest.fn(({ where }) => {
        const m = membres.get(where.userId);
        if (!m) return Promise.resolve(null);
        const equipe = equipes.get(m.equipeId)!;
        return Promise.resolve({ ...m, equipe: { ...equipe, membres: membresDe(m.equipeId).map((x) => ({ userId: x.userId, user: { ...avecNom(x.userId), presenceMonde: presence(x.userId) } })) } });
      }),
      count: jest.fn(({ where }) => Promise.resolve(membresDe(where.equipeId).length)),
      findFirst: jest.fn(({ where }) => Promise.resolve(membresDe(where.equipeId).find((m) => !where.userId || m.userId === where.userId) ?? null)),
      create: jest.fn(({ data }) => { membres.set(data.userId, { ...data, rejointLe: ++horloge }); return Promise.resolve(data); }),
      delete: jest.fn(({ where }) => { membres.delete(where.userId); return Promise.resolve({}); }),
    },
    equipeQuartier: {
      create: jest.fn(({ data }) => {
        const equipe = { id: `e${++numero}`, chefId: data.chefId };
        equipes.set(equipe.id, equipe);
        membres.set(data.membres.create.userId, { userId: data.membres.create.userId, equipeId: equipe.id, rejointLe: ++horloge });
        return Promise.resolve(equipe);
      }),
      update: jest.fn(({ where, data }) => { Object.assign(equipes.get(where.id)!, data); return Promise.resolve(equipes.get(where.id)); }),
      delete: jest.fn(({ where }) => {
        equipes.delete(where.id);
        for (const [id, i] of invitations) if (i.equipeId === where.id) invitations.delete(id);
        return Promise.resolve({});
      }),
    },
    invitationEquipe: {
      upsert: jest.fn(({ where, create, update }) => {
        const existante = [...invitations.values()].find((i) => i.equipeId === where.equipeId_versId.equipeId && i.versId === where.equipeId_versId.versId);
        if (existante) Object.assign(existante, update);
        else { const i = { id: `i${++numero}`, creeLe: MAINTENANT, ...create }; invitations.set(i.id, i); }
        return Promise.resolve({});
      }),
      findUnique: jest.fn(({ where }) => Promise.resolve(invitations.get(where.id) ?? null)),
      delete: jest.fn(({ where }) => { invitations.delete(where.id); return Promise.resolve({}); }),
      findMany: jest.fn(({ where }) => Promise.resolve([...invitations.values()].filter((i) => i.versId === where.versId).map((i) => ({ id: i.id, de: avecNom(i.deId) })))),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return { prisma, equipes, membres, invitations };
}
async function service(prisma: ReturnType<typeof fakePrisma>['prisma']) {
  const module = await Test.createTestingModule({ providers: [EquipeService, { provide: PrismaService, useValue: prisma }] }).compile();
  return module.get(EquipeService);
}
const connecte = (id: string, pseudo: string, surcharge: Partial<Joueur> = {}): Joueur => ({ id, pseudo, vuLe: ilYa(5_000), ...surcharge });

describe('EquipeService', () => {
  it('invite un voisin connecté : l’équipe se crée avec l’inviteur pour chef, et l’invité voit l’invitation', async () => {
    const base = fakePrisma([connecte('u1', 'aya'), connecte('u2', 'kader')]);
    const svc = await service(base.prisma);
    const etat = await svc.inviter('u1', 'u2', MAINTENANT);
    expect(etat.equipe).toMatchObject({ chefId: 'u1', membres: [{ userId: 'u1', nom: 'aya', enLigne: true }] });
    await expect(svc.etat('u2', MAINTENANT)).resolves.toMatchObject({ equipe: null, invitations: [{ de: 'aya' }] });
  });
  it('refuse de s’inviter soi-même, un voisin déconnecté ou banni, et un membre déjà dans l’équipe', async () => {
    const base = fakePrisma([connecte('u1', 'aya'), connecte('u2', 'kader', { vuLe: ilYa(60_000) }), connecte('u3', 'ines', { banni: true }), connecte('u4', 'yao')]);
    const svc = await service(base.prisma);
    await expect(svc.inviter('u1', 'u1', MAINTENANT)).rejects.toThrow(BadRequestException);
    await expect(svc.inviter('u1', 'u2', MAINTENANT)).rejects.toThrow('plus connecté');
    await expect(svc.inviter('u1', 'u3', MAINTENANT)).rejects.toThrow('plus connecté');
    await svc.inviter('u1', 'u4', MAINTENANT);
    const invitation = [...base.invitations.values()][0];
    await svc.repondre('u4', invitation.id, true, MAINTENANT);
    await expect(svc.inviter('u1', 'u4', MAINTENANT)).rejects.toThrow(ConflictException);
  });
  it('accepter fait quitter l’ancienne équipe, qui disparaît si elle se vide ; refuser ne change rien', async () => {
    const base = fakePrisma([connecte('u1', 'aya'), connecte('u2', 'kader'), connecte('u3', 'ines')]);
    const svc = await service(base.prisma);
    await svc.inviter('u2', 'u3', MAINTENANT); // u2 a sa propre équipe
    await svc.inviter('u1', 'u2', MAINTENANT);
    const pourKader = [...base.invitations.values()].find((i) => i.versId === 'u2')!;
    const pourInes = [...base.invitations.values()].find((i) => i.versId === 'u3')!;
    await expect(svc.repondre('u1', pourKader.id, true, MAINTENANT)).rejects.toThrow(NotFoundException);
    const etat = await svc.repondre('u2', pourKader.id, true, MAINTENANT);
    expect(etat.equipe?.membres.map((m) => m.userId)).toEqual(['u1', 'u2']);
    expect(base.equipes.size).toBe(1);
    expect(base.invitations.has(pourInes.id)).toBe(false); // l'équipe de Kader a disparu avec son invitation
    await svc.inviter('u1', 'u3', MAINTENANT);
    const nouvelle = [...base.invitations.values()].find((i) => i.versId === 'u3')!;
    await expect(svc.repondre('u3', nouvelle.id, false, MAINTENANT)).resolves.toMatchObject({ equipe: null, invitations: [] });
  });
  it('limite une équipe à quatre joueurs', async () => {
    const joueurs = ['u1', 'u2', 'u3', 'u4', 'u5'].map((id) => connecte(id, id));
    const base = fakePrisma(joueurs);
    const svc = await service(base.prisma);
    for (const id of ['u2', 'u3', 'u4']) {
      await svc.inviter('u1', id, MAINTENANT);
      const invitation = [...base.invitations.values()].find((i) => i.versId === id)!;
      await svc.repondre(id, invitation.id, true, MAINTENANT);
    }
    expect(base.membres.size).toBe(REGLES_EQUIPE.membresMax);
    await expect(svc.inviter('u1', 'u5', MAINTENANT)).rejects.toThrow('4 joueurs au plus');
  });
  it('quand le chef part, le plus ancien membre prend la tête ; le dernier qui part dissout l’équipe', async () => {
    const base = fakePrisma([connecte('u1', 'aya'), connecte('u2', 'kader')]);
    const svc = await service(base.prisma);
    await svc.inviter('u1', 'u2', MAINTENANT);
    await svc.repondre('u2', [...base.invitations.values()][0].id, true, MAINTENANT);
    await expect(svc.quitter('u1', MAINTENANT)).resolves.toMatchObject({ equipe: null });
    await expect(svc.etat('u2', MAINTENANT)).resolves.toMatchObject({ equipe: { chefId: 'u2', membres: [{ userId: 'u2' }] } });
    await svc.quitter('u2', MAINTENANT);
    expect(base.equipes.size).toBe(0);
  });
});

describe('le travail d’équipe', () => {
  it('ne compte que les coéquipiers signalés récemment dans le même lieu', async () => {
    const base = fakePrisma([
      connecte('u1', 'aya', { lieu: 'laboratoire' }), connecte('u2', 'kader', { lieu: 'laboratoire' }),
      connecte('u3', 'ines', { lieu: 'mairie' }), connecte('u4', 'yao', { lieu: 'laboratoire', vuLe: ilYa(50_000) }), connecte('u5', 'awa', { lieu: 'laboratoire' }),
    ]);
    const svc = await service(base.prisma);
    for (const id of ['u2', 'u3', 'u4']) {
      // Invités il y a 30 s, quand tous étaient connectés ; Yao ne s'est plus signalé depuis 50 s.
      await svc.inviter('u1', id, ilYa(30_000));
      await svc.repondre(id, [...base.invitations.values()].find((i) => i.versId === id)!.id, true, MAINTENANT);
    }
    // Kader est au laboratoire ; Inès est ailleurs, Yao n'est plus connecté, Awa n'est pas de l'équipe.
    await expect(coequipiersPresents(base.prisma as never, 'u1', 'laboratoire', MAINTENANT)).resolves.toEqual(['kader']);
    await expect(coequipiersPresents(base.prisma as never, 'u5', 'laboratoire', MAINTENANT)).resolves.toEqual([]);
    expect(facteurEquipe(['kader'])).toBeCloseTo(1 + REGLES_EQUIPE.bonusXp);
    expect(facteurEquipe([])).toBe(1);
  });
});
