// Se déplacer dans le quartier comme à Abidjan : à pied (gratuit, mais long), en gbaka (le minibus collectif, au forfait,
// depuis l'arrêt le plus proche) ou en taxi compteur (il vient te chercher, au kilomètre, plus cher sous la pluie).
// Le jeu est plus petit que la ville réelle : un mètre du jeu vaut 25 m d'Abidjan pour les prix et les durées.
// Sans React : le téléphone l'affiche, le serveur recalcule le même prix (backend/src/carriere/transport.service.ts).

export type ModeTransport = 'pied' | 'gbaka' | 'taxi';
export type Point = readonly [number, number];

export const ECHELLE_DISTANCES = 25;
/** Vitesse de marche du personnage, en mètres du jeu par minute de jeu (une seconde réelle à vitesse 1). */
export const MARCHE_PAR_MINUTE = 4.5;
export const TARIFS = {
  gbaka: { forfait: 200, longTrajetKm: 4, supplement: 100, vitesseKmH: 16, attenteMin: 6 },
  taxi: { priseEnCharge: 300, parKm: 250, vitesseKmH: 24, attenteMin: 3, majorationPluie: 1.5 },
} as const;
/** Les arrêts où le gbaka prend ses passagers : la gare des gbakas et les abris de bus. */
export const ARRETS_GBAKA: readonly Point[] = [[-108, -61], [-30, -61], [30, -61], [-27, -6.2], [27, 6.2]];

/** Distance par les rues (quadrillage), en mètres du jeu. */
export const distanceRues = (a: Point, b: Point) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const arrondi50 = (n: number) => Math.round(n / 50) * 50;

export const arretLePlusProche = (p: Point) => ARRETS_GBAKA.reduce((m, a) => distanceRues(p, a) < distanceRues(p, m) ? a : m, ARRETS_GBAKA[0]);

/** Prix d'une course au serveur et au téléphone : la distance (mètres du jeu) suffit. */
export function prixTrajet(mode: ModeTransport, distance: number, pluie = false) {
  if (mode === 'pied') return 0;
  const km = Math.max(0, distance) * ECHELLE_DISTANCES / 1000;
  if (mode === 'gbaka') return TARIFS.gbaka.forfait + (km > TARIFS.gbaka.longTrajetKm ? TARIFS.gbaka.supplement : 0);
  return arrondi50((TARIFS.taxi.priseEnCharge + km * TARIFS.taxi.parKm) * (pluie ? TARIFS.taxi.majorationPluie : 1));
}

export interface Trajet { mode: ModeTransport; distance: number; km: number; minutes: number; prix: number; marche: number }

/** Durée (minutes de jeu), prix et marche à pied d'un trajet. En gbaka, on marche jusqu'à l'arrêt, puis depuis celui d'arrivée. */
export function trajet(mode: ModeTransport, depart: Point, arrivee: Point, pluie = false): Trajet {
  const distance = distanceRues(depart, arrivee), km = distance * ECHELLE_DISTANCES / 1000;
  if (mode === 'pied') return { mode, distance, km, minutes: Math.round(distance / MARCHE_PAR_MINUTE), prix: 0, marche: distance };
  if (mode === 'taxi') {
    const roulage = km / TARIFS.taxi.vitesseKmH * 60 * (pluie ? 1.3 : 1);
    return { mode, distance, km, minutes: Math.round(TARIFS.taxi.attenteMin + roulage), prix: prixTrajet('taxi', distance, pluie), marche: 0 };
  }
  const montee = arretLePlusProche(depart), descente = arretLePlusProche(arrivee);
  const marche = distanceRues(depart, montee) + distanceRues(descente, arrivee);
  const roulage = distanceRues(montee, descente) * ECHELLE_DISTANCES / 1000 / TARIFS.gbaka.vitesseKmH * 60;
  return { mode, distance, km, minutes: Math.round(marche / MARCHE_PAR_MINUTE + TARIFS.gbaka.attenteMin + roulage), prix: prixTrajet('gbaka', distance), marche };
}

/** Le trajet vaut-il la peine d'un véhicule ? Sous 40 m, on y va à pied. */
export const trajetMotorise = (depart: Point, arrivee: Point) => distanceRues(depart, arrivee) >= 40;

export const LIBELLES_MODES: Record<ModeTransport, string> = { pied: 'À pied', gbaka: 'Gbaka', taxi: 'Taxi compteur' };
export const minutesLisibles = (m: number) => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
