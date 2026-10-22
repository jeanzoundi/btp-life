import { describe, expect, it } from 'vitest';
import { ajusterEffets, niveauInitial, reglagesBloom, reglagesEffets } from './rendu-monde';

describe('rendu avancé du monde', () => {
  it('associe chaque qualité à un niveau d’effets', () => {
    expect(niveauInitial('fluide', false)).toBe(0);
    expect(niveauInitial('elevee', true)).toBe(3);
    expect(niveauInitial('auto', false)).toBe(2);
    expect(niveauInitial('auto', true)).toBe(1);
  });

  it('active occlusion, bloom et anti-crénelage selon le niveau', () => {
    expect(reglagesEffets(0)).toMatchObject({ composition: false, occlusion: false, bloom: false, antiCrenelage: false });
    expect(reglagesEffets(1)).toMatchObject({ composition: true, occlusion: false, bloom: true, antiCrenelage: true });
    expect(reglagesEffets(2)).toMatchObject({ occlusion: true, echelleOcclusion: .5 });
    expect(reglagesEffets(3)).toMatchObject({ occlusion: true, echelleOcclusion: 1 });
  });

  it('retire un effet seulement quand la résolution est déjà au plancher', () => {
    expect(ajusterEffets(2, 24, 1.2, .8)).toBe(2);
    expect(ajusterEffets(2, 24, .8, .8)).toBe(1);
    expect(ajusterEffets(1, 45, .8, .8)).toBe(1);
    expect(ajusterEffets(0, 10, .8, .8)).toBe(0);
    expect(ajusterEffets(2, Number.NaN, .8, .8)).toBe(2);
  });

  it('abaisse le seuil du halo la nuit', () => {
    expect(reglagesBloom(true).seuil).toBeLessThan(reglagesBloom(false).seuil);
  });
});
