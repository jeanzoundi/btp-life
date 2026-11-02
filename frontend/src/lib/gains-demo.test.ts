import { describe, expect, it } from 'vitest';
import { DELAI_PAIE_MS, gainsDemo } from './gains-demo';

const PLEINS = { energie: 100, faim: 100, social: 100, moral: 100, hygiene: 100, divertissement: 100 };
const A_40 = { energie: 40, faim: 40, social: 40, moral: 40, hygiene: 40, divertissement: 40 };

describe('gains de la démonstration, aux règles du serveur', () => {
  it('paie la première fois, avec l’XP modulée par la forme comme au serveur', () => {
    // Pleine forme : +5 %, comme BesoinsService.facteurPerformance.
    expect(gainsDemo({ paie: 2000, xp: 50 }, PLEINS, undefined, 0)).toMatchObject({ argent: 2000, xp: 53, facteurBesoins: 1.05, entrainement: false });
    // Jauges à 40 : 0,7 + 0,4 × 0,3 = 0,82, le même facteur que le test serveur des séances.
    expect(gainsDemo({ paie: 2000, xp: 50 }, A_40, undefined, 0)).toMatchObject({ argent: 2000, xp: 41, facteurBesoins: .82 });
  });
  it('dans les 20 minutes d’une paie, entraînement : un quart de l’XP, sans argent, et l’heure de la prochaine paie', () => {
    const paye = 1_000_000;
    expect(gainsDemo({ paie: 7000, xp: 80 }, A_40, paye, paye + 5 * 60_000)).toEqual({
      argent: 0, xp: 16, reputation: 0, facteurBesoins: .82, entrainement: true, prochaineRecompenseLe: new Date(paye + DELAI_PAIE_MS).toISOString(),
    });
    expect(gainsDemo({ paie: 7000, xp: 80 }, A_40, paye, paye + DELAI_PAIE_MS)).toMatchObject({ argent: 7000, entrainement: false });
  });
});
