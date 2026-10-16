export type PointInterieur = { x: number; z: number };

// Les trois ensembles de mobilier laissent deux allées et un accès à la sortie.
export const MOBILIER_INTERIEUR = [-3.7, 0, 3.7].map((x, i) => ({ x, z: i % 2 ? -1.8 : 0.8 }));

export function avancerInterieur(position: PointInterieur, dx: number, dz: number, delta: number): PointInterieur {
  const longueur = Math.hypot(dx, dz);
  if (!longueur) return position;
  const pas = Math.min(Math.max(delta, 0), 0.05) * 3.2;
  const libre = (x: number, z: number) => !MOBILIER_INTERIEUR.some(m =>
    Math.abs(x - m.x) < 1.65 && z > m.z - 1.45 && z < m.z + 2.9);
  const x = Math.max(-5.35, Math.min(5.35, position.x + dx / longueur * pas));
  const z = Math.max(-3.65, Math.min(3.75, position.z + dz / longueur * pas));
  const prochainX = libre(x, position.z) ? x : position.x;
  return { x: prochainX, z: libre(prochainX, z) ? z : position.z };
}
