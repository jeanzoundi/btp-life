/** Vue d'ensemble de BTP Life : de trois quarts, légèrement tournée pour lire deux façades à la fois,
 * comme le regard d'un chef de chantier posté en hauteur. Elle reste du côté sud, celui des portes. */
export const AZIMUT_VUE = 32 * Math.PI / 180;
export const INCLINAISON_VUE = 42 * Math.PI / 180;

/** Assez près pour voir les personnages, et en portrait on recule pour garder la rue lisible en largeur. */
export function distanceVue(aspect: number) {
  if (!Number.isFinite(aspect) || aspect <= 0) return 24;
  return aspect >= 1 ? 24 : Math.min(46, 24 / Math.pow(aspect, .8));
}

/** Les bornes du zoom de la vue d'ensemble : au plus près les façades, au plus loin le plan du quartier. */
export const DISTANCE_PROCHE = 14;
export const DISTANCE_LOIN = 60;

/** L'inclinaison suit le zoom : basse de près (30°) pour lire les façades et les personnages, 42° à la distance habituelle,
 * plongeante de loin (58°) pour lire les rues comme un plan. */
export function inclinaisonPourDistance(distance: number) {
  const d = Math.min(DISTANCE_LOIN, Math.max(DISTANCE_PROCHE, Number.isFinite(distance) ? distance : 24));
  const degres = d <= 24 ? 30 + (d - DISTANCE_PROCHE) / (24 - DISTANCE_PROCHE) * 12 : 42 + (d - 24) / (DISTANCE_LOIN - 24) * 16;
  return degres * Math.PI / 180;
}

/** Demi-largeur du cadre des ombres du soleil : serré de près pour des ombres nettes, large de loin pour qu'elles ne
 * s'arrêtent pas au milieu de l'image. */
export function demiCadreOmbres(distance: number) {
  return Math.min(90, Math.max(32, (Number.isFinite(distance) ? distance : 24) * 1.7));
}

/** Position de la caméra relative au joueur. */
export function decalageVue(aspect: number): [number, number, number] {
  const distance = distanceVue(aspect);
  const inclinaison = inclinaisonPourDistance(distance);
  const horizontal = distance * Math.cos(inclinaison);
  return [horizontal * Math.sin(AZIMUT_VUE), distance * Math.sin(inclinaison), horizontal * Math.cos(AZIMUT_VUE)];
}
