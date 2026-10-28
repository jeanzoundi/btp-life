import { describe, expect, it } from 'vitest';
import { ambianceMeteo, DUREE_EPISODE_MS, meteoDuMoment, METEOS, saisonDuMoment, type Meteo } from './meteo-monde';

const MINUTE = 60_000;

/** La météo de chaque épisode d'un mois, relevée deux minutes après son début (hors transition). */
function episodes(annee: number, mois: number) {
  const vus = new Map<Meteo, number>();
  const fin = new Date(annee, mois + 1, 1).getTime();
  for (let t = Math.ceil(new Date(annee, mois, 1).getTime() / DUREE_EPISODE_MS) * DUREE_EPISODE_MS + 2 * MINUTE; t < fin; t += DUREE_EPISODE_MS) {
    const meteo = meteoDuMoment(new Date(t));
    vus.set(meteo, (vus.get(meteo) ?? 0) + 1);
  }
  const total = [...vus.values()].reduce((s, n) => s + n, 0);
  return (meteo: Meteo) => (vus.get(meteo) ?? 0) / total;
}

describe('météo du monde', () => {
  it('donne le même ciel à tous au même instant, et le garde pendant un épisode', () => {
    const debut = Math.floor(new Date(2026, 9, 22, 10).getTime() / DUREE_EPISODE_MS) * DUREE_EPISODE_MS;
    expect(meteoDuMoment(new Date(debut + MINUTE))).toBe(meteoDuMoment(new Date(debut + MINUTE)));
    expect(meteoDuMoment(new Date(debut + 6 * MINUTE))).toBe(meteoDuMoment(new Date(debut)));
    expect(METEOS).toContain(meteoDuMoment(new Date(debut)));
  });

  it('change au hasard au fil des heures, sans revenir chaque jour au même ciel', () => {
    const jour = (d: number) => Array.from({ length: 24 }, (_, i) => meteoDuMoment(new Date(new Date(2026, 9, d).getTime() + i * 6 * DUREE_EPISODE_MS + 2 * MINUTE)));
    expect(new Set(jour(22)).size).toBeGreaterThan(2);
    expect(jour(23)).not.toEqual(jour(22));
  });

  it('suit les saisons du sud ivoirien', () => {
    const janvier = episodes(2026, 0), juin = episodes(2026, 5), aout = episodes(2026, 7);
    expect(janvier('harmattan')).toBeGreaterThan(.35);
    expect(juin('harmattan')).toBe(0);
    expect(juin('averse') + juin('orage')).toBeGreaterThan(.35);
    expect(juin('averse') + juin('orage')).toBeGreaterThan(janvier('averse') + janvier('orage'));
    expect(aout('orage')).toBe(0);
    expect(saisonDuMoment(new Date(2026, 9, 28)).nom).toBe('Petite saison des pluies');
    expect(saisonDuMoment(new Date(2026, 0, 10)).nom).toBe('Grande saison sèche · harmattan');
  });

  it('passe par un ciel nuageux entre le temps sec et la pluie', () => {
    const sec = (m: Meteo) => m === 'soleil' || m === 'harmattan', pluie = (m: Meteo) => m === 'averse' || m === 'orage';
    const sauts: string[] = [];
    for (const mois of [0, 4, 9]) {
      const debut = new Date(2026, mois, 1).getTime();
      let avant = meteoDuMoment(new Date(debut));
      for (let t = debut + MINUTE; t < debut + 3 * 86_400_000; t += MINUTE) {
        const apres = meteoDuMoment(new Date(t));
        if ((sec(avant) && pluie(apres)) || (pluie(avant) && sec(apres))) sauts.push(`${new Date(t).toISOString()} ${avant} → ${apres}`);
        avant = apres;
      }
    }
    expect(sauts).toEqual([]);
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
