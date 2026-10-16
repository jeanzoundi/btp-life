import { describe, expect, it } from 'vitest';
import { positionsVieInterieure, PROFILS_INTERIEURS, type TypeVieInterieure } from './vie-interieure';

describe('vie des intérieurs', () => {
  it('limite la population pour les performances mobiles', () => {
    for (const [type, profil] of Object.entries(PROFILS_INTERIEURS)) {
      expect(profil.personnes).toBeGreaterThanOrEqual(1);
      expect(profil.personnes).toBeLessThanOrEqual(3);
      expect(positionsVieInterieure(type as TypeVieInterieure)).toHaveLength(profil.personnes);
    }
  });
  it('place les figurants dans le couloir libre près de l’entrée', () => {
    for (const type of Object.keys(PROFILS_INTERIEURS) as TypeVieInterieure[]) for (const p of positionsVieInterieure(type)) {
      expect(Math.abs(p.depart[0])).toBeLessThan(3);
      expect(p.depart[1]).toBeGreaterThan(3.5);
    }
  });
});
