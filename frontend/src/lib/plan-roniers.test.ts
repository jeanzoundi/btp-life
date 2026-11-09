import { describe, expect, it } from 'vitest';
import { BATIMENTS } from './batiments-ville';
import { PARCELLE_RONIERS } from './campagne';
import { CHAPITRES_RONIERS } from './dossier-roniers';
import { bornage, echafaudage, muret, structure } from './plan-akwaba';
import {
  BASE_VIE_RONIERS, DEMI_LARGEUR_RONIERS, DEMI_PROFONDEUR_RONIERS, elementsRoniers, GRUE_RONIERS, IMMEUBLE_RONIERS, longrinesRoniers, PIEUX_RONIERS, piquetsPieux,
  POTEAUX_RONIERS, SONDAGES_RONIERS, stocksRoniers, tetesPieux,
} from './plan-roniers';
import { AVENUES_NORD_SUD, ROUTES_EST_OUEST } from './voirie-ville';
import { LIMITES_VILLE } from './ville';

const dans = (x: number, z: number, hx: number, hz: number) => Math.abs(x) <= hx && Math.abs(z) <= hz;
const { largeur: L, profondeur: P, centreZ: CZ } = IMMEUBLE_RONIERS;
/** Un bloc (repère de la parcelle) touche-t-il l'emprise de l'immeuble ? */
const surImmeuble = (b: { position: number[]; taille: number[] }) =>
  Math.abs(b.position[0]) < L / 2 + b.taille[0] / 2 && Math.abs(b.position[2] - CZ) < P / 2 + b.taille[2] / 2;

describe('la parcelle de la Résidence Les Rôniers', () => {
  it('tient dans la ville, aux Jardins de l’Ouest, sans toucher les Résidences, l’avenue ni une autre emprise', () => {
    const { x, z, largeur, profondeur } = PARCELLE_RONIERS;
    expect(x - largeur / 2).toBeGreaterThanOrEqual(LIMITES_VILLE.minX);
    // L'avenue nord-sud passe en x = −54 (trottoirs compris jusqu'à 6,2 m de l'axe) ; les avenues est-ouest en z = −66 et −10.
    expect(x + largeur / 2).toBeLessThan(AVENUES_NORD_SUD[0] - 6.2);
    expect(z - profondeur / 2).toBeGreaterThan(ROUTES_EST_OUEST[0] + 6.2);
    expect(z + profondeur / 2).toBeLessThan(ROUTES_EST_OUEST[1] - 6.2);
    for (const b of BATIMENTS) {
      const chevauche = Math.abs(b.position[0] - x) < (b.taille[0] + largeur) / 2 && Math.abs(b.position[2] - z) < (b.taille[2] + profondeur) / 2;
      expect(chevauche, b.slug).toBe(false);
    }
  });

  it('porte l’immeuble des chapitres : 140 m² par niveau, six niveaux, douze poteaux et vingt-quatre pieux', () => {
    expect(L * P).toBe(140);
    expect(IMMEUBLE_RONIERS.niveaux).toBe(6);
    expect(POTEAUX_RONIERS).toHaveLength(12);
    expect(PIEUX_RONIERS).toHaveLength(24);
    // Le nombre de pieux du plan est celui du bureau d'études, et la surface de la parcelle celle du COS.
    const pieux = CHAPITRES_RONIERS.find(c => c.id === 'pieux')!.taches.find(t => t.id === 'nombre-pieux')!.contenu;
    expect(pieux.type === 'mesure' && pieux.mesure.explication).toContain(`retient ${PIEUX_RONIERS.length}`);
    expect(PARCELLE_RONIERS.largeur * PARCELLE_RONIERS.profondeur).toBe(234);
    for (const [x, z] of [...POTEAUX_RONIERS, ...PIEUX_RONIERS, ...SONDAGES_RONIERS, [GRUE_RONIERS.position[0], GRUE_RONIERS.position[2]] as [number, number]]) {
      expect(dans(x, z - CZ, L / 2, P / 2), `${x}, ${z}`).toBe(true);
    }
    expect(GRUE_RONIERS.hauteur).toBeGreaterThan(IMMEUBLE_RONIERS.niveaux * IMMEUBLE_RONIERS.hauteurNiveau + 3);
  });

  it('garde clôture, stocks, base vie et pieux à l’intérieur, et les stocks et la base vie hors de l’immeuble qui monte', () => {
    const hx = DEMI_LARGEUR_RONIERS, hz = DEMI_PROFONDEUR_RONIERS;
    for (const blocs of [bornage(hx, hz), muret(hx, hz), stocksRoniers(), piquetsPieux(), tetesPieux(), longrinesRoniers()]) {
      for (const b of blocs) expect(dans(b.position[0], b.position[2], hx + .2, hz + .2), JSON.stringify(b.position)).toBe(true);
    }
    for (const b of stocksRoniers()) expect(surImmeuble(b), JSON.stringify(b.position)).toBe(false);
    const { bungalow, taille, sanitaires } = BASE_VIE_RONIERS;
    expect(surImmeuble({ position: [...bungalow], taille: [...taille] })).toBe(false);
    expect(surImmeuble({ position: [...sanitaires], taille: [.95, 2.3, .95] })).toBe(false);
    expect(bungalow[2] + taille[2] / 2 + .35 + .3).toBeLessThanOrEqual(hz);
  });
});

describe('ce que la parcelle des Rôniers montre à chaque chapitre du dossier', () => {
  it('réservée, puis sondée, piquetée, clôturée au permis, et la base vie avec les voisins', () => {
    expect(elementsRoniers(0)).toMatchObject({ bornes: true, reserve: true, panneauProjet: false, palissade: false, immeuble: false });
    expect(elementsRoniers(1)).toMatchObject({ reserve: false, panneauProjet: true });
    expect(elementsRoniers(2)).toMatchObject({ sondages: true, sondeuse: true });
    expect(elementsRoniers(3)).toMatchObject({ piquets: true, implantation: true, sondeuse: false });
    expect(elementsRoniers(4)).toMatchObject({ bornes: false, palissade: true, permis: true });
    expect(elementsRoniers(5)).toMatchObject({ baseVie: true, forage: false });
  });

  it('forée, puis la grue et les longrines, la moitié des niveaux, toute la structure, et l’immeuble fini', () => {
    expect(elementsRoniers(6)).toMatchObject({ forage: true, piquets: false, sondages: false, grue: false });
    expect(elementsRoniers(7)).toMatchObject({ longrines: true, grue: true, stocks: true, niveauxMontes: 0 });
    expect(elementsRoniers(8)).toMatchObject({ niveauxMontes: 3, grue: true, echafaudage: false });
    expect(elementsRoniers(9)).toMatchObject({ niveauxMontes: 6, echafaudage: true });
    expect(elementsRoniers(10)).toMatchObject({ immeuble: true, reception: true, grue: false, stocks: false, niveauxMontes: 0, palissade: true });
  });

  it('livré : plus de palissade ni de base vie, un muret et l’immeuble habité', () => {
    for (const stade of [11, 12]) {
      expect(elementsRoniers(stade)).toMatchObject({ livre: true, immeuble: true, palissade: false, permis: false, baseVie: false, panneauProjet: false, reception: false });
    }
  });

  it('monte trois puis six niveaux de poteaux et de planchers, avec un garde-corps à chaque plancher d’échafaudage', () => {
    for (const montes of [3, 6]) {
      const blocs = structure(IMMEUBLE_RONIERS, POTEAUX_RONIERS, montes);
      expect(blocs.filter(b => b.taille[0] === L + .4)).toHaveLength(montes);
      expect(blocs.filter(b => b.taille[0] === .3)).toHaveLength(montes * POTEAUX_RONIERS.length);
    }
    expect(echafaudage(IMMEUBLE_RONIERS).filter(b => b.couleur === '#E8B23A')).toHaveLength(IMMEUBLE_RONIERS.niveaux * 3);
  });
});
