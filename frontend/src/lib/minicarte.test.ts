import { describe, expect, it } from 'vitest';
import { angleEcran, azimutCamera, batimentSous, carteDepuisMonde, distanceLisible, mondeDepuisCarte, porteBatiment } from './minicarte';

const deg = (r: number) => r * 180 / Math.PI;

describe('cap à l’écran', () => {
  it('donne 0 droit devant et 90° à droite, caméra au sud', () => {
    expect(deg(angleEcran([0, 0], [0, -20], 0))).toBeCloseTo(0);
    expect(deg(angleEcran([0, 0], [20, 0], 0))).toBeCloseTo(90);
    expect(Math.abs(deg(angleEcran([0, 0], [0, 20], 0)))).toBeCloseTo(180);
  });
  it('suit la rotation de la caméra', () => {
    const azimut = azimutCamera([10, 10], [0, 0]);
    expect(deg(azimut)).toBeCloseTo(45);
    // Une cible dans l'axe du regard (vers le nord-ouest) est droit devant.
    expect(deg(angleEcran([0, 0], [-10, -10], azimut))).toBeCloseTo(0);
  });
});

describe('minicarte', () => {
  it('aller-retour exact entre la carte et le monde, quelle que soit la rotation', () => {
    for (const azimut of [0, .56, -1.2, 2.9]) {
      const monde = mondeDepuisCarte(31, -17, [12, -40], azimut, 1.4);
      const [x, y] = carteDepuisMonde(monde, [12, -40], azimut, 1.4);
      expect(x).toBeCloseTo(31); expect(y).toBeCloseTo(-17);
    }
  });
  it('place le regard de la caméra en haut de la carte', () => {
    const [x, y] = carteDepuisMonde([0, -10], [0, 0], 0, 2);
    expect(x).toBeCloseTo(0); expect(y).toBeCloseTo(-20);
  });
  it('trouve le bâtiment touché et sa porte', () => {
    const batiments = [{ slug: 'maquis', position: [-11, 2.3, 31] as const, taille: [10, 4.6, 8] as const }];
    expect(batimentSous([-9, 33], batiments)?.slug).toBe('maquis');
    expect(batimentSous([20, 33], batiments)).toBeUndefined();
    expect(porteBatiment([-11, 2.3, 31], [10, 4.6, 8], { minZ: -120, maxZ: 66 })).toEqual([-11, 37]);
    expect(porteBatiment([0, 2, 64], [10, 4, 8], { minZ: -120, maxZ: 66 })).toEqual([0, 66]);
  });
  it('écrit les distances simplement', () => {
    expect(distanceLisible(42)).toBe('40 m');
    expect(distanceLisible(0.4)).toBe('1 m');
    expect(distanceLisible(1240)).toBe('1,2 km');
    expect(distanceLisible(1000)).toBe('1 km');
  });
});
