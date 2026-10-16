import { describe, expect, it } from 'vitest';
import { destinationUniversite, itineraireUniversite, POINTS_UNIVERSITE } from './plan-universite';

describe('université à deux niveaux', () => {
  it('expose les six espaces avec deux niveaux', () => {
    expect(POINTS_UNIVERSITE).toHaveLength(6);
    expect(new Set(POINTS_UNIVERSITE.map(p => p.etage))).toEqual(new Set([0, 1]));
    expect(new Set(POINTS_UNIVERSITE.map(p => p.id)).size).toBe(6);
  });
  it('passe obligatoirement par l’escalier pour changer de niveau', () => {
    for (const cible of POINTS_UNIVERSITE.filter(p => p.etage === 1)) {
      const route = itineraireUniversite(0, cible);
      expect(route.some(p => p.escalier)).toBe(true);
      expect(route.at(-1)).toEqual({ x: cible.x, z: cible.z, etage: cible.etage });
    }
  });
  it('normalise les destinations répétées des boutons', () => {
    expect(destinationUniversite(POINTS_UNIVERSITE.length + 2).id).toBe(POINTS_UNIVERSITE[2].id);
  });
});
