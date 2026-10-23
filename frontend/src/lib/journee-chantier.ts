// Journée de travail au Grand chantier avec Yao : les tâches du jour suivent l'étape du programme
// (recrutement, implantation, fouilles… réception), puis le bilan fait avancer le chantier d'une journée.
import {
  PROGRAMME, SITUATION_EPI, TOTAL_JOURS, etapeAuJour, etapeDepuisNom, etatVisuel, lireOuvrier, metiersManquants, situation,
  type ChargementLivraison, type EtatVisuel, type IdEtape, type Metier, type Ouvrier, type ZoneChantier,
} from './programme-chantier';

export type { Choix, SituationTerrain, EtatVisuel, ZoneChantier } from './programme-chantier';
export { SITUATION_EPI, situation, etatVisuel } from './programme-chantier';

const borne = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const GROS_OEUVRE: Metier[] = ['Chef d’équipe', 'Maçon', 'Manœuvre', 'Ferrailleur', 'Coffreur'];

// ─── Chantier du simulateur ───

/** Chantier du simulateur, tel que renvoyé par GET /chantiers/mine (champs utiles au monde 3D). */
export interface ChantierSimulateur {
  id: string; statut: string; phaseCourante: number; avancementPct: number; avancementPhases?: Record<string, number> | null;
  chantier: { nom: string; phases: { nom: string }[] };
  evenementsLog?: { jour: number; type: string; texte: string }[] | null;
}

/** Étape du programme qui correspond à la phase en cours du simulateur, et le jour à l'intérieur de cette étape. */
export function etapeSimulateur(c: ChantierSimulateur): { etape: IdEtape; jourEtape: number; joursEtape: number; progression: number } {
  const nomPhase = c.chantier.phases[c.phaseCourante]?.nom ?? '';
  const progression = borne((c.avancementPhases?.[String(c.phaseCourante)] ?? 0) / 100, 0, .999);
  const id = etapeDepuisNom(nomPhase) ?? etapeAuJour(Math.floor(borne(c.avancementPct, 0, 99) / 100 * TOTAL_JOURS))?.etape.id ?? 'elevation';
  const etape = PROGRAMME.find(e => e.id === id)!;
  return { etape: id, jourEtape: 1 + Math.floor(progression * etape.jours), joursEtape: etape.jours, progression };
}

/** État visuel d'un chantier du simulateur : l'étape reconnue d'après le nom de la phase, et sa progression. */
export function etatVisuelSimulateur(c: ChantierSimulateur): EtatVisuel {
  if (c.statut !== 'en_cours') return etatVisuel(TOTAL_JOURS);
  const { etape, progression } = etapeSimulateur(c);
  const nomPhase = c.chantier.phases[c.phaseCourante]?.nom;
  return { etape, nom: nomPhase ?? PROGRAMME.find(e => e.id === etape)!.nom, progression, avancement: borne(c.avancementPct, 0, 100), jour: c.phaseCourante, total: c.chantier.phases.length };
}

/** Événements de la dernière journée jouée, dans le journal renvoyé par le simulateur. */
export function evenementsDuJour(c: Pick<ChantierSimulateur, 'evenementsLog'>) {
  const journal = c.evenementsLog ?? [];
  const jour = journal.reduce((max, e) => Math.max(max, e.jour ?? 0), 0);
  return journal.filter(e => e.jour === jour);
}

// ─── Déroulé de la journée ───

export type TypeTache = 'epi' | 'recrutement' | 'travail' | 'securite' | 'livraison';
export interface TacheJour { id: string; type: TypeTache; zone: ZoneChantier; titre: string }

export interface Journee {
  /** Jour du programme (0 = recrutement du premier jour). */
  numero: number;
  etape: IdEtape; jourEtape: number; joursEtape: number;
  taches: TacheJour[];
  /** Choix par situation ; pour le recrutement, la note de l'équipe sur 100. */
  reponses: Record<string, number>;
  /** Métiers à recruter aujourd'hui avant de pouvoir travailler (vide sinon). */
  recrutement: Metier[];
  livraison: ChargementLivraison | null;
}

export type PhaseJournee = 'epi' | 'recrutement' | 'travaux' | 'bilan';

export const TITRES_PHASES: Record<PhaseJournee, string> = {
  epi: 'Équipe-toi au vestiaire',
  recrutement: 'Recrute l’équipe au bureau',
  travaux: 'Travaux du jour',
  bilan: 'Fais le point avec Yao',
};

/** Jour du programme par lequel commence la prochaine journée : après une livraison, un nouvel ouvrage démarre
 * (directement à l'implantation si l'équipe de gros œuvre est déjà au complet). */
export function prochainJour(c: Pick<ChantierQuartier, 'jours' | 'equipe'>) {
  if (c.jours < TOTAL_JOURS) return Math.max(0, Math.floor(c.jours));
  return metiersManquants(c.equipe, GROS_OEUVRE).length ? 0 : 1;
}

/** Prépare la journée d'après l'étape du programme : équipement, recrutement des métiers manquants, deux ou trois
 * travaux de l'étape (différents d'un jour à l'autre), un point de sécurité, et la livraison du premier jour.
 * `simulateur` : étape imposée par le vrai chantier, dont l'équipe se gère dans le simulateur. */
export function nouvelleJournee(c: Pick<ChantierQuartier, 'jours' | 'equipe'>, simulateur?: { etape: IdEtape; jourEtape: number; joursEtape: number }): Journee {
  const numero = prochainJour(c);
  const courant = simulateur ? { etape: PROGRAMME.find(e => e.id === simulateur.etape)!, jourEtape: simulateur.jourEtape } : etapeAuJour(numero)!;
  const etape = courant.etape, d = courant.jourEtape;
  const recrutement = simulateur ? [] : metiersManquants(c.equipe, etape.id === 'recrutement' ? GROS_OEUVRE : etape.metiers);
  const taches: TacheJour[] = [{ id: SITUATION_EPI.id, type: 'epi', zone: 'vestiaire', titre: TITRES_PHASES.epi }];
  if (recrutement.length) taches.push({ id: 'recrutement', type: 'recrutement', zone: 'bureau', titre: `Recruter : ${recrutement.join(', ')}` });
  const n = etape.travaux.length, combien = etape.jours === 1 ? Math.min(n, 3) : Math.min(n, 2);
  for (let i = 0; i < combien; i++) {
    const tache = etape.travaux[((d - 1) * combien + i) % n];
    if (!taches.some(x => x.id === tache.situation.id)) taches.push({ id: tache.situation.id, type: 'travail', zone: tache.zone, titre: tache.situation.titre });
  }
  if (etape.securite.length) {
    const tache = etape.securite[(d - 1) % etape.securite.length];
    taches.push({ id: tache.situation.id, type: 'securite', zone: tache.zone, titre: tache.situation.titre });
  }
  const livraison = etape.livraison && d === 1 ? etape.livraison : null;
  if (livraison) taches.push({ id: livraison.situation.id, type: 'livraison', zone: 'portail', titre: livraison.situation.titre });
  return { numero, etape: etape.id, jourEtape: d, joursEtape: simulateur?.joursEtape ?? etape.jours, taches, reponses: {}, recrutement, livraison: livraison?.chargement ?? null };
}

/** Où en est la journée : l'équipement d'abord, puis le recrutement s'il manque des métiers, puis les travaux, puis le bilan. */
export function phaseJournee(j: Journee): PhaseJournee {
  if (j.reponses[SITUATION_EPI.id] === undefined) return 'epi';
  if (j.recrutement.length && j.reponses.recrutement === undefined) return 'recrutement';
  if (j.taches.some(t => (t.type === 'travail' || t.type === 'securite' || t.type === 'livraison') && j.reponses[t.id] === undefined)) return 'travaux';
  return 'bilan';
}

/** Tâches à faire maintenant (dans n'importe quel ordre pendant les travaux). */
export function tachesDisponibles(j: Journee): TacheJour[] {
  const phase = phaseJournee(j);
  if (phase === 'bilan') return [];
  return j.taches.filter(t => j.reponses[t.id] === undefined && (phase === 'travaux' ? t.type !== 'epi' && t.type !== 'recrutement' : t.type === phase));
}

/** Tâche disponible à une zone du chantier, ou null si ce n'est pas (ou plus) le moment d'y aller. */
export function tacheALaZone(j: Journee, zone: ZoneChantier) {
  return tachesDisponibles(j).find(t => t.zone === zone) ?? null;
}

/** Enregistre une réponse (une seule fois par situation). */
export function repondre(j: Journee, id: string, choix: number): Journee {
  if (j.reponses[id] !== undefined) return j;
  return { ...j, reponses: { ...j.reponses, [id]: choix } };
}

/** Enregistre le recrutement du jour avec la note de l'équipe constituée (0 à 1). */
export function enregistrerRecrutement(j: Journee, note: number): Journee {
  return repondre(j, 'recrutement', Math.round(borne(note, 0, 1) * 100));
}

export interface BilanJournee { bonnes: number; total: number; note: number; compte: boolean; paie: number; xp: number; mention: string }

/** Note sur 100 : présence 10, équipement 20, puis 70 points partagés entre les autres tâches (le recrutement compte
 * selon la note de l'équipe, la meilleure équipe possible valant la totalité). Sous 40, la journée est à refaire. */
export function bilanJournee(j: Journee): BilanJournee {
  const score = (t: TacheJour) => {
    if (t.type === 'recrutement') return Math.min(1, (j.reponses.recrutement ?? 0) / 95);
    const choix = j.reponses[t.id];
    return choix !== undefined && situation(t.id)?.choix[choix]?.correct ? 1 : 0;
  };
  const autres = j.taches.filter(t => t.type !== 'epi');
  const epi = score(j.taches[0]);
  const note = Math.round(10 + epi * 20 + (autres.length ? 70 * autres.reduce((n, t) => n + score(t), 0) / autres.length : 70));
  return {
    bonnes: j.taches.filter(t => score(t) >= .8).length, total: j.taches.length, note, compte: note >= 40,
    paie: 3000 + note * 40,
    xp: 20 + Math.round(note * .6),
    mention: note === 100 ? 'Journée exemplaire' : note >= 60 ? 'Bonne journée' : note >= 40 ? 'Journée correcte' : 'Journée à revoir',
  };
}

// ─── Abords du chantier dans la ville ───

export type PointPlan = [number, number];
export type PosteVille = 'yao' | 'entree';

/** Postes devant le portail sud, hors de l'emprise : Yao, et l'entrée du chantier pendant la journée. */
export function postesChantier(centre: PointPlan, _largeur: number, profondeur: number): Record<PosteVille, PointPlan> {
  const [x, z] = centre, hz = profondeur / 2;
  return { yao: [x - 3.4, z + hz + 2.6], entree: [x + .8, z + hz + 2.2] };
}

/** Bungalow de chantier, posé à l'angle sud-est, à l'extérieur de la palissade : centre et taille (repère monde). */
export function bungalowChantier(centre: PointPlan, largeur: number, profondeur: number) {
  return { x: centre[0] + largeur / 2 + 3.9, z: centre[1] + profondeur / 2 - 1.6, largeur: 4.6, profondeur: 2.3 };
}

// ─── Horaires et chantier du quartier ───

/** On peut commencer sa journée de 6 h à 18 h ; une journée commencée se termine même après la fermeture. */
export const OUVERTURE_CHANTIER = 6, FERMETURE_CHANTIER = 18, FIN_DE_JOURNEE = 17;
export const chantierOuvert = (heure: number) => heure >= OUVERTURE_CHANTIER && heure < FERMETURE_CHANTIER;

/** Chantier du quartier, sans compte ou sans chantier du simulateur : gardé dans le navigateur. */
export interface ChantierQuartier {
  version: 2;
  /** Journées comptées dans le programme (0 à TOTAL_JOURS). */
  jours: number; journees: number; livraisons: number; repos: { heure: number; le: number } | null;
  equipe: Ouvrier[];
}
export const CHANTIER_QUARTIER_INITIAL: ChantierQuartier = { version: 2, jours: 0, journees: 0, livraisons: 0, repos: null, equipe: [] };

/** Après une journée, on se repose jusqu'au lendemain : l'horloge a repassé minuit, ou une journée de jeu entière s'est écoulée. */
export function enRepos(c: Pick<ChantierQuartier, 'repos'>, heure: number, maintenant: number) {
  if (!c.repos) return false;
  return !(heure < c.repos.heure || maintenant - c.repos.le > 30 * 60_000);
}

export function journeeDisponible(c: Pick<ChantierQuartier, 'repos'>, heure: number, maintenant: number) {
  return chantierOuvert(heure) && !enRepos(c, heure, maintenant);
}

/** Applique une journée : elle compte dans le programme si elle n'est pas à refaire, et les recrues rejoignent l'équipe. */
export function appliquerJournee(c: ChantierQuartier, j: Journee, bilan: Pick<BilanJournee, 'compte'>, recrues: readonly Ouvrier[], heureFin: number, maintenant: number): ChantierQuartier {
  const jours = Math.min(TOTAL_JOURS, j.numero + (bilan.compte ? 1 : 0));
  const equipe = [...c.equipe.filter(o => !recrues.some(r => r.metier === o.metier)), ...recrues];
  return { ...c, jours, journees: c.journees + 1, livraisons: c.livraisons + (jours >= TOTAL_JOURS && j.numero < TOTAL_JOURS ? 1 : 0), repos: { heure: heureFin, le: maintenant }, equipe };
}

/** Lecture tolérante d'une sauvegarde locale (absente, ancienne ou abîmée). Une sauvegarde de l'ancienne journée
 * (avancement en pourcentage, sans équipe) repart au début du programme, en gardant ses compteurs et son repos. */
export function lireChantierQuartier(brut: unknown): ChantierQuartier {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Partial<ChantierQuartier>;
  const repos = c.repos && typeof c.repos === 'object' && Number.isFinite(c.repos.heure) && Number.isFinite(c.repos.le) ? { heure: c.repos.heure, le: c.repos.le } : null;
  const compteurs = { journees: Math.max(0, Math.floor(Number(c.journees) || 0)), livraisons: Math.max(0, Math.floor(Number(c.livraisons) || 0)), repos };
  if (c.version !== 2) return { ...CHANTIER_QUARTIER_INITIAL, ...compteurs };
  const equipe = (Array.isArray(c.equipe) ? c.equipe : []).map(lireOuvrier).filter((o): o is Ouvrier => o !== null);
  return { version: 2, jours: borne(Math.floor(Number(c.jours)), 0, TOTAL_JOURS), ...compteurs, equipe };
}
