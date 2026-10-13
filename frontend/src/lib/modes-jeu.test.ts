import { describe, expect, it } from 'vitest';
import { avancerMode, MODES_JEU } from './modes-jeu';

describe('modes de jeu', () => {
  const carriere = MODES_JEU.find(m => m.id === 'carriere')!;
  it('ignore un bâtiment qui ne correspond pas à l’objectif', () => expect(avancerMode(carriere, 0, 'cafe')).toEqual({ etape: 0, points: 0, termine: false }));
  it('avance et attribue les points de l’étape', () => expect(avancerMode(carriere, 0, 'residence')).toEqual({ etape: 1, points: 100, termine: false }));
  it('termine le parcours à la dernière étape', () => expect(avancerMode(carriere, 3, 'chantier')).toEqual({ etape: 4, points: 300, termine: true }));
  it('propose plusieurs styles de jeu complets', () => {
    expect(MODES_JEU.map(m => m.id)).toEqual(expect.arrayContaining(['entrepreneur', 'exploration', 'communaute']));
    expect(MODES_JEU.filter(m => m.id !== 'libre').every(m => m.etapes.length >= 3 && (m.duree ?? 0) > 0)).toBe(true);
  });
});
