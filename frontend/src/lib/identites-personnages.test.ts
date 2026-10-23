import { describe, expect, it } from 'vitest';
import { IDENTITES_PERSONNAGES, identiteDepuisNom } from './identites-personnages';

describe('identités visuelles des personnages', () => {
  it('reconnaît les noms des PNJ et leurs libellés interactifs', () => {
    expect(identiteDepuisNom('Awa · Parler')).toBe('awa');
    expect(identiteDepuisNom(' YAO ')).toBe('yao');
    expect(identiteDepuisNom('Mariam')).toBe('mariam');
    expect(identiteDepuisNom('Fatou')).toBe('fatou');
    expect(identiteDepuisNom('Koffi')).toBe('koffi');
  });

  it('laisse les passants inconnus utiliser leur variante de secours', () => {
    expect(identiteDepuisNom()).toBeUndefined();
    expect(identiteDepuisNom('Jean')).toBeUndefined();
    expect(identiteDepuisNom('constructor')).toBeUndefined();
  });

  it('dispose de six palettes distinctes et de proportions valides', () => {
    const designs = Object.values(IDENTITES_PERSONNAGES);
    expect(designs).toHaveLength(6);
    expect(new Set(designs.map(d => d.haut)).size).toBe(6);
    for (const design of designs) {
      expect(design.hauteur).toBeGreaterThan(0);
      expect(design.largeur).toBeGreaterThan(0);
    }
  });
});
