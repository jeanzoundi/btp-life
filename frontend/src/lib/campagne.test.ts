import { describe, expect, it } from 'vitest';
import {
  appliquerChapitre, bilanChapitre, CHAPITRES, chapitreCourant, contenuTacheChapitre, lireProgresCampagne, NOTE_CHAPITRE, nouvelleSeanceChapitre, PARCELLE_AKWABA,
  PROGRES_CAMPAGNE_INITIAL, stadeAkwaba, STADES_AKWABA,
} from './campagne';
import { LIEUX_PROGRAMME } from './lieux-programme';
import { ordreChoix } from './programme-chantier';
import { noter, scoreMesure, scoreSelection, scoreSituation, seanceFaite, tacheALaZoneLieu, type ContenuTache, type SeanceLieu } from './programme-lieu';

/** Score parfait pour un contenu : la bonne réponse, la valeur exacte, ou toutes les pièces attendues. */
const parfait = (c: ContenuTache) => c.type === 'situation' ? scoreSituation(c.situation, c.situation.choix.findIndex(x => x.correct))
  : c.type === 'mesure' ? scoreMesure(c.mesure, c.mesure.reponse)
  : scoreSelection(c.selection, c.selection.options.flatMap((o, i) => o.attendu ? [i] : []));
const jouer = (s: SeanceLieu, scores: number[]) => s.taches.reduce((x, t, i) => noter(x, t.id, scores[i]), s);
const mesure = (chapitre: string, tache: string) => {
  const c = CHAPITRES.find(x => x.id === chapitre)!.taches.find(t => t.id === tache)!.contenu;
  if (c.type !== 'mesure') throw new Error(`${tache} n’est pas une mesure`);
  return c.mesure;
};

describe('les chapitres du fil rouge', () => {
  it('suivent l’immeuble de lieu en lieu, jusqu’à la réception sur la parcelle', () => {
    expect(CHAPITRES).toHaveLength(9);
    expect(new Set(CHAPITRES.map(c => c.id)).size).toBe(CHAPITRES.length);
    expect(CHAPITRES.map(c => c.lieu)).toEqual(['entreprise', 'laboratoire', 'bureau-etudes', 'mairie', 'banque', 'fournisseur', 'logistique', 'construction-nord', PARCELLE_AKWABA.slug]);
  });

  for (const chapitre of CHAPITRES) {
    it(`${chapitre.id} : tâches aux vrais postes du lieu, contenus justes`, () => {
      expect(chapitre.taches.length).toBe(3);
      expect(new Set(chapitre.taches.map(t => t.id)).size).toBe(3);
      const lieu = LIEUX_PROGRAMME[chapitre.lieu];
      for (const tache of chapitre.taches) {
        if (lieu) {
          // Un vrai poste du plan, ni le mentor (il fait le bilan), ni un service ouvert à tout moment (il doit rester libre).
          expect(lieu.plan.stations[tache.zone], `${chapitre.id}/${tache.id}`).toBeDefined();
          expect(tache.zone).not.toBe('mentor');
          expect(lieu.services?.some(s => s.station === tache.zone) ?? false, tache.id).toBe(false);
        } else expect(tache.zone).toBe('parcelle');
        const c = tache.contenu;
        if (c.type === 'situation') {
          expect(c.situation.choix, tache.id).toHaveLength(3);
          expect(c.situation.choix.filter(x => x.correct), tache.id).toHaveLength(1);
        } else if (c.type === 'mesure') {
          expect(Number.isFinite(c.mesure.reponse), tache.id).toBe(true);
          expect(c.mesure.tolerance, tache.id).toBeGreaterThanOrEqual(0);
        } else {
          expect(c.selection.options.filter(o => o.attendu).length, tache.id).toBeGreaterThanOrEqual(2);
          expect(c.selection.options.some(o => !o.attendu), tache.id).toBe(true);
        }
        expect(parfait(c), tache.id).toBe(100);
      }
    });
  }

  it('place la bonne réponse des situations à des rangs variés', () => {
    const rangs = new Set(CHAPITRES.flatMap(c => c.taches.flatMap(t => t.contenu.type === 'situation' ? [ordreChoix(t.contenu.situation).indexOf(0)] : [])));
    expect(rangs.size).toBeGreaterThan(1);
  });

  it('garde les mêmes chiffres d’un chapitre à l’autre', () => {
    // Le sol du laboratoire sert au bureau d'études ; les semelles du bureau d'études sont celles commandées au dépôt.
    expect(mesure('sol', 'admissible').reponse).toBe(200);
    expect(mesure('structure', 'descente').reponse).toBe(768);
    expect(mesure('structure', 'semelle').reponse).toBeCloseTo(1.96, 2);
    expect(mesure('commande', 'beton-semelles').reponse).toBe(32);
    expect(mesure('coulage', 'rotations').reponse).toBe(4);
    // L'offre TTC tient dans le budget de Mme Touré, et la retenue de la réception porte sur le marché hors taxes.
    expect(mesure('offre', 'montant-offre').reponse).toBeCloseTo(179.95, 2);
    expect(mesure('reception', 'retenue-finale').reponse).toBeCloseTo(152.5 * .05, 3);
    expect(mesure('financement', 'apport').reponse).toBeCloseTo(54, 6);
  });

  it('accepte une semelle arrondie à 2,00 m à moitié, et pas une erreur d’unité', () => {
    const semelle = mesure('structure', 'semelle');
    expect(scoreMesure(semelle, 1.96)).toBe(100);
    expect(scoreMesure(semelle, 2)).toBe(50);
    expect(scoreMesure(semelle, 196)).toBe(0);
  });
});

describe('séance et bilan d’un chapitre', () => {
  it('se joue comme une séance de lieu, aux postes du chapitre', () => {
    const s = nouvelleSeanceChapitre(2);
    expect(s).toMatchObject({ slug: 'bureau-etudes', etape: 2, cycle: 0, scores: {} });
    expect(s.taches.map(t => t.type)).toEqual(CHAPITRES[2].taches.map(t => t.contenu.type));
    expect(tacheALaZoneLieu(s, 'calcul')?.id).toBe('descente');
    expect(contenuTacheChapitre(2, 'semelle')?.type).toBe('mesure');
    expect(contenuTacheChapitre(2, 'inconnue')).toBeNull();
    expect(seanceFaite(jouer(s, [100, 100, 100]))).toBe(true);
  });

  it('valide à 50, paie comme le serveur, et bien plus à la réception', () => {
    const parfaite = bilanChapitre(jouer(nouvelleSeanceChapitre(0), [100, 100, 100]));
    expect(parfaite).toMatchObject({ note: 100, reussi: true, reussies: 3, xp: 80, argent: 2500, reputation: 2, mention: 'Chapitre sans faute' });
    // Une bonne réponse et une à moitié : 10 + 90 × 150 / 300 = 55, validé de justesse.
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(4), [100, 50, 0]))).toMatchObject({ note: 55, reussi: true, xp: 58 });
    const ratee = bilanChapitre(jouer(nouvelleSeanceChapitre(4), [100, 0, 0]));
    expect(ratee).toMatchObject({ note: 40, reussi: false, xp: 0, argent: 0, reputation: 0 });
    expect(ratee.note).toBeLessThan(NOTE_CHAPITRE);
    expect(bilanChapitre(jouer(nouvelleSeanceChapitre(8), [100, 100, 100]))).toMatchObject({ xp: 280, argent: 25_000, reputation: 15 });
  });
});

describe('progression de la campagne', () => {
  it('relit une sauvegarde abîmée comme le serveur', () => {
    expect(lireProgresCampagne(null)).toEqual(PROGRES_CAMPAGNE_INITIAL);
    expect(lireProgresCampagne({ chapitres: 42, termineeLe: 'hier' })).toEqual({ chapitres: 9, termineeLe: null });
    expect(lireProgresCampagne({ chapitres: 3.8 })).toEqual({ chapitres: 3, termineeLe: null });
  });

  it('avance d’un chapitre réussi, livre l’immeuble au dernier, et ne bouge pas sur un échec', () => {
    const maintenant = new Date('2026-10-26T10:00:00.000Z');
    expect(appliquerChapitre({ chapitres: 2, termineeLe: null }, false, maintenant)).toEqual({ chapitres: 2, termineeLe: null });
    expect(appliquerChapitre({ chapitres: 2, termineeLe: null }, true, maintenant)).toEqual({ chapitres: 3, termineeLe: null });
    const livre = appliquerChapitre({ chapitres: 8, termineeLe: null }, true, maintenant);
    expect(livre).toEqual({ chapitres: 9, termineeLe: maintenant.toISOString() });
    expect(appliquerChapitre(livre, true, new Date())).toBe(livre);
    expect(chapitreCourant(livre)).toBeNull();
    expect(chapitreCourant({ chapitres: 3 })?.id).toBe('permis');
  });

  it('nomme ce qu’on voit sur la parcelle à chaque stade', () => {
    expect(STADES_AKWABA).toHaveLength(CHAPITRES.length + 1);
    expect(stadeAkwaba({ chapitres: 0 })).toBe('Parcelle bornée');
    expect(stadeAkwaba({ chapitres: 4 })).toBe('Permis affiché');
    expect(stadeAkwaba({ chapitres: 9 })).toBe('Immeuble livré');
  });
});
