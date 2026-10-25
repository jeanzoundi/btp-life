// Le rythme des besoins dans le monde vivant et l'humeur qui en découle, sans React. Miroir du serveur
// (backend/src/carriere/besoins.service.ts : TAUX_DECLIN_MONDE, declinMonde, pleineForme, facteurPerformance) :
// le monde affiche le déclin entre deux déclarations au serveur, et la démonstration le joue seule.

export const JAUGES = ['energie', 'faim', 'social', 'moral', 'hygiene', 'divertissement'] as const;
export type Jauge = (typeof JAUGES)[number];
export type BesoinsComplets = Record<Jauge, number>;

/** Par heure de jeu : une journée du monde dure 24 minutes réelles. */
export const TAUX_DECLIN_MONDE: Record<Jauge, number> = { energie: 4, faim: 6, social: 3, moral: 1, hygiene: 4, divertissement: 4 };
/** Pendant le sommeil, l'énergie ne baisse pas et le reste baisse deux fois moins vite. */
const FACTEUR_SOMMEIL = .5;

/** Le déclin de `heures` de jeu passées dans le monde, comme le calcule le serveur. */
export function declinMonde<T extends BesoinsComplets>(besoins: T, heures: number, sommeil = false): T {
  if (!(heures > 0)) return besoins;
  const suivant = { ...besoins };
  for (const j of JAUGES) {
    const taux = sommeil ? (j === 'energie' ? 0 : TAUX_DECLIN_MONDE[j] * FACTEUR_SOMMEIL) : TAUX_DECLIN_MONDE[j];
    suivant[j] = Math.max(0, Math.round(besoins[j] - taux * heures)) as T[Jauge];
  }
  return suivant;
}

/** En pleine forme : toutes les jauges à 70 ou plus. Les gains d'XP prennent alors 5 % de plus. */
export const pleineForme = (b: BesoinsComplets) => JAUGES.every(j => b[j] >= 70);

/** La forme du personnage : le facteur que le serveur applique aux gains d'XP (de 0,7 à 1,05). */
export function facteurForme(b: BesoinsComplets) {
  const moyenne = JAUGES.reduce((s, j) => s + b[j], 0) / JAUGES.length;
  return Math.max(.7, Math.min(1, .7 + (moyenne / 100) * .3)) + (pleineForme(b) ? .05 : 0);
}

export interface Humeur { jauge: Jauge; icone: string; nom: string; positive: boolean }

const HUMEURS: Record<Jauge, { haute: [string, string]; basse: [string, string] }> = {
  energie: { haute: ['😌', 'Bien reposé(e)'], basse: ['🥱', 'Épuisé(e)'] },
  faim: { haute: ['😋', 'Rassasié(e)'], basse: ['🍽️', 'Affamé(e)'] },
  hygiene: { haute: ['🚿', 'Frais et dispo'], basse: ['😬', 'Pas très frais'] },
  divertissement: { haute: ['😄', 'De bonne humeur'], basse: ['😐', 'S’ennuie'] },
  social: { haute: ['🤝', 'Bien entouré(e)'], basse: ['😔', 'Se sent seul(e)'] },
  moral: { haute: ['💪', 'Motivé(e)'], basse: ['😞', 'Découragé(e)'] },
};

/** Les humeurs du moment, façon jeu de simulation de vie : une par jauge très haute (80 et plus) ou très basse (sous 25),
 * les difficultés d'abord, de la plus forte à la plus légère. */
export function humeursDe(b: BesoinsComplets): Humeur[] {
  const basses = JAUGES.filter(j => b[j] < 25).sort((x, y) => b[x] - b[y])
    .map(j => ({ jauge: j, icone: HUMEURS[j].basse[0], nom: HUMEURS[j].basse[1], positive: false }));
  const hautes = JAUGES.filter(j => b[j] >= 80).sort((x, y) => b[y] - b[x])
    .map(j => ({ jauge: j, icone: HUMEURS[j].haute[0], nom: HUMEURS[j].haute[1], positive: true }));
  return [...basses, ...hautes];
}

/** L'humeur qui domine, affichée au-dessus des jauges : la pleine forme, sinon la difficulté la plus forte. */
export function humeurDuMoment(b: BesoinsComplets): { icone: string; nom: string; forme: number; pleineForme: boolean } {
  const forme = Math.round(facteurForme(b) * 100);
  if (pleineForme(b)) return { icone: '🌟', nom: 'En pleine forme', forme, pleineForme: true };
  const difficulte = humeursDe(b).find(h => !h.positive);
  return difficulte ? { icone: difficulte.icone, nom: difficulte.nom, forme, pleineForme: false } : { icone: '🙂', nom: 'Ça va', forme, pleineForme: false };
}

/** Les besoins tels que le serveur les renvoie (`/carriere/me`) ; un serveur pas encore à jour n'a pas les deux
 * dernières jauges : on les suppose correctes plutôt que vides. */
export function besoinsDe(c: Partial<BesoinsComplets>): BesoinsComplets {
  return {
    energie: c.energie ?? 100, faim: c.faim ?? 100, social: c.social ?? 80, moral: c.moral ?? 80,
    hygiene: c.hygiene ?? 100, divertissement: c.divertissement ?? 80,
  };
}
