// Les gains de la démonstration, avec les règles du serveur pour que l'aperçu promette ce que paie la vraie partie : l'XP
// suit la forme du personnage (facteurForme, comme BesoinsService.facteurPerformance), et une même activité — une séance dans
// un lieu, la journée avec Yao — n'est payée qu'une fois toutes les 20 minutes réelles ; entre-temps, c'est un entraînement :
// un quart de l'XP, sans argent (LieuxService et JourneeChantierService, côté serveur).
import { facteurForme, type BesoinsComplets } from './humeurs';

export const DELAI_PAIE_MS = 20 * 60_000;
export const TAUX_ENTRAINEMENT = 0.25;

export interface GainsDemo { argent: number; xp: number; reputation: number; facteurBesoins: number; entrainement: boolean; prochaineRecompenseLe: string }

/** `dernierePaie` : l'instant de la dernière paie de cette activité dans la démonstration, s'il y en a eu une. */
export function gainsDemo(base: { paie: number; xp: number }, besoins: BesoinsComplets, dernierePaie: number | undefined, maintenant: number): GainsDemo {
  const payee = dernierePaie === undefined || maintenant - dernierePaie >= DELAI_PAIE_MS;
  const facteurBesoins = facteurForme(besoins);
  return {
    argent: payee ? base.paie : 0, xp: Math.round(base.xp * facteurBesoins * (payee ? 1 : TAUX_ENTRAINEMENT)), reputation: 0, facteurBesoins,
    entrainement: !payee, prochaineRecompenseLe: new Date((payee ? maintenant : dernierePaie!) + DELAI_PAIE_MS).toISOString(),
  };
}
