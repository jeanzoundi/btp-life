// Le corrigé des journées sur le chantier du quartier, pour le serveur qui paie la journée avec Yao à partir des réponses
// brutes (backend/src/carriere/journees-corrige.json, régénéré par backend/scripts/generer-corrige-programmes.cjs). Une
// journée ne dépend que de son jour dans le programme ; le recrutement, jugé dans le navigateur, n'y figure pas.
import { nouvelleJournee, situation } from './journee-chantier';
import { TOTAL_JOURS } from './programme-chantier';

/** Une situation (le choix juste parmi les options), ou un geste (la valeur juste et sa tolérance). */
export type TacheCorrigee = { id: string; type: 'epi' | 'travail' | 'securite' | 'livraison'; options: boolean[] } | { id: string; type: 'geste'; attendu: number; tolerance: number };
export interface CorrigeJournees { totalJours: number; jours: Array<{ etape: string; taches: TacheCorrigee[] }> }

export function corrigeJournees(): CorrigeJournees {
  return {
    totalJours: TOTAL_JOURS,
    jours: Array.from({ length: TOTAL_JOURS }, (_, numero) => {
      const journee = nouvelleJournee({ jours: numero, equipe: [] });
      return {
        etape: journee.etape,
        taches: journee.taches.flatMap((t): TacheCorrigee[] => t.type === 'recrutement' ? []
          : t.type === 'geste' ? [{ id: t.id, type: 'geste', attendu: journee.geste!.attendu, tolerance: journee.geste!.tolerance }]
          : [{ id: t.id, type: t.type, options: situation(t.id)!.choix.map(c => c.correct) }]),
      };
    }),
  };
}
