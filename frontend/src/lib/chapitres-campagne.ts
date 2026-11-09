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

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });
/** Une situation de terrain : la bonne décision d'abord (le jeu mélange les choix à l'affichage), puis les mauvaises. */
export const situation = (id: string, zone: string, titre: string, texte: string, bonne: [string, string], mauvaises: [string, string][]): TacheCampagne =>
  ({ id, zone, titre, contenu: { type: 'situation', situation: s(id, titre, texte, bonne, mauvaises) } });
