// Chez soi, à la Résidence Lagune : cuisiner et recevoir un voisin, aux prix réels (CARTE du serveur), moins chers
// qu'au maquis et au café. Les meubles de l'appartement portent ces articles (objets-interieurs.ts).
import type { ArticleCarte } from '.';

export const ARTICLES_MAISON: ArticleCarte[] = [
  { id: 'cuisine-maison', nom: 'Cuisiner un repas', detail: 'Riz sauce arachide, fait maison', categorie: 'plat', action: 'repas', prix: 600, effets: { faim: 55 }, moral: 2, preparation: 0, message: 'Riz sauce arachide maison : simple, bon, et moins cher qu’au maquis.' },
  { id: 'voisin-maison', nom: 'Inviter un voisin', detail: 'Un jus de bissap et les nouvelles du quartier', categorie: 'boisson', action: 'social', prix: 700, effets: { social: 35 }, moral: 4, preparation: 0, message: 'Ton voisin est passé boire un jus : vous avez refait le quartier.' },
];

export const articleMaison = (id: string | undefined) => ARTICLES_MAISON.find(a => a.id === id);
