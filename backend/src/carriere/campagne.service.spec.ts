import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CampagneService, gainsChapitre, lireCampagne } from './campagne.service';
import { corrigerChapitre } from './campagne-scoring';
import corrige from './campagne-corrige.json';
import { ProgressionService } from './progression.service';

const reponses = (index: number) => Object.fromEntries(corrige[index].map(t => [t.id,
  t.type === 'mesure' ? t.reponse! : t.type === 'situation' ? t.options!.findIndex(Boolean) : t.options!.flatMap((b, i) => b ? [i] : [])]));

function banc(chapitres = 0) {
  let etat: any = { userId: 'u1', campagne: { chapitres, termineeLe: null }, xp: 0, niveau: 1, reputation: 0, argentVirtuel: 1000,
    energie: 100, faim: 100, moral: 100, social: 100, hygiene: 100, divertissement: 100 };
  const tx = {
    userCarriere: {
      findUnique: jest.fn(async () => structuredClone(etat)),
      update: jest.fn(async ({ data }) => { etat = { ...etat, ...data }; return structuredClone(etat); }),
    },
    pnj: { findUnique: jest.fn(async () => ({ id: 'cliente' })) },
    userMessage: { create: jest.fn(async () => ({})) },
    carriereHistorique: { create: jest.fn(async () => ({})) },
  };
  const prisma = { ...tx, $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => {
    const avant = structuredClone(etat);
    try { return await fn(tx); } catch (e) { etat = avant; throw e; }
  }) };
  const progression = new ProgressionService(prisma as never, { debloquerItemsEligibles: jest.fn() } as never, { envoyerNotification: jest.fn() } as never);
  const notifier = jest.spyOn(progression, 'notifierNiveau');
  const besoin = { actualiser: jest.fn(async () => etat) };
  const svc = new CampagneService(prisma as never, progression, besoin as never);
  return { svc, prisma, tx, progression, notifier, etat: () => etat };
}

describe('correction de la campagne', () => {
  it('borne une progression abîmée', () => {
    expect(lireCampagne(null)).toEqual({ chapitres: 0, termineeLe: null });
    expect(lireCampagne({ chapitres: 99 })).toEqual({ chapitres: 9, termineeLe: null });
    expect(lireCampagne({ chapitres: -1 }).chapitres).toBe(0);
  });
  it.each(corrige.map((_, i) => i))('corrige les trois tâches du chapitre %i', i => {
    expect(corrigerChapitre(i, reponses(i)).note).toBe(100);
  });
  it('refuse une note seule, les tâches manquantes, inconnues et les sélections répétées', () => {
    for (const brut of [100, { note: 100 }, {}, { ...reponses(0), intrus: 0 }, { ...reponses(0), 'contenu-offre': [0, 0, 0, 0, 0] }, { ...reponses(0), 'delai-offre': 99 }, { ...reponses(0), 'montant-offre': NaN }]) {
      expect(() => corrigerChapitre(0, brut)).toThrow(BadRequestException);
    }
    expect(() => corrigerChapitre(9, {})).toThrow(BadRequestException);
  });
  it('respecte la tolérance de mesure et les points partiels', () => {
    expect(corrigerChapitre(0, { ...reponses(0), 'montant-offre': 180.10 }).note).toBe(85);
    expect(corrigerChapitre(0, { ...reponses(0), 'contenu-offre': [0, 1] }).note).toBe(82);
  });
  it('ne paie pas sous 50 et paie la prime finale', () => {
    expect(gainsChapitre(0, 49).argent).toBe(0);
    expect(gainsChapitre(8, 100)).toMatchObject({ argent: 25000, xp: 280 });
  });
});

describe('CampagneService', () => {
  it('lit la progression et refuse une carrière inexistante', async () => {
    const b = banc(3);
    expect(await b.svc.etat('u1')).toMatchObject({ chapitres: 3 });
    b.tx.userCarriere.findUnique.mockResolvedValueOnce(null);
    await expect(b.svc.etat('absent')).rejects.toThrow(NotFoundException);
  });
  it('valide, paie et fatigue dans la même transaction sans transaction imbriquée', async () => {
    const b = banc();
    const r = await b.svc.chapitre('u1', 0, reponses(0));
    expect(r).toMatchObject({ note: 100, progres: { chapitres: 1 }, gains: { xp: 84, argent: 2500 } });
    expect(b.etat()).toMatchObject({ xp: 84, argentVirtuel: 3500, energie: 95, faim: 96 });
    expect(b.prisma.$transaction).toHaveBeenCalledTimes(1);
  });
  it('ne perd ni chapitre ni récompense si le paiement échoue', async () => {
    const b = banc();
    jest.spyOn(b.progression, 'appliquerDelta').mockRejectedValueOnce(new Error('paiement indisponible'));
    await expect(b.svc.chapitre('u1', 0, reponses(0))).rejects.toThrow('paiement indisponible');
    expect(b.etat()).toMatchObject({ campagne: { chapitres: 0 }, xp: 0, argentVirtuel: 1000, energie: 100 });
    expect((await b.svc.chapitre('u1', 0, reponses(0))).progres.chapitres).toBe(1);
    expect(b.etat().argentVirtuel).toBe(3500);
  });
  it('un renvoi après réponse perdue retrouve le reçu sans repayer ni fatiguer', async () => {
    const b = banc();
    const premier = await b.svc.chapitre('u1', 0, reponses(0));
    expect(await b.svc.chapitre('u1', 0, reponses(0))).toEqual(premier);
    expect(b.etat()).toMatchObject({ xp: 84, argentVirtuel: 3500, energie: 95 });
    await expect(b.svc.chapitre('u1', 0, { ...reponses(0), 'delai-offre': 1 })).rejects.toThrow(ConflictException);
  });
  it('rejoue une transaction en conflit', async () => {
    const b = banc();
    b.prisma.$transaction.mockRejectedValueOnce(Object.assign(new Error('conflit'), { code: 'P2034' }));
    await b.svc.chapitre('u1', 0, reponses(0));
    expect(b.etat().argentVirtuel).toBe(3500);
  });
  it('refuse un chapitre hors ordre et ne récompense pas des réponses fausses', async () => {
    const b = banc();
    await expect(b.svc.chapitre('u1', 1, reponses(1))).rejects.toThrow(ConflictException);
    const r = await b.svc.chapitre('u1', 0, { 'montant-offre': 0, 'contenu-offre': [], 'delai-offre': 1 });
    expect(r).toMatchObject({ note: 10, gains: { reussi: false, argent: 0 } });
    expect(b.etat()).toMatchObject({ campagne: { chapitres: 0 }, argentVirtuel: 1000, energie: 100 });
  });
  it('la réception inscrit historique et message dans la transaction', async () => {
    const b = banc(8);
    await b.svc.chapitre('u1', 8, reponses(8));
    expect(b.etat().campagne.chapitres).toBe(9);
    expect(b.etat().argentVirtuel).toBe(26000);
    expect(b.tx.carriereHistorique.create).toHaveBeenCalledTimes(1);
    expect(b.tx.userMessage.create).toHaveBeenCalledTimes(1);
    await b.svc.chapitre('u1', 8, reponses(8));
    expect(b.tx.userMessage.create).toHaveBeenCalledTimes(1);
  });
  it('une notification en panne ne fait pas échouer le versement validé', async () => {
    const b = banc(8);
    b.notifier.mockRejectedValueOnce(new Error('notification indisponible'));
    expect((await b.svc.chapitre('u1', 8, reponses(8))).gains.argent).toBe(25000);
  });
});
