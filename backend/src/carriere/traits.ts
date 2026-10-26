// Les traits choisis à la création du personnage, et ce qu'ils changent vraiment dans le jeu. Un seul endroit pour les
// effets promis par l'écran de création (frontend/src/lib/traits.ts reprend les mêmes chiffres dans ses descriptions).

export const TRAITS_JOUEUR = ['ambitieux', 'perfectionniste', 'sociable', 'bosseur', 'econome', 'curieux', 'meticuleux', 'leader'] as const;
export type TraitJoueur = typeof TRAITS_JOUEUR[number];

export const lireTraits = (brut: unknown): TraitJoueur[] =>
  Array.isArray(brut) ? [...new Set(brut.filter((t): t is TraitJoueur => TRAITS_JOUEUR.includes(t as TraitJoueur)))] : [];

/** Lieux où un trait fait gagner 15 % d'XP de plus : apprendre (curieux), mesurer et lire les plans (méticuleux), diriger (leader). */
export const LIEUX_DES_TRAITS: Partial<Record<TraitJoueur, readonly string[]>> = {
  curieux: ['atelier', 'laboratoire'],
  meticuleux: ['bureau-etudes', 'fournisseur'],
  leader: ['entreprise', 'agence'],
};
/** Contrôle qualité et sécurité : le perfectionniste y gagne 20 % de plus sur un sans-faute. */
export const LIEUX_SANS_FAUTE: readonly string[] = ['laboratoire', 'construction-nord'];

export function facteurXpLieu(traits: readonly TraitJoueur[], slug: string, note: number) {
  let facteur = 1;
  for (const t of traits) if (LIEUX_DES_TRAITS[t]?.includes(slug)) facteur *= 1.15;
  if (traits.includes('perfectionniste') && note >= 100 && LIEUX_SANS_FAUTE.includes(slug)) facteur *= 1.2;
  return facteur;
}
/** L'ambitieux tire 25 % de réputation de plus de chaque reconnaissance. */
export const facteurReputation = (traits: readonly TraitJoueur[]) => traits.includes('ambitieux') ? 1.25 : 1;
/** Le bosseur se fatigue 30 % de moins au travail. */
export const facteurEnergieTravail = (traits: readonly TraitJoueur[]) => traits.includes('bosseur') ? .7 : 1;
/** Le sociable se ressource 50 % plus vite au contact des autres. */
export const facteurSocial = (traits: readonly TraitJoueur[]) => traits.includes('sociable') ? 1.5 : 1;
/** L'économe paie 10 % de moins (repas, sorties, transports). */
export const facteurPrix = (traits: readonly TraitJoueur[]) => traits.includes('econome') ? .9 : 1;
