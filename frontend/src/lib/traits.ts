// Traits de personnalité — choisis une fois à l'onboarding, affichés sur le profil et le CV.
// Chaque trait a un effet réel, appliqué par le serveur (backend/src/carriere/traits.ts) : pas de bonus caché,
// le texte décrit exactement ce que le joueur peut en attendre, chiffres compris.

export interface Trait {
  slug: string;
  nom: string;
  icone: string;
  description: string;
}

export const TRAITS: Trait[] = [
  { slug: 'ambitieux', nom: 'Ambitieux', icone: '🚀', description: 'Toujours pressé de monter en grade : +25 % de réputation sur chaque reconnaissance.' },
  { slug: 'perfectionniste', nom: 'Perfectionniste', icone: '🎯', description: 'Tu vises le sans-faute en contrôle qualité et en sécurité : +20 % d’XP sur un sans-faute au laboratoire et au Chantier du Plateau.' },
  { slug: 'sociable', nom: 'Sociable', icone: '💬', description: 'Le contact humain te ressource vite : +50 % de lien social au café, au maquis et avec les habitants.' },
  { slug: 'bosseur', nom: 'Bosseur', icone: '💪', description: 'Increvable sur le terrain : 30 % de fatigue en moins au travail.' },
  { slug: 'econome', nom: 'Économe', icone: '💰', description: 'Tu regardes chaque FCFA dépensé : 10 % de moins sur les repas, les sorties et les courses en taxi ou en gbaka.' },
  { slug: 'curieux', nom: 'Curieux', icone: '🔍', description: 'Toujours partant pour apprendre un logiciel ou une norme : +15 % d’XP à l’atelier de formation et au laboratoire.' },
  { slug: 'meticuleux', nom: 'Méticuleux', icone: '📐', description: 'Les plans et les métrés précis, c’est ton terrain : +15 % d’XP à la Maison des ingénieurs et au dépôt.' },
  { slug: 'leader', nom: 'Leader né', icone: '👑', description: 'Diriger une équipe te vient naturellement : +15 % d’XP à la Tour BTP Life et à l’agence des talents.' },
];

export function traitParSlug(slug: string): Trait | undefined {
  return TRAITS.find((t) => t.slug === slug);
}

/** Le sociable se fait des amis plus vite : ses gains d'affinité avec les habitants comptent 50 % de plus. */
export const facteurSocialTraits = (traits: readonly string[]) => traits.includes('sociable') ? 1.5 : 1;
