import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AvatarItemsService } from './avatar-items.service';
import { PrismaService } from '../prisma/prisma.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    itemAvatar: { findMany: jest.fn().mockResolvedValue([]) },
    userItemAvatar: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    userCarriere: { findUnique: jest.fn().mockResolvedValue(null) },
    avatar: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
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
    providers: [AvatarItemsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return module.get(AvatarItemsService);
}

describe('AvatarItemsService.catalogue', () => {
  it('marque un item éligible si le niveau et le métier du joueur correspondent', async () => {
    const prisma = fakePrisma({
      itemAvatar: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'item-1', niveauRequis: 5, metierRequis: 'chef-chantier' },
          { id: 'item-2', niveauRequis: 20, metierRequis: null },
          { id: 'item-3', niveauRequis: 1, metierRequis: 'topographe-junior' },
        ]),
      },
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ niveau: 8, profilActuel: { slug: 'chef-chantier' } }),
      },
    });
    const svc = await service(prisma);
    const resultat = await svc.catalogue('u1');
    expect(resultat.find((i) => i.id === 'item-1')?.eligible).toBe(true);
    expect(resultat.find((i) => i.id === 'item-2')?.eligible).toBe(false); // niveau 20 requis, joueur niveau 8
    expect(resultat.find((i) => i.id === 'item-3')?.eligible).toBe(false); // mauvais métier
  });

  it('marque possede/equipe à partir des possessions du joueur', async () => {
    const prisma = fakePrisma({
      itemAvatar: { findMany: jest.fn().mockResolvedValue([{ id: 'item-1', niveauRequis: 1, metierRequis: null }]) },
      userItemAvatar: { findMany: jest.fn().mockResolvedValue([{ itemId: 'item-1', equipe: true }]) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 1, profilActuel: null }) },
    });
    const svc = await service(prisma);
    const resultat = await svc.catalogue('u1');
    expect(resultat[0].possede).toBe(true);
    expect(resultat[0].equipe).toBe(true);
  });
});

describe('AvatarItemsService.equiper', () => {
  it("échoue si le joueur ne possède pas l'item", async () => {
    const prisma = fakePrisma();
    const svc = await service(prisma);
    await expect(svc.equiper('u1', 'item-inconnu')).rejects.toThrow(NotFoundException);
  });

  it("fusionne le configPatch dans Avatar.config et désactive les autres items de la même catégorie", async () => {
    const prisma = fakePrisma({
      userItemAvatar: {
        findUnique: jest.fn().mockResolvedValue({ id: 'possession-1', item: { categorie: 'CASQUE', configPatch: { casqueStyle: 'visiere', casque: '#2B2B2E' } } }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
      avatar: {
        findUnique: jest.fn().mockResolvedValue({ config: { peau: '#C68642', casqueStyle: 'standard' } }),
        upsert: jest.fn().mockResolvedValue({}),
      },
    });
    const svc = await service(prisma);
    await svc.equiper('u1', 'item-1');

    expect(prisma.avatar.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ config: { peau: '#C68642', casqueStyle: 'visiere', casque: '#2B2B2E' } }),
      }),
    );
    expect(prisma.userItemAvatar.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', item: { categorie: 'CASQUE' } }, data: { equipe: false } }),
    );
  });
});

describe('AvatarItemsService.debloquerItemsEligibles', () => {
  it("ne débloque que les items déjà éligibles et pas encore possédés", async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 6, profilActuel: { slug: 'chef-chantier' } }) },
      itemAvatar: { findMany: jest.fn().mockResolvedValue([{ id: 'item-1' }, { id: 'item-2' }]) },
      userItemAvatar: {
        findMany: jest.fn().mockResolvedValue([{ itemId: 'item-1' }]),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    });
    const svc = await service(prisma);
    const nouveaux = await svc.debloquerItemsEligibles('u1', 'niveau:6');
    expect(nouveaux).toEqual([{ id: 'item-2' }]);
    expect(prisma.userItemAvatar.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u1', itemId: 'item-2', source: 'niveau:6' }],
      skipDuplicates: true,
    });
  });

  it('renvoie un tableau vide sans planter si la carrière est introuvable', async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue(null) } });
    const svc = await service(prisma);
    expect(await svc.debloquerItemsEligibles('inconnu', 'niveau:1')).toEqual([]);
  });
});
