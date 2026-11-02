import { describe, expect, it } from 'vitest';
import { ETAPES_PREMIERS_PAS, RECOMPENSES_PREMIERS_PAS, ajouterEtape, etapeOuverte, prochaineEtape, recompenseEtape } from './premiers-pas';

describe('la première journée guidée', () => {
  it('suit la journée : logement, première paie, compte vérifié, prochain objectif', () => {
    expect(ETAPES_PREMIERS_PAS.map(e => e.id)).toEqual(['logement', 'travail', 'paie', 'objectif']);
  });
  it('range les étapes faites dans l’ordre du guide, sans doublon, et désigne la suivante', () => {
    expect(ajouterEtape(['paie'], 'travail')).toEqual(['travail', 'paie']);
    expect(ajouterEtape(['logement'], 'logement')).toEqual(['logement']);
    expect(prochaineEtape(['travail'])?.id).toBe('logement');
    expect(prochaineEtape(['logement', 'travail'])?.id).toBe('paie');
    expect(prochaineEtape(ETAPES_PREMIERS_PAS.map(e => e.id))).toBeNull();
  });
  it('ne compte la paie vérifiée qu’après la première paie, et le prochain objectif qu’après la paie vérifiée', () => {
    expect(etapeOuverte([], 'logement')).toBe(true);
    expect(etapeOuverte([], 'travail')).toBe(true);
    expect(etapeOuverte(['logement'], 'paie')).toBe(false);
    expect(etapeOuverte(['travail'], 'paie')).toBe(true);
    expect(etapeOuverte(['travail'], 'objectif')).toBe(false);
    expect(etapeOuverte(['travail', 'paie'], 'objectif')).toBe(true);
  });
  it('récompense chaque étape comme le serveur, avec le bonus de fin pour la dernière', () => {
    expect(recompenseEtape(false)).toEqual(RECOMPENSES_PREMIERS_PAS.etape);
    expect(recompenseEtape(true)).toEqual({ argent: 2_500, xp: 65 });
  });
});
