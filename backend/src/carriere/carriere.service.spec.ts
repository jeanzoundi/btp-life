import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CarriereService } from './carriere.service';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import { EpargneService } from './epargne.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    userCarriere: {
      findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', slug: 'stagiaire-chantier' }, niveau: 5, xp: 1000, reputation: 50 }),
      update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ profilActuelId: (data as { profilActuelId: string }).profilActuelId })),
    },
    profil: { findFirst: jest.fn().mockResolvedValue({ id: 'profil-ouvrier-qualifie', slug: 'ouvrier-qualifie' }) },
    carriereHistorique: { create: jest.fn().mockResolvedValue({}) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fusion: any = {};
  for (const cle of Object.keys(defaut)) {
    fusion[cle] = { ...defaut[cle], ...(overrides[cle] ?? {}) };
  }
  return fusion;
}

async function service(prisma: ReturnType<typeof fakePrisma>) {
  const besoins = {};
  const epargne = {};
  const module = await Test.createTestingModule({
    providers: [
      CarriereService,
      { provide: PrismaService, useValue: prisma },
      { provide: BesoinsService, useValue: besoins },
      { provide: EpargneService, useValue: epargne },
    ],
  }).compile();
  return { svc: module.get(CarriereService), prisma };
}

describe('CarriereService.devenirEntrepreneur', () => {
  it('refuse si le joueur est déjà dans la filière ENTREPRENEUR', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' }, niveau: 10 }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.devenirEntrepreneur('u1')).rejects.toThrow(BadRequestException);
  });

  it("échoue proprement si la carrière n'existe pas", async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.devenirEntrepreneur('inconnu')).rejects.toThrow(NotFoundException);
  });

  it("bascule le profil actuel vers l'entrée de la filière ENTREPRENEUR, sans toucher au niveau/xp", async () => {
    const prisma = fakePrisma({});
    const { svc } = await service(prisma);
    const resultat = await svc.devenirEntrepreneur('u1');
    expect(resultat.profilActuelId).toBe('profil-ouvrier-qualifie');
    const appelUpdate = prisma.userCarriere.update.mock.calls[0][0];
    expect(appelUpdate.data).not.toHaveProperty('niveau');
    expect(appelUpdate.data).not.toHaveProperty('xp');
  });

  it("enregistre l'événement CREATION_ENTREPRISE dans l'historique", async () => {
    const prisma = fakePrisma({});
    const { svc } = await service(prisma);
    await svc.devenirEntrepreneur('u1');
    expect(prisma.carriereHistorique.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        type: 'CREATION_ENTREPRISE',
        profilId: 'profil-ouvrier-qualifie',
      }),
    });
  });

  it('enregistre le nom d’entreprise choisi dès la création, quand il est fourni', async () => {
    const prisma = fakePrisma({});
    const { svc } = await service(prisma);
    await svc.devenirEntrepreneur('u1', '  BTP Excellence  ');
    const appelUpdate = prisma.userCarriere.update.mock.calls[0][0];
    expect(appelUpdate.data.nomEntreprise).toBe('BTP Excellence');
  });

  it("n'écrit pas nomEntreprise si aucun nom n'est fourni", async () => {
    const prisma = fakePrisma({});
    const { svc } = await service(prisma);
    await svc.devenirEntrepreneur('u1');
    const appelUpdate = prisma.userCarriere.update.mock.calls[0][0];
    expect(appelUpdate.data).not.toHaveProperty('nomEntreprise');
  });
});

describe('CarriereService.renommerEntreprise', () => {
  it('refuse un nom vide', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.renommerEntreprise('u1', '   ')).rejects.toThrow(BadRequestException);
  });

  it('refuse un nom de plus de 60 caractères', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.renommerEntreprise('u1', 'x'.repeat(61))).rejects.toThrow(BadRequestException);
  });

  it("refuse si le joueur n'est pas dans la filière ENTREPRENEUR", async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', slug: 'chef-chantier' } }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.renommerEntreprise('u1', 'BTP Excellence')).rejects.toThrow('Réservé aux entrepreneurs');
  });

  it('met à jour le nom, sans le préfixe/suffixe d’espaces, pour un entrepreneur', async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } }),
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.renommerEntreprise('u1', '  Bâtisseurs du Sud  ');
    expect(resultat).toEqual({ nomEntreprise: 'Bâtisseurs du Sud' });
  });
});
