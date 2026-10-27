// Programme d'un lieu (laboratoire, dépôt, mairie…) : des étapes successives, une séance par jour de jeu, des tâches propres
// au métier du lieu (situation à trois réponses, mesure à calculer, pièces à choisir), un bilan, et un cycle qui recommence
// avec d'autres chiffres. Même méthode que le chantier, mécanique propre à chaque lieu. Sans Three.js ni React.
import type { PlanNavigable, Point } from './navigation-plan';
import type { SituationTerrain } from './programme-chantier';

/** Disposition d'un intérieur à programme : emprises, postes des tâches, place du mentor, point d'entrée. */
export interface PlanLieu extends PlanNavigable {
  ambiance: 'interieur' | 'exterieur'; depart: Point;
  /** Postes où se font les tâches, plus « mentor » pour aller lui parler. */
  stations: Record<string, Point>; libelles: Record<string, string>;
  mentor: { position: Point; rotation: number };
}

export interface TacheMesure {
  titre: string; enonce: string; donnees: { libelle: string; valeur: string }[];
  question: string; unite: string; reponse: number; tolerance: number; explication: string;
}
export interface OptionSelection { texte: string; attendu: boolean; explication: string }
export interface TacheSelection { titre: string; enonce: string; consigne: string; options: OptionSelection[] }
export type ContenuTache =
  | { type: 'situation'; situation: SituationTerrain }
  | { type: 'mesure'; mesure: TacheMesure }
  | { type: 'selection'; selection: TacheSelection };
export type TypeTacheLieu = ContenuTache['type'];

/** Une tâche d'étape. Son contenu dépend du numéro de cycle : les chiffres changent d'une campagne à l'autre. */
export interface TacheEtapeLieu { id: string; zone: string; titre: string; contenu: (cycle: number) => ContenuTache }
export interface EtapeLieu { id: string; nom: string; resume: string; taches: TacheEtapeLieu[] }

export interface ProgrammeLieu {
  slug: string;
  /** Ce qu'on mène à bien sur un cycle complet : « Campagne d'essais du béton », « Permis de construire »… */
  titre: string;
  /** Nom de l'unité d'un cycle, au singulier : « campagne », « commande », « dossier ». */
  cycle: string;
  mentor: { nom: string; role: string };
  horaires: { ouverture: number; fermeture: number };
  etapes: EtapeLieu[];
}

// ─── Séance du jour ───

export interface TacheSeance { id: string; zone: string; titre: string; type: TypeTacheLieu }
export interface SeanceLieu {
  slug: string; cycle: number;
  /** Rang de l'étape travaillée (0 = première). */
  etape: number;
  taches: TacheSeance[];
  /** Score de chaque tâche faite, de 0 à 100. */
  scores: Record<string, number>;
}

export interface ProgresLieu {
  version: 1;
  /** Étapes validées dans le cycle en cours (0 à nombre d'étapes). */
  etapes: number;
  seances: number;
  /** Cycles menés à bout. */
  cycles: number;
  repos: { heure: number; le: number } | null;
}
export const PROGRES_INITIAL: ProgresLieu = { version: 1, etapes: 0, seances: 0, cycles: 0, repos: null };

const borne = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

/** Étape de la prochaine séance : après un cycle terminé, le suivant commence à la première étape. */
export const prochaineEtape = (p: ProgrammeLieu, progres: Pick<ProgresLieu, 'etapes'>) => progres.etapes >= p.etapes.length ? 0 : progres.etapes;
/** Numéro du cycle de la prochaine séance : celui en cours, ou le suivant quand le précédent vient d'être bouclé (les deux valent `cycles`). */
export const prochainCycle = (progres: Pick<ProgresLieu, 'cycles'>) => progres.cycles;

export function nouvelleSeance(p: ProgrammeLieu, progres: Pick<ProgresLieu, 'etapes' | 'cycles'>): SeanceLieu {
  const etape = prochaineEtape(p, progres);
  return { slug: p.slug, cycle: prochainCycle(progres), etape, taches: p.etapes[etape].taches.map(t => ({ id: t.id, zone: t.zone, titre: t.titre, type: t.contenu(0).type })), scores: {} };
}

export function contenuTache(p: ProgrammeLieu, s: Pick<SeanceLieu, 'etape' | 'cycle'>, id: string): ContenuTache | null {
  const tache = p.etapes[s.etape]?.taches.find(t => t.id === id);
  return tache ? tache.contenu(s.cycle) : null;
}

export const tachesRestantes = (s: SeanceLieu) => s.taches.filter(t => s.scores[t.id] === undefined);
export const tacheALaZoneLieu = (s: SeanceLieu, zone: string) => tachesRestantes(s).find(t => t.zone === zone) ?? null;
export const seanceFaite = (s: SeanceLieu) => tachesRestantes(s).length === 0;

/** Enregistre le score d'une tâche (une seule fois). */
export function noter(s: SeanceLieu, id: string, score: number): SeanceLieu {
  if (s.scores[id] !== undefined || !s.taches.some(t => t.id === id)) return s;
  return { ...s, scores: { ...s.scores, [id]: Math.round(borne(score, 0, 100)) } };
}

// ─── Correction de chaque type de tâche ───

export const scoreSituation = (situation: SituationTerrain, choix: number) => situation.choix[choix]?.correct ? 100 : 0;

/** Dans la tolérance : tous les points ; à moins du double : la moitié (erreur d'arrondi ou d'unité près). */
export function scoreMesure(m: TacheMesure, valeur: number) {
  if (!Number.isFinite(valeur)) return 0;
  const ecart = Math.abs(valeur - m.reponse);
  return ecart <= m.tolerance ? 100 : ecart <= m.tolerance * 2 ? 50 : 0;
}

/** Chaque bon choix rapporte, chaque intrus coché retire autant ; rapporté au nombre de pièces attendues. */
export function scoreSelection(t: TacheSelection, coches: readonly number[]) {
  const attendus = t.options.filter(o => o.attendu).length;
  const bons = coches.filter(i => t.options[i]?.attendu).length, intrus = coches.filter(i => t.options[i] && !t.options[i].attendu).length;
  return attendus ? Math.round(borne((bons - intrus) / attendus, 0, 1) * 100) : 0;
}

/** Lecture tolérante d'un nombre saisi (virgule ou point, espaces de milliers). */
export const lireNombre = (texte: string) => Number(texte.replace(/[\s  ]/g, '').replace(',', '.'));

// ─── Bilan et progression ───

export interface BilanSeance { note: number; reussies: number; total: number; compte: boolean; mention: string; paie: number; xp: number }

/** Note sur 100 : présence 10, puis 90 points partagés entre les tâches. Sous 40, l'étape est à refaire.
 * Paie et XP : la formule du serveur (backend/src/carriere/lieux.service.ts, gainsSeance), avant le facteur des besoins. */
export function bilanSeance(s: SeanceLieu): BilanSeance {
  const scores = s.taches.map(t => s.scores[t.id] ?? 0);
  const note = Math.round(10 + 90 * (scores.reduce((n, x) => n + x, 0) / Math.max(1, scores.length)) / 100);
  const compte = note >= 40;
  return {
    note, reussies: scores.filter(x => x >= 80).length, total: scores.length, compte,
    mention: note === 100 ? 'Séance exemplaire' : note >= 60 ? 'Bonne séance' : note >= 40 ? 'Séance correcte' : 'Séance à reprendre',
    paie: compte ? 500 + note * 15 : 0, xp: compte ? 10 + Math.round(note * .4) : Math.round(note * .2),
  };
}

/** Progression d'un lieu tenue par le serveur (GET /carriere/lieux) ; le repos du jour reste propre à l'horloge du navigateur. */
export interface ProgresLieuServeur { etapes: number; cycles: number; seances: number; derniereRecompenseLe: string | null }
/** Ce que le serveur a réellement versé pour une séance (POST /carriere/lieux/:slug/seance). */
export interface GainsSeance {
  xp: number; argent: number; reputation: number; facteurBesoins: number; entrainement: boolean; prochaineRecompenseLe: string;
  /** Compétence travaillée à l'étape, et l'XP qu'elle a gagnée (absente à l'entraînement ou sous 40). */
  competence?: { slug: string; nom: string; xp: number } | null;
  /** Coéquipiers présents dans le lieu pendant la séance, et le bonus d'XP qu'ils ont valu. */
  equipe?: { coequipiers: string[]; bonus: number } | null;
}

export function fusionnerProgres(p: ProgrammeLieu, local: ProgresLieu, serveur: ProgresLieuServeur | undefined): ProgresLieu {
  if (!serveur) return local;
  return { ...local, etapes: borne(Math.floor(serveur.etapes), 0, p.etapes.length), cycles: Math.max(0, Math.floor(serveur.cycles)), seances: Math.max(0, Math.floor(serveur.seances)) };
}

export const lieuOuvert = (p: ProgrammeLieu, heure: number) => heure >= p.horaires.ouverture && heure < p.horaires.fermeture;

/** Après une séance, on revient le lendemain : l'horloge a repassé minuit, ou une journée de jeu entière s'est écoulée. */
export function enReposLieu(progres: Pick<ProgresLieu, 'repos'>, heure: number, maintenant: number) {
  if (!progres.repos) return false;
  return !(heure < progres.repos.heure || maintenant - progres.repos.le > 30 * 60_000);
}

export const seanceDisponible = (p: ProgrammeLieu, progres: ProgresLieu, heure: number, maintenant: number) => lieuOuvert(p, heure) && !enReposLieu(progres, heure, maintenant);

/** Applique une séance : l'étape est validée si la séance compte ; la dernière étape validée clôt le cycle. */
export function appliquerSeance(p: ProgrammeLieu, progres: ProgresLieu, s: SeanceLieu, bilan: Pick<BilanSeance, 'compte'>, heureFin: number, maintenant: number): ProgresLieu {
  const etapes = Math.min(p.etapes.length, s.etape + (bilan.compte ? 1 : 0));
  return {
    version: 1, etapes, seances: progres.seances + 1,
    cycles: s.cycle + (etapes >= p.etapes.length ? 1 : 0),
    repos: { heure: heureFin, le: maintenant },
  };
}

export function lireProgresLieu(p: ProgrammeLieu, brut: unknown): ProgresLieu {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Partial<ProgresLieu>;
  if (c.version !== 1) return PROGRES_INITIAL;
  const repos = c.repos && typeof c.repos === 'object' && Number.isFinite(c.repos.heure) && Number.isFinite(c.repos.le) ? { heure: c.repos.heure, le: c.repos.le } : null;
  return {
    version: 1, etapes: borne(Math.floor(Number(c.etapes)), 0, p.etapes.length),
    seances: Math.max(0, Math.floor(Number(c.seances) || 0)), cycles: Math.max(0, Math.floor(Number(c.cycles) || 0)), repos,
  };
}

/** Utilitaires pour les contenus : choisir une valeur selon le cycle, arrondir à l'affichage. */
export const selon = <T,>(cycle: number, valeurs: readonly T[]) => valeurs[Math.abs(Math.floor(cycle)) % valeurs.length];
export const fr = (n: number, decimales = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
