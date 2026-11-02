// La journée continue de trois habitants : ils partent de chez eux, arrivent au travail, déjeunent assis à la terrasse du
// maquis, reprennent, puis sortent le soir avant de rentrer. Où ils sont se calcule d'après l'heure seule : celui qui
// arrive en cours de route les trouve en chemin, à la bonne place. Sans Three.js ni React.
import { bungalowChantier, postesChantier } from './journee-chantier';
import { siegeTerrasse } from './terrasse-maquis';

type PointMonde = [number, number];
export type PhasePnj = 'trajet' | 'travail' | 'pause' | 'soiree';
export interface Siege { position: PointMonde; orientation: number }

/** Un moment de la journée : un trajet (d'un point à un autre), ou une présence (des allées et venues, ou un siège). */
export interface PlagePnj {
  de: number; a: number; phase: PhasePnj; activite: string;
  depart?: PointMonde; arrivee?: PointMonde;
  allees?: PointMonde[]; siege?: Siege;
}

/** Ce que fait l'habitant à cette heure ; `avancee` (0 → 1) dit où il en est d'un trajet. */
export type EtapePnj = PlagePnj & { avancee: number };

// Les lieux de leur journée.
const POSTE_YAO = postesChantier([31, 22], 21, 15).yao;
const BASE_VIE = (() => { const b = bungalowChantier([31, 22], 21, 15); return [b.x, b.z + b.profondeur / 2 + 1.6] as PointMonde; })();
const RESIDENCE: PointMonde = [-31, 30];
const JARDINS: PointMonde = [-88, -25.5];
const DEPOT: PointMonde[] = [[36, 6.6], [48, 6.6]];
const CAMPUS: PointMonde[] = [[-36, -15.8], [-22, -15.8]];
const CAFE: PointMonde[] = [[5, -27.6], [15, -27.6]];
const assis = (table: number, chaise: number): Siege => { const s = siegeTerrasse(table, chaise); return { position: s.position, orientation: s.orientation }; };
// Yao et Koffi prennent la même table le soir ; Awa et Koffi déjeunent ensemble.
const SIEGE_YAO = assis(1, 0), SIEGE_KOFFI = assis(1, 2), SIEGE_KOFFI_MIDI = assis(0, 1), SIEGE_AWA_MIDI = assis(0, 3);

export const JOURNEES_PNJ: Record<string, PlagePnj[]> = {
  Yao: [
    { de: 5.4, a: 6, phase: 'trajet', activite: 'En route pour le chantier', depart: RESIDENCE, arrivee: POSTE_YAO },
    { de: 6, a: 12, phase: 'travail', activite: 'Au chantier', allees: [POSTE_YAO] },
    { de: 12, a: 13, phase: 'pause', activite: 'Pause à la base vie', allees: [BASE_VIE, [BASE_VIE[0] - 1.5, BASE_VIE[1]]] },
    { de: 13, a: 18, phase: 'travail', activite: 'Au chantier', allees: [POSTE_YAO] },
    { de: 18, a: 18.6, phase: 'trajet', activite: 'Direction le maquis', depart: POSTE_YAO, arrivee: SIEGE_YAO.position },
    { de: 18.6, a: 21.5, phase: 'soiree', activite: 'Au maquis', siege: SIEGE_YAO },
    { de: 21.5, a: 22, phase: 'trajet', activite: 'Rentre chez lui', depart: SIEGE_YAO.position, arrivee: RESIDENCE },
  ],
  Koffi: [
    { de: 5.4, a: 6, phase: 'trajet', activite: 'En route pour le dépôt', depart: RESIDENCE, arrivee: DEPOT[0] },
    { de: 6, a: 12, phase: 'travail', activite: 'Au dépôt', allees: DEPOT },
    { de: 12, a: 12.45, phase: 'trajet', activite: 'Pause déjeuner', depart: DEPOT[0], arrivee: SIEGE_KOFFI_MIDI.position },
    { de: 12.45, a: 13.1, phase: 'pause', activite: 'Déjeune au maquis', siege: SIEGE_KOFFI_MIDI },
    { de: 13.1, a: 13.55, phase: 'trajet', activite: 'Retour au dépôt', depart: SIEGE_KOFFI_MIDI.position, arrivee: DEPOT[0] },
    { de: 13.55, a: 18, phase: 'travail', activite: 'Au dépôt', allees: DEPOT },
    { de: 18, a: 18.5, phase: 'trajet', activite: 'Direction le maquis', depart: DEPOT[0], arrivee: SIEGE_KOFFI.position },
    { de: 18.5, a: 21, phase: 'soiree', activite: 'Au maquis', siege: SIEGE_KOFFI },
    { de: 21, a: 21.5, phase: 'trajet', activite: 'Rentre chez lui', depart: SIEGE_KOFFI.position, arrivee: RESIDENCE },
  ],
  Awa: [
    { de: 7.3, a: 8, phase: 'trajet', activite: 'En route pour le campus', depart: JARDINS, arrivee: CAMPUS[0] },
    { de: 8, a: 12, phase: 'travail', activite: 'Au campus', allees: CAMPUS },
    { de: 12, a: 12.45, phase: 'trajet', activite: 'Pause déjeuner', depart: CAMPUS[1], arrivee: SIEGE_AWA_MIDI.position },
    { de: 12.45, a: 13.1, phase: 'pause', activite: 'Déjeune au maquis', siege: SIEGE_AWA_MIDI },
    { de: 13.1, a: 13.6, phase: 'trajet', activite: 'Retour au campus', depart: SIEGE_AWA_MIDI.position, arrivee: CAMPUS[1] },
    { de: 13.6, a: 17, phase: 'travail', activite: 'Au campus', allees: CAMPUS },
    { de: 17, a: 17.4, phase: 'trajet', activite: 'Direction le café', depart: CAMPUS[1], arrivee: CAFE[0] },
    { de: 17.4, a: 21, phase: 'soiree', activite: 'Au café', allees: CAFE },
    { de: 21, a: 21.7, phase: 'trajet', activite: 'Rentre chez elle', depart: CAFE[0], arrivee: JARDINS },
  ],
};

/** L'étape de la journée à cette heure, ou rien : l'habitant est chez lui. */
export function etapePnj(nom: string, heure: number): EtapePnj | null {
  const h = ((heure % 24) + 24) % 24;
  const plage = (JOURNEES_PNJ[nom] ?? []).find(p => h >= p.de && h < p.a);
  return plage ? { ...plage, avancee: Math.min(1, Math.max(0, (h - plage.de) / (plage.a - plage.de))) } : null;
}

/** Le point d'un chemin (suite de points) à cette avancée (0 → 1), mesurée en distance parcourue, et la direction suivie. */
export function pointSurChemin(chemin: readonly PointMonde[], avancee: number): { point: PointMonde; cap: number } {
  if (chemin.length < 2) return { point: chemin[0] ?? [0, 0], cap: 0 };
  const longueurs = chemin.slice(1).map((p, i) => Math.hypot(p[0] - chemin[i][0], p[1] - chemin[i][1]));
  let reste = Math.min(1, Math.max(0, avancee)) * longueurs.reduce((s, l) => s + l, 0);
  for (let i = 0; i < longueurs.length; i++) {
    const [a, b] = [chemin[i], chemin[i + 1]];
    if (reste <= longueurs[i] || i === longueurs.length - 1) {
      const t = longueurs[i] ? Math.min(1, reste / longueurs[i]) : 1;
      return { point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], cap: Math.atan2(b[0] - a[0], b[1] - a[1]) };
    }
    reste -= longueurs[i];
  }
  return { point: chemin[chemin.length - 1], cap: 0 };
}

/** La longueur d'un chemin, en mètres. */
export const longueurChemin = (chemin: readonly PointMonde[]) => chemin.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - chemin[i][0], p[1] - chemin[i][1]), 0);
