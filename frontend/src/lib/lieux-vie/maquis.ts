// Le maquis Chez Tantie Bintou : une cour à ciel ouvert, des tables en plastique, la braisière qui fume, la carte peinte au mur.
// On commande au comptoir, on mange à sa table ou avec les collègues du chantier, qui racontent les nouvelles du quartier.
import { zone, type Assise, type Point } from '../navigation-plan';
import type { ArticleCarte, Besoins, LieuVie } from '.';

export const ARTICLES_MAQUIS: ArticleCarte[] = [
  { id: 'garba', nom: 'Garba', detail: 'Attiéké, thon frit, piment et oignons', categorie: 'plat', action: 'repas', prix: 1000, effets: { faim: 50 }, moral: 1, preparation: 3, message: 'Un garba bien pimenté : attiéké, thon frit, oignons.' },
  { id: 'alloco-poisson', nom: 'Alloco poisson', detail: 'Banane plantain frite, poisson frit, piment', categorie: 'plat', action: 'repas', prix: 1500, effets: { faim: 60 }, moral: 2, preparation: 4, message: 'Alloco doré et poisson frit : le classique de la pause.' },
  { id: 'attieke-carpe', nom: 'Attiéké carpe braisée', detail: 'Carpe braisée au feu de bois, sauce tomate-oignon', categorie: 'plat', action: 'repas', prix: 2500, effets: { faim: 85 }, moral: 3, preparation: 6, message: 'Attiéké et carpe braisée : tu repars rassasié(e).' },
  { id: 'foutou-graine', nom: 'Foutou sauce graine', detail: 'Foutou banane pilé, sauce graine au poisson fumé', categorie: 'plat', action: 'repas', prix: 3000, effets: { faim: 100 }, moral: 3, preparation: 5, message: 'Foutou banane et sauce graine : de quoi tenir jusqu’au soir.' },
  { id: 'poulet-braise', nom: 'Poulet braisé', detail: 'Poulet bicyclette braisé, attiéké, piment frais', categorie: 'plat', action: 'repas', prix: 3500, effets: { faim: 100, social: 5 }, moral: 5, preparation: 7, message: 'Poulet braisé et attiéké : le repas des grands jours.' },
  { id: 'bissap', nom: 'Bissap glacé', detail: 'Fleurs d’hibiscus et menthe, bien frais', categorie: 'boisson', action: 'repas', prix: 300, effets: { faim: 5, social: 5 }, moral: 1, preparation: 1, message: 'Un bissap glacé, parfait sous la chaleur.' },
  { id: 'gingembre', nom: 'Jus de gingembre', detail: 'Pressé maison : ça pique et ça réveille', categorie: 'boisson', action: 'repas', prix: 300, effets: { faim: 5, energie: 5 }, moral: 1, preparation: 1, message: 'Le jus de gingembre de la maison : ça pique et ça réveille.' },
];

/** Tables de la cour (centre de chaque table) ; la tienne est la deuxième du second rang. */
export const TABLES_MAQUIS: Point[] = [[-7, -2.2], [-3, -2.2], [1, -2.2], [-7, 1.4], [-3, 1.4], [1, 1.4]];

export const MAQUIS: LieuVie = {
  slug: 'maquis', nom: 'Maquis Chez Tantie Bintou',
  accroche: 'Garba, alloco et poisson braisé : à midi, tout le quartier se retrouve dans la cour.',
  hote: { nom: 'Tantie Bintou', role: 'Patronne du maquis' },
  horaires: { ouverture: 10, fermeture: 23 },
  carte: ARTICLES_MAQUIS,
  plan: {
    ambiance: 'exterieur', demiLargeur: 12, demiProfondeur: 8, depart: [0, 6.8],
    obstacles: [
      zone(-6.4, 2.4, -8, -4.9), // cuisine et comptoir, sous l'auvent
      zone(-10, -7.4, -6.6, -4.6), // braisière
      zone(3.6, 9.4, -8, -6.1), // bar, réfrigérateur et caisse
      ...TABLES_MAQUIS.map(([x, z]) => zone(x - .85, x + .85, z - .85, z + .85)),
      zone(5.8, 9.8, -1.5, 1.3), // table des collègues
      zone(-10.4, -8.8, 4.5, 5.9), // lave-mains
      zone(-11.4, -10.2, -1.1, .1), // tronc du manguier, le long du mur ouest
      zone(8.6, 11.4, 4.6, 7.4), // casiers de bouteilles et banc, coin sud-est
    ],
    stations: { comptoir: [-2, -4.2], table: [-3, 2.7], collegues: [7.2, 1.8], 'lave-mains': [-9.6, 3.9], mentor: [-2, -4.2] },
    libelles: { comptoir: 'Comptoir', table: 'Ta table', collegues: 'Table des collègues', 'lave-mains': 'Lave-mains', mentor: 'Tantie Bintou' },
    mentor: { position: [-2, -6.3], rotation: 0 },
  },
};

/** Places assises : à ta table, ou côté sud de la table des collègues, face à eux. */
export const ASSISES_MAQUIS: Record<'table' | 'collegues', Assise> = {
  table: { position: [-3, 2.05], rotation: Math.PI },
  collegues: { position: [6.9, .52], rotation: Math.PI },
};

/** Table des collègues : une longue table, trois places côté nord (face à toi), deux côté sud dont la tienne. */
export const TABLE_COLLEGUES = { centre: [7.8, -.1] as Point, largeur: 3, profondeur: .9 };

/** Les collègues du chantier mangent ici à midi et après le travail. */
export const COLLEGUES_PRESENTS = (heure: number) => (heure >= 11.5 && heure < 14.5) || (heure >= 17 && heure < 22);

export interface Nouvelle { qui: string; texte: string; lieu: string; aller: string }
/** Les nouvelles du quartier, racontées à la table des collègues : chacune renvoie vers un lieu où l'on peut agir. */
export const NOUVELLES: Nouvelle[] = [
  { qui: 'Konan, ferrailleur', lieu: 'laboratoire', aller: 'Aller au laboratoire', texte: 'Adjoua, au labo, cherche quelqu’un de carré pour ses éprouvettes. Elle explique tout, et ses séances sans faute sont bien payées.' },
  { qui: 'Seydou, maçon', lieu: 'fournisseur', aller: 'Aller au dépôt', texte: 'Le dépôt de Brou a reçu du CPJ 45. Si tu prépares une commande, pèse avant de charger : un camion du quartier a pris une amende pour surcharge.' },
  { qui: 'Ama, cheffe d’équipe', lieu: 'mairie', aller: 'Aller à la mairie', texte: 'Pour un permis, va voir Akissi à la mairie le matin. Un dossier complet passe vite ; après 16 h, le guichet est fermé.' },
  { qui: 'Konan, ferrailleur', lieu: 'chantier', aller: 'Aller au chantier', texte: 'Yao veut tout le monde à 6 h demain au Grand chantier : on attaque une nouvelle étape, il aura besoin de bras.' },
  { qui: 'Ama, cheffe d’équipe', lieu: 'universite', aller: 'Aller à l’université', texte: 'À l’université, le cours de béton armé vaut le détour. Même Yao l’a suivi deux fois, et il en parle encore.' },
  { qui: 'Seydou, maçon', lieu: 'banque', aller: 'Aller à la banque', texte: 'Mets un peu de côté à la banque : l’épargne rapporte chaque jour, et pour lancer ton propre chantier il faut un apport.' },
  { qui: 'Ama, cheffe d’équipe', lieu: 'agence', aller: 'Aller à l’agence', texte: 'L’agence des talents a affiché de nouvelles offres. Regarde le niveau demandé : certaines sont à ta portée.' },
  { qui: 'Konan, ferrailleur', lieu: 'cafe', aller: 'Aller au café', texte: 'Après 17 h, les architectes et les patrons de PME prennent un verre au café. C’est là que se font les contacts.' },
  { qui: 'Seydou, maçon', lieu: 'atelier', aller: 'Aller à l’atelier', texte: 'À l’atelier de formation, ils montrent comment faire un métré sur tableur. Ça fait gagner des heures sur un devis.' },
  { qui: 'Ama, cheffe d’équipe', lieu: 'bureau-etudes', aller: 'Aller chez les ingénieurs', texte: 'À la Maison des ingénieurs, ils calculent les poutres du nouveau groupe scolaire. Passe les voir, ils aiment expliquer.' },
];
const NOUVELLE_REPOS: Nouvelle = { qui: 'Ama, cheffe d’équipe', lieu: 'residence', aller: 'Rentrer dormir', texte: 'Tu as les yeux qui piquent ! Va dormir un peu : un bâtisseur fatigué fait des erreurs, et ça se paie sur le chantier.' };

/** Nouvelle du repas : la fatigue passe avant tout ; sinon chacune à son tour. */
export function nouvelleDuRepas(besoins: Pick<Besoins, 'energie'>, rang: number): Nouvelle {
  if (besoins.energie < 35) return NOUVELLE_REPOS;
  return NOUVELLES[((Math.floor(rang) % NOUVELLES.length) + NOUVELLES.length) % NOUVELLES.length];
}
