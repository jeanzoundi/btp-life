import { describe, expect, it } from 'vitest';
import { echelleGabarit, gabaritDepuis } from './gabarit-personnage';
import { personnageDe } from './personnages-joueur';

describe('proportions du personnage', () => {
  it('préserve les anciens avatars sans réglage', () => {
    expect(echelleGabarit(null)).toEqual([1, 1, 1]);
    expect(gabaritDepuis({ stature: '__proto__', silhouette: 'constructor' })).toEqual({ stature: 'moyenne', silhouette: 'standard' });
  });
  it('applique les mêmes proportions au modèle choisi dans le monde', () => {
    const p = personnageDe({ personnage: 'tailleur', stature: 'grande', silhouette: 'fine' });
    expect(p.modele).toBe('cadre-femme');
    expect(echelleGabarit(p.gabarit)).toEqual([.9, 1.06, .9]);
    expect(echelleGabarit(personnageDe(null).gabarit)).toEqual([1, 1, 1]);
  });
});
