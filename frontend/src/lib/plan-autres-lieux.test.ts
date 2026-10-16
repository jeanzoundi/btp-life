import { describe, expect, it } from 'vitest';
import { familleLieu, navigationLieu, OBSTACLES_LIEU, stationsLieu, type FamilleLieu } from './plan-autres-lieux';

const slugs = ['universite','atelier','maquis','cafe','marche','centre-azur','galerie-palmiers','fournisseur','logistique','banque','mairie','agence','laboratoire','chantier','construction-nord','marina','sports'];
it('attribue un intérieur spécialisé à tous les bâtiments restants', () => {
  for (const slug of slugs) expect(familleLieu(slug), slug).not.toBeNull();
  expect(familleLieu('inconnu')).toBeNull();
});

describe('circulation des autres lieux', () => {
  const nav = navigationLieu();
  const familles = [...new Set(slugs.map(familleLieu))] as FamilleLieu[];
  it('bloque le mobilier', () => { for (const o of OBSTACLES_LIEU) expect(nav.libre(o)).toBe(false); });
  it('relie la porte à chaque zone de chaque famille', () => {
    for (const famille of familles) for (const cible of stationsLieu(famille)) {
      const route = nav.chemin({ x: 0, z: 3.8 }, cible);
      expect(route.length, `${famille}/${cible.id}`).toBeGreaterThan(0);
      expect(route.every(nav.libre)).toBe(true);
    }
  });
});
