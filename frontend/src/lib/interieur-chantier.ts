// Intérieur du Grand chantier : parcelle clôturée, base vie, stock, atelier de ferraillage, grue, ouvrage, et les postes
// où se font les tâches. Repère : centre de la parcelle, x vers l'est, z vers le sud (portail au sud). Testable sans Three.js.
import type { ZoneChantier } from './programme-chantier';

export type Point = [number, number];
export type StationChantier = ZoneChantier | 'yao';

export const PARCELLE = { demiLargeur: 16, demiProfondeur: 12 };
/** L'ouvrage est décalé vers le nord pour laisser la place à la base vie, au stock et au camion. */
export const DECALAGE_OUVRAGE = -2.5;
export const DEPART: Point = [0, 9.2];

/** La caméra regarde depuis le sud-sud-est : portes de la base vie et postes sont tournés vers elle, jamais cachés derrière un volume. */
export const STATIONS: Record<StationChantier, Point> = {
  vestiaire: [10.9, -6.6], bureau: [13.9, -6.6], yao: [8.9, -5.9],
  stockage: [-7.4, 7.3], ferraillage: [-9.2, -3.5], betonniere: [10, 1.3],
  implantation: [-8.1, 3.7], fouille: [-3.6, 3.9], 'entree-ouvrage': [0, 3.9], 'facade-sud': [3.6, 3.9],
  'facade-est': [9.3, -2.6], 'acces-etage': [7.8, 4], portail: [6.4, 8.4],
};

export const LIBELLES_STATIONS: Record<StationChantier, string> = {
  vestiaire: 'Vestiaire · EPI', bureau: 'Bureau de chantier', yao: 'Yao', stockage: 'Zone de stockage', ferraillage: 'Atelier de ferraillage',
  betonniere: 'Bétonnière', implantation: 'Chaises d’implantation', fouille: 'Fouilles', 'entree-ouvrage': 'Ouvrage', 'facade-sud': 'Façade sud',
  'facade-est': 'Façade est', 'acces-etage': 'Accès échafaudage', portail: 'Livraison',
};

export interface Obstacle { x: number; z: number; largeur: number; profondeur: number }
const zone = (x1: number, x2: number, z1: number, z2: number): Obstacle => ({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, largeur: x2 - x1, profondeur: z2 - z1 });

/** Emprises qu'on contourne : ouvrage et échafaudage, base vie, stock, atelier, grue, bétonnière, tas de déblais. */
export const OBSTACLES: readonly Obstacle[] = [
  zone(-6.6, 8.3, -7.6, 3.2),       // ouvrage, échafaudages sud et est
  zone(9.3, 15.6, -10.8, -7.6),     // base vie : vestiaire et bureau, portes au sud
  zone(14.4, 15.6, -2.4, -1.2),     // sanitaires
  zone(14.3, 15.7, -.6, 1),         // citerne
  zone(-14.6, -11.4, 6.8, 9.3),     // tas de sable
  zone(-11.1, -8.5, 8.1, 10.4),     // tas de gravier
  zone(-14.1, -12.3, 3.7, 5.1),     // palette de ciment bâchée
  zone(-10.9, -8.3, 4.9, 6.3),      // palettes d'agglos
  zone(-15.2, -9.9, 1.3, 2.3),      // bottes d'aciers sur chevrons
  zone(-13.9, -10.1, -4.2, -2.8),   // établi de ferraillage
  zone(-12.9, -10.1, -10.4, -7.6),  // pied de grue
  zone(9.2, 10.8, -1.2, .2),        // bétonnière
  zone(-4.8, -1.6, -9.8, -7.6),     // déblais, au nord, à distance du bord des fouilles
  zone(1.8, 5, -9.8, -7.6),
  zone(-7.9, -3.1, 9.9, 10.5),      // panneau de chantier
];

const LIMITE_X = PARCELLE.demiLargeur - .6, LIMITE_Z = PARCELLE.demiProfondeur - .6;

export function libre([x, z]: Point, marge = .3) {
  return Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= LIMITE_X && Math.abs(z) <= LIMITE_Z
    && !OBSTACLES.some(o => Math.abs(x - o.x) < o.largeur / 2 + marge && Math.abs(z - o.z) < o.profondeur / 2 + marge);
}

/** Pas de marche : on glisse le long d'un obstacle plutôt que de s'arrêter net. */
export function avancer([x, z]: Point, dx: number, dz: number, delta: number, vitesse = 3.4): Point {
  const longueur = Math.hypot(dx, dz);
  if (!longueur) return [x, z];
  const pas = Math.min(Math.max(delta, 0), .05) * vitesse, nx = x + dx / longueur * pas, nz = z + dz / longueur * pas;
  const suivant: Point = [libre([nx, z]) ? nx : x, z];
  if (libre([suivant[0], nz])) suivant[1] = nz;
  return suivant;
}

const PAS = .25;
/** Chemin sur une grille de 25 cm (parcours en largeur), sans le point de départ ; vide si la cible est inaccessible. */
export function chemin(depart: Point, cible: Point): Point[] {
  const cellule = ([x, z]: Point): Point => [Math.round(x / PAS), Math.round(z / PAS)];
  const cle = ([x, z]: Point) => `${x},${z}`;
  const debut = cellule(depart), fin = cellule(cible);
  if (!libre([fin[0] * PAS, fin[1] * PAS], .2)) return [];
  const parents = new Map<string, Point | null>([[cle(debut), null]]), file: Point[] = [debut];
  for (let i = 0; i < file.length; i++) {
    const courant = file[i];
    if (courant[0] === fin[0] && courant[1] === fin[1]) {
      const route: Point[] = [];
      for (let p: Point | null = courant; p && cle(p) !== cle(debut); p = parents.get(cle(p)) ?? null) route.unshift([p[0] * PAS, p[1] * PAS]);
      return lisser(depart, route);
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const voisin: Point = [courant[0] + dx, courant[1] + dz];
      if (parents.has(cle(voisin)) || !libre([voisin[0] * PAS, voisin[1] * PAS], .2)) continue;
      // En diagonale, on ne coupe pas l'angle d'un obstacle.
      if (dx && dz && (!libre([(courant[0] + dx) * PAS, courant[1] * PAS], .2) || !libre([courant[0] * PAS, (courant[1] + dz) * PAS], .2))) continue;
      parents.set(cle(voisin), courant); file.push(voisin);
    }
  }
  return [];
}

/** Retire les points intermédiaires quand la ligne droite est libre : la marche reste naturelle. */
function lisser(depart: Point, route: Point[]): Point[] {
  if (route.length < 3) return route;
  const resultat: Point[] = [];
  let origine = depart, i = 0;
  while (i < route.length) {
    let j = route.length - 1;
    while (j > i && !ligneLibre(origine, route[j])) j--;
    resultat.push(route[j]); origine = route[j]; i = j + 1;
  }
  return resultat;
}

function ligneLibre(a: Point, b: Point) {
  const etapes = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .2);
  for (let k = 1; k <= etapes; k++) if (!libre([a[0] + (b[0] - a[0]) * k / etapes, a[1] + (b[1] - a[1]) * k / etapes], .2)) return false;
  return true;
}
