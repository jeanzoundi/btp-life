import { describe, expect, it } from 'vitest';
import { ETAPES_PREMIERS_PAS, RECOMPENSES_PREMIERS_PAS, ajouterEtape, prochaineEtape, recompenseEtape } from './premiers-pas';

describe('le premier quart d’heure guidé', () => {
  it('range les étapes faites dans l’ordre du guide, sans doublon, et désigne la suivante', () => {
    expect(ajouterEtape(['quartier'], 'telephone')).toEqual(['telephone', 'quartier']);
    expect(ajouterEtape(['telephone'], 'telephone')).toEqual(['telephone']);
    expect(prochaineEtape(['deplacement', 'telephone'])?.id).toBe('lieu');
    expect(prochaineEtape(ETAPES_PREMIERS_PAS.map(e => e.id))).toBeNull();
  });
  it('récompense chaque étape comme le serveur, avec le bonus de fin pour la dernière', () => {
    expect(recompenseEtape(false)).toEqual(RECOMPENSES_PREMIERS_PAS.etape);
    expect(recompenseEtape(true)).toEqual({ argent: 2_500, xp: 65 });
  });
});
