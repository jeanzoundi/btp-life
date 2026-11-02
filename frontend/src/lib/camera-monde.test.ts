import { describe, expect, it } from 'vitest';
import { decalageVue, demiCadreOmbres, distanceVue, inclinaisonPourDistance } from './camera-monde';

describe("vue d'ensemble", () => {
  it('recule en portrait sans dépasser la limite', () => {
    expect(distanceVue(1.6)).toBe(24);
    expect(distanceVue(.46)).toBeGreaterThan(40);
    expect(distanceVue(.1)).toBe(46);
    expect(distanceVue(Number.NaN)).toBe(24);
  });
  it('regarde de trois quarts depuis le côté des portes', () => {
    const [x, y, z] = decalageVue(1.5);
    expect(Math.hypot(x, y, z)).toBeCloseTo(24);
    expect(Math.atan2(x, z) * 180 / Math.PI).toBeCloseTo(32);
    expect(Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI).toBeCloseTo(42);
    expect(z).toBeGreaterThan(0);
  });
});

describe('le zoom de la vue d’ensemble', () => {
  const degres = (d: number) => inclinaisonPourDistance(d) * 180 / Math.PI;
  it('abaisse la caméra de près pour lire les façades, la relève de loin pour lire le plan', () => {
    expect(degres(14)).toBeCloseTo(30);
    expect(degres(24)).toBeCloseTo(42);
    expect(degres(60)).toBeCloseTo(58);
    expect(degres(5)).toBeCloseTo(30);
    expect(degres(200)).toBeCloseTo(58);
    expect(degres(Number.NaN)).toBeCloseTo(42);
    for (let d = 14; d < 60; d += 2) expect(degres(d + 2)).toBeGreaterThan(degres(d));
  });
  it('en portrait, la vue reculée plonge un peu plus pour garder la rue lisible', () => {
    const [x, y, z] = decalageVue(.46);
    expect(Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI).toBeGreaterThan(45);
  });
  it('resserre le cadre des ombres de près et l’élargit de loin', () => {
    expect(demiCadreOmbres(14)).toBe(32);
    expect(demiCadreOmbres(24)).toBeCloseTo(40.8);
    expect(demiCadreOmbres(60)).toBe(90);
  });
});
