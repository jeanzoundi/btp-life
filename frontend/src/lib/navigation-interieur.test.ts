import { describe, expect, it } from 'vitest';
import { avancerInterieur } from './navigation-interieur';

describe('déplacements intérieurs', () => {
  it('permet de quitter le point d’entrée', () => {
    expect(avancerInterieur({ x: 0, z: 3.5 }, 0, -1, 0.05).z).toBeLessThan(3.5);
  });
  it('arrête le joueur devant le mobilier', () => {
    let p = { x: 0, z: 3.5 };
    for (let i = 0; i < 100; i++) p = avancerInterieur(p, 0, -1, 0.05);
    expect(p.z).toBeGreaterThanOrEqual(1.1);
  });
  it('autorise les allées latérales sans traverser les murs', () => {
    let p = { x: 1.85, z: 3.5 };
    for (let i = 0; i < 100; i++) p = avancerInterieur(p, 0, -1, 0.05);
    expect(p.z).toBe(-3.65);
  });
  it('limite les grands sauts après un onglet suspendu', () => {
    const p = avancerInterieur({ x: 0, z: 3.5 }, 1, 0, 30);
    expect(p.x).toBeCloseTo(0.16);
  });
});
