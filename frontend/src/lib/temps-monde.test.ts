import { describe, expect, it } from 'vitest';
import { ajouterTemps, AUCUN_TEMPS, ecartHorloge, type TempsMonde } from './temps-monde';

describe('le temps du monde compté pour les besoins', () => {
  it('mesure l’écart d’horloge en avançant, jusqu’au lendemain si l’heure est passée', () => {
    expect(ecartHorloge(10, 12.5)).toBe(2.5);
    expect(ecartHorloge(23.5, .5)).toBe(1);
    expect(ecartHorloge(19, 6.5)).toBe(11.5);
    expect(ecartHorloge(10, 9.5)).toBe(23.5);
    expect(ecartHorloge(8, 8)).toBe(0);
  });
  it('ne déclare que des heures entières : le reste attend le pas suivant', () => {
    let attente: TempsMonde = AUCUN_TEMPS;
    const declare: number[] = [];
    for (let pas = 0; pas < 3; pas++) {
      const r = ajouterTemps(attente, .4);
      attente = r.attente; declare.push(r.aDeclarer.eveil);
    }
    expect(declare).toEqual([0, 0, 1]);
    expect(attente.eveil).toBeCloseTo(.2);
  });
  it('compte la nuit à part, deux fois moins coûteuse côté serveur', () => {
    const nuit = ajouterTemps({ eveil: .3, sommeil: 0 }, 11.5, true);
    expect(nuit.aDeclarer).toEqual({ eveil: 0, sommeil: 11 });
    expect(nuit.attente.eveil).toBeCloseTo(.3);
    expect(nuit.attente.sommeil).toBeCloseTo(.5);
  });
  it('une journée jouée pas à pas (cinq minutes de jeu à chaque pas) déclare ses 24 heures sans rien perdre', () => {
    let attente: TempsMonde = AUCUN_TEMPS, total = 0;
    for (let pas = 0; pas < 288; pas++) {
      const r = ajouterTemps(attente, 5 / 60);
      attente = r.attente; total += r.aDeclarer.eveil;
    }
    expect(total + attente.eveil).toBeCloseTo(24);
    expect(total).toBeGreaterThanOrEqual(23);
  });
  it('ignore un temps nul, négatif ou absurde', () => {
    for (const heures of [0, -2, Number.NaN]) expect(ajouterTemps({ eveil: .5, sommeil: 0 }, heures)).toEqual({ attente: { eveil: .5, sommeil: 0 }, aDeclarer: AUCUN_TEMPS });
  });
});
