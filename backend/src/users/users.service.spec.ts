import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CertificatsService } from '../certificats/certificats.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    user: { update: jest.fn().mockResolvedValue({ id: 'u1', nom: 'Kouassi', passwordHash: 'secret-hash' }) },
    userCompetence: { findMany: jest.fn().mockResolvedValue([]) },
    userLogiciel: { findMany: jest.fn().mockResolvedValue([]) },
    userBadge: { findMany: jest.fn().mockResolvedValue([]) },
    userCertificat: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    userMessage: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    compteB2b: { count: jest.fn().mockResolvedValue(0) },
    membreEquipe: { findUnique: jest.fn().mockResolvedValue(null), delete: jest.fn(), findFirst: jest.fn().mockResolvedValue(null) },
    equipeQuartier: { update: jest.fn(), delete: jest.fn() },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of new Set([...Object.keys(defaut), ...Object.keys(overrides)])) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

const delivrance = { delivrer: jest.fn().mockResolvedValue([]) };
async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({
    providers: [UsersService, { provide: PrismaService, useValue: prisma }, { provide: CertificatsService, useValue: delivrance }],
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

  it('délivre d’abord les certificats mérités, puis renvoie ceux du joueur', async () => {
    const prisma = fakePrisma({ userCertificat: { findMany: jest.fn().mockResolvedValue([{ certificat: { nom: 'HSE' } }]) } });
    const { svc } = await service(prisma);
    expect(await svc.certificats('u1')).toEqual([{ certificat: { nom: 'HSE' } }]);
    expect(delivrance.delivrer).toHaveBeenCalledWith('u1');
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

describe('UsersService.supprimerCompte', () => {
  // Le hachage argon2 est exercé pour de vrai, comme dans auth.service.spec.ts : c'est lui qui protège la suppression.
  // Volontairement lent, il est calculé une seule fois, avec la même marge de temps que là-bas quand toute la suite tourne.
  jest.setTimeout(30_000);
  let passwordHash = '';
  beforeAll(async () => { passwordHash = await argon2.hash('bon-mot-de-passe'); });
  async function banc(compte: { role?: string } = {}, overrides: Record<string, object> = {}) {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue({ passwordHash, role: compte.role ?? 'USER' }), delete: jest.fn().mockResolvedValue({}) }, ...overrides });
    prisma.$transaction = jest.fn(async (operation: (tx: unknown) => Promise<unknown>) => operation(prisma));
    return service(prisma);
  }

  it('supprime le compte avec le bon mot de passe, et laisse son équipe au plus ancien coéquipier', async () => {
    const { svc, prisma } = await banc({}, { membreEquipe: {
      findUnique: jest.fn().mockResolvedValue({ equipeId: 'e1', equipe: { chefId: 'u1' } }), findFirst: jest.fn().mockResolvedValue({ userId: 'u2' }),
    } });
    await expect(svc.supprimerCompte('u1', 'bon-mot-de-passe')).resolves.toEqual({ supprime: true });
    expect(prisma.equipeQuartier.update).toHaveBeenCalledWith({ where: { id: 'e1' }, data: { chefId: 'u2' } });
    expect(prisma.equipeQuartier.delete).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('refuse un mauvais mot de passe sans rien supprimer, en 400 pour ne pas passer pour une session expirée', async () => {
    const { svc, prisma } = await banc();
    await expect(svc.supprimerCompte('u1', 'mauvais')).rejects.toThrow(BadRequestException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('laisse à l’équipe un compte d’administration ou responsable d’un compte École ou Entreprise', async () => {
    const admin = await banc({ role: 'ADMIN' });
    await expect(admin.svc.supprimerCompte('u1', 'bon-mot-de-passe')).rejects.toThrow(ForbiddenException);
    expect(admin.prisma.user.delete).not.toHaveBeenCalled();
    const ecole = await banc({}, { compteB2b: { count: jest.fn().mockResolvedValue(1) } });
    await expect(ecole.svc.supprimerCompte('u1', 'bon-mot-de-passe')).rejects.toThrow(ConflictException);
    expect(ecole.prisma.user.delete).not.toHaveBeenCalled();
  });
});
