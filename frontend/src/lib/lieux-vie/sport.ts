// Le Complexe sportif : terrain synthétique à cinq, aire de musculation en plein air, piste, buvette.
// Mécanique propre : le match à cinq avec les collègues, qui se termine aux tirs au but ; le gagner rapporte plus.
import { zone, type Assise, type Point } from '../navigation-plan';
import type { ArticleCarte, LieuVie } from '.';

export const ARTICLES_SPORT: ArticleCarte[] = [
  {
    id: 'match-foot', nom: 'Match à cinq', detail: 'Avec les collègues du chantier, puis les tirs au but', categorie: 'activite', action: 'social', prix: 500,
    effets: { energie: -20, social: 30 }, moral: 8, preparation: 3, moralPrincipal: true, message: 'Le match à cinq avec les collègues est fini.',
    bonusVictoire: { social: 10, moral: 4, message: 'Et vous l’avez gagné aux tirs au but !' },
  },
  { id: 'musculation', nom: 'Séance de musculation', detail: 'Banc, haltères, une heure d’effort', categorie: 'activite', action: 'social', prix: 1000, effets: { energie: -15, social: 5 }, moral: 10, preparation: 2, moralPrincipal: true, message: 'Séance de musculation terminée : les bras tremblent, le moral est au beau fixe.' },
  { id: 'footing', nom: 'Footing', detail: 'Un tour de piste, vestiaire compris', categorie: 'activite', action: 'social', prix: 300, effets: { energie: -10, social: 5 }, moral: 8, preparation: 1, duree: 9, moralPrincipal: true, message: 'Footing au bord de la lagune : tu reviens léger(e).' },
  { id: 'jus-buvette', nom: 'Jus de la buvette', detail: 'Orange et gingembre pressés', categorie: 'boisson', action: 'repas', prix: 300, effets: { energie: 8, faim: 5 }, moral: 1, preparation: 1, message: 'Un jus frais à la buvette, après l’effort.' },
];

/** Où se passe chaque activité (le match a son propre déroulé, sur le terrain). */
export const STATION_SPORT: Record<string, 'muscu' | 'piste' | 'buvette'> = { musculation: 'muscu', footing: 'piste', 'jus-buvette': 'buvette' };

export const SPORT: LieuVie = {
  slug: 'sports', nom: 'Complexe sportif',
  accroche: 'Le terrain à cinq où les équipes du quartier se défient après le travail.',
  hote: { nom: 'Coach Aya', role: 'Responsable du complexe sportif' },
  horaires: { ouverture: 6, fermeture: 22 },
  carte: ARTICLES_SPORT,
  plan: {
    ambiance: 'exterieur', demiLargeur: 15, demiProfondeur: 11, depart: [0, 9.8],
    obstacles: [
      // Grillage du terrain, ouvert au sud au milieu.
      zone(-9.4, -1.2, -1.2, -.8), zone(1.2, 9.4, -1.2, -.8),
      zone(-9.4, -9, -10.5, -.8), zone(9, 9.4, -10.5, -.8),
      zone(-14.4, -10, 2, 8),           // aire de musculation
      zone(9, 14, 4, 7),                // buvette, comptoir au sud
      zone(-3, 3, 7.6, 8.4),            // tribune basse
    ],
    stations: { terrain: [0, -2.4], muscu: [-9.2, 5], piste: [10.3, 1.2], buvette: [11.5, 7.9], mentor: [3, 3.4] },
    libelles: { terrain: 'Terrain', muscu: 'Musculation', piste: 'Piste', buvette: 'Buvette', mentor: 'Coach Aya' },
    mentor: { position: [3, 2], rotation: 0 },
  },
};

export const ASSISES_SPORT: Record<'muscu' | 'buvette', Assise> = {
  muscu: { position: [-11.2, 5], rotation: Math.PI / 2 },
  buvette: { position: [11.5, 7.5], rotation: Math.PI },
};

/** Le tour de piste du footing : la boucle de tartan à l'est du terrain, jusqu'à la ligne de départ. */
export const TOUR_FOOTING: Point[] = [[10.3, -9.5], [14, -9.5], [14, 2.6], [10.3, 2.6], [10.3, 1.2]];

/** Pendant le match, on court d'un bout à l'autre du terrain. */
export const PARCOURS_MATCH: Point[] = [[0, -5.5], [-4.5, -7.5], [-6.8, -4.2], [-2, -3], [3.5, -6.8], [6.8, -5], [2, -8.6], [0, -5.6], [-5, -8.8], [-7.5, -6], [-3, -4.4], [4.6, -3.4], [7.2, -7.8]];

/** Durée du match, en secondes réelles. */
export const DUREE_MATCH = 18;

/** Les buts du match, à l'instant `t` (0 → 1) : on mène, on se fait rejoindre, et c'est 2 – 2 au coup de sifflet. */
const BUTS: [number, 'nous' | 'eux'][] = [[.22, 'nous'], [.45, 'eux'], [.68, 'nous'], [.9, 'eux']];
export const scoreDuMatch = (t: number): [number, number] => [
  BUTS.filter(([m, qui]) => qui === 'nous' && t >= m).length, BUTS.filter(([m, qui]) => qui === 'eux' && t >= m).length,
];

export type Coin = 'gauche' | 'centre' | 'droite';
export const COINS: Coin[] = ['gauche', 'centre', 'droite'];

/** Une manche des tirs au but : le tir rentre si le gardien plonge ailleurs (au centre, il arrête aussi les tirs mous). */
export const butMarque = (tir: Coin, plongeon: Coin) => tir !== plongeon;

/** Choix « au hasard » de l'adversaire, reproductible : chaque manche a son coin. */
export const coinAdverse = (graine: number, manche: number): Coin => COINS[Math.abs(Math.floor(Math.sin(graine * 12.9898 + manche * 78.233) * 43758.5453)) % 3];

/** Séance de tirs : cinq tirs chacun ; à égalité, mort subite. Renvoie le vainqueur si c'est joué, sinon null. */
export function issueTirs(nous: boolean[], eux: boolean[]): 'nous' | 'eux' | null {
  const b = (t: boolean[]) => t.filter(Boolean).length;
  const n = Math.max(nous.length, eux.length);
  if (nous.length !== eux.length) {
    // Le match est joué d'avance si l'écart ne peut plus être comblé dans les cinq premiers tirs.
    if (n > 5) return null;
    const restantsNous = 5 - nous.length, restantsEux = 5 - eux.length;
    if (b(nous) > b(eux) + restantsEux) return 'nous';
    if (b(eux) > b(nous) + restantsNous) return 'eux';
    return null;
  }
  if (n < 5) {
    const restants = 5 - n;
    if (b(nous) > b(eux) + restants) return 'nous';
    if (b(eux) > b(nous) + restants) return 'eux';
    return null;
  }
  if (b(nous) === b(eux)) return null;
  return b(nous) > b(eux) ? 'nous' : 'eux';
}
