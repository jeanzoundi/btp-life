// Le corrigé des séances des lieux, pour le serveur qui corrige lui-même les réponses (backend/src/carriere/
// programmes-corrige.json, régénéré par backend/scripts/generer-corrige-programmes.cjs). Le contenu d'une tâche dépend du
// cycle par `selon` (un modulo) : il revient donc périodiquement, et le corrigé garde une entrée par cycle de la période.
import { LIEUX_PROGRAMME } from './lieux-programme';
import type { ContenuTache } from './programme-lieu';

export type CleTache =
  | { reponse: number; tolerance: number }
  | { options: boolean[] };
export interface CorrigeTache { id: string; type: ContenuTache['type']; cles: CleTache[] }
/** Par lieu, par étape, chaque tâche et sa clé pour chaque cycle de sa période (cycle → cles[cycle % cles.length]). */
export type CorrigeProgrammes = Record<string, CorrigeTache[][]>;

/** Au-delà, la période n'est pas cherchée : une tâche qui ne se répète pas avant fait échouer le test du corrigé. */
const CYCLES_EXPLORES = 360;

function cle(contenu: ContenuTache): CleTache {
  if (contenu.type === 'mesure') return { reponse: contenu.mesure.reponse, tolerance: contenu.mesure.tolerance };
  return { options: contenu.type === 'situation' ? contenu.situation.choix.map(c => c.correct) : contenu.selection.options.map(o => o.attendu) };
}

function periode(cles: string[]) {
  for (let p = 1; p <= cles.length; p++) if (cles.every((c, i) => c === cles[i % p])) return p;
  return cles.length;
}

export function corrigeProgrammes(): CorrigeProgrammes {
  return Object.fromEntries(Object.entries(LIEUX_PROGRAMME).map(([slug, { programme }]) => [slug, programme.etapes.map(etape => etape.taches.map(t => {
    const contenus = Array.from({ length: CYCLES_EXPLORES }, (_, cycle) => t.contenu(cycle));
    const cles = contenus.map(c => JSON.stringify(cle(c)));
    const p = periode(cles);
    if (p === CYCLES_EXPLORES) throw new Error(`${slug}/${t.id} : contenu sans période sous ${CYCLES_EXPLORES} cycles`);
    return { id: t.id, type: contenus[0].type, cles: contenus.slice(0, p).map(cle) };
  }))]));
}
