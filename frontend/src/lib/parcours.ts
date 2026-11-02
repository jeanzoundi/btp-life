// Les cinq parcours d'entrée et leur activité signature, mieux récompensée : même barème qu'au serveur
// (backend/src/carriere/parcours.ts). Modifier ce barème, c'est modifier les deux fichiers et leurs tests.
import { porteDuProfil, type ProfilDepart } from './profils-depart';

export type ActiviteParcours = { type: 'seance'; lieu: string } | { type: 'journee' };
export interface BonusParcours { xp: number; argent: number; reputation: number }

/** Ce qui fait la différence d'un parcours à l'autre : son activité signature, où elle se joue, et ce qu'elle rapporte. */
export const SIGNATURES_PARCOURS: Record<ProfilDepart, { activite: string; lieu: string; bonus: string }> = {
  etudiant: { activite: 'Les séances chez les mentors du quartier', lieu: 'laboratoire', bonus: '+25 % d’XP à chaque séance' },
  ouvrier: { activite: 'Les journées de travail au Grand chantier', lieu: 'chantier', bonus: '+15 % de paie à chaque journée' },
  dessinateur: { activite: 'L’atelier logiciels et le bureau d’études', lieu: 'atelier', bonus: '+20 % d’XP dans ces deux lieux' },
  encadrant: { activite: 'Les journées au Grand chantier, à la tête de l’équipe', lieu: 'chantier', bonus: '+20 % d’XP et +1 de réputation par journée validée' },
  ingenieur: { activite: 'Le laboratoire et le bureau d’études', lieu: 'bureau-etudes', bonus: '+20 % d’XP dans ces deux lieux' },
};

const NEUTRE: BonusParcours = { xp: 1, argent: 1, reputation: 0 };
const LIEUX_SIGNATURE: Partial<Record<ProfilDepart, readonly string[]>> = { dessinateur: ['atelier', 'bureau-etudes'], ingenieur: ['laboratoire', 'bureau-etudes'] };

/** Ce que l'activité rapporte en plus à ce parcours : multiplicateurs d'XP et de paie, réputation ajoutée. */
export function bonusParcours(porte: ProfilDepart | null, activite: ActiviteParcours): BonusParcours {
  if (!porte) return NEUTRE;
  if (activite.type === 'journee') return porte === 'ouvrier' ? { ...NEUTRE, argent: 1.15 } : porte === 'encadrant' ? { xp: 1.2, argent: 1, reputation: 1 } : NEUTRE;
  if (porte === 'etudiant') return { ...NEUTRE, xp: 1.25 };
  return LIEUX_SIGNATURE[porte]?.includes(activite.lieu) ? { ...NEUTRE, xp: 1.2 } : NEUTRE;
}

/** Le parcours du poste actuel (rien pour un poste expert, gagné par promotion). */
export const parcoursDuPoste = (slug: string | null | undefined) => slug ? porteDuProfil(slug) : null;
