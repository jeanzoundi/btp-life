// Ce qui fait un chapitre du fil rouge, partagé par ses dossiers (la Résidence Akwaba dans campagne.ts, la Résidence
// Les Rôniers dans dossier-roniers.ts). Sans Three.js ni React.
import type { SituationTerrain } from './programme-chantier';
import type { ContenuTache } from './programme-lieu';

export interface TacheCampagne { id: string; zone: string; titre: string; contenu: ContenuTache }
export interface ChapitreCampagne {
  id: string;
  /** Lieu du chapitre : un lieu à programme du quartier, ou la parcelle du dossier pour la réception. */
  lieu: string;
  titre: string;
  /** Ce qui se joue, en une ligne, pour la liste des chapitres. */
  resume: string;
  /** Ce que dit l'interlocuteur en ouvrant le chapitre. */
  recit: string;
  /** Ce qui change sur la parcelle une fois le chapitre validé. */
  avancee: string;
  taches: TacheCampagne[];
}

export interface ParcelleCampagne { slug: string; x: number; z: number; largeur: number; profondeur: number }
export interface AccueilParcelle { nom: string; role: string; horaires: { ouverture: number; fermeture: number } }
/** Gains d'un chapitre validé, comme au serveur (gainsChapitre) : chapitre ordinaire, livraison (la réception), clôture
 * (le dernier chapitre du dossier). L'XP vaut `xpBase` + la moitié de la note, plus la prime de livraison ou de clôture. */
export interface BaremeDossier {
  argent: { chapitre: number; livraison: number; cloture: number };
  xpBase: number; xpPrime: { livraison: number; cloture: number };
  reputation: { chapitre: number; livraison: number; cloture: number };
}
export interface DossierCampagne {
  id: string; nom: string; ouvrage: string; client: string;
  parcelle: ParcelleCampagne;
  /** Le nom de la parcelle dans le jeu (carte, rendez-vous). */
  nomParcelle: string;
  /** Qui reçoit sur la parcelle : le client, aux heures de chantier. */
  accueil: AccueilParcelle;
  chapitres: ChapitreCampagne[];
  /** Chapitres du dossier validés à la livraison de l'immeuble (la réception, sur la parcelle). */
  livraison: number;
  /** Ce qu'on voit sur la parcelle à chaque stade, de 0 à la longueur du dossier. */
  stades: readonly string[];
  bareme: BaremeDossier;
  /** Ce que deviennent l'immeuble et le joueur une fois le dossier clos (fiche de la parcelle, téléphone). */
  cloture: string;
  /** Hauteur (m) du point que regarde la caméra quand l'ouvrage franchit une étape : 7 pour un R+3, plus pour plus haut. */
  hauteurVue?: number;
  /** Rang, dans tout le fil rouge, du premier chapitre du dossier. */
  debut: number;
}
/** Un dossier tel qu'on l'écrit : son rang dans le fil rouge se calcule à l'assemblage (campagne.ts). */
export type DefinitionDossier = Omit<DossierCampagne, 'debut'>;

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });
/** Une situation de terrain : la bonne décision d'abord (le jeu mélange les choix à l'affichage), puis les mauvaises. */
export const situation = (id: string, zone: string, titre: string, texte: string, bonne: [string, string], mauvaises: [string, string][]): TacheCampagne =>
  ({ id, zone, titre, contenu: { type: 'situation', situation: s(id, titre, texte, bonne, mauvaises) } });

/** Une mesure : on calcule, on tape le résultat ; juste à `tolerance` près (moitié des points jusqu'au double). */
export const mesure = (id: string, zone: string, titre: string, m: { enonce: string; donnees: [string, string][]; question: string; unite: string; reponse: number; tolerance: number; explication: string }): TacheCampagne =>
  ({ id, zone, titre, contenu: { type: 'mesure', mesure: { titre, enonce: m.enonce, donnees: m.donnees.map(([libelle, valeur]) => ({ libelle, valeur })), question: m.question, unite: m.unite, reponse: m.reponse, tolerance: m.tolerance, explication: m.explication } } });

/** Une sélection : cocher ce qui convient ; chaque option porte son explication ([texte, attendu, explication]). */
export const selection = (id: string, zone: string, titre: string, enonce: string, consigne: string, options: [string, boolean, string][]): TacheCampagne =>
  ({ id, zone, titre, contenu: { type: 'selection', selection: { titre, enonce, consigne, options: options.map(([texte, attendu, explication]) => ({ texte, attendu, explication })) } } });
