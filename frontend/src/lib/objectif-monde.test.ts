import { describe, expect, it } from 'vitest';
import { objectifDuMoment } from './objectif-monde';
import { decalagePlongee, distancePlongee } from './camera-monde';

const bien = { energie: 80, moral: 80, faim: 80, social: 80 };

describe('objectif du moment', () => {
  it('envoie vers le lieu du besoin le plus bas', () => {
    expect(objectifDuMoment({ ...bien, faim: 30, energie: 20 }, 0, 6)).toEqual({ texte: 'Repose-toi chez toi', etiquette: '20 %', lieu: 'residence' });
    expect(objectifDuMoment({ ...bien, social: 44 }, 6, 6).lieu).toBe('cafe');
  });
  it('propose ensuite les repères, puis la vie libre', () => {
    expect(objectifDuMoment(bien, 2, 6)).toEqual({ texte: 'Trouve les repères', etiquette: '2/6' });
    expect(objectifDuMoment(bien, 6, 6).lieu).toBeUndefined();
  });
});

describe('vue plongeante', () => {
  it('recule en portrait sans dépasser la limite', () => {
    expect(distancePlongee(1.6)).toBe(32);
    expect(distancePlongee(.46)).toBeGreaterThan(45);
    expect(distancePlongee(.1)).toBe(64);
    expect(distancePlongee(Number.NaN)).toBe(32);
  });
  it('regarde vers le nord avec une forte plongée', () => {
    const [x, y, z] = decalagePlongee(1.5);
    expect(x).toBe(0);
    expect(Math.atan2(y, z) * 180 / Math.PI).toBeCloseTo(58);
    expect(Math.hypot(y, z)).toBeCloseTo(32);
  });
});
