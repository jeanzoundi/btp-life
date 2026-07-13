import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

// argon2 est utilisé réellement (pas mocké) : c'est un algorithme pur sans dépendance
// externe, et c'est exactement le mécanisme qui protège les mots de passe des joueurs —
// le tester pour de vrai est plus sûr que de simuler "ça matche" / "ça matche pas".
function utilisateur(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    email: 'joueur@btplife.com',
    passwordHash: '',
    role: 'USER',
    banni: false,
    nom: 'Joueur Test',
    ...overrides,
  };
}

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of new Set([...Object.keys(defaut), ...Object.keys(overrides)])) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const jwt = {
    signAsync: jest.fn().mockImplementation((payload: object, opts: { secret: string }) =>
      Promise.resolve(`signed:${opts.secret}:${JSON.stringify(payload)}`),
    ),
    verifyAsync: jest.fn(),
  };
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prisma },
      { provide: JwtService, useValue: jwt },
    ],
  }).compile();
  return { svc: module.get(AuthService), prisma, jwt };
}

describe('AuthService.register', () => {
  it("échoue si un compte existe déjà avec cet email", async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur()) } });
    const { svc } = await service(prisma);
    await expect(svc.register({ email: 'joueur@btplife.com', password: 'motdepasse123', nom: 'Test' } as never)).rejects.toThrow(ConflictException);
  });

  it('hache le mot de passe (jamais stocké en clair) et ne le renvoie jamais dans la réponse', async () => {
    const prisma = fakePrisma({
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: { data: { passwordHash: string; email: string } }) =>
          Promise.resolve(utilisateur({ passwordHash: data.passwordHash, email: data.email })),
        ),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.register({ email: 'nouveau@btplife.com', password: 'motdepasse123', nom: 'Nouveau' } as never);

    const appelCreate = prisma.user.create.mock.calls[0][0];
    expect(appelCreate.data.passwordHash).not.toBe('motdepasse123');
    expect(await argon2.verify(appelCreate.data.passwordHash, 'motdepasse123')).toBe(true);
    expect(resultat.user).not.toHaveProperty('passwordHash');
  });

  it('renvoie un access token et un refresh token signés avec des secrets distincts', async () => {
    const prisma = fakePrisma({
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve(utilisateur(data))),
      },
    });
    const { svc, jwt } = await service(prisma);
    const resultat = await svc.register({ email: 'nouveau@btplife.com', password: 'motdepasse123', nom: 'Nouveau' } as never);

    expect(jwt.signAsync).toHaveBeenCalledTimes(2);
    expect(resultat.accessToken).not.toBe(resultat.refreshToken);
  });
});

describe('AuthService.login', () => {
  it("échoue si l'email n'existe pas", async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    await expect(svc.login({ email: 'inconnu@btplife.com', password: 'x' } as never)).rejects.toThrow(UnauthorizedException);
  });

  it('échoue si le mot de passe ne correspond pas au hash stocké', async () => {
    const hash = await argon2.hash('bonmotdepasse');
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur({ passwordHash: hash })) } });
    const { svc } = await service(prisma);
    await expect(svc.login({ email: 'joueur@btplife.com', password: 'mauvais' } as never)).rejects.toThrow(UnauthorizedException);
  });

  it('échoue si le compte est banni, même avec le bon mot de passe', async () => {
    const hash = await argon2.hash('bonmotdepasse');
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur({ passwordHash: hash, banni: true })) } });
    const { svc } = await service(prisma);
    await expect(svc.login({ email: 'joueur@btplife.com', password: 'bonmotdepasse' } as never)).rejects.toThrow('suspendu');
  });

  it('réussit avec le bon mot de passe sur un compte actif, sans jamais exposer le hash', async () => {
    const hash = await argon2.hash('bonmotdepasse');
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur({ passwordHash: hash })) } });
    const { svc } = await service(prisma);
    const resultat = await svc.login({ email: 'joueur@btplife.com', password: 'bonmotdepasse' } as never);
    expect(resultat.user).not.toHaveProperty('passwordHash');
    expect(resultat.accessToken).toBeDefined();
    expect(resultat.refreshToken).toBeDefined();
  });
});

describe('AuthService.refresh', () => {
  it('échoue proprement si le refresh token est invalide ou expiré (verifyAsync lève)', async () => {
    const prisma = fakePrisma();
    const { svc, jwt } = await service(prisma);
    jwt.verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(svc.refresh('token-invalide')).rejects.toThrow(UnauthorizedException);
  });

  it("échoue si le token est valide mais l'utilisateur n'existe plus", async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc, jwt } = await service(prisma);
    jwt.verifyAsync.mockResolvedValue({ sub: 'u-supprime', email: 'x@x.com', role: 'USER' });
    await expect(svc.refresh('token-valide')).rejects.toThrow(UnauthorizedException);
  });

  it('émet une nouvelle paire de tokens quand le refresh token est valide', async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur()) } });
    const { svc, jwt } = await service(prisma);
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'joueur@btplife.com', role: 'USER' });
    const resultat = await svc.refresh('token-valide');
    expect(resultat.accessToken).toBeDefined();
    expect(resultat.refreshToken).toBeDefined();
    expect(resultat.user).not.toHaveProperty('passwordHash');
  });
});

describe('AuthService.me', () => {
  it("échoue si l'utilisateur n'existe pas (compte supprimé entre-temps)", async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.me('u-inconnu')).rejects.toThrow(UnauthorizedException);
  });

  it('renvoie le profil sans jamais exposer le hash du mot de passe', async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur({ passwordHash: 'un-hash-secret' })) } });
    const { svc } = await service(prisma);
    const resultat = await svc.me('u1');
    expect(resultat).not.toHaveProperty('passwordHash');
  });
});
