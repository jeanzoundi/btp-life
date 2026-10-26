// Logement, outillage et entreprise du joueur, vus du jeu. Mêmes catalogues et même journée d'entreprise que le serveur
// (backend/src/carriere/patrimoine.ts et backend/src/monde/entreprise.service.ts) : connecté, le serveur prélève le loyer,
// vend les outils et tient les comptes de l'entreprise ; en démonstration, le navigateur montre les mêmes chiffres.

export type NiveauLogement = 'studio' | 'f2' | 'villa';
export interface Logement { niveau: NiveauLogement; nom: string; loyerSemaine: number; confort: number; description: string }
export const LOGEMENTS: Logement[] = [
  { niveau: 'studio', nom: 'Studio à la Résidence Lagune', loyerSemaine: 12_000, confort: 0, description: 'Une pièce, une kitchenette et une douche : de quoi démarrer.' },
  { niveau: 'f2', nom: 'Deux-pièces avec balcon', loyerSemaine: 25_000, confort: 4, description: 'Une chambre à part et un balcon sur la lagune : +4 de moral à chaque réveil.' },
  { niveau: 'villa', nom: 'Villa des Jardins', loyerSemaine: 55_000, confort: 10, description: 'Jardin, terrasse et calme : +10 de moral à chaque réveil.' },
];
export interface Outil { slug: string; nom: string; prix: number; description: string }
export const OUTILS: Outil[] = [
  { slug: 'metre-laser', nom: 'Mètre laser', prix: 18_000, description: 'Des métrés justes du premier coup : +8 % d’XP au dépôt et à la Maison des ingénieurs.' },
  { slug: 'epi-complet', nom: 'EPI haut de gamme', prix: 25_000, description: 'Casque ventilé, chaussures légères et gants : 15 % de fatigue en moins au travail.' },
  { slug: 'niveau-laser', nom: 'Niveau laser rotatif', prix: 45_000, description: 'Implantations et aplombs précis : +10 % d’XP au Chantier du Plateau et au laboratoire.' },
  { slug: 'tablette-chantier', nom: 'Tablette de chantier', prix: 60_000, description: 'Dossiers et suivis toujours à portée : +8 % d’XP à l’hôtel de ville, à la banque et à l’agence.' },
  { slug: 'ordinateur-bim', nom: 'Ordinateur portable et logiciels', prix: 120_000, description: 'Plans, devis et maquette numérique : +10 % d’XP à l’atelier, à la Maison des ingénieurs et à la Tour BTP Life.' },
];

export type PosteEntreprise = 'macon' | 'ferrailleur' | 'coffreur' | 'chef-equipe' | 'conducteur-travaux';
export const POSTES_ENTREPRISE: Record<PosteEntreprise, { nom: string; salaireMensuel: number; productivite: number }> = {
  macon: { nom: 'Maçon', salaireMensuel: 90_000, productivite: 1 },
  ferrailleur: { nom: 'Ferrailleur', salaireMensuel: 95_000, productivite: 1 },
  coffreur: { nom: 'Coffreur', salaireMensuel: 95_000, productivite: 1 },
  'chef-equipe': { nom: 'Chef d’équipe', salaireMensuel: 150_000, productivite: 1.6 },
  'conducteur-travaux': { nom: 'Conducteur de travaux', salaireMensuel: 280_000, productivite: 2.4 },
};
export const REGLES_ENTREPRISE = { niveauMin: 12, apportMin: 100_000, equipeMax: 12, chiffreParProductivite: 6_500, fraisFixesJour: 2_500 } as const;

/** La journée d'activité prévue : chiffre d'affaires selon l'équipe et la réputation, salaires et frais fixes. */
export function previsionJournee(reputation: number, postes: readonly PosteEntreprise[]) {
  const productivite = postes.reduce((s, p) => s + POSTES_ENTREPRISE[p].productivite, 0);
  const chiffre = Math.round(productivite * REGLES_ENTREPRISE.chiffreParProductivite * (.6 + reputation / 125));
  const charges = Math.round(postes.reduce((s, p) => s + POSTES_ENTREPRISE[p].salaireMensuel, 0) / 30 + REGLES_ENTREPRISE.fraisFixesJour);
  return { chiffre, charges, resultat: chiffre - charges };
}

export const francs = (n: number) => `${n.toLocaleString('fr-FR')} F`;

/** Les travaux possibles chez soi, comme au serveur (backend/src/carriere/patrimoine.ts) : métré, devis, puis journées de travaux. */
export interface Renovation {
  slug: string; nom: string; description: string; logements: readonly NiveauLogement[]; confort: number; journees: number; xp: number;
  metre: { question: string; cotes: ReadonlyArray<readonly [string, string]>; unite: string; reponse: number; tolerance: number; explication: string };
  materiaux: ReadonlyArray<{ nom: string; quantite: number; unite: string; prixUnitaire: number }>;
}
export const RENOVATIONS: Renovation[] = [
  {
    slug: 'peinture-sejour', nom: 'Repeindre le séjour', description: 'Reboucher, poncer et passer deux couches de peinture vinylique.', logements: ['studio', 'f2', 'villa'], confort: 2, journees: 2, xp: 40,
    metre: { question: 'Surface de murs à peindre', unite: 'm²', reponse: 40.41, tolerance: 1,
      cotes: [['Pièce', '4,50 m × 3,60 m'], ['Hauteur sous plafond', '2,70 m'], ['Porte', '0,90 m × 2,10 m'], ['Fenêtre', '1,20 m × 1,20 m']],
      explication: 'Périmètre 2 × (4,50 + 3,60) = 16,20 m, fois 2,70 m = 43,74 m², moins la porte (1,89 m²) et la fenêtre (1,44 m²) : 40,41 m².' },
    materiaux: [{ nom: 'Peinture vinylique, seau de 10 L (deux couches à 10 m² par litre)', quantite: 1, unite: 'seau', prixUnitaire: 16_000 }, { nom: 'Enduit de rebouchage', quantite: 1, unite: 'sac', prixUnitaire: 3_000 }, { nom: 'Rouleau, bac et bâche', quantite: 1, unite: 'lot', prixUnitaire: 4_500 }],
  },
  {
    slug: 'carrelage-douche', nom: 'Carreler la salle d’eau', description: 'Déposer l’ancien revêtement et poser un grès cérame antidérapant.', logements: ['studio', 'f2', 'villa'], confort: 3, journees: 3, xp: 60,
    metre: { question: 'Surface de sol à carreler', unite: 'm²', reponse: 4.32, tolerance: .1,
      cotes: [['Salle d’eau', '2,40 m × 1,80 m']],
      explication: '2,40 × 1,80 = 4,32 m² ; on commande 10 % de plus pour les coupes, soit 5 m².' },
    materiaux: [{ nom: 'Carrelage grès cérame (4,32 m² + 10 % de coupes)', quantite: 5, unite: 'm²', prixUnitaire: 7_500 }, { nom: 'Mortier-colle, sac de 25 kg', quantite: 2, unite: 'sac', prixUnitaire: 6_500 }, { nom: 'Joint hydrofuge', quantite: 1, unite: 'sac', prixUnitaire: 3_500 }],
  },
  {
    slug: 'cloison-bureau', nom: 'Monter une cloison pour un bureau', description: 'Isoler un coin bureau avec une cloison en agglos de 10, enduite des deux côtés.', logements: ['f2', 'villa'], confort: 3, journees: 3, xp: 70,
    metre: { question: 'Nombre d’agglos à commander, 5 % de casse comprise', unite: 'agglos', reponse: 114, tolerance: 3,
      cotes: [['Cloison', '3,20 m × 2,70 m'], ['Agglos au m², joints compris', '12,5'], ['Casse', '5 %']],
      explication: '3,20 × 2,70 = 8,64 m², à 12,5 agglos par m² : 108 agglos, plus 5 % de casse : 114.' },
    materiaux: [{ nom: 'Agglos de 10', quantite: 114, unite: 'agglo', prixUnitaire: 350 }, { nom: 'Ciment CPJ 42,5, sac de 50 kg', quantite: 3, unite: 'sac', prixUnitaire: 5_200 }, { nom: 'Sable de rivière', quantite: .3, unite: 'm³', prixUnitaire: 12_000 }],
  },
  {
    slug: 'terrasse-villa', nom: 'Couler une dalle de terrasse', description: 'Coffrer, ferrailler et couler une dalle de 12 cm au jardin.', logements: ['villa'], confort: 4, journees: 4, xp: 100,
    metre: { question: 'Volume de béton à couler', unite: 'm³', reponse: 2.4, tolerance: .1,
      cotes: [['Dalle', '5,00 m × 4,00 m'], ['Épaisseur', '12 cm']],
      explication: '5,00 × 4,00 × 0,12 = 2,40 m³. Dosé à 350 kg/m³, il faut 840 kg de ciment, soit 17 sacs.' },
    materiaux: [{ nom: 'Ciment CPJ 42,5, sac de 50 kg (350 kg/m³)', quantite: 17, unite: 'sac', prixUnitaire: 5_200 }, { nom: 'Sable de rivière', quantite: 1, unite: 'm³', prixUnitaire: 12_000 }, { nom: 'Gravier concassé', quantite: 2, unite: 'm³', prixUnitaire: 15_000 }, { nom: 'Treillis soudé, panneau', quantite: 4, unite: 'panneau', prixUnitaire: 9_500 }],
  },
];
export const coutMateriaux = (r: Pick<Renovation, 'materiaux'>) => Math.round(r.materiaux.reduce((s, m) => s + m.quantite * m.prixUnitaire, 0));
export const metreJuste = (r: Pick<Renovation, 'metre'>, reponse: number) => Number.isFinite(reponse) && Math.abs(reponse - r.metre.reponse) <= r.metre.tolerance;
export const INTERVALLE_JOURNEE_TRAVAUX_MS = 20 * 60_000;
/** En démonstration, une demi-minute tient lieu de journée du monde, pour essayer des travaux d'une traite. */
export const INTERVALLE_JOURNEE_DEMO_MS = 30_000;
export const ENERGIE_JOURNEE_TRAVAUX = 20;
export const ESSAIS_METRE = 3;
