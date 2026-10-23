import type { PointInterieur } from './navigation-interieur';
import type { FamilleLieu } from './plan-autres-lieux';
import { PLAN_RESIDENCE as PLAN } from './plan-residence';

export type PoseObjet = 'allonge' | 'assis' | 'debout' | 'parle';
/** Actions déjà proposées par le serveur (`POST /carriere/besoins/:action`). */
export type BesoinServeur = 'repos' | 'repas' | 'social';
export type EffetBesoins = Partial<Record<'energie' | 'faim' | 'social' | 'moral', number>>;

/** Miroir des coûts du serveur (backend/src/carriere/besoins.service.ts, EFFETS_ACTION) pour l'affichage. */
export const COUTS_BESOINS: Record<BesoinServeur, number> = { repos: 0, repas: 1200, social: 900 };
/** Effet appliqué en démonstration, identique au serveur : besoin ciblé remis à 100, petit bonus de moral. */
export const EFFETS_DEMO: Record<BesoinServeur, EffetBesoins> = {
  repos: { energie: 100, moral: 4 }, repas: { faim: 100, moral: 3 }, social: { social: 100, moral: 6 },
};

export interface ActionObjet {
  id: string; label: string; icone: string;
  /** Durée réelle, en secondes. */
  duree: number;
  pose: PoseObjet;
  /** Sans besoin serveur, l'action est un moment de vie : animation et message, sans effet sur les jauges. */
  besoin?: BesoinServeur;
  message: string;
}

export interface ObjetInterieur {
  id: string; nom: string;
  /** Point libre où le personnage se place pour utiliser l'objet. */
  acces: PointInterieur;
  /** Pose sur l'objet (lit, canapé, chaise) ; absente, le personnage reste à l'accès, tourné selon `regard`. */
  usage?: PointInterieur & { y: number; rotation: number };
  regard: number;
  /** Volume cliquable posé sur le meuble. */
  zone: PointInterieur & { largeur: number; profondeur: number; hauteur: number };
  actions: ActionObjet[];
}

const NORD = Math.PI, EST = Math.PI / 2, SUD = 0;

/** Appartement : chaque pièce a son meuble utilisable. Coordonnées en mètres, celles de PLAN_RESIDENCE. */
export const OBJETS_RESIDENCE: ObjetInterieur[] = [
  { id: 'lit', nom: 'Lit double', acces: { x: -2.15, z: -2.6 }, usage: { x: -3.5, z: -1.95, y: .82, rotation: 0 }, regard: -EST,
    zone: { x: PLAN.lit.x, z: PLAN.lit.z, largeur: PLAN.lit.largeur, profondeur: PLAN.lit.profondeur, hauteur: .9 },
    actions: [{ id: 'dormir', label: 'Dormir', icone: '😴', duree: 9, pose: 'allonge', besoin: 'repos', message: 'Bonne nuit… Tu te réveilles reposé(e).' }] },
  { id: 'canape', nom: 'Canapé', acces: { x: -1.95, z: 2.2 }, usage: { x: -3.4, z: 2.15, y: .1, rotation: SUD }, regard: -EST,
    zone: { x: PLAN.canape.x, z: PLAN.canape.z, largeur: PLAN.canape.largeur, profondeur: PLAN.canape.profondeur, hauteur: 1.1 },
    actions: [
      { id: 'tele', label: 'Regarder la télévision', icone: '📺', duree: 6, pose: 'assis', message: 'Un bon match à la télé : tu souffles un peu.' },
      { id: 'voisin', label: 'Inviter un voisin', icone: '🍹', duree: 7, pose: 'assis', besoin: 'social', message: 'Ton voisin est passé : vous avez bien discuté.' },
    ] },
  { id: 'table', nom: 'Table et chaise', acces: { x: 2.5, z: 1.2 }, usage: { x: 2.5, z: 1.55, y: 0, rotation: SUD }, regard: SUD,
    zone: { x: PLAN.repas.x, z: PLAN.repas.z, largeur: PLAN.repas.largeur, profondeur: PLAN.repas.profondeur, hauteur: .95 },
    actions: [{ id: 'plans', label: 'Étudier tes plans', icone: '📐', duree: 6, pose: 'assis', message: 'Tu revois tranquillement les plans du prochain chantier.' }] },
  { id: 'cuisine', nom: 'Cuisinière', acces: { x: 3.95, z: 3 }, regard: EST,
    zone: { x: PLAN.cuisine.x, z: PLAN.cuisine.z, largeur: PLAN.cuisine.largeur, profondeur: PLAN.cuisine.profondeur, hauteur: 1.2 },
    actions: [{ id: 'cuisiner', label: 'Cuisiner un repas', icone: '🍳', duree: 7, pose: 'debout', besoin: 'repas', message: 'Ça sent bon ! Tu as cuisiné et bien mangé.' }] },
  { id: 'douche', nom: 'Douche', acces: { x: 3.55, z: -2.6 }, usage: { x: 4.65, z: -3.55, y: .2, rotation: -EST }, regard: EST,
    zone: { x: PLAN.douche.x, z: PLAN.douche.z, largeur: PLAN.douche.largeur, profondeur: PLAN.douche.profondeur, hauteur: 2.2 },
    actions: [{ id: 'douche', label: 'Prendre une douche', icone: '🚿', duree: 5, pose: 'debout', message: 'Une douche fraîche, ça réveille !' }] },
];

/** Comptoir d'accueil commun à tous les autres lieux (voir Mobilier dans autres-lieux-realistes). */
const ACCUEIL: Omit<ObjetInterieur, 'actions'> = {
  id: 'accueil', nom: 'Comptoir', acces: { x: -3.4, z: 3.4 }, regard: NORD, zone: { x: -3.5, z: 2.2, largeur: 2.7, profondeur: .9, hauteur: 1.1 },
};

export function objetsPour(slug: string, famille: FamilleLieu | null): ObjetInterieur[] {
  if (slug === 'residence' || slug === 'jardins-residence') return OBJETS_RESIDENCE;
  if (!famille) return [];
  if (famille === 'restauration') return [
    { ...ACCUEIL, actions: [{ id: 'commander', label: 'Commander un plat', icone: '🍛', duree: 6, pose: 'debout', besoin: 'repas', message: 'Le plat du jour était délicieux.' }] },
    { id: 'tablee', nom: 'Tablée', acces: { x: -3.3, z: -1.2 }, usage: { x: -3.5, z: -2.05, y: .12, rotation: NORD }, regard: NORD,
      zone: { x: -3.5, z: -2.6, largeur: 2.5, profondeur: 1.25, hauteur: 1 },
      actions: [{ id: 'discuter', label: 'S’asseoir et discuter', icone: '💬', duree: 7, pose: 'assis', besoin: 'social', message: 'Une bonne discussion entre collègues.' }] },
  ];
  const accueil = { ...ACCUEIL, actions: [{ id: 'renseigner', label: 'Se renseigner', icone: '🙋', duree: 5, pose: 'parle' as const, message: 'L’accueil t’a orienté(e) vers le bon interlocuteur.' }] };
  if (famille === 'loisirs') return [accueil, { id: 'banquette', nom: 'Banquette', acces: { x: -3.3, z: -1.2 }, usage: { x: -3.5, z: -2.55, y: .12, rotation: SUD }, regard: NORD,
    zone: { x: -3.5, z: -2.6, largeur: 2.6, profondeur: 1.3, hauteur: 1.1 },
    actions: [{ id: 'detente', label: 'Se détendre', icone: '🌴', duree: 6, pose: 'assis', message: 'Un moment de calme qui fait du bien.' }] }];
  return [accueil];
}

/** Avancement d'une action entre 0 et 1. */
export function avancement(debut: number, maintenant: number, duree: number) {
  if (!(duree > 0)) return 1;
  return Math.min(1, Math.max(0, (maintenant - debut) / (duree * 1000)));
}

/** Applique un effet de démonstration sur les jauges, bornées entre 0 et 100 (bonus de moral additif, autres valeurs absolues). */
export function appliquerEffet<T extends Record<'energie' | 'faim' | 'social' | 'moral', number>>(besoins: T, effet: EffetBesoins): T {
  const suivant = { ...besoins };
  for (const [cle, valeur] of Object.entries(effet) as [keyof EffetBesoins, number][]) {
    suivant[cle] = Math.max(0, Math.min(100, cle === 'moral' ? besoins.moral + valeur : valeur)) as T[typeof cle];
  }
  return suivant;
}
