import { describe, expect, it } from 'vitest';
import { coquePirogue, FORME_PIROGUE, MOTIFS_PIROGUES, sectionPirogue } from './coque-pirogue';

describe('la coque des pirogues', () => {
  it('s’effile aux deux bouts et y remonte, avec un fond légèrement relevé', () => {
    const milieu = sectionPirogue(0), bout = sectionPirogue(1);
    expect(milieu.demiLargeur).toBeCloseTo(FORME_PIROGUE.largeur / 2, 5);
    expect(bout.demiLargeur).toBe(0);
    expect(bout.platBord).toBeGreaterThan(milieu.platBord + .3);
    expect(bout.fond).toBeGreaterThan(milieu.fond);
    expect(sectionPirogue(.5).demiLargeur).toBeLessThan(milieu.demiLargeur);
  });

  it('tient dans son gabarit, une couleur par sommet, des faces complètes', () => {
    for (const motif of MOTIFS_PIROGUES) {
      const { positions, couleurs, indices } = coquePirogue(motif);
      expect(couleurs.length).toBe(positions.length);
      expect(indices.length % 3).toBe(0);
      expect(Math.max(...indices)).toBeLessThan(positions.length / 3);
      const xs = positions.filter((_, i) => i % 3 === 0), zs = positions.filter((_, i) => i % 3 === 2), ys = positions.filter((_, i) => i % 3 === 1);
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(FORME_PIROGUE.longueur, 5);
      expect(Math.max(...zs) - Math.min(...zs)).toBeLessThanOrEqual(FORME_PIROGUE.largeur + 1e-6);
      expect(Math.min(...ys)).toBeGreaterThan(0);
    }
  });
});
