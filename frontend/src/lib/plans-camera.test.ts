import { describe, expect, it } from 'vitest';
import { adoucir, planChapitre, positionPlan } from './plans-camera';
import { nouvelleReplique, presenceConcurrent, repliqueConcurrent } from './concurrent';

describe('les plans de caméra des chapitres', () => {
  it('démarre et finit en douceur, en tournant autour de l’immeuble qu’il regarde', () => {
    expect(adoucir(0)).toBe(0);
    expect(adoucir(.5)).toBe(.5);
    expect(adoucir(2)).toBe(1);
    const plan = planChapitre({ centre: [0, -78.5], chapitres: 3, total: 9, etape: 'Implantation', titreChantier: 'Résidence Akwaba' });
    expect(plan.titre).toBe('Résidence Akwaba · chapitre 3/9 validé');
    const debut = positionPlan(plan, 0), fin = positionPlan(plan, plan.duree);
    expect(debut.cible).toEqual([0, plan.hauteurCible, -78.5]);
    const distance = (p: [number, number, number]) => Math.hypot(p[0] - 0, p[2] + 78.5);
    expect(distance(debut.camera)).toBeCloseTo(plan.rayon * 1.15);
    expect(distance(fin.camera)).toBeCloseTo(plan.rayon * .95);
    expect(fin.camera[1]).toBeLessThan(debut.camera[1]);
  });
  it('fait un plan plus long et plus large pour la livraison', () => {
    const livraison = planChapitre({ centre: [0, -78.5], chapitres: 9, total: 9, etape: 'Livrée', titreChantier: 'Résidence Akwaba' });
    expect(livraison.titre).toBe('Résidence Akwaba · livrée !');
    expect(livraison.duree).toBeGreaterThan(planChapitre({ centre: [0, 0], chapitres: 1, total: 9, etape: '', titreChantier: '' }).duree);
  });
});

describe('le concurrent du fil rouge', () => {
  it('se manifeste une fois le marché gagné, avec la pique du dernier chapitre marquant', () => {
    expect(repliqueConcurrent(0)).toBeNull();
    expect(repliqueConcurrent(2)).toContain('Mme Touré vous a choisis');
    expect(repliqueConcurrent(5)).toContain('permis');
    expect(nouvelleReplique(5)).toBeNull();
    expect(nouvelleReplique(9)).toContain('Chapeau');
  });
  it('rôde devant la parcelle aux heures de chantier, jusqu’à la livraison', () => {
    expect(presenceConcurrent(0, 10)).toBe(false);
    expect(presenceConcurrent(4, 10)).toBe(true);
    expect(presenceConcurrent(4, 19)).toBe(false);
    expect(presenceConcurrent(9, 10)).toBe(false);
  });
});
