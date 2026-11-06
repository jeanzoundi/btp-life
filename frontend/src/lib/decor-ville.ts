import type { EmpriseVille } from './itineraire-ville';
import { BATIMENTS, PARCELLE_BATIMENT, type PointMonde } from './batiments-ville';
import { bungalowChantier } from './journee-chantier';
import { boucleContournee, creerNavigation, type Boucle } from './navigation-ville';
import { BOUTIQUES_PALMIERS, EMPRISES_PALMIERS } from './place-palmiers';
import { TABLES_TERRASSE } from './terrasse-maquis';
import { LIMITES_VILLE, QUARTIERS } from './ville';

// Le décor fixe de la ville : où le dessiner (ville-lagune.tsx, ambiance-lagune.tsx, parcs-monde.tsx, bateaux-plage.tsx)
// et la place qu'il prend au sol, pour que le joueur ne le traverse plus. Une emprise couvre ce qui touche le sol (tronc,
// socle, table et chaises, coque), pas la couronne d'un arbre ni l'auvent d'un parasol qu'on passe dessous.

/** Emprise d'un objet de `largeur` (selon x) sur `profondeur` (selon z), tourné de `angle` : le rectangle droit qui l'englobe. */
export function empriseTournee(x: number, z: number, largeur: number, profondeur: number, angle = 0): EmpriseVille {
  const c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle));
  return { x, z, largeur: largeur * c + profondeur * s, profondeur: largeur * s + profondeur * c };
}
const pied = (x: number, z: number, cote: number): EmpriseVille => ({ x, z, largeur: cote, profondeur: cote });
/** Un objet rond (fontaine, bac d'arbre) : deux rectangles en croix, plus fidèles au cercle qu'un carré. */
const rond = (x: number, z: number, rayon: number): EmpriseVille[] => [
  { x, z, largeur: rayon * 2, profondeur: rayon * 1.25 }, { x, z, largeur: rayon * 1.25, profondeur: rayon * 2 },
];
const grille = (xs: readonly number[], zs: readonly number[]) => xs.flatMap(x => zs.map(z => [x, z] as PointMonde));

// ─── Arbres, lampadaires et mobilier ───

export const FLAMBOYANTS_CENTRE: PointMonde[] = [[-47, 30], [16, 31], [47, 34]];
/** Les lampadaires du centre, bras tourné vers la chaussée. */
export const LAMPADAIRES_CENTRE: PointMonde[] = grille([-42, -28, -14, 14, 28, 42], [-15, 15]);
/** Cocotiers : `echelle` reprend celle du dessin (le tronc s'élargit avec), `y` la hauteur du sol où il pousse. Chaque
 * repère de quartier a le sien. */
export const PALMIERS: { p: PointMonde; echelle: number; y: number }[] = [
  ...grille([-108, -72, 72, 108], [-55, -110]).map(p => ({ p, echelle: 1, y: 0 })),
  ...grille([-46, -22, 22, 46], [-16, 16]).map(p => ({ p, echelle: 1.15, y: .1 })),
  ...[-42, -21, 0, 21, 42].map(x => ({ p: [x, 44] as PointMonde, echelle: 1, y: 0 })),
  ...QUARTIERS.slice(1).map(q => ({ p: [q.x + 4.8, q.z + 3.5] as PointMonde, echelle: .8, y: 0 })),
];
/** Les bancs de la promenade, à côté de ses cocotiers. */
export const BANCS_PROMENADE: PointMonde[] = [-42, -21, 0, 21, 42].map(x => [x + 3, 46] as PointMonde);
/** Chaque repère de quartier a son lampadaire (et son cocotier, dans PALMIERS). */
export const REPERES_QUARTIERS = QUARTIERS.slice(1).map(q => ({ nom: q.nom, x: q.x, z: q.z, lampadaire: [q.x - 4.8, q.z - 3.5] as PointMonde }));
export const ARRETS_BUS: { p: PointMonde; r: number }[] = [{ p: [-30, -61], r: Math.PI }, { p: [30, -61], r: Math.PI }, { p: [-27, -6.2], r: Math.PI }, { p: [27, 6.2], r: 0 }];
export const PANNEAUX_RUE: { p: PointMonde; texte: string }[] = [{ p: [-117, -59], texte: 'GARE DES GBAKAS' }, { p: [-48, -4], texte: 'PLATEAU' }, { p: [48, 16], texte: 'LAGUNE' }];
export const PANNEAUX_AFFICHAGE: { p: PointMonde; r: number; titre: string; texte: string; couleur?: string }[] = [
  { p: [-18, 7], r: 0, titre: 'BTP LIFE', texte: 'Missions · Formations\nDécouvre la ville' },
  { p: [18, -7], r: Math.PI, titre: 'SÉCURITÉ CHANTIER', texte: 'Casque · Chaussures\nConsignes avant action', couleur: '#e9c94e' },
  { p: [-55, -47], r: Math.PI / 2, titre: 'QUARTIER DES JARDINS', texte: 'Marché · Résidences\nZone musicale à proximité', couleur: '#68a979' },
  { p: [55, -46], r: -Math.PI / 2, titre: 'PLATEAU TECHNIQUE', texte: 'Atelier · Logistique\nChantier du Plateau', couleur: '#5fa5b2' },
  { p: [72, 48], r: 0, titre: 'MARINA', texte: 'Promenade · Détente\nMusique lounge', couleur: '#589da6' },
];
export const POTEAUX_ELECTRIQUES = { z: -69.6, x: [-112, -96, -80, -64, -40, -24, -8, 8, 24, 40, 64, 80, 96, 112] } as const;
export const VOITURES_GAREES: { p: PointMonde; couleur: string }[] = [
  { p: [-36, -15.2], couleur: '#7e2831' }, { p: [-27, -15.2], couleur: '#d5c9aa' }, { p: [26, -74], couleur: '#416f84' }, { p: [37, -74], couleur: '#b88735' },
];
export const GBAKAS_GARES: { p: PointMonde; couleur?: string }[] = [{ p: [-112, -60.5] }, { p: [-104.5, -60.5], couleur: '#C8A52E' }];
export const ETALS_RUE: { x: number; couleur: string }[] = [{ x: -34, couleur: '#D4664F' }, { x: -8, couleur: '#2F6FB3' }, { x: 34, couleur: '#3F8F4E' }];
export const Z_ETALS = 15.9;
export const MOTOS_GAREES: { p: PointMonde; r: number; couleur?: string }[] = [
  { p: [-30.4, 15.2], r: .35 }, { p: [-4.6, 15.1], r: -.3, couleur: '#2B2E30' }, { p: [37.6, 15.2], r: .25, couleur: '#2F6FB3' }, { p: [-17, 37.6], r: 1.4 },
];
/** Le kiosque de transfert d'argent devant la place, et les trois échoppes de la plage, côté Jardins. */
export const KIOSQUE_TRANSFERT: PointMonde = [0, 20];
export const KIOSQUES_PLAGE: PointMonde[] = [[-100, 60], [-93, 60], [-86, 60]];
export const FONTAINE: PointMonde = [0, -52];
/** Feux tricolores, à l'angle de chaque carrefour des avenues. */
export const FEUX_TRICOLORES = [-66, -10, 10].flatMap(z => [-54, 54].map(x => ({ p: [x + 3.8, z + 3.8] as PointMonde, axe: x < 0 ? 'horizontal' as const : 'vertical' as const })));
/** Les jardins urbains : grands arbres dans leur bac, et jardinières le long de la promenade. */
export const ARBRES_JARDINS: PointMonde[] = grille([-112, -65, 65, 112], [-115, -95, -45, -25, 35]);
export const JARDINIERES_PROMENADE: PointMonde[] = [-100, -60, -20, 20, 60, 100].map(x => [x, 43] as PointMonde);
/** Îlots plantés et leurs arbres. */
export const ILOTS_PARCS: PointMonde[] = [[-22, -51], [22, -51], [-29, 44], [29, 44], [-114, -92], [114, -92]];
export const ARBRES_PARCS: PointMonde[] = ILOTS_PARCS.flatMap(([x, z]) => [[-5, -4], [5, -4], [-5, 4]].map(([dx, dz]) => [x + dx, z + dz] as PointMonde));
/** Les jardinières de la place centrale (avec ou sans cocotier). */
export const JARDINIERES_PLACE: PointMonde[] = grille([-18, -9, 9, 18], [-3.8, 3.8]);

// ─── La plage ───

/** Parasols de la plage, chacun avec sa table, ses deux chaises et un transat un peu plus près de l'eau. */
export const PARASOLS_PLAGE: PointMonde[] = [-70, -50, -30, -10, 10, 30, 50, 70].map(x => [x, 57] as PointMonde);
export const transatParasol = ([x, z]: PointMonde): PointMonde => [x + 2.2, z + 2];
/** Le filet de volley de la plage, entre ses deux poteaux. */
export const FILET_PLAGE = { x: 0, z: 57, demiLargeur: 6 } as const;

/** Le garde-corps de la promenade, au bord du sable : ouvert là où les passants et les joueurs descendent à la plage. */
export const GARDE_CORPS = { z: 49, de: -118, a: 118, ouvertures: [-108, -58, -32, 0, 32, 58, 108], largeurOuverture: 3.2 } as const;
/** Tronçons continus du garde-corps entre deux ouvertures, avec un poteau au moins tous les 4 m. */
export function tronconsGardeCorps() {
  const troncons: { de: number; a: number; poteaux: number[] }[] = [];
  let debut: number = GARDE_CORPS.de;
  for (const centre of [...GARDE_CORPS.ouvertures, Infinity]) {
    const fin = Math.min(GARDE_CORPS.a, centre - GARDE_CORPS.largeurOuverture / 2);
    if (fin - debut > .5) {
      const intervalles = Math.max(1, Math.ceil((fin - debut) / 4));
      troncons.push({ de: debut, a: fin, poteaux: Array.from({ length: intervalles + 1 }, (_, i) => debut + (fin - debut) * i / intervalles) });
    }
    debut = centre + GARDE_CORPS.largeurOuverture / 2;
  }
  return troncons;
}

/** Les pirogues de pêche tirées sur le sable, hors des allées des passants, des parasols et du terrain de volley. `modele`
 * choisit la décoration peinte (bateaux-plage.tsx). */
export const PIROGUES_PLAGE: { p: PointMonde; angle: number; modele: number }[] = [
  { p: [-47, 64.1], angle: .32, modele: 0 }, { p: [-40.5, 64.9], angle: -.18, modele: 1 },
  { p: [-21, 64.4], angle: .12, modele: 2 }, { p: [-15.5, 65.2], angle: -.3, modele: 3 },
  { p: [14.5, 64.6], angle: -.22, modele: 1 }, { p: [20, 65.1], angle: .1, modele: 0 },
  { p: [39, 64.3], angle: .28, modele: 3 }, { p: [45, 65], angle: -.12, modele: 2 },
];
/** Longueur et largeur d'une pirogue de plage (mètres). */
export const GABARIT_PIROGUE = { longueur: 7.2, largeur: 1.25 } as const;

// ─── Les emprises ───

const parasolCommerce = (x: number, z: number) => empriseTournee(x, z, 2.6, 1.7);

/** La terrasse du maquis : chaque table et ses quatre chaises. Le joueur la contourne ; les habitants, eux, viennent s'y
 * asseoir (lib/terrasse-maquis.ts). */
export const OBSTACLES_TERRASSE: EmpriseVille[] = TABLES_TERRASSE.map(([x, z]) => pied(x, z, 2.3));

/** Tout le décor fixe à contourner (sans les bâtiments). */
export const OBSTACLES_DECOR: EmpriseVille[] = [
  ...FLAMBOYANTS_CENTRE.flatMap(([x, z]) => rond(x, z, 1.8)),
  ...LAMPADAIRES_CENTRE.map(([x, z]) => pied(x, z, .5)),
  ...PALMIERS.map(({ p: [x, z], echelle }) => pied(x, z, .62 * echelle)),
  ...BANCS_PROMENADE.map(([x, z]) => empriseTournee(x, z + .2, 2.3, .8)),
  ...REPERES_QUARTIERS.map(q => pied(q.lampadaire[0], q.lampadaire[1], .5)),
  ...ARRETS_BUS.map(({ p: [x, z], r }) => empriseTournee(x, z, 3.8, 1.7, r)),
  ...PANNEAUX_RUE.map(({ p: [x, z] }) => pied(x, z, .35)),
  ...PANNEAUX_AFFICHAGE.map(({ p: [x, z], r }) => empriseTournee(x, z, 4.4, .7, r)),
  ...POTEAUX_ELECTRIQUES.x.map(x => pied(x, POTEAUX_ELECTRIQUES.z, .45)),
  ...VOITURES_GAREES.map(({ p: [x, z] }) => empriseTournee(x, z, 4.5, 1.95)),
  ...GBAKAS_GARES.map(({ p: [x, z] }) => empriseTournee(x, z, 5.7, 2.1)),
  ...ETALS_RUE.map(({ x }) => empriseTournee(x, Z_ETALS, 2, 1.9)),
  ...MOTOS_GAREES.map(({ p: [x, z], r }) => empriseTournee(x, z, 2, .8, r)),
  empriseTournee(KIOSQUE_TRANSFERT[0], KIOSQUE_TRANSFERT[1], 3.8, 3),
  ...KIOSQUES_PLAGE.map(([x, z]) => empriseTournee(x, z, 3.8, 3)),
  ...KIOSQUES_PLAGE.slice(0, 2).map(([x, z]) => parasolCommerce(x + 3.3, z + 2)),
  ...rond(FONTAINE[0], FONTAINE[1], 4.5),
  ...FEUX_TRICOLORES.map(({ p: [x, z] }) => pied(x, z, .35)),
  ...ARBRES_JARDINS.flatMap(([x, z]) => rond(x, z, 2.3)),
  ...JARDINIERES_PROMENADE.map(([x, z]) => empriseTournee(x, z, 3.2, 1)),
  ...ARBRES_PARCS.map(([x, z]) => pied(x, z, .45)),
  ...JARDINIERES_PLACE.map(([x, z]) => empriseTournee(x, z, 3.8, 2.6)),
  // La place des Palmiers : parasols rayés, pots fleuris des boutiques, mannequin de la couturière, mâts de la guirlande
  // et les deux habitantes qui bavardent devant les vitrines.
  ...[-12, 12].map(x => empriseTournee(x, 1.7, 2.4, 1.4)),
  ...BOUTIQUES_PALMIERS.flatMap(b => [pied(b.x - b.largeur / 2, b.z + 3.2, .8), pied(b.x + b.largeur / 2, b.z + 3.2, .8)]),
  pied(-15, -16.8, .6), ...[-7, 7].map(x => pied(x, -17, .3)), pied(10.7, -15.8, .6), pied(-11, -15.8, .6),
  ...OBSTACLES_TERRASSE,
  // Les parasols devant chaque commerce.
  ...BATIMENTS.filter(b => b.type === 'commerce').flatMap(b => [-3, 3].map(dx => parasolCommerce(b.position[0] + dx, b.position[2] + b.taille[2] / 2 + 4))),
  // La plage.
  ...PARASOLS_PLAGE.flatMap(p => { const t = transatParasol(p); return [empriseTournee(p[0], p[1], 2.6, 1.7), empriseTournee(t[0], t[1], 2.4, .75, -.15)]; }),
  pied(FILET_PLAGE.x - FILET_PLAGE.demiLargeur, FILET_PLAGE.z, .4), pied(FILET_PLAGE.x + FILET_PLAGE.demiLargeur, FILET_PLAGE.z, .4),
  ...tronconsGardeCorps().map(t => ({ x: (t.de + t.a) / 2, z: GARDE_CORPS.z, largeur: t.a - t.de, profondeur: .2 })),
  ...PIROGUES_PLAGE.map(({ p: [x, z], angle }) => empriseTournee(x, z, GABARIT_PIROGUE.longueur, GABARIT_PIROGUE.largeur, angle)),
];

/** Bâtiments, parcelle du fil rouge, boutiques de la place et bungalow du chantier. */
export const EMPRISES_BATIMENTS: EmpriseVille[] = (() => {
  const chantier = BATIMENTS.find(b => b.slug === 'chantier')!;
  return [
    ...[...BATIMENTS, PARCELLE_BATIMENT].map(b => ({ x: b.position[0], z: b.position[2], largeur: b.taille[0], profondeur: b.taille[2] })),
    ...EMPRISES_PALMIERS,
    bungalowChantier([chantier.position[0], chantier.position[2]], chantier.taille[0], chantier.taille[2]),
  ];
})();

/** Ce que le joueur ne traverse pas. */
export const OBSTACLES_JOUEUR: EmpriseVille[] = [...EMPRISES_BATIMENTS, ...OBSTACLES_DECOR];
/** Les déplacements du joueur dans la ville : itinéraires, glissement contre le décor, points d'arrivée dégagés. Les voisins
 * en ligne, joueurs eux aussi, la suivent entre deux relevés de position. */
export const NAVIGATION_VILLE = creerNavigation(OBSTACLES_JOUEUR, LIMITES_VILLE);
/** Les habitants contournent le même décor, sauf la terrasse du maquis où ils s'attablent. */
export const NAVIGATION_HABITANTS = creerNavigation(OBSTACLES_JOUEUR.filter(o => !OBSTACLES_TERRASSE.includes(o)), LIMITES_VILLE);

const boucles = new WeakMap<object, Boucle>();
/** Le circuit d'un passant ou d'un habitant à son poste, contourné une fois pour toutes (en cache par circuit). */
export function boucleHabitants(points: readonly (readonly [number, number])[]) {
  let boucle = boucles.get(points);
  if (!boucle) { boucle = boucleContournee(NAVIGATION_HABITANTS, points); boucles.set(points, boucle); }
  return boucle;
}
