import { describe, expect, it } from 'vitest';
import { configDepuis } from '@/components/app/avatar-btp';
import { avecApparence, personnageChoisi, personnageDe, personnageProche, PERSONNAGES, PERSONNAGE_DEFAUT } from './personnages-joueur';

describe('les personnages jouables', () => {
  it('garde la liste du serveur (PERSONNAGES_JOUEUR, backend/src/carriere/personnages.ts)', () => {
    expect(PERSONNAGES.map(p => p.id)).toEqual(['combinaison', 'bleu-travail', 'tailleur', 'tenue-ville', 'jean', 'capuche', 'costume']);
  });
  it('donne à chacun son propre modèle 3D ; seuls les modèles de chantier ont leur casque', () => {
    expect(new Set(PERSONNAGES.map(p => p.modele)).size).toBe(PERSONNAGES.length);
    expect(PERSONNAGES.filter(p => p.casque).map(p => p.modele).sort()).toEqual(['chef-chantier', 'ouvrier-casque']);
    for (const p of PERSONNAGES) expect(Boolean(p.design.casque), p.id).toBe(p.casque);
  });
  it('lit le choix rangé dans la configuration de l’avatar, et garde la combinaison sans choix', () => {
    expect(personnageChoisi({ personnage: 'tailleur', peau: '#C68642' })).toBe('tailleur');
    expect(personnageChoisi({ personnage: 'inconnu' })).toBeNull();
    expect(personnageChoisi(null)).toBeNull();
    expect(personnageDe(undefined).id).toBe(PERSONNAGE_DEFAUT);
    expect(personnageDe({ personnage: 'costume' }).modele).toBe('cadre-homme');
  });
  it('propose d’abord le personnage le plus proche de l’avatar 2D', () => {
    expect(personnageProche({ peau: '#5C3A24', cheveux: 'court' })).toBe('combinaison');
    expect(personnageProche({ peau: '#8D5524', cheveux: 'tresses', pilosite: 'aucune' })).toBe('tailleur');
    expect(personnageProche({ peau: '#E0AC69', cheveux: 'tresses' })).toBe('tenue-ville');
    expect(personnageProche({ peau: '#C68642', cheveux: 'court', pilosite: 'barbe' })).toBe('bleu-travail');
    expect(personnageProche({ personnage: 'jean', peau: '#F1C27D' })).toBe('jean');
    expect(personnageProche({})).toBe(PERSONNAGE_DEFAUT);
  });
});

describe('le même personnage dans les deux modes', () => {
  it('l’avatar 2D prend le teint et les cheveux du personnage, et garde la tenue du dressing', () => {
    const config = { peau: '#F1C27D', cheveux: 'chauve', pilosite: 'barbe', couleurTenue: '#C1502E', casque: '#2B2B2E', personnage: 'tailleur' };
    expect(avecApparence(config)).toEqual({ ...config, peau: '#8D5524', cheveux: 'tresses', pilosite: 'aucune' });
    expect(avecApparence({ peau: '#F1C27D' })).toEqual({ peau: '#F1C27D' });
  });
  it('le rendu de l’avatar (configDepuis) applique le personnage choisi partout où il s’affiche', () => {
    const c = configDepuis({ peau: '#F1C27D', couleurTenue: '#C1502E', personnage: 'jean' });
    expect(c.peau).toBe('#5C3A24');
    expect(c.couleurTenue).toBe('#C1502E');
    expect(configDepuis({ peau: '#F1C27D' }).peau).toBe('#F1C27D');
  });
});
