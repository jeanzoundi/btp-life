import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CarriereService, SEUIL_ENTREPRENEUR } from './carriere.service';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import { EpargneService } from './epargne.service';
import { xpRequisPourNiveau } from './progression.service';

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    userCarriere: {
      // niveau 35 + ordre 3 : satisfait par défaut SEUIL_ENTREPRENEUR (niveau 30, ordre 3), pour
      // que les tests qui ne portent pas spécifiquement sur ce seuil n'aient pas à le répéter.
      findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', slug: 'chef-equipe', ordre: 3 }, niveau: 35, xp: 1000, reputation: 500 }),
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

  it(`refuse si le niveau est sous ${SEUIL_ENTREPRENEUR.niveauMin}, même avec un poste suffisamment avancé`, async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', slug: 'chef-equipe', ordre: 3 }, niveau: 29 }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.devenirEntrepreneur('u1')).rejects.toThrow(`niveau ${SEUIL_ENTREPRENEUR.niveauMin}`);
  });

  it(`refuse si le poste n'a pas dépassé ordre ${SEUIL_ENTREPRENEUR.ordreMin}, même avec le niveau requis`, async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', slug: 'etudiant-chantier', ordre: 1 }, niveau: 50 }) },
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

describe('CarriereService.setProfilActuel', () => {
  it("relève l'xp au minimum requis pour le niveau de départ du profil, quand l'xp actuel est plus bas", async () => {
    const prisma = fakePrisma({
      profil: { findUnique: jest.fn().mockResolvedValue({ id: 'profil-chef-equipe', niveauDepart: 6 }) },
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ xp: 0 }),
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.setProfilActuel('u1', { profilId: 'profil-chef-equipe' } as never);
    expect(resultat).toEqual({
      profilActuelId: 'profil-chef-equipe',
      niveau: 6,
      xp: xpRequisPourNiveau(6),
    });
  });

  it("conserve l'xp déjà acquis s'il dépasse le minimum requis pour le niveau de départ du profil", async () => {
    const xpDejaAcquis = xpRequisPourNiveau(6) + 5000;
    const prisma = fakePrisma({
      profil: { findUnique: jest.fn().mockResolvedValue({ id: 'profil-chef-equipe', niveauDepart: 6 }) },
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ xp: xpDejaAcquis }),
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.setProfilActuel('u1', { profilId: 'profil-chef-equipe' } as never);
    expect(resultat).toEqual({
      profilActuelId: 'profil-chef-equipe',
      niveau: 6,
      xp: xpDejaAcquis,
    });
  });

  it("échoue proprement si le profil n'existe pas", async () => {
    const prisma = fakePrisma({
      profil: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    const { svc } = await service(prisma);
    await expect(svc.setProfilActuel('u1', { profilId: 'inconnu' } as never)).rejects.toThrow(NotFoundException);
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
