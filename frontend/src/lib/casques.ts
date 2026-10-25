// La couleur du casque de chantier : un seul choix pour le portrait du mode classique (`Avatar.config.casque`), le
// casque du modèle 3D réaliste et la version stylisée vue de loin. Miroir du serveur : COULEURS_CASQUE
// (backend/src/carriere/personnages.ts). Les casques gagnés au dressing gardent leur propre couleur.

export const CASQUES = [
  { couleur: '#F5F0E6', nom: 'Blanc', usage: 'Encadrement et visiteurs' },
  { couleur: '#F2C230', nom: 'Jaune', usage: 'Compagnons et ouvriers' },
  { couleur: '#E8742B', nom: 'Orange', usage: 'Routes et signalisation' },
  { couleur: '#2F6FB3', nom: 'Bleu', usage: 'Techniciens et électriciens' },
  { couleur: '#3F8F4E', nom: 'Vert', usage: 'Sécurité et secourisme' },
  { couleur: '#C1502E', nom: 'Rouge', usage: 'Équipes d’intervention' },
] as const;

export const CASQUE_DEFAUT = CASQUES[0].couleur;

/** Une couleur de la palette du créateur (celles que le serveur accepte au choix du personnage). */
export const estCouleurCasque = (couleur: unknown): couleur is string => CASQUES.some(c => c.couleur === couleur);

/** La couleur du casque d'une configuration d'avatar (palette du créateur ou casque du dressing), ou null. */
export function couleurCasque(config: unknown): string | null {
  const c = config && typeof config === 'object' ? (config as { casque?: unknown }).casque : undefined;
  return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : null;
}
