import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    user: { update: jest.fn().mockResolvedValue({ id: 'u1', nom: 'Kouassi', passwordHash: 'secret-hash' }) },
    userCompetence: { findMany: jest.fn().mockResolvedValue([]) },
    userLogiciel: { findMany: jest.fn().mockResolvedValue([]) },
    userBadge: { findMany: jest.fn().mockResolvedValue([]) },
    userCertificat: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    userMessage: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of new Set([...Object.keys(defaut), ...Object.keys(overrides)])) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({
    providers: [UsersService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return { svc: module.get(UsersService), prisma };
}

describe('UsersService.update', () => {
  it('ne renvoie jamais le hash du mot de passe après une mise à jour du profil', async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    const resultat = await svc.update('u1', { nom: 'Kouassi' } as never);
    expect(resultat).not.toHaveProperty('passwordHash');
    expect(resultat).toEqual({ id: 'u1', nom: 'Kouassi' });
  });
});

describe('UsersService — listes annexes (compétences, logiciels, badges, certificats)', () => {
  it('renvoie les compétences du joueur avec le détail de la compétence', async () => {
    const prisma = fakePrisma({ userCompetence: { findMany: jest.fn().mockResolvedValue([{ competence: { nom: 'Béton' }, niveauActuel: 2 }]) } });
    const { svc } = await service(prisma);
    expect(await svc.competences('u1')).toEqual([{ competence: { nom: 'Béton' }, niveauActuel: 2 }]);
  });

  it('renvoie les logiciels maîtrisés par le joueur', async () => {
    const prisma = fakePrisma({ userLogiciel: { findMany: jest.fn().mockResolvedValue([{ logiciel: { nom: 'Excel' }, niveauMaitrise: 3 }]) } });
    const { svc } = await service(prisma);
    expect(await svc.logiciels('u1')).toEqual([{ logiciel: { nom: 'Excel' }, niveauMaitrise: 3 }]);
  });

  it('renvoie les badges du joueur', async () => {
    const prisma = fakePrisma({ userBadge: { findMany: jest.fn().mockResolvedValue([{ badge: { nom: 'Sécurité' } }]) } });
    const { svc } = await service(prisma);
    expect(await svc.badges('u1')).toEqual([{ badge: { nom: 'Sécurité' } }]);
  });

  it('renvoie les certificats du joueur', async () => {
    const prisma = fakePrisma({ userCertificat: { findMany: jest.fn().mockResolvedValue([{ certificat: { nom: 'HSE' } }]) } });
    const { svc } = await service(prisma);
    expect(await svc.certificats('u1')).toEqual([{ certificat: { nom: 'HSE' } }]);
  });
});

describe('UsersService — notifications et messages', () => {
  it('liste au plus 50 notifications, les plus récentes en premier', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.notifications('u1');
    expect(p.notification.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' }, take: 50 });
  });

  it("marque une notification comme lue, restreinte au propriétaire", async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.marquerNotificationLue('u1', 'notif-1');
    expect(p.notification.updateMany).toHaveBeenCalledWith({ where: { id: 'notif-1', userId: 'u1' }, data: { lue: true } });
  });

  it('marque tous les messages non lus comme lus', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.marquerMessagesLus('u1');
    expect(p.userMessage.updateMany).toHaveBeenCalledWith({ where: { userId: 'u1', lu: false }, data: { lu: true } });
  });
});
