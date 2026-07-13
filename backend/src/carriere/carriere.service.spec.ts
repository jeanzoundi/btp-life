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
  for (const cle of new Set([...Object.keys(defaut), ...Object.keys(overrides)])) {
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

  it("ne rétrograde jamais un niveau déjà supérieur à celui du profil choisi (ré-entrée dans l'onboarding)", async () => {
    const xpActuel = xpRequisPourNiveau(12) + 5000;
    const prisma = fakePrisma({
      profil: { findUnique: jest.fn().mockResolvedValue({ id: 'profil-etudiant-chantier', niveauDepart: 1 }) },
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ niveau: 12, xp: xpActuel }),
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.setProfilActuel('u1', { profilId: 'profil-etudiant-chantier' } as never);
    expect(resultat).toEqual({
      profilActuelId: 'profil-etudiant-chantier',
      niveau: 12,
      xp: xpActuel,
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

describe('CarriereService.prochaineEtape', () => {
  it("entreprise.eligible est vrai uniquement si le niveau et l'ordre du poste atteignent le seuil entrepreneur", async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({
          niveau: SEUIL_ENTREPRENEUR.niveauMin,
          reputation: 500,
          profilActuelId: 'p1',
          profilActuel: { famille: 'CHANTIER', ordre: SEUIL_ENTREPRENEUR.ordreMin },
        }),
      },
      reglePromotion: { findFirst: jest.fn().mockResolvedValue(null) },
      mission: { count: jest.fn().mockResolvedValue(0) },
      offreEmploi: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.prochaineEtape('u1');
    expect(resultat.entreprise.eligible).toBe(true);
  });

  it("entreprise.eligible reste faux sous le seuil de niveau, même avec un poste avancé", async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({
          niveau: SEUIL_ENTREPRENEUR.niveauMin - 1,
          reputation: 500,
          profilActuelId: 'p1',
          profilActuel: { famille: 'CHANTIER', ordre: SEUIL_ENTREPRENEUR.ordreMin },
        }),
      },
      reglePromotion: { findFirst: jest.fn().mockResolvedValue(null) },
      mission: { count: jest.fn().mockResolvedValue(0) },
      offreEmploi: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.prochaineEtape('u1');
    expect(resultat.entreprise.eligible).toBe(false);
  });

  it('specialisation.eligible reflète les conditions manquantes de la prochaine règle de promotion', async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({
          niveau: 35, reputation: 500, profilActuelId: 'p1', profilActuel: { famille: 'CHANTIER', ordre: 3 },
        }),
      },
      reglePromotion: { findFirst: jest.fn().mockResolvedValue({ conditions: { niveauMin: 40 }, profilCible: { nom: 'Conducteur' } }) },
      mission: { count: jest.fn().mockResolvedValue(0) },
      offreEmploi: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.prochaineEtape('u1');
    expect(resultat.specialisation?.eligible).toBe(false);
    expect(resultat.specialisation?.manquants).toEqual(['Niveau 40 requis (actuel : 35)']);
  });

  it("offres.eligibles ne compte que les offres où le niveau ET la réputation sont suffisants", async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({
          niveau: 10, reputation: 400, profilActuelId: 'p1', profilActuel: { famille: 'CHANTIER', ordre: 3 },
        }),
      },
      reglePromotion: { findFirst: jest.fn().mockResolvedValue(null) },
      mission: { count: jest.fn().mockResolvedValue(0) },
      offreEmploi: {
        findMany: jest.fn().mockResolvedValue([
          { niveauMin: 5, reputationMin: 300 }, // éligible
          { niveauMin: 20, reputationMin: 300 }, // niveau insuffisant
          { niveauMin: 5, reputationMin: 900 }, // réputation insuffisante
        ]),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.prochaineEtape('u1');
    expect(resultat.offres).toEqual({ eligibles: 1, total: 3 });
  });
});

describe('CarriereService.arbreCarriere', () => {
  const profilsFamille = [
    { id: 'p1', slug: 'etudiant', nom: 'Étudiant', description: null, ordre: 1 },
    { id: 'p2', slug: 'stagiaire', nom: 'Stagiaire', description: null, ordre: 2 },
    { id: 'p3', slug: 'chef-equipe', nom: "Chef d'équipe", description: null, ordre: 3 },
    { id: 'p4', slug: 'chef-chantier', nom: 'Chef chantier', description: null, ordre: 4 },
  ];

  it("renvoie famille null et postes vides si le joueur n'a pas encore choisi de profil", async () => {
    const prisma = fakePrisma({ userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: null }) } });
    const { svc } = await service(prisma);
    const resultat = await svc.arbreCarriere('u1');
    expect(resultat).toEqual({ famille: null, postes: [] });
  });

  it("classe chaque poste (atteint / actuel / prochain / verrouille) selon l'ordre du poste courant", async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', ordre: 2, nom: 'Stagiaire' } }),
      },
      profil: { findMany: jest.fn().mockResolvedValue(profilsFamille) },
      reglePromotion: { findMany: jest.fn().mockResolvedValue([]) },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.arbreCarriere('u1') as { postes: Array<{ statut: string; slug: string; estSommet: boolean }> };
    expect(resultat.postes.map((p) => p.statut)).toEqual(['atteint', 'actuel', 'prochain', 'verrouille']);
    expect(resultat.postes.find((p) => p.slug === 'chef-chantier')?.estSommet).toBe(true);
  });

  it("n'évalue les conditions manquantes que pour le poste 'prochain', jamais pour les postes hors de portée", async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({ profilActuel: { famille: 'CHANTIER', ordre: 2, nom: 'Stagiaire' }, niveau: 5, reputation: 100 }),
      },
      profil: { findMany: jest.fn().mockResolvedValue(profilsFamille) },
      reglePromotion: {
        findMany: jest.fn().mockResolvedValue([
          { profilCibleId: 'p3', conditions: { niveauMin: 10 } },
          { profilCibleId: 'p4', conditions: { niveauMin: 50 } },
        ]),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.arbreCarriere('u1') as {
      postes: Array<{ slug: string; manquants: string[]; eligible: boolean }>;
    };
    const prochain = resultat.postes.find((p) => p.slug === 'chef-equipe');
    const verrouille = resultat.postes.find((p) => p.slug === 'chef-chantier');
    expect(prochain?.manquants).toEqual(['Niveau 10 requis (actuel : 5)']);
    expect(prochain?.eligible).toBe(false);
    // Poste encore verrouillé : ses conditions ne sont même pas évaluées (hors de portée).
    expect(verrouille?.manquants).toEqual([]);
    expect(verrouille?.eligible).toBe(false);
  });
});

describe('CarriereService.setMetierCible', () => {
  it("échoue proprement si le métier cible n'existe pas", async () => {
    const prisma = fakePrisma({ metierCible: { findUnique: jest.fn().mockResolvedValue(null) } });
    const { svc } = await service(prisma);
    await expect(svc.setMetierCible('u1', { metierCibleId: 'inconnu' } as never)).rejects.toThrow(NotFoundException);
  });

  it('met à jour le métier cible du joueur quand il existe', async () => {
    const prisma = fakePrisma({
      metierCible: { findUnique: jest.fn().mockResolvedValue({ id: 'metier-1' }) },
      userCarriere: {
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.setMetierCible('u1', { metierCibleId: 'metier-1' } as never);
    expect(resultat).toEqual({ metierCibleId: 'metier-1' });
  });
});

describe('CarriereService.genererParcours', () => {
  it('échoue si le profil actuel ou le métier cible sont manquants', async () => {
    const prisma = fakePrisma({
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: null, metierCible: null }) },
    });
    const { svc } = await service(prisma);
    await expect(svc.genererParcours('u1')).rejects.toThrow(BadRequestException);
  });

  it('construit les étapes à partir des profils de la famille du métier cible, dès l\'ordre courant', async () => {
    const prisma = fakePrisma({
      userCarriere: {
        findUnique: jest.fn().mockResolvedValue({
          profilActuel: { ordre: 2 },
          metierCible: { famille: 'CHANTIER' },
        }),
      },
      profil: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'p1', slug: 'etudiant', nom: 'Étudiant', ordre: 1 },
          { id: 'p2', slug: 'stagiaire', nom: 'Stagiaire', ordre: 2 },
          { id: 'p3', slug: 'chef-equipe', nom: "Chef d'équipe", ordre: 3 },
        ]),
      },
      parcours: {
        create: jest.fn().mockImplementation(({ data }: { data: { etapes: unknown[] } }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.genererParcours('u1') as unknown as { etapes: Array<{ slug: string; complete: boolean }> };
    // Ne garde que les postes à partir de l'ordre courant (2) : stagiaire et chef d'équipe, pas étudiant (déjà dépassé).
    expect(resultat.etapes.map((e) => e.slug)).toEqual(['stagiaire', 'chef-equipe']);
    expect(resultat.etapes[0].complete).toBe(true);
    expect(resultat.etapes[1].complete).toBe(false);
  });
});

describe('CarriereService.setTraits', () => {
  it('refuse moins de 1 ou plus de 3 traits', async () => {
    const prisma = fakePrisma();
    const { svc } = await service(prisma);
    await expect(svc.setTraits('u1', [])).rejects.toThrow(BadRequestException);
    await expect(svc.setTraits('u1', ['a', 'b', 'c', 'd'])).rejects.toThrow(BadRequestException);
  });

  it('persiste 1 à 3 traits choisis', async () => {
    const prisma = fakePrisma({
      userCarriere: {
        update: jest.fn().mockImplementation(({ data }: { data: object }) => Promise.resolve(data)),
      },
    });
    const { svc } = await service(prisma);
    const resultat = await svc.setTraits('u1', ['sociable', 'rigoureux']);
    expect(resultat).toEqual({ traits: ['sociable', 'rigoureux'] });
  });
});
