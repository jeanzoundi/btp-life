// La terrasse du maquis de la Lagune : trois tables en plastique et leurs quatre chaises, où les habitants viennent déjeuner
// et passer la soirée (lib/journee-pnj.ts). Le décor (details-abidjan.tsx) et les habitants partagent ces places.

type PointMonde = [number, number];

export const TABLES_TERRASSE: readonly PointMonde[] = [[-17.5, 42], [-11, 42.4], [-4.5, 42]];
export const COULEURS_CHAISES = ['#c8372d', '#eeeeea', '#2f6fb3', '#3f8f4e'];
const RAYON_CHAISES = .85;

/** La chaise `chaise` (0 à 3) de la table `table` : où elle est, l'angle autour de la table, et l'orientation de celui qui
 * s'y assoit (face à la table). */
export function siegeTerrasse(table: number, chaise: number) {
  const [x, z] = TABLES_TERRASSE[table];
  const angle = chaise * Math.PI / 2 + table * .3;
  return { position: [x + Math.sin(angle) * RAYON_CHAISES, z + Math.cos(angle) * RAYON_CHAISES] as PointMonde, angle, orientation: angle + Math.PI };
}
