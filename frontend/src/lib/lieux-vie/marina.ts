// La Marina BTP Life : pontons sur la lagune, pirogues amarrées, terrasse sous les paillotes, kiosque à noix de coco.
// Mécanique propre : la balade en pirogue. On embarque au bout du ponton, la pirogue fait le tour du plan d'eau, on revient.
import { zone, type Assise, type Point } from '../navigation-plan';
import type { ArticleCarte, LieuVie } from '.';

export const ARTICLES_MARINA: ArticleCarte[] = [
  { id: 'coco', nom: 'Noix de coco', detail: 'Fraîche, ouverte à la machette', categorie: 'boisson', action: 'repas', prix: 500, effets: { faim: 5, energie: 5, social: 5, divertissement: 5 }, moral: 2, preparation: 2, message: 'Une noix de coco fraîche, ouverte à la machette.' },
  { id: 'brochettes-crevettes', nom: 'Brochettes de crevettes', detail: 'Grillées, citron vert, attiéké', categorie: 'plat', action: 'repas', prix: 3000, effets: { faim: 70, social: 5, divertissement: 10 }, moral: 4, preparation: 6, message: 'Brochettes de crevettes en terrasse, face à la lagune.' },
  { id: 'pirogue', nom: 'Balade en pirogue', detail: 'Le tour du plan d’eau avec le capitaine', categorie: 'activite', action: 'social', prix: 2000, effets: { social: 35, energie: -5, divertissement: 45 }, moral: 8, preparation: 3, duree: 18, moralPrincipal: true, message: 'Le tour de la lagune en pirogue : le vent du large remet les idées en place.' },
];

/** Où chaque commande se prend : la coco au kiosque, les brochettes en terrasse, la pirogue au bout du ponton. */
export const STATION_MARINA: Record<string, 'kiosque' | 'terrasse' | 'ponton'> = { coco: 'kiosque', 'brochettes-crevettes': 'terrasse', pirogue: 'ponton' };

export const TABLES_MARINA: Point[] = [[-10, 4], [-7, 4], [-10, 6.6], [-7, 6.6]];

/** Les deux pontons : x de… à…, z de la rive (−1,2) jusqu'à leur bout. */
export const PONTONS: { x1: number; x2: number; bout: number }[] = [{ x1: -1, x2: 1, bout: -8.2 }, { x1: 7, x2: 8.5, bout: -6.2 }];

export const MARINA: LieuVie = {
  slug: 'marina', nom: 'Marina BTP Life',
  accroche: 'La lagune au bout des pontons : on y mange en terrasse et on part en pirogue le temps d’une respiration.',
  hote: { nom: 'Capitaine Désiré', role: 'Loueur de pirogues de la marina' },
  horaires: { ouverture: 8, fermeture: 21 },
  carte: ARTICLES_MARINA,
  plan: {
    ambiance: 'exterieur', demiLargeur: 14, demiProfondeur: 10, depart: [0, 8.8],
    obstacles: [
      // La lagune occupe le nord : on n'y marche que sur les pontons.
      zone(-14, -1, -10, -1.2), zone(1, 7, -10, -1.2), zone(8.5, 14, -10, -1.2),
      zone(-1, 1, -10, -8.2), zone(7, 8.5, -10, -6.2),
      ...TABLES_MARINA.map(([x, z]) => zone(x - .8, x + .8, z - .8, z + .8)), // tables de la terrasse
      zone(6, 9, 3, 5),                 // kiosque à noix de coco, comptoir au sud
      zone(10.4, 13.6, 6, 8.6),         // pirogue à terre, sur ses tréteaux
    ],
    stations: { ponton: [0, -7.4], terrasse: [-8.5, 2.6], kiosque: [7.5, 5.7], mentor: [2.4, 1.2] },
    libelles: { ponton: 'Embarcadère', terrasse: 'Terrasse', kiosque: 'Kiosque à cocos', mentor: 'Capitaine Désiré' },
    mentor: { position: [2.4, -.2], rotation: 0 },
  },
};

/** À la terrasse, on s'assoit côté nord de la table, face à la rue et à la caméra. */
export const ASSISE_TERRASSE: Assise = { position: [-7, 3.35], rotation: 0 };

/** Tour du plan d'eau en pirogue : on s'écarte du grand ponton vers le bassin, boucle au large vers l'ouest,
 * retour en contournant le bout du ponton, et l'on accoste proue vers la rive. */
export const TOUR_PIROGUE: Point[] = [[1.6, -7.4], [3.6, -4.6], [5.4, -7.4], [4.4, -11.2], [-1, -14], [-7, -14.2], [-11.5, -10.5], [-10.5, -5.5], [-6, -4.6], [-3.2, -7.6], [-1.6, -10.2], [2.2, -10.4], [1.6, -7.4]];

/** Position et cap de la pirogue à l'instant `t` du tour (0 → 1), en suivant les segments à vitesse constante. */
export function surLeTour(t: number): { position: Point; cap: number } {
  const longueurs = TOUR_PIROGUE.slice(1).map((p, i) => Math.hypot(p[0] - TOUR_PIROGUE[i][0], p[1] - TOUR_PIROGUE[i][1]));
  let reste = Math.max(0, Math.min(1, t)) * longueurs.reduce((n, l) => n + l, 0);
  for (let i = 0; i < longueurs.length; i++) {
    const [ax, az] = TOUR_PIROGUE[i], [bx, bz] = TOUR_PIROGUE[i + 1];
    if (reste <= longueurs[i] || i === longueurs.length - 1) {
      const k = longueurs[i] ? Math.min(1, reste / longueurs[i]) : 0;
      return { position: [ax + (bx - ax) * k, az + (bz - az) * k], cap: Math.atan2(bx - ax, bz - az) };
    }
    reste -= longueurs[i];
  }
  return { position: TOUR_PIROGUE[0], cap: 0 };
}

/** Amarrée, la pirogue attend comme elle a accosté : proue vers la rive. */
export const CAP_AMARRE = surLeTour(1).cap;
