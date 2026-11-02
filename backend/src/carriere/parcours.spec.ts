import { bonusParcours, porteDuProfil } from './parcours';

describe('les parcours d’entrée', () => {
  it('reconnaît le parcours d’un poste, et aucun pour un poste expert', () => {
    expect(porteDuProfil('etudiant-bts-batiment')).toBe('etudiant');
    expect(porteDuProfil('ouvrier-macon')).toBe('ouvrier');
    expect(porteDuProfil('manoeuvre')).toBe('ouvrier');
    expect(porteDuProfil('dessinateur-junior')).toBe('dessinateur');
    expect(porteDuProfil('chef-equipe')).toBe('encadrant');
    expect(porteDuProfil('ingenieur-structure')).toBe('ingenieur');
    expect(porteDuProfil('auditeur-qse')).toBeNull();
    expect(porteDuProfil(null)).toBeNull();
  });
  it('récompense mieux l’activité signature de chaque parcours, et seulement elle', () => {
    expect(bonusParcours('ouvrier', { type: 'journee' })).toEqual({ xp: 1, argent: 1.15, reputation: 0 });
    expect(bonusParcours('encadrant', { type: 'journee' })).toEqual({ xp: 1.2, argent: 1, reputation: 1 });
    expect(bonusParcours('etudiant', { type: 'seance', lieu: 'mairie' })).toEqual({ xp: 1.25, argent: 1, reputation: 0 });
    expect(bonusParcours('dessinateur', { type: 'seance', lieu: 'atelier' }).xp).toBe(1.2);
    expect(bonusParcours('ingenieur', { type: 'seance', lieu: 'laboratoire' }).xp).toBe(1.2);
    expect(bonusParcours('ingenieur', { type: 'seance', lieu: 'atelier' })).toEqual({ xp: 1, argent: 1, reputation: 0 });
    expect(bonusParcours('ouvrier', { type: 'seance', lieu: 'atelier' })).toEqual({ xp: 1, argent: 1, reputation: 0 });
    expect(bonusParcours(null, { type: 'journee' })).toEqual({ xp: 1, argent: 1, reputation: 0 });
  });
});
