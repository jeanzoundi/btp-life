/** Variations modérées, communes au plateau et à toutes les scènes du joueur. */
export const STATURES = { petite: { nom: 'Petite', facteur: .94 }, moyenne: { nom: 'Moyenne', facteur: 1 }, grande: { nom: 'Grande', facteur: 1.06 } } as const;
export const SILHOUETTES = { fine: { nom: 'Fine', facteur: .9 }, standard: { nom: 'Standard', facteur: 1 }, large: { nom: 'Large', facteur: 1.1 } } as const;
export type GabaritPersonnage = { stature: keyof typeof STATURES; silhouette: keyof typeof SILHOUETTES };
export function gabaritDepuis(config: unknown): GabaritPersonnage {
  const c = config && typeof config === 'object' ? config as Record<string, unknown> : {};
  return {
    stature: typeof c.stature === 'string' && Object.hasOwn(STATURES, c.stature) ? c.stature as GabaritPersonnage['stature'] : 'moyenne',
    silhouette: typeof c.silhouette === 'string' && Object.hasOwn(SILHOUETTES, c.silhouette) ? c.silhouette as GabaritPersonnage['silhouette'] : 'standard',
  };
}
export function echelleGabarit(config: unknown): [number, number, number] {
  const g = gabaritDepuis(config);
  return [SILHOUETTES[g.silhouette].facteur, STATURES[g.stature].facteur, SILHOUETTES[g.silhouette].facteur];
}
