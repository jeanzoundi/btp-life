import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EpargneService, TAUX_INTERET_JOURNALIER } from './epargne.service';
import { PrismaService } from '../prisma/prisma.service';

function carriereAvec(overrides: Record<string, unknown>) {
  return {
    userId: 'u1',
    argentVirtuel: 1000,
    epargne: 0,
    epargneMajLe: new Date(),
    ...overrides,
  };
}

function fakePrisma(carriere: ReturnType<typeof carriereAvec>) {
  return {
    userCarriere: {
      findUnique: jest.fn().mockResolvedValue(carriere),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        const resolu: Record<string, unknown> = { ...carriere };
        for (const [cle, valeur] of Object.entries(data)) {
          if (valeur && typeof valeur === 'object' && 'increment' in (valeur as object)) {
            resolu[cle] = (carriere as unknown as Record<string, number>)[cle] + (valeur as { increment: number }).increment;
          } else if (valeur && typeof valeur === 'object' && 'decrement' in (valeur as object)) {
            resolu[cle] = (carriere as unknown as Record<string, number>)[cle] - (valeur as { decrement: number }).decrement;
          } else {
            resolu[cle] = valeur;
          }
        }
        return Promise.resolve(resolu);
      }),
    },
  };
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({
    providers: [EpargneService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return module.get(EpargneService);
}

describe('EpargneService.actualiser', () => {
  it('ne change rien si l’épargne est à 0', async () => {
    const carriere = carriereAvec({ epargne: 0 });
    const prisma = fakePrisma(carriere);
    const svc = await service(prisma);
    const resultat = await svc.actualiser('u1');
    expect(resultat.epargne).toBe(0);
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
  });

  it('ne change rien avant qu’un jour plein ne se soit écoulé', async () => {
    const carriere = carriereAvec({ epargne: 1000, epargneMajLe: new Date(Date.now() - 3_600_000) }); // 1h
    const prisma = fakePrisma(carriere);
    const svc = await service(prisma);
    const resultat = await svc.actualiser('u1');
    expect(resultat.epargne).toBe(1000);
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
  });

  it('applique l’intérêt composé pour les jours entiers écoulés', async () => {
    const carriere = carriereAvec({ epargne: 1000, epargneMajLe: new Date(Date.now() - 5 * 86_400_000) }); // 5 jours
    const prisma = fakePrisma(carriere);
    const svc = await service(prisma);
    const resultat = await svc.actualiser('u1');
    const attendu = Math.round(1000 * Math.pow(1 + TAUX_INTERET_JOURNALIER, 5));
    expect(resultat.epargne).toBe(attendu);
    expect(resultat.epargne).toBeGreaterThan(1000);
  });

  it('plafonne le nombre de jours pris en compte après une longue absence', async () => {
    const carriere = carriereAvec({ epargne: 1000, epargneMajLe: new Date(Date.now() - 400 * 86_400_000) }); // 400 jours
    const prisma = fakePrisma(carriere);
    const svc = await service(prisma);
    const resultat = await svc.actualiser('u1');
    const attendu = Math.round(1000 * Math.pow(1 + TAUX_INTERET_JOURNALIER, 60));
    expect(resultat.epargne).toBe(attendu);
  });
});

describe('EpargneService.deposer / retirer', () => {
  it('refuse un montant invalide', async () => {
    const prisma = fakePrisma(carriereAvec({}));
    const svc = await service(prisma);
    await expect(svc.deposer('u1', 0)).rejects.toThrow(BadRequestException);
    await expect(svc.deposer('u1', -50)).rejects.toThrow(BadRequestException);
    await expect(svc.deposer('u1', 1.5)).rejects.toThrow(BadRequestException);
  });

  it('refuse un dépôt supérieur au solde disponible', async () => {
    const prisma = fakePrisma(carriereAvec({ argentVirtuel: 100 }));
    const svc = await service(prisma);
    await expect(svc.deposer('u1', 500)).rejects.toThrow(BadRequestException);
  });

  it('déplace l’argent du solde vers l’épargne', async () => {
    const prisma = fakePrisma(carriereAvec({ argentVirtuel: 1000, epargne: 200 }));
    const svc = await service(prisma);
    const resultat = await svc.deposer('u1', 300);
    expect(resultat.argentVirtuel).toBe(700);
    expect(resultat.epargne).toBe(500);
  });

  it('refuse un retrait supérieur à l’épargne disponible', async () => {
    const prisma = fakePrisma(carriereAvec({ epargne: 100 }));
    const svc = await service(prisma);
    await expect(svc.retirer('u1', 500)).rejects.toThrow(BadRequestException);
  });

  it('déplace l’argent de l’épargne vers le solde', async () => {
    const prisma = fakePrisma(carriereAvec({ argentVirtuel: 1000, epargne: 500 }));
    const svc = await service(prisma);
    const resultat = await svc.retirer('u1', 200);
    expect(resultat.argentVirtuel).toBe(1200);
    expect(resultat.epargne).toBe(300);
  });
});
