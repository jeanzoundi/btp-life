import { Test } from '@nestjs/testing';
import { PnjService } from './pnj.service';
import { PrismaService } from '../prisma/prisma.service';

const AKISSI = { id: 'pnj-akissi', slug: 'mentor-akissi', nom: 'Akissi — Mentor', role: 'PROFESSEUR' };
const MAITRE_STAGE = { id: 'pnj-stage', slug: 'maitre-stage-kouame', nom: 'Kouamé — Maître de stage', role: 'MAITRE_STAGE' };
const SUPERVISEUR = { id: 'pnj-sup', slug: 'superviseur-fatou', nom: 'Fatou — Superviseur', role: 'SUPERVISEUR' };
const CHEF_ENTREPRISE = { id: 'pnj-chef', slug: 'chef-entreprise-diallo', nom: "M. Diallo — Chef d'entreprise", role: 'CHEF_ENTREPRISE' };

/** Fabrique une famille de N profils, ordre 1..N, et positionne le joueur sur `ordreActuel`. */
function prismaAvecFamille(ordreActuel: number, ordreMax: number) {
  const profilsFamille = Array.from({ length: ordreMax }, (_, i) => ({ id: `profil-${i + 1}`, ordre: i + 1 }));
  return {
    userCarriere: {
      findUnique: jest.fn().mockResolvedValue({
        profilActuel: { famille: 'CHANTIER', ordre: ordreActuel },
      }),
    },
    profil: {
      findMany: jest.fn().mockResolvedValue(profilsFamille),
    },
    pnj: {
      findFirst: jest.fn().mockImplementation(({ where }: { where: { role: string } }) => {
        const parRole: Record<string, unknown> = {
          MAITRE_STAGE,
          SUPERVISEUR,
          CHEF_ENTREPRISE,
        };
        return Promise.resolve(parRole[where.role] ?? null);
      }),
      findUnique: jest.fn().mockResolvedValue(AKISSI),
    },
    userMessage: { create: jest.fn().mockResolvedValue({}) },
  };
}

async function service(prisma: ReturnType<typeof prismaAvecFamille>) {
  const module = await Test.createTestingModule({
    providers: [PnjService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return module.get(PnjService);
}

describe('PnjService.pnjHierarchique', () => {
  it('assigne le Maître de stage en tout début de filière (position basse)', async () => {
    const prisma = prismaAvecFamille(1, 5); // position = 1/5 = 0.2
    const svc = await service(prisma);
    expect((await svc.pnjHierarchique('u1'))?.role).toBe('MAITRE_STAGE');
  });

  it('assigne le Superviseur en milieu de filière (>= 0.4)', async () => {
    const prisma = prismaAvecFamille(2, 5); // position = 2/5 = 0.4 pile
    const svc = await service(prisma);
    expect((await svc.pnjHierarchique('u1'))?.role).toBe('SUPERVISEUR');
  });

  it('assigne le Chef d’entreprise au sommet de la filière (>= 0.75)', async () => {
    const prisma = prismaAvecFamille(4, 5); // position = 4/5 = 0.8
    const svc = await service(prisma);
    expect((await svc.pnjHierarchique('u1'))?.role).toBe('CHEF_ENTREPRISE');
  });

  it('reste au Maître de stage juste avant le seuil du Superviseur', async () => {
    const prisma = prismaAvecFamille(1, 3); // position = 1/3 ≈ 0.33 < 0.4
    const svc = await service(prisma);
    expect((await svc.pnjHierarchique('u1'))?.role).toBe('MAITRE_STAGE');
  });

  it('se rabat sur le mentor Akissi quand le joueur n’a pas encore choisi de profil', async () => {
    const prisma = {
      userCarriere: { findUnique: jest.fn().mockResolvedValue({ profilActuel: null }) },
      pnj: { findUnique: jest.fn().mockResolvedValue(AKISSI) },
    };
    const svc = await service(prisma as never);
    const pnj = await svc.pnjHierarchique('u1');
    expect(pnj?.slug).toBe('mentor-akissi');
  });
});

describe('PnjService — déclencheurs de progression', () => {
  it('surPromotion envoie un message via le PNJ hiérarchique actuel du joueur', async () => {
    const prisma = prismaAvecFamille(4, 5); // Chef d'entreprise
    const svc = await service(prisma);
    await svc.surPromotion('u1', 'Ancien poste', 'Nouveau poste');
    expect(prisma.userMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'u1', pnjId: CHEF_ENTREPRISE.id }),
      }),
    );
  });

  it('surChantierLivre privilégie le PNJ client du chantier plutôt que le PNJ hiérarchique quand fourni', async () => {
    const prisma = prismaAvecFamille(1, 5);
    const svc = await service(prisma);
    await svc.surChantierLivre('u1', 'Chantier Test', 'A', 'pnj-client-specifique');
    expect(prisma.userMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pnjId: 'pnj-client-specifique' }) }),
    );
  });

  it('messageDe écrit au nom du PNJ demandé, et se tait s’il n’existe pas', async () => {
    const prisma = prismaAvecFamille(1, 5);
    prisma.pnj.findUnique.mockResolvedValueOnce({ id: 'pnj-toure', slug: 'client-madame-toure', nom: 'Mme Touré — Cliente', role: 'CLIENT' });
    const svc = await service(prisma);
    await svc.messageDe('u1', 'client-madame-toure', 'Merci !');
    expect(prisma.pnj.findUnique).toHaveBeenCalledWith({ where: { slug: 'client-madame-toure' } });
    expect(prisma.userMessage.create).toHaveBeenCalledWith({ data: { userId: 'u1', pnjId: 'pnj-toure', contenu: 'Merci !' } });
    prisma.pnj.findUnique.mockResolvedValueOnce(null);
    prisma.userMessage.create.mockClear();
    await expect(svc.messageDe('u1', 'inconnu', 'Rien')).resolves.toBeNull();
    expect(prisma.userMessage.create).not.toHaveBeenCalled();
  });

  it('surChantierLivre se rabat sur le PNJ hiérarchique si aucun client n’est fourni', async () => {
    const prisma = prismaAvecFamille(1, 5); // Maître de stage
    const svc = await service(prisma);
    await svc.surChantierLivre('u1', 'Chantier Test', 'D', null);
    expect(prisma.userMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ pnjId: MAITRE_STAGE.id }) }),
    );
  });
});
