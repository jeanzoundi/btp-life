// La Résidence Les Rôniers sur sa parcelle des Jardins de l'Ouest, en blocs : ce qu'on voit à chaque stade du deuxième
// dossier du fil rouge (chapitres validés du dossier, 0 à 12 ; l'immeuble est livré dès le onzième). Un R+5 de 14 × 10 m
// sur douze poteaux, chacun porté par deux pieux forés : les vingt-quatre pieux du bureau d'études.
// Repère local : origine au centre de la parcelle, façade et portail au sud (+z). Sans Three.js ni React.
import type { BlocArchitecture } from './architecture-ville';
import { PARCELLE_RONIERS } from './dossier-roniers';
import { ajouteur, type GabaritImmeuble } from './plan-akwaba';

export const DEMI_LARGEUR_RONIERS = PARCELLE_RONIERS.largeur / 2, DEMI_PROFONDEUR_RONIERS = PARCELLE_RONIERS.profondeur / 2;
/** L'immeuble : 14 × 10 m (140 m² par niveau, la surface du permis), rez-de-chaussée et cinq étages de 3 m. */
export const IMMEUBLE_RONIERS = { largeur: 14, profondeur: 10, centreZ: -.6, niveaux: 6, hauteurNiveau: 3 } as const satisfies GabaritImmeuble;
/** Les douze poteaux : quatre files de trois, en retrait des façades pour que leurs pieux restent sous l'immeuble. */
const FILES_X = [-6.4, -2.15, 2.15, 6.4], FILES_Z = [-4.3, 0, 4.3];
export const POTEAUX_RONIERS: [number, number][] = FILES_X.flatMap(x => FILES_Z.map(dz => [x, IMMEUBLE_RONIERS.centreZ + dz] as [number, number]));
/** Les vingt-quatre pieux, deux sous chaque poteau. */
export const PIEUX_RONIERS: [number, number][] = POTEAUX_RONIERS.flatMap(([x, z]) => [[x - .55, z], [x + .55, z]] as [number, number][]);
/** Les deux sondages profonds du laboratoire. */
export const SONDAGES_RONIERS: [number, number][] = [[-4.2, -2.6], [4.6, 1.2]];
/** La grue à tour, montée dans la trémie de l'ascenseur, au cœur de l'immeuble : les allées de la parcelle sont trop
 * étroites pour son lest, et les planchers l'entourent en montant. Son mât dépasse le R+5. */
export const GRUE_RONIERS = { position: [0, 0, -3.4] as const, hauteur: 24 };

/** Ce qui se voit sur la parcelle à un stade donné (chapitres du dossier validés). */
export function elementsRoniers(stade: number) {
  return {
    bornes: stade < 4, reserve: stade === 0, panneauProjet: stade >= 1 && stade < 11,
    sondages: stade >= 2 && stade < 6, sondeuse: stade === 2, implantation: stade >= 3 && stade < 6, piquets: stade >= 3 && stade < 6,
    palissade: stade >= 4 && stade < 11, permis: stade >= 4 && stade < 11, baseVie: stade >= 5 && stade < 11,
    forage: stade === 6, longrines: stade === 7, grue: stade >= 7 && stade < 10, stocks: stade >= 7 && stade < 10,
    /** Niveaux de structure montés : la moitié au stade 8, tous au stade 9. */
    niveauxMontes: stade === 8 ? 3 : stade === 9 ? IMMEUBLE_RONIERS.niveaux : 0,
    echafaudage: stade === 9, immeuble: stade >= 10, reception: stade === 10, livre: stade >= 11,
  };
}
export type ElementsRoniers = ReturnType<typeof elementsRoniers>;

/** Un piquet par pieu, tête orange, et la marque de peinture au sol (stades 3 à 5). */
export function piquetsPieux(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  for (const [x, z] of PIEUX_RONIERS) { b([x, .085, z], [.3, .01, .3], '#F2EFE8'); b([x, .34, z], [.05, .6, .05], '#8A6A48', 0, 'bois'); b([x, .66, z], [.08, .08, .08], '#E2653C'); }
  return blocs;
}

/** Les têtes des pieux forés, recépées, avec leurs aciers en attente (stade 6). */
export function tetesPieux(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  for (const [x, z] of PIEUX_RONIERS) {
    b([x, .07, z], [.85, .06, .85], '#5B4636');
    b([x, .16, z], [.6, .2, .6], '#A3A097');
    for (const dx of [-.18, .18]) for (const dz of [-.18, .18]) b([x + dx, .5, z + dz], [.03, .5, .03], '#7B4A32', 0, 'metal');
  }
  return blocs;
}

/** Massifs sur les pieux et longrines qui les relient, sous le dallage du rez-de-chaussée (stade 7). */
export function longrinesRoniers(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs), cz = IMMEUBLE_RONIERS.centreZ;
  const longueurX = FILES_X[FILES_X.length - 1] - FILES_X[0], longueurZ = FILES_Z[FILES_Z.length - 1] - FILES_Z[0];
  for (const [x, z] of POTEAUX_RONIERS) b([x, .3, z], [1.7, .6, .8], '#ADA89C');
  for (const dz of FILES_Z) b([0, .25, cz + dz], [longueurX, .5, .3], '#B8B3A8');
  for (const x of FILES_X) b([x, .25, cz], [.3, .5, longueurZ], '#B8B3A8');
  // Les poteaux du rez-de-chaussée sortent en attente de leurs massifs.
  for (const [x, z] of POTEAUX_RONIERS) for (const dx of [-.1, .1]) for (const dz of [-.1, .1]) b([x + dx, 1, z + dz], [.025, .9, .025], '#7B4A32', 0, 'metal');
  return blocs;
}

/** Où se tient la base vie : devant l'immeuble, à l'est du portail (les allées sont trop étroites). */
export const BASE_VIE_RONIERS = { bungalow: [5.9, 0, 5.15] as const, taille: [2.6, 2.3, 1.3] as const, sanitaires: [8.1, 1.15, 5.3] as const };

/** Stocks à portée de grue (stades 7 à 9) : palettes d'hourdis devant l'immeuble, à l'ouest du portail, et poutrelles et
 * aciers sur cales dans l'allée ouest. */
export function stocksRoniers(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  for (const x0 of [-7.6, -5.9]) {
    b([x0 + .6, .07, 5.5], [1.3, .14, 1.05], '#8B6A45', 0, 'bois');
    for (let y = 0; y < 3; y++) for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) b([x0 + .3 + i * .6, .26 + y * .22, 5.25 + k * .5], [.55, .2, .45], '#C8C3B8');
  }
  for (const z of [-2.6, .6]) b([-8.3, .08, z], [1.2, .16, .2], '#8B6A45', 0, 'bois');
  for (let i = 0; i < 6; i++) b([-8.6 + (i % 3) * .2, .22 + Math.floor(i / 3) * .14, -1], [.1, .12, 4], '#BDB5A3');
  for (let i = 0; i < 8; i++) b([-7.85 + (i % 4) * .06, .2 + Math.floor(i / 4) * .06, -1], [.035, .035, 4.2], '#8A5A3C', 0, 'metal');
  return blocs;
}
