import { describe, it, expect } from 'vitest';
import { assombrir, pt } from './iso-geometrie';

describe('assombrir', () => {
  it('assombrit une couleur (facteur < 1) et garde le format #rrggbb', () => {
    const r = assombrir('#ffffff', 0.5);
    expect(r).toMatch(/^#[0-9a-f]{6}$/);
    expect(r).toBe('#808080');
  });

  it('facteur 1 renvoie la couleur inchangée', () => {
    expect(assombrir('#c1502e', 1)).toBe('#c1502e');
  });

  it('facteur 0 renvoie du noir', () => {
    expect(assombrir('#abcdef', 0)).toBe('#000000');
  });

  it('complète toujours sur 6 caractères (pas de troncature des couleurs sombres)', () => {
    expect(assombrir('#010203', 0.5)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('pt', () => {
  it('arrondit à une décimale', () => {
    expect(pt(1.234, 5.678)).toBe('1.2,5.7');
  });
});
