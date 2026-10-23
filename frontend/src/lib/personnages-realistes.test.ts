import { describe, expect, it } from 'vitest';
import { cadenceAnimation, etatAnimation, modeleRealiste, MODELES_REALISTES } from './personnages-realistes';

describe('personnages réalistes', () => {
  it('associe chaque identité du jeu à un modèle', () => {
    expect(modeleRealiste({ identite: 'batisseur' })).toBe('ouvrier-casque');
    expect(modeleRealiste({ identite: 'yao' })).toBe('chef-chantier');
    expect(MODELES_REALISTES[modeleRealiste({ identite: 'fatou' })].genre).toBe('f');
  });

  it('habille les passants selon leur rôle', () => {
    expect(['ouvrier-casque', 'chef-chantier']).toContain(modeleRealiste({ variante: 3, casque: true }));
    expect(['cadre-homme', 'cadre-femme']).toContain(modeleRealiste({ variante: 2, prof: true }));
    expect(modeleRealiste({ variante: -7 })).toBe(modeleRealiste({ variante: 7 }));
  });

  it('choisit l’animation selon la situation', () => {
    expect(etatAnimation({ assis: true, marche: true })).toBe('assis');
    expect(etatAnimation({ marche: true, allure: 4.5 })).toBe('course');
    expect(etatAnimation({ marche: true, allure: 1.5 })).toBe('marche');
    expect(etatAnimation({ prof: true })).toBe('parle');
    expect(etatAnimation({})).toBe('repos');
  });

  it('cale la cadence sur la vitesse sans excès', () => {
    expect(cadenceAnimation('marche', 1.4)).toBe(1);
    expect(cadenceAnimation('marche', 6)).toBe(1.6);
    expect(cadenceAnimation('course', 4.5)).toBeGreaterThan(1);
    expect(cadenceAnimation('repos', 9)).toBe(1);
  });
});
