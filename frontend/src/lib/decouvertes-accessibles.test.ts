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
  it('garde les bâtiments hors des chaussées et sans chevauchement', () => {
    const routesX = [-54, 54];
    const routesZ = [-66, -10, 10];
    for (const [index, batiment] of batiments.entries()) {
      const [x, , z] = batiment.position;
      const [largeur, , profondeur] = batiment.taille;
      expect(routesX.some(route => Math.abs(x - route) < largeur / 2 + 3), `${batiment.slug} sur une route verticale`).toBe(false);
      expect(routesZ.some(route => Math.abs(z - route) < profondeur / 2 + 3), `${batiment.slug} sur une route horizontale`).toBe(false);
      for (const autre of batiments.slice(index + 1)) {
        const seChevauchent = Math.abs(x - autre.position[0]) < (largeur + autre.taille[0]) / 2 + 1 && Math.abs(z - autre.position[2]) < (profondeur + autre.taille[2]) / 2 + 1;
        expect(seChevauchent, `${batiment.slug} chevauche ${autre.slug}`).toBe(false);
      }
    }
  });
});
