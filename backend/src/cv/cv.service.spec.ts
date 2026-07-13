import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CvService } from './cv.service';
import { PrismaService } from '../prisma/prisma.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', pseudo: 'Kouassi', nom: 'Kouassi Jean', pays: { nom: "Côte d'Ivoire" }, avatar: { nomPersonnage: 'Kouassi' } }) },
    userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { nom: 'Chef de chantier' }, metierCible: { nom: 'Conducteur' }, niveau: 12, xp: 3000, reputation: 450 }) },
    userCompetence: { findMany: jest.fn().mockResolvedValue([{ competence: { nom: 'Béton' }, niveauActuel: 3 }]) },
    userLogiciel: { findMany: jest.fn().mockResolvedValue([{ logiciel: { nom: 'Excel' }, niveauMaitrise: 2 }]) },
    userChantier: { findMany: jest.fn().mockResolvedValue([{ chantier: { nom: 'Villa Test' }, noteFinale: 'A', termineLe: new Date('2026-01-01') }]) },
    userBadge: { findMany: jest.fn().mockResolvedValue([{ badge: { nom: 'Sécurité', rarete: 'COMMUNE' }, obtenuLe: new Date('2026-01-01') }]) },
    userCertificat: { findMany: jest.fn().mockResolvedValue([{ certificat: { nom: 'HSE' }, numeroUnique: 'X1', delivreLe: new Date('2026-01-01') }]) },
    carriereHistorique: { findMany: jest.fn().mockResolvedValue([{ type: 'EMBAUCHE' }]) },
    cvVirtuel: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockImplementation(({ create }: { create: { contenu: object } }) => Promise.resolve({ userId: 'u1', contenu: create.contenu })) },
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
    providers: [CvService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return { svc: module.get(CvService), prisma };
}

describe('CvService.regenerer', () => {
  it("échoue proprement si l'utilisateur n'existe pas", async () => {
    const prisma = fakePrisma({ user: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.regenerer('u1')).rejects.toThrow(NotFoundException);
  });

  it('assemble carrière, compétences, logiciels, chantiers livrés, badges et certificats en un CV', async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    const resultat = await svc.regenerer('u1') as { contenu: Record<string, unknown> };

    expect(resultat.contenu.niveau).toBe(12);
    expect(resultat.contenu.profilActuel).toBe('Chef de chantier');
    expect(resultat.contenu.competences).toEqual([{ nom: 'Béton', niveau: 3 }]);
    expect(resultat.contenu.experiences).toEqual([{ chantier: 'Villa Test', note: 'A', termineLe: new Date('2026-01-01') }]);
    expect(resultat.contenu.badges).toEqual([{ nom: 'Sécurité', rarete: 'COMMUNE', obtenuLe: new Date('2026-01-01') }]);
  });

  it("retombe sur des valeurs par défaut quand le joueur n'a pas encore de carrière", async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    const resultat = await svc.regenerer('u1') as { contenu: Record<string, unknown> };
    expect(resultat.contenu.niveau).toBe(1);
    expect(resultat.contenu.xp).toBe(0);
    expect(resultat.contenu.reputation).toBe(500);
  });
});

describe('CvService.me', () => {
  it('renvoie le CV existant sans le régénérer', async () => {
    const prisma = fakePrisma({ cvVirtuel: { findUnique: jest.fn().mockResolvedValue({ userId: 'u1', contenu: { niveau: 5 } }) } });
    const { svc, prisma: p } = await service(prisma);
    const resultat = await svc.me('u1') as unknown as { contenu: { niveau: number } };
    expect(resultat.contenu.niveau).toBe(5);
    expect(p.user.findUnique).not.toHaveBeenCalled();
  });

  it("régénère le CV s'il n'existe pas encore", async () => {
    const prisma = fakePrisma({ cvVirtuel: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc, prisma: p } = await service(prisma);
    await svc.me('u1');
    expect(p.user.findUnique).toHaveBeenCalled();
    expect(p.cvVirtuel.upsert).toHaveBeenCalled();
  });
});
