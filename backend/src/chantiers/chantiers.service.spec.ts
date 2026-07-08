import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChantiersService, niveauRequisPour } from './chantiers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../carriere/progression.service';
import { BesoinsService } from '../carriere/besoins.service';
import { PnjService } from '../carriere/pnj.service';

// `livrer` est privée — on y accède via un cast vers une interface autonome (pas une
// intersection avec ChantiersService, qui s'effondrerait en `never` à cause du membre privé),
// pattern courant pour tester la logique de notation sans simuler toute la mécanique de `journee()`.
interface ServicePrive {
  livrer: (userId: string, userChantierId: string) => Promise<unknown>;
}

function ucAvec(overrides: Record<string, unknown>) {
  return {
    id: 'uc1',
    chantierId: 'chantier1',
    budgetRestant: 800_000,
    joursRestants: 2,
    qualite: 80,
    securite: 80,
    moralEquipe: 80,
    evenementsLog: [],
    chantier: { nom: 'Villa Test', budget: 1_000_000, clientPnjId: null },
    ...overrides,
  };
}

function fakePrisma(overrides: Record<string, object> = {}) {
  const defaut: Record<string, object> = {
    userChantier: {
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      create: jest.fn(),
    },
    userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 1 }) },
    chantier: { findUnique: jest.fn() },
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
  const progression = { appliquerDelta: jest.fn().mockResolvedValue({}) };
  const besoinsJoueur = { consommer: jest.fn().mockResolvedValue({}) };
  const pnj = { surChantierLivre: jest.fn().mockResolvedValue(undefined) };

  const module = await Test.createTestingModule({
    providers: [
      ChantiersService,
      { provide: PrismaService, useValue: prisma },
      { provide: ProgressionService, useValue: progression },
      { provide: BesoinsService, useValue: besoinsJoueur },
      { provide: PnjService, useValue: pnj },
    ],
  }).compile();
  return { svc: module.get(ChantiersService), prisma, progression, pnj };
}

describe('niveauRequisPour', () => {
  it('renvoie 1 (aucune restriction) pour un chantier non listé', () => {
    expect(niveauRequisPour('dalle-riviera')).toBe(1);
  });

  it('renvoie le niveau minimum pour les grands chantiers de la zone industrielle', () => {
    expect(niveauRequisPour('villa-r1-marcory')).toBe(5);
    expect(niveauRequisPour('route-abobo')).toBe(5);
  });
});

describe('ChantiersService.demarrer — verrouillage par niveau', () => {
  it('refuse de démarrer un grand chantier si le joueur n’a pas le niveau requis', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'villa-r1-marcory', budget: 9_500_000, delaiJours: 35 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 3 }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).rejects.toThrow(BadRequestException);
  });

  it('autorise le démarrage une fois le niveau requis atteint', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'villa-r1-marcory', budget: 9_500_000, delaiJours: 35 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 5 }) },
      userChantier: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'uc-nouveau' }),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.demarrer('u1', 'c1');
    expect(resultat).toEqual({ id: 'uc-nouveau' });
  });

  it('ne bloque jamais un chantier ordinaire, quel que soit le niveau', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'dalle-riviera', budget: 3_500_000, delaiJours: 15 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 1 }) },
      userChantier: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'uc-nouveau' }),
      },
    });
    const { svc } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).resolves.toEqual({ id: 'uc-nouveau' });
  });
});

describe('ChantiersService (livraison — notation finale)', () => {
  it('attribue la note A pour un chantier livré dans les temps, de haute qualité et sous budget', async () => {
    const uc = ucAvec({ qualite: 95, securite: 95, moralEquipe: 90, budgetRestant: 300_000, joursRestants: 3 });
    const prisma = fakePrisma({ userChantier: { findUniqueOrThrow: jest.fn().mockResolvedValue(uc), update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ ...uc, ...data })) } });
    const { svc, progression, pnj } = await service(prisma);
    const resultat = (await (svc as unknown as ServicePrive).livrer('u1', 'uc1')) as { noteFinale: string };
    expect(resultat.noteFinale).toBe('A');
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', expect.objectContaining({ xp: 400, reputation: 10 }));
    expect(pnj.surChantierLivre).toHaveBeenCalledWith('u1', 'Villa Test', 'A', null);
  });

  it('attribue la note D pour un chantier de mauvaise qualité, livré en retard et hors budget', async () => {
    const uc = ucAvec({ qualite: 20, securite: 20, moralEquipe: 20, budgetRestant: 0, joursRestants: -10 });
    const prisma = fakePrisma({ userChantier: { findUniqueOrThrow: jest.fn().mockResolvedValue(uc), update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ ...uc, ...data })) } });
    const { svc, pnj } = await service(prisma);
    const resultat = (await (svc as unknown as ServicePrive).livrer('u1', 'uc1')) as { noteFinale: string };
    expect(resultat.noteFinale).toBe('D');
    expect(pnj.surChantierLivre).toHaveBeenCalledWith('u1', 'Villa Test', 'D', null);
  });

  it('privilégie le PNJ client du chantier plutôt que le PNJ hiérarchique quand un client est assigné', async () => {
    const uc = ucAvec({ chantier: { nom: 'Villa Test', budget: 1_000_000, clientPnjId: 'pnj-client-1' } });
    const prisma = fakePrisma({ userChantier: { findUniqueOrThrow: jest.fn().mockResolvedValue(uc), update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ ...uc, ...data })) } });
    const { svc, pnj } = await service(prisma);
    await (svc as unknown as ServicePrive).livrer('u1', 'uc1');
    expect(pnj.surChantierLivre).toHaveBeenCalledWith('u1', 'Villa Test', expect.any(String), 'pnj-client-1');
  });

  it('ne dépasse jamais 100 pour le score budget même avec un budget restant très confortable', async () => {
    const uc = ucAvec({ qualite: 100, securite: 100, moralEquipe: 100, budgetRestant: 5_000_000, joursRestants: 5 });
    const prisma = fakePrisma({ userChantier: { findUniqueOrThrow: jest.fn().mockResolvedValue(uc), update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ ...uc, ...data })) } });
    const { svc } = await service(prisma);
    const resultat = (await (svc as unknown as ServicePrive).livrer('u1', 'uc1')) as { noteFinale: string };
    expect(resultat.noteFinale).toBe('A');
  });

  it('pénalise le score délai de 10 points par jour de retard', async () => {
    const enRetard = ucAvec({ qualite: 100, securite: 100, moralEquipe: 100, budgetRestant: 1_000_000, joursRestants: -4 });
    const dansLesTemps = ucAvec({ qualite: 100, securite: 100, moralEquipe: 100, budgetRestant: 1_000_000, joursRestants: 0 });
    const prismaRetard = fakePrisma({ userChantier: { findUniqueOrThrow: jest.fn().mockResolvedValue(enRetard), update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ ...enRetard, ...data })) } });
    const prismaOk = fakePrisma({ userChantier: { findUniqueOrThrow: jest.fn().mockResolvedValue(dansLesTemps), update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve({ ...dansLesTemps, ...data })) } });
    const { svc: svcRetard } = await service(prismaRetard);
    const { svc: svcOk } = await service(prismaOk);
    const resultatRetard = (await (svcRetard as unknown as ServicePrive).livrer('u1', 'uc1')) as { noteFinale: string };
    const resultatOk = (await (svcOk as unknown as ServicePrive).livrer('u1', 'uc1')) as { noteFinale: string };
    const ordre = { A: 4, B: 3, C: 2, D: 1 };
    expect(ordre[resultatRetard.noteFinale as keyof typeof ordre]).toBeLessThanOrEqual(
      ordre[resultatOk.noteFinale as keyof typeof ordre],
    );
  });
});
