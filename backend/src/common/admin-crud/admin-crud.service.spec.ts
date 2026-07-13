import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminCrudService } from './admin-crud.service';
import { PrismaService } from '../../prisma/prisma.service';

// `badges` est une ressource admin ordinaire (voir resource-registry.ts) : modèle `badge`,
// recherche sur `nom` — représentative du CRUD générique testé ici.
function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    badge: {
      findMany: jest.fn().mockResolvedValue([{ id: 'b1', nom: 'Sécurité' }]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue({ id: 'b1', nom: 'Sécurité' }),
      create: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: 'b-nouveau', ...data })),
      update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: 'b1', ...data })),
      delete: jest.fn().mockResolvedValue({ id: 'b1' }),
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
    providers: [AdminCrudService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return { svc: module.get(AdminCrudService), prisma };
}

describe('AdminCrudService.resolve', () => {
  it("échoue proprement pour une ressource qui n'est pas dans le registre (jamais un accès direct à un modèle Prisma arbitraire)", async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    expect(() => svc.resolve('utilisateurs-secrets')).toThrow(NotFoundException);
  });
});

describe('AdminCrudService.list', () => {
  it('pagine avec les valeurs par défaut (page 1, 50 par page) quand rien n\'est précisé', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.list('badges', {});
    expect(p.badge.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50, skip: 0 }));
  });

  it('plafonne la taille de page à 200, même si on en demande davantage', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.list('badges', { pageSize: '500' });
    expect(p.badge.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 200 }));
  });

  it('construit une recherche insensible à la casse sur les champs de recherche déclarés', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    await svc.list('badges', { q: 'sécu' });
    expect(p.badge.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ nom: { contains: 'sécu', mode: 'insensitive' } }] },
    }));
  });
});

describe('AdminCrudService.getById / update / remove', () => {
  it("échoue si l'élément n'existe pas", async () => {
    const prisma = fakePrisma({ badge: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.getById('badges', 'inconnu')).rejects.toThrow(NotFoundException);
  });

  it("refuse de mettre à jour un élément qui n'existe pas, sans jamais appeler update", async () => {
    const prisma = fakePrisma({ badge: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc, prisma: p } = await service(prisma);
    await expect(svc.update('badges', 'inconnu', { nom: 'x' })).rejects.toThrow(NotFoundException);
    expect(p.badge.update).not.toHaveBeenCalled();
  });

  it('met à jour un élément existant', async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    const resultat = await svc.update('badges', 'b1', { nom: 'Sécurité+' });
    expect(resultat).toEqual({ id: 'b1', nom: 'Sécurité+' });
  });

  it("refuse de supprimer un élément qui n'existe pas", async () => {
    const prisma = fakePrisma({ badge: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc, prisma: p } = await service(prisma);
    await expect(svc.remove('badges', 'inconnu')).rejects.toThrow(NotFoundException);
    expect(p.badge.delete).not.toHaveBeenCalled();
  });

  it('supprime un élément existant', async () => {
    const prisma = fakePrisma();
    const { svc, prisma: p } = await service(prisma);
    const resultat = await svc.remove('badges', 'b1');
    expect(resultat).toEqual({ deleted: true });
    expect(p.badge.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
  });
});

describe('AdminCrudService.create', () => {
  it('crée un nouvel élément pour la ressource demandée', async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    const resultat = await svc.create('badges', { nom: 'Nouveau badge' });
    expect(resultat).toEqual({ id: 'b-nouveau', nom: 'Nouveau badge' });
  });
});
