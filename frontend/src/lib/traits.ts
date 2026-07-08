// Traits de personnalité — choisis une fois à l'onboarding, affichés sur le profil et le CV.
// Chaque trait donne une petite saveur RPG (pas de bonus mécanique caché et invisible :
// le texte décrit exactement ce que le joueur peut en attendre).

export interface Trait {
  slug: string;
  nom: string;
  icone: string;
  description: string;
}

export const TRAITS: Trait[] = [
  { slug: 'ambitieux', nom: 'Ambitieux', icone: '🚀', description: 'Toujours pressé de monter en grade — les promotions te motivent particulièrement.' },
  { slug: 'perfectionniste', nom: 'Perfectionniste', icone: '🎯', description: 'Tu vises le sans-faute sur les missions de contrôle qualité et de sécurité.' },
  { slug: 'sociable', nom: 'Sociable', icone: '💬', description: "Le contact humain te ressource vite — parler aux PNJ remonte ton moral plus qu'à la moyenne." },
  { slug: 'bosseur', nom: 'Bosseur', icone: '💪', description: 'Increvable sur le terrain — tu tiens mieux la cadence lors des longues journées de chantier.' },
  { slug: 'econome', nom: 'Économe', icone: '💰', description: 'Tu regardes chaque FCFA dépensé — les devis serrés, c\'est ta spécialité.' },
  { slug: 'curieux', nom: 'Curieux', icone: '🔍', description: 'Toujours partant pour apprendre un nouveau logiciel ou une nouvelle norme.' },
  { slug: 'meticuleux', nom: 'Méticuleux', icone: '📐', description: 'La lecture de plans et les métrés précis, c\'est ton terrain de jeu favori.' },
  { slug: 'leader', nom: 'Leader né', icone: '👑', description: "Diriger une équipe te vient naturellement — la gestion humaine ne te fait pas peur." },
];

export function traitParSlug(slug: string): Trait | undefined {
  return TRAITS.find((t) => t.slug === slug);
}
