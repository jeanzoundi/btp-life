// Les gestes du chantier, joués à la main dans la journée avec Yao : tracer l'implantation au cordeau, mesurer au mètre
// ruban, placer une cage d'armatures à l'enrobage, contrôler un aplomb au niveau, corriger un défaut à la réception. Chaque
// journée d'une étape en propose un, tiré de son jour : la même journée donne le même geste, au jeu comme au serveur, qui
// le corrige à partir de la valeur brute (le corrigé contient la valeur juste et la tolérance). Sans React.
import type { IdEtape } from './programme-chantier';

export type TypeGeste = 'mesurer' | 'tracer' | 'controler' | 'placer' | 'corriger';
export interface GesteChantier {
  id: string; type: TypeGeste; titre: string; consigne: string; unite: string;
  /** La valeur juste et l'écart toléré, dans l'unité du geste. */
  attendu: number; tolerance: number;
  /** Mesurer : l'objet et sa longueur réelle (m). */
  mesure?: { objet: string; longueur: number };
  /** Tracer : deux chaises d'implantation dans un carré de 10 m ; on tend le cordeau de A vers B (angle en degrés). */
  trace?: { a: [number, number]; b: [number, number] };
  /** Contrôler : ce qu'on met d'aplomb ou de niveau ; l'écart à rattraper (mm) est la valeur juste. */
  aplomb?: { objet: string };
  /** Placer : l'élément et son exposition, qui fixent l'enrobage à respecter (cm). */
  placement?: { element: string; exposition: string };
  /** Corriger : les points vérifiés, dont un seul est faux (son rang est la valeur juste). */
  defauts?: { libelle: string; detail: string }[];
}

const GESTES_ETAPES: Partial<Record<IdEtape, TypeGeste>> = {
  implantation: 'tracer', fouilles: 'mesurer', semelles: 'placer', soubassement: 'controler', elevation: 'controler',
  dalle: 'mesurer', etage: 'placer', toiture: 'controler', finitions: 'corriger', reception: 'corriger',
};

/** Un tirage reproductible, propre à la journée et au paramètre. */
const tirage = (numero: number, k: number) => { const s = Math.sin((numero + 1) * 91.73 + k * 17.31) * 43758.5453; return s - Math.floor(s); };
const pas = (v: number, p: number) => Math.round(v / p) * p;

const EXPOSITIONS = [
  { element: 'Semelle de fondation', exposition: 'coulée contre le sol', enrobage: 5 },
  { element: 'Poteau de l’étage', exposition: 'intérieur, à l’abri', enrobage: 3 },
  { element: 'Poutre de façade', exposition: 'exposée aux pluies', enrobage: 4 },
];
/** Points de contrôle à la réception : la valeur juste, puis la valeur fautive qu'on peut rencontrer. */
const POINTS_CONTROLE = [
  { libelle: 'Garde-corps de l’escalier', juste: 'hauteur 1,00 m', faux: 'hauteur 0,80 m : trop bas, il faut au moins 1 m' },
  { libelle: 'Pente du sol de la douche', juste: 'pente de 2 %', faux: 'pente nulle : l’eau stagne' },
  { libelle: 'Marches de l’escalier', juste: 'hauteur 17 cm, régulières', faux: 'hauteurs de 15 à 21 cm : irrégulières' },
  { libelle: 'Prise de la salle d’eau', juste: 'hors du volume de la douche', faux: 'au-dessus du bac à douche' },
  { libelle: 'Descente d’eau pluviale', juste: 'raccordée au caniveau', faux: 'déverse au pied du mur' },
];

/** Le geste de la journée de ce jour du programme, ou rien (le recrutement n'en a pas). */
export function gesteDuJour(numero: number, etape: IdEtape): GesteChantier | null {
  const type = GESTES_ETAPES[etape];
  if (!type) return null;
  const id = `geste-${numero}`;
  if (type === 'tracer') {
    const a: [number, number] = [pas(1 + tirage(numero, 1) * 2, .5), pas(1 + tirage(numero, 2) * 2, .5)];
    const b: [number, number] = [pas(6 + tirage(numero, 3) * 3, .5), pas(4 + tirage(numero, 4) * 5, .5)];
    return { id, type, titre: 'Tracer l’axe du mur', consigne: 'Tends le cordeau de la chaise A jusqu’à la chaise B : c’est l’axe du premier mur.', unite: '°',
      attendu: pas(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, .1), tolerance: 1.5, trace: { a, b } };
  }
  if (type === 'mesurer') {
    const fouille = etape === 'fouilles';
    const longueur = fouille ? pas(.6 + tirage(numero, 1) * .6, .01) : pas(3.2 + tirage(numero, 1) * 2.2, .01);
    return { id, type, titre: fouille ? 'Mesurer la largeur de la fouille' : 'Mesurer la portée de la dalle',
      consigne: fouille ? 'Déroule le mètre ruban d’un bord à l’autre de la fouille, puis relève la mesure.' : 'Déroule le mètre ruban d’un appui à l’autre, puis relève la portée.',
      unite: 'm', attendu: longueur, tolerance: fouille ? .02 : .03, mesure: { objet: fouille ? 'Fouille de semelle' : 'Dalle entre deux poutres', longueur } };
  }
  if (type === 'placer') {
    const choix = etape === 'semelles' ? EXPOSITIONS[0] : EXPOSITIONS[1 + Math.floor(tirage(numero, 1) * 2)];
    return { id, type, titre: 'Placer la cage d’armatures', consigne: `${choix.element}, ${choix.exposition} : fais glisser la cage dans le coffrage, à l’enrobage réglementaire.`,
      unite: 'cm', attendu: choix.enrobage, tolerance: .5, placement: { element: choix.element, exposition: choix.exposition } };
  }
  if (type === 'controler') {
    const ecart = pas((tirage(numero, 1) < .5 ? -1 : 1) * (6 + tirage(numero, 2) * 18), 1);
    const objet = etape === 'elevation' ? 'Aplomb du mur' : etape === 'toiture' ? 'Niveau de l’acrotère' : 'Niveau de l’arase';
    return { id, type, titre: `Contrôler : ${objet.toLowerCase()}`, consigne: 'Pose le niveau, puis règle la cale jusqu’à centrer la bulle : la cale rattrape l’écart.',
      unite: 'mm', attendu: ecart, tolerance: 2, aplomb: { objet } };
  }
  const faux = Math.floor(tirage(numero, 1) * 4);
  const debut = Math.floor(tirage(numero, 2) * POINTS_CONTROLE.length);
  const points = Array.from({ length: 4 }, (_, i) => POINTS_CONTROLE[(debut + i) % POINTS_CONTROLE.length]);
  return { id, type, titre: etape === 'reception' ? 'Corriger avant la réception' : 'Corriger une finition', consigne: 'Un seul de ces points n’est pas conforme : touche-le pour le faire reprendre.',
    unite: '', attendu: faux, tolerance: 0, defauts: points.map((p, i) => ({ libelle: p.libelle, detail: i === faux ? p.faux : p.juste })) };
}

/** Le geste est-il réussi ? La valeur relevée tombe dans la tolérance de la valeur juste. */
export const gesteReussi = (g: Pick<GesteChantier, 'attendu' | 'tolerance'>, valeur: number | undefined) =>
  typeof valeur === 'number' && Number.isFinite(valeur) && Math.abs(valeur - g.attendu) <= g.tolerance + 1e-9;
