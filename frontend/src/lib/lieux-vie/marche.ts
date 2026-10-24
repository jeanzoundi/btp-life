// Le Marché des Jardins : étals sous les bâches, fruits en pyramides, grillades de choukouya, banane braisée.
// Mécanique propre : le marchandage. On salue d'abord, on propose un prix ; la vendeuse accepte, contre-propose ou se fâche.
import { zone, type Assise } from '../navigation-plan';
import type { ArticleCarte, LieuVie } from '.';

export const ARTICLES_MARCHE: ArticleCarte[] = [
  { id: 'mangues', nom: 'Mangues', detail: 'Trois mangues greffées, bien mûres', categorie: 'plat', action: 'repas', prix: 300, effets: { faim: 12 }, moral: 1, preparation: 1, marchandable: true, message: 'Des mangues bien mûres, le jus coule jusqu’aux coudes.' },
  { id: 'ananas', nom: 'Ananas', detail: 'Pain de sucre, découpé devant toi', categorie: 'plat', action: 'repas', prix: 500, effets: { faim: 20 }, moral: 1, preparation: 2, marchandable: true, message: 'Un ananas pain de sucre, découpé sur place.' },
  { id: 'banane-braisee', nom: 'Banane braisée', detail: 'Plantain braisé et arachides grillées', categorie: 'plat', action: 'repas', prix: 500, effets: { faim: 30 }, moral: 2, preparation: 3, marchandable: true, message: 'Banane braisée et arachides : le goûter du marché.' },
  { id: 'choukouya', nom: 'Choukouya', detail: 'Mouton grillé, oignons, piment', categorie: 'plat', action: 'repas', prix: 1500, effets: { faim: 55 }, moral: 3, preparation: 4, marchandable: true, message: 'Choukouya de mouton, oignons et piment : ça se mange avec les doigts.' },
  { id: 'panier-fruits', nom: 'Panier de fruits', detail: 'Pour partager avec l’équipe', categorie: 'plat', action: 'repas', prix: 2000, effets: { faim: 30, social: 25 }, moral: 4, preparation: 2, marchandable: true, message: 'Un panier de fruits partagé avec l’équipe : tout le monde en redemande.' },
];

/** Les étals, chacun avec sa vendeuse et ce qu'elle vend ; « mentor » est l'étal de fruits de Maman Akoua. */
export const ETALS: Record<string, { vendeuse: string; articles: string[] }> = {
  mentor: { vendeuse: 'Maman Akoua', articles: ['mangues', 'ananas'] },
  choukouya: { vendeuse: 'Ibrahim, le braiseur', articles: ['choukouya'] },
  banane: { vendeuse: 'Tantie Rose', articles: ['banane-braisee'] },
  paniers: { vendeuse: 'Mariette, la vannière', articles: ['panier-fruits'] },
};

export const MARCHE: LieuVie = {
  slug: 'marche', nom: 'Marché des Jardins',
  accroche: 'Fruits, grillades et bonne humeur : ici, tout se discute, avec le sourire.',
  hote: { nom: 'Maman Akoua', role: 'Vendeuse de fruits, doyenne du marché' },
  horaires: { ouverture: 6, fermeture: 19 },
  carte: ARTICLES_MARCHE,
  plan: {
    ambiance: 'exterieur', demiLargeur: 13, demiProfondeur: 9, depart: [0, 7.8],
    obstacles: [
      ...[-6, -1, 4, 9].map(x => zone(x - 2, x + 2, -7.5, -5.2)), // étals du fond
      zone(-10, -6, -.8, .8),           // grill de choukouya
      zone(4, 8, -.8, .8),              // banane braisée
      zone(-6.5, -3.5, 4.7, 5.3),       // banc
      zone(6.5, 9.5, 4.2, 5.8),         // vannière et paniers
      zone(-12.4, -11, -2, 2),          // sacs de riz et d'oignons
    ],
    stations: { mentor: [-6, -4.4], choukouya: [-8, 1.7], banane: [6, 1.7], paniers: [8, 3.4], banc: [-5, 4] },
    libelles: { mentor: 'Fruits · Maman Akoua', choukouya: 'Choukouya', banane: 'Banane braisée', paniers: 'Paniers', banc: 'Banc' },
    mentor: { position: [-6, -6.7], rotation: 0 },
  },
};

/** On s'assoit sur le banc, face à la rue, pour manger ce qu'on a acheté. */
export const ASSISE_BANC: Assise = { position: [-5, 5], rotation: 0 };

export const OFFRES_MARCHANDAGE = [0, .1, .2, .35] as const;

/** Remise que la vendeuse accepte : un peu sans salut, bien plus quand on l'a saluée, et davantage en fin de journée. */
export const seuilVendeuse = (salue: boolean, heure: number) => .05 + (salue ? .1 : 0) + (heure >= 17 ? .05 : 0);

export type IssueMarchandage = 'accepte' | 'contre' | 'refuse';
/** Une offre dans la limite est acceptée ; un peu au-delà, elle contre-propose à sa limite ; trop loin, elle se fâche. */
export function proposer(offre: number, seuil: number): { issue: IssueMarchandage; remise: number } {
  if (offre <= seuil + 1e-9) return { issue: 'accepte', remise: offre };
  if (offre <= seuil + .15 + 1e-9) return { issue: 'contre', remise: seuil };
  return { issue: 'refuse', remise: 0 };
}
