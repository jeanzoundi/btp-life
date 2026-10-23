// Journée de travail au Grand chantier avec Yao : étapes, situations de terrain, bilan, et avancement du chantier.

export type PhaseVisuelle = 'terrain' | 'fondations' | 'elevation' | 'toiture' | 'finitions' | 'livre';

export const PHASES_VISUELLES: readonly { id: PhaseVisuelle; nom: string; debut: number }[] = [
  { id: 'terrain', nom: 'Implantation et terrassement', debut: 0 },
  { id: 'fondations', nom: 'Fondations', debut: 15 },
  { id: 'elevation', nom: 'Élévation des murs', debut: 35 },
  { id: 'toiture', nom: 'Toiture', debut: 70 },
  { id: 'finitions', nom: 'Finitions', debut: 85 },
  { id: 'livre', nom: 'Ouvrage livré', debut: 100 },
];

export interface EtatVisuel { phase: PhaseVisuelle; nom: string; progression: number; avancement: number }

const borne = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

/** Phase à montrer en 3D et avancement à l'intérieur de cette phase (0 à 1), d'après l'avancement global. */
export function etatVisuel(avancement: number): EtatVisuel {
  const a = borne(avancement, 0, 100);
  let i = PHASES_VISUELLES.length - 1;
  while (i > 0 && a < PHASES_VISUELLES[i].debut) i--;
  const debut = PHASES_VISUELLES[i].debut, fin = PHASES_VISUELLES[i + 1]?.debut ?? 100;
  return { phase: PHASES_VISUELLES[i].id, nom: PHASES_VISUELLES[i].nom, progression: fin > debut ? (a - debut) / (fin - debut) : 1, avancement: a };
}

/** Rapproche un nom de phase du simulateur (« Terrassement », « Gros œuvre »…) de sa représentation 3D. */
export function phaseDepuisNom(nom: string): PhaseVisuelle | null {
  // « œ » n'est pas décomposé par NFD : on le développe à la main (gros œuvre, second œuvre).
  const n = nom.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/terrass|implant|prepar|install|demol|decap/.test(n)) return 'terrain';
  if (/fondation|semelle|longrine|soubassement|radier/.test(n)) return 'fondations';
  if (/toit|charpente|couverture|etanch/.test(n)) return 'toiture';
  if (/elevation|gros.?oeuvre|maconnerie|structure|poteau|dalle|beton|mur/.test(n)) return 'elevation';
  if (/finition|second.?oeuvre|peinture|electri|plomberie|menuiserie|carrelage|enduit|vrd|amenag|livraison/.test(n)) return 'finitions';
  return null;
}

/** Chantier du simulateur, tel que renvoyé par GET /chantiers/mine (champs utiles au monde 3D). */
export interface ChantierSimulateur {
  id: string; statut: string; phaseCourante: number; avancementPct: number; avancementPhases?: Record<string, number> | null;
  chantier: { nom: string; phases: { nom: string }[] };
  evenementsLog?: { jour: number; type: string; texte: string }[] | null;
}

/** État visuel d'un chantier du simulateur : la phase en cours si son nom est reconnu, sinon l'avancement global. */
export function etatVisuelSimulateur(c: ChantierSimulateur): EtatVisuel {
  if (c.statut !== 'en_cours') return etatVisuel(100);
  const nomPhase = c.chantier.phases[c.phaseCourante]?.nom;
  const reconnue = nomPhase ? phaseDepuisNom(nomPhase) : null;
  if (!reconnue || !nomPhase) return { ...etatVisuel(c.avancementPct), ...(nomPhase ? { nom: nomPhase } : {}) };
  return { phase: reconnue, nom: nomPhase, progression: borne((c.avancementPhases?.[String(c.phaseCourante)] ?? 0) / 100, 0, 1), avancement: borne(c.avancementPct, 0, 100) };
}

/** Événements de la dernière journée jouée, dans le journal renvoyé par le simulateur. */
export function evenementsDuJour(c: Pick<ChantierSimulateur, 'evenementsLog'>) {
  const journal = c.evenementsLog ?? [];
  const jour = journal.reduce((max, e) => Math.max(max, e.jour ?? 0), 0);
  return journal.filter(e => e.jour === jour);
}

// ─── Situations de terrain ───

export interface Choix { texte: string; correct: boolean; retour: string }
export interface SituationTerrain { id: string; titre: string; situation: string; choix: readonly Choix[] }

export const SITUATION_EPI: SituationTerrain = {
  id: 'epi', titre: 'Avant d’entrer sur le chantier',
  situation: 'Il fait déjà chaud ce matin. Le bungalow met à disposition casques, chaussures de sécurité et gilets haute visibilité.',
  choix: [
    { texte: 'Casque, chaussures de sécurité et gilet haute visibilité', correct: true, retour: 'C’est la tenue minimale sur un chantier, même pour une simple visite.' },
    { texte: 'Juste le casque, il fait trop chaud pour le reste', correct: false, retour: 'Un clou ou une charge qui tombe ne regarde pas la météo : chaussures et gilet sont obligatoires.' },
    { texte: 'Rien : je ne fais que passer', correct: false, retour: 'Personne n’entre sans équipement, pas même le chef. C’est la première règle du chantier.' },
  ],
};

export const SITUATIONS_SECURITE: readonly SituationTerrain[] = [
  { id: 'echafaudage', titre: 'Échafaudage', situation: 'Au deuxième niveau de l’échafaudage, un garde-corps manque côté rue. Un maçon y travaille.', choix: [
    { texte: 'Je fais arrêter le travail en hauteur et poser le garde-corps', correct: true, retour: 'Une chute de hauteur est l’accident le plus grave du BTP : on sécurise d’abord, on reprend ensuite.' },
    { texte: 'Je lui demande de faire attention', correct: false, retour: 'La vigilance ne remplace pas une protection collective. Il faut arrêter et poser le garde-corps.' },
    { texte: 'Je le note pour la semaine prochaine', correct: false, retour: 'Le risque est immédiat : on ne reporte jamais une protection contre les chutes.' },
  ] },
  { id: 'fouille', titre: 'Fouille', situation: 'La tranchée des réseaux n’est pas balisée et coupe le passage des ouvriers.', choix: [
    { texte: 'Je fais poser un balisage et une passerelle', correct: true, retour: 'Une fouille doit être signalée et franchissable en sécurité.' },
    { texte: 'Je la contourne et je continue', correct: false, retour: 'Les autres, eux, risquent d’y tomber. Un danger repéré doit être traité.' },
    { texte: 'Ce n’est pas mon rôle', correct: false, retour: 'La sécurité est l’affaire de tous : on signale et on fait corriger.' },
  ] },
  { id: 'rallonge', titre: 'Électricité', situation: 'Une rallonge électrique traverse une flaque d’eau près de la bétonnière.', choix: [
    { texte: 'Je fais couper le courant et déplacer la rallonge', correct: true, retour: 'Eau et électricité : on coupe d’abord, puis on fait passer le câble en hauteur ou à l’abri.' },
    { texte: 'Je l’enjambe avec précaution', correct: false, retour: 'Le risque d’électrocution reste là pour les autres. Il faut couper et déplacer.' },
    { texte: 'J’attends que la flaque sèche', correct: false, retour: 'En attendant, n’importe qui peut s’électrocuter. On agit tout de suite.' },
  ] },
  { id: 'charge', titre: 'Levage', situation: 'La grue déplace une palette de parpaings. Deux ouvriers discutent juste sous la charge.', choix: [
    { texte: 'Je les fais sortir de la zone et je préviens le grutier', correct: true, retour: 'Personne ne stationne sous une charge suspendue, jamais.' },
    { texte: 'Je les laisse, la palette est bien sanglée', correct: false, retour: 'Une élingue peut lâcher. La zone sous la charge doit rester vide.' },
    { texte: 'Je fais signe au grutier d’aller plus vite', correct: false, retour: 'Accélérer augmente le balancement. On dégage d’abord la zone.' },
  ] },
  { id: 'stockage', titre: 'Stockage', situation: 'Des parpaings sont empilés sur la dalle, au bord du vide, sur plus d’un mètre.', choix: [
    { texte: 'Je fais reculer et abaisser la pile', correct: true, retour: 'Un stock au bord du vide peut tomber sur ceux qui travaillent en dessous.' },
    { texte: 'Je laisse, on va les utiliser vite', correct: false, retour: 'Il suffit d’un choc pour qu’un bloc tombe. On stocke loin du bord.' },
    { texte: 'Je fais monter encore plus de parpaings', correct: false, retour: 'Surcharger une dalle au bord du vide aggrave le danger.' },
  ] },
  { id: 'decoupe', titre: 'Découpe', situation: 'Un ouvrier découpe des parpaings à la disqueuse, sans lunettes ni gants.', choix: [
    { texte: 'Je l’arrête et lui fais mettre lunettes, gants et masque', correct: true, retour: 'Éclats et poussière de silice : la découpe exige lunettes, gants et masque.' },
    { texte: 'Je le laisse finir, ce sera rapide', correct: false, retour: 'Un éclat dans l’œil ne prend qu’une seconde. On s’équipe avant de couper.' },
    { texte: 'Je lui prête mes lunettes de soleil', correct: false, retour: 'Des lunettes de soleil ne protègent pas des éclats : il faut des lunettes de protection.' },
  ] },
];

export const SITUATIONS_LIVRAISON: readonly SituationTerrain[] = [
  { id: 'ciment', titre: 'Livraison de ciment', situation: 'Bon de livraison : 40 sacs de ciment CPJ 45. Tu comptes 36 sacs, dont 2 déchirés.', choix: [
    { texte: 'J’accepte en notant mes réserves sur le bon : 34 sacs conformes', correct: true, retour: 'Les réserves écrites protègent l’entreprise : on ne paiera que ce qui est livré en bon état.' },
    { texte: 'Je signe sans rien dire, le chauffeur est pressé', correct: false, retour: 'Une signature sans réserve vaut acceptation : l’entreprise paierait 40 sacs.' },
    { texte: 'Je refuse toute la livraison', correct: false, retour: 'Refuser tout bloque le chantier. On accepte ce qui est conforme et on note le reste.' },
  ] },
  { id: 'fers', titre: 'Livraison d’aciers', situation: 'Commande : barres HA12 pour les poteaux. Le camion apporte des barres HA10.', choix: [
    { texte: 'Je refuse ces barres et je préviens le conducteur de travaux', correct: true, retour: 'Un diamètre plus faible ne tient pas les charges calculées : la livraison n’est pas conforme.' },
    { texte: 'J’accepte, la différence est minime', correct: false, retour: 'Deux millimètres de moins, c’est environ 30 % d’acier en moins dans le poteau.' },
    { texte: 'Je les fais poser en doublant les barres', correct: false, retour: 'On ne modifie jamais un ferraillage sans l’accord du bureau d’études.' },
  ] },
  { id: 'parpaings', titre: 'Livraison de parpaings', situation: 'Une palette de parpaings arrive avec une dizaine de blocs cassés.', choix: [
    { texte: 'J’accepte en notant les blocs cassés sur le bon', correct: true, retour: 'Les blocs abîmés seront remplacés ou déduits de la facture.' },
    { texte: 'Je fais poser les blocs cassés quand même', correct: false, retour: 'Des blocs fissurés affaiblissent le mur. On les écarte.' },
    { texte: 'Je jette les blocs cassés sans rien noter', correct: false, retour: 'Sans réserve écrite, l’entreprise paie des blocs inutilisables.' },
  ] },
];

const TOUTES = [SITUATION_EPI, ...SITUATIONS_SECURITE, ...SITUATIONS_LIVRAISON];
export const situation = (id: string) => TOUTES.find(s => s.id === id);

// ─── Déroulé de la journée ───

export type EtapeJournee = 'epi' | 'securite' | 'livraison' | 'bilan';
export type PosteChantier = 'bungalow' | 'securite-0' | 'securite-1' | 'securite-2' | 'livraison';

export interface Journee { numero: number; etape: EtapeJournee; securite: [string, string, string]; livraison: string; reponses: Record<string, number> }

/** Prépare la journée : trois points de sécurité et une livraison qui changent d'une journée à l'autre. */
export function nouvelleJournee(numero: number): Journee {
  const n = SITUATIONS_SECURITE.length, k = Math.abs(Math.floor(numero));
  const securite = [0, 1, 2].map(i => SITUATIONS_SECURITE[(k + i * 2) % n].id) as [string, string, string];
  return { numero: k, etape: 'epi', securite, livraison: SITUATIONS_LIVRAISON[k % SITUATIONS_LIVRAISON.length].id, reponses: {} };
}

/** Situation attendue à un poste, ou null si ce n'est pas (ou plus) le moment d'y aller. */
export function situationAuPoste(j: Journee, poste: PosteChantier): SituationTerrain | null {
  if (poste === 'bungalow') return j.etape === 'epi' ? SITUATION_EPI : null;
  if (poste === 'livraison') return j.etape === 'livraison' ? situation(j.livraison) ?? null : null;
  const id = j.securite[Number(poste.slice(-1))];
  return j.etape === 'securite' && j.reponses[id] === undefined ? situation(id) ?? null : null;
}

/** Postes où le joueur doit encore se rendre pour l'étape en cours. */
export function postesRestants(j: Journee): PosteChantier[] {
  if (j.etape === 'epi') return ['bungalow'];
  if (j.etape === 'livraison') return ['livraison'];
  if (j.etape === 'securite') return (['securite-0', 'securite-1', 'securite-2'] as const).filter((_, i) => j.reponses[j.securite[i]] === undefined);
  return [];
}

/** Enregistre une réponse (une seule fois par situation) et passe à l'étape suivante quand celle-ci est complète. */
export function repondre(j: Journee, id: string, choix: number): Journee {
  if (j.reponses[id] !== undefined) return j;
  const reponses = { ...j.reponses, [id]: choix };
  let etape = j.etape;
  if (j.etape === 'epi' && id === SITUATION_EPI.id) etape = 'securite';
  else if (j.etape === 'securite' && j.securite.every(s => reponses[s] !== undefined)) etape = 'livraison';
  else if (j.etape === 'livraison' && id === j.livraison) etape = 'bilan';
  return { ...j, reponses, etape };
}

export const TITRES_ETAPES: Record<EtapeJournee, string> = {
  epi: 'Équipe-toi au bungalow',
  securite: 'Fais le tour de sécurité',
  livraison: 'Réceptionne la livraison',
  bilan: 'Fais le point avec Yao',
};

export interface BilanJournee { bonnes: number; total: number; note: number; avancement: number; paie: number; xp: number; mention: string }

/** Note sur 100 (présence 10, équipement 20, chaque point de sécurité 15, livraison 25) et récompenses qui en découlent. « Journée exemplaire » est réservée au sans-faute. */
export function bilanJournee(j: Journee): BilanJournee {
  const juste = (id: string) => { const choix = j.reponses[id]; return choix !== undefined && Boolean(situation(id)?.choix[choix]?.correct); };
  const ids = [SITUATION_EPI.id, ...j.securite, j.livraison];
  const note = 10 + (juste(SITUATION_EPI.id) ? 20 : 0) + j.securite.filter(juste).length * 15 + (juste(j.livraison) ? 25 : 0);
  return {
    bonnes: ids.filter(juste).length, total: ids.length, note,
    avancement: Math.round(8 + note * .12),
    paie: 3000 + note * 40,
    xp: 20 + Math.round(note * .6),
    mention: note === 100 ? 'Journée exemplaire' : note >= 60 ? 'Bonne journée' : note >= 40 ? 'Journée correcte' : 'Journée à revoir',
  };
}

// ─── Postes autour de la palissade ───

export type PointPlan = [number, number];

/** Postes de la journée, hors de l'emprise du chantier (le joueur ne marche pas dans la fouille) : Yao et le camion
 * devant le portail sud, le bungalow à l'angle sud-est, les trois points de sécurité le long de la palissade. */
export function postesChantier(centre: PointPlan, largeur: number, profondeur: number): Record<PosteChantier | 'yao', PointPlan> {
  const [x, z] = centre, hx = largeur / 2, hz = profondeur / 2;
  return {
    yao: [x - 3.4, z + hz + 2.6],
    bungalow: [x + hx + 3.7, z + hz + 1.8],
    'securite-0': [x - hx - 2.2, z + 1.5],
    'securite-1': [x + 2.5, z - hz - 1.2],
    'securite-2': [x + hx + 2.2, z - 2.5],
    livraison: [x + 4.2, z + hz + 2.6],
  };
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
export interface ChantierQuartier { avancement: number; journees: number; livraisons: number; repos: { heure: number; le: number } | null }
export const CHANTIER_QUARTIER_INITIAL: ChantierQuartier = { avancement: 24, journees: 0, livraisons: 0, repos: null };

/** Après une journée, on se repose jusqu'au lendemain : l'horloge a repassé minuit, ou une journée de jeu entière s'est écoulée. */
export function enRepos(c: ChantierQuartier, heure: number, maintenant: number) {
  if (!c.repos) return false;
  return !(heure < c.repos.heure || maintenant - c.repos.le > 30 * 60_000);
}

export function journeeDisponible(c: ChantierQuartier, heure: number, maintenant: number) {
  return chantierOuvert(heure) && !enRepos(c, heure, maintenant);
}

/** Applique une journée au chantier du quartier. Un ouvrage livré laisse place au suivant le lendemain. */
export function appliquerJournee(c: ChantierQuartier, avancementGagne: number, heureFin: number, maintenant: number): ChantierQuartier {
  const depart = c.avancement >= 100 ? 0 : c.avancement;
  const avancement = Math.min(100, depart + Math.max(0, avancementGagne));
  return { avancement, journees: c.journees + 1, livraisons: c.livraisons + (avancement >= 100 ? 1 : 0), repos: { heure: heureFin, le: maintenant } };
}

/** Lecture tolérante d'une sauvegarde locale (absente, ancienne ou abîmée). */
export function lireChantierQuartier(brut: unknown): ChantierQuartier {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Partial<ChantierQuartier>;
  const repos = c.repos && typeof c.repos === 'object' && Number.isFinite(c.repos.heure) && Number.isFinite(c.repos.le) ? { heure: c.repos.heure, le: c.repos.le } : null;
  return {
    avancement: borne(Number(c.avancement ?? CHANTIER_QUARTIER_INITIAL.avancement), 0, 100),
    journees: Math.max(0, Math.floor(Number(c.journees) || 0)),
    livraisons: Math.max(0, Math.floor(Number(c.livraisons) || 0)),
    repos,
  };
}
