import { describe, expect, it } from 'vitest';
import { bonusParcours, parcoursDuPoste, SIGNATURES_PARCOURS } from './parcours';
import { PROFILS_DEPART } from './profils-depart';

describe('les parcours d’entrée', () => {
  it('donnent à chacun son activité signature, comme au serveur', () => {
    expect(Object.keys(SIGNATURES_PARCOURS).sort()).toEqual(PROFILS_DEPART.map(p => p.id).sort());
    expect(bonusParcours('ouvrier', { type: 'journee' })).toEqual({ xp: 1, argent: 1.15, reputation: 0 });
    expect(bonusParcours('encadrant', { type: 'journee' })).toEqual({ xp: 1.2, argent: 1, reputation: 1 });
    expect(bonusParcours('etudiant', { type: 'seance', lieu: 'mairie' }).xp).toBe(1.25);
    expect(bonusParcours('dessinateur', { type: 'seance', lieu: 'bureau-etudes' }).xp).toBe(1.2);
    expect(bonusParcours('ingenieur', { type: 'seance', lieu: 'atelier' })).toEqual({ xp: 1, argent: 1, reputation: 0 });
    expect(bonusParcours(null, { type: 'journee' })).toEqual({ xp: 1, argent: 1, reputation: 0 });
  });
  it('retrouvent le parcours d’un poste', () => {
    expect(parcoursDuPoste('ouvrier-macon')).toBe('ouvrier');
    expect(parcoursDuPoste('auditeur-qse')).toBeNull();
    expect(parcoursDuPoste(undefined)).toBeNull();
  });
});
