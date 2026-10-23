import type { PointInterieur } from './navigation-interieur';

export type ObstacleResidence = { x: number; z: number; largeur: number; profondeur: number };
// One unit is one metre. Rendering and collision detection share these footprints.
export const PLAN_RESIDENCE = {
  lit: { x: -3.5, z: -3, largeur: 2, profondeur: 2.4 },
  canape: { x: -3.65, z: 2, largeur: 2.7, profondeur: 1 },
  table: { x: -3.65, z: 3.3, largeur: 1.5, profondeur: .65 },
  tele: { x: -3.65, z: 4.25, largeur: 1.6, profondeur: .45 },
  cuisine: { x: 4.9, z: 2, largeur: 1.2, profondeur: 4 },
  repas: { x: 2.5, z: 2.6, largeur: 1, profondeur: 1.5 },
  douche: { x: 4.65, z: -3.6, largeur: 1.5, profondeur: 1.5 },
  vasque: { x: 2.7, z: -4.2, largeur: 1.4, profondeur: .6 },
  cloisonGauche: { x: -3.8, z: -.7, largeur: 3.8, profondeur: .15 },
  cloisonDroite: { x: 3.8, z: -.7, largeur: 3.8, profondeur: .15 },
  separation: { x: 0, z: -3.3, largeur: .15, profondeur: 2.8 },
} satisfies Record<string, ObstacleResidence>;

export const POINTS_RESIDENCE = [
  { id: 'salon', label: 'Salon', detail: 'Canapé en tissu, table basse et bibliothèque', x: -1.5, z: 2 },
  { id: 'chambre', label: 'Chambre', detail: 'Lit double, linge et éclairage de chevet', x: -1.6, z: -2.8 },
  { id: 'cuisine', label: 'Cuisine', detail: 'Plan de travail, évier et plaques de cuisson', x: 3.8, z: .7 },
  { id: 'bain', label: 'Salle d’eau', detail: 'Douche vitrée, vasque et carrelage', x: 2.8, z: -2.8 },
] as const;

export function residenceLibre({ x, z }: PointInterieur): boolean {
  return Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 5.4 && Math.abs(z) <= 4.4 &&
    !Object.values(PLAN_RESIDENCE).some(o => Math.abs(x - o.x) < o.largeur / 2 + .24 && Math.abs(z - o.z) < o.profondeur / 2 + .24);
}

export function avancerResidence(p: PointInterieur, dx: number, dz: number, delta: number): PointInterieur {
  const longueur = Math.hypot(dx, dz);
  if (!longueur) return p;
  const distance = Math.min(Math.max(delta, 0), .05) * 2.1;
  const x = p.x + dx / longueur * distance;
  const z = p.z + dz / longueur * distance;
  const suivant = { x: residenceLibre({ x, z: p.z }) ? x : p.x, z: p.z };
  if (residenceLibre({ x: suivant.x, z })) suivant.z = z;
  return suivant;
}

// Four-neighbour grid: never cut diagonally through the corner of a wall.
export function cheminResidence(depart: PointInterieur, arrivee: PointInterieur): PointInterieur[] {
  const pas = .2;
  const cellule = (p: PointInterieur) => ({ x: Math.round(p.x / pas), z: Math.round(p.z / pas) });
  const key = (p: PointInterieur) => `${p.x},${p.z}`;
  const debut = cellule(depart), fin = cellule(arrivee);
  const file = [debut];
  const parents = new Map<string, PointInterieur | null>([[key(debut), null]]);
  if (!residenceLibre(depart) || !residenceLibre(arrivee)) return [];
  for (let i = 0; i < file.length; i++) {
    const courant = file[i];
    if (key(courant) === key(fin)) {
      const chemin: PointInterieur[] = [];
      let p: PointInterieur | null = courant;
      while (p && key(p) !== key(debut)) { chemin.unshift({ x: p.x * pas, z: p.z * pas }); p = parents.get(key(p)) ?? null; }
      return chemin;
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const voisin = { x: courant.x + dx, z: courant.z + dz };
      if (!parents.has(key(voisin)) && residenceLibre({ x: voisin.x * pas, z: voisin.z * pas })) {
        parents.set(key(voisin), courant); file.push(voisin);
      }
    }
  }
  return [];
}
