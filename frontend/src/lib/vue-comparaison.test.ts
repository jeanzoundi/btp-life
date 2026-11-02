import { describe, expect, it } from 'vitest';
import { vueDeComparaison } from './vue-comparaison';

describe('le point de vue de comparaison de la démonstration', () => {
  it('lit la position, l’heure et la météo demandées', () => {
    expect(vueDeComparaison('?vue=-31,30&heure=21.5&meteo=averse')).toEqual({ position: [-31, 30], heure: 21.5, meteo: 'averse' });
  });
  it('ignore ce qui est absent ou invalide', () => {
    expect(vueDeComparaison('')).toEqual({});
    expect(vueDeComparaison('?vue=3&heure=25&meteo=neige')).toEqual({});
    expect(vueDeComparaison('?vue=a,b&heure=')).toEqual({});
    expect(vueDeComparaison('?heure=0')).toEqual({ heure: 0 });
  });
});
