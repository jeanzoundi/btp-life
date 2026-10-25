// Personnages jouables du monde vivant (modèles 3D), miroir de frontend/src/lib/personnages-joueur.ts.
// Le choix est rangé dans Avatar.config.personnage : l'avatar 2D du mode classique en déduit son teint et ses cheveux.
export const PERSONNAGES_JOUEUR = ['combinaison', 'bleu-travail', 'tailleur', 'tenue-ville', 'jean', 'capuche', 'costume'] as const;
export type IdPersonnage = (typeof PERSONNAGES_JOUEUR)[number];

/** Couleurs de casque proposées par le créateur de personnage, miroir de frontend/src/lib/casques.ts. La couleur
 * va dans Avatar.config.casque, que lisent le portrait du mode classique et le modèle 3D (les casques du dressing
 * y écrivent aussi les leurs). */
export const COULEURS_CASQUE = ['#F5F0E6', '#F2C230', '#E8742B', '#2F6FB3', '#3F8F4E', '#C1502E'] as const;
