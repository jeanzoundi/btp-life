// Défis du jour et de la semaine, imprévu du jour au Grand chantier. Connecté, tout vient du serveur
// (backend/src/monde/defis.service.ts) ; en démonstration, un petit jeu de défis et d'imprévus tourne dans le navigateur.

export type TypeObjectifDefi = 'seances_lieu' | 'chapitres' | 'missions' | 'cours' | 'trajets';
export interface Defi {
  slug: string; titre: string; description: string; periode: 'jour' | 'semaine';
  objectif: { type: TypeObjectifDefi; cible: number }; recompense: { xp: number; argent: number; reputation?: number };
  progres: number; reclame: boolean;
}
export interface ImprevuDuJour { slug: string; titre: string; description: string; options: string[] }
export interface DecisionImprevu { option: number; retour: string; effets: { xp: number; argent: number; reputation: number } }

export const cleJour = (d: Date) => d.toISOString().slice(0, 10);
export const reussi = (d: Pick<Defi, 'progres' | 'objectif'>) => d.progres >= d.objectif.cible;
export const aReclamer = (defis: readonly Defi[]) => defis.filter(d => reussi(d) && !d.reclame).length;

// ─── Démonstration ───

type DefiDemo = Omit<Defi, 'progres' | 'reclame'>;
export const DEFIS_DEMO: DefiDemo[] = [
  { slug: 'seance-du-jour', periode: 'jour', titre: 'Une séance chez un mentor', description: 'Termine une séance dans un lieu du quartier.', objectif: { type: 'seances_lieu', cible: 1 }, recompense: { xp: 25, argent: 1000 } },
  { slug: 'en-route', periode: 'jour', titre: 'En route', description: 'Prends un taxi ou un gbaka pour traverser le quartier.', objectif: { type: 'trajets', cible: 1 }, recompense: { xp: 10, argent: 300 } },
  { slug: 'le-fil-rouge-avance', periode: 'jour', titre: 'Le fil rouge avance', description: 'Valide un chapitre de la Résidence Akwaba.', objectif: { type: 'chapitres', cible: 1 }, recompense: { xp: 40, argent: 1500 } },
  { slug: 'habitue-du-quartier', periode: 'semaine', titre: 'Habitué du quartier', description: 'Termine cinq séances dans les lieux cette semaine.', objectif: { type: 'seances_lieu', cible: 5 }, recompense: { xp: 150, argent: 6000, reputation: 3 } },
];
export const IMPREVUS_DEMO: (ImprevuDuJour & { decisions: DecisionImprevu[] })[] = [
  { slug: 'orage-coulage', titre: 'L’orage menace le coulage', description: 'Le ciel se charge au moment de couler la dalle.', options: ['Je reporte le coulage et je bâche les aciers', 'On coule quand même, vite', 'On ajoute du ciment pour compenser la pluie'], decisions: [
    { option: 0, retour: 'La dalle sera coulée demain sur un ferraillage propre : la bonne décision.', effets: { xp: 15, argent: 0, reputation: 2 } },
    { option: 1, retour: 'La pluie délave le béton frais : une partie de la dalle est à reprendre.', effets: { xp: 0, argent: -3000, reputation: -2 } },
    { option: 2, retour: 'Le béton ne se corrige pas au hasard : le laboratoire le refusera.', effets: { xp: 0, argent: -1000, reputation: -1 } },
  ] },
  { slug: 'inspection-surprise', titre: 'Inspection surprise', description: 'L’inspecteur du travail se présente au portail sans prévenir.', options: ['Je l’accueille, je présente le registre et je fais la visite', 'Je le fais attendre le temps de distribuer les casques', 'Je lui propose une enveloppe pour qu’il reparte'], decisions: [
    { option: 0, retour: 'Registre à jour, EPI portés : l’inspection se passe bien.', effets: { xp: 20, argent: 0, reputation: 3 } },
    { option: 1, retour: 'L’inspecteur l’a vu : il note le défaut et reviendra.', effets: { xp: 0, argent: 0, reputation: -2 } },
    { option: 2, retour: 'Tentative de corruption : l’affaire est signalée, l’amende est lourde.', effets: { xp: 0, argent: -5000, reputation: -5 } },
  ] },
];

export interface TotauxDemo { seances: number; chapitres: number; trajets: number }
export interface EtatDefisDemo { jour: string; base: TotauxDemo; reclames: string[]; imprevu: number | null }

/** État de démonstration du jour : un nouvel instantané (et plus rien de réclamé) au changement de jour. */
export function etatDemo(brut: unknown, maintenant: Date, totaux: TotauxDemo): EtatDefisDemo {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Partial<EtatDefisDemo>;
  const jour = cleJour(maintenant);
  if (c.jour !== jour || !c.base) return { jour, base: { ...totaux }, reclames: [], imprevu: null };
  return { jour, base: c.base, reclames: Array.isArray(c.reclames) ? c.reclames.filter(s => typeof s === 'string') : [], imprevu: Number.isInteger(c.imprevu) ? c.imprevu as number : null };
}

/** Les défis de démonstration avec leur progression depuis l'instantané (la semaine compte comme le jour, en démonstration). */
export function defisDemo(etat: EtatDefisDemo, totaux: TotauxDemo): Defi[] {
  const ecart = { seances_lieu: totaux.seances - etat.base.seances, chapitres: totaux.chapitres - etat.base.chapitres, trajets: totaux.trajets - etat.base.trajets, missions: 0, cours: 0 };
  return DEFIS_DEMO.map(d => ({ ...d, progres: Math.max(0, Math.min(d.objectif.cible, ecart[d.objectif.type])), reclame: etat.reclames.includes(d.slug) }));
}

export const imprevuDemo = (jour: string) => IMPREVUS_DEMO[[...jour].reduce((s, c) => s + c.charCodeAt(0), 0) % IMPREVUS_DEMO.length];
