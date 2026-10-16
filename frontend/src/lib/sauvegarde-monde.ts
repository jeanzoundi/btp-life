import type { ModeJeuId } from './modes-jeu';

export interface EtatMonde {
  version: number;
  position: { x: number; z: number };
  quartier: string;
  relations: Record<string, number>;
  mode: ModeJeuId;
  etapeMode: number;
  score: number;
  secondes: number | null;
  heure: number;
  heureCalculeeLe?: string;
  pause: boolean;
  decouvertes: string[];
  records: Partial<Record<ModeJeuId, number>>;
  sauvegardeLe?: string | null;
}

function dateValide(value?: string | null) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function cleSauvegardeMonde(userId?: string | null) {
  return `btp-life-monde-v2:${userId || 'session'}`;
}

export function choisirEtatMondeRecent(serveur?: EtatMonde, local?: EtatMonde | null) {
  if (!serveur) return local ?? undefined;
  if (!local) return serveur;
  return dateValide(local.sauvegardeLe) > dateValide(serveur.sauvegardeLe) ? local : serveur;
}

/** Rejoue le passage du temps réel depuis la dernière sauvegarde.
 * Dans le monde, 60 secondes réelles correspondent à une heure de jeu. */
export function appliquerTempsEcoule(etat: EtatMonde, maintenant = Date.now()): EtatMonde {
  const sauvegarde = dateValide(etat.sauvegardeLe);
  const origineHeure = dateValide(etat.heureCalculeeLe) || sauvegarde;
  const heure = typeof etat.heure === 'number' && Number.isFinite(etat.heure) ? etat.heure : 16;
  const normalise = { ...etat, heure, pause: etat.pause === true };
  if (!sauvegarde || normalise.pause) return normalise;
  const ecouleSec = Math.max(0, Math.floor((maintenant - sauvegarde) / 1000));
  return {
    ...normalise,
    heure: ((heure + Math.max(0, maintenant - origineHeure) / 60000) % 24 + 24) % 24,
    secondes: normalise.secondes === null ? null : Math.max(0, normalise.secondes - ecouleSec),
  };
}

export function avancerHorloge(origine: { heure: number; instant: number; pause: boolean }, maintenant: number) {
  return { heure: (origine.heure + (origine.pause ? 0 : Math.max(0, maintenant - origine.instant) / 60000)) % 24, instant: maintenant, pause: origine.pause };
}

export function peutRestaurerMonde(fetched: boolean, fetching: boolean, error: boolean, localDisponible = false) {
  return fetched && !fetching && (!error || localDisponible);
}

export function chargerEtatMondeLocal(userId?: string | null): EtatMonde | null {
  if (typeof window === 'undefined') return null;
  try {
    const brut = window.localStorage.getItem(cleSauvegardeMonde(userId));
    return brut ? JSON.parse(brut) as EtatMonde : null;
  } catch {
    return null;
  }
}

export function sauvegarderEtatMondeLocal(userId: string | null | undefined, etat: EtatMonde) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cleSauvegardeMonde(userId), JSON.stringify(etat));
  } catch {
    // Le serveur reste la source de secours si le stockage privé est indisponible.
  }
}
