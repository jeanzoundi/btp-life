// Chez soi, à la Résidence Lagune : cuisiner, recevoir un voisin, regarder la télé et faire la sieste, aux prix réels
// (CARTE du serveur), moins chers qu'au maquis et au café. Les meubles de l'appartement portent ces articles
// (objets-interieurs.ts).
import type { ArticleCarte } from '.';

export const ARTICLES_MAISON: ArticleCarte[] = [
  { id: 'cuisine-maison', nom: 'Cuisiner un repas', detail: 'Riz sauce arachide, fait maison', categorie: 'plat', action: 'repas', prix: 600, effets: { faim: 55 }, moral: 2, preparation: 0, message: 'Riz sauce arachide maison : simple, bon, et moins cher qu’au maquis.' },
  { id: 'voisin-maison', nom: 'Inviter un voisin', detail: 'Un jus de bissap et les nouvelles du quartier', categorie: 'boisson', action: 'social', prix: 700, effets: { social: 35, divertissement: 10 }, moral: 4, preparation: 0, message: 'Ton voisin est passé boire un jus : vous avez refait le quartier.' },
  { id: 'tele-maison', nom: 'Regarder la télévision', detail: 'Le match du soir, une heure de détente', categorie: 'activite', action: 'divertissement', prix: 0, effets: { divertissement: 30 }, moral: 1, preparation: 0, message: 'Un bon match à la télé : tu souffles un peu.' },
  { id: 'sieste-maison', nom: 'Faire une sieste', detail: 'Deux heures au calme, en journée', categorie: 'service', action: 'repos', prix: 0, effets: { energie: 35 }, moral: 1, preparation: 0, message: 'Une petite sieste : tu repars avec un peu plus d’énergie.' },
];

export const articleMaison = (id: string | undefined) => ARTICLES_MAISON.find(a => a.id === id);
