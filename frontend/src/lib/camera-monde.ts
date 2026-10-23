/** Inclinaison de la vue plongeante : assez raide pour lire la rue comme un plan, assez basse pour voir les devantures. */
export const INCLINAISON_PLONGEE = 58 * Math.PI / 180;

/** En portrait, on recule pour garder environ vingt mètres de rue en largeur. */
export function distancePlongee(aspect: number) {
  if (!Number.isFinite(aspect) || aspect <= 0) return 32;
  return aspect >= 1 ? 32 : Math.min(64, 32 / Math.pow(aspect, .85));
}

/** Position de la caméra relative au joueur : face au nord, sans rotation, comme une maquette posée sur la table. */
export function decalagePlongee(aspect: number): [number, number, number] {
  const distance = distancePlongee(aspect);
  return [0, distance * Math.sin(INCLINAISON_PLONGEE), distance * Math.cos(INCLINAISON_PLONGEE)];
}
