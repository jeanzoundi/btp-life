import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CAMPAGNE, CampagneService, dossierDe, DOSSIERS, gainsChapitre, lireCampagne } from './campagne.service';
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
    expect(lireCampagne({ chapitres: 99 })).toEqual({ chapitres: CAMPAGNE.chapitres, termineeLe: null });
    expect(lireCampagne({ chapitres: -1 }).chapitres).toBe(0);
  });
  it('rouvre à l’année de garantie une campagne finie à la livraison, et au deuxième dossier une campagne finie au premier', () => {
    const fin = '2026-10-26T15:00:00.000Z';
    expect(lireCampagne({ chapitres: 9, termineeLe: fin })).toEqual({ chapitres: 9, termineeLe: null });
    expect(lireCampagne({ chapitres: 12, termineeLe: fin })).toEqual({ chapitres: 12, termineeLe: null });
    expect(lireCampagne({ chapitres: CAMPAGNE.chapitres, termineeLe: fin })).toEqual({ chapitres: CAMPAGNE.chapitres, termineeLe: fin });
  });
  it('enchaîne les dossiers : Akwaba en douze chapitres, puis Les Rôniers', () => {
    expect(DOSSIERS.map(d => [d.id, d.debut, d.chapitres, d.livraison])).toEqual([['residence-akwaba', 0, 12, 9], ['residence-roniers', 12, 12, 11]]);
    expect(CAMPAGNE.chapitres).toBe(corrige.length);
    expect(dossierDe(11)).toMatchObject({ dossier: { id: 'residence-akwaba' }, rang: 11 });
    expect(dossierDe(12)).toMatchObject({ dossier: { id: 'residence-roniers' }, rang: 0 });
  });
  it.each(corrige.map((_, i) => i))('corrige les trois tâches du chapitre %i', i => {
    expect(corrigerChapitre(i, reponses(i)).note).toBe(100);
  });
  it('refuse une note seule, les tâches manquantes, inconnues et les sélections répétées', () => {
    for (const brut of [100, { note: 100 }, {}, { ...reponses(0), intrus: 0 }, { ...reponses(0), 'contenu-offre': [0, 0, 0, 0, 0] }, { ...reponses(0), 'delai-offre': 99 }, { ...reponses(0), 'montant-offre': NaN }]) {
      expect(() => corrigerChapitre(0, brut)).toThrow(BadRequestException);
    }
    expect(() => corrigerChapitre(CAMPAGNE.chapitres, {})).toThrow('Chapitre inconnu');
  });
  it('respecte la tolérance de mesure et les points partiels', () => {
    expect(corrigerChapitre(0, { ...reponses(0), 'montant-offre': 180.10 }).note).toBe(85);
    expect(corrigerChapitre(0, { ...reponses(0), 'contenu-offre': [0, 1] }).note).toBe(82);
  });
  it('ne paie pas sous 50, paie la prime de livraison à la réception et celle de clôture au dernier chapitre', () => {
    expect(gainsChapitre(0, 49).argent).toBe(0);
    expect(gainsChapitre(8, 100)).toMatchObject({ argent: 25000, xp: 280, reputation: 15 });
    expect(gainsChapitre(9, 100)).toMatchObject({ argent: 2500, xp: 80, reputation: 2 });
    expect(gainsChapitre(11, 100)).toMatchObject({ argent: 10000, xp: 180, reputation: 8 });
  });
  it('paie le deuxième dossier à son barème : un R+5 rapporte plus, livré au onzième chapitre', () => {
    expect(gainsChapitre(12, 100)).toMatchObject({ argent: 4000, xp: 90, reputation: 3 });
    expect(gainsChapitre(22, 100)).toMatchObject({ argent: 40000, xp: 340, reputation: 20 });
    expect(gainsChapitre(23, 100)).toMatchObject({ argent: 15000, xp: 210, reputation: 10 });
    expect(gainsChapitre(23, 40)).toMatchObject({ reussi: false, argent: 0 });
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
  it('la réception inscrit historique et message dans la transaction, sans clore le dossier', async () => {
    const b = banc(8);
    await b.svc.chapitre('u1', 8, reponses(8));
    expect(b.etat().campagne).toMatchObject({ chapitres: 9, termineeLe: null });
    expect(b.etat().argentVirtuel).toBe(26000);
    expect(b.tx.carriereHistorique.create).toHaveBeenCalledTimes(1);
    expect(b.tx.userMessage.create).toHaveBeenCalledTimes(1);
    await b.svc.chapitre('u1', 8, reponses(8));
    expect(b.tx.userMessage.create).toHaveBeenCalledTimes(1);
  });
  it('l’épilogue se joue après la livraison, et le dernier chapitre clôt le dossier sans second historique', async () => {
    const b = banc(9);
    expect((await b.svc.chapitre('u1', 9, reponses(9))).gains).toMatchObject({ argent: 2500 });
    await b.svc.chapitre('u1', 10, reponses(10));
    expect(b.tx.userMessage.create).not.toHaveBeenCalled();
    const fin = await b.svc.chapitre('u1', 11, reponses(11));
    // Le dossier Akwaba est clos, mais pas le fil rouge : les Rôniers suivent.
    expect(fin).toMatchObject({ progres: { chapitres: 12, termineeLe: null }, gains: { argent: 10000, reputation: 8 } });
    expect(b.etat().argentVirtuel).toBe(1000 + 2500 * 2 + 10000);
    expect(b.tx.userMessage.create).toHaveBeenCalledTimes(1);
    expect(b.tx.userMessage.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ contenu: expect.stringContaining('réception définitive') }) }));
    expect(b.tx.carriereHistorique.create).not.toHaveBeenCalled();
  });
  it('le deuxième dossier suit le premier : M. Touré écrit au permis, la réception livre les Rôniers, le dernier chapitre clôt le fil rouge', async () => {
    const b = banc(12);
    expect((await b.svc.chapitre('u1', 12, reponses(12))).gains).toMatchObject({ argent: 4000, reputation: 3 });
    expect(b.tx.userMessage.create).not.toHaveBeenCalled();
    b.etat().campagne.chapitres = 15;
    await b.svc.chapitre('u1', 15, reponses(15));
    expect(b.tx.pnj.findUnique).toHaveBeenLastCalledWith(expect.objectContaining({ where: { slug: 'client-daouda-toure' } }));
    expect(b.tx.userMessage.create).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ contenu: expect.stringContaining('permis est affiché') }) }));
    b.etat().campagne.chapitres = 22;
    expect((await b.svc.chapitre('u1', 22, reponses(22))).gains).toMatchObject({ argent: 40000, reputation: 20 });
    expect(b.tx.carriereHistorique.create).toHaveBeenCalledWith({ data: { userId: 'u1', type: 'CHANTIER_LIVRE', details: { campagne: 'residence-roniers', nom: 'Résidence Les Rôniers' } } });
    const fin = await b.svc.chapitre('u1', 23, reponses(23));
    expect(fin).toMatchObject({ progres: { chapitres: 24, termineeLe: expect.any(String) }, gains: { argent: 15000, reputation: 10 } });
    expect(b.tx.userMessage.create).toHaveBeenCalledTimes(3);
    expect(b.tx.carriereHistorique.create).toHaveBeenCalledTimes(1);
  });
  it('une notification en panne ne fait pas échouer le versement validé', async () => {
    const b = banc(8);
    b.notifier.mockRejectedValueOnce(new Error('notification indisponible'));
    expect((await b.svc.chapitre('u1', 8, reponses(8))).gains.argent).toBe(25000);
  });
});
