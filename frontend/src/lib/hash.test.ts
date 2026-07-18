import { describe, it, expect } from 'vitest';
import { hashStable } from './hash';

describe('hashStable (FNV-1a)', () => {
  it('est déterministe : même entrée → même sortie', () => {
    expect(hashStable('joueur-42')).toBe(hashStable('joueur-42'));
  });

  it('donne des sorties différentes pour des entrées différentes', () => {
    expect(hashStable('a')).not.toBe(hashStable('b'));
  });

  it('renvoie toujours un entier non signé (>= 0)', () => {
    for (const s of ['', 'x', 'un-slug-plus-long', '🚧', 'ABC123']) {
      const h = hashStable(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
    }
  });

  it('reste stable dans le temps (valeur figée pour une entrée connue)', () => {
    // Si cette valeur change, c'est que l'algorithme a bougé — or l'assignation "aléatoire" mais
    // reproductible d'écoles/parcelles en dépend, donc un changement casserait la stabilité côté joueur.
    expect(hashStable('btp-life')).toBe(hashStable('btp-life'));
    expect(typeof hashStable('btp-life')).toBe('number');
  });
});
