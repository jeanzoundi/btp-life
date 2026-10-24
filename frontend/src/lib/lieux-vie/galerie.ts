// La Galerie des Palmiers : la galerie marchande du quartier, coiffeur, téléphonie, pressing, pâtisserie.
// Mécanique propre : la vitrine des réussites, qui expose les vrais badges et certificats du joueur
// (GET /users/me/badges, GET /users/me/certificats).
import { zone, type Assise } from '../navigation-plan';
import type { ArticleCarte, LieuVie } from '.';

export const ARTICLES_GALERIE: ArticleCarte[] = [
  { id: 'coiffure', nom: 'Coupe chez le coiffeur', detail: 'Coupe, contours, et la conversation du salon', categorie: 'service', action: 'social', prix: 1500, effets: { social: 10 }, moral: 8, preparation: 2, moralPrincipal: true, message: 'Une coupe nette chez le coiffeur : tu te sens prêt(e) pour un entretien.' },
  { id: 'credit-telephone', nom: 'Crédit téléphone', detail: 'Pour appeler la famille et les amis', categorie: 'service', action: 'social', prix: 500, effets: { social: 20 }, moral: 2, preparation: 1, message: 'Du crédit pour appeler la famille et les amis.' },
  { id: 'pressing', nom: 'Pressing de la tenue', detail: 'Lavée, repassée, prête pour lundi', categorie: 'service', action: 'social', prix: 1000, effets: { social: 5 }, moral: 4, preparation: 2, moralPrincipal: true, message: 'Ta tenue revient du pressing, impeccable.' },
  { id: 'patisserie', nom: 'Pâtisserie et café', detail: 'Croissant aux amandes, café crème', categorie: 'plat', action: 'repas', prix: 800, effets: { faim: 15, energie: 8 }, moral: 3, preparation: 2, message: 'Une pâtisserie et un café à la galerie.' },
];

export type BoutiqueGalerie = 'coiffeur' | 'telephonie' | 'pressing' | 'patisserie';

/** Chaque service se rend à sa boutique. */
export const BOUTIQUE_DE: Record<string, BoutiqueGalerie> = {
  coiffure: 'coiffeur', 'credit-telephone': 'telephonie', pressing: 'pressing', patisserie: 'patisserie',
};

/** Qui tient chaque boutique, et ce qu'on te dit quand c'est prêt. */
export const BOUTIQUES: Record<BoutiqueGalerie, { nom: string; role: string; pret: string }> = {
  coiffeur: { nom: 'Serge', role: 'Coiffeur · Salon Élégance', pret: 'Le fauteuil est libre : installe-toi au salon, Serge t’attend.' },
  telephonie: { nom: 'Kévin', role: 'Téléphonie et transferts', pret: 'Ton crédit est chargé : passe le récupérer à la téléphonie.' },
  pressing: { nom: 'Tantie Odile', role: 'Pressing du Plateau', pret: 'Ta tenue est repassée : récupère-la au pressing.' },
  patisserie: { nom: 'Madame Brou', role: 'Pâtisserie des Palmiers', pret: 'Ta pâtisserie t’attend au comptoir.' },
};

export const GALERIE: LieuVie = {
  slug: 'galerie-palmiers', nom: 'Galerie des Palmiers',
  accroche: 'La galerie du quartier : un coup de ciseaux, du crédit, une tenue repassée, et la vitrine de tes réussites.',
  hote: { nom: 'Madame Brou', role: 'Gérante de la galerie et de la pâtisserie' },
  horaires: { ouverture: 8, fermeture: 21 },
  carte: ARTICLES_GALERIE,
  plan: {
    ambiance: 'interieur', demiLargeur: 11, demiProfondeur: 8, depart: [0, 6.8],
    obstacles: [
      zone(-10.6, -5, -7.6, -5.4),      // salon de coiffure : fauteuils et miroirs
      zone(5, 10.6, -7.6, -6),          // comptoir du pressing
      zone(-10.6, -8.6, -1.6, 1.6),     // boutique de téléphonie
      zone(8.6, 10.6, -1.6, 1.6),       // comptoir de la pâtisserie
      zone(-1.5, 1.5, -2, -.5),         // vitrine des réussites
      zone(-4, -2, 4.4, 5),             // banc
    ],
    stations: { coiffeur: [-7.8, -4.6], pressing: [7.8, -5.2], telephonie: [-7.8, 0], patisserie: [7.8, 0], vitrine: [0, .3], mentor: [7.8, 0] },
    libelles: { coiffeur: 'Salon de coiffure', pressing: 'Pressing', telephonie: 'Téléphonie', patisserie: 'Pâtisserie', vitrine: 'Vitrine des réussites', mentor: 'Madame Brou' },
    mentor: { position: [9.6, 0], rotation: -Math.PI / 2 },
  },
};

/** Le fauteuil du coiffeur, tourné vers la caméra. */
export const ASSISE_COIFFEUR: Assise = { position: [-8, -6.3], rotation: 0 };
