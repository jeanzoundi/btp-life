import { ETAPES_LIEUX } from './lieux.service';
import { corrigerSeance, nombreEtapesCorrigees, reponsesFausses, reponsesParfaites } from './programmes-scoring';

describe('corrigerSeance', () => {
  it('a un corrigé pour chaque étape de chaque lieu à mentor', () => {
    for (const [slug, total] of Object.entries(ETAPES_LIEUX)) expect(nombreEtapesCorrigees(slug)).toBe(total);
  });

  it('donne 100 au sans-faute et 10 (la présence) quand tout est faux, à chaque étape et d’un cycle à l’autre', () => {
    for (const [slug, total] of Object.entries(ETAPES_LIEUX)) {
      for (let etape = 0; etape < total; etape++) {
        for (const cycle of [0, 1, 2, 3, 7]) {
          expect(corrigerSeance(slug, etape, cycle, reponsesParfaites(slug, etape, cycle)).note).toBe(100);
          expect(corrigerSeance(slug, etape, cycle, reponsesFausses(slug, etape, cycle)).note).toBe(10);
        }
      }
    }
  });

  it('compte une mesure juste dans la tolérance, la moitié à deux tolérances, et suit le cycle', () => {
    // Laboratoire, étape 1 : l'affaissement (7,5 cm ± 0,2 au premier cycle, 9 cm au deuxième) et deux situations justes.
    const justes = reponsesParfaites('laboratoire', 1, 0);
    expect(corrigerSeance('laboratoire', 1, 0, { ...justes, affaissement: 7.6 }).note).toBe(100);
    expect(corrigerSeance('laboratoire', 1, 0, { ...justes, affaissement: 7.85 }).note).toBe(85);
    expect(corrigerSeance('laboratoire', 1, 0, { ...justes, affaissement: 8.2 }).note).toBe(70);
    expect(corrigerSeance('laboratoire', 1, 1, justes).note).toBe(70);
    // La période est de quatre cycles : le cinquième reprend les chiffres du premier.
    expect(corrigerSeance('laboratoire', 1, 4, justes).note).toBe(100);
  });

  it('compte une sélection en bons choix moins intrus, sur le nombre de pièces attendues', () => {
    // Fournisseur, étape 2 : quatre lignes de commande attendues (0, 2, 4, 6) parmi huit, et une autre tâche juste.
    const justes = reponsesParfaites('fournisseur', 2, 0);
    expect(corrigerSeance('fournisseur', 2, 0, { ...justes, commande: [6, 4, 2, 0] }).note).toBe(100);
    expect(corrigerSeance('fournisseur', 2, 0, { ...justes, commande: [0, 2, 1] }).note).toBe(66);
    expect(corrigerSeance('fournisseur', 2, 0, { ...justes, commande: [1, 3, 5, 7] }).note).toBe(55);
  });

  it('refuse des réponses absentes, incomplètes ou impossibles', () => {
    const justes = reponsesParfaites('laboratoire', 1, 0);
    const sansMesure: Record<string, unknown> = { ...justes };
    delete sansMesure.affaissement;
    expect(() => corrigerSeance('laboratoire', 1, 0, undefined)).toThrow('recharge le jeu');
    expect(() => corrigerSeance('laboratoire', 1, 0, 100)).toThrow('recharge le jeu');
    expect(() => corrigerSeance('laboratoire', 1, 0, { note: 100 })).toThrow('Réponds à toutes les tâches');
    expect(() => corrigerSeance('laboratoire', 1, 0, sansMesure)).toThrow('Réponds à toutes les tâches');
    expect(() => corrigerSeance('laboratoire', 1, 0, { ...justes, affaissement: 'beaucoup' })).toThrow('Mesure invalide');
    expect(() => corrigerSeance('laboratoire', 1, 0, { ...justes, toupie: 7 })).toThrow('Choix invalide');
    expect(() => corrigerSeance('laboratoire', 1, 0, { ...justes, toupie: 0.5 })).toThrow('Choix invalide');
    const commande = reponsesParfaites('fournisseur', 2, 0);
    expect(() => corrigerSeance('fournisseur', 2, 0, { ...commande, commande: [0, 0, 2] })).toThrow('Sélection invalide');
    expect(() => corrigerSeance('fournisseur', 2, 0, { ...commande, commande: [0, 8] })).toThrow('Sélection invalide');
    expect(() => corrigerSeance('laboratoire', 9, 0, justes)).toThrow('Étape inconnue');
    expect(() => corrigerSeance('casino', 0, 0, justes)).toThrow('Étape inconnue');
  });
});
