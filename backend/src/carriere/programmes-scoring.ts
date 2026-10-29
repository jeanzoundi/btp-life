import { BadRequestException } from '@nestjs/common';
import corrige from './programmes-corrige.json';

// La correction des séances des lieux à mentor : la note vient des réponses brutes, corrigées ici avec le cycle du joueur,
// jamais d'une note déclarée par le navigateur. Le corrigé est la copie des programmes de l'interface
// (scripts/generer-corrige-programmes.cjs) ; les formules sont celles de frontend/src/lib/programme-lieu.ts.

export type ReponsesSeance = Record<string, number | number[]>;
interface Cle { reponse?: number; tolerance?: number; options?: boolean[] }
interface Tache { id: string; type: 'situation' | 'mesure' | 'selection'; cles: Cle[] }
const CORRIGE = corrige as unknown as Record<string, Tache[][]>;

export const nombreEtapesCorrigees = (slug: string) => CORRIGE[slug]?.length ?? 0;
const cleDuCycle = (t: Tache, cycle: number) => t.cles[Math.abs(Math.floor(cycle)) % t.cles.length];

export function corrigerSeance(slug: string, etape: number, cycle: number, brut: unknown) {
  const taches = CORRIGE[slug]?.[etape];
  if (!taches) throw new BadRequestException('Étape inconnue pour ce lieu');
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new BadRequestException('Réponses requises : recharge le jeu pour le mettre à jour.');
  const reponses = brut as ReponsesSeance;
  if (taches.some(t => !Object.prototype.hasOwnProperty.call(reponses, t.id))) throw new BadRequestException('Réponds à toutes les tâches de la séance');
  const scores = taches.map(t => {
    const cle = cleDuCycle(t, cycle), r = reponses[t.id];
    if (t.type === 'mesure') {
      if (typeof r !== 'number' || !Number.isFinite(r)) throw new BadRequestException('Mesure invalide');
      const ecart = Math.abs(r - cle.reponse!);
      return ecart <= cle.tolerance! ? 100 : ecart <= cle.tolerance! * 2 ? 50 : 0;
    }
    const options = cle.options!;
    if (t.type === 'situation') {
      if (typeof r !== 'number' || !Number.isInteger(r) || r < 0 || r >= options.length) throw new BadRequestException('Choix invalide');
      return options[r] ? 100 : 0;
    }
    if (!Array.isArray(r) || r.length > options.length || new Set(r).size !== r.length || r.some(i => !Number.isInteger(i) || i < 0 || i >= options.length)) {
      throw new BadRequestException('Sélection invalide');
    }
    const attendus = options.filter(Boolean).length;
    const points = r.reduce((s, i) => s + (options[i] ? 1 : -1), 0);
    return attendus ? Math.round(Math.max(0, Math.min(1, points / attendus)) * 100) : 0;
  });
  return { note: Math.round(10 + .9 * scores.reduce((s, n) => s + n, 0) / scores.length) };
}

/** Les réponses justes d'une séance (tests et scripts de vérification). */
export function reponsesParfaites(slug: string, etape: number, cycle: number): ReponsesSeance {
  return Object.fromEntries((CORRIGE[slug]?.[etape] ?? []).map(t => {
    const cle = cleDuCycle(t, cycle);
    if (t.type === 'mesure') return [t.id, cle.reponse!];
    const justes = cle.options!.flatMap((juste, i) => juste ? [i] : []);
    return [t.id, t.type === 'situation' ? justes[0] : justes];
  }));
}

/** Des réponses toutes fausses : mauvais choix, mesure hors tolérance, rien de coché (tests). */
export function reponsesFausses(slug: string, etape: number, cycle: number): ReponsesSeance {
  return Object.fromEntries((CORRIGE[slug]?.[etape] ?? []).map(t => {
    const cle = cleDuCycle(t, cycle);
    if (t.type === 'mesure') return [t.id, cle.reponse! + 1000 * (1 + cle.tolerance!)];
    return [t.id, t.type === 'situation' ? cle.options!.findIndex(juste => !juste) : []];
  }));
}
