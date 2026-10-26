import { describe, expect, it } from 'vitest';
import { aLArret, boucler, distanceLibre, ecartDevant, type Circuit } from './circulation';
import { GABARITS_VEHICULES, rapportHauteur } from './echelle-monde';

const VOIE: Circuit = { debut: -125, longueur: 250 };

describe('la boucle d’une voie', () => {
  it('ramène une position sur la boucle, dans les deux sens', () => {
    expect(boucler(126, VOIE)).toBeCloseTo(-124);
    expect(boucler(-126, VOIE)).toBeCloseTo(124);
    expect(boucler(10, VOIE)).toBe(10);
  });
  it('mesure l’écart devant soi en tenant compte du sens et du raccord de la boucle', () => {
    expect(ecartDevant(0, 10, 1, VOIE)).toBe(10);
    expect(ecartDevant(0, 10, -1, VOIE)).toBe(240);
    expect(ecartDevant(120, -120, 1, VOIE)).toBe(10);
  });
});

describe('la distance libre devant un véhicule', () => {
  const base = { longueur: 4, sens: 1 as const, circuit: VOIE, stops: [-58.5, 49.5], autres: [] };
  it('ne contraint rien au vert sur une voie vide', () => {
    expect(distanceLibre({ ...base, position: 0, rouge: false })).toEqual({ distance: Infinity, contrainte: false });
  });
  it('freine vers la ligne d’arrêt au rouge, mesurée depuis le nez', () => {
    expect(distanceLibre({ ...base, position: 40, rouge: true })).toEqual({ distance: 7.5, contrainte: true });
    // Ligne déjà franchie : le feu ne retient plus le véhicule.
    expect(distanceLibre({ ...base, position: 52, rouge: true }).contrainte).toBe(false);
  });
  it('s’arrête derrière le véhicule de devant, même au vert, avec une marge', () => {
    const r = distanceLibre({ ...base, position: 0, rouge: false, autres: [{ position: 12, longueur: 5 }] });
    // Nez à 2, arrière du suivant à 9,5, marge de 1,6 m.
    expect(r.distance).toBeCloseTo(5.9);
    expect(r.contrainte).toBe(true);
  });
  it('voit aussi le véhicule de devant de l’autre côté du raccord', () => {
    // Nez à 122, 3 m jusqu'au raccord, puis 5 m jusqu'à l'arrière du suivant (−120), moins la marge.
    const r = distanceLibre({ ...base, position: 120, rouge: false, autres: [{ position: -118, longueur: 4 }] });
    expect(r.distance).toBeCloseTo(6.4);
  });
  it('ignore un véhicule qui roule derrière', () => {
    expect(distanceLibre({ ...base, position: 0, rouge: false, autres: [{ position: -6, longueur: 4 }] }).contrainte).toBe(false);
  });
});

describe('les arrêts et les gabarits', () => {
  it('reconnaît le bus à son arrêt', () => {
    expect(aLArret(-85.7, [-86, 86])).toBe(true);
    expect(aLArret(-80, [-86, 86])).toBe(false);
  });
  it('garde les proportions de la vraie vie : la voiture à l’épaule, le bus près du double', () => {
    expect(rapportHauteur('voiture')).toBeGreaterThan(.75);
    expect(rapportHauteur('voiture')).toBeLessThan(.9);
    expect(rapportHauteur('bus')).toBeGreaterThan(1.7);
    expect(GABARITS_VEHICULES.bus.longueur).toBeGreaterThan(GABARITS_VEHICULES.gbaka.longueur * 2);
  });
});
