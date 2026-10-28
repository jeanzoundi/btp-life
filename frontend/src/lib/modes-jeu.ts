export type ModeJeuId = 'libre' | 'carriere' | 'urgence' | 'entrepreneur' | 'exploration' | 'communaute';

export interface EtapeMode { lieu: string; titre: string; instruction: string; points: number }
export interface ModeJeu { id: ModeJeuId; nom: string; icone: string; description: string; duree: number | null; etapes: EtapeMode[] }

export const MODES_JEU: ModeJeu[] = [
  { id: 'libre', nom: 'Vie libre', icone: '🌇', description: 'Explore, rencontre les habitants et utilise les services du quartier.', duree: null, etapes: [] },
  { id: 'carriere', nom: 'Parcours carrière', icone: '📈', description: 'Prépare une journée de travail complète dans le bon ordre.', duree: 240, etapes: [
    { lieu: 'residence', titre: 'Bien démarrer', instruction: 'Passe à la résidence pour vérifier ton énergie.', points: 100 },
    { lieu: 'universite', titre: 'Se former', instruction: 'Rejoins l’Université BTP pour préparer tes compétences.', points: 150 },
    { lieu: 'entreprise', titre: 'Prendre le brief', instruction: 'Va à la Tour BTP Life récupérer les consignes.', points: 200 },
    { lieu: 'chantier', titre: 'Passer à l’action', instruction: 'Termine le parcours au Grand chantier.', points: 300 },
  ] },
  { id: 'urgence', nom: 'Urgence chantier', icone: '🚨', description: 'Sécurise l’approvisionnement avant d’intervenir sur le terrain.', duree: 150, etapes: [
    { lieu: 'fournisseur', titre: 'Matériaux manquants', instruction: 'Rejoins le dépôt matériaux en priorité.', points: 250 },
    { lieu: 'banque', titre: 'Valider le budget', instruction: 'Passe à la Banque BTL pour contrôler le financement.', points: 250 },
    { lieu: 'chantier', titre: 'Livraison urgente', instruction: 'Rends-toi au Grand chantier.', points: 500 },
  ] },
  { id: 'entrepreneur', nom: 'Défi entrepreneur', icone: '💼', description: 'Monte une opération rentable, du financement jusqu’à la livraison.', duree: 300, etapes: [
    { lieu: 'banque', titre: 'Financer le projet', instruction: 'Présente ton plan de financement à la Banque BTL.', points: 200 },
    { lieu: 'entreprise', titre: 'Constituer l’équipe', instruction: 'Recrute les profils indispensables à la Tour BTP Life.', points: 250 },
    { lieu: 'fournisseur', titre: 'Négocier les matériaux', instruction: 'Sécurise les prix et les délais au dépôt.', points: 300 },
    { lieu: 'construction-nord', titre: 'Livrer le projet', instruction: 'Supervise la livraison au Chantier du Plateau.', points: 500 },
  ] },
  { id: 'exploration', nom: 'Tour d’Abidjan', icone: '🧭', description: 'Découvre les quartiers, les commerces et le front de lagune.', duree: 360, etapes: [
    { lieu: 'marche', titre: 'Jardins de l’Ouest', instruction: 'Visite le Marché des Jardins.', points: 150 },
    { lieu: 'mairie', titre: 'Plateau Nord', instruction: 'Rejoins l’Hôtel de ville.', points: 200 },
    { lieu: 'atelier', titre: 'Pôle des Bâtisseurs', instruction: 'Découvre l’Atelier de formation.', points: 200 },
    { lieu: 'marina', titre: 'Baie des Sables', instruction: 'Termine la visite sur la promenade de la marina.', points: 350 },
  ] },
  { id: 'communaute', nom: 'Vie de quartier', icone: '🤝', description: 'Améliore le quotidien des habitants et anime la communauté.', duree: 270, etapes: [
    { lieu: 'cafe', titre: 'Écouter les habitants', instruction: 'Commence par recueillir les idées au Café des Bâtisseurs.', points: 150 },
    { lieu: 'centre-azur', titre: 'Soutenir les commerces', instruction: 'Passe au Centre commercial Azur.', points: 200 },
    { lieu: 'sports', titre: 'Organiser une activité', instruction: 'Prépare un événement au Complexe sportif.', points: 250 },
    { lieu: 'maquis', titre: 'Fêter ensemble', instruction: 'Retrouve les voisins au Maquis.', points: 300 },
  ] },
];

export function avancerMode(mode: ModeJeu, etape: number, lieu: string) {
  const objectif = mode.etapes[etape];
  if (!objectif || objectif.lieu !== lieu) return { etape, points: 0, termine: false };
  const suivante = etape + 1;
  return { etape: suivante, points: objectif.points, termine: suivante >= mode.etapes.length };
}
