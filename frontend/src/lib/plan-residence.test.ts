import { describe, expect, it } from 'vitest';
import { avancerResidence, cheminResidence, PLAN_RESIDENCE, POINTS_RESIDENCE, residenceLibre } from './plan-residence';

describe('Appartement : circulation et empreintes', () => {
  it('permet de rejoindre chaque pièce depuis la porte', () => {
    for (const destination of POINTS_RESIDENCE) {
      const chemin = cheminResidence({ x: 0, z: 3.8 }, destination);
      expect(chemin.length).toBeGreaterThan(0);
      expect(chemin.every(residenceLibre)).toBe(true);
      expect(Math.hypot(chemin.at(-1)!.x - destination.x, chemin.at(-1)!.z - destination.z)).toBeLessThan(.15);
    }
  });
  it('relie les pièces entre elles sans traverser les cloisons', () => {
    for (const depart of POINTS_RESIDENCE) for (const cible of POINTS_RESIDENCE) {
      if (depart.id === cible.id) continue;
      expect(cheminResidence(depart, cible).length).toBeGreaterThan(0);
    }
  });
  it('bloque les empreintes et les destinations hors du logement', () => {
    for (const meuble of Object.values(PLAN_RESIDENCE)) expect(residenceLibre(meuble)).toBe(false);
    expect(cheminResidence({ x: 0, z: 3.8 }, { x: 20, z: 0 })).toEqual([]);
    expect(residenceLibre({ x: NaN, z: 0 })).toBe(false);
  });
  it('plafonne le pas après un onglet inactif', () => {
    expect(avancerResidence({ x: 0, z: 3.8 }, 0, -1, 30).z).toBeCloseTo(3.695);
  });
  it('suit réellement chaque itinéraire sans rester bloqué au mobilier', () => {
    for (const cible of POINTS_RESIDENCE) {
      let position = { x: 0, z: 3.8 };
      const route = cheminResidence(position, cible);
      let iterations = 0;
      while (route.length && iterations++ < 3000) {
        const dx = route[0].x - position.x, dz = route[0].z - position.z;
        if (Math.hypot(dx, dz) < .06) route.shift();
        else position = avancerResidence(position, dx, dz, 1 / 30);
      }
      expect(route).toEqual([]);
    }
  });
});
