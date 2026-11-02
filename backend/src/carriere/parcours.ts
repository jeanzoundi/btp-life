// Les cinq parcours d'entrée, mêmes portes qu'au jeu (frontend/src/lib/profils-depart.ts et parcours.ts) : chacun a son
// activité signature, mieux récompensée. L'étudiant apprend partout (+25 % d'XP en séance chez un mentor) ; l'ouvrier gagne
// mieux sa journée au Grand chantier (+15 % de paie) ; l'encadrant y gagne en expérience (+20 %) et en réputation ;
// dessinateur et ingénieur progressent plus vite dans leurs lieux (+20 % d'XP : atelier et bureau d'études, laboratoire
// et bureau d'études). Modifier ce barème, c'est modifier les deux fichiers et leurs tests.

export type PorteParcours = 'etudiant' | 'ouvrier' | 'dessinateur' | 'encadrant' | 'ingenieur';
export type ActiviteParcours = { type: 'seance'; lieu: string } | { type: 'journee' };
export interface BonusParcours { xp: number; argent: number; reputation: number }

/** Le parcours d'un poste, d'après son identifiant ; rien pour les postes experts, qui se gagnent par promotion. */
export function porteDuProfil(slug: string | null | undefined): PorteParcours | null {
  if (!slug) return null;
  if (/^(etudiant|stagiaire|apprenti)-/.test(slug)) return 'etudiant';
  if (/^(ouvrier|manoeuvre)(-|$)/.test(slug)) return 'ouvrier';
  if (/^(dessinateur|projeteur|bim)-?/.test(slug)) return 'dessinateur';
  if (/^(chef-|conducteur-)/.test(slug)) return 'encadrant';
  if (/^ingenieur-/.test(slug)) return 'ingenieur';
  return null;
}

const NEUTRE: BonusParcours = { xp: 1, argent: 1, reputation: 0 };
const LIEUX_SIGNATURE: Partial<Record<PorteParcours, readonly string[]>> = { dessinateur: ['atelier', 'bureau-etudes'], ingenieur: ['laboratoire', 'bureau-etudes'] };

/** Ce que l'activité rapporte en plus à ce parcours : multiplicateurs d'XP et de paie, réputation ajoutée. */
export function bonusParcours(porte: PorteParcours | null, activite: ActiviteParcours): BonusParcours {
  if (!porte) return NEUTRE;
  if (activite.type === 'journee') return porte === 'ouvrier' ? { ...NEUTRE, argent: 1.15 } : porte === 'encadrant' ? { xp: 1.2, argent: 1, reputation: 1 } : NEUTRE;
  if (porte === 'etudiant') return { ...NEUTRE, xp: 1.25 };
  return LIEUX_SIGNATURE[porte]?.includes(activite.lieu) ? { ...NEUTRE, xp: 1.2 } : NEUTRE;
}
