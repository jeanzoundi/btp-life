import { CAMPAGNE, PARCELLE_AKWABA } from './campagne';
import { LIEUX_MONDE } from './liens-modes';

// Les bâtiments de la ville et les repères à découvrir : des données pures, partagées par la scène 3D, la minicarte, les
// obstacles du décor (decor-ville.ts) et leurs tests.

export type PointMonde = [number, number];

export interface Batiment3D {
  slug: string; nom: string; href: string;
  position: [number, number, number]; taille: [number, number, number]; couleur: string;
  type: 'tour' | 'campus' | 'maison' | 'chantier' | 'commerce';
}

export const BATIMENTS: Batiment3D[] = [
  { slug: 'universite', ...LIEUX_MONDE['universite'], position: [-29, 4, -23], taille: [17, 8, 12], couleur: '#d8c092', type: 'campus' },
  { slug: 'entreprise', ...LIEUX_MONDE['entreprise'], position: [29, 9, -24], taille: [13, 18, 11], couleur: '#53677a', type: 'tour' },
  { slug: 'chantier', ...LIEUX_MONDE['chantier'], position: [31, 2, 22], taille: [21, 4, 15], couleur: '#d97706', type: 'chantier' },
  { slug: 'residence', ...LIEUX_MONDE['residence'], position: [-31, 4, 22], taille: [15, 8, 12], couleur: '#b45309', type: 'maison' },
  { slug: 'maquis', ...LIEUX_MONDE['maquis'], position: [-11, 2.3, 31], taille: [10, 4.6, 8], couleur: '#be563c', type: 'commerce' },
  { slug: 'cafe', ...LIEUX_MONDE['cafe'], position: [10, 2.3, -34], taille: [10, 4.6, 8], couleur: '#6b7a3f', type: 'commerce' },
  { slug: 'banque', ...LIEUX_MONDE['banque'], position: [-41, 4, -1], taille: [12, 8, 10], couleur: '#d6bd75', type: 'campus' },
  { slug: 'fournisseur', ...LIEUX_MONDE['fournisseur'], position: [42, 3.5, -1], taille: [14, 7, 11], couleur: '#8e785e', type: 'commerce' },
  { slug: 'mairie', ...LIEUX_MONDE['mairie'], position: [-26, 4.5, -91], taille: [18, 9, 13], couleur: '#d8ccb2', type: 'campus' },
  { slug: 'laboratoire', ...LIEUX_MONDE['laboratoire'], position: [28, 3, -91], taille: [16, 6, 12], couleur: '#98b8ae', type: 'campus' },
  { slug: 'bureau-etudes', ...LIEUX_MONDE['bureau-etudes'], position: [0, 6, -114], taille: [16, 12, 10], couleur: '#6e8e99', type: 'tour' },
  { slug: 'jardins-residence', ...LIEUX_MONDE['jardins-residence'], position: [-88, 3, -33], taille: [14, 6, 12], couleur: '#d7b58b', type: 'maison' },
  { slug: 'marche', ...LIEUX_MONDE['marche'], position: [-88, 2, -58], taille: [16, 4, 10], couleur: '#b65d45', type: 'commerce' },
  { slug: 'atelier', ...LIEUX_MONDE['atelier'], position: [87, 3, -33], taille: [18, 6, 12], couleur: '#b1aa82', type: 'campus' },
  { slug: 'logistique', ...LIEUX_MONDE['logistique'], position: [88, 3, -54], taille: [22, 6, 14], couleur: '#788d99', type: 'campus' },
  { slug: 'agence', ...LIEUX_MONDE['agence'], position: [-88, 4.5, -88], taille: [14, 9, 12], couleur: '#a2b5a1', type: 'tour' },
  { slug: 'construction-nord', ...LIEUX_MONDE['construction-nord'], position: [87, 2, -88], taille: [20, 4, 16], couleur: '#c39b64', type: 'chantier' },
  { slug: 'centre-azur', ...LIEUX_MONDE['centre-azur'], position: [-84, 5, 24], taille: [28, 10, 18], couleur: '#88aeb2', type: 'commerce' },
  { slug: 'galerie-palmiers', ...LIEUX_MONDE['galerie-palmiers'], position: [84, 4, 25], taille: [26, 8, 18], couleur: '#c0936f', type: 'commerce' },
  { slug: 'marina', ...LIEUX_MONDE['marina'], position: [89, 2.5, 55], taille: [18, 5, 10], couleur: '#4b858c', type: 'commerce' },
  { slug: 'sports', ...LIEUX_MONDE['sports'], position: [-89, 3, 55], taille: [20, 6, 10], couleur: '#6f8f55', type: 'campus' },
];

/** La parcelle du fil rouge, traitée comme un lieu pour y aller (porte côté avenue) ; on n'y entre pas, on y retrouve Mme Touré. */
export const PARCELLE_BATIMENT: Batiment3D = {
  slug: PARCELLE_AKWABA.slug, nom: CAMPAGNE.nom, href: '', position: [PARCELLE_AKWABA.x, 1, PARCELLE_AKWABA.z],
  taille: [PARCELLE_AKWABA.largeur, 2, PARCELLE_AKWABA.profondeur], couleur: '#A88C66', type: 'chantier',
};
/** La minicarte montre la parcelle avec les lieux, et la touche y envoie le joueur. */
export const BATIMENTS_CARTE = [...BATIMENTS, PARCELLE_BATIMENT];

/** Les repères à découvrir : on les découvre en s'en approchant à `rayon` mètres (plus loin pour la fontaine, dont le
 * bassin fait 9 m de large et qu'on ne traverse pas). */
export const POINTS_DECOUVERTE: { id: string; nom: string; position: PointMonde; rayon: number }[] = [
  { id: 'fontaine-plateau', nom: 'Fontaine du Plateau', position: [0, -52], rayon: 8 },
  { id: 'promenade-lagune', nom: 'Promenade de la Lagune', position: [0, 47], rayon: 6 },
  { id: 'marche-jardins', nom: 'Marché des Jardins', position: [-88, 11], rayon: 6 },
  { id: 'marina', nom: 'Marina BTP Life', position: [89, 47], rayon: 6 },
  { id: 'campus-batisseurs', nom: 'Campus des Bâtisseurs', position: [87, -24], rayon: 6 },
  { id: 'plage-sables', nom: 'Plage des Sables', position: [-25, 58], rayon: 6 },
];
