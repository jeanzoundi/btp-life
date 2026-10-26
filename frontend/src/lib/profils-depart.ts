/** Les portes d'entrée organisent le catalogue existant sans supprimer ses filières. */
export const PROFILS_DEPART = [
  { id: 'etudiant', nom: 'Étudiant du bâtiment', icone: '🎓', description: 'Apprendre, pratiquer et découvrir le terrain.', quotidien: 'Cours, exercices et recherche de stages.', lieu: 'universite', premiersPas: ['Découvrir un cours à l’Académie', 'Réaliser une mission d’initiation', 'Consulter les offres de stage'] },
  { id: 'ouvrier', nom: 'Ouvrier du bâtiment', icone: '🦺', description: 'Apprendre le geste et réaliser les ouvrages.', quotidien: 'Travaux, sécurité et progression technique.', lieu: 'chantier', premiersPas: ['Découvrir les missions de chantier', 'Travailler une compétence technique', 'Consulter les offres adaptées'] },
  { id: 'dessinateur', nom: 'Dessinateur-projeteur', icone: '📐', description: 'Passer de l’idée au plan et à la maquette.', quotidien: 'Lecture de plans, dessin et coordination BIM.', lieu: 'atelier', premiersPas: ['Découvrir l’atelier logiciels', 'Pratiquer la lecture de plans', 'Consulter son parcours de carrière'] },
  { id: 'encadrant', nom: 'Encadrant de chantier', icone: '🏗️', description: 'Organiser les équipes et faire avancer les travaux.', quotidien: 'Planning, approvisionnement, sécurité et qualité.', lieu: 'chantier', premiersPas: ['Visiter le Grand chantier', 'Pratiquer une décision de chantier', 'Consulter ses objectifs de promotion'] },
  { id: 'ingenieur', nom: 'Ingénieur d’études', icone: '📊', description: 'Étudier, vérifier et choisir les solutions techniques.', quotidien: 'Calculs, études et échanges avec le terrain.', lieu: 'bureau-etudes', premiersPas: ['Visiter la Maison des ingénieurs', 'Travailler une compétence d’études', 'Consulter son parcours de carrière'] },
] as const;
export type ProfilDepart = typeof PROFILS_DEPART[number]['id'];
export interface ProfilCatalogue { id: string; slug: string; nom: string; famille: string; description: string | null; niveauDepart?: number }
/** Comme le serveur (NIVEAU_DEPART_MAX dans backend/src/carriere/carriere.service.ts) : au-delà, les échelons experts se gagnent par promotion. */
export const NIVEAU_DEPART_MAX = 9;
export function porteDuProfil(slug: string): ProfilDepart | null {
  if (/^(etudiant|stagiaire|apprenti)-/.test(slug)) return 'etudiant';
  if (/^(ouvrier|manoeuvre)(-|$)/.test(slug)) return 'ouvrier';
  if (/^(dessinateur|projeteur|bim)-?/.test(slug)) return 'dessinateur';
  if (/^(chef-|conducteur-)/.test(slug)) return 'encadrant';
  if (/^ingenieur-/.test(slug)) return 'ingenieur';
  return null;
}
export function profilsPourPorte(profils: ProfilCatalogue[], porte: ProfilDepart | null) {
  const accessibles = profils.filter(p => (p.niveauDepart ?? 1) <= NIVEAU_DEPART_MAX);
  return porte ? accessibles.filter(p => porteDuProfil(p.slug) === porte) : accessibles;
}
export const FORMATIONS_DEPART = ['BTS', 'ingenieur'] as const;
