// La Résidence Akwaba sur sa parcelle, en blocs : ce qu'on voit à chaque stade du fil rouge (chapitres validés, 0 à 12 ;
// l'immeuble est livré et habité dès le neuvième, l'épilogue ne change plus la parcelle). Bornage, sondages, implantation,
// structure, échafaudage et muret servent aussi au R+5 des Rôniers (plan-roniers.ts), à ses dimensions.
// Repère local : origine au centre de la parcelle, façade et portail au sud (+z), côté avenue. Sans Three.js ni React.
import type { BlocArchitecture, MatiereBloc, V3 } from './architecture-ville';
import { PARCELLE_AKWABA } from './campagne';

/** Les dimensions d'un immeuble sur sa parcelle (repère local de la parcelle). */
export interface GabaritImmeuble { largeur: number; profondeur: number; centreZ: number; niveaux: number; hauteurNiveau: number }

export const DEMI_LARGEUR = PARCELLE_AKWABA.largeur / 2, DEMI_PROFONDEUR = PARCELLE_AKWABA.profondeur / 2;
/** L'immeuble : 12 × 9 m (la surface du permis), quatre niveaux de 3 m, en retrait de la clôture côté avenue. */
export const IMMEUBLE = { largeur: 12, profondeur: 9, centreZ: -.8, niveaux: 4, hauteurNiveau: 3 } as const satisfies GabaritImmeuble;
/** Les seize poteaux, donc les seize semelles du bureau d'études : quatre files de quatre. */
export const POTEAUX: [number, number][] = [-5.75, -1.92, 1.92, 5.75].flatMap(x => [-4.25, -1.42, 1.42, 4.25].map(dz => [x, IMMEUBLE.centreZ + dz] as [number, number]));
/** Les trois points de sondage du laboratoire. */
export const SONDAGES: [number, number][] = [[-4, -3.6], [4.4, -2], [0, 2.4]];

/** Ce qui se voit sur la parcelle à un stade donné. */
export function elementsAkwaba(stade: number) {
  return {
    bornes: stade < 4, panneauProjet: stade >= 1 && stade < 9, sondages: stade >= 2 && stade < 6, appareilSondage: stade === 2,
    implantation: stade >= 3 && stade < 6, palissade: stade >= 4 && stade < 9, permis: stade >= 4 && stade < 9,
    baseVie: stade >= 5 && stade < 9, fouilles: stade === 6, stocks: stade === 6 || stade === 7, grosOeuvre: stade === 7,
    immeuble: stade >= 8, reception: stade === 8, livre: stade >= 9,
  };
}
export type ElementsAkwaba = ReturnType<typeof elementsAkwaba>;

/** Ajoute un bloc à la liste ; `matiere` lui donne sa vraie matière (bois, acier), l'enduit sinon, gris pour le béton coulé. */
export const ajouteur = (liste: BlocArchitecture[]) => (position: V3, taille: V3, couleur: string, rotation = 0, matiere?: MatiereBloc) => {
  liste.push({ position, taille, couleur, rotation, ...(matiere ? { matiere } : {}) });
};

/** Bornes aux quatre coins et rubalise tendue entre des piquets : la parcelle est réservée, on n'y entre pas. */
export const bornageAkwaba = () => bornage(DEMI_LARGEUR, DEMI_PROFONDEUR);
export function bornage(hx: number, hz: number): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  for (const x of [-hx, hx]) for (const z of [-hz, hz]) { b([x, .25, z], [.26, .5, .26], '#E8E2D6'); b([x, .54, z], [.28, .08, .28], '#C1502E'); }
  // Piquets tous les 2,5 m environ, deux rangs de ruban rouge et blanc.
  for (const [longueur, axe, fixe] of [[hx * 2, 'x', -hz], [hx * 2, 'x', hz], [hz * 2, 'z', -hx], [hz * 2, 'z', hx]] as const) {
    const n = Math.round(longueur / 2.5);
    for (let i = 1; i < n; i++) { const t = -longueur / 2 + i * longueur / n; b(axe === 'x' ? [t, .5, fixe] : [fixe, .5, t], [.06, 1, .06], '#8A6A48', 0, 'bois'); }
    for (const [y, c] of [[.85, '#D9443A'], [.6, '#F2EFE8']] as const) b(axe === 'x' ? [0, y, fixe] : [fixe, y, 0], axe === 'x' ? [longueur, .04, .015] : [.015, .04, longueur], c);
  }
  return blocs;
}

/** Points de sondage piquetés (stades 2 à 5). */
export const sondagesAkwaba = () => sondages(SONDAGES);
export function sondages(points: readonly (readonly [number, number])[]): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  for (const [x, z] of points) { b([x, .09, z], [.5, .02, .5], '#3A2E24'); b([x + .35, .45, z], [.06, .9, .06], '#E2653C', 0, 'bois'); b([x + .35, .93, z], [.07, .07, .07], '#F2EFE8'); }
  return blocs;
}

/** Implantation : chaises en bois aux angles, cordeaux et traits de chaux sur le périmètre de l'immeuble (stades 3 à 5). */
export const implantationAkwaba = () => implantation(IMMEUBLE);
export function implantation(im: GabaritImmeuble): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  const hx = im.largeur / 2, z0 = im.centreZ - im.profondeur / 2, z1 = im.centreZ + im.profondeur / 2;
  for (const x of [-hx, hx]) for (const z of [z0, z1]) {
    const sx = Math.sign(x), sz = Math.sign(z - im.centreZ);
    b([x + sx * 1, .6, z + sz * .4], [.05, .12, 1.2], '#B08850', 0, 'bois'); b([x + sx * .4, .6, z + sz * 1], [1.2, .12, .05], '#B08850', 0, 'bois');
    for (const [px, pz] of [[x + sx * 1, z + sz * 1], [x + sx * 1, z - sz * .2], [x - sx * .2, z + sz * 1]]) b([px, .33, pz], [.07, .66, .07], '#8A6A48', 0, 'bois');
  }
  // Cordeaux tendus d'une chaise à l'autre, et traits de chaux au sol.
  for (const z of [z0, z1]) { b([0, .64, z], [hx * 2 + 2, .012, .012], '#F7F4EC'); b([0, .09, z], [hx * 2, .01, .12], '#F4F1E8'); }
  for (const x of [-hx, hx]) { b([x, .64, im.centreZ], [.012, .012, im.profondeur + 2], '#F7F4EC'); b([x, .09, im.centreZ], [.12, .01, im.profondeur], '#F4F1E8'); }
  return blocs;
}

/** Fouilles des seize semelles ouvertes (stade 6), avec la terre extraite en tas. */
export function fouillesAkwaba(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  for (const [x, z] of POTEAUX) { b([x, .07, z], [2.4, .06, 2.4], '#5B4636'); b([x, .085, z], [2, .04, 2], '#463529'); }
  return blocs;
}

/** Matériaux stockés côté est : palette d'agglos, sacs de ciment, botte d'aciers sur cales (stades 6 et 7). */
export function stocksAkwaba(): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  b([8.2, .08, 2.6], [1.3, .15, 1.1], '#8B6A45', 0, 'bois');
  for (let y = 0; y < 3; y++) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) b([7.8 + i * .42, .3 + y * .22, 2.35 + k * .5], [.4, .2, .48], '#9E9A91');
  b([8.2, .08, .9], [1.5, .15, 1.1], '#8B6A45', 0, 'bois');
  for (let y = 0; y < 2; y++) for (let i = 0; i < 4; i++) b([7.65 + i * .37, .27 + y * .2, .9], [.35, .18, .9], '#DCCFB2', (y + i) % 2 ? .05 : -.05);
  // La botte d'aciers reste au sud de la grue, qui monte au stade suivant au fond de la parcelle.
  for (const z of [-1, -2.4]) b([7.6, .1, z], [1.6, .2, .2], '#8B6A45', 0, 'bois');
  for (let i = 0; i < 7; i++) b([7.6 - .3 + (i % 4) * .14, .26 + Math.floor(i / 4) * .07, -1.7], [.035, .035, 2.4], '#8A5A3C', 0, 'metal');
  return blocs;
}

/** Le gros œuvre en élévation (stade 7) : dallage, poteaux et planchers des quatre niveaux, maçonnerie des deux premiers. */
export const structureAkwaba = () => structure(IMMEUBLE, POTEAUX);
/** Dallage, puis poteaux et plancher de chacun des `montes` premiers niveaux ; les agglos suivent, deux niveaux en retard. */
export function structure(im: GabaritImmeuble, poteaux: readonly (readonly [number, number])[], montes = im.niveaux): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  const { largeur: l, profondeur: p, centreZ: cz, hauteurNiveau: h } = im;
  b([0, .2, cz], [l + .6, .4, p + .6], '#B8B3A8');
  for (let n = 0; n < montes; n++) {
    const base = .4 + n * h;
    for (const [x, z] of poteaux) b([x, base + (h - .25) / 2, z], [.3, h - .25, .3], '#C9C4B8');
    b([0, base + h - .12, cz], [l + .4, .25, p + .4], '#BDB8AD');
    // Les agglos suivent la structure, deux niveaux en retard : murs pignons et façade arrière.
    if (n < montes - 2) {
      b([0, base + (h - .25) / 2, cz - p / 2 + .12], [l - .3, h - .25, .2], '#A8A49B');
      for (const x of [-l / 2 + .12, l / 2 - .12]) b([x, base + (h - .25) / 2, cz], [.2, h - .25, p - .3], '#A8A49B');
    }
  }
  return blocs;
}

/** Échafaudage de la façade sud : montants, planchers et garde-corps à chaque niveau. */
export const echafaudageAkwaba = () => echafaudage(IMMEUBLE);
export function echafaudage(im: GabaritImmeuble): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs);
  const { largeur: l, profondeur: p, centreZ: cz, niveaux, hauteurNiveau: h } = im, zFace = cz + p / 2;
  const hauteur = .4 + niveaux * h + 1;
  for (let i = 0; i <= 6; i++) for (const dz of [.45, 1.35]) b([-l / 2 + i * l / 6, hauteur / 2, zFace + dz], [.06, hauteur, .06], '#C8CDD0', 0, 'metal');
  for (let n = 1; n <= niveaux; n++) {
    const y = .4 + n * h - .12;
    b([0, y, zFace + .9], [l + .2, .06, .95], '#A87F52', 0, 'bois');
    for (const dy of [.5, 1]) b([0, y + dy, zFace + 1.38], [l + .2, .05, .05], '#E8B23A', 0, 'metal');
    b([0, y + .08, zFace + 1.38], [l + .2, .15, .03], '#E8B23A', 0, 'metal');
  }
  return blocs;
}

/** Muret de clôture de l'immeuble livré, ouvert au portail. */
export const muretAkwaba = () => muret(DEMI_LARGEUR, DEMI_PROFONDEUR);
export function muret(hx: number, hz: number): BlocArchitecture[] {
  const blocs: BlocArchitecture[] = [], b = ajouteur(blocs), portail = 1.6;
  b([0, .45, -hz], [hx * 2, .9, .25], '#E8DCC4');
  for (const x of [-hx, hx]) b([x, .45, 0], [.25, .9, hz * 2], '#E8DCC4');
  for (const s of [-1, 1]) { b([s * (hx + portail) / 2, .45, hz], [hx - portail, .9, .25], '#E8DCC4'); b([s * portail, .7, hz], [.5, 1.4, .5], '#D9C9A8'); }
  return blocs;
}
