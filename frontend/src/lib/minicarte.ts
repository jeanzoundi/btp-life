// Géométrie de la minicarte et du cap d'objectif. Le monde est en mètres (x vers l'est, z vers le sud) ;
// la minicarte est centrée sur le joueur et tournée pour que son haut corresponde au regard de la caméra.

export type Point2 = [number, number];

/** Rayon de ville visible autour du joueur sur la minicarte, en mètres. */
export const RAYON_MINICARTE = 58;

export function distance(a: Point2, b: Point2) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Azimut de la caméra autour de sa cible : 0 quand la caméra est au sud et regarde vers le nord. */
export function azimutCamera(camera: Point2, cible: Point2) {
  return Math.atan2(camera[0] - cible[0], camera[1] - cible[1]);
}

/** Direction d'une cible vue depuis le joueur, en radians dans le sens horaire depuis le haut de l'écran. */
export function angleEcran(joueur: Point2, cible: Point2, azimut: number) {
  const dx = cible[0] - joueur[0], dz = cible[1] - joueur[1];
  const avant = -dx * Math.sin(azimut) - dz * Math.cos(azimut);
  const droite = dx * Math.cos(azimut) - dz * Math.sin(azimut);
  return Math.atan2(droite, avant);
}

/** Point de la minicarte (pixels relatifs au centre, y vers le bas) vers le monde. */
export function mondeDepuisCarte(x: number, y: number, joueur: Point2, azimut: number, echelle: number): Point2 {
  const avant = -y / echelle, droite = x / echelle;
  return [
    joueur[0] + droite * Math.cos(azimut) - avant * Math.sin(azimut),
    joueur[1] - droite * Math.sin(azimut) - avant * Math.cos(azimut),
  ];
}

/** Monde vers la minicarte : l'inverse exact de `mondeDepuisCarte`. */
export function carteDepuisMonde(point: Point2, joueur: Point2, azimut: number, echelle: number): Point2 {
  const dx = point[0] - joueur[0], dz = point[1] - joueur[1];
  return [(dx * Math.cos(azimut) - dz * Math.sin(azimut)) * echelle, (dx * Math.sin(azimut) + dz * Math.cos(azimut)) * echelle];
}

/** Transformation SVG qui pose le monde (x, z) sur la minicarte centrée sur le joueur. */
export function transformationCarte(joueur: Point2, azimut: number, echelle: number, centre: number) {
  return `translate(${centre} ${centre}) scale(${echelle}) rotate(${azimut * 180 / Math.PI}) translate(${-joueur[0]} ${-joueur[1]})`;
}

/** Porte d'un bâtiment, côté façade sud : c'est là que le joueur arrive. */
export function porteBatiment(position: readonly [number, number, number], taille: readonly [number, number, number], limites: { minZ: number; maxZ: number }): Point2 {
  return [position[0], Math.min(limites.maxZ, Math.max(limites.minZ, position[2] + taille[2] / 2 + 2))];
}

/** Bâtiment dont l'emprise contient le point, avec une marge de tolérance au doigt. */
export function batimentSous<T extends { position: readonly [number, number, number]; taille: readonly [number, number, number] }>(point: Point2, batiments: readonly T[], marge = 2): T | undefined {
  return batiments.find(b => Math.abs(point[0] - b.position[0]) <= b.taille[0] / 2 + marge && Math.abs(point[1] - b.position[2]) <= b.taille[2] / 2 + marge);
}

/** Distance lisible : « 40 m », « 120 m », « 1,2 km ». Formatée à la main : appelée dix fois par seconde, sans dépendre d'Intl. */
export function distanceLisible(metres: number) {
  if (metres >= 1000) return `${String(Math.round(metres / 100) / 10).replace('.', ',')} km`;
  return `${Math.max(1, Math.round(metres / 5) * 5)} m`;
}
