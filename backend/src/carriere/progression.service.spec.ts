import { Test } from '@nestjs/testing';
import { ProgressionService, xpToNiveau, xpRequisPourNiveau } from './progression.service';
import { PrismaService } from '../prisma/prisma.service';
import { AvatarItemsService } from './avatar-items.service';

describe('xpToNiveau', () => {
  it('reste niveau 1 tant que le seuil du niveau 2 n’est pas atteint', () => {
    expect(xpToNiveau(0)).toBe(1);
    expect(xpToNiveau(99)).toBe(1);
  });

  it('passe au niveau exact au seuil (courbe calibrée sur 100 niveaux : niveau N nécessite round(100*(N-1)^2.2) XP)', () => {
    // Seuil niveau 2 = round(100*1^2.2) = 100 — reste une victoire rapide
    expect(xpToNiveau(100)).toBe(2);
    // Seuil niveau 3 = round(100*2^2.2) = 459
    expect(xpToNiveau(458)).toBe(2);
    expect(xpToNiveau(459)).toBe(3);
  });

  it('ne redescend jamais et gère de gros montants d’XP sans boucler indéfiniment', () => {
    expect(xpToNiveau(100_000)).toBeGreaterThan(10);
  });

  it('atteint des niveaux élevés (30, 100) avec une XP cohérente avec une longue progression', () => {
    // Niveau 30 doit représenter des mois de jeu régulier, niveau 100 des années — pas quelques
    // dizaines de missions comme sur l'ancienne courbe plafonnée à 20.
    expect(xpRequisPourNiveau(30)).toBeGreaterThan(150_000);
    expect(xpRequisPourNiveau(30)).toBeLessThan(200_000);
    expect(xpToNiveau(150_000)).toBeGreaterThanOrEqual(25);
    expect(xpToNiveau(150_000)).toBeLessThan(30);
    expect(xpToNiveau(2_500_000)).toBe(100);
  });
});

describe('ProgressionService.appliquerDelta', () => {
  function prismaMock(carriere: { xp: number; reputation: number; argentVirtuel: number; niveau?: number }) {
    return {
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ niveau: 1, ...carriere }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
    };
  }

  function avatarItemsMock() {
    return { debloquerItemsEligibles: jest.fn().mockResolvedValue([]) };
  }

  async function service(prisma: ReturnType<typeof prismaMock>, avatarItems = avatarItemsMock()) {
    const module = await Test.createTestingModule({
      providers: [
        ProgressionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AvatarItemsService, useValue: avatarItems },
      ],
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

  it('plafonne la réputation entre 0 et 1000', async () => {
    const prisma = prismaMock({ xp: 0, reputation: 995, argentVirtuel: 0 });
    const svc = await service(prisma);
    expect((await svc.appliquerDelta('u1', { reputation: 20 }))?.reputation).toBe(1000);

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

  it('déclenche le déblocage d’items avatar quand le niveau augmente', async () => {
    const prisma = prismaMock({ xp: 50, reputation: 50, argentVirtuel: 1000, niveau: 1 });
    const avatarItems = avatarItemsMock();
    const svc = await service(prisma, avatarItems);
    await svc.appliquerDelta('u1', { xp: 60 });
    expect(avatarItems.debloquerItemsEligibles).toHaveBeenCalledWith('u1', 'niveau:2');
  });

  it('ne déclenche pas le déblocage d’items avatar si le niveau ne change pas', async () => {
    const prisma = prismaMock({ xp: 50, reputation: 50, argentVirtuel: 1000, niveau: 1 });
    const avatarItems = avatarItemsMock();
    const svc = await service(prisma, avatarItems);
    await svc.appliquerDelta('u1', { xp: 5 });
    expect(avatarItems.debloquerItemsEligibles).not.toHaveBeenCalled();
  });
});
