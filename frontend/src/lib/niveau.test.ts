import { describe, it, expect } from 'vitest';
import { xpRequisPourNiveau, progressionVersNiveauSuivant } from './niveau';

// Cette courbe doit rester identique à celle du backend (progression.service.ts). Un écart ferait
// afficher au joueur une progression qui ne correspond pas à ce que le serveur lui accorde —
// bug déjà rencontré sur la topbar par le passé.
describe('xpRequisPourNiveau', () => {
  it('ne demande aucune XP pour le niveau 1', () => {
    expect(xpRequisPourNiveau(1)).toBe(0);
  });

  it('suit la formule round(100 * (N-1)^2.2)', () => {
    expect(xpRequisPourNiveau(2)).toBe(100);
    expect(xpRequisPourNiveau(5)).toBe(Math.round(100 * Math.pow(4, 2.2)));
    expect(xpRequisPourNiveau(10)).toBe(Math.round(100 * Math.pow(9, 2.2)));
  });

  it('reste croissante (aucun palier ne régresse)', () => {
    for (let n = 1; n < 100; n++) {
      expect(xpRequisPourNiveau(n + 1)).toBeGreaterThan(xpRequisPourNiveau(n));
    }
  });

  it('ne renvoie jamais de valeur négative, même sur une entrée aberrante', () => {
    expect(xpRequisPourNiveau(0)).toBe(0);
    expect(xpRequisPourNiveau(-5)).toBe(0);
  });
});

describe('progressionVersNiveauSuivant', () => {
  it('affiche 0 % juste après un passage de niveau', () => {
    const { pct } = progressionVersNiveauSuivant(xpRequisPourNiveau(3), 3);
    expect(pct).toBe(0);
  });

  it('affiche 100 % et 0 restant une fois le palier suivant atteint', () => {
    const { pct, restant } = progressionVersNiveauSuivant(xpRequisPourNiveau(4), 3);
    expect(pct).toBe(100);
    expect(restant).toBe(0);
  });

  it('affiche ~50 % à mi-chemin entre deux paliers', () => {
    const bas = xpRequisPourNiveau(5);
    const haut = xpRequisPourNiveau(6);
    const { pct } = progressionVersNiveauSuivant(Math.round((bas + haut) / 2), 5);
    expect(pct).toBeGreaterThanOrEqual(49);
    expect(pct).toBeLessThanOrEqual(51);
  });

  it('borne le pourcentage entre 0 et 100 même si l’XP dépasse largement le palier', () => {
    const { pct, restant } = progressionVersNiveauSuivant(999_999_999, 2);
    expect(pct).toBe(100);
    expect(restant).toBe(0);
  });

  it('ne descend pas sous 0 % si l’XP est en retard sur le niveau (données désynchronisées)', () => {
    const { pct } = progressionVersNiveauSuivant(0, 10);
    expect(pct).toBe(0);
  });
});
