// La circulation des rues : chaque véhicule roule sur une boucle (sa voie), s'arrête au feu rouge sans dépasser la ligne,
// et garde ses distances avec celui qui le précède. Sans Three.js : la ville l'appelle à chaque image, les tests le vérifient.

/** Une voie en boucle : les positions vont de `debut` à `debut + longueur`, puis reprennent au début (hors de vue). */
export interface Circuit { debut: number; longueur: number }
export type Sens = 1 | -1;

/** Ramène une position sur la boucle. */
export const boucler = (x: number, c: Circuit) => ((x - c.debut) % c.longueur + c.longueur) % c.longueur + c.debut;

/** Distance de `a` à `b` dans le sens de circulation, sur la boucle (toujours positive ou nulle). */
export const ecartDevant = (a: number, b: number, sens: Sens, c: Circuit) => (((b - a) * sens) % c.longueur + c.longueur) % c.longueur;

/** Au-delà, une ligne d'arrêt ou un véhicule ne compte pas encore : il est trop loin devant (ou déjà derrière). */
const HORIZON = 40;

/** Distance libre devant le nez d'un véhicule : jusqu'à la ligne d'arrêt quand le feu est rouge, ou jusqu'à l'arrière du
 * véhicule qui le précède, moins une marge de sécurité. `contrainte` dit s'il faut freiner vers cette distance. */
export function distanceLibre({ position, longueur, sens, circuit, stops, rouge, autres, marge = 1.6 }: {
  position: number; longueur: number; sens: Sens; circuit: Circuit;
  /** Lignes d'arrêt des feux de cette voie. */
  stops: readonly number[]; rouge: boolean;
  /** Les autres véhicules de la voie : leur centre et leur longueur. */
  autres: readonly { position: number; longueur: number }[];
  marge?: number;
}) {
  const nez = position + sens * longueur / 2;
  let distance = Infinity;
  if (rouge) for (const s of stops) { const e = ecartDevant(nez, s, sens, circuit); if (e <= HORIZON) distance = Math.min(distance, e); }
  for (const a of autres) {
    const e = ecartDevant(nez, a.position - sens * a.longueur / 2, sens, circuit);
    if (e <= HORIZON) distance = Math.min(distance, Math.max(0, e - marge));
  }
  return { distance, contrainte: Number.isFinite(distance) };
}

/** Un arrêt de bus : le bus s'y immobilise le temps de la montée, une fois par passage. */
export function aLArret(position: number, arrets: readonly number[], tolerance = .6) {
  return arrets.some(a => Math.abs(position - a) <= tolerance);
}
