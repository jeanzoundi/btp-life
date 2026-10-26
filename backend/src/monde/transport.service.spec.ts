import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { prixTrajet, TransportService, type ModePaye } from './transport.service';

function fakePrisma(overrides: { argent?: number; carriere?: boolean } = {}) {
  const etat = { argentVirtuel: overrides.argent ?? 5000 };
  return {
    userCarriere: {
      updateMany: jest.fn().mockImplementation(({ where, data }: { where: { argentVirtuel: { gte: number } }; data: { argentVirtuel: { decrement: number } } }) => {
        if (overrides.carriere === false || etat.argentVirtuel < where.argentVirtuel.gte) return Promise.resolve({ count: 0 });
        etat.argentVirtuel -= data.argentVirtuel.decrement;
        return Promise.resolve({ count: 1 });
      }),
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(overrides.carriere === false ? null : { ...etat })),
    },
  };
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const module = await Test.createTestingModule({ providers: [TransportService, { provide: PrismaService, useValue: prisma }] }).compile();
  return module.get(TransportService);
}

describe('prixTrajet', () => {
  it('reprend le barème du téléphone du jeu', () => {
    expect(prixTrajet('gbaka', 100)).toBe(200);
    expect(prixTrajet('gbaka', 200)).toBe(300);
    expect(prixTrajet('taxi', 120)).toBe(1050);
    expect(prixTrajet('taxi', 120, true)).toBe(1600);
  });
  it('plafonne une distance déclarée trop grande', () => {
    expect(prixTrajet('taxi', 100_000)).toBe(prixTrajet('taxi', 600));
    expect(prixTrajet('taxi', -50)).toBe(300);
  });
});

describe('TransportService.payer', () => {
  it('débite la course quand le solde suffit, en une seule écriture conditionnelle', async () => {
    const prisma = fakePrisma({ argent: 5000 });
    const svc = await service(prisma);
    await expect(svc.payer('u1', 'taxi', 120)).resolves.toEqual({ mode: 'taxi', prix: 1050, argentVirtuel: 3950 });
    expect(prisma.userCarriere.updateMany).toHaveBeenCalledWith({ where: { userId: 'u1', argentVirtuel: { gte: 1050 } }, data: { argentVirtuel: { decrement: 1050 } } });
  });
  it('refuse la course sans assez d’argent, sans rien débiter', async () => {
    const prisma = fakePrisma({ argent: 150 });
    const svc = await service(prisma);
    await expect(svc.payer('u1', 'gbaka', 50)).rejects.toThrow(BadRequestException);
    expect((await prisma.userCarriere.findUnique()).argentVirtuel).toBe(150);
  });
  it('refuse un mode inconnu et une carrière absente', async () => {
    const svc = await service(fakePrisma());
    await expect(svc.payer('u1', 'helicoptere' as ModePaye, 10)).rejects.toThrow(BadRequestException);
    const sansCarriere = await service(fakePrisma({ carriere: false }));
    await expect(sansCarriere.payer('u1', 'taxi', 10)).rejects.toThrow(NotFoundException);
  });
});
