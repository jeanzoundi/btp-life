import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Système de besoins façon "jeu de simulation de vie" : quatre jauges qui se
// dégradent avec le temps réel écoulé et se restaurent par des actions.
// Le calcul est "paresseux" (à la lecture) pour fonctionner sans tâche planifiée
// — indispensable en environnement serverless (Vercel).

const TAUX_DECLIN_PAR_HEURE = { energie: 4, faim: 6, social: 2, moral: 1 };
const HEURES_MAX_PRISES_EN_COMPTE = 72; // au-delà, on plafonne (éviter des écarts absurdes après une longue absence)

export type ActionBesoin = 'repos' | 'repas' | 'social';

// Manger et socialiser coûtent un peu d'argent réel (comme dans la vraie vie) — seul le repos
// chez soi reste gratuit. Ça donne une vraie raison de dépenser l'argent gagné en missions/chantiers.
const EFFETS_ACTION: Record<ActionBesoin, { cible: 'energie' | 'faim' | 'social'; valeur: number; bonusMoral: number; cout: number; message: string }> = {
  repos: { cible: 'energie', valeur: 100, bonusMoral: 4, cout: 0, message: 'Tu te sens reposé(e) et prêt(e) à repartir.' },
  repas: { cible: 'faim', valeur: 100, bonusMoral: 3, cout: 1200, message: 'Un bon repas, ça remet les idées en place.' },
  social: { cible: 'social', valeur: 100, bonusMoral: 6, cout: 900, message: 'Ça fait du bien de discuter un peu !' },
};

export type JaugeBesoin = 'energie' | 'faim' | 'social';

// Carte des lieux de vie (maquis, café, marché, marina, sport, commerces) : chaque article a son prix et
// AJOUTE des points aux jauges (entre 0 et 100 ; le sport en retire à l'énergie), là où l'action seule
// remet la jauge visée à 100. Le client en garde un miroir pour l'affichage et la démonstration :
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
  'poulet-braise': { action: 'repas', prix: 3500, effets: { faim: 100, social: 5 }, moral: 5, message: 'Poulet braisé et attiéké : le repas des grands jours.' },
  bissap: { action: 'repas', prix: 300, effets: { faim: 5, social: 5 }, moral: 1, message: 'Un bissap glacé, parfait sous la chaleur.' },
  gingembre: { action: 'repas', prix: 300, effets: { faim: 5, energie: 5 }, moral: 1, message: 'Le jus de gingembre de la maison : ça pique et ça réveille.' },
  // Le Café
  'cafe-noir': { action: 'social', prix: 300, effets: { energie: 15, social: 10 }, moral: 1, message: 'Un café serré au comptoir, et la conversation démarre.' },
  'the-menthe': { action: 'social', prix: 300, effets: { social: 20 }, moral: 1, message: 'Le thé à la menthe, servi en trois verres : on prend le temps.' },
  'jus-passion': { action: 'social', prix: 500, effets: { faim: 5, social: 15 }, moral: 2, message: 'Un jus de passion frais en terrasse.' },
  'cafe-croissant': { action: 'social', prix: 900, effets: { faim: 20, energie: 12, social: 10 }, moral: 2, message: 'Café et croissant : la pause des bâtisseurs.' },
  tournee: { action: 'social', prix: 2500, effets: { social: 60 }, moral: 6, message: 'Tu offres la tournée : toute la table trinque avec toi.' },
  // Le Marché des Jardins : tout se marchande
  mangues: { action: 'repas', prix: 300, effets: { faim: 12 }, moral: 1, marchandable: true, message: 'Des mangues bien mûres, le jus coule jusqu’aux coudes.' },
  ananas: { action: 'repas', prix: 500, effets: { faim: 20 }, moral: 1, marchandable: true, message: 'Un ananas pain de sucre, découpé sur place.' },
  'banane-braisee': { action: 'repas', prix: 500, effets: { faim: 30 }, moral: 2, marchandable: true, message: 'Banane braisée et arachides : le goûter du marché.' },
  choukouya: { action: 'repas', prix: 1500, effets: { faim: 55 }, moral: 3, marchandable: true, message: 'Choukouya de mouton, oignons et piment : ça se mange avec les doigts.' },
  'panier-fruits': { action: 'repas', prix: 2000, effets: { faim: 30, social: 25 }, moral: 4, marchandable: true, message: 'Un panier de fruits partagé avec l’équipe : tout le monde en redemande.' },
  // La Marina
  coco: { action: 'repas', prix: 500, effets: { faim: 5, energie: 5, social: 5 }, moral: 2, message: 'Une noix de coco fraîche, ouverte à la machette.' },
  'brochettes-crevettes': { action: 'repas', prix: 3000, effets: { faim: 70, social: 5 }, moral: 4, message: 'Brochettes de crevettes en terrasse, face à la lagune.' },
  pirogue: { action: 'social', prix: 2000, effets: { social: 35, energie: -5 }, moral: 8, moralPrincipal: true, message: 'Le tour de la lagune en pirogue : le vent du large remet les idées en place.' },
  // Le Complexe sportif : le sport fatigue, mais il remonte le moral
  musculation: { action: 'social', prix: 1000, effets: { energie: -15, social: 5 }, moral: 10, moralPrincipal: true, message: 'Séance de musculation terminée : les bras tremblent, le moral est au beau fixe.' },
  footing: { action: 'social', prix: 300, effets: { energie: -10, social: 5 }, moral: 8, moralPrincipal: true, message: 'Footing au bord de la lagune : tu reviens léger(e).' },
  'match-foot': {
    action: 'social', prix: 500, effets: { energie: -20, social: 30 }, moral: 8, moralPrincipal: true, message: 'Le match à cinq avec les collègues est fini.',
    bonusVictoire: { social: 10, moral: 4, message: 'Et vous l’avez gagné aux tirs au but !' },
  },
  'jus-buvette': { action: 'repas', prix: 300, effets: { energie: 8, faim: 5 }, moral: 1, message: 'Un jus frais à la buvette, après l’effort.' },
  // Le Centre commercial Azur
  glace: { action: 'repas', prix: 1000, effets: { faim: 10 }, moral: 4, message: 'Une glace deux boules à l’ombre de la galerie climatisée.' },
  shawarma: { action: 'repas', prix: 2000, effets: { faim: 60 }, moral: 3, message: 'Un shawarma poulet bien garni.' },
  'cocktail-fruits': { action: 'repas', prix: 1200, effets: { faim: 15, energie: 5 }, moral: 3, message: 'Un cocktail de fruits frais, sans sucre ajouté.' },
  // La Galerie des Palmiers
  coiffure: { action: 'social', prix: 1500, effets: { social: 10 }, moral: 8, moralPrincipal: true, message: 'Une coupe nette chez le coiffeur : tu te sens prêt(e) pour un entretien.' },
  'credit-telephone': { action: 'social', prix: 500, effets: { social: 20 }, moral: 2, message: 'Du crédit pour appeler la famille et les amis.' },
  pressing: { action: 'social', prix: 1000, effets: { social: 5 }, moral: 4, moralPrincipal: true, message: 'Ta tenue revient du pressing, impeccable.' },
  patisserie: { action: 'repas', prix: 800, effets: { faim: 15, energie: 8 }, moral: 3, message: 'Une pâtisserie et un café à la galerie.' },
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

interface CarriereBesoins {
  energie: number;
  moral: number;
  faim: number;
  social: number;
  derniereMajBesoins: Date;
}

function decliner(carriere: CarriereBesoins, maintenant: Date) {
  const heuresEcoulees = Math.min(
    HEURES_MAX_PRISES_EN_COMPTE,
    Math.max(0, (maintenant.getTime() - carriere.derniereMajBesoins.getTime()) / 3_600_000),
  );
  return {
    energie: Math.max(0, Math.round(carriere.energie - TAUX_DECLIN_PAR_HEURE.energie * heuresEcoulees)),
    faim: Math.max(0, Math.round(carriere.faim - TAUX_DECLIN_PAR_HEURE.faim * heuresEcoulees)),
    social: Math.max(0, Math.round(carriere.social - TAUX_DECLIN_PAR_HEURE.social * heuresEcoulees)),
    moral: Math.max(0, Math.round(carriere.moral - TAUX_DECLIN_PAR_HEURE.moral * heuresEcoulees)),
  };
}

@Injectable()
export class BesoinsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Applique le déclin depuis la dernière mise à jour et persiste le résultat. */
  async actualiser(userId: string) {
    const carriere = await this.prisma.userCarriere.findUnique({ where: { userId } });
    if (!carriere) throw new NotFoundException('Carrière introuvable');
    const maintenant = new Date();
    const decline = decliner(carriere, maintenant);
    return this.prisma.userCarriere.update({
      where: { userId },
      data: { ...decline, derniereMajBesoins: maintenant },
    });
  }

  async agir(userId: string, action: ActionBesoin, options: OptionsArticle & { article?: string } = {}) {
    if (options.article !== undefined) return this.consommerArticle(userId, action, options.article, options);
    const effet = EFFETS_ACTION[action];
    if (!effet) throw new BadRequestException('Action inconnue');

    const actualisee = await this.actualiser(userId);
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
        moral: Math.min(100, actualisee.moral + effet.bonusMoral),
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
    const { effets, moral, prix, gagne } = effetArticle(article, options);
    const jauges = Object.keys(effets) as JaugeBesoin[];

    const actualisee = await this.actualiser(userId);
    // Ce qui fatigue n'est pas permis à bout de forces.
    if (jauges.some((j) => (effets[j] ?? 0) < 0 && actualisee[j] + (effets[j] ?? 0) < 0)) {
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
  async consommer(userId: string, delta: { energie?: number; faim?: number }) {
    const actualisee = await this.actualiser(userId);
    return this.prisma.userCarriere.update({
      where: { userId },
      data: {
        energie: Math.max(0, Math.min(100, actualisee.energie - (delta.energie ?? 0))),
        faim: Math.max(0, Math.min(100, actualisee.faim - (delta.faim ?? 0))),
      },
    });
  }

  /** Facteur de performance (0,7 à 1,0) appliqué aux gains d'XP selon l'état du personnage. */
  static facteurPerformance(b: { energie: number; moral: number; faim: number; social: number }): number {
    const moyenne = (b.energie + b.moral + b.faim + b.social) / 4;
    return Math.max(0.7, Math.min(1, 0.7 + (moyenne / 100) * 0.3));
  }
}
