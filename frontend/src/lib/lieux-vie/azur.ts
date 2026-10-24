// Le Centre commercial Azur : atrium climatisé, vitrines, escalier mécanique, espace restauration.
// Mécanique propre : la cabine d'essayage de la Boutique Lagune, branchée sur la vraie garde-robe du joueur
// (GET /carriere/avatar/dressing, POST /carriere/avatar/equiper).
import { zone, type Assise } from '../navigation-plan';
import type { ArticleCarte, LieuVie } from '.';

export const ARTICLES_AZUR: ArticleCarte[] = [
  { id: 'shawarma', nom: 'Shawarma poulet', detail: 'Pain libanais, crudités, sauce ail', categorie: 'plat', action: 'repas', prix: 2000, effets: { faim: 60 }, moral: 3, preparation: 4, message: 'Un shawarma poulet bien garni.' },
  { id: 'cocktail-fruits', nom: 'Cocktail de fruits', detail: 'Mangue, passion, ananas, sans sucre ajouté', categorie: 'boisson', action: 'repas', prix: 1200, effets: { faim: 15, energie: 5 }, moral: 3, preparation: 2, message: 'Un cocktail de fruits frais, sans sucre ajouté.' },
  { id: 'glace', nom: 'Glace deux boules', detail: 'Coco et mangue', categorie: 'plat', action: 'repas', prix: 1000, effets: { faim: 10 }, moral: 4, preparation: 1, message: 'Une glace deux boules à l’ombre de la galerie climatisée.' },
];

export const TABLES_AZUR: [number, number][] = [[2, -1], [6, -1], [2, 2.5], [6, 2.5]];

export const AZUR: LieuVie = {
  slug: 'centre-azur', nom: 'Centre commercial Azur',
  accroche: 'Vitrines, fraîcheur et espace restauration : la pause du samedi, et la boutique pour se mettre sur son trente-et-un.',
  hote: { nom: 'Mireille', role: 'Gérante de l’espace restauration' },
  horaires: { ouverture: 9, fermeture: 22 },
  carte: ARTICLES_AZUR,
  plan: {
    ambiance: 'interieur', demiLargeur: 13, demiProfondeur: 9, depart: [0, 7.8],
    obstacles: [
      zone(3, 11, -7.6, -6.2),          // comptoirs de l'espace restauration
      ...TABLES_AZUR.map(([x, z]) => zone(x - .8, x + .8, z - .8, z + .8)),
      zone(-12.4, -6, -7.6, -5.6),      // portants de la Boutique Lagune
      zone(-12.4, -10.4, -1, 1.6),      // cabine d'essayage
      zone(-2.4, 1.4, -9, -4.6),        // escalier mécanique
      zone(11.4, 13, 2, 6),             // vitrine de l'opticien
    ],
    stations: { comptoir: [7, -5.6], table: [6, 1.2], cabine: [-9.6, .3], mentor: [7, -5.6] },
    libelles: { comptoir: 'Espace restauration', table: 'Ta table', cabine: 'Cabine d’essayage', mentor: 'Mireille' },
    mentor: { position: [7, -7], rotation: 0 },
  },
};

export const ASSISE_AZUR: Assise = { position: [6, 1.95], rotation: 0 };
