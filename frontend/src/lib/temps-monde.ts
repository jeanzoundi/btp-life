// Les heures de jeu passées dans le monde vivant, comptées pour les besoins : pas à pas avec l'horloge, ou d'un coup
// quand on attend ou qu'on dort. Le serveur les reçoit par heures entières (POST /carriere/temps-monde) et le reste
// attend la suite, pour qu'aucune fraction ne se perde dans les arrondis. Sans React : le monde s'en sert, les tests aussi.

export interface TempsMonde { eveil: number; sommeil: number }
export const AUCUN_TEMPS: TempsMonde = { eveil: 0, sommeil: 0 };

/** Heures de jeu d'une heure de l'horloge à une autre, en avançant (le lendemain si `apres` est déjà passée). */
export const ecartHorloge = (avant: number, apres: number) => ((apres - avant) % 24 + 24) % 24;

/** L'heure commune du quartier : la même pour tous les joueurs connectés, tirée de l'horloge réelle à la vitesse du monde
 * (une heure de jeu par minute réelle, une journée en 24 minutes). Elle ne s'arrête ni ne saute : on ne peut pas mettre en
 * pause ou avancer le temps des autres. La démonstration, seule, garde son horloge à elle. */
export const MS_PAR_HEURE_COMMUNE = 60_000;
export const heureCommune = (instantMs: number) => ((instantMs / MS_PAR_HEURE_COMMUNE) % 24 + 24) % 24;
/** Minutes réelles avant qu'il soit `cible` à l'heure commune (le lendemain si elle est passée), arrondies au-dessus. */
export const minutesAvantHeure = (instantMs: number, cible: number) => Math.ceil(ecartHorloge(heureCommune(instantMs), cible) * MS_PAR_HEURE_COMMUNE / 60_000);

/** Un pas d'horloge fait cinq minutes de jeu ; au-delà d'une heure (onglet endormi, horloge recalée), il ne compte pas. */
export const PAS_HORLOGE_MAX = 1;

/** Les heures de besoins d'un pas d'horloge. À ×2 ou ×3, l'horloge défile plus vite, mais le personnage ne s'use pas plus
 * vite que le temps réel passé à jouer : sinon, accélérer coûterait deux ou trois fois plus de repas par heure réelle,
 * alors que séances et journées ne se paient qu'une fois toutes les 20 minutes réelles. Les sauts voulus (attendre,
 * dormir, un trajet) comptent, eux, en entier. */
export const heuresDeBesoins = (heuresHorloge: number, vitesse: number) => heuresHorloge / Math.max(1, vitesse);

/** Ajoute des heures passées, éveillé ou endormi, et rend ce qu'il faut déclarer tout de suite : les heures entières. */
export function ajouterTemps(attente: TempsMonde, heures: number, sommeil = false): { attente: TempsMonde; aDeclarer: TempsMonde } {
  if (!(heures > 0)) return { attente, aDeclarer: AUCUN_TEMPS };
  const total = sommeil ? { ...attente, sommeil: attente.sommeil + heures } : { ...attente, eveil: attente.eveil + heures };
  const aDeclarer = { eveil: Math.floor(total.eveil), sommeil: Math.floor(total.sommeil) };
  return { attente: { eveil: total.eveil - aDeclarer.eveil, sommeil: total.sommeil - aDeclarer.sommeil }, aDeclarer };
}
