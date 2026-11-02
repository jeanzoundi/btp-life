import { describe, expect, it } from 'vitest';
import { gesteDuJour, gesteReussi } from './gestes-chantier';
import { bilanJournee, nouvelleJournee, repondre, SITUATION_EPI } from './journee-chantier';
import { TOTAL_JOURS } from './programme-chantier';

describe('les gestes du chantier', () => {
  it('donnent un geste par journée de travaux, toujours le même pour un même jour', () => {
    for (let numero = 0; numero < TOTAL_JOURS; numero++) {
      const j = nouvelleJournee({ jours: numero, equipe: [] });
      const gestes = j.taches.filter(t => t.type === 'geste');
      expect(gestes.length, `jour ${numero}`).toBe(j.etape === 'recrutement' ? 0 : 1);
      if (j.geste) expect(gesteDuJour(numero, j.etape)).toEqual(j.geste);
    }
  });
  it('couvrent les cinq gestes : tracer, mesurer, placer, contrôler, corriger', () => {
    const types = new Set(Array.from({ length: TOTAL_JOURS }, (_, n) => nouvelleJournee({ jours: n, equipe: [] }).geste?.type).filter(Boolean));
    expect([...types].sort()).toEqual(['controler', 'corriger', 'mesurer', 'placer', 'tracer']);
  });
  it('jugent la valeur relevée à la tolérance près', () => {
    const g = { attendu: .85, tolerance: .02 };
    expect(gesteReussi(g, .86)).toBe(true);
    expect(gesteReussi(g, .87)).toBe(true);
    expect(gesteReussi(g, .9)).toBe(false);
    expect(gesteReussi(g, undefined)).toBe(false);
    expect(gesteReussi(g, Number.NaN)).toBe(false);
  });
  it('restent jouables : valeurs dans les plages des outils', () => {
    for (let numero = 1; numero < TOTAL_JOURS; numero++) {
      const g = nouvelleJournee({ jours: numero, equipe: [] }).geste!;
      if (g.type === 'mesurer') expect(g.attendu).toBeLessThanOrEqual(g.mesure!.longueur < 2 ? 1.6 : 6);
      if (g.type === 'controler') expect(Math.abs(g.attendu)).toBeLessThanOrEqual(30);
      if (g.type === 'tracer') expect(g.attendu).toBeGreaterThan(0);
      if (g.type === 'corriger') expect(g.defauts).toHaveLength(4);
      if (g.type === 'placer') expect([3, 4, 5]).toContain(g.attendu);
    }
  });
  it('comptent dans la note de la journée comme une situation', () => {
    let j = nouvelleJournee({ jours: 3, equipe: [] });
    j = repondre(j, SITUATION_EPI.id, SITUATION_EPI.choix.findIndex(c => c.correct));
    const autres = j.taches.filter(t => t.type !== 'epi' && t.type !== 'recrutement');
    const geste = j.geste!;
    const juste = repondre(j, geste.id, geste.attendu), faux = repondre(j, geste.id, geste.attendu + 10 * geste.tolerance + 1);
    expect(bilanJournee(juste).note - bilanJournee(faux).note).toBe(Math.round(70 / autres.length));
  });
});
