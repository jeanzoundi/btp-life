// L'affinité avec les habitants du quartier (0 à 100), par paliers cohérents : 20, 50 et 80. Chaque palier change le ton
// de la conversation et ouvre quelque chose de plus. Les gains viennent des échanges (faire connaissance, bien répondre à une
// situation du quartier), une fois par conversation ; le sociable progresse plus vite.

export interface PalierAffinite { seuil: number; nom: string; ouvre: string }
export const PALIERS_AFFINITE: readonly PalierAffinite[] = [
  { seuil: 0, nom: 'Connaissance', ouvre: 'Un bonjour, un conseil de base.' },
  { seuil: 20, nom: 'Bonne entente', ouvre: 'Ses conseils de métier, plus précis.' },
  { seuil: 50, nom: 'Ami·e', ouvre: 'Il ou elle t’appelle pour te prévenir des bonnes occasions.' },
  { seuil: 80, nom: 'Proche', ouvre: 'Ta meilleure recommandation dans le quartier.' },
];
/** Ce que rapporte chaque échange, avant le facteur du sociable. */
export const GAINS_AFFINITE = { connaissance: 4, bonneReponse: 6, mauvaiseReponse: 1 } as const;

const borne = (v: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(v) ? v : 0)));

export function palierAffinite(affinite: number): PalierAffinite {
  const a = borne(affinite);
  return [...PALIERS_AFFINITE].reverse().find(p => a >= p.seuil) ?? PALIERS_AFFINITE[0];
}
/** Le palier suivant et les points qui manquent pour l'atteindre (rien au dernier palier). */
export function prochainPalier(affinite: number): { palier: PalierAffinite; manque: number } | null {
  const a = borne(affinite);
  const p = PALIERS_AFFINITE.find(x => x.seuil > a);
  return p ? { palier: p, manque: p.seuil - a } : null;
}
/** Nouvelle affinité après un échange. */
export const gagnerAffinite = (affinite: number, gain: number, facteur = 1) => borne(affinite + gain * facteur);
/** Libellé de la relation pour l'en-tête d'une conversation. */
export const libelleRelation = (affinite: number) => affinite <= 0 ? 'Première rencontre' : palierAffinite(affinite).nom;
