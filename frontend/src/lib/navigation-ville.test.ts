import { describe, expect, it } from 'vitest';
import { boucleContournee, creerNavigation, MARGE_CORPS, segmentLibre } from './navigation-ville';
import { boucleHabitants, OBSTACLES_DECOR, OBSTACLES_JOUEUR, OBSTACLES_TERRASSE, PALMIERS, PIROGUES_PLAGE, tronconsGardeCorps, GARDE_CORPS } from './decor-ville';
import { ROUTES_PASSANTS } from './vie-urbaine';
import { ROUTE_CONCURRENT, ROUTE_CONCURRENT_RONIERS } from './concurrent';
import { BATIMENTS, PARCELLES_BATIMENTS, POINTS_DECOUVERTE } from './batiments-ville';
import { porteBatiment } from './minicarte';
import { LIMITES_VILLE } from './ville';
import type { PointVille } from './itineraire-ville';

const VILLE = creerNavigation(OBSTACLES_JOUEUR, LIMITES_VILLE);
/** Un trajet est bon s'il finit où on l'attend et que chaque ligne droite garde le corps hors du décor. */
function verifierTrajet(depart: PointVille, etapes: PointVille[]) {
  let ici = depart;
  for (const etape of etapes) { expect(segmentLibre(ici, etape, OBSTACLES_JOUEUR, MARGE_CORPS), `${ici} → ${etape}`).toBe(true); ici = etape; }
}

describe('la navigation du joueur dans la ville', () => {
  it('va tout droit quand rien ne gêne, et contourne ce qui est sur le chemin', () => {
    const petite = creerNavigation([{ x: 0, z: 0, largeur: 10, profondeur: 4 }], { minX: -20, maxX: 20, minZ: -20, maxZ: 20 });
    expect(petite.chemin([-15, 10], [15, 10])).toEqual([[15, 10]]);
    const contour = petite.chemin([0, -8], [0, 8]);
    expect(contour.length).toBeGreaterThan(1);
    expect(contour.at(-1)).toEqual([0, 8]);
    let ici: PointVille = [0, -8];
    for (const etape of contour) { expect(segmentLibre(ici, etape, [{ x: 0, z: 0, largeur: 10, profondeur: 4 }], MARGE_CORPS)).toBe(true); ici = etape; }
    expect(petite.passe(0, 0)).toBe(false);
    expect(petite.passe(0, 2.5)).toBe(false);
    expect(petite.passe(0, 3)).toBe(true);
  });

  it('ramène juste à côté une destination posée dans un arbre ou un banc', () => {
    const [x, z] = PALMIERS[0].p;
    const pres = VILLE.degager([x, z])!;
    expect(VILLE.passe(pres[0], pres[1])).toBe(true);
    expect(Math.hypot(pres[0] - x, pres[1] - z)).toBeLessThan(2.5);
    const trajet = VILLE.chemin([x + 8, z + 6], [x, z]);
    expect(Math.hypot(trajet.at(-1)![0] - x, trajet.at(-1)![1] - z)).toBeLessThan(2.5);
  });

  it('traverse la ville de bout en bout sans entrer dans le décor ni les bâtiments', () => {
    for (const [depart, arrivee] of [[[0, 6], [-25, 58]], [[-100, -100], [100, 60]], [[95, -100], [-110, 40]], [[0, 30], [0, -40]]] as [PointVille, PointVille][]) {
      const trajet = VILLE.chemin(depart, arrivee);
      expect(trajet.length, `${depart} → ${arrivee}`).toBeGreaterThan(0);
      expect(Math.hypot(trajet.at(-1)![0] - arrivee[0], trajet.at(-1)![1] - arrivee[1])).toBeLessThan(2.5);
      verifierTrajet(depart, trajet);
    }
  });

  it('descend à la plage par les ouvertures du garde-corps', () => {
    // Le garde-corps est un obstacle : un trajet valide de la promenade au sable passe forcément par une ouverture.
    const trajet = VILLE.chemin([-45, 46.5], [-45, 55]);
    expect(trajet.length).toBeGreaterThan(1);
    verifierTrajet([-45, 46.5], trajet);
    expect(tronconsGardeCorps().every(t => !GARDE_CORPS.ouvertures.some(o => o > t.de && o < t.a))).toBe(true);
    expect(VILLE.passe(-45, GARDE_CORPS.z)).toBe(false);
    expect(VILLE.passe(-32, GARDE_CORPS.z)).toBe(true);
  });

  it('laisse libres les portes des lieux, des parcelles du fil rouge et les repères à découvrir', () => {
    for (const b of [...BATIMENTS, ...PARCELLES_BATIMENTS]) {
      const porte = porteBatiment(b.position, b.taille, LIMITES_VILLE);
      const acces = VILLE.degager(porte)!;
      // Le jeu tient le joueur pour arrivé à 2,5 m de la porte (quartier-3d.tsx).
      expect(Math.hypot(acces[0] - porte[0], acces[1] - porte[1]), b.slug).toBeLessThan(2.5);
    }
    for (const repere of POINTS_DECOUVERTE) {
      const acces = VILLE.degager(repere.position)!;
      // On découvre un repère en s'en approchant à son rayon : il faut pouvoir aller plus près.
      expect(Math.hypot(acces[0] - repere.position[0], acces[1] - repere.position[1]), repere.id).toBeLessThan(repere.rayon - .5);
    }
  });

  it('fait contourner leur circuit aux passants et au concurrent, chacun partant de son point', () => {
    const habitants = OBSTACLES_JOUEUR.filter(o => !OBSTACLES_TERRASSE.includes(o));
    for (const route of [...ROUTES_PASSANTS, ROUTE_CONCURRENT, ROUTE_CONCURRENT_RONIERS]) {
      const { points, reperes } = boucleHabitants(route);
      expect(reperes).toHaveLength(route.length);
      points.forEach((p, i) => expect(segmentLibre(p, points[(i + 1) % points.length], habitants, MARGE_CORPS), `${p} → ${points[(i + 1) % points.length]}`).toBe(true));
    }
    // Un point d'origine dans un obstacle est d'abord dégagé, puis relié aux autres.
    const petite = creerNavigation([{ x: 0, z: 0, largeur: 4, profondeur: 4 }], { minX: -20, maxX: 20, minZ: -20, maxZ: 20 });
    const boucle = boucleContournee(petite, [[0, 0], [10, 0], [10, 10]]);
    expect(petite.passe(...boucle.points[boucle.reperes[0]])).toBe(true);
    expect(boucle.points[boucle.reperes[1]]).toEqual([10, 0]);
  });

  it('pose les pirogues sur le sable, dans la ville, sans se chevaucher', () => {
    expect(PIROGUES_PLAGE.length).toBeGreaterThanOrEqual(6);
    for (const { p: [x, z] } of PIROGUES_PLAGE) {
      expect(z).toBeGreaterThan(61);
      expect(z).toBeLessThanOrEqual(LIMITES_VILLE.maxZ);
      expect(VILLE.passe(x, z)).toBe(false);
    }
    expect(OBSTACLES_DECOR.length).toBeGreaterThan(150);
  });
});
