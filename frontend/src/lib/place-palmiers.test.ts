import { describe, expect, it } from 'vitest';
import { BOUTIQUES_PALMIERS, degagerPositionPalmiers, EMPRISES_PALMIERS } from './place-palmiers';
import { itineraireVille, passageLibre, type PointVille } from './itineraire-ville';

describe('place des Palmiers : implantation et sauvegardes', () => {
  it('protège les trois boutiques et les deux étals', () => {
    expect(BOUTIQUES_PALMIERS).toHaveLength(3);
    expect(EMPRISES_PALMIERS).toHaveLength(5);
    for (const obstacle of EMPRISES_PALMIERS) {
      const centre: PointVille = [obstacle.x, obstacle.z];
      expect(passageLibre(centre, centre, EMPRISES_PALMIERS)).toBe(false);
      expect(itineraireVille([0, 0], centre, EMPRISES_PALMIERS)).toEqual([]);
    }
  });

  it('conserve le passage central nord-sud et le trottoir devant les commerces', () => {
    expect(passageLibre([0, -30], [0, 20], EMPRISES_PALMIERS)).toBe(true);
    expect(passageLibre([-20, -15], [24, -15], EMPRISES_PALMIERS)).toBe(true);
  });

  it('contourne les étals sans traverser leurs emprises', () => {
    const depart: PointVille = [-30, 0], arrivee: PointVille = [30, 0];
    const trajet = itineraireVille(depart, arrivee, EMPRISES_PALMIERS);
    expect(trajet.length).toBeGreaterThan(1);
    expect(trajet.at(-1)).toEqual(arrivee);
    let precedent = depart;
    for (const point of trajet) {
      expect(passageLibre(precedent, point, EMPRISES_PALMIERS)).toBe(true);
      precedent = point;
    }
  });

  it('ne modifie pas une sauvegarde située en dehors des nouvelles emprises', () => {
    const position: PointVille = [0, 5];
    expect(degagerPositionPalmiers(position)).toBe(position);
  });

  it('replace une ancienne sauvegarde sur un trottoir libre, y compris près des angles', () => {
    for (const obstacle of EMPRISES_PALMIERS) {
      for (const dx of [0, -obstacle.largeur / 2 - .8, obstacle.largeur / 2 + .8]) {
        const avant: PointVille = [obstacle.x + dx, obstacle.z];
        const apres = degagerPositionPalmiers(avant);
        expect(apres).not.toEqual(avant);
        expect(passageLibre(apres, apres, EMPRISES_PALMIERS)).toBe(true);
        expect(degagerPositionPalmiers(apres)).toEqual(apres);
      }
    }
  });
});
