import { describe, expect, it } from 'vitest';
import { penseeJoueur, penseePnj } from './pensees-monde';

describe('bulles de pensée', () => {
  it('fait passer un besoin critique avant tout', () => {
    expect(penseeJoueur({ icone: '🍲', label: 'Faim !' }, { meteo: 'orage', heure: 12 }, 0)).toEqual({ icone: '🍲', texte: 'Faim !' });
  });

  it('pense à s’abriter sous la pluie', () => {
    expect(penseeJoueur(null, { meteo: 'averse', heure: 15 }, 2)?.icone).toBe('☔');
    expect(penseePnj('Yao', { meteo: 'orage', heure: 15 }, 3).icone).toBe('☔');
  });

  it('donne à chaque habitant des pensées de son métier', () => {
    expect(['📐', '🏛️']).toContain(penseePnj('Awa', { meteo: 'soleil', heure: 15 }, 1).icone);
    expect(['🧱', '🚚']).toContain(penseePnj('Koffi', { meteo: 'soleil', heure: 15 }, 4).icone);
    expect(penseePnj('Inconnu', { meteo: 'soleil', heure: 15 }, 1).icone).toBe('💭');
  });
});
