import { Test } from '@nestjs/testing';
import { ProgressionService, xpToNiveau } from './progression.service';
import { PrismaService } from '../prisma/prisma.service';

describe('xpToNiveau', () => {
  it('reste niveau 1 tant que le seuil du niveau 2 n’est pas atteint', () => {
    expect(xpToNiveau(0)).toBe(1);
    expect(xpToNiveau(99)).toBe(1);
  });

  it('passe au niveau exact au seuil (courbe raide : niveau N nécessite round(100*(N-1)^2.5) XP)', () => {
    // Seuil niveau 2 = round(100*1^2.5) = 100 — reste une victoire rapide
    expect(xpToNiveau(100)).toBe(2);
    // Seuil niveau 3 = round(100*2^2.5) = 566 — la courbe se raidit déjà nettement
    expect(xpToNiveau(565)).toBe(2);
    expect(xpToNiveau(566)).toBe(3);
  });

  it('ne redescend jamais et gère de gros montants d’XP sans boucler indéfiniment', () => {
    expect(xpToNiveau(100_000)).toBeGreaterThan(10);
  });
});

describe('ProgressionService.appliquerDelta', () => {
  function prismaMock(carriere: { xp: number; reputation: number; argentVirtuel: number }) {
    return {
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue(carriere),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
    };
  }

  async function service(prisma: ReturnType<typeof prismaMock>) {
    const module = await Test.createTestingModule({
      providers: [ProgressionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    return module.get(ProgressionService);
  }

  it('additionne l’XP et recalcule le niveau en conséquence', async () => {
    const prisma = prismaMock({ xp: 50, reputation: 50, argentVirtuel: 1000 });
    const svc = await service(prisma);
    const resultat = await svc.appliquerDelta('u1', { xp: 60 });
    expect(resultat?.xp).toBe(110);
    expect(resultat?.niveau).toBe(2);
  });

  it('ne laisse jamais l’XP ou l’argent descendre sous 0', async () => {
    const prisma = prismaMock({ xp: 10, reputation: 50, argentVirtuel: 100 });
    const svc = await service(prisma);
    const resultat = await svc.appliquerDelta('u1', { xp: -1000, argentVirtuel: -1000 });
    expect(resultat?.xp).toBe(0);
    expect(resultat?.argentVirtuel).toBe(0);
  });

  it('plafonne la réputation entre 0 et 100', async () => {
    const prisma = prismaMock({ xp: 0, reputation: 95, argentVirtuel: 0 });
    const svc = await service(prisma);
    expect((await svc.appliquerDelta('u1', { reputation: 20 }))?.reputation).toBe(100);

    const prismaBas = prismaMock({ xp: 0, reputation: 5, argentVirtuel: 0 });
    const svcBas = await service(prismaBas);
    expect((await svcBas.appliquerDelta('u1', { reputation: -20 }))?.reputation).toBe(0);
  });

  it('renvoie null sans planter si la carrière n’existe pas', async () => {
    const prisma = { userCarriere: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } };
    const svc = await service(prisma as never);
    expect(await svc.appliquerDelta('inconnu', { xp: 10 })).toBeNull();
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
  });
});
