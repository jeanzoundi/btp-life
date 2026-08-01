import { describe, it, expect, beforeEach, vi } from 'vitest';
import { journaliserErreur, lireErreurs, viderErreurs } from './journal-erreurs';

describe('journal-erreurs', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('consigne une erreur avec son message et le chemin courant', () => {
    journaliserErreur(new Error('Boum'));

    const erreurs = lireErreurs();
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0].message).toBe('Boum');
    expect(erreurs[0].chemin).toBe(window.location.pathname);
    expect(erreurs[0].horodatage).toBeTruthy();
  });

  it('empile les erreurs les plus récentes en premier', () => {
    journaliserErreur(new Error('Première'));
    journaliserErreur(new Error('Seconde'));

    expect(lireErreurs().map((e) => e.message)).toEqual(['Seconde', 'Première']);
  });

  it('ne conserve que les 10 dernières erreurs', () => {
    for (let i = 0; i < 15; i++) journaliserErreur(new Error(`Erreur ${i}`));

    const erreurs = lireErreurs();
    expect(erreurs).toHaveLength(10);
    expect(erreurs[0].message).toBe('Erreur 14');
  });

  it('renvoie une liste vide plutôt que de planter si le stockage est corrompu', () => {
    localStorage.setItem('btp-life-erreurs', 'ceci n’est pas du JSON');
    expect(lireErreurs()).toEqual([]);
  });

  it('remplace un message vide par un libellé lisible', () => {
    journaliserErreur(new Error(''));
    expect(lireErreurs()[0].message).toBe('Erreur inconnue');
  });

  it('vide le journal sur demande', () => {
    journaliserErreur(new Error('À effacer'));
    viderErreurs();
    expect(lireErreurs()).toEqual([]);
  });
});
