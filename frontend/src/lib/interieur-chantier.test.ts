import { describe, expect, it } from 'vitest';
import { avancer, chemin, DEPART, libre, STATIONS, type Point } from './interieur-chantier';

describe('intérieur du chantier', () => {
  it('laisse libres le portail et chaque poste', () => {
    expect(libre(DEPART)).toBe(true);
    for (const [nom, point] of Object.entries(STATIONS)) expect(libre(point, .2), nom).toBe(true);
  });
  it('rejoint chaque poste depuis le portail en contournant l’ouvrage, la base vie et le stock', () => {
    for (const [nom, point] of Object.entries(STATIONS)) {
      const trajet = chemin(DEPART, point);
      expect(trajet.length, nom).toBeGreaterThan(0);
      const fin = trajet[trajet.length - 1];
      expect(Math.hypot(fin[0] - point[0], fin[1] - point[1]), nom).toBeLessThan(.2);
      for (const p of trajet) expect(libre(p, .15), `${nom} ${p}`).toBe(true);
    }
  });
  it('refuse une cible dans l’ouvrage et glisse le long d’un mur', () => {
    expect(chemin(DEPART, [0, -3])).toEqual([]);
    const contre: Point = [0, 3.6];
    const p = avancer(contre, 1, -1, .05);
    expect(p[0]).toBeGreaterThan(contre[0]);
    expect(p[1]).toBeCloseTo(contre[1]);
  });
});
