import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErreursClientService, REGLES_ERREURS, signatureErreur } from './erreurs-client.service';

const MAINTENANT = new Date('2026-10-29T09:00:00.000Z');
const PILE = 'TypeError: x is undefined\n    at Hud (https://btp-life-frontend.vercel.app/_next/static/chunks/app/page-1a2b.js:1:2345)\n    at r (react-dom.js:9:10)';
const NAVIGATEUR = 'Mozilla/5.0 (Linux; Android 13) Chrome/130.0';

function fakePrisma(overrides: { connue?: boolean; ouvertes?: number } = {}) {
  return {
    erreurClient: {
      findUnique: jest.fn().mockResolvedValue(overrides.connue ? { id: 'e1' } : null),
      count: jest.fn().mockResolvedValue(overrides.ouvertes ?? 3),
      create: jest.fn().mockResolvedValue({ id: 'e2' }),
      update: jest.fn().mockResolvedValue({ id: 'e1' }),
    },
  };
}
async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({ providers: [ErreursClientService, { provide: PrismaService, useValue: prisma }] }).compile();
  return module.get(ErreursClientService);
}

describe('ErreursClientService', () => {
  it('enregistre une erreur nouvelle, page sans paramètres et textes bornés', async () => {
    const prisma = fakePrisma();
    const recue = { message: 'x is undefined', pile: PILE, chemin: '/app/monde?token=secret#carte', version: 'f56a061' };
    await expect((await service(prisma)).enregistrer(recue, NAVIGATEUR, MAINTENANT)).resolves.toEqual({ enregistree: true });
    expect(prisma.erreurClient.create).toHaveBeenCalledWith({
      data: {
        signature: signatureErreur('x is undefined', PILE), message: 'x is undefined', pile: PILE, chemin: '/app/monde',
        navigateur: NAVIGATEUR, version: 'f56a061', derniereLe: MAINTENANT, premiereLe: MAINTENANT,
      },
    });
    const longue = fakePrisma();
    await (await service(longue)).enregistrer({ message: 'a'.repeat(3000), pile: 'b'.repeat(9000) }, 'c'.repeat(900), MAINTENANT);
    const { data } = longue.erreurClient.create.mock.calls[0][0];
    expect([data.message.length, data.pile.length, data.navigateur.length]).toEqual([REGLES_ERREURS.longueurMessage, REGLES_ERREURS.longueurPile, REGLES_ERREURS.longueurNavigateur]);
    expect(data.chemin).toBeNull();
  });

  it('compte une erreur déjà connue, et la rouvre si elle avait été marquée résolue', async () => {
    const prisma = fakePrisma({ connue: true });
    await (await service(prisma)).enregistrer({ message: 'x is undefined', pile: PILE, chemin: '/app' }, NAVIGATEUR, MAINTENANT);
    expect(prisma.erreurClient.create).not.toHaveBeenCalled();
    expect(prisma.erreurClient.update).toHaveBeenCalledWith({
      where: { signature: signatureErreur('x is undefined', PILE) },
      data: { chemin: '/app', navigateur: NAVIGATEUR, version: null, derniereLe: MAINTENANT, occurrences: { increment: 1 }, resolueLe: null },
    });
  });

  it('regroupe la même erreur venue de pages différentes, et sépare deux erreurs du même message', () => {
    expect(signatureErreur('x is undefined', PILE)).toBe(signatureErreur('x is undefined', `${PILE}\n    at autre (a.js:1:1)`));
    expect(signatureErreur('x is undefined', PILE)).not.toBe(signatureErreur('x is undefined', PILE.replace('1:2345', '1:999')));
  });

  it('n’ouvre plus d’erreur nouvelle au-delà du plafond, et compte celle qu’un autre navigateur vient de créer', async () => {
    const pleine = fakePrisma({ ouvertes: REGLES_ERREURS.plafondOuvertes });
    await expect((await service(pleine)).enregistrer({ message: 'nouvelle' }, NAVIGATEUR, MAINTENANT)).resolves.toEqual({ enregistree: false });
    expect(pleine.erreurClient.create).not.toHaveBeenCalled();
    const course = fakePrisma();
    course.erreurClient.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' }));
    await expect((await service(course)).enregistrer({ message: 'simultanée' }, NAVIGATEUR, MAINTENANT)).resolves.toEqual({ enregistree: true });
    expect(course.erreurClient.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ occurrences: { increment: 1 } }) }));
  });
});
