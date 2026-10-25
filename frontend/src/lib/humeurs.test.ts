import { describe, expect, it } from 'vitest';
import { besoinsDe, declinMonde, facteurForme, humeurDuMoment, humeursDe, pleineForme } from './humeurs';

const PLEIN = { energie: 100, faim: 100, social: 100, moral: 100, hygiene: 100, divertissement: 100 };

describe('le rythme des besoins dans le monde', () => {
  it('baisse comme au serveur (declinMonde, backend/src/carriere/besoins.service.ts), heure de jeu par heure de jeu', () => {
    expect(declinMonde({ ...PLEIN, faim: 50 }, 1.5)).toEqual({ energie: 94, faim: 41, social: 96, moral: 99, hygiene: 94, divertissement: 94 });
    expect(declinMonde(PLEIN, 0)).toBe(PLEIN);
    expect(declinMonde(PLEIN, 100).faim).toBe(0);
  });
  it('épargne l’énergie pendant le sommeil, et le reste baisse deux fois moins vite', () => {
    expect(declinMonde({ ...PLEIN, energie: 20 }, 6, true)).toEqual({ energie: 20, faim: 82, social: 91, moral: 97, hygiene: 88, divertissement: 88 });
  });
  it('garde les autres champs de l’objet (le reste de la carrière)', () => {
    expect(declinMonde({ ...PLEIN, niveau: 7 }, 1)).toMatchObject({ niveau: 7, faim: 94 });
  });
});

describe('la forme et les humeurs', () => {
  it('donne la forme que le serveur applique aux gains d’XP, avec 5 % de plus en pleine forme', () => {
    expect(facteurForme(PLEIN)).toBeCloseTo(1.05);
    expect(facteurForme({ energie: 70, faim: 70, social: 70, moral: 70, hygiene: 70, divertissement: 70 })).toBeCloseTo(.96);
    expect(facteurForme({ ...PLEIN, hygiene: 69 })).toBeCloseTo(.7 + (569 / 6 / 100) * .3);
    expect(pleineForme({ ...PLEIN, divertissement: 69 })).toBe(false);
  });
  it('liste les difficultés d’abord, de la plus forte à la plus légère, puis ce qui va très bien', () => {
    const b = { energie: 90, faim: 20, social: 50, moral: 85, hygiene: 10, divertissement: 50 };
    expect(humeursDe(b).map(h => h.nom)).toEqual(['Pas très frais', 'Affamé(e)', 'Bien reposé(e)', 'Motivé(e)']);
    expect(humeurDuMoment(b)).toEqual({ icone: '😬', nom: 'Pas très frais', forme: 85, pleineForme: false });
  });
  it('annonce la pleine forme, ou un simple « ça va »', () => {
    expect(humeurDuMoment(PLEIN)).toMatchObject({ nom: 'En pleine forme', forme: 105, pleineForme: true });
    expect(humeurDuMoment({ energie: 60, faim: 60, social: 60, moral: 60, hygiene: 60, divertissement: 60 })).toMatchObject({ nom: 'Ça va', forme: 88 });
  });
  it('suppose correctes les deux jauges qu’un serveur pas encore à jour ne renvoie pas', () => {
    expect(besoinsDe({ energie: 50, faim: 40, social: 30, moral: 20 })).toEqual({ energie: 50, faim: 40, social: 30, moral: 20, hygiene: 100, divertissement: 80 });
  });
});
