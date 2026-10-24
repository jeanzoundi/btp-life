import { describe, expect, it } from 'vitest';
import {
  budgetRecrutement, candidats, debutEtape, etapeAuJour, etapeDepuisNom, etatVisuel, evaluerEquipe, lireOuvrier, METIERS, metiersManquants, ordreChoix, PROGRAMME, situation, TOTAL_JOURS, type Metier,
} from './programme-chantier';

const GROS_OEUVRE: Metier[] = ['Chef d’équipe', 'Maçon', 'Manœuvre', 'Ferrailleur', 'Coffreur'];

describe('programme du chantier', () => {
  it('va du recrutement de l’équipe à la réception, en 18 journées', () => {
    expect(PROGRAMME.map(e => e.id)).toEqual(['recrutement', 'implantation', 'fouilles', 'semelles', 'soubassement', 'elevation', 'dalle', 'etage', 'toiture', 'finitions', 'reception']);
    expect(TOTAL_JOURS).toBe(18);
    expect(etapeAuJour(0)).toMatchObject({ etape: { id: 'recrutement' }, jourEtape: 1 });
    expect(etapeAuJour(3)).toMatchObject({ etape: { id: 'fouilles' }, jourEtape: 2 });
    expect(etapeAuJour(17)?.etape.id).toBe('reception');
    expect(etapeAuJour(18)).toBeNull();
    expect(debutEtape('semelles')).toBe(4);
  });
  it('donne à chaque étape ses propres situations, à une seule bonne réponse', () => {
    const ids = new Set<string>();
    for (const e of PROGRAMME) {
      if (e.id !== 'recrutement') expect(e.travaux.length, e.id).toBeGreaterThanOrEqual(2);
      for (const { situation: s } of [...e.travaux, ...e.securite, ...(e.livraison ? [e.livraison] : [])]) {
        expect(s.choix, s.id).toHaveLength(3);
        expect(s.choix.filter(c => c.correct), s.id).toHaveLength(1);
        expect(situation(s.id)).toBe(s);
        ids.add(s.id);
      }
    }
    expect(ids.size).toBeGreaterThan(35);
  });
  it('n’affiche pas la bonne réponse toujours au même rang, mais toujours au même endroit pour une situation', () => {
    const situations = PROGRAMME.flatMap(e => [...e.travaux, ...e.securite, ...(e.livraison ? [e.livraison] : [])].map(t => t.situation));
    const rangs = [0, 0, 0];
    for (const s of situations) {
      const ordre = ordreChoix(s);
      expect([...ordre].sort(), s.id).toEqual([0, 1, 2]);
      expect(ordreChoix(s), s.id).toEqual(ordre);
      rangs[ordre.findIndex(i => s.choix[i].correct)]++;
    }
    for (const n of rangs) expect(n, rangs.join(' / ')).toBeGreaterThan(situations.length / 6);
  });
  it('dessine l’étape du jour avec son travail déjà fait', () => {
    expect(etatVisuel(0)).toMatchObject({ etape: 'recrutement', progression: 1, jour: 1, total: 18, avancement: 0 });
    expect(etatVisuel(2)).toMatchObject({ etape: 'fouilles', progression: .5, jour: 3 });
    expect(etatVisuel(18)).toMatchObject({ etape: 'livre', avancement: 100 });
    expect(etatVisuel(Number.NaN).etape).toBe('recrutement');
  });
  it('reconnaît les phases du simulateur', () => {
    expect(etapeDepuisNom('Implantation et coffrage')).toBe('implantation');
    expect(etapeDepuisNom('Fouilles et semelle')).toBe('semelles');
    expect(etapeDepuisNom('Fondations renforcées')).toBe('semelles');
    expect(etapeDepuisNom('Élévation des agglos')).toBe('elevation');
    expect(etapeDepuisNom('Gros œuvre')).toBe('elevation');
    expect(etapeDepuisNom('Dalle intermédiaire')).toBe('dalle');
    expect(etapeDepuisNom('Toiture et chaînage')).toBe('toiture');
    expect(etapeDepuisNom('Enduits et finitions')).toBe('finitions');
    expect(etapeDepuisNom('Réception administrative')).toBe('reception');
    expect(etapeDepuisNom('Pause café')).toBeNull();
  });
});

describe('recrutement des ouvriers', () => {
  const liste = candidats(3, GROS_OEUVRE);
  const qualifies = liste.filter(o => o.id.endsWith('-q'));
  const budget = budgetRecrutement(GROS_OEUVRE);
  it('propose par métier un qualifié, un débutant et un profil à risque, toujours les mêmes', () => {
    for (const m of GROS_OEUVRE) {
      const pour = liste.filter(o => o.metier === m);
      expect(pour.length).toBeGreaterThanOrEqual(3);
      expect(pour.some(o => !o.fiable && o.defaut)).toBe(true);
    }
    expect(new Set(liste.map(o => o.nom)).size).toBe(liste.length);
    expect(candidats(3, GROS_OEUVRE)).toEqual(liste);
    expect(qualifies.reduce((n, o) => n + o.salaire, 0)).toBeLessThanOrEqual(budget);
  });
  it('approuve une équipe complète, fiable et dans le budget', () => {
    const e = evaluerEquipe(qualifies, GROS_OEUVRE, budget);
    expect(e).toMatchObject({ complete: true, depassement: 0, risques: [] });
    expect(e.note).toBeGreaterThanOrEqual(.9);
  });
  it('pénalise un métier manquant, un profil à risque ou un budget dépassé', () => {
    const sansCoffreur = evaluerEquipe(qualifies.filter(o => o.metier !== 'Coffreur'), GROS_OEUVRE, budget);
    expect(sansCoffreur.manquants).toEqual(['Coffreur']);
    expect(sansCoffreur.note).toBeLessThan(.8);
    const risque = liste.find(o => o.metier === 'Maçon' && !o.fiable)!;
    const avecRisque = evaluerEquipe([...qualifies.filter(o => o.metier !== 'Maçon'), risque], GROS_OEUVRE, budget);
    expect(avecRisque.risques).toEqual([risque]);
    expect(avecRisque.note).toBeLessThan(.8);
    expect(avecRisque.remarques.join(' ')).toContain(risque.nom);
    const expert = liste.find(o => o.id.endsWith('-e'))!;
    const tropCher = evaluerEquipe([...qualifies.filter(o => o.metier !== 'Chef d’équipe'), expert], GROS_OEUVRE, budget);
    expect(tropCher.depassement).toBeGreaterThan(0);
    expect(tropCher.note).toBeLessThan(.8);
  });
  it('liste les métiers manquants et relit un ouvrier sauvegardé', () => {
    expect(metiersManquants(qualifies.slice(0, 2), GROS_OEUVRE)).toHaveLength(3);
    expect(lireOuvrier({ ...qualifies[0] })).toEqual(qualifies[0]);
    expect(lireOuvrier({ nom: 'X', id: 'x', metier: 'Astronaute' })).toBeNull();
    expect(METIERS['Manœuvre'].salaire).toBe(8000);
  });
});
