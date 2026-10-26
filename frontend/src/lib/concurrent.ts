// Le concurrent du fil rouge : l'une des trois entreprises consultées par Mme Touré, battue au premier chapitre, qui
// surveille la Résidence Akwaba jusqu'à la livraison. Il passe devant la parcelle aux heures de chantier, commente chaque
// étape et appelle le joueur. Tout se joue côté jeu, à partir de la progression de la campagne.

export const CONCURRENT = { nom: 'Serge Ahoussou', prenom: 'Serge', entreprise: 'Bâti-Express', role: 'Conducteur de travaux chez Bâti-Express' } as const;

/** Ce que dit le concurrent après chaque chapitre validé (la clé est le nombre de chapitres validés). */
export const REPLIQUES_CONCURRENT: ReadonlyArray<[number, string]> = [
  [1, 'Mme Touré vous a choisis ? Profitez-en : au premier retard, c’est moi qu’elle appellera.'],
  [3, 'Des semelles de 2 m… Chez Bâti-Express, on aurait trouvé moins cher.'],
  [4, 'Le permis à temps ? Vous avez de la chance avec l’hôtel de ville.'],
  [6, 'Trente-deux mètres cubes commandés ? J’espère que tes toupies arriveront avant la pluie.'],
  [7, 'Votre gros œuvre monte vite. Trop vite ? On verra au contrôle.'],
  [8, 'Bon… je dois reconnaître que c’est propre. Mais l’immeuble n’est pas encore livré.'],
  [9, 'Chapeau. Mme Touré ne parle plus que de vous. La prochaine parcelle, je ne te la laisserai pas.'],
];

/** La dernière réplique méritée, ou rien avant que le marché soit gagné. */
export function repliqueConcurrent(chapitres: number): string | null {
  return [...REPLIQUES_CONCURRENT].reverse().find(([apres]) => chapitres >= apres)?.[1] ?? null;
}

/** La réplique qui vient d'être débloquée par ce chapitre, s'il y en a une. */
export const nouvelleReplique = (chapitres: number) => REPLIQUES_CONCURRENT.find(([apres]) => apres === chapitres)?.[1] ?? null;

export const PENSEES_CONCURRENT = [
  { icone: '🧐', texte: 'Leur béton tiendra-t-il ?' },
  { icone: '📋', texte: 'Je note tout…' },
  { icone: '😤', texte: 'Ce marché était pour nous' },
  { icone: '📏', texte: 'Cet aplomb est-il juste ?' },
] as const;

/** Il fait les cent pas sur le trottoir de l'avenue, à côté de la parcelle (le trottoir des passants du Plateau Nord). */
export const ROUTE_CONCURRENT: [number, number][] = [[13, -70.4], [19, -70.4]];

/** Le concurrent rôde tant que l'immeuble n'est pas livré, aux heures de chantier, une fois le marché attribué. */
export const presenceConcurrent = (chapitres: number, heure: number) => chapitres >= 1 && chapitres < 9 && heure >= 8 && heure < 17;
