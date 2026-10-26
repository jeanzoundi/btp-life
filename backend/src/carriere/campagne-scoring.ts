import { BadRequestException } from '@nestjs/common';
import corrige from './campagne-corrige.json';

export type ReponsesChapitre = Record<string, number | number[]>;

/** La note vient des réponses brutes, jamais d'un score déclaré par le navigateur. */
export function corrigerChapitre(chapitre: number, brut: unknown) {
  const taches = corrige[chapitre];
  if (!Number.isInteger(chapitre) || !taches) throw new BadRequestException('Chapitre inconnu');
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new BadRequestException('Réponses requises');
  const reponses = brut as ReponsesChapitre;
  if (Object.keys(reponses).length !== taches.length || taches.some(t => !Object.prototype.hasOwnProperty.call(reponses, t.id))) {
    throw new BadRequestException('Réponds à toutes les tâches du chapitre');
  }
  const scores = taches.map(t => {
    const r = reponses[t.id];
    if (t.type === 'mesure') {
      if (typeof r !== 'number' || !Number.isFinite(r)) throw new BadRequestException('Mesure invalide');
      const ecart = Math.abs(r - t.reponse!);
      return ecart <= t.tolerance! ? 100 : ecart <= t.tolerance! * 2 ? 50 : 0;
    }
    const options = t.options!;
    if (t.type === 'situation') {
      if (typeof r !== 'number' || !Number.isInteger(r) || r < 0 || r >= options.length) throw new BadRequestException('Choix invalide');
      return options[r] ? 100 : 0;
    }
    if (!Array.isArray(r) || r.length > options.length || new Set(r).size !== r.length || r.some(i => !Number.isInteger(i) || i < 0 || i >= options.length)) {
      throw new BadRequestException('Sélection invalide');
    }
    const points = r.reduce((s, i) => s + (options[i] ? 1 : -1), 0);
    return Math.round(Math.max(0, Math.min(1, points / options.filter(Boolean).length)) * 100);
  });
  return { note: Math.round(10 + .9 * scores.reduce((s, n) => s + n, 0) / scores.length), reponses };
}
