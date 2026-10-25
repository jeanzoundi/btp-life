// Lieux de vie du quartier (maquis, café, marché, marina, sport, commerces) : on y entretient ses besoins avec de vrais
// articles payés sur son solde, et chacun a sa mécanique propre : la table des collègues au maquis, le réseau au café,
// le marchandage au marché, la pirogue à la marina, les tirs au but au complexe sportif. Sans Three.js ni React.
import type { PlanLieu } from '../programme-lieu';

export type JaugeBesoin = 'energie' | 'faim' | 'social' | 'hygiene' | 'divertissement';
export interface Besoins { energie: number; faim: number; social: number; moral: number; hygiene: number; divertissement: number }

/** Article d'une carte : miroir de CARTE (backend/src/carriere/besoins.service.ts), pour l'affichage et la démonstration. */
export interface ArticleCarte {
  id: string; nom: string; detail: string; categorie: 'plat' | 'boisson' | 'activite' | 'service';
  /** Action serveur qui porte l'article : POST /carriere/besoins/:action, corps { article }. */
  action: 'repas' | 'social' | 'divertissement' | 'repos';
  /** Effets sur les jauges : positifs, ou négatifs pour ce qui fatigue et fait transpirer (le sport). */
  prix: number; effets: Partial<Record<JaugeBesoin, number>>; moral: number;
  /** Temps de préparation, en secondes réelles. */
  preparation: number;
  /** Temps passé sur place, en secondes réelles, quand il diffère de la catégorie (le tour en pirogue). */
  duree?: number;
  /** Ce que dit le serveur une fois l'article consommé. */
  message: string;
  /** Au marché, le prix se discute (remise plafonnée à REMISE_MAX par le serveur). */
  marchandable?: boolean;
  /** Au sport, gagner le match rapporte un peu plus. */
  bonusVictoire?: { social: number; moral: number; message: string };
  /** Sport, balade, coiffeur : le moral est le vrai bénéfice ; l'article sert tant que le moral n'est pas au plus haut. */
  moralPrincipal?: boolean;
}

/** Au maquis, manger à la table des collègues compte aussi pour le lien social (BONUS_TABLEE côté serveur). */
export const BONUS_TABLEE = { social: 20, moral: 2 };
export const REMISE_MAX = .2;
/** Ce qui accompagne une commande : la tablée au maquis, la remise obtenue au marché, la victoire au match. */
export interface OptionsArticle { tablee?: boolean; remise?: number; victoire?: boolean }

export interface LieuVie {
  slug: string; nom: string; accroche: string;
  hote: { nom: string; role: string };
  horaires: { ouverture: number; fermeture: number };
  carte: ArticleCarte[]; plan: PlanLieu;
}

const borne = (v: number) => Math.max(0, Math.min(100, v));

/** Jauges touchées par un article, avec les bonus de la tablée (repas) et de la victoire (match). */
export function effetsArticle(article: ArticleCarte, options: OptionsArticle = {}): Partial<Record<JaugeBesoin, number>> {
  const social = (article.effets.social ?? 0) + (options.tablee && article.action === 'repas' ? BONUS_TABLEE.social : 0) + (options.victoire && article.bonusVictoire ? article.bonusVictoire.social : 0);
  return social ? { ...article.effets, social } : article.effets;
}
const moralArticle = (article: ArticleCarte, options: OptionsArticle) =>
  article.moral + (options.tablee && article.action === 'repas' ? BONUS_TABLEE.moral : 0) + (options.victoire && article.bonusVictoire ? article.bonusVictoire.moral : 0);

/** Prix payé : la remise ne vaut qu'au marché, plafonnée, et s'arrondit aux 25 F comme chez une vendeuse. */
export const prixArticle = (article: ArticleCarte, remise = 0) =>
  Math.round(article.prix * (1 - (article.marchandable ? Math.max(0, Math.min(REMISE_MAX, remise)) : 0)) / 25) * 25;

/** Comme le serveur : les points s'ajoutent (ou se retirent) entre 0 et 100, avec le bonus de moral. */
export function appliquerArticle<T extends Besoins>(besoins: T, article: ArticleCarte, options: OptionsArticle = {}): T {
  const suivant = { ...besoins };
  for (const [jauge, points] of Object.entries(effetsArticle(article, options)) as [JaugeBesoin, number][]) suivant[jauge] = borne(besoins[jauge] + points) as T[JaugeBesoin];
  suivant.moral = borne(besoins.moral + moralArticle(article, options)) as T['moral'];
  return suivant;
}

/** Ce qui fatigue ne se fait pas à bout de forces : le serveur le refuse (transpirer, si : l'hygiène s'arrête à 0). */
export const articleTropFatigant = (besoins: Besoins, article: ArticleCarte) =>
  (article.effets.energie ?? 0) < 0 && besoins.energie + (article.effets.energie ?? 0) < 0;

/** Le serveur ne débite rien quand toutes les jauges gagnées sont pleines ; ce qui vise d'abord le moral sert tant qu'il n'est pas au plus haut. */
export function articleUtile(besoins: Besoins, article: ArticleCarte, options: OptionsArticle = {}) {
  const positives = (Object.entries(effetsArticle(article, options)) as [JaugeBesoin, number][]).filter(([, points]) => points > 0).map(([j]) => j);
  return positives.some(j => besoins[j] < 98) || ((article.moralPrincipal || !positives.length) && besoins.moral < 98);
}

export const lieuVieOuvert = (lieu: Pick<LieuVie, 'horaires'>, heure: number) => heure >= lieu.horaires.ouverture && heure < lieu.horaires.fermeture;

export const LIBELLES_JAUGES: Record<JaugeBesoin, { icone: string; nom: string }> = {
  faim: { icone: '🍽', nom: 'faim' }, energie: { icone: '⚡', nom: 'énergie' }, social: { icone: '💬', nom: 'social' },
  hygiene: { icone: '🚿', nom: 'hygiène' }, divertissement: { icone: '🎉', nom: 'loisirs' },
};
