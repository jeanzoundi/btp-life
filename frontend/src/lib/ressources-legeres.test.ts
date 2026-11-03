import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATLAS_DEVANTURES, cheminPersonnage, cheminTexture, FICHIERS_CIEL, MATIERES_MONDE } from './ressources-legeres';
import { MODELES_REALISTES } from './personnages-realistes';

const publie = (chemin: string) => existsSync(`public${chemin}`);

describe('fichiers des ressources 3D', () => {
  it('existent pour chaque matière, en 1024 et en 512 px', () => {
    for (const matiere of MATIERES_MONDE) for (const carte of ['color', 'normal', 'rough'] as const) for (const legere of [false, true]) {
      expect(publie(cheminTexture(matiere, carte, legere)), cheminTexture(matiere, carte, legere)).toBe(true);
    }
  });
  it('existent pour chaque personnage du jeu, complet et léger', () => {
    for (const modele of Object.keys(MODELES_REALISTES)) for (const legere of [false, true]) {
      expect(publie(cheminPersonnage(modele, legere)), cheminPersonnage(modele, legere)).toBe(true);
    }
  });
  it('donnent un ciel en carte de gain complet et des devantures', () => {
    expect(FICHIERS_CIEL.every(publie)).toBe(true);
    expect(publie(ATLAS_DEVANTURES)).toBe(true);
    // Image, carte de gain puis métadonnées, dans cet ordre (ciel-carte-de-gain.ts).
    expect(FICHIERS_CIEL[2]).toMatch(/\.json$/);
    const metadonnees = JSON.parse(readFileSync(`public${FICHIERS_CIEL[2]}`, 'utf8'));
    for (const cle of ['gainMapMin', 'gainMapMax', 'gamma', 'offsetSdr', 'offsetHdr']) expect(metadonnees[cle], cle).toHaveLength(3);
    // Le soleil du HDR d'origine monte à 60 000 : la carte doit pouvoir le rendre.
    expect(Math.min(...metadonnees.gainMapMax)).toBeGreaterThan(15);
  });
});

describe('version légère', () => {
  afterEach(() => { vi.resetModules(); vi.unstubAllGlobals(); });
  const charger = async (largeur: number, tactile: boolean) => {
    vi.stubGlobal('innerWidth', largeur);
    vi.stubGlobal('matchMedia', (requete: string) => ({ matches: tactile && requete === '(pointer: coarse)' }));
    return (await import('./ressources-legeres')).ressourcesLegeres;
  };
  it('choisie sur un écran étroit ou tactile, pas sur un grand écran à la souris', async () => {
    expect((await charger(390, true))()).toBe(true);
    vi.resetModules();
    expect((await charger(1024, true))()).toBe(true);
    vi.resetModules();
    expect((await charger(700, false))()).toBe(true);
    vi.resetModules();
    expect((await charger(1440, false))()).toBe(false);
  });
  it('gardée pour toute la visite, même si l’écran tourne', async () => {
    const legeres = await charger(390, true);
    expect(legeres()).toBe(true);
    vi.stubGlobal('innerWidth', 844);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(legeres()).toBe(true);
  });
});
