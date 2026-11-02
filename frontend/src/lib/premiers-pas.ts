// La première journée guidée : du logement au prochain objectif, quatre étapes chacune récompensée une seule fois, et un
// bonus quand tout est fait. Mêmes étapes, mêmes prérequis et mêmes récompenses qu'au serveur
// (backend/src/monde/premiers-pas.service.ts).

export const ETAPES_PREMIERS_PAS = [
  { id: 'logement', titre: 'Rentre chez toi', detail: 'Suis la flèche jusqu’à Ma Résidence, puis entre : ton logement, ton loyer et le programme du jour t’y attendent.' },
  { id: 'travail', titre: 'Gagne ta première paie', detail: 'Une journée avec Yao au Grand chantier (6 h – 18 h), ou une séance chez un mentor à ses heures d’ouverture.' },
  { id: 'paie', titre: 'Vérifie ta paie', detail: 'Ouvre ton téléphone (touche T), puis la Banque : ton salaire est sur ton compte.' },
  { id: 'objectif', titre: 'Choisis ton prochain objectif', detail: 'Dans le téléphone, Carrière montre tes objectifs durables : qualification, outil, logement, responsabilités, entreprise.' },
] as const;
export type EtapePremiersPas = (typeof ETAPES_PREMIERS_PAS)[number]['id'];

/** On vérifie sa paie une fois payé, et on choisit son prochain objectif après l'avoir vue ; le reste, dans l'ordre qu'on veut. */
export const PREREQUIS_PREMIERS_PAS: Partial<Record<EtapePremiersPas, EtapePremiersPas>> = { paie: 'travail', objectif: 'paie' };

export const RECOMPENSES_PREMIERS_PAS = { etape: { argent: 500, xp: 15 }, finale: { argent: 2_000, xp: 50 } } as const;

export interface EtatPremiersPas { faites: EtapePremiersPas[]; termineLe: string | null; afficher: boolean }

/** L'étape compte-t-elle déjà, son prérequis fait ? Un geste fait trop tôt (la banque avant la paie) ne compte pas. */
export const etapeOuverte = (faites: readonly EtapePremiersPas[], etape: EtapePremiersPas) => {
  const prerequis = PREREQUIS_PREMIERS_PAS[etape];
  return !prerequis || faites.includes(prerequis);
};

/** Les étapes faites après celle-ci, dans l'ordre du guide. */
export const ajouterEtape = (faites: readonly EtapePremiersPas[], etape: EtapePremiersPas) =>
  ETAPES_PREMIERS_PAS.map(e => e.id).filter(id => id === etape || faites.includes(id));

/** La prochaine étape à faire, ou rien quand le guide est fini. */
export const prochaineEtape = (faites: readonly EtapePremiersPas[]) => ETAPES_PREMIERS_PAS.find(e => !faites.includes(e.id)) ?? null;

/** La récompense d'une étape, avec le bonus de fin pour la dernière. */
export function recompenseEtape(termine: boolean) {
  const { etape, finale } = RECOMPENSES_PREMIERS_PAS;
  return { argent: etape.argent + (termine ? finale.argent : 0), xp: etape.xp + (termine ? finale.xp : 0) };
}
