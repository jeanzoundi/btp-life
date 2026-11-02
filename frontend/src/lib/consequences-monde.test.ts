import { describe, expect, it } from 'vitest';
import { contributionAuChantier, progressionAuLieu } from './consequences-monde';

describe('les traces du joueur dans le monde', () => {
  it('le panneau du chantier appelle le nouveau venu, puis compte ses journées et les ouvrages livrés', () => {
    expect(contributionAuChantier('Jean', 0, 0)).toMatch(/présente-toi à Yao/);
    expect(contributionAuChantier('Jean', 1, 0)).toBe('1 journée de Jean');
    expect(contributionAuChantier('Jean', 7, 1)).toBe('7 journées de Jean · 1 ouvrage livré');
    expect(contributionAuChantier('Jean', 30, 2)).toBe('30 journées de Jean · 2 ouvrages livrés');
  });
  it('l’enseigne d’un lieu à mentor montre l’étape atteinte, puis le cycle en cours', () => {
    const programme = { etapes: Array.from({ length: 6 }) };
    expect(progressionAuLieu({ etapes: 0, cycles: 0 }, programme)).toBeUndefined();
    expect(progressionAuLieu({ etapes: 2, cycles: 0 }, programme)).toBe('Étape 2/6');
    expect(progressionAuLieu({ etapes: 1, cycles: 1 }, programme)).toBe('Étape 1/6 · cycle 2');
    expect(progressionAuLieu({ etapes: 9, cycles: 0 }, programme)).toBe('Étape 6/6');
  });
});
