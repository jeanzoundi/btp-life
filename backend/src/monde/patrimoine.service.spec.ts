import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from '../carriere/besoins.service';
import { ProgressionService } from '../carriere/progression.service';
import {
  confortLogement, coutMateriaux, ENERGIE_JOURNEE_TRAVAUX, facteurFatigueOutils, facteurXpOutils, INTERVALLE_JOURNEE_TRAVAUX_MS, lirePatrimoine, reglerLoyer, RENOVATIONS, SEMAINE_MS,
} from '../carriere/patrimoine';
import { MORAL_LOYER_IMPAYE, PatrimoineService } from './patrimoine.service';

const MAINTENANT = new Date('2026-10-26T12:00:00.000Z');
const ilYa = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000).toISOString();

function fakePrisma(overrides: { patrimoine?: unknown; argent?: number; traits?: string[] } = {}) {
  const etat: Record<string, unknown> = { userId: 'u1', patrimoine: 'patrimoine' in overrides ? overrides.patrimoine : null, argentVirtuel: overrides.argent ?? 100_000, moral: 70, niveau: 4, energie: 80, traits: overrides.traits ?? [] };
  const prisma = {
    userCarriere: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...etat })),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { Object.assign(etat, data); return Promise.resolve({ ...etat }); }),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  return { prisma, etat };
}
const besoins = { actualiser: jest.fn(), consommer: jest.fn().mockResolvedValue({}) };
const progression = { appliquerDelta: jest.fn(), notifierNiveau: jest.fn().mockResolvedValue(undefined) };
async function service(prisma: ReturnType<typeof fakePrisma>['prisma'], energie = 80) {
  besoins.actualiser.mockReset().mockResolvedValue({ energie });
  besoins.consommer.mockClear();
  progression.appliquerDelta.mockReset().mockResolvedValue({ niveau: 5 });
  progression.notifierNiveau.mockClear();
  const module = await Test.createTestingModule({
    providers: [PatrimoineService, { provide: PrismaService, useValue: prisma }, { provide: BesoinsService, useValue: besoins }, { provide: ProgressionService, useValue: progression }],
  }).compile();
  return module.get(PatrimoineService);
}

beforeEach(() => jest.useFakeTimers().setSystemTime(MAINTENANT));
afterEach(() => jest.useRealTimers());

describe('le loyer', () => {
  it('démarre au studio, la première semaine comprise', () => {
    const p = lirePatrimoine(null, MAINTENANT);
    expect(p.logement).toEqual({ niveau: 'studio', payeJusquau: new Date(MAINTENANT.getTime() + SEMAINE_MS).toISOString(), arrieres: 0 });
    expect(reglerLoyer(p, 50_000, MAINTENANT).preleve).toBe(0);
  });
  it('prélève chaque semaine échue tant que le solde suffit, et met le reste en arriérés', () => {
    const p = lirePatrimoine({ logement: { niveau: 'f2', payeJusquau: ilYa(15), arrieres: 0 } }, MAINTENANT);
    // Trois semaines échues (il y a 15 jours, 8 jours et 1 jour) : deux payées, une impayée.
    const r = reglerLoyer(p, 60_000, MAINTENANT);
    expect(r).toMatchObject({ preleve: 50_000, impaye: 25_000, argent: 10_000 });
    expect(r.patrimoine.logement.arrieres).toBe(25_000);
    expect(Date.parse(r.patrimoine.logement.payeJusquau)).toBeGreaterThan(MAINTENANT.getTime());
  });
});

describe('les effets du patrimoine', () => {
  it('fait gagner de l’XP avec les outils, réduit la fatigue avec l’équipement, repose mieux dans un grand logement', () => {
    expect(facteurXpOutils(['metre-laser', 'ordinateur-bim'], 'bureau-etudes')).toBeCloseTo(1.08 * 1.1);
    expect(facteurXpOutils(['metre-laser'], 'mairie')).toBe(1);
    expect(facteurFatigueOutils(['epi-complet'])).toBe(.85);
    expect(confortLogement({ logement: { niveau: 'villa', payeJusquau: '', arrieres: 0 } })).toBe(10);
  });
});

describe('PatrimoineService', () => {
  it('enregistre le studio de départ à la première lecture', async () => {
    const { prisma, etat } = fakePrisma();
    const svc = await service(prisma);
    const r = await svc.etat('u1');
    expect(r.logement).toMatchObject({ niveau: 'studio', arrieres: 0, loyerSemaine: 12_000 });
    expect(r.outils.every(o => !o.possede)).toBe(true);
    expect(etat.patrimoine).toMatchObject({ logement: { niveau: 'studio' } });
  });
  it('pardonne le premier loyer impayé, puis fait perdre du moral quand les arriérés s’accumulent', async () => {
    const { prisma, etat } = fakePrisma({ patrimoine: { logement: { niveau: 'villa', payeJusquau: ilYa(1), arrieres: 0 } }, argent: 1000 });
    const svc = await service(prisma);
    await expect(svc.etat('u1')).resolves.toMatchObject({ impaye: 55_000, logement: { arrieres: 55_000 } });
    expect(etat.moral).toBe(70);
    const endette = fakePrisma({ patrimoine: { logement: { niveau: 'villa', payeJusquau: ilYa(1), arrieres: 55_000 } }, argent: 1000 });
    await expect((await service(endette.prisma)).etat('u1')).resolves.toMatchObject({ logement: { arrieres: 110_000 } });
    expect(endette.etat.moral).toBe(70 - MORAL_LOYER_IMPAYE);
  });
  it('déménage contre frais d’agence et première semaine, mais pas avec des arriérés', async () => {
    const { prisma, etat } = fakePrisma({ argent: 100_000 });
    const svc = await service(prisma);
    await expect(svc.demenager('u1', 'f2')).resolves.toMatchObject({ logement: { niveau: 'f2' }, argent: 50_000 });
    expect(etat.argentVirtuel).toBe(50_000);
    const endette = fakePrisma({ patrimoine: { logement: { niveau: 'studio', payeJusquau: ilYa(-3), arrieres: 12_000 } } });
    await expect((await service(endette.prisma)).demenager('u1', 'villa')).rejects.toThrow(BadRequestException);
  });
  it('la cité universitaire loge les étudiants à leur arrivée, on n’y emménage pas ensuite', async () => {
    const { prisma, etat } = fakePrisma({ argent: 100_000 });
    await expect((await service(prisma)).demenager('u1', 'chambre')).rejects.toThrow('cité universitaire');
    expect(etat.argentVirtuel).toBe(100_000);
    // Un étudiant en chambre en sort comme tout le monde.
    const etudiant = fakePrisma({ argent: 100_000, patrimoine: { logement: { niveau: 'chambre', payeJusquau: ilYa(-1), arrieres: 0 } } });
    await expect((await service(etudiant.prisma)).demenager('u1', 'studio')).resolves.toMatchObject({ logement: { niveau: 'studio' } });
  });
  it('règle les arriérés quand le solde suffit', async () => {
    const { prisma, etat } = fakePrisma({ patrimoine: { logement: { niveau: 'studio', payeJusquau: ilYa(-3), arrieres: 12_000 } }, argent: 20_000 });
    const svc = await service(prisma);
    await expect(svc.payerArrieres('u1')).resolves.toMatchObject({ logement: { arrieres: 0 }, argent: 8_000 });
    expect(etat.argentVirtuel).toBe(8_000);
    await expect(svc.payerArrieres('u1')).rejects.toThrow(ConflictException);
  });
  it('vend un outil une seule fois, payé comptant', async () => {
    const { prisma } = fakePrisma({ argent: 30_000 });
    const svc = await service(prisma);
    const r = await svc.acheterOutil('u1', 'metre-laser');
    expect(r.outils.find(o => o.slug === 'metre-laser')?.possede).toBe(true);
    expect(r.argent).toBe(12_000);
    await expect(svc.acheterOutil('u1', 'metre-laser')).rejects.toThrow(ConflictException);
    await expect(svc.acheterOutil('u1', 'ordinateur-bim')).rejects.toThrow(BadRequestException);
    await expect(svc.acheterOutil('u1', 'marteau-magique')).rejects.toThrow(BadRequestException);
  });
});

describe('les travaux chez soi', () => {
  const studio = (surcharge: Record<string, unknown> = {}) => ({ logement: { niveau: 'studio', payeJusquau: ilYa(-3), arrieres: 0 }, ...surcharge });

  it('ajoute au confort du logement celui des travaux qu’on y a faits, et seulement là', () => {
    const p = lirePatrimoine(studio({ renovations: [{ slug: 'peinture-sejour', logement: 'studio' }, { slug: 'peinture-sejour', logement: 'studio' }, { slug: 'terrasse-villa', logement: 'villa' }, { slug: 'inconnu', logement: 'studio' }] }), MAINTENANT);
    expect(p.renovations).toEqual([{ slug: 'peinture-sejour', logement: 'studio' }, { slug: 'terrasse-villa', logement: 'villa' }]);
    expect(confortLogement(p)).toBe(RENOVATIONS['peinture-sejour'].confort);
    expect(lirePatrimoine(studio({ chantier: { slug: 'inconnu', etape: 'metre' } }), MAINTENANT).chantier).toBeNull();
  });
  it('a des devis cohérents avec leurs métrés', () => {
    expect(coutMateriaux(RENOVATIONS['peinture-sejour'])).toBe(23_500);
    expect(coutMateriaux(RENOVATIONS['terrasse-villa'])).toBe(168_400);
    for (const r of Object.values(RENOVATIONS)) expect(r.journees).toBeGreaterThanOrEqual(2);
  });
  it('fait le métré avant le devis, sans jamais envoyer la réponse avant, et donne la correction après trois essais', async () => {
    const { prisma } = fakePrisma({ patrimoine: studio() });
    const svc = await service(prisma);
    const lance = await svc.commencerRenovation('u1', 'peinture-sejour');
    expect(lance.chantier).toMatchObject({ etape: 'metre', journeesTotal: 2, essaisRestants: 3, devis: null });
    expect(lance.chantier?.metre).not.toHaveProperty('reponse');
    await expect(svc.commencerRenovation('u1', 'carrelage-douche')).rejects.toThrow(ConflictException);
    await expect(svc.metrer('u1', 43.74)).resolves.toMatchObject({ juste: false, chantier: { etape: 'metre', essaisRestants: 2 } });
    await svc.metrer('u1', 10);
    const corrige = await svc.metrer('u1', 12);
    expect(corrige).toMatchObject({ juste: false, chantier: { etape: 'materiaux', metre: { reponse: 40.41 }, devis: { total: 23_500 } } });
  });
  it('valide un métré juste à la tolérance près, et refuse des travaux d’un autre logement', async () => {
    const { prisma } = fakePrisma({ patrimoine: studio() });
    const svc = await service(prisma);
    await expect(svc.commencerRenovation('u1', 'terrasse-villa')).rejects.toThrow(BadRequestException);
    await svc.commencerRenovation('u1', 'carrelage-douche');
    await expect(svc.metrer('u1', 4.3)).resolves.toMatchObject({ juste: true, chantier: { etape: 'materiaux' } });
  });
  it('commande au devis (moins 10 % pour l’économe), puis une journée par journée du monde au prix de l’énergie', async () => {
    const { prisma, etat } = fakePrisma({ argent: 50_000, traits: ['econome'], patrimoine: studio({ chantier: { slug: 'peinture-sejour', logement: 'studio', etape: 'materiaux', essais: 1, journees: 0, derniereJourneeLe: null } }) });
    const svc = await service(prisma);
    await expect(svc.acheterMateriaux('u1')).resolves.toMatchObject({ argent: 50_000 - 21_150, chantier: { etape: 'travaux' } });
    await expect(svc.journeeTravaux('u1')).resolves.toMatchObject({ termine: false, chantier: { journees: 1 } });
    expect(etat.energie).toBe(80 - ENERGIE_JOURNEE_TRAVAUX);
    expect(besoins.consommer).not.toHaveBeenCalled();
    await expect(svc.journeeTravaux('u1')).rejects.toThrow('reviens demain');
    jest.setSystemTime(new Date(MAINTENANT.getTime() + INTERVALLE_JOURNEE_TRAVAUX_MS));
    progression.notifierNiveau.mockRejectedValueOnce(new Error('Notification indisponible'));
    const fini = await svc.journeeTravaux('u1');
    expect(fini).toMatchObject({ termine: true, chantier: null, logement: { confortTotal: 2 } });
    expect(fini.renovations.find(r => r.slug === 'peinture-sejour')?.faite).toBe(true);
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: RENOVATIONS['peinture-sejour'].xp }, prisma);
    expect(progression.notifierNiveau).toHaveBeenCalledWith('u1', 4, 5);
    expect(etat.patrimoine).toMatchObject({ chantier: null, renovations: [{ slug: 'peinture-sejour', logement: 'studio' }] });
    expect(etat.energie).toBe(80 - 2 * ENERGIE_JOURNEE_TRAVAUX);
  });
  it('refuse une journée de travaux à un joueur épuisé, et un déménagement en plein chantier', async () => {
    const { prisma } = fakePrisma({ patrimoine: studio({ chantier: { slug: 'peinture-sejour', logement: 'studio', etape: 'travaux', essais: 0, journees: 0, derniereJourneeLe: null } }) });
    const fatigue = await service(prisma, ENERGIE_JOURNEE_TRAVAUX - 1);
    await expect(fatigue.journeeTravaux('u1')).rejects.toThrow('Trop fatigué');
    await expect(fatigue.demenager('u1', 'f2')).rejects.toThrow('travaux en cours');
    await expect(fatigue.abandonnerRenovation('u1')).resolves.toMatchObject({ chantier: null });
  });
});
