// Les heures de jeu passées dans le monde vivant, comptées pour les besoins : pas à pas avec l'horloge, ou d'un coup
// quand on attend ou qu'on dort. Le serveur les reçoit par heures entières (POST /carriere/temps-monde) et le reste
// attend la suite, pour qu'aucune fraction ne se perde dans les arrondis. Sans React : le monde s'en sert, les tests aussi.

export interface TempsMonde { eveil: number; sommeil: number }
export const AUCUN_TEMPS: TempsMonde = { eveil: 0, sommeil: 0 };

/** Heures de jeu d'une heure de l'horloge à une autre, en avançant (le lendemain si `apres` est déjà passée). */
export const ecartHorloge = (avant: number, apres: number) => ((apres - avant) % 24 + 24) % 24;

/** Un pas d'horloge fait cinq minutes de jeu ; au-delà d'une heure (onglet endormi, horloge recalée), il ne compte pas. */
export const PAS_HORLOGE_MAX = 1;

/** Ajoute des heures passées, éveillé ou endormi, et rend ce qu'il faut déclarer tout de suite : les heures entières. */
export function ajouterTemps(attente: TempsMonde, heures: number, sommeil = false): { attente: TempsMonde; aDeclarer: TempsMonde } {
  if (!(heures > 0)) return { attente, aDeclarer: AUCUN_TEMPS };
  const total = sommeil ? { ...attente, sommeil: attente.sommeil + heures } : { ...attente, eveil: attente.eveil + heures };
  const aDeclarer = { eveil: Math.floor(total.eveil), sommeil: Math.floor(total.sommeil) };
  return { attente: { eveil: total.eveil - aDeclarer.eveil, sommeil: total.sommeil - aDeclarer.sommeil }, aDeclarer };
}
