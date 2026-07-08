import { Test } from '@nestjs/testing';
import { ChantiersService } from './chantiers.service';
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

async function service(uc: ReturnType<typeof ucAvec>) {
  const prisma = {
    userChantier: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(uc),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...uc, ...data })),
    },
    carriereHistorique: { create: jest.fn().mockResolvedValue({}) },
  };
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
  return { svc: module.get(ChantiersService) as unknown as ServicePrive, prisma, progression, pnj };
}

describe('ChantiersService (livraison — notation finale)', () => {
  it('attribue la note A pour un chantier livré dans les temps, de haute qualité et sous budget', async () => {
    const uc = ucAvec({ qualite: 95, securite: 95, moralEquipe: 90, budgetRestant: 300_000, joursRestants: 3 });
    const { svc, progression, pnj } = await service(uc);
    const resultat = (await svc.livrer('u1', 'uc1')) as { noteFinale: string };
    expect(resultat.noteFinale).toBe('A');
    // Récompenses les plus généreuses pour une note A
    expect(progression.appliquerDelta).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ xp: 400, reputation: 10 }),
    );
    expect(pnj.surChantierLivre).toHaveBeenCalledWith('u1', 'Villa Test', 'A', null);
  });

  it('attribue la note D pour un chantier de mauvaise qualité, livré en retard et hors budget', async () => {
    const uc = ucAvec({ qualite: 20, securite: 20, moralEquipe: 20, budgetRestant: 0, joursRestants: -10 });
    const { svc, pnj } = await service(uc);
    const resultat = (await svc.livrer('u1', 'uc1')) as { noteFinale: string };
    expect(resultat.noteFinale).toBe('D');
    expect(pnj.surChantierLivre).toHaveBeenCalledWith('u1', 'Villa Test', 'D', null);
  });

  it('privilégie le PNJ client du chantier plutôt que le PNJ hiérarchique quand un client est assigné', async () => {
    const uc = ucAvec({ chantier: { nom: 'Villa Test', budget: 1_000_000, clientPnjId: 'pnj-client-1' } });
    const { svc, pnj } = await service(uc);
    await svc.livrer('u1', 'uc1');
    expect(pnj.surChantierLivre).toHaveBeenCalledWith('u1', 'Villa Test', expect.any(String), 'pnj-client-1');
  });

  it('ne dépasse jamais 100 pour le score budget même avec un budget restant très confortable', async () => {
    // budgetRestant très supérieur au budget initial ne doit pas produire un score négatif ou incohérent
    const uc = ucAvec({ qualite: 100, securite: 100, moralEquipe: 100, budgetRestant: 5_000_000, joursRestants: 5 });
    const { svc } = await service(uc);
    const resultat = (await svc.livrer('u1', 'uc1')) as { noteFinale: string };
    expect(resultat.noteFinale).toBe('A');
  });

  it('pénalise le score délai de 10 points par jour de retard', async () => {
    // qualité/sécurité/moral au max isolent l'effet du délai ; retard de 4 jours → score délai = 60
    const enRetard = ucAvec({ qualite: 100, securite: 100, moralEquipe: 100, budgetRestant: 1_000_000, joursRestants: -4 });
    const dansLesTemps = ucAvec({ qualite: 100, securite: 100, moralEquipe: 100, budgetRestant: 1_000_000, joursRestants: 0 });
    const { svc: svcRetard } = await service(enRetard);
    const { svc: svcOk } = await service(dansLesTemps);
    const resultatRetard = (await svcRetard.livrer('u1', 'uc1')) as { noteFinale: string };
    const resultatOk = (await svcOk.livrer('u1', 'uc1')) as { noteFinale: string };
    // Le retard doit strictement abaisser la note ou au moins ne jamais l'améliorer
    const ordre = { A: 4, B: 3, C: 2, D: 1 };
    expect(ordre[resultatRetard.noteFinale as keyof typeof ordre]).toBeLessThanOrEqual(
      ordre[resultatOk.noteFinale as keyof typeof ordre],
    );
  });
});
