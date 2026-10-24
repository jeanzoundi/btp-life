import { describe, expect, it } from 'vitest';
import { creerNavigation } from './navigation-plan';
import { avancementSemestre, DOMAINE_GRANDE_ECOLE, MODULES_HORS_LIGNE, ordonnerModules, PLAN_UNIVERSITE, prochainCours, type ModuleAcademie } from './universite';

const cours = (id: string) => ({ id, titre: id, dureeMin: 10, contenu: null, missionPratiqueId: null });
const module = (id: string, domaine: string, ids: string[], publie = true): ModuleAcademie => ({ id, slug: id, titre: id, domaine, publie, cours: ids.map(cours) });

describe('université', () => {
  it('chaque poste est libre et accessible depuis l’entrée', () => {
    const nav = creerNavigation(PLAN_UNIVERSITE);
    for (const [nom, point] of Object.entries(PLAN_UNIVERSITE.stations)) {
      expect(nav.libre(point, .2), nom).toBe(true);
      const trajet = nav.chemin(PLAN_UNIVERSITE.depart, point);
      expect(trajet.length, nom).toBeGreaterThan(0);
      expect(Math.hypot(trajet.at(-1)![0] - point[0], trajet.at(-1)![1] - point[1]), nom).toBeLessThan(.2);
    }
  });
  it('ordonne le semestre : modules publiés de l’Académie, puis la Grande École', () => {
    const ordre = ordonnerModules([module('ge', DOMAINE_GRANDE_ECOLE, ['g1']), module('brouillon', 'hse', ['b1'], false), module('hse', 'hse', ['h1']), module('vide', 'technique', [])]);
    expect(ordre.map(m => m.id)).toEqual(['hse', 'ge']);
  });
  it('propose le premier cours non suivi, et rien quand tout est validé', () => {
    const modules = [module('hse', 'hse', ['h1', 'h2']), module('beton', 'technique', ['b1'])];
    expect(prochainCours(modules, new Set())?.cours.id).toBe('h1');
    expect(prochainCours(modules, new Set(['h1', 'h2']))).toMatchObject({ module: { id: 'beton' }, cours: { id: 'b1' } });
    expect(prochainCours(modules, new Set(['h1', 'h2', 'b1']))).toBeNull();
    expect(avancementSemestre(modules, new Set(['h1', 'h2']))).toMatchObject({ faits: 2, total: 3, valides: 1 });
  });
  it('garde de quoi faire cours hors ligne, avec un « à retenir » pour se tester', () => {
    for (const m of MODULES_HORS_LIGNE) for (const c of m.cours) {
      const blocs = c.contenu?.blocs ?? [];
      expect(blocs.some(b => b.type === 'texte'), c.id).toBe(true);
      expect(blocs.find(b => b.type === 'retenir')?.valeur.split('\n').length, c.id).toBeGreaterThanOrEqual(2);
    }
  });
});
