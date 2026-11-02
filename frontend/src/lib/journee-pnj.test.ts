import { describe, expect, it } from 'vitest';
import { etapePnj, JOURNEES_PNJ, longueurChemin, pointSurChemin } from './journee-pnj';
import { siegeTerrasse } from './terrasse-maquis';

describe('la journée continue des habitants', () => {
  it('enchaîne trajet du matin, travail, pause assise, reprise, soirée et retour, sans trou ni chevauchement', () => {
    for (const [nom, plages] of Object.entries(JOURNEES_PNJ)) {
      for (let i = 1; i < plages.length; i++) expect(plages[i].de, nom).toBe(plages[i - 1].a);
      const phases = plages.map(p => p.phase);
      expect(phases[0], nom).toBe('trajet');
      expect(phases.at(-1), nom).toBe('trajet');
      expect(phases, nom).toContain('travail');
      expect(phases.includes('pause') || nom === 'Yao', nom).toBe(true);
      // Chaque trajet part de là où l'habitant était, et arrive là où il va (le premier part de chez lui, le dernier y rentre).
      const lieux = (q: (typeof plages)[number]) => q.siege ? [q.siege.position] : q.allees ?? [];
      plages.forEach((p, i) => {
        if (p.phase !== 'trajet') return;
        expect(p.depart && p.arrivee, nom).toBeTruthy();
        if (i > 0) expect(lieux(plages[i - 1]), nom).toContainEqual(p.depart);
        if (i < plages.length - 1) expect(lieux(plages[i + 1]), nom).toContainEqual(p.arrivee);
      });
    }
  });
  it('trouve Koffi en chemin à l’heure du déjeuner, puis assis à la terrasse du maquis', () => {
    expect(etapePnj('Koffi', 12.2)).toMatchObject({ phase: 'trajet', activite: 'Pause déjeuner' });
    expect(etapePnj('Koffi', 12.2)!.avancee).toBeCloseTo(.2 / .45);
    const pause = etapePnj('Koffi', 12.7)!;
    expect(pause.phase).toBe('pause');
    expect(pause.siege!.position).toEqual(siegeTerrasse(0, 1).position);
    expect(etapePnj('Koffi', 3)).toBeNull();
    expect(etapePnj('Yao', 9)?.activite).toBe('Au chantier');
    expect(etapePnj('Yao', 19)?.siege).toBeDefined();
    expect(etapePnj('Inconnu', 10)).toBeNull();
  });
  it('fait marcher à une allure humaine à vitesse normale (une heure de jeu par minute réelle)', () => {
    for (const plages of Object.values(JOURNEES_PNJ)) for (const p of plages.filter(q => q.phase === 'trajet')) {
      const metres = Math.hypot(p.arrivee![0] - p.depart![0], p.arrivee![1] - p.depart![1]);
      const secondes = (p.a - p.de) * 60;
      expect(metres / secondes).toBeLessThan(3.2);
    }
  });
  it('avance le long d’un chemin à la distance parcourue, et dit dans quelle direction', () => {
    const chemin: [number, number][] = [[0, 0], [10, 0], [10, 10]];
    expect(longueurChemin(chemin)).toBe(20);
    expect(pointSurChemin(chemin, .25).point).toEqual([5, 0]);
    expect(pointSurChemin(chemin, .75)).toMatchObject({ point: [10, 5] });
    expect(pointSurChemin(chemin, .75).cap).toBeCloseTo(0);
    expect(pointSurChemin(chemin, .25).cap).toBeCloseTo(Math.PI / 2);
    expect(pointSurChemin(chemin, 2).point).toEqual([10, 10]);
    expect(pointSurChemin([[3, 4]], .5).point).toEqual([3, 4]);
  });
});
