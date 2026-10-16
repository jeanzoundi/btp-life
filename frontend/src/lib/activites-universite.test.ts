import { describe, expect, it } from 'vitest';
import { ACTIVITES_UNIVERSITE, ETAT_CAMPUS_INITIAL, realiserActivite } from './activites-universite';

describe('activités universitaires', () => {
  it('propose une activité pour chaque destination du campus', () => {
    expect(Object.keys(ACTIVITES_UNIVERSITE)).toHaveLength(10);
  });

  it('fait progresser le joueur après une activité BIM', () => {
    const suivant = realiserActivite(ETAT_CAMPUS_INITIAL, 'bim');
    expect(suivant.xp).toBe(25);
    expect(suivant.concentration).toBe(57);
    expect(suivant.derniereAction).toContain('maquette');
  });

  it('borne les besoins entre zéro et cent', () => {
    const suivant = realiserActivite({ ...ETAT_CAMPUS_INITIAL, social: 96 }, 'cafeteria');
    expect(suivant.social).toBe(100);
  });
});
