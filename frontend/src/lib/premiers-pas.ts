// Le premier quart d'heure guidé : cinq gestes pour découvrir le jeu, chacun récompensé une seule fois, et un bonus
// quand tout est fait. Mêmes étapes et mêmes récompenses qu'au serveur (backend/src/monde/premiers-pas.service.ts).

export const ETAPES_PREMIERS_PAS = [
  { id: 'deplacement', titre: 'Fais quelques pas', detail: 'Clique sur le sol, un bâtiment ou la minicarte, ou marche avec ZQSD.' },
  { id: 'telephone', titre: 'Ouvre ton téléphone', detail: 'Touche T : messages, trajets en taxi, banque, offres d’emploi…' },
  { id: 'lieu', titre: 'Entre dans un lieu', detail: 'Clique sur un bâtiment : tu t’y rends, puis tu entres.' },
  { id: 'seance', titre: 'Réussis une séance chez un mentor', detail: 'Parle au mentor du lieu, à ses heures d’ouverture, et fais les tâches du jour.' },
  { id: 'quartier', titre: 'Salue le quartier', detail: 'Touche C : un message ou une émote aux autres joueurs.' },
] as const;
export type EtapePremiersPas = (typeof ETAPES_PREMIERS_PAS)[number]['id'];

export const RECOMPENSES_PREMIERS_PAS = { etape: { argent: 500, xp: 15 }, finale: { argent: 2_000, xp: 50 } } as const;
/** Distance à parcourir (m) pour valider « Fais quelques pas ». */
export const DISTANCE_PREMIERS_PAS = 12;

export interface EtatPremiersPas { faites: EtapePremiersPas[]; termineLe: string | null; afficher: boolean }

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
