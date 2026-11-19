import { BadRequestException, ConflictException, HttpException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { createHmac } from 'crypto';
import { AuthService, nomDepuisEmail, SANS_MOT_DE_PASSE } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';

// argon2 est utilisé réellement (pas mocké) : c'est un algorithme pur sans dépendance
// externe, et c'est exactement le mécanisme qui protège les mots de passe des joueurs —
// le tester pour de vrai est plus sûr que de simuler "ça matche" / "ça matche pas".
// Un hachage réel est lent quand toute la suite tourne en parallèle : de la marge plutôt qu'un faux échec.
jest.setTimeout(30_000);

// Des secrets JWT propres aux tests : sans eux, le test dépendait du backend/.env local (chargé au passage par Prisma,
// donc les secrets de production) et échouait en CI, où ce fichier n'existe pas.
const SECRETS_AVANT = { acces: process.env.JWT_ACCESS_SECRET, rafraichissement: process.env.JWT_REFRESH_SECRET };
beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'secret-acces-des-tests';
  process.env.JWT_REFRESH_SECRET = 'secret-rafraichissement-des-tests';
});
afterAll(() => {
  const remettre = (cle: string, valeur: string | undefined) => { if (valeur === undefined) delete process.env[cle]; else process.env[cle] = valeur; };
  remettre('JWT_ACCESS_SECRET', SECRETS_AVANT.acces);
  remettre('JWT_REFRESH_SECRET', SECRETS_AVANT.rafraichissement);
});
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
  fusion.$transaction = jest.fn(async (operation: (tx: any) => Promise<unknown>) => operation(fusion));
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>, mail = { envoyer: jest.fn().mockResolvedValue(undefined), modeDeveloppement: jest.fn().mockReturnValue(false) }) {
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
      { provide: MailService, useValue: mail },
    ],
  }).compile();
  return { svc: module.get(AuthService), prisma, jwt, mail };
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

  it('refuse de renouveler la session si le compte a été banni entre-temps (le bannissement doit couper le refresh, pas seulement le login)', async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur({ banni: true })) } });
    const { svc, jwt } = await service(prisma);
    jwt.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'joueur@btplife.com', role: 'USER' });
    // Le message reste générique (le catch de refresh l'uniformise), mais aucun token ne doit sortir.
    await expect(svc.refresh('token-valide')).rejects.toThrow(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
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

describe('AuthService — entrer avec un code reçu par mail', () => {
  const empreinte = (email: string, code: string) =>
    createHmac('sha256', 'secret-acces-des-tests').update(`code-connexion:${email}:${code}`).digest('hex');
  const codeValide = (overrides: Record<string, unknown> = {}) => ({
    id: 'c1', email: 'joueur@btplife.com', empreinte: empreinte('joueur@btplife.com', '042137'),
    expireLe: new Date(Date.now() + 5 * 60_000), essais: 0, creeLe: new Date(), ...overrides,
  });
  function codes(overrides: Record<string, unknown> = {}) {
    return {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(codeValide()),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      ...overrides,
    };
  }

  it("envoie un code à 6 chiffres à l'adresse normalisée, sans jamais garder le code en clair", async () => {
    const prisma = fakePrisma({ codeConnexion: codes() });
    const { svc, mail } = await service(prisma);
    await expect(svc.demanderCode('  Joueur@BTPLife.com ')).resolves.toEqual({ envoye: true });
    const envoi = mail.envoyer.mock.calls[0][0];
    expect(envoi.a).toBe('joueur@btplife.com');
    const code = /(\d{6})/.exec(envoi.sujet)?.[1] as string;
    expect(code).toMatch(/^\d{6}$/);
    expect(envoi.texte).toContain(code);
    const enregistre = prisma.codeConnexion.create.mock.calls[0][0].data;
    expect(enregistre.email).toBe('joueur@btplife.com');
    expect(JSON.stringify(enregistre)).not.toContain(`"${code}"`);
    expect(enregistre.empreinte).toBe(empreinte('joueur@btplife.com', code));
    expect(enregistre.expireLe.getTime() - Date.now()).toBeGreaterThan(9 * 60_000);
  });

  it('montre le code à l’écran seulement quand aucun service de mail ne tourne hors production', async () => {
    const prisma = fakePrisma({ codeConnexion: codes() });
    const mail = { envoyer: jest.fn().mockResolvedValue(undefined), modeDeveloppement: jest.fn().mockReturnValue(true) };
    const { svc } = await service(prisma, mail);
    const reponse = await svc.demanderCode('joueur@btplife.com') as { codeDeveloppement?: string };
    expect(reponse.codeDeveloppement).toMatch(/^\d{6}$/);
  });

  it('refuse un deuxième code dans la minute, et plus de cinq par heure', async () => {
    const minute = fakePrisma({ codeConnexion: codes({ findMany: jest.fn().mockResolvedValue([{ creeLe: new Date(Date.now() - 20_000) }]) }) });
    const a = await service(minute);
    await expect(a.svc.demanderCode('joueur@btplife.com')).rejects.toThrow(HttpException);
    expect(a.mail.envoyer).not.toHaveBeenCalled();

    const heure = fakePrisma({ codeConnexion: codes({ findMany: jest.fn().mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ creeLe: new Date(Date.now() - (5 + i) * 60_000) }))) }) });
    const b = await service(heure);
    await expect(b.svc.demanderCode('joueur@btplife.com')).rejects.toThrow(/une heure/);
    expect(b.prisma.codeConnexion.create).not.toHaveBeenCalled();
  });

  it('un bon code connecte un joueur existant et invalide le code sans effacer le quota', async () => {
    const existant = utilisateur({ email: 'Joueur@btplife.com', emailVerified: true, passwordHash: 'hachage' });
    const prisma = fakePrisma({ codeConnexion: codes(), user: { findFirst: jest.fn().mockResolvedValue(existant), create: jest.fn() } });
    const { svc } = await service(prisma);
    const reponse = await svc.verifierCode('JOUEUR@btplife.com', '042137');
    expect(reponse.nouveau).toBe(false);
    expect(reponse.user).toMatchObject({ id: 'u1', aMotDePasse: true });
    expect(reponse.user).not.toHaveProperty('passwordHash');
    expect(reponse.accessToken).toContain('secret-acces-des-tests');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { email: { equals: 'joueur@btplife.com', mode: 'insensitive' } } });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.codeConnexion.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { expireLe: new Date(0) } });
    expect(prisma.codeConnexion.deleteMany).not.toHaveBeenCalled();
  });

  it('un bon code crée le compte d’une adresse inconnue, sans mot de passe, et le dit nouveau', async () => {
    const cree = utilisateur({ id: 'u9', email: 'jean-marc.kouassi07@mail.ci', passwordHash: SANS_MOT_DE_PASSE, nom: 'Jean Marc Kouassi' });
    const prisma = fakePrisma({
      codeConnexion: codes({ findFirst: jest.fn().mockResolvedValue(codeValide({ email: 'jean-marc.kouassi07@mail.ci', empreinte: empreinte('jean-marc.kouassi07@mail.ci', '000001') })) }),
      user: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(cree) },
    });
    const { svc } = await service(prisma);
    const reponse = await svc.verifierCode('jean-marc.kouassi07@mail.ci', '000001');
    expect(reponse.nouveau).toBe(true);
    expect(reponse.user).toMatchObject({ id: 'u9', aMotDePasse: false });
    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({
      email: 'jean-marc.kouassi07@mail.ci', passwordHash: SANS_MOT_DE_PASSE, nom: 'Jean Marc Kouassi', emailVerified: true,
    });
  });

  it('un mauvais code coûte un essai et dit combien il en reste ; au cinquième, il faut un nouveau code', async () => {
    const prisma = fakePrisma({ codeConnexion: codes({ findFirst: jest.fn().mockResolvedValue(codeValide({ essais: 2 })) }) });
    const { svc } = await service(prisma);
    await expect(svc.verifierCode('joueur@btplife.com', '999999')).rejects.toThrow('Encore 2 essais');
    expect(prisma.codeConnexion.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { essais: { increment: 1 } } });

    const epuise = fakePrisma({ codeConnexion: codes({ findFirst: jest.fn().mockResolvedValue(codeValide({ essais: 5 })) }) });
    const b = await service(epuise);
    // Même le bon code ne passe plus : sinon cinq essais par code ne freineraient rien.
    await expect(b.svc.verifierCode('joueur@btplife.com', '042137')).rejects.toThrow(BadRequestException);
  });

  it('refuse un code expiré, un compte suspendu, et le mot de passe d’un compte qui n’en a pas', async () => {
    const expire = fakePrisma({ codeConnexion: codes({ findFirst: jest.fn().mockResolvedValue(codeValide({ expireLe: new Date(Date.now() - 1000) })) }) });
    await expect((await service(expire)).svc.verifierCode('joueur@btplife.com', '042137')).rejects.toThrow(/expiré/);

    const banni = fakePrisma({ codeConnexion: codes(), user: { findFirst: jest.fn().mockResolvedValue(utilisateur({ banni: true })) } });
    await expect((await service(banni)).svc.verifierCode('joueur@btplife.com', '042137')).rejects.toThrow(UnauthorizedException);

    const sansMotDePasse = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(utilisateur({ passwordHash: SANS_MOT_DE_PASSE })) } });
    await expect((await service(sansMotDePasse)).svc.login({ email: 'joueur@btplife.com', password: SANS_MOT_DE_PASSE }))
      .rejects.toThrow(/code reçu par mail/);
  });

  it('tire un nom de départ lisible de l’adresse', () => {
    expect(nomDepuisEmail('jean-marc.kouassi07@mail.ci')).toBe('Jean Marc Kouassi');
    expect(nomDepuisEmail('AMINATA_traore@x.com')).toBe('Aminata Traore');
    expect(nomDepuisEmail('2024@x.com')).toBe('Joueur');
  });
});
