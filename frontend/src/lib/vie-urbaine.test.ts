import { describe, expect, it } from 'vitest';
import { affluence, creneauPnj, effetsMeteo, facteurPluie, passantsPresents, PLANNINGS_PNJ, vehiculesEnCirculation } from './vie-urbaine';
import { LIEUX_PROGRAMME } from './lieux-programme';

describe('la journée des habitants', () => {
  it('suit les heures des lieux : Awa au campus le jour, au café le soir, chez elle la nuit', () => {
    expect(creneauPnj('Awa', 10)?.activite).toBe('Au campus');
    expect(creneauPnj('Awa', 18)?.activite).toBe('Au café');
    expect(creneauPnj('Awa', 23)).toBeNull();
    expect(creneauPnj('Awa', 3)).toBeNull();
  });
  it('fait passer Koffi au dépôt aux heures du dépôt, puis au maquis', () => {
    const { ouverture, fermeture } = LIEUX_PROGRAMME.fournisseur.programme.horaires;
    expect(creneauPnj('Koffi', ouverture)?.activite).toBe('Au dépôt');
    expect(creneauPnj('Koffi', fermeture - .5)?.activite).toBe('Au dépôt');
    expect(creneauPnj('Koffi', fermeture)?.activite).toBe('Au maquis');
  });
  it('ne fait jamais se chevaucher deux créneaux d’un même habitant', () => {
    for (const [nom, creneaux] of Object.entries(PLANNINGS_PNJ)) {
      const tries = [...creneaux].sort((a, b) => a.de - b.de);
      for (let i = 1; i < tries.length; i++) expect(tries[i].de, nom).toBeGreaterThanOrEqual(tries[i - 1].a);
      for (const c of creneaux) expect(c.route.length, nom).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('la foule et la circulation', () => {
  it('vide les rues la nuit et sous l’orage, les remplit en journée', () => {
    expect(affluence(3)).toBeLessThan(affluence(20));
    expect(affluence(20)).toBeLessThan(affluence(11));
    expect(passantsPresents(11, 0)).toHaveLength(12);
    expect(passantsPresents(2, 0).length).toBeLessThanOrEqual(2);
    expect(passantsPresents(11, 1).length).toBeLessThan(passantsPresents(11, .65).length);
    expect(facteurPluie(0)).toBe(1);
  });
  it('remplit d’abord le marché le matin et la plage le soir', () => {
    // Un seul passant par itinéraire pour comparer l’ordre des quartiers.
    const matin = passantsPresents(9, 1, 6, 1).map(p => p.route), soir = passantsPresents(19, 1, 6, 1).map(p => p.route);
    expect(matin[0]).toBe(0);
    expect([3, 4]).toContain(soir[0]);
  });
  it('met plus de véhicules aux heures de pointe qu’au cœur de la nuit', () => {
    expect(vehiculesEnCirculation(8, 12)).toBe(12);
    expect(vehiculesEnCirculation(3, 12)).toBeLessThan(vehiculesEnCirculation(14, 12));
    expect(vehiculesEnCirculation(3, 12)).toBeGreaterThanOrEqual(1);
  });
});

describe('la météo qui pèse', () => {
  it('ralentit la marche sous la pluie et arrête le chantier pendant l’orage', () => {
    expect(effetsMeteo('soleil')).toEqual({ vitesseMarche: 1, chantierArrete: false, parapluies: false });
    expect(effetsMeteo('averse')).toMatchObject({ vitesseMarche: .85, parapluies: true, chantierArrete: false });
    expect(effetsMeteo('orage')).toMatchObject({ vitesseMarche: .75, chantierArrete: true });
  });
});
