import { describe, expect, it } from 'vitest';
import { ambianceMeteo, meteoDuMoment, METEOS, type Meteo } from './meteo-monde';

function tirages(mois: number) {
  const vus = new Map<Meteo, number>();
  for (let jour = 1; jour <= 28; jour++) for (let heure = 0; heure < 24; heure += 3) {
    const meteo = meteoDuMoment(new Date(2026, mois, jour), heure);
    vus.set(meteo, (vus.get(meteo) ?? 0) + 1);
  }
  return vus;
}

describe('météo du monde', () => {
  it('reste stable dans une même tranche de trois heures', () => {
    const jour = new Date(2026, 9, 22);
    expect(meteoDuMoment(jour, 9)).toBe(meteoDuMoment(jour, 11.9));
    expect(METEOS).toContain(meteoDuMoment(jour, 9));
  });

  it('suit les saisons d’Abidjan', () => {
    const janvier = tirages(0), juin = tirages(5), aout = tirages(7);
    expect(janvier.get('harmattan') ?? 0).toBeGreaterThan(40);
    expect(juin.get('harmattan') ?? 0).toBe(0);
    expect((juin.get('averse') ?? 0) + (juin.get('orage') ?? 0)).toBeGreaterThan(janvier.get('averse') ?? 0);
    expect(aout.get('orage') ?? 0).toBe(0);
  });

  it('assombrit et rapproche le brouillard par mauvais temps', () => {
    const soleil = ambianceMeteo('soleil'), orage = ambianceMeteo('orage');
    expect(orage.soleil).toBeLessThan(soleil.soleil);
    expect(orage.brouillardLoin).toBeLessThan(soleil.brouillardLoin);
    expect(orage.pluie).toBe(1);
    expect(orage.eclairs).toBe(true);
    expect(ambianceMeteo('harmattan').pluie).toBe(0);
  });
});
