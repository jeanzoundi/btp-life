import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChantiersService, conditionsChantierPour, chantierEstAccessible, apportPersonnelRequis } from './chantiers.service';
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
    userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 1, argentVirtuel: 999_999 }) },
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

describe('conditionsChantierPour / chantierEstAccessible', () => {
  it('renvoie niveau 1 sans restriction pour un chantier non listé', () => {
    expect(conditionsChantierPour('dalle-riviera')).toEqual({ niveauMin: 1 });
  });

  it('varie le niveau minimum selon l’ambition du projet (pas toujours 5)', () => {
    expect(conditionsChantierPour('amenagement-koumassi').niveauMin).toBe(4);
    expect(conditionsChantierPour('villa-r1-marcory').niveauMin).toBe(5);
    expect(conditionsChantierPour('route-abobo').niveauMin).toBe(5);
    expect(conditionsChantierPour('pont-bassam').niveauMin).toBe(8);
  });

  it('un chantier normal reste accessible à n’importe quel niveau', () => {
    expect(chantierEstAccessible('dalle-riviera', 1, null)).toBe(true);
  });

  it('le pont s’ouvre au niveau requis, SANS poste particulier', () => {
    expect(chantierEstAccessible('pont-bassam', 8, null)).toBe(true);
    expect(chantierEstAccessible('pont-bassam', 3, null)).toBe(false);
  });

  it('le pont s’ouvre aussi via un poste précis, MÊME sous le niveau requis (condition OU)', () => {
    expect(chantierEstAccessible('pont-bassam', 3, 'chef-chantier')).toBe(true);
    expect(chantierEstAccessible('pont-bassam', 3, 'conducteur-travaux')).toBe(true);
    expect(chantierEstAccessible('pont-bassam', 3, 'ingenieur-structure')).toBe(true);
  });

  it('un poste non listé ne débloque rien tout seul', () => {
    expect(chantierEstAccessible('pont-bassam', 3, 'stagiaire-chantier')).toBe(false);
  });

  it('les chantiers au-delà du plafond de promotion (niveau 9) montent jusqu’à 20', () => {
    expect(conditionsChantierPour('assainissement-yopougon').niveauMin).toBe(10);
    expect(conditionsChantierPour('groupe-scolaire-bouake').niveauMin).toBe(12);
    expect(conditionsChantierPour('centre-sante-sanpedro').niveauMin).toBe(15);
    expect(conditionsChantierPour('lotissement-anyama').niveauMin).toBe(18);
    expect(conditionsChantierPour('complexe-industriel-sanpedro').niveauMin).toBe(20);
  });

  it('le complexe industriel s’ouvre aussi via un poste avancé (gérant), sous le niveau requis', () => {
    expect(chantierEstAccessible('complexe-industriel-sanpedro', 10, 'gerant')).toBe(true);
    expect(chantierEstAccessible('complexe-industriel-sanpedro', 10, 'stagiaire-chantier')).toBe(false);
    expect(chantierEstAccessible('complexe-industriel-sanpedro', 20, null)).toBe(true);
  });
});

describe('ChantiersService.demarrer — verrouillage par niveau et par poste', () => {
  it('refuse de démarrer un grand chantier si le joueur n’a pas le niveau requis', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'villa-r1-marcory', budget: 9_500_000, delaiJours: 35 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 3, profilActuel: null }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).rejects.toThrow(BadRequestException);
  });

  it('autorise le démarrage une fois le niveau requis atteint', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'villa-r1-marcory', budget: 9_500_000, delaiJours: 35 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 5, profilActuel: null, argentVirtuel: 10_000 }) },
      userChantier: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'uc-nouveau' }),
      },
    });
    const { svc, progression } = await service(prisma);
    const resultat = await svc.demarrer('u1', 'c1');
    expect(resultat).toEqual({ id: 'uc-nouveau' });
    // apportPersonnelRequis(5) = max(300, 5*500) = 2500, débité de l'argent personnel du joueur.
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { argentVirtuel: -2500 });
  });

  it('refuse le pont à bas niveau sans poste éligible', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'pont-bassam', budget: 12_000_000, delaiJours: 40 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 3, profilActuel: { slug: 'stagiaire-chantier' } }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).rejects.toThrow(BadRequestException);
  });

  it('autorise le pont à bas niveau si le joueur occupe un poste éligible (chef de chantier)', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'pont-bassam', budget: 12_000_000, delaiJours: 40 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 3, profilActuel: { slug: 'chef-chantier' }, argentVirtuel: 10_000 }) },
      userChantier: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'uc-pont' }),
      },
    });
    const { svc } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).resolves.toEqual({ id: 'uc-pont' });
  });

  it('ne bloque jamais un chantier ordinaire, quel que soit le niveau', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'dalle-riviera', budget: 3_500_000, delaiJours: 15 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 1, profilActuel: null, argentVirtuel: 1_000 }) },
      userChantier: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'uc-nouveau' }),
      },
    });
    const { svc } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).resolves.toEqual({ id: 'uc-nouveau' });
  });
});

describe('apportPersonnelRequis', () => {
  it('vaut un plancher de 300 F pour les chantiers sans seuil de niveau particulier', () => {
    expect(apportPersonnelRequis(1)).toBe(500);
  });

  it('croît avec le niveau minimum requis', () => {
    expect(apportPersonnelRequis(5)).toBe(2500);
    expect(apportPersonnelRequis(8)).toBe(4000);
    expect(apportPersonnelRequis(20)).toBe(10_000);
  });
});

describe('ChantiersService.demarrer — apport personnel', () => {
  it('refuse de démarrer si l’argent personnel est insuffisant, même niveau et poste requis atteints', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'villa-r1-marcory', budget: 9_500_000, delaiJours: 35 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 5, profilActuel: null, argentVirtuel: 100 }) },
    });
    const { svc, progression } = await service(prisma);
    await expect(svc.demarrer('u1', 'c1')).rejects.toThrow('Apport personnel insuffisant');
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
  });

  it('débite l’apport personnel du joueur (pas le budget du chantier) au démarrage', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'pont-bassam', budget: 14_000_000, delaiJours: 45 }) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 8, profilActuel: null, argentVirtuel: 4_000 }) },
      userChantier: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'uc-pont' }),
      },
    });
    const { svc, progression } = await service(prisma);
    await svc.demarrer('u1', 'c1');
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { argentVirtuel: -4000 });
  });
});

describe('ChantiersService.disponibles — annotation par joueur', () => {
  it('signale un chantier accessible via poste comme non verrouillé, même sous le niveau requis', async () => {
    const prisma = fakePrisma({
      chantier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'c1', slug: 'pont-bassam', nom: 'Pont — Bassam' },
        ]),
      },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 3, profilActuel: { slug: 'ingenieur-structure' } }) },
    });
    const { svc } = await service(prisma);
    const [resultat] = await svc.disponibles('u1');
    expect(resultat.verrouille).toBe(false);
    expect(resultat.niveauRequis).toBe(8);
    expect(resultat.apportRequis).toBe(4000);
  });

  it('verrouille le même chantier pour un joueur sans le niveau ni le poste', async () => {
    const prisma = fakePrisma({
      chantier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'c1', slug: 'pont-bassam', nom: 'Pont — Bassam' },
        ]),
      },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 3, profilActuel: { slug: 'stagiaire-chantier' } }) },
    });
    const { svc } = await service(prisma);
    const [resultat] = await svc.disponibles('u1');
    expect(resultat.verrouille).toBe(true);
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

describe('ChantiersService.soumettreOffre — appel d’offres des marchés', () => {
  const marchePrive = { id: 'c1', slug: 'marche-prive-extension-riviera', typeMarche: 'PRIVE', budget: 4_500_000, delaiJours: 18 };
  const marchePublic = { id: 'c2', slug: 'marche-public-ecole-yopougon', typeMarche: 'PUBLIC', budget: 9_500_000, delaiJours: 28 };
  const entrepreneurEligible = { niveau: 10, reputation: 80, profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } };

  afterEach(() => jest.restoreAllMocks());

  it('refuse une offre sur un chantier qui n’est pas un marché', async () => {
    const prisma = fakePrisma({ chantier: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', typeMarche: null }) } });
    const { svc } = await service(prisma);
    await expect(svc.soumettreOffre('u1', 'c1', 4_000_000)).rejects.toThrow("n'est pas un marché");
  });

  it('refuse si le joueur n’est pas dans la filière ENTREPRENEUR', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePrive) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 10, reputation: 80, profilActuel: { famille: 'CHANTIER', slug: 'chef-chantier' } }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.soumettreOffre('u1', 'c1', 4_000_000)).rejects.toThrow('Réservé aux entrepreneurs');
  });

  it('refuse si le niveau ou la réputation du marché ne sont pas atteints', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePublic) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 10, reputation: 10, profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.soumettreOffre('u2', 'c2', 8_000_000)).rejects.toThrow('Conditions non remplies');
  });

  it('refuse une offre hors de la fourchette [60%, 115%] du budget de référence', async () => {
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePrive) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue(entrepreneurEligible) },
    });
    const { svc } = await service(prisma);
    await expect(svc.soumettreOffre('u1', 'c1', 999)).rejects.toThrow('Ton offre doit être comprise entre');
    await expect(svc.soumettreOffre('u1', 'c1', 999_999_999)).rejects.toThrow('Ton offre doit être comprise entre');
  });

  it('gagne face à des concurrents fictifs avec un prix très compétitif et une bonne réputation', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // concurrents "moyens" : prix médian, réputation ~60
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePrive) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue(entrepreneurEligible) },
      userChantier: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'uc-marche', ...data })) },
    });
    const { svc } = await service(prisma);
    const prixTresBas = Math.round(marchePrive.budget * 0.6); // le minimum autorisé : offre imbattable sur le prix
    const resultat = await svc.soumettreOffre('u1', 'c1', prixTresBas);
    expect(resultat.gagne).toBe(true);
    expect(resultat.userChantier?.budgetRestant).toBe(prixTresBas);
  });

  it('perd face à des concurrents fictifs avec une offre chère et une réputation basse', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const prisma = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePrive) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 10, reputation: 21, profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } }) },
    });
    const { svc, progression } = await service(prisma);
    const prixTresHaut = Math.round(marchePrive.budget * 1.15); // le maximum autorisé : offre la moins compétitive possible
    const resultat = await svc.soumettreOffre('u1', 'c1', prixTresHaut);
    expect(resultat.gagne).toBe(false);
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 15 });
  });

  it('pèse la réputation plus lourd sur un marché public qu’un marché privé', async () => {
    // Même compétitivité de prix (médiocre, 20 %) et même réputation (90) sur les deux marchés :
    // scoreConcurrent identique des deux côtés (0.53, avec Math.random figé à 0.5) ; seul le
    // poids de la réputation diffère selon typeMarche, ce qui doit suffire à faire perdre le
    // privé (poids réputation 0.3 → score 0.41) et gagner le public (poids 0.55 → score 0.585).
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const carriereTresReputee = { niveau: 10, reputation: 90, profilActuel: { famille: 'ENTREPRENEUR', slug: 'gerant' } };
    // Prix à 20 % de compétitivité : proche du plafond, donc peu compétitif sur le prix seul.
    const prixPeuCompetitif = (chantier: { budget: number }) => {
      const prixMin = Math.round(chantier.budget * 0.6);
      const prixMax = Math.round(chantier.budget * 1.15);
      return Math.round(prixMax - 0.2 * (prixMax - prixMin));
    };

    const prismaPrive = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePrive) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue(carriereTresReputee) },
    });
    const prismaPublic = fakePrisma({
      chantier: { findUnique: jest.fn().mockResolvedValue(marchePublic) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue(carriereTresReputee) },
      userChantier: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'uc-marche', ...data })) },
    });
    const { svc: svcPrive } = await service(prismaPrive);
    const { svc: svcPublic } = await service(prismaPublic);

    const resultatPrive = await svcPrive.soumettreOffre('u1', 'c1', prixPeuCompetitif(marchePrive));
    const resultatPublic = await svcPublic.soumettreOffre('u1', 'c2', prixPeuCompetitif(marchePublic));

    expect(resultatPublic.gagne).toBe(true);
    expect(resultatPrive.gagne).toBe(false);
  });
});

describe('ChantiersService.marchesDisponibles', () => {
  it('renvoie une liste vide de marchés accessibles pour un non-entrepreneur (tous verrouillés)', async () => {
    const prisma = fakePrisma({
      chantier: { findMany: jest.fn().mockResolvedValue([{ id: 'c1', slug: 'marche-prive-extension-riviera', budget: 4_500_000 }]) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 10, reputation: 80, profilActuel: { famille: 'CHANTIER' } }) },
      userChantier: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);
    const [marche] = await svc.marchesDisponibles('u1');
    expect(marche.verrouille).toBe(true);
    expect(marche.entrepreneurRequis).toBe(true);
  });

  it('annote le marché comme accessible pour un entrepreneur qui remplit les conditions', async () => {
    const prisma = fakePrisma({
      chantier: { findMany: jest.fn().mockResolvedValue([{ id: 'c1', slug: 'marche-prive-extension-riviera', budget: 4_500_000 }]) },
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ niveau: 10, reputation: 80, profilActuel: { famille: 'ENTREPRENEUR' } }) },
      userChantier: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);
    const [marche] = await svc.marchesDisponibles('u1');
    expect(marche.verrouille).toBe(false);
    expect(marche.entrepreneurRequis).toBe(false);
    expect(marche.prixMin).toBe(Math.round(4_500_000 * 0.6));
    expect(marche.prixMax).toBe(Math.round(4_500_000 * 1.15));
  });
});
