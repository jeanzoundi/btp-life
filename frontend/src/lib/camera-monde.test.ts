import { describe, expect, it } from 'vitest';
import { decalageVue, distanceVue } from './camera-monde';

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
