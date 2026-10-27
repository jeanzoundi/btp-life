import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { facteurEnergieTravail, facteurPrix, facteurSocial, lireTraits } from './traits';
import { confortLogement, facteurFatigueOutils, lirePatrimoine } from './patrimoine';

// Système de besoins façon "jeu de simulation de vie" : six jauges qui se dégradent avec le temps et se
// restaurent par des actions. Deux horloges :
// - hors du monde vivant (mode classique, absence), le déclin suit le temps réel, calculé "paresseusement"
//   à la lecture pour fonctionner sans tâche planifiée — indispensable en environnement serverless (Vercel) ;
// - dans le monde vivant, il suit l'horloge du monde (une heure de jeu par minute réelle), dont le client
//   déclare les heures passées (passerTemps), comme le temps d'un jeu de simulation de vie.

export const JAUGES_BESOINS = ['energie', 'faim', 'social', 'moral', 'hygiene', 'divertissement'] as const;
export type Jauge = (typeof JAUGES_BESOINS)[number];

const TAUX_DECLIN_PAR_HEURE: Record<Jauge, number> = { energie: 4, faim: 6, social: 2, moral: 1, hygiene: 2, divertissement: 2 };
const HEURES_MAX_PRISES_EN_COMPTE = 72; // au-delà, on plafonne (éviter des écarts absurdes après une longue absence)

/** Par heure de jeu, dans le monde : une journée y dure 24 minutes réelles. Le client en garde un miroir
 * (frontend/src/lib/humeurs.ts) pour afficher le déclin entre deux déclarations et pour la démonstration. */
export const TAUX_DECLIN_MONDE: Record<Jauge, number> = { energie: 4, faim: 6, social: 3, moral: 1, hygiene: 4, divertissement: 4 };
/** Pendant le sommeil, l'énergie ne baisse pas et le reste baisse deux fois moins vite. */
const FACTEUR_SOMMEIL = 0.5;
/** Une déclaration couvre au plus une journée de jeu : une nuit, une attente, jamais davantage d'un coup. */
export const HEURES_MONDE_MAX = 24;

export type ActionBesoin = 'repos' | 'repas' | 'social' | 'hygiene' | 'divertissement';

// Manger, socialiser et sortir coûtent un peu d'argent réel (comme dans la vraie vie) ; dormir et se doucher
// chez soi restent gratuits. Ça donne une vraie raison de dépenser l'argent gagné en missions/chantiers.
const EFFETS_ACTION: Record<ActionBesoin, { cible: Exclude<Jauge, 'moral'>; valeur: number; bonusMoral: number; cout: number; message: string }> = {
  repos: { cible: 'energie', valeur: 100, bonusMoral: 4, cout: 0, message: 'Tu te sens reposé(e) et prêt(e) à repartir.' },
  repas: { cible: 'faim', valeur: 100, bonusMoral: 3, cout: 1200, message: 'Un bon repas, ça remet les idées en place.' },
  social: { cible: 'social', valeur: 100, bonusMoral: 6, cout: 900, message: 'Ça fait du bien de discuter un peu !' },
  hygiene: { cible: 'hygiene', valeur: 100, bonusMoral: 2, cout: 0, message: 'Une bonne douche : te voilà frais et dispo.' },
  divertissement: { cible: 'divertissement', valeur: 100, bonusMoral: 4, cout: 800, message: 'Une soirée détente entre amis : tu as bien ri.' },
};
export type JaugeBesoin = Exclude<Jauge, 'moral'>;

// Carte des lieux de vie (maquis, café, marché, marina, sport, commerces) : chaque article a son prix et
// AJOUTE des points aux jauges (entre 0 et 100 ; le sport en retire à l'énergie et à l'hygiène), là où l'action
// seule remet la jauge visée à 100. Le client en garde un miroir pour l'affichage et la démonstration :
// frontend/src/lib/lieux-vie/.
export interface ArticleCarte {
  action: ActionBesoin; prix: number; effets: Partial<Record<JaugeBesoin, number>>; moral: number; message: string;
  /** Au marché, le prix se discute : une remise jusqu'à REMISE_MAX. */
  marchandable?: boolean;
  /** Au sport, gagner le match rapporte un peu plus. */
  bonusVictoire?: { social: number; moral: number; message: string };
  /** Sport, balade, coiffeur : le moral est le vrai bénéfice ; l'article sert tant que le moral n'est pas au plus haut. */
  moralPrincipal?: boolean;
}
export const REMISE_MAX = 0.2;

export const CARTE: Record<string, ArticleCarte> = {
  // Le Maquis
  garba: { action: 'repas', prix: 1000, effets: { faim: 50 }, moral: 1, message: 'Un garba bien pimenté : attiéké, thon frit, oignons.' },
  'alloco-poisson': { action: 'repas', prix: 1500, effets: { faim: 60 }, moral: 2, message: 'Alloco doré et poisson frit : le classique de la pause.' },
  'attieke-carpe': { action: 'repas', prix: 2500, effets: { faim: 85 }, moral: 3, message: 'Attiéké et carpe braisée : tu repars rassasié(e).' },
  'foutou-graine': { action: 'repas', prix: 3000, effets: { faim: 100 }, moral: 3, message: 'Foutou banane et sauce graine : de quoi tenir jusqu’au soir.' },
  'poulet-braise': { action: 'repas', prix: 3500, effets: { faim: 100, social: 5, divertissement: 10 }, moral: 5, message: 'Poulet braisé et attiéké : le repas des grands jours.' },
  bissap: { action: 'repas', prix: 300, effets: { faim: 5, social: 5 }, moral: 1, message: 'Un bissap glacé, parfait sous la chaleur.' },
  gingembre: { action: 'repas', prix: 300, effets: { faim: 5, energie: 5 }, moral: 1, message: 'Le jus de gingembre de la maison : ça pique et ça réveille.' },
  // Le Café
  'cafe-noir': { action: 'social', prix: 300, effets: { energie: 15, social: 10 }, moral: 1, message: 'Un café serré au comptoir, et la conversation démarre.' },
  'the-menthe': { action: 'social', prix: 300, effets: { social: 20 }, moral: 1, message: 'Le thé à la menthe, servi en trois verres : on prend le temps.' },
  'jus-passion': { action: 'social', prix: 500, effets: { faim: 5, social: 15 }, moral: 2, message: 'Un jus de passion frais en terrasse.' },
  'cafe-croissant': { action: 'social', prix: 900, effets: { faim: 20, energie: 12, social: 10 }, moral: 2, message: 'Café et croissant : la pause des bâtisseurs.' },
  tournee: { action: 'social', prix: 2500, effets: { social: 60, divertissement: 20 }, moral: 6, message: 'Tu offres la tournée : toute la table trinque avec toi.' },
  // Le Marché des Jardins : tout se marchande
  mangues: { action: 'repas', prix: 300, effets: { faim: 12 }, moral: 1, marchandable: true, message: 'Des mangues bien mûres, le jus coule jusqu’aux coudes.' },
  ananas: { action: 'repas', prix: 500, effets: { faim: 20 }, moral: 1, marchandable: true, message: 'Un ananas pain de sucre, découpé sur place.' },
  'banane-braisee': { action: 'repas', prix: 500, effets: { faim: 30 }, moral: 2, marchandable: true, message: 'Banane braisée et arachides : le goûter du marché.' },
  choukouya: { action: 'repas', prix: 1500, effets: { faim: 55 }, moral: 3, marchandable: true, message: 'Choukouya de mouton, oignons et piment : ça se mange avec les doigts.' },
  'panier-fruits': { action: 'repas', prix: 2000, effets: { faim: 30, social: 25 }, moral: 4, marchandable: true, message: 'Un panier de fruits partagé avec l’équipe : tout le monde en redemande.' },
  // La Marina
  coco: { action: 'repas', prix: 500, effets: { faim: 5, energie: 5, social: 5, divertissement: 5 }, moral: 2, message: 'Une noix de coco fraîche, ouverte à la machette.' },
  'brochettes-crevettes': { action: 'repas', prix: 3000, effets: { faim: 70, social: 5, divertissement: 10 }, moral: 4, message: 'Brochettes de crevettes en terrasse, face à la lagune.' },
  pirogue: { action: 'social', prix: 2000, effets: { social: 35, energie: -5, divertissement: 45 }, moral: 8, moralPrincipal: true, message: 'Le tour de la lagune en pirogue : le vent du large remet les idées en place.' },
  // Le Complexe sportif : le sport fatigue et fait transpirer, mais il remonte le moral
  musculation: { action: 'social', prix: 1000, effets: { energie: -15, social: 5, hygiene: -20, divertissement: 10 }, moral: 10, moralPrincipal: true, message: 'Séance de musculation terminée : les bras tremblent, le moral est au beau fixe.' },
  footing: { action: 'social', prix: 300, effets: { energie: -10, social: 5, hygiene: -15, divertissement: 10 }, moral: 8, moralPrincipal: true, message: 'Footing au bord de la lagune : tu reviens léger(e).' },
  'match-foot': {
    action: 'social', prix: 500, effets: { energie: -20, social: 30, hygiene: -25, divertissement: 35 }, moral: 8, moralPrincipal: true, message: 'Le match à cinq avec les collègues est fini.',
    bonusVictoire: { social: 10, moral: 4, message: 'Et vous l’avez gagné aux tirs au but !' },
  },
  'jus-buvette': { action: 'repas', prix: 300, effets: { energie: 8, faim: 5 }, moral: 1, message: 'Un jus frais à la buvette, après l’effort.' },
  // Le Centre commercial Azur
  glace: { action: 'repas', prix: 1000, effets: { faim: 10, divertissement: 10 }, moral: 4, message: 'Une glace deux boules à l’ombre de la galerie climatisée.' },
  shawarma: { action: 'repas', prix: 2000, effets: { faim: 60 }, moral: 3, message: 'Un shawarma poulet bien garni.' },
  'cocktail-fruits': { action: 'repas', prix: 1200, effets: { faim: 15, energie: 5 }, moral: 3, message: 'Un cocktail de fruits frais, sans sucre ajouté.' },
  // La Galerie des Palmiers
  coiffure: { action: 'social', prix: 1500, effets: { social: 10, hygiene: 30 }, moral: 8, moralPrincipal: true, message: 'Une coupe nette chez le coiffeur : tu te sens prêt(e) pour un entretien.' },
  'credit-telephone': { action: 'social', prix: 500, effets: { social: 20, divertissement: 10 }, moral: 2, message: 'Du crédit pour appeler la famille et les amis.' },
  pressing: { action: 'social', prix: 1000, effets: { social: 5, hygiene: 20 }, moral: 4, moralPrincipal: true, message: 'Ta tenue revient du pressing, impeccable.' },
  patisserie: { action: 'repas', prix: 800, effets: { faim: 15, energie: 8 }, moral: 3, message: 'Une pâtisserie et un café à la galerie.' },
  // Chez soi, à la Résidence Lagune : cuisiner coûte moins cher que le maquis, recevoir un voisin aussi, la télé est gratuite.
  'cuisine-maison': { action: 'repas', prix: 600, effets: { faim: 55 }, moral: 2, message: 'Riz sauce arachide maison : simple, bon, et moins cher qu’au maquis.' },
  'voisin-maison': { action: 'social', prix: 700, effets: { social: 35, divertissement: 10 }, moral: 4, message: 'Ton voisin est passé boire un jus : vous avez refait le quartier.' },
  'tele-maison': { action: 'divertissement', prix: 0, effets: { divertissement: 30 }, moral: 1, message: 'Un bon match à la télé : tu souffles un peu.' },
  // Dormir en journée : une sieste de deux heures de jeu, qui ne vaut pas une nuit complète (l'action « repos »).
  'sieste-maison': { action: 'repos', prix: 0, effets: { energie: 35 }, moral: 1, message: 'Une petite sieste : tu repars avec un peu plus d’énergie.' },
};
/** Au maquis, manger à la table des collègues compte aussi pour le lien social. */
export const BONUS_TABLEE = { social: 20, moral: 2 };

/** Ce qui accompagne une commande : la tablée au maquis, la remise obtenue au marché, la victoire au match. */
export interface OptionsArticle { tablee?: boolean; remise?: number; victoire?: boolean }

/** Effets, moral et prix réels d'un article, selon les circonstances de la commande. */
export function effetArticle(article: ArticleCarte, options: OptionsArticle = {}) {
  const enEquipe = options.tablee === true && article.action === 'repas';
  const gagne = options.victoire === true && article.bonusVictoire !== undefined;
  const social = (article.effets.social ?? 0) + (enEquipe ? BONUS_TABLEE.social : 0) + (gagne ? article.bonusVictoire!.social : 0);
  const effets: Partial<Record<JaugeBesoin, number>> = { ...article.effets, ...(social ? { social } : {}) };
  const moral = article.moral + (enEquipe ? BONUS_TABLEE.moral : 0) + (gagne ? article.bonusVictoire!.moral : 0);
  // La remise ne vaut qu'au marché, plafonnée, et le prix s'arrondit aux 25 F comme chez une vendeuse.
  const remise = article.marchandable ? Math.max(0, Math.min(REMISE_MAX, options.remise ?? 0)) : 0;
  return { effets, moral, prix: Math.round(article.prix * (1 - remise) / 25) * 25, gagne };
}

/** Ce que les traits changent à un article : l'économe paie 10 % de moins (arrondi aux 25 F), le sociable se ressource
 * 50 % plus vite au contact des autres. */
export function selonTraits<T extends { effets: Partial<Record<JaugeBesoin, number>>; prix: number }>(article: T, traits: readonly string[]): T {
  const lus = lireTraits(traits);
  const social = article.effets.social;
  return {
    ...article,
    prix: Math.round(article.prix * facteurPrix(lus) / 25) * 25,
    effets: social && social > 0 ? { ...article.effets, social: Math.round(social * facteurSocial(lus)) } : article.effets,
  };
}

/** Le déclin de `heures` de jeu passées dans le monde, au rythme du monde (le sommeil épargne l'énergie). */
/** La météo du monde pèse sur les besoins quand on est debout dehors : l'harmattan salit (poussière), la pluie et l'orage
 * minent le moral, l'orage fatigue. Le sommeil, à l'abri, n'y est pas sensible. Même barème que le jeu (lib/humeurs.ts). */
export const METEOS_MONDE = ['soleil', 'nuageux', 'averse', 'orage', 'harmattan'] as const;
export type MeteoMonde = (typeof METEOS_MONDE)[number];
export const EFFETS_METEO_BESOINS: Partial<Record<MeteoMonde, Partial<Record<Jauge, number>>>> = {
  averse: { moral: 2 }, orage: { moral: 2, energie: 1.25 }, harmattan: { hygiene: 1.5 },
};

export function declinMonde(besoins: Record<Jauge, number>, heures: number, sommeil = false, meteo?: MeteoMonde): Record<Jauge, number> {
  return Object.fromEntries(JAUGES_BESOINS.map((j) => {
    const taux = sommeil ? (j === 'energie' ? 0 : TAUX_DECLIN_MONDE[j] * FACTEUR_SOMMEIL) : TAUX_DECLIN_MONDE[j] * (meteo ? EFFETS_METEO_BESOINS[meteo]?.[j] ?? 1 : 1);
    return [j, Math.max(0, Math.round(besoins[j] - taux * heures))];
  })) as Record<Jauge, number>;
}

/** En pleine forme : toutes les jauges à 70 ou plus. Les gains d'XP prennent alors 5 % de plus. */
export const SEUIL_PLEINE_FORME = 70;
export const BONUS_PLEINE_FORME = 0.05;
export const pleineForme = (b: Partial<Record<Jauge, number>>) =>
  JAUGES_BESOINS.every((j) => typeof b[j] === 'number' && (b[j] as number) >= SEUIL_PLEINE_FORME);

type CarriereBesoins = Record<Jauge, number> & { derniereMajBesoins: Date };

/** Déclin en temps réel, par heures entières : le reste attend la prochaine lecture au lieu de se perdre dans les
 * arrondis (sinon un moral à 1 point par heure ne baisserait jamais pour un joueur qui recharge souvent). */
function decliner(carriere: CarriereBesoins, maintenant: Date) {
  const ecoulees = Math.max(0, (maintenant.getTime() - carriere.derniereMajBesoins.getTime()) / 3_600_000);
  const heures = Math.min(HEURES_MAX_PRISES_EN_COMPTE, Math.floor(ecoulees));
  const jauges = Object.fromEntries(JAUGES_BESOINS.map((j) => [j, Math.max(0, Math.round(carriere[j] - TAUX_DECLIN_PAR_HEURE[j] * heures))]));
  const depuis = ecoulees > HEURES_MAX_PRISES_EN_COMPTE ? maintenant : new Date(carriere.derniereMajBesoins.getTime() + heures * 3_600_000);
  return { heures, jauges, depuis };
}

@Injectable()
export class BesoinsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Applique le déclin réel depuis la dernière mise à jour et persiste le résultat (rien à écrire avant une heure). */
  async actualiser(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    const { heures, jauges, depuis } = decliner(carriere, new Date());
    if (heures === 0) return carriere;
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { ...jauges, derniereMajBesoins: depuis },
    });
  }

  /** Le temps du monde vivant : `heures` de jeu passées (déclarées par le client, bornées à une journée). */
  async passerTemps(userId: string, heures: number, sommeil = false, meteo?: MeteoMonde) {
    const actualisee = await this.actualiser(userId);
    const duree = Math.max(0, Math.min(HEURES_MONDE_MAX, Number.isFinite(heures) ? heures : 0));
    if (duree === 0) return actualisee;
    return this.prisma.userCarriere.update({ where: { userId }, data: declinMonde(actualisee, duree, sommeil, meteo) });
  }

  async agir(userId: string, action: ActionBesoin, options: OptionsArticle & { article?: string } = {}) {
    if (!Object.prototype.hasOwnProperty.call(EFFETS_ACTION, action)) throw new BadRequestException('Action inconnue');
    if (options.article !== undefined) return this.consommerArticle(userId, action, options.article, options);
    const actualisee = await this.actualiser(userId);
    const effet = { ...EFFETS_ACTION[action], cout: Math.round(EFFETS_ACTION[action].cout * facteurPrix(lireTraits(actualisee.traits)) / 25) * 25 };
    const valeurActuelle = actualisee[effet.cible];
    if (valeurActuelle >= 98) {
      return { carriere: actualisee, message: "C'est déjà au maximum !", change: false, coutPaye: 0 };
    }
    if (effet.cout > 0 && actualisee.argentVirtuel < effet.cout) {
      throw new BadRequestException(
        `Pas assez d'argent : ${effet.cout.toLocaleString('fr-FR')} F requis (solde ${actualisee.argentVirtuel.toLocaleString('fr-FR')} F)`,
      );
    }

    const resultat = await this.prisma.userCarriere.updateMany({
      where: { userId, ...(effet.cout > 0 ? { argentVirtuel: { gte: effet.cout } } : {}) },
      data: {
        [effet.cible]: effet.valeur,
        // Au réveil, le confort du logement s'ajoute au moral (deux-pièces +4, villa +10).
        moral: Math.min(100, actualisee.moral + effet.bonusMoral + (action === 'repos' ? confortLogement(lirePatrimoine(actualisee.patrimoine, new Date())) : 0)),
        ...(effet.cout > 0 ? { argentVirtuel: { decrement: effet.cout } } : {}),
      },
    });
    if (resultat.count !== 1) {
      throw new BadRequestException("Solde modifié entre-temps : actualise la page puis réessaie");
    }
    const maj = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!maj) throw new NotFoundException('Carrière introuvable');
    return { carriere: maj, message: effet.message, change: true, coutPaye: effet.cout };
  }

  /** Un article de la carte : débit et effets dans la même écriture conditionnelle, comme l'action seule. */
  private async consommerArticle(userId: string, action: ActionBesoin, id: string, options: OptionsArticle) {
    const article = Object.prototype.hasOwnProperty.call(CARTE, id) ? CARTE[id] : undefined;
    if (!article || article.action !== action) throw new BadRequestException('Article inconnu');
    const base = effetArticle(article, options);
    const actualisee = await this.actualiser(userId);
    const { effets, moral, prix, gagne } = selonTraits(base, lireTraits(actualisee.traits));
    const jauges = Object.keys(effets) as JaugeBesoin[];
    // Ce qui fatigue n'est pas permis à bout de forces ; transpirer, si (l'hygiène s'arrête simplement à 0).
    if ((effets.energie ?? 0) < 0 && actualisee.energie + (effets.energie ?? 0) < 0) {
      throw new BadRequestException('Trop fatigué(e) pour ça : repose-toi d’abord.');
    }
    const positives = jauges.filter((j) => (effets[j] ?? 0) > 0);
    const utile = positives.some((j) => actualisee[j] < 98) || ((article.moralPrincipal || !positives.length) && actualisee.moral < 98);
    if (!utile) {
      return { carriere: actualisee, message: "Tu n'en as pas besoin pour l'instant !", change: false, coutPaye: 0 };
    }
    if (actualisee.argentVirtuel < prix) {
      throw new BadRequestException(
        `Pas assez d'argent : ${prix.toLocaleString('fr-FR')} F requis (solde ${actualisee.argentVirtuel.toLocaleString('fr-FR')} F)`,
      );
    }
    const resultat = await this.prisma.userCarriere.updateMany({
      where: { userId, argentVirtuel: { gte: prix } },
      data: {
        ...Object.fromEntries(jauges.map((j) => [j, Math.max(0, Math.min(100, actualisee[j] + (effets[j] ?? 0)))])),
        moral: Math.min(100, actualisee.moral + moral),
        argentVirtuel: { decrement: prix },
      },
    });
    if (resultat.count !== 1) {
      throw new BadRequestException("Solde modifié entre-temps : actualise la page puis réessaie");
    }
    const maj = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!maj) throw new NotFoundException('Carrière introuvable');
    return { carriere: maj, message: gagne && article.bonusVictoire ? `${article.message} ${article.bonusVictoire.message}` : article.message, change: true, coutPaye: prix };
  }

  /** Consommation d'énergie/faim par le jeu (missions, journées de chantier…) — sans dépasser 0. */
  async consommer(userId: string, delta: { energie?: number; faim?: number }, transaction?: Prisma.TransactionClient) {
    // L'appelant transactionnel a déjà actualisé les besoins avant sa transaction.
    const actualisee = transaction ? await transaction.userCarriere.findUnique({ where: { userId } }) : await this.actualiser(userId);
    if (!actualisee) throw new NotFoundException('Carrière introuvable');
    // Le bosseur tient mieux la cadence : 30 % de fatigue en moins au travail.
    // L'équipement de qualité (EPI haut de gamme) réduit aussi la fatigue.
    const fatigue = Math.round((delta.energie ?? 0) * facteurEnergieTravail(lireTraits(actualisee.traits)) * facteurFatigueOutils(lirePatrimoine(actualisee.patrimoine, new Date()).outils));
    return (transaction ?? this.prisma).userCarriere.update({
      where: { userId },
      data: {
        energie: Math.max(0, Math.min(100, actualisee.energie - fatigue)),
        faim: Math.max(0, Math.min(100, actualisee.faim - (delta.faim ?? 0))),
      },
    });
  }

  /** Facteur de performance appliqué aux gains d'XP : de 0,7 à 1,0 selon la moyenne des jauges, et 5 % de plus en
   * pleine forme. Une jauge absente (ancien appelant) ne compte pas dans la moyenne. */
  static facteurPerformance(b: Partial<Record<Jauge, number>>): number {
    const valeurs = JAUGES_BESOINS.map((j) => b[j]).filter((v): v is number => typeof v === 'number');
    const moyenne = valeurs.length ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : 100;
    return Math.max(0.7, Math.min(1, 0.7 + (moyenne / 100) * 0.3)) + (pleineForme(b) ? BONUS_PLEINE_FORME : 0);
  }
}
