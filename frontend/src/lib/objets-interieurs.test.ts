import { describe, expect, it } from 'vitest';
import { actionSelonHeure, appliquerEffet, avancement, COUTS_BESOINS, DUREE_SIESTE, EFFETS_DEMO, objetsPour, OBJETS_RESIDENCE } from './objets-interieurs';
import { cheminResidence, residenceLibre } from './plan-residence';
import { navigationLieu } from './plan-autres-lieux';
import { LIEUX } from './lieux';
import { articleMaison } from './lieux-vie/maison';

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
    expect(cout('residence')).toBe(COUTS_BESOINS.repos);
    // Au maquis et au café, la vraie carte (lieux-vie) remplace l'ancien forfait.
    expect(cout('maquis')).toBeUndefined();
    expect(cout('cafe')).toBeUndefined();
  });

  it('fait payer la cuisine, le voisin et la télé au prix des articles maison', () => {
    const articles = OBJETS_RESIDENCE.flatMap(o => o.actions).filter(a => a.article).map(a => a.article);
    expect(articles.sort()).toEqual(['cuisine-maison', 'tele-maison', 'voisin-maison']);
    for (const id of articles) expect(articleMaison(id), id).toBeDefined();
  });

  it('propose dormir, cuisiner, recevoir, se doucher et regarder la télé chez soi, avec un effet serveur', () => {
    const besoins = OBJETS_RESIDENCE.flatMap(o => o.actions).filter(a => a.besoin).map(a => a.besoin).sort();
    expect(besoins).toEqual(['divertissement', 'hygiene', 'repas', 'repos', 'social']);
    // La télé prend une heure de jeu ; les besoins baissent pendant ce temps.
    expect(OBJETS_RESIDENCE.flatMap(o => o.actions).find(a => a.id === 'tele')?.heures).toBe(1);
  });

  it('le lit offre la nuit complète le soir, une sieste de deux heures le jour', () => {
    const lit = OBJETS_RESIDENCE.find(o => o.id === 'lit')!.actions[0];
    expect(actionSelonHeure(lit, true)).toBe(lit);
    expect(actionSelonHeure(lit, false)).toMatchObject({ id: 'dormir', besoin: 'repos', article: 'sieste-maison', label: `Faire une sieste (${DUREE_SIESTE} h)` });
    expect(articleMaison('sieste-maison')).toMatchObject({ action: 'repos', prix: 0, effets: { energie: 35 } });
    const douche = OBJETS_RESIDENCE.find(o => o.id === 'douche')!.actions[0];
    expect(actionSelonHeure(douche, false)).toBe(douche);
  });

  it('ne propose aucun objet dans un lieu inconnu', () => {
    expect(objetsPour('inconnu', null)).toEqual([]);
  });

  it('mesure l’avancement et applique les effets de démonstration sans dépasser 100', () => {
    expect(avancement(1000, 4000, 6)).toBeCloseTo(.5);
    expect(avancement(1000, 99999, 6)).toBe(1);
    expect(avancement(1000, 500, 6)).toBe(0);
    const avant = { energie: 20, faim: 40, social: 50, moral: 98, hygiene: 10, divertissement: 30 };
    expect(appliquerEffet(avant, EFFETS_DEMO.repos)).toEqual({ ...avant, energie: 100, moral: 100 });
    expect(appliquerEffet(avant, EFFETS_DEMO.repas).faim).toBe(100);
    expect(appliquerEffet(avant, EFFETS_DEMO.hygiene)).toMatchObject({ hygiene: 100, moral: 100 });
    expect(COUTS_BESOINS).toMatchObject({ hygiene: 0, divertissement: 800 });
    expect(avant.energie).toBe(20);
  });
});
