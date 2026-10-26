import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EntrepriseService, journeeEntreprise, lireActivite, rattraper, REGLES_ENTREPRISE, type Employe } from './entreprise.service';

const MAINTENANT = new Date('2026-10-26T12:00:00.000Z');
const macon = (n: number): Employe[] => Array.from({ length: n }, (_, i) => ({ poste: 'macon', nom: `M${i}`, embaucheLe: MAINTENANT.toISOString() }));

describe('la journée d’une entreprise', () => {
  it('gagne de l’argent avec une équipe bien dimensionnée, et sa réputation monte', () => {
    // 3 maçons : 3 × 6 500 × (0,6 + 50/125) = 19 500 F de chiffre, 270 000/30 + 2 500 = 11 500 F de charges.
    expect(journeeEntreprise(100_000, 50, macon(3))).toMatchObject({ chiffre: 19_500, charges: 11_500, resultat: 8_000, capital: 108_000, reputation: 51 });
  });
  it('perd de l’argent sans équipe (les frais fixes courent), et le dernier embauché part quand le capital ne suffit plus', () => {
    expect(journeeEntreprise(10_000, 50, [])).toMatchObject({ chiffre: 0, resultat: -2_500, capital: 7_500 });
    const conducteurs: Employe[] = [{ poste: 'conducteur-travaux', nom: 'A', embaucheLe: '' }, { poste: 'conducteur-travaux', nom: 'B', embaucheLe: '' }];
    const r = journeeEntreprise(1_000, 0, conducteurs);
    expect(r.capital).toBe(0);
    expect(r.equipe.map(e => e.nom)).toEqual(['A']);
    expect(r.reputation).toBe(0);
  });
  it('rattrape les jours écoulés un par un, trente au plus', () => {
    const activite = lireActivite({ equipe: macon(3), majLe: new Date(MAINTENANT.getTime() - 3 * 86_400_000).toISOString(), journal: [] }, MAINTENANT);
    const r = rattraper(100_000, 50, activite, MAINTENANT);
    expect(r.jours).toBe(3);
    expect(r.activite.journal).toHaveLength(3);
    expect(r.capital).toBeGreaterThan(120_000);
    const loin = rattraper(100_000, 50, { ...activite, majLe: '2020-01-01T00:00:00.000Z' }, MAINTENANT);
    expect(loin.jours).toBe(REGLES_ENTREPRISE.joursMax);
  });
});

function fakePrisma(overrides: { niveau?: number; argent?: number; entreprise?: Record<string, unknown> | null } = {}) {
  const carriere = { userId: 'u1', niveau: overrides.niveau ?? 15, argentVirtuel: overrides.argent ?? 500_000, profilActuel: { famille: 'CHANTIER' } };
  let entreprise = overrides.entreprise ?? null;
  const prisma = {
    userCarriere: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...carriere })),
      update: jest.fn().mockImplementation(({ data }: { data: { argentVirtuel: { decrement: number } } }) => { carriere.argentVirtuel -= data.argentVirtuel.decrement; return Promise.resolve({ ...carriere }); }),
    },
    entrepriseVirtuelle: {
      findFirst: jest.fn().mockImplementation(() => Promise.resolve(entreprise ? { ...entreprise } : null)),
      create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { entreprise = { id: 'e1', ...data }; return Promise.resolve({ ...entreprise }); }),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { entreprise = { ...entreprise, ...data }; return Promise.resolve({ ...entreprise }); }),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return { prisma, carriere, lire: () => entreprise };
}
async function service(prisma: ReturnType<typeof fakePrisma>['prisma']) {
  const module = await Test.createTestingModule({ providers: [EntrepriseService, { provide: PrismaService, useValue: prisma }] }).compile();
  return module.get(EntrepriseService);
}

describe('EntrepriseService', () => {
  it('crée l’entreprise avec l’apport du joueur, une seule fois, à partir du niveau requis', async () => {
    const { prisma, carriere } = fakePrisma();
    const svc = await service(prisma);
    const r = await svc.creer('u1', 'Bâti-Lagune', 200_000);
    expect(r.entreprise).toMatchObject({ nom: 'Bâti-Lagune', capital: 200_000, reputation: 50, equipe: [] });
    expect(carriere.argentVirtuel).toBe(300_000);
    await expect(svc.creer('u1', 'Autre', 200_000)).rejects.toThrow(ConflictException);
    const debutant = fakePrisma({ niveau: 5 });
    await expect((await service(debutant.prisma)).creer('u1', 'Trop tôt', 200_000)).rejects.toThrow(BadRequestException);
  });
  it('embauche contre un mois de salaire en capital, et licencie avec une indemnité', async () => {
    const { prisma, lire } = fakePrisma({ entreprise: { id: 'e1', userId: 'u1', nom: 'Bâti-Lagune', capitalVirtuel: 120_000, reputationEntreprise: 50, employes: { equipe: [], majLe: MAINTENANT.toISOString(), journal: [] } } });
    const svc = await service(prisma);
    const r = await svc.embaucher('u1', 'macon');
    expect(r.entreprise.equipe).toHaveLength(1);
    expect(r.entreprise.prevision.resultat).toBe(Math.round(6_500) - Math.round(90_000 / 30 + 2_500));
    await expect(svc.embaucher('u1', 'conducteur-travaux')).rejects.toThrow(BadRequestException);
    const apres = await svc.licencier('u1', 0);
    expect(apres.entreprise.equipe).toHaveLength(0);
    expect(lire()?.capitalVirtuel).toBe(120_000 - 22_500);
  });
  it('fait passer l’argent du compte au capital et verse des dividendes', async () => {
    const { prisma, carriere } = fakePrisma({ entreprise: { id: 'e1', userId: 'u1', nom: 'B', capitalVirtuel: 100_000, reputationEntreprise: 50, employes: { equipe: [], majLe: MAINTENANT.toISOString(), journal: [] } } });
    const svc = await service(prisma);
    await expect(svc.mouvement('u1', 50_000)).resolves.toMatchObject({ entreprise: { capital: 150_000 } });
    expect(carriere.argentVirtuel).toBe(450_000);
    await expect(svc.mouvement('u1', -30_000)).resolves.toMatchObject({ entreprise: { capital: 120_000 } });
    expect(carriere.argentVirtuel).toBe(480_000);
    await expect(svc.mouvement('u1', -1_000_000)).rejects.toThrow(BadRequestException);
  });
});
