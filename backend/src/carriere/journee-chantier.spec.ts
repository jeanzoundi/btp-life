import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BesoinsService } from './besoins.service';
import {
  corrigerJournee, DELAI_JOURNEE_MS, gainsJournee, jourAttendu, lireChantierQuartier, reponsesJournee, TOTAL_JOURS_CHANTIER,
} from './journee-chantier';
import { JourneeChantierService } from './journee-chantier.service';
import { ProgressionService } from './progression.service';

describe('la journée sur le chantier du quartier', () => {
  it('donne 100 au sans-faute et 10 (la présence) quand tout est faux, chaque jour du programme', () => {
    expect(TOTAL_JOURS_CHANTIER).toBe(18);
    for (let numero = 0; numero < TOTAL_JOURS_CHANTIER; numero++) {
      expect(corrigerJournee(numero, reponsesJournee(numero, true)).note).toBe(100);
      // Le jour du recrutement n'a que l'équipement : sans lui, il reste la présence et les 70 points du jour.
      expect(corrigerJournee(numero, reponsesJournee(numero, false)).note).toBe(numero === 0 ? 80 : 10);
    }
  });

  it('partage 70 points entre les situations et le geste après l’équipement', () => {
    // Jour 4 : équipement, deux travaux, le geste du jour, sécurité et livraison des fers.
    const justes = reponsesJournee(4, true), fausses = reponsesJournee(4, false);
    const [epi, premiere] = Object.keys(justes);
    expect(corrigerJournee(4, { ...justes, [premiere]: fausses[premiere] }).note).toBe(86);
    expect(corrigerJournee(4, { ...justes, [epi]: fausses[epi] }).note).toBe(80);
  });

  it('juge le geste du jour sur la valeur relevée, à la tolérance près', () => {
    const justes = reponsesJournee(4, true);
    const geste = Object.keys(justes).find(id => id.startsWith('geste-'))!;
    const juste = justes[geste];
    expect(corrigerJournee(4, { ...justes, [geste]: juste }).note).toBe(100);
    expect(corrigerJournee(4, { ...justes, [geste]: juste + 1000 }).note).toBe(86);
    expect(() => corrigerJournee(4, { ...justes, [geste]: Number.NaN })).toThrow('Mesure invalide');
    expect(() => corrigerJournee(4, { ...justes, [geste]: 'trois' })).toThrow('Mesure invalide');
  });

  it('refuse des réponses absentes, incomplètes ou impossibles, et un jour inconnu', () => {
    const justes = reponsesJournee(4, true);
    const [epi] = Object.keys(justes);
    expect(() => corrigerJournee(4, undefined)).toThrow('recharge le jeu');
    expect(() => corrigerJournee(4, { note: 100 })).toThrow('Fais toutes les tâches');
    expect(() => corrigerJournee(4, { ...justes, [epi]: 5 })).toThrow('Choix invalide');
    expect(() => corrigerJournee(4, { ...justes, [epi]: 0.5 })).toThrow('Choix invalide');
    expect(() => corrigerJournee(99, justes)).toThrow('Jour de chantier inconnu');
  });

  it('paie comme une séance : rien sous 40, de 4 600 à 7 000 F au-dessus', () => {
    expect(gainsJournee(100)).toEqual({ compte: true, argent: 7000, xp: 80 });
    expect(gainsJournee(40)).toEqual({ compte: true, argent: 4600, xp: 44 });
    expect(gainsJournee(30)).toEqual({ compte: false, argent: 0, xp: 6 });
  });

  it('attend le jour de l’ouvrage en cours, puis le jour 0 ou 1 d’un nouvel ouvrage après une livraison', () => {
    expect(jourAttendu({ jours: 3 }, 3)).toBe(true);
    expect(jourAttendu({ jours: 3 }, 4)).toBe(false);
    expect(jourAttendu({ jours: TOTAL_JOURS_CHANTIER }, 0)).toBe(true);
    expect(jourAttendu({ jours: TOTAL_JOURS_CHANTIER }, 1)).toBe(true);
    expect(jourAttendu({ jours: TOTAL_JOURS_CHANTIER }, 2)).toBe(false);
  });

  it('lit un avancement abîmé en repartant de zéro', () => {
    expect(lireChantierQuartier(null)).toEqual({ jours: 0, journees: 0, livraisons: 0, derniereRecompenseLe: null });
    expect(lireChantierQuartier({ jours: 99, journees: -2, livraisons: 'x', derniereRecompenseLe: 'pas une date' }))
      .toEqual({ jours: TOTAL_JOURS_CHANTIER, journees: 0, livraisons: 0, derniereRecompenseLe: null });
  });
});

const BESOINS_PLEINS = { energie: 100, moral: 100, faim: 100, social: 100 };

function fakePrisma(overrides: { chantierQuartier?: unknown; profil?: string; coequipiers?: string[] } = {}) {
  const etat: Record<string, unknown> = { userId: 'u1', niveau: 3, chantierQuartier: overrides.chantierQuartier ?? null, profilActuel: overrides.profil ? { slug: overrides.profil } : null };
  const prisma = {
    userCarriere: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...etat })),
      update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => { Object.assign(etat, data); return Promise.resolve({ ...etat }); }),
    },
    // L'équipe et les coéquipiers signalés sur le chantier (coequipiersPresents, equipe.service.ts).
    membreEquipe: { findUnique: jest.fn().mockResolvedValue(overrides.coequipiers ? { equipeId: 'e1' } : null) },
    presenceMonde: { findMany: jest.fn().mockResolvedValue((overrides.coequipiers ?? []).map(pseudo => ({ user: { pseudo, avatar: null } }))) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((operation: (tx: typeof prisma) => unknown) => operation(prisma));
  return prisma;
}

async function service(prisma: ReturnType<typeof fakePrisma>, besoins = BESOINS_PLEINS) {
  const progression = { appliquerDelta: jest.fn().mockResolvedValue({ niveau: 3 }), notifierNiveau: jest.fn() };
  const besoinsService = { actualiser: jest.fn().mockResolvedValue(besoins), consommer: jest.fn() };
  const module = await Test.createTestingModule({
    providers: [
      JourneeChantierService,
      { provide: PrismaService, useValue: prisma },
      { provide: ProgressionService, useValue: progression },
      { provide: BesoinsService, useValue: besoinsService },
    ],
  }).compile();
  return { svc: module.get(JourneeChantierService), progression, besoins: besoinsService };
}

/** Avancement écrit au dernier update. */
const ecrit = (prisma: ReturnType<typeof fakePrisma>) => prisma.userCarriere.update.mock.calls.at(-1)![0].data.chantierQuartier;

describe('JourneeChantierService.journee', () => {
  it('paie le premier travail sans chantier personnel, fait avancer l’ouvrage et fatigue', async () => {
    const prisma = fakePrisma();
    const { svc, progression, besoins } = await service(prisma, { energie: 40, moral: 40, faim: 40, social: 40 });
    const resultat = await svc.journee('u1', 0, reponsesJournee(0, true));
    expect(resultat.note).toBe(100);
    // 80 XP × 0,82 (besoins à 40) = 66 ; le salaire, lui, n'est pas modulé.
    expect(resultat.gains).toMatchObject({ argent: 7000, xp: 66, reputation: 1, entrainement: false, facteurBesoins: .82 });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 66, argentVirtuel: 7000, reputation: 1 }, prisma);
    expect(besoins.consommer).toHaveBeenCalledWith('u1', { energie: 8, faim: 6 }, prisma);
    expect(ecrit(prisma)).toMatchObject({ jours: 1, journees: 1, livraisons: 0 });
    expect(progression.notifierNiveau).toHaveBeenCalledWith('u1', 3, 3);
  });

  it('compte une journée en équipe quand un coéquipier est aussi sur le chantier : +10 % d’XP, salaire inchangé', async () => {
    const seul = await service(fakePrisma());
    const sansEquipe = (await seul.svc.journee('u1', 0, reponsesJournee(0, true))).gains;
    expect(sansEquipe).toMatchObject({ xp: 80, argent: 7000, equipe: null });
    const prisma = fakePrisma({ coequipiers: ['Kader'] });
    const ensemble = await service(prisma);
    const gains = (await ensemble.svc.journee('u1', 0, reponsesJournee(0, true))).gains;
    expect(gains).toMatchObject({ xp: 88, argent: 7000, equipe: { coequipiers: ['Kader'], bonus: .1 } });
    expect(ensemble.progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 88, argentVirtuel: 7000, reputation: 1 }, prisma);
    // Seuls comptent les coéquipiers signalés sur le chantier lui-même.
    expect(prisma.presenceMonde.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ lieu: 'chantier' }) }));
  });

  it('paie mieux l’ouvrier et fait progresser l’encadrant, selon leur parcours', async () => {
    const ouvrier = fakePrisma({ profil: 'ouvrier-macon' });
    const a = await service(ouvrier);
    expect((await a.svc.journee('u1', 0, reponsesJournee(0, true))).gains).toMatchObject({ argent: 8050, xp: 80, reputation: 1 });
    const encadrant = fakePrisma({ profil: 'chef-equipe' });
    const b = await service(encadrant);
    expect((await b.svc.journee('u1', 0, reponsesJournee(0, true))).gains).toMatchObject({ argent: 7000, xp: 96, reputation: 2 });
  });

  it('une journée ratée ne paie pas et se refait', async () => {
    const prisma = fakePrisma({ chantierQuartier: { jours: 4, journees: 6, livraisons: 0 } });
    const { svc, progression } = await service(prisma);
    const resultat = await svc.journee('u1', 4, reponsesJournee(4, false));
    expect(resultat.note).toBe(10);
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 2, argentVirtuel: 0, reputation: 0 }, prisma);
    expect(ecrit(prisma)).toMatchObject({ jours: 4, journees: 7 });
  });

  it('dans les 20 minutes d’une journée payée : entraînement, l’ouvrage avance sans salaire', async () => {
    const recente = new Date(Date.now() - 5 * 60_000).toISOString();
    const prisma = fakePrisma({ chantierQuartier: { jours: 2, journees: 2, livraisons: 0, derniereRecompenseLe: recente } });
    const { svc, progression } = await service(prisma);
    const resultat = await svc.journee('u1', 2, reponsesJournee(2, true));
    expect(resultat.gains).toMatchObject({ argent: 0, xp: 20, reputation: 0, entrainement: true });
    expect(progression.appliquerDelta).toHaveBeenCalledWith('u1', { xp: 20, argentVirtuel: 0, reputation: 0 }, prisma);
    expect(ecrit(prisma)).toMatchObject({ jours: 3, derniereRecompenseLe: recente });
    expect(Date.parse(resultat.gains.prochaineRecompenseLe)).toBe(Date.parse(recente) + DELAI_JOURNEE_MS);
  });

  it('livre l’ouvrage au dernier jour, puis un nouvel ouvrage repart du jour 0 ou 1', async () => {
    const prisma = fakePrisma({ chantierQuartier: { jours: TOTAL_JOURS_CHANTIER - 1, journees: 20, livraisons: 0 } });
    const { svc } = await service(prisma);
    const fin = await svc.journee('u1', TOTAL_JOURS_CHANTIER - 1, reponsesJournee(TOTAL_JOURS_CHANTIER - 1, true));
    expect(fin.progres).toMatchObject({ jours: TOTAL_JOURS_CHANTIER, livraisons: 1 });
    expect(fin.gains.reputation).toBe(3);
    prisma.userCarriere.update({ data: { chantierQuartier: { ...fin.progres, derniereRecompenseLe: null } } });
    const suite = await svc.journee('u1', 1, reponsesJournee(1, true));
    expect(suite.progres).toMatchObject({ jours: 2, livraisons: 1 });
  });

  it('refuse un autre jour que celui du chantier, et une note déclarée par le jeu', async () => {
    const prisma = fakePrisma({ chantierQuartier: { jours: 3 } });
    const { svc, progression } = await service(prisma);
    await expect(svc.journee('u1', 5, reponsesJournee(5, true))).rejects.toThrow(ConflictException);
    await expect(svc.journee('u1', 3, { note: 100 })).rejects.toThrow(BadRequestException);
    await expect(svc.journee('u1', 3, undefined)).rejects.toThrow('recharge le jeu');
    expect(prisma.userCarriere.update).not.toHaveBeenCalled();
    expect(progression.appliquerDelta).not.toHaveBeenCalled();
  });
});
