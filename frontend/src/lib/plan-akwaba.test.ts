import { describe, expect, it } from 'vitest';
import { PARCELLE_AKWABA } from './campagne';
import {
  bornageAkwaba, DEMI_LARGEUR, DEMI_PROFONDEUR, echafaudageAkwaba, elementsAkwaba, IMMEUBLE, muretAkwaba, POTEAUX, SONDAGES, stocksAkwaba, structureAkwaba,
} from './plan-akwaba';
import { LIMITES_VILLE } from './ville';

const dans = (x: number, z: number, hx: number, hz: number) => Math.abs(x) <= hx && Math.abs(z) <= hz;

describe('la parcelle de la Résidence Akwaba', () => {
  it('tient dans la ville, au Plateau Nord, au nord de l’avenue', () => {
    const { x, z, largeur, profondeur } = PARCELLE_AKWABA;
    expect(x - largeur / 2).toBeGreaterThanOrEqual(LIMITES_VILLE.minX);
    expect(x + largeur / 2).toBeLessThanOrEqual(LIMITES_VILLE.maxX);
    // L'avenue du Plateau passe en z = −66 (6 m de large) : la clôture reste au nord de son trottoir.
    expect(z + profondeur / 2).toBeLessThanOrEqual(-71);
    // Ni l'hôtel de ville (x ≤ −17) ni le laboratoire (x ≥ 20) ne sont touchés.
    expect(x - largeur / 2).toBeGreaterThan(-17);
    expect(x + largeur / 2).toBeLessThan(20);
  });

  it('garde l’immeuble, ses seize poteaux et ses sondages à l’intérieur de la clôture', () => {
    expect(IMMEUBLE.largeur * IMMEUBLE.profondeur).toBe(108);
    expect(POTEAUX).toHaveLength(16);
    for (const [x, z] of POTEAUX) expect(dans(x, z - IMMEUBLE.centreZ, IMMEUBLE.largeur / 2, IMMEUBLE.profondeur / 2)).toBe(true);
    for (const [x, z] of SONDAGES) expect(dans(x, z - IMMEUBLE.centreZ, IMMEUBLE.largeur / 2, IMMEUBLE.profondeur / 2)).toBe(true);
    for (const blocs of [bornageAkwaba(), stocksAkwaba(), muretAkwaba()]) {
      for (const b of blocs) expect(dans(b.position[0], b.position[2], DEMI_LARGEUR + .2, DEMI_PROFONDEUR + .2), JSON.stringify(b.position)).toBe(true);
    }
  });
});

describe('ce que la parcelle montre à chaque chapitre validé', () => {
  it('bornée, sondée et implantée avant le permis ; palissade et panneau du permis ensuite', () => {
    expect(elementsAkwaba(0)).toMatchObject({ bornes: true, panneauProjet: false, palissade: false, immeuble: false });
    expect(elementsAkwaba(2)).toMatchObject({ sondages: true, appareilSondage: true });
    expect(elementsAkwaba(3)).toMatchObject({ implantation: true, appareilSondage: false, bornes: true });
    expect(elementsAkwaba(4)).toMatchObject({ bornes: false, palissade: true, permis: true });
    expect(elementsAkwaba(5)).toMatchObject({ baseVie: true, fouilles: false });
  });

  it('fondations, puis gros œuvre avec grue, puis l’immeuble fini qui attend sa réception', () => {
    expect(elementsAkwaba(6)).toMatchObject({ fouilles: true, stocks: true, sondages: false, implantation: false, grosOeuvre: false });
    expect(elementsAkwaba(7)).toMatchObject({ grosOeuvre: true, stocks: true, fouilles: false, immeuble: false });
    expect(elementsAkwaba(8)).toMatchObject({ immeuble: true, reception: true, palissade: true, grosOeuvre: false, stocks: false });
  });

  it('livré : plus de palissade ni de base vie, un muret et l’immeuble habité', () => {
    expect(elementsAkwaba(9)).toMatchObject({ livre: true, immeuble: true, palissade: false, permis: false, baseVie: false, panneauProjet: false, reception: false });
  });

  it('monte quatre niveaux de poteaux et de planchers, avec un garde-corps à chaque plancher d’échafaudage', () => {
    const structure = structureAkwaba();
    const planchers = structure.filter(b => b.taille[0] === IMMEUBLE.largeur + .4);
    const poteaux = structure.filter(b => b.taille[0] === .3);
    expect(planchers).toHaveLength(IMMEUBLE.niveaux);
    expect(poteaux).toHaveLength(IMMEUBLE.niveaux * POTEAUX.length);
    expect(Math.max(...planchers.map(b => b.position[1]))).toBeCloseTo(.4 + IMMEUBLE.niveaux * IMMEUBLE.hauteurNiveau - .12, 5);
    const lisses = echafaudageAkwaba().filter(b => b.couleur === '#E8B23A');
    expect(lisses).toHaveLength(IMMEUBLE.niveaux * 3);
  });
});
