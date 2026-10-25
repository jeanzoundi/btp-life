import { describe, expect, it } from 'vitest';
import { CASQUES, couleurCasque, estCouleurCasque } from './casques';
import { personnageDe } from './personnages-joueur';

describe('la couleur du casque', () => {
  it('garde la palette du serveur (COULEURS_CASQUE, backend/src/carriere/personnages.ts)', () => {
    expect(CASQUES.map(c => c.couleur)).toEqual(['#F5F0E6', '#F2C230', '#E8742B', '#2F6FB3', '#3F8F4E', '#C1502E']);
    expect(CASQUES[0].couleur).toBe('#F5F0E6');
  });
  it('lit le casque d’une configuration, y compris celui gagné au dressing, et refuse le reste', () => {
    expect(couleurCasque({ casque: '#FFD700' })).toBe('#FFD700');
    expect(couleurCasque({ casque: 'or' })).toBeNull();
    expect(couleurCasque(null)).toBeNull();
    expect(estCouleurCasque('#F2C230')).toBe(true);
    expect(estCouleurCasque('#FFD700')).toBe(false);
  });
  it('donne sa couleur au personnage du monde, sans changer le modèle choisi', () => {
    expect(personnageDe({ personnage: 'bleu-travail', casque: '#F2C230' })).toMatchObject({ id: 'bleu-travail', couleurCasque: '#F2C230' });
    expect(personnageDe({ personnage: 'jean' }).couleurCasque).toBeUndefined();
  });
});
