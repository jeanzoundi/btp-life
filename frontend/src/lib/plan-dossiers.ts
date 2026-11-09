// Les chantiers des dossiers du fil rouge qui suivent les Rôniers, en blocs : ce qu'on voit sur chaque parcelle à chaque
// stade (chapitres validés du dossier, 0 à 8 ; l'ouvrage est livré dès le septième). Trois formes : des bâtiments à
// étages (école, centre de santé, résidence universitaire), une halle métallique (marché couvert) et un château d'eau.
// Les matières sont celles du vrai chantier : bois des palettes et des coffrages, acier des armatures ; le béton coulé reste
// un enduit gris (la matière « beton » des blocs est la texture sableuse des trottoirs : sur un fût ou un poteau, elle paraît brune).
// Repère local : origine au centre de la parcelle, portail au sud (+z). Sans Three.js ni React.
import type { BlocArchitecture, MatiereBloc, V3 } from './architecture-ville';
import { DOSSIERS } from './campagne';
import { type GabaritImmeuble } from './plan-akwaba';

export type FormeOuvrage = 'batiment' | 'halle' | 'chateau-eau';
export interface GabaritDossier {
  forme: FormeOuvrage;
  /** Emprise et niveaux de l'ouvrage. La halle : un niveau, haut de ses poteaux ; le château d'eau : son radier et son fût. */
  ouvrage: GabaritImmeuble;
  couleur: string;
  /** Bungalow de la base vie et ses sanitaires, devant l'ouvrage ; stocks de l'autre côté du portail. */
  baseVie: V3; sanitaires: V3; stocks: V3;
  grue: { position: V3; hauteur: number };
  enseigne: { texte: string; couleur: string };
  /** Le sol de la parcelle une fois l'ouvrage livré. */
  sol: 'pave' | 'gazon' | 'gravier';
  /** Une croix verte en façade (centre de santé). */
  croix?: boolean;
}

/** Le château d'eau : radier, fût, cône de transition et cuve (mètres, repère de la parcelle). */
export const CHATEAU = { radier: { rayon: 4.5, epaisseur: .6 }, fut: { rayon: 1.8, hauteur: 22 }, cone: 2.4, cuve: { rayon: 5.5, hauteur: 5.6 } } as const;
/** La halle : hauteur des poteaux, montée du faîtage (pente de 15 % sur une demi-largeur de 5 m), portiques tous les 4 m. */
export const HALLE = { poteau: 5, faitage: .75, portiques: 5 } as const;

export const GABARITS_DOSSIERS: Record<string, GabaritDossier> = {
  'groupe-scolaire': {
    forme: 'batiment', ouvrage: { largeur: 20, profondeur: 8, centreZ: -1.6, niveaux: 2, hauteurNiveau: 3.3 }, couleur: '#EAD8B0',
    baseVie: [-8.5, 0, 3.6], sanitaires: [-10.9, 1.15, 3.7], stocks: [7.4, 0, 4.2], grue: { position: [0, 0, -4.4], hauteur: 15 },
    enseigne: { texte: 'GROUPE SCOLAIRE DES PALMIERS', couleur: '#2F6FB3' }, sol: 'pave',
  },
  'centre-sante': {
    forme: 'batiment', ouvrage: { largeur: 12, profondeur: 9, centreZ: -1.2, niveaux: 2, hauteurNiveau: 3.3 }, couleur: '#F1EDE4',
    baseVie: [-4.2, 0, 4.4], sanitaires: [-6.3, 1.15, 4.6], stocks: [4.3, 0, 4.9], grue: { position: [0, 0, -4], hauteur: 15 },
    enseigne: { texte: 'CENTRE DE SANTÉ DE LA LAGUNE', couleur: '#2E7D4F' }, sol: 'pave', croix: true,
  },
  'marche-couvert': {
    forme: 'halle', ouvrage: { largeur: 16, profondeur: 10, centreZ: -.6, niveaux: 1, hauteurNiveau: HALLE.poteau }, couleur: '#2F6B5E',
    baseVie: [-6.4, 0, 5.4], sanitaires: [-8.3, 1.15, 5.5], stocks: [5.6, 0, 5.6], grue: { position: [0, 0, -3], hauteur: 12 },
    enseigne: { texte: 'MARCHÉ COUVERT DU PLATEAU', couleur: '#B5532F' }, sol: 'pave',
  },
  'residence-universitaire': {
    forme: 'batiment', ouvrage: { largeur: 12, profondeur: 12, centreZ: -1.4, niveaux: 4, hauteurNiveau: 3 }, couleur: '#E3CFAE',
    baseVie: [-4.2, 0, 5.8], sanitaires: [-6.3, 1.15, 6], stocks: [4.3, 0, 6.2], grue: { position: [0, 0, -5.6], hauteur: 19 },
    enseigne: { texte: 'RÉSIDENCE UNIVERSITAIRE', couleur: '#7A4F2F' }, sol: 'gazon',
  },
  'chateau-eau': {
    forme: 'chateau-eau', ouvrage: { largeur: 9, profondeur: 9, centreZ: -.6, niveaux: 1, hauteurNiveau: CHATEAU.fut.hauteur }, couleur: '#EEF1F3',
    baseVie: [-6.9, 0, 3.6], sanitaires: [-8.5, 1.15, 1.6], stocks: [6.4, 0, 3.6], grue: { position: [6.6, 0, -3.4], hauteur: 32 },
    enseigne: { texte: 'RÉGIE DES EAUX · LES JARDINS', couleur: '#1F5F8B' }, sol: 'gravier',
  },
};

/** Le dossier et le gabarit de chaque chantier dessiné ici (les dossiers après les Rôniers, dans l'ordre du fil rouge). */
export const CHANTIERS_DOSSIERS = DOSSIERS.slice(2).map(dossier => ({ dossier, gabarit: GABARITS_DOSSIERS[dossier.id] }));

/** Ce qui se voit sur la parcelle à un stade donné (chapitres du dossier validés, 0 à 8). */
export function elementsDossier(stade: number) {
  return {
    bornes: stade < 3, reserve: stade === 0, panneauProjet: stade >= 1 && stade < 7,
    sondages: stade === 2, implantation: stade === 2,
    palissade: stade >= 3 && stade < 7, permis: stade >= 3 && stade < 7, baseVie: stade >= 3 && stade < 7,
    fondations: stade === 4, stocks: stade === 4 || stade === 5, grue: stade === 4 || stade === 5,
    grosOeuvre: stade === 5, ouvrage: stade >= 6, reception: stade === 6, livre: stade >= 7,
  };
}
export type ElementsDossier = ReturnType<typeof elementsDossier>;

const bloc = (liste: BlocArchitecture[]) => (position: V3, taille: V3, couleur: string, matiere?: MatiereBloc, forme?: 'cylindre') => {
  liste.push({ position, taille, couleur, rotation: 0, ...(matiere ? { matiere } : {}), ...(forme ? { forme } : {}) });
};
const entre = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));

/** Les poteaux de l'ouvrage : une trame d'environ 4,5 m pour un bâtiment, les deux files de portiques pour la halle. */
export function poteauxDossier(g: GabaritDossier): [number, number][] {
  const { largeur: l, profondeur: p, centreZ: cz } = g.ouvrage;
  if (g.forme === 'chateau-eau') return [];
  if (g.forme === 'halle') return entre(-l / 2, l / 2, HALLE.portiques).flatMap(x => [-p / 2, p / 2].map(dz => [x, cz + dz] as [number, number]));
  const nx = Math.max(2, Math.round(l / 4.5) + 1), nz = Math.max(2, Math.round(p / 4.5) + 1);
  return entre(-l / 2 + .4, l / 2 - .4, nx).flatMap(x => entre(-p / 2 + .4, p / 2 - .4, nz).map(dz => [x, cz + dz] as [number, number]));
}

/** Deux sondages sous l'emprise de l'ouvrage. */
export const sondagesDossier = (g: GabaritDossier): [number, number][] => [
  [-g.ouvrage.largeur / 4, g.ouvrage.centreZ - g.ouvrage.profondeur / 6], [g.ouvrage.largeur / 4, g.ouvrage.centreZ + g.ouvrage.profondeur / 6],
];

/** Fondations coulées (stade 4) : une semelle par poteau, au fond de sa fouille, avec ses aciers en attente ; ou, pour
 * le château d'eau, le grand radier circulaire et la couronne d'aciers qui attend le fût. */
export function fondationsDossier(g: GabaritDossier): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = bloc(blocs);
  if (g.forme === 'chateau-eau') {
    const { radier, fut } = CHATEAU, cz = g.ouvrage.centreZ;
    b([0, radier.epaisseur / 2, cz], [radier.rayon * 2, radier.epaisseur, radier.rayon * 2], '#B9B4AA', undefined, 'cylindre');
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      b([Math.cos(a) * (fut.rayon - .15), radier.epaisseur + .7, cz + Math.sin(a) * (fut.rayon - .15)], [.04, 1.4, .04], '#7B4A32', 'metal');
    }
    return blocs;
  }
  for (const [x, z] of poteauxDossier(g)) {
    b([x, .06, z], [1.9, .04, 1.9], '#4A3A2D');
    b([x, .16, z], [1.3, .26, 1.3], '#B7B2A7');
    for (const dx of [-.1, .1]) for (const dz of [-.1, .1]) b([x + dx, .65, z + dz], [.03, .8, .03], '#7B4A32', 'metal');
  }
  return blocs;
}

/** Stocks du chantier (stades 4 et 5) autour de `g.stocks` : palette et matériaux de la forme d'ouvrage, botte d'aciers. */
export function stocksDossier(g: GabaritDossier): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = bloc(blocs), [sx, , sz] = g.stocks;
  // Une palette de matériaux : agglos pour un bâtiment ou un fût, sacs de ciment pour la halle.
  b([sx - .9, .07, sz], [1.2, .14, 1], '#8B6A45', 'bois');
  for (let y = 0; y < 3; y++) for (let i = 0; i < 2; i++) b([sx - 1.2 + i * .6, .26 + y * .22, sz], [.55, .2, .9], g.forme === 'halle' ? '#DCCFB2' : '#ABA79E');
  // La botte d'aciers, sur ses cales de bois.
  for (const dx of [-1.2, 1.2]) b([sx + .3 + dx, .06, sz + .85], [.2, .12, .4], '#8B6A45', 'bois');
  for (let i = 0; i < 8; i++) b([sx + .3, .16 + Math.floor(i / 4) * .05, sz + .76 + (i % 4) * .06], [3, .035, .035], '#8A5A3C', 'metal');
  if (g.forme === 'halle') {
    // Les profilés de la charpente, sur cales, entre la halle et la palette.
    for (const dx of [-1.3, 1.3]) b([sx + .4 + dx, .08, sz - .9], [.2, .16, .4], '#8B6A45', 'bois');
    for (let i = 0; i < 4; i++) b([sx + .4, .3 + Math.floor(i / 2) * .28, sz - 1.04 + (i % 2) * .28], [3.4, .27, .14], '#5E6B70', 'metal');
  } else if (g.forme === 'chateau-eau') {
    // Les panneaux du coffrage grimpant, debout contre leur chevalet.
    for (let i = 0; i < 5; i++) b([sx + .6 + i * .12, .9, sz], [.06, 1.8, 1.2], '#C9A46A', 'bois');
  }
  return blocs;
}

/** Le gros œuvre du château d'eau (stade 5) : le fût aux deux tiers, coiffé de son coffrage grimpant et de sa plateforme. */
export function futEnElevation(g: GabaritDossier): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = bloc(blocs), cz = g.ouvrage.centreZ, { radier, fut } = CHATEAU;
  const haut = radier.epaisseur + fut.hauteur * .65;
  b([0, radier.epaisseur / 2, cz], [radier.rayon * 2, radier.epaisseur, radier.rayon * 2], '#B9B4AA', undefined, 'cylindre');
  b([0, (radier.epaisseur + haut) / 2, cz], [fut.rayon * 2, haut - radier.epaisseur, fut.rayon * 2], '#C3BEB3', undefined, 'cylindre');
  b([0, haut + 1.3, cz], [fut.rayon * 2 + .5, 2.6, fut.rayon * 2 + .5], '#C9A46A', 'bois', 'cylindre');
  b([0, haut - .1, cz], [fut.rayon * 2 + 2.4, .14, fut.rayon * 2 + 2.4], '#6E7477', 'metal', 'cylindre');
  // Les aciers de la levée suivante dépassent du coffrage.
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    b([Math.cos(a) * (fut.rayon - .1), haut + 3.1, cz + Math.sin(a) * (fut.rayon - .1)], [.04, 1.2, .04], '#7B4A32', 'metal');
  }
  return blocs;
}

/** Le château d'eau fini (stade 6 et après) : radier, fût, cuve peinte et son bandeau ; le cône de transition est dessiné
 * à part (une forme conique). */
export function chateauFini(g: GabaritDossier): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = bloc(blocs), cz = g.ouvrage.centreZ, { radier, fut, cone, cuve } = CHATEAU;
  const haut = radier.epaisseur + fut.hauteur, baseCuve = haut + cone;
  b([0, radier.epaisseur / 2, cz], [radier.rayon * 2, radier.epaisseur, radier.rayon * 2], '#B9B4AA', undefined, 'cylindre');
  b([0, (radier.epaisseur + haut) / 2, cz], [fut.rayon * 2, fut.hauteur, fut.rayon * 2], '#ECEAE4', undefined, 'cylindre');
  b([0, baseCuve + cuve.hauteur / 2, cz], [cuve.rayon * 2, cuve.hauteur, cuve.rayon * 2], g.couleur, undefined, 'cylindre');
  b([0, baseCuve + cuve.hauteur * .62, cz], [cuve.rayon * 2 + .04, .7, cuve.rayon * 2 + .04], g.enseigne.couleur, undefined, 'cylindre');
  b([0, baseCuve + cuve.hauteur + .15, cz], [cuve.rayon * 2 + .3, .3, cuve.rayon * 2 + .3], '#C9CED2', undefined, 'cylindre');
  b([0, baseCuve + cuve.hauteur + .55, cz], [2.2, .5, 2.2], '#A9B0B4', 'metal', 'cylindre');
  // La porte au pied du fût, et l'échelle à crinoline qui monte jusqu'à la cuve.
  b([0, 1.6, cz + fut.rayon + .02], [1, 2, .08], '#3E4A52', 'metal');
  b([fut.rayon + .25, (radier.epaisseur + haut) / 2, cz], [.08, fut.hauteur, .5], '#7C858A', 'metal');
  return blocs;
}

/** Les étals de la halle (livrée) : deux rangées de tables de bois, couvertes de marchandises de toutes les couleurs. */
export function etalsHalle(g: GabaritDossier): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = bloc(blocs), { largeur: l, profondeur: p, centreZ: cz } = g.ouvrage;
  const COULEURS = ['#D9483B', '#E8B23A', '#5E9E45', '#E07B39', '#8C4F9E', '#C9C14A'];
  let n = 0;
  for (const dz of [-p / 4, p / 4]) for (const x of entre(-l / 2 + 1.6, l / 2 - 1.6, 6)) {
    b([x, .45, cz + dz], [1.9, .08, 1.1], '#8B6A45', 'bois');
    for (const pied of [-.85, .85]) b([x + pied, .22, cz + dz], [.08, .44, 1], '#6E5236', 'bois');
    for (let k = 0; k < 3; k++) b([x - .55 + k * .55, .58, cz + dz], [.45, .18, .7], COULEURS[(n + k) % COULEURS.length]);
    n++;
  }
  // Le caniveau de lavage, au milieu de l'allée centrale.
  b([0, .02, cz], [l - 1, .03, .3], '#5B6266');
  return blocs;
}
