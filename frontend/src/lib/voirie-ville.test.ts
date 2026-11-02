import { describe, expect, it } from 'vitest';
import { AVENUES_NORD_SUD, construireVoirie, DEMI_CHAUSSEE, flaquesQuartier, ROUTES_EST_OUEST, troncons } from './voirie-ville';

const VOIRIE = construireVoirie();
/** Le bloc empiète-t-il sur une chaussée : une avenue est-ouest (toute la largeur de la ville) ou nord-sud ? */
const surChaussee = (b: (typeof VOIRIE)[number]) => {
  const [x, , z] = b.position, [lx, , lz] = b.taille;
  const surRoute = ROUTES_EST_OUEST.some(z0 => Math.abs(z - z0) < lz / 2 + DEMI_CHAUSSEE - 1e-6);
  const surAvenue = AVENUES_NORD_SUD.some(x0 => Math.abs(x - x0) < lx / 2 + DEMI_CHAUSSEE - 1e-6) && z + lz / 2 > -128 && z - lz / 2 < 48;
  return surRoute || surAvenue;
};

describe('la voirie du quartier', () => {
  it('coupe une ligne aux carrefours', () => {
    expect(troncons(-10, 10, [0], 2)).toEqual([[-10, -2], [2, 10]]);
    expect(troncons(-10, 10, [5, -5], 1)).toEqual([[-10, -6], [-4, 4], [6, 10]]);
    expect(troncons(0, 4, [0], 1)).toEqual([[1, 4]]);
  });
  it('ne pose aucune bordure ni aucun trottoir en travers d’une chaussée', () => {
    const bords = VOIRIE.filter(b => b.matiere === 'beton');
    expect(bords.length).toBeGreaterThan(60);
    expect(bords.filter(surChaussee)).toEqual([]);
  });
  it('borde aussi les avenues nord-sud, et place chaque passage piéton hors du carrefour', () => {
    expect(VOIRIE.some(b => b.matiere === 'beton' && Math.abs(b.position[0] - (AVENUES_NORD_SUD[0] - 3.15)) < 1e-9)).toBe(true);
    const bandes = VOIRIE.filter(b => b.couleur === '#eee8d7' && b.taille[0] !== .25 && b.taille[2] !== .25);
    // Quatre passages de six bandes à chacun des six carrefours.
    expect(bandes).toHaveLength(6 * 4 * 6);
    for (const b of bandes) {
      const [x, , z] = b.position;
      const x0 = AVENUES_NORD_SUD.reduce((p, a) => Math.abs(a - x) < Math.abs(p - x) ? a : p);
      const z0 = ROUTES_EST_OUEST.reduce((p, a) => Math.abs(a - z) < Math.abs(p - z) ? a : p);
      // Sur une chaussée, mais pas dans le carré du croisement.
      expect(Math.abs(x - x0) <= DEMI_CHAUSSEE || Math.abs(z - z0) <= DEMI_CHAUSSEE).toBe(true);
      expect(Math.abs(x - x0) > DEMI_CHAUSSEE || Math.abs(z - z0) > DEMI_CHAUSSEE).toBe(true);
    }
  });
});

describe('les flaques du quartier pilote', () => {
  it('se posent au bord des chaussées et sur les trottoirs du centre, toujours au même endroit', () => {
    const flaques = flaquesQuartier();
    expect(flaques).toHaveLength(26);
    expect(flaquesQuartier()).toEqual(flaques);
    for (const f of flaques) {
      expect(Math.abs(f.x)).toBeLessThanOrEqual(46);
      const ecart = Math.min(...ROUTES_EST_OUEST.map(z => Math.abs(f.z - z)));
      expect(ecart).toBeGreaterThan(1.8);
      expect(ecart).toBeLessThan(5.6);
    }
  });
});
