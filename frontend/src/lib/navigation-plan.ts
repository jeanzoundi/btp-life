// Marche dans un intérieur vu de dessus : emprises rectangulaires à contourner, pas de glissement le long des murs,
// et chemin le plus court sur une grille fine. Commun au chantier et aux lieux à programme. Testable sans Three.js.

export type Point = [number, number];
export interface Obstacle { x: number; z: number; largeur: number; profondeur: number }
/** Place assise (à table, en amphi) : le personnage s'y pose, tourné selon `rotation`, et n'en bouge plus jusqu'à ce qu'on la libère. */
export interface Assise { position: Point; rotation: number }
export interface PlanNavigable { demiLargeur: number; demiProfondeur: number; obstacles: readonly Obstacle[] }

/** Emprise rectangulaire donnée par ses bords. */
export const zone = (x1: number, x2: number, z1: number, z2: number): Obstacle => ({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, largeur: x2 - x1, profondeur: z2 - z1 });

const PAS = .25;

export function creerNavigation({ demiLargeur, demiProfondeur, obstacles }: PlanNavigable) {
  const limiteX = demiLargeur - .6, limiteZ = demiProfondeur - .6;
  const libre = ([x, z]: Point, marge = .3) => Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= limiteX && Math.abs(z) <= limiteZ
    && !obstacles.some(o => Math.abs(x - o.x) < o.largeur / 2 + marge && Math.abs(z - o.z) < o.profondeur / 2 + marge);

  /** Pas de marche : on glisse le long d'un obstacle plutôt que de s'arrêter net. */
  const avancer = ([x, z]: Point, dx: number, dz: number, delta: number, vitesse = 3.4): Point => {
    const longueur = Math.hypot(dx, dz);
    if (!longueur) return [x, z];
    const pas = Math.min(Math.max(delta, 0), .05) * vitesse, nx = x + dx / longueur * pas, nz = z + dz / longueur * pas;
    const suivant: Point = [libre([nx, z]) ? nx : x, z];
    if (libre([suivant[0], nz])) suivant[1] = nz;
    return suivant;
  };

  const ligneLibre = (a: Point, b: Point) => {
    const etapes = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .2);
    for (let k = 1; k <= etapes; k++) if (!libre([a[0] + (b[0] - a[0]) * k / etapes, a[1] + (b[1] - a[1]) * k / etapes], .2)) return false;
    return true;
  };

  /** Retire les points intermédiaires quand la ligne droite est libre : la marche reste naturelle. */
  const lisser = (depart: Point, route: Point[]): Point[] => {
    if (route.length < 3) return route;
    const resultat: Point[] = [];
    let origine = depart, i = 0;
    while (i < route.length) {
      let j = route.length - 1;
      while (j > i && !ligneLibre(origine, route[j])) j--;
      resultat.push(route[j]); origine = route[j]; i = j + 1;
    }
    return resultat;
  };

  /** Chemin sur une grille de 25 cm (parcours en largeur), sans le point de départ ; vide si la cible est inaccessible. */
  const chemin = (depart: Point, cible: Point): Point[] => {
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
  };

  return { libre, avancer, chemin };
}
