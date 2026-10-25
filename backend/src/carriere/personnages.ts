// Personnages jouables du monde vivant (modèles 3D), miroir de frontend/src/lib/personnages-joueur.ts.
// Le choix est rangé dans Avatar.config.personnage : l'avatar 2D du mode classique en déduit son teint et ses cheveux.
export const PERSONNAGES_JOUEUR = ['combinaison', 'bleu-travail', 'tailleur', 'tenue-ville', 'jean', 'capuche', 'costume'] as const;
export type IdPersonnage = (typeof PERSONNAGES_JOUEUR)[number];
