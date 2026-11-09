import type { PnjRole } from '@prisma/client';

// Les personnages qui écrivent au joueur (messages du téléphone) : mentors du parcours, chefs, et les clients du fil
// rouge. Créés par le seed, et ajoutés en production par scripts/publier-contenu-monde.ts s'ils manquent.
export const PNJ_DU_JEU: Array<{ slug: string; nom: string; role: PnjRole }> = [
  { slug: 'mentor-akissi', nom: 'Akissi — Mentor', role: 'PROFESSEUR' },
  { slug: 'maitre-stage-kouame', nom: 'Kouamé — Maître de stage', role: 'MAITRE_STAGE' },
  { slug: 'superviseur-fatou', nom: 'Fatou — Superviseur', role: 'SUPERVISEUR' },
  { slug: 'chef-entreprise-diallo', nom: 'M. Diallo — Chef d\'entreprise', role: 'CHEF_ENTREPRISE' },
  { slug: 'recruteur-adama', nom: 'Adama — Recruteur', role: 'RECRUTEUR' },
  { slug: 'client-madame-toure', nom: 'Mme Touré — Cliente', role: 'CLIENT' },
  { slug: 'chef-chantier-yao', nom: 'Yao — Chef chantier', role: 'CHEF_CHANTIER' },
  { slug: 'controleur-brou', nom: 'Brou — Contrôleur qualité', role: 'CONTROLEUR' },
  // Le client du deuxième dossier du fil rouge, la Résidence Les Rôniers.
  { slug: 'client-daouda-toure', nom: 'M. Touré — Client', role: 'CLIENT' },
];
