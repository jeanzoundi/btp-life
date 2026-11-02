import { describe, expect, it } from 'vitest';
import { DELAI_PAIE_MS } from './gains-demo';
import { TAUX_DECLIN_MONDE } from './humeurs';
import { valeurJournee } from './journee-chantier';
import { ARTICLES_MAQUIS } from './lieux-vie/maquis';
import { valeurNote } from './programme-lieu';
import { heuresDeBesoins } from './temps-monde';

// L'équilibre d'une heure réelle de jeu aux trois vitesses de l'horloge. Une heure de jeu passe en une minute réelle à ×1 ;
// les besoins suivent le temps réel joué (heuresDeBesoins), et séances comme journées se paient au plus une fois toutes les
// 20 minutes réelles (côté serveur et dans la démonstration).
const VITESSES = [1, 2, 3];
const garba = ARTICLES_MAQUIS.find(a => a.id === 'garba')!;
const faimParHeureReelle = (vitesse: number) => TAUX_DECLIN_MONDE.faim * heuresDeBesoins(60 * vitesse, vitesse);
const repasParHeureReelle = (vitesse: number) => faimParHeureReelle(vitesse) / garba.effets.faim! * garba.prix;

describe('économie selon la vitesse du temps', () => {
  it('le personnage a faim au même rythme réel à ×1, ×2 et ×3 : accélérer ne coûte pas plus de repas', () => {
    expect(VITESSES.map(faimParHeureReelle)).toEqual([360, 360, 360]);
    expect(VITESSES.map(repasParHeureReelle)).toEqual([7200, 7200, 7200]);
  });
  it('les sauts voulus (attendre, dormir, un trajet) comptent en entier : seul le défilement de l’horloge est ramené au temps réel', () => {
    expect(heuresDeBesoins(1, 3)).toBeCloseTo(1 / 3);
    expect(heuresDeBesoins(1, 1)).toBe(1);
  });
  it('un joueur qui travaille gagne plus qu’il ne mange, quelle que soit la vitesse', () => {
    const paiesParHeure = 3_600_000 / DELAI_PAIE_MS;
    const journees = paiesParHeure * valeurJournee(100).paie, seance = paiesParHeure * valeurNote(100).paie;
    // Trois journées payées par heure réelle au plus (21 000 F), plus les séances de chaque lieu (6 000 F par lieu).
    expect([journees, seance]).toEqual([21_000, 6_000]);
    for (const vitesse of VITESSES) expect(journees).toBeGreaterThan(repasParHeureReelle(vitesse) * 2);
    // Une journée moyenne (note 70 : 5 800 F) paie déjà presque une heure de repas.
    expect(valeurJournee(70).paie).toBe(5800);
  });
});
