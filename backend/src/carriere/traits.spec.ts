import { facteurEnergieTravail, facteurPrix, facteurReputation, facteurSocial, facteurXpLieu, lireTraits } from './traits';

describe('les traits du personnage', () => {
  it('ne retient que les traits connus, sans doublon', () => {
    expect(lireTraits(['curieux', 'pirate', 'curieux', 'leader'])).toEqual(['curieux', 'leader']);
    expect(lireTraits(null)).toEqual([]);
  });
  it('fait gagner plus d’XP dans les lieux du trait, et sur un sans-faute pour le perfectionniste', () => {
    expect(facteurXpLieu(['curieux'], 'atelier', 70)).toBeCloseTo(1.15);
    expect(facteurXpLieu(['curieux'], 'mairie', 70)).toBe(1);
    expect(facteurXpLieu(['meticuleux', 'leader'], 'bureau-etudes', 80)).toBeCloseTo(1.15);
    expect(facteurXpLieu(['perfectionniste'], 'laboratoire', 99)).toBe(1);
    expect(facteurXpLieu(['perfectionniste', 'curieux'], 'laboratoire', 100)).toBeCloseTo(1.15 * 1.2);
  });
  it('règle réputation, fatigue, lien social et prix', () => {
    expect(facteurReputation(['ambitieux'])).toBe(1.25);
    expect(facteurEnergieTravail(['bosseur'])).toBe(.7);
    expect(facteurSocial(['sociable'])).toBe(1.5);
    expect(facteurPrix(['econome'])).toBe(.9);
    expect([facteurReputation([]), facteurEnergieTravail([]), facteurSocial([]), facteurPrix([])]).toEqual([1, 1, 1, 1]);
  });
});
