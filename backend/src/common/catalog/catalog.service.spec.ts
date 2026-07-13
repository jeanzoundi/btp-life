import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../prisma/prisma.service';

// `profils` : ressource catalogue ordinaire (voir resource-registry.ts) — modèle `profil`,
// recherche sur `nom`, tri par `ordre`.
function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    profil: {
      findMany: jest.fn().mockResolvedValue([{ id: 'p1', nom: 'Étudiant', slug: 'etudiant-chantier' }]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue({ id: 'p1', nom: 'Étudiant', slug: 'etudiant-chantier' }),
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
  const module = await Test.createTestingModule({
    providers: [CatalogService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return { svc: module.get(CatalogService), prisma };
}

describe('CatalogService.list', () => {
  it("échoue proprement pour une ressource qui n'est pas dans le catalogue public", async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    await expect(svc.list('utilisateurs', {})).rejects.toThrow(NotFoundException);
  });

  it('respecte le tri par défaut de la ressource et pagine correctement', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.list('profils', { page: '2', pageSize: '10' });
    expect(p.profil.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { ordre: 'asc' }, take: 10, skip: 10 }));
  });
});

describe('CatalogService.getById', () => {
  it("échoue si l'élément n'existe pas", async () => {
    const prisma = fakePrisma({ profil: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.getById('profils', 'inconnu')).rejects.toThrow(NotFoundException);
  });

  it('renvoie l’élément quand il existe', async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    const resultat = await svc.getById('profils', 'p1');
    expect(resultat).toEqual({ id: 'p1', nom: 'Étudiant', slug: 'etudiant-chantier' });
  });
});

describe('CatalogService.getBySlug', () => {
  it("échoue si aucun élément ne correspond au slug", async () => {
    const prisma = fakePrisma({ profil: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.getBySlug('profils', 'inconnu')).rejects.toThrow(NotFoundException);
  });

  it('renvoie l’élément correspondant au slug demandé', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    const resultat = await svc.getBySlug('profils', 'etudiant-chantier');
    expect(p.profil.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'etudiant-chantier' } }));
    expect(resultat).toEqual({ id: 'p1', nom: 'Étudiant', slug: 'etudiant-chantier' });
  });
});
