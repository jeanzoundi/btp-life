import { describe, it, expect } from 'vitest';
import { MOBILIER_BUREAUX, STATIONS_BUREAUX, navigationBureau, type TypeBureau } from './plan-bureaux';

for (const type of ['entreprise', 'bureau-etudes'] as TypeBureau[]) describe(type, () => {
  const nav = navigationBureau(type);
  it('bloque le mobilier et les limites', () => {
    for (const m of MOBILIER_BUREAUX[type]) expect(nav.libre(m)).toBe(false);
    expect(nav.libre({ x: NaN, z: 0 })).toBe(false);
    expect(nav.chemin({ x: 0, z: 3.8 }, { x: 8, z: 0 })).toEqual([]);
  });
  it('permet de marcher depuis la porte et entre tous les postes', () => {
    for (const depart of [{ x: 0, z: 3.8 }, ...STATIONS_BUREAUX[type]]) for (const cible of STATIONS_BUREAUX[type]) {
      if (depart === cible) continue;
      const route = nav.chemin(depart, cible);
      expect(route.length).toBeGreaterThan(0);
      expect(route.every(nav.libre)).toBe(true);
      let p = depart, frames = 0;
      while (route.length && frames++ < 3000) {
        const dx = route[0].x - p.x, dz = route[0].z - p.z;
        if (Math.hypot(dx, dz) < .06) route.shift();
        else p = nav.avancer(p, dx, dz, 1 / 30);
      }
      expect(route).toEqual([]);
      expect(Math.hypot(p.x - cible.x, p.z - cible.z)).toBeLessThan(.15);
    }
  });
  it('borne les déplacements après une longue pause', () => {
    expect(nav.avancer({ x: 0, z: 3.8 }, 0, -1, 60).z).toBeCloseTo(3.695);
  });
});
