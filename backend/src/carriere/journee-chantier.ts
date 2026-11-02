import { BadRequestException } from '@nestjs/common';
import corrige from './journees-corrige.json';

// La journée de travail avec Yao sur le chantier du quartier, payée par le serveur : la note vient du choix fait à chaque
// situation du jour et de la valeur relevée au geste du jour (mesure, tracé, aplomb, enrobage, défaut), corrigés ici,
// jamais d'une note envoyée par le jeu. Le corrigé est la copie du programme du chantier de
// l'interface (scripts/generer-corrige-programmes.cjs) ; les formules sont celles de frontend/src/lib/journee-chantier.ts.

type TacheCorrigee = { id: string; type: 'epi' | 'travail' | 'securite' | 'livraison'; options: boolean[] } | { id: string; type: 'geste'; attendu: number; tolerance: number };
const CORRIGE = corrige as unknown as { totalJours: number; jours: Array<{ etape: string; taches: TacheCorrigee[] }> };

export const TOTAL_JOURS_CHANTIER = CORRIGE.totalJours;
/** Une journée payée toutes les 20 minutes réelles au plus, comme une séance chez un mentor ; entre-temps, entraînement. */
export const DELAI_JOURNEE_MS = 20 * 60_000;
export const TAUX_ENTRAINEMENT_JOURNEE = 0.25;

/** Avancement du chantier du quartier : jours validés de l'ouvrage en cours, journées faites, ouvrages livrés. */
export interface ChantierQuartierServeur { jours: number; journees: number; livraisons: number; derniereRecompenseLe: string | null }

const entier = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
export function lireChantierQuartier(brut: unknown): ChantierQuartierServeur {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const le = typeof c.derniereRecompenseLe === 'string' && Number.isFinite(Date.parse(c.derniereRecompenseLe)) ? c.derniereRecompenseLe : null;
  return { jours: entier(c.jours, TOTAL_JOURS_CHANTIER), journees: entier(c.journees, 1_000_000), livraisons: entier(c.livraisons, 100_000), derniereRecompenseLe: le };
}

/** Le jour qu'on peut jouer : celui de l'ouvrage en cours ; après une livraison, un nouvel ouvrage repart du recrutement
 * (jour 0) ou, l'équipe étant au complet dans le navigateur, de l'implantation (jour 1). */
export const jourAttendu = (etat: Pick<ChantierQuartierServeur, 'jours'>, numero: number) =>
  etat.jours < TOTAL_JOURS_CHANTIER ? numero === etat.jours : numero === 0 || numero === 1;

/** Note sur 100 : présence 10, équipement 20, puis 70 points partagés entre les autres situations du jour. */
export function corrigerJournee(numero: number, brut: unknown) {
  const jour = CORRIGE.jours[numero];
  if (!jour) throw new BadRequestException('Jour de chantier inconnu');
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new BadRequestException('Réponses requises : recharge le jeu pour le mettre à jour.');
  const reponses = brut as Record<string, unknown>;
  if (jour.taches.some((t) => !Object.prototype.hasOwnProperty.call(reponses, t.id))) throw new BadRequestException('Fais toutes les tâches de la journée avant le bilan');
  const juste = (t: TacheCorrigee) => {
    const r = reponses[t.id];
    // Le geste : la valeur relevée, juste à la tolérance près.
    if (t.type === 'geste') {
      if (typeof r !== 'number' || !Number.isFinite(r) || Math.abs(r) > 10_000) throw new BadRequestException('Mesure invalide');
      return Math.abs(r - t.attendu) <= t.tolerance + 1e-9 ? 1 : 0;
    }
    if (typeof r !== 'number' || !Number.isInteger(r) || r < 0 || r >= t.options.length) throw new BadRequestException('Choix invalide');
    return t.options[r] ? 1 : 0;
  };
  const [epi, ...autres] = jour.taches;
  return { note: Math.round(10 + juste(epi) * 20 + (autres.length ? 70 * autres.reduce((n, t) => n + juste(t), 0) / autres.length : 70)) };
}

/** Validée à partir de 40 et payée seulement alors, comme une séance (valeurJournee côté jeu). */
export function gainsJournee(note: number) {
  const compte = note >= 40;
  return { compte, argent: compte ? 3000 + note * 40 : 0, xp: compte ? 20 + Math.round(note * 0.6) : Math.round(note * 0.2) };
}

/** Les réponses justes ou toutes fausses d'un jour (tests et scripts de vérification). */
export function reponsesJournee(numero: number, justes: boolean): Record<string, number> {
  return Object.fromEntries((CORRIGE.jours[numero]?.taches ?? []).map((t) => [t.id,
    t.type === 'geste' ? (justes ? t.attendu : t.attendu + 10 * t.tolerance + 1) : t.options.findIndex((o) => o === justes)]));
}
