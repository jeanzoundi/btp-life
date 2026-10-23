import { describe, expect, it } from 'vitest';
import { appliquerEffet, avancement, COUTS_BESOINS, EFFETS_DEMO, objetsPour, OBJETS_RESIDENCE } from './objets-interieurs';
import { cheminResidence, residenceLibre } from './plan-residence';
import { navigationLieu } from './plan-autres-lieux';
import { LIEUX } from './lieux';

const ENTREE = { x: 0, z: 3.8 };

describe('objets interactifs des intérieurs', () => {
  it('rend chaque meuble de l’appartement atteignable depuis l’entrée', () => {
    for (const objet of OBJETS_RESIDENCE) {
      expect(residenceLibre(objet.acces), objet.id).toBe(true);
      expect(cheminResidence(ENTREE, objet.acces).length, objet.id).toBeGreaterThan(0);
      expect(objet.actions.length, objet.id).toBeGreaterThan(0);
    }
  });

  it('rend atteignables les meubles du maquis, du café et des lieux de loisirs', () => {
    const nav = navigationLieu();
    for (const famille of ['restauration', 'loisirs', 'institution'] as const) for (const objet of objetsPour('autre', famille)) {
      expect(nav.libre(objet.acces), `${famille}/${objet.id}`).toBe(true);
      expect(nav.chemin(ENTREE, objet.acces).length, `${famille}/${objet.id}`).toBeGreaterThan(0);
    }
  });

  it('reprend les coûts du serveur et du catalogue des lieux', () => {
    const cout = (slug: string) => { const a = LIEUX[slug].actions.find(x => x.type === 'besoin'); return a?.type === 'besoin' ? a.cout : undefined; };
    expect(cout('maquis')).toBe(COUTS_BESOINS.repas);
    expect(cout('cafe')).toBe(COUTS_BESOINS.social);
    expect(cout('residence')).toBe(COUTS_BESOINS.repos);
  });

  it('propose dormir, cuisiner et recevoir chez soi, avec un effet serveur', () => {
    const besoins = OBJETS_RESIDENCE.flatMap(o => o.actions).filter(a => a.besoin).map(a => a.besoin).sort();
    expect(besoins).toEqual(['repas', 'repos', 'social']);
  });

  it('ne propose aucun objet dans un lieu inconnu', () => {
    expect(objetsPour('inconnu', null)).toEqual([]);
  });

  it('mesure l’avancement et applique les effets de démonstration sans dépasser 100', () => {
    expect(avancement(1000, 4000, 6)).toBeCloseTo(.5);
    expect(avancement(1000, 99999, 6)).toBe(1);
    expect(avancement(1000, 500, 6)).toBe(0);
    const avant = { energie: 20, faim: 40, social: 50, moral: 98 };
    expect(appliquerEffet(avant, EFFETS_DEMO.repos)).toEqual({ energie: 100, faim: 40, social: 50, moral: 100 });
    expect(appliquerEffet(avant, EFFETS_DEMO.repas).faim).toBe(100);
    expect(avant.energie).toBe(20);
  });
});
