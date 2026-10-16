export type EtatCampus = { xp: number; concentration: number; social: number; derniereAction: string };

export const ETAT_CAMPUS_INITIAL: EtatCampus = { xp: 0, concentration: 48, social: 42, derniereAction: 'Explorez le campus et choisissez une activité.' };

export const ACTIVITES_UNIVERSITE: Record<string, { label: string; resultat: string; xp: number; concentration: number; social: number }> = {
  accueil: { label: 'Demander une orientation', resultat: 'Le conseiller vous propose un parcours personnalisé.', xp: 4, concentration: 3, social: 2 },
  amphi: { label: 'Suivre le cours', resultat: 'Vous avez suivi un cours de structures avec le professeur.', xp: 18, concentration: 8, social: 1 },
  atelier: { label: 'Tester une éprouvette', resultat: 'Essai terminé : vous avez analysé la résistance du matériau.', xp: 22, concentration: 7, social: 0 },
  administration: { label: 'Parler à la scolarité', resultat: 'Votre dossier étudiant a été vérifié avec la scolarité.', xp: 3, concentration: 1, social: 4 },
  cafeteria: { label: 'Discuter avec les étudiants', resultat: 'Vous avez rencontré un nouveau groupe de projet.', xp: 5, concentration: -2, social: 14 },
  cour: { label: 'S’asseoir et observer', resultat: 'Vous profitez de la cour et récupérez avant le prochain cours.', xp: 2, concentration: 12, social: 3 },
  classe: { label: 'Participer au TD', resultat: 'Exercice corrigé au tableau avec le professeur.', xp: 16, concentration: 7, social: 2 },
  cowork: { label: 'Rejoindre un projet', resultat: 'Vous contribuez à la revue collaborative d’un projet.', xp: 14, concentration: 4, social: 9 },
  bim: { label: 'Ouvrir la maquette BIM', resultat: 'La maquette numérique est ouverte : clash détecté et corrigé.', xp: 25, concentration: 9, social: 1 },
  bibliotheque: { label: 'Étudier un ouvrage', resultat: 'Vous avez consulté un guide technique de construction.', xp: 12, concentration: 14, social: 0 },
};

export function realiserActivite(etat: EtatCampus, station: string): EtatCampus {
  const activite = ACTIVITES_UNIVERSITE[station];
  if (!activite) return etat;
  const borner = (valeur: number) => Math.max(0, Math.min(100, valeur));
  return {
    xp: etat.xp + activite.xp,
    concentration: borner(etat.concentration + activite.concentration),
    social: borner(etat.social + activite.social),
    derniereAction: activite.resultat,
  };
}
