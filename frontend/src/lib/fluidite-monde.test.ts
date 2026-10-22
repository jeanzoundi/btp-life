import { describe, expect, it } from 'vitest';
import { ajusterResolution, avancerTrafic, orienterProgressivement } from './fluidite-monde';

describe('fluidité du monde', () => {
  it('baisse la résolution sous charge, la conserve dans la zone stable', () => {
    expect(ajusterResolution(1.5, 25, 1.5)).toBe(1.35);
    expect(ajusterResolution(1.2, 48, 1.5)).toBe(1.2);
    expect(ajusterResolution(1.2, 60, 1.5)).toBe(1.3);
  });
  it('respecte les limites et ignore une mesure invalide', () => {
    expect(ajusterResolution(.8, 10, 1.5)).toBe(.8);
    expect(ajusterResolution(1.25, 60, 1.25)).toBe(1.25);
    expect(ajusterResolution(.6, 20, .6)).toBe(.6);
    expect(ajusterResolution(1, NaN, 1.5)).toBe(1);
    expect(ajusterResolution(1, 0, 1.5)).toBe(1);
  });
  it('tourne par le chemin court à la frontière -pi/pi', () => {
    const angle = orienterProgressivement(Math.PI-.05, -Math.PI+.05, .016);
    expect(angle).toBeGreaterThan(Math.PI-.05);
    expect(angle).toBeLessThan(Math.PI+.05);
    expect(orienterProgressivement(0, 1, 0)).toBe(0);
  });
  it('accélère progressivement au feu vert', () => {
    const resultat = avancerTrafic(0, 0, false, .1);
    expect(resultat.vitesse).toBeCloseTo(.15);
    expect(resultat.deplacement).toBeCloseTo(.015);
  });
  it('freine sans franchir la ligne au rouge puis redémarre', () => {
    let position = 0, vitesse = 3;
    for (let i=0;i<300;i++) {
      const mouvement=avancerTrafic(vitesse, 4-position, true, .016);
      position+=mouvement.deplacement; vitesse=mouvement.vitesse;
      expect(position).toBeLessThanOrEqual(4);
    }
    expect(position).toBeCloseTo(4, 1); expect(vitesse).toBe(0);
    expect(avancerTrafic(vitesse, 0, false, .016).deplacement).toBeGreaterThan(0);
  });
  it('borne les longues frames et roule sans stop à venir', () => {
    expect(avancerTrafic(3, Infinity, true, 20).deplacement).toBeCloseTo(.3);
    expect(avancerTrafic(3, 1, true, -2).deplacement).toBe(0);
  });
});
