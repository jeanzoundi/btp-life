/** Fichiers des ressources 3D du quartier, préparés pour le web par scripts/ressources-3d/alleger-ressources.cjs. */

export const MATIERES_MONDE = ['concrete_floor', 'wood_floor', 'asphalt_02', 'painted_plaster_wall', 'brick_pavement_02', 'clay_roof_tiles_02', 'corrugated_iron'] as const;
export type MatiereMonde = (typeof MATIERES_MONDE)[number];
export type CartePBR = 'color' | 'normal' | 'rough';

let legeres: boolean | undefined;

/** Téléphone, tablette ou petite fenêtre (même critère que le niveau d'effets de fluidite-monde.tsx) : textures de 512 px
 * au lieu de 1024 et personnages aux textures de 512 px au plus. Sur données mobiles, c'est le gros du téléchargement, et
 * quatre fois moins de mémoire graphique, pour un détail que l'écran ne montrerait pas. Décidé une fois par visite :
 * tourner le téléphone ne doit pas tout retélécharger. */
export function ressourcesLegeres() {
  if (legeres === undefined) legeres = typeof window !== 'undefined' && (window.innerWidth < 768 || Boolean(window.matchMedia?.('(pointer: coarse)').matches));
  return legeres;
}

/** Textures photographiques en WebP : 1024 px, ou 512 px en version légère. */
export const cheminTexture = (matiere: MatiereMonde, carte: CartePBR, legere = ressourcesLegeres()) =>
  `/materials/${matiere}-${carte}${legere ? '-512' : ''}.webp`;

export const cheminPersonnage = (modele: string, legere = ressourcesLegeres()) => `/personnages/${modele}${legere ? '-512' : ''}.glb`;

/** Atlas des devantures, en une seule taille (1254 px) : les vitrines se regardent de près depuis la rue. */
export const ATLAS_DEVANTURES = '/materials/facades-abidjan-v1.webp';

/** Ciel HDR en carte de gain (image, carte de gain, métadonnées), recomposé par ciel-carte-de-gain.ts : 260 Ko au lieu
 * des 1,4 Mo du .hdr, pour le même éclairage. */
export const FICHIERS_CIEL = ['/materials/ciel-kloofendal-1k.jpg', '/materials/ciel-kloofendal-1k-gain.jpg', '/materials/ciel-kloofendal-1k.json'];
