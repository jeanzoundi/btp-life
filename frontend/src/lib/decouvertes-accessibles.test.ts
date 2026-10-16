import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Contrôle les coordonnées réellement utilisées par la scène, sans charger WebGL.
const source = readFileSync('src/components/app/quartier-3d.tsx', 'utf8');
const batiments = [...source.matchAll(/slug: '([^']+)'[^\n]+position: \[([^\]]+)\], taille: \[([^\]]+)\]/g)]
  .map((m) => ({ slug: m[1], position: m[2].split(',').map(Number), taille: m[3].split(',').map(Number) }));
const points = [...source.matchAll(/id: '([^']+)'[^\n]+position: \[([^\]]+)\] as PointMonde/g)]
  .map((m) => ({ id: m[1], position: m[2].split(',').map(Number) }));

describe('repères de découverte', () => {
  it('vérifie bien les six repères et les bâtiments de la scène', () => {
    expect(points).toHaveLength(6);
    expect(batiments.length).toBeGreaterThan(20);
  });
  it('place tous les repères hors des collisions du joueur', () => {
    for (const point of points) {
      const obstacles = batiments.filter(b =>
        Math.abs(point.position[0] - b.position[0]) < b.taille[0] / 2 + 0.7 &&
        Math.abs(point.position[1] - b.position[2]) < b.taille[2] / 2 + 0.7);
      expect(obstacles.map(b => b.slug), point.id).toEqual([]);
    }
  });
});
