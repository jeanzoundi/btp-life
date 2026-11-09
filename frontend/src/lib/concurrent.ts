// Le concurrent du fil rouge : l'une des trois entreprises consultées par Mme Touré, battue au premier chapitre, qui
// surveille la Résidence Akwaba jusqu'à la livraison, puis perd encore le R+5 de son frère. Il passe devant la parcelle du
// dossier en cours aux heures de chantier, commente chaque étape et appelle le joueur ; au bout des Rôniers, il devient
// son partenaire. Tout se joue côté jeu, à partir de la progression de la campagne.
import { DOSSIERS } from './campagne';

export const CONCURRENT = { nom: 'Serge Ahoussou', prenom: 'Serge', entreprise: 'Bâti-Express', role: 'Conducteur de travaux chez Bâti-Express' } as const;

/** Ce que dit le concurrent après chaque chapitre validé (la clé est le nombre de chapitres validés du fil rouge). */
export const REPLIQUES_CONCURRENT: ReadonlyArray<[number, string]> = [
  [1, 'Mme Touré vous a choisis ? Profitez-en : au premier retard, c’est moi qu’elle appellera.'],
  [3, 'Des semelles de 2 m… Chez Bâti-Express, on aurait trouvé moins cher.'],
  [4, 'Le permis à temps ? Vous avez de la chance avec l’hôtel de ville.'],
  [6, 'Trente-deux mètres cubes commandés ? J’espère que tes toupies arriveront avant la pluie.'],
  [7, 'Votre gros œuvre monte vite. Trop vite ? On verra au contrôle.'],
  [8, 'Bon… je dois reconnaître que c’est propre. Mais l’immeuble n’est pas encore livré.'],
  [9, 'Chapeau. Mme Touré ne parle plus que de vous. La prochaine parcelle, je ne te la laisserai pas.'],
  [12, 'Paraît que le frère de Mme Touré prépare un R+5 à Cocody. Bâti-Express sera sur les rangs : que le meilleur gagne.'],
  // Le deuxième dossier : la Résidence Les Rôniers, aux Jardins de l'Ouest.
  [13, 'Encore vous ? Daouda Touré aurait dû écouter mes 10 % de moins. On verra qui rira à la livraison.'],
  [15, 'Des pieux forés ? Moi, je les aurais battus : plus vite, moins cher… et tant pis pour les voisins. Enfin, je dis ça.'],
  [16, 'Le permis du R+5 du premier coup ? L’urbanisme t’adore, décidément.'],
  [18, 'Huit jours de forage, et pas une plainte des Résidences. Comment tu fais ?'],
  [20, 'J’ai vu ta grue s’arrêter pendant l’orage. Nous, on aurait monté la dernière benne… Bon, peut-être pas.'],
  [21, 'Six planchers, et toujours pas un jour de retard. Il faudra qu’on parle, toi et moi.'],
  [23, 'Les Rôniers livrés à l’heure… Je passe te voir à la Tour : j’ai une idée trop grosse pour Bâti-Express seul.'],
  [24, 'Associés pour le groupe scolaire, alors ! Qui l’eût cru ? Cette fois, que le meilleur gagne… avec nous.'],
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

/** Devant Akwaba, il fait les cent pas sur le trottoir de l'avenue, à côté de la parcelle (celui des passants du Plateau Nord). */
export const ROUTE_CONCURRENT: [number, number][] = [[13, -70.4], [19, -70.4]];
/** Devant les Rôniers, sur le trottoir ouest de l'avenue nord-sud, le long de la palissade. */
export const ROUTE_CONCURRENT_RONIERS: [number, number][] = [[-59.2, -39.5], [-59.2, -31]];
const ROUTES = [ROUTE_CONCURRENT, ROUTE_CONCURRENT_RONIERS];

/** Où rôde le concurrent : devant la parcelle du dossier en cours, aux heures de chantier, une fois le marché attribué et
 * jusqu'à la livraison de l'immeuble ; ailleurs, et la nuit, il n'est pas là. */
export function routeConcurrent(chapitres: number, heure: number): [number, number][] | null {
  if (heure < 8 || heure >= 17) return null;
  const i = DOSSIERS.findIndex(d => chapitres >= d.debut + 1 && chapitres < d.debut + d.livraison);
  return i >= 0 ? ROUTES[i] ?? null : null;
}
/** Le concurrent rôde-t-il en ce moment (devant Akwaba ou les Rôniers) ? */
export const presenceConcurrent = (chapitres: number, heure: number) => routeConcurrent(chapitres, heure) !== null;
