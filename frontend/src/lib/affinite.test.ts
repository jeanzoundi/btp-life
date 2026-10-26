import { describe, expect, it } from 'vitest';
import { gagnerAffinite, libelleRelation, palierAffinite, prochainPalier } from './affinite';
import { facteurSocialTraits, TRAITS } from './traits';

describe('l’affinité avec les habitants', () => {
  it('suit des paliers cohérents à 20, 50 et 80', () => {
    expect(libelleRelation(0)).toBe('Première rencontre');
    expect(palierAffinite(19).nom).toBe('Connaissance');
    expect(palierAffinite(20).nom).toBe('Bonne entente');
    expect(palierAffinite(50).nom).toBe('Ami·e');
    expect(palierAffinite(80).nom).toBe('Proche');
    expect(palierAffinite(250).nom).toBe('Proche');
  });
  it('dit ce qui manque pour le palier suivant, et rien au dernier', () => {
    expect(prochainPalier(12)).toMatchObject({ manque: 8, palier: { seuil: 20 } });
    expect(prochainPalier(80)).toBeNull();
  });
  it('fait progresser le sociable une fois et demie plus vite, sans dépasser 100', () => {
    expect(gagnerAffinite(10, 4)).toBe(14);
    expect(gagnerAffinite(10, 4, facteurSocialTraits(['sociable']))).toBe(16);
    expect(gagnerAffinite(98, 6)).toBe(100);
  });
  it('décrit chiffres à l’appui l’effet de chaque trait', () => {
    expect(TRAITS).toHaveLength(8);
    for (const t of TRAITS) expect(t.description, t.slug).toMatch(/\d+ %/);
  });
});
