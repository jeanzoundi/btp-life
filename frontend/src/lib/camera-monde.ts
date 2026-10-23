/** Vue d'ensemble de BTP Life : de trois quarts, légèrement tournée pour lire deux façades à la fois,
 * comme le regard d'un chef de chantier posté en hauteur. Elle reste du côté sud, celui des portes. */
export const AZIMUT_VUE = 32 * Math.PI / 180;
export const INCLINAISON_VUE = 42 * Math.PI / 180;

/** Assez près pour voir les personnages, et en portrait on recule pour garder la rue lisible en largeur. */
export function distanceVue(aspect: number) {
  if (!Number.isFinite(aspect) || aspect <= 0) return 24;
  return aspect >= 1 ? 24 : Math.min(46, 24 / Math.pow(aspect, .8));
}

/** Position de la caméra relative au joueur. */
export function decalageVue(aspect: number): [number, number, number] {
  const distance = distanceVue(aspect);
  const horizontal = distance * Math.cos(INCLINAISON_VUE);
  return [horizontal * Math.sin(AZIMUT_VUE), distance * Math.sin(INCLINAISON_VUE), horizontal * Math.cos(AZIMUT_VUE)];
}
