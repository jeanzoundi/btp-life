// Le monde en ligne vu du jeu : les émotes, les voisins connectés et le chat du quartier. Le serveur
// (backend/src/monde/en-ligne.service.ts) garde la présence et les messages ; en démonstration, des voisins simulés se
// promènent sur la place et bavardent. Sans Three.js ni React.

export const EMOTES = [
  { id: 'salut', icone: '👋', texte: 'Salut !' },
  { id: 'rire', icone: '😂', texte: 'Ha ha !' },
  { id: 'bravo', icone: '👏', texte: 'Bravo !' },
  { id: 'danse', icone: '💃', texte: 'On danse !' },
  { id: 'pouce', icone: '👍', texte: 'Ça marche' },
  { id: 'reflexion', icone: '🤔', texte: 'Hmm…' },
] as const;
export type Emote = (typeof EMOTES)[number]['id'];
export const emoteParId = (id: string | null | undefined) => EMOTES.find(e => e.id === id) ?? null;

export interface VoisinEnLigne {
  userId: string; nom: string; avatarConfig: unknown; x: number; z: number; lieu: string | null; emote: Emote | null;
  /** Promeneur : un joueur passé récemment, montré sur la place quand presque personne n'est connecté (niveau affiché). */
  promeneur?: { niveau: number };
}
export interface MessageQuartier { id: string; userId: string; nom: string; texte: string; envoyeLe: string }

/** Pourquoi un message est signalé à la modération (les motifs du serveur, backend/src/monde/moderation.ts). */
export const MOTIFS_SIGNALEMENT = [
  { id: 'insulte', libelle: 'Insulte' }, { id: 'harcelement', libelle: 'Harcèlement' }, { id: 'spam', libelle: 'Spam' },
  { id: 'donnees-perso', libelle: 'Infos perso' }, { id: 'autre', libelle: 'Autre' },
] as const;
export type MotifSignalement = (typeof MOTIFS_SIGNALEMENT)[number]['id'];

/** Les joueurs dont on ne veut plus lire les messages : propre à cet appareil, réversible d'un clic. */
export interface JoueurMasque { userId: string; nom: string }
const CLE_MASQUES = 'btp-life:chat:masques';
export function lireJoueursMasques(): JoueurMasque[] {
  try {
    const lu: unknown = JSON.parse(localStorage.getItem(CLE_MASQUES) ?? '[]');
    return Array.isArray(lu) ? lu.filter((j): j is JoueurMasque => typeof j?.userId === 'string' && typeof j?.nom === 'string').slice(0, 200) : [];
  } catch { return []; }
}
export function ecrireJoueursMasques(liste: readonly JoueurMasque[]) {
  try { localStorage.setItem(CLE_MASQUES, JSON.stringify(liste)); } catch { /* Stockage facultatif : le masquage dure alors la session. */ }
}

/** Rythme des relevés : la position part toutes les dix secondes, le chat ouvert se relit toutes les cinq. */
export const PERIODE_PRESENCE_MS = 10_000;
export const PERIODE_CHAT_MS = 5_000;
/** Une émote reste au-dessus de la tête ce temps-là, comme au serveur. */
export const DUREE_EMOTE_MS = 8_000;
export const LONGUEUR_MESSAGE = 200;

type Point = [number, number];
/** Position sur une boucle parcourue à vitesse constante (m/s), à l'instant t (secondes). */
export function surBoucle(boucle: readonly Point[], vitesse: number, t: number): Point {
  const segments = boucle.map((a, i) => { const b = boucle[(i + 1) % boucle.length]; return { a, b, l: Math.hypot(b[0] - a[0], b[1] - a[1]) }; });
  const total = segments.reduce((s, g) => s + g.l, 0);
  let reste = ((vitesse * t) % total + total) % total;
  for (const g of segments) {
    if (reste <= g.l) { const k = g.l ? reste / g.l : 0; return [g.a[0] + (g.b[0] - g.a[0]) * k, g.a[1] + (g.b[1] - g.a[1]) * k]; }
    reste -= g.l;
  }
  return boucle[0];
}

// Les voisins de la démonstration, sur la place des Palmiers (le même tour que Fatou l'après-midi).
const VOISINS_DEMO: Array<{ userId: string; nom: string; personnage: string; boucle: Point[]; vitesse: number; emotes: Emote[] }> = [
  { userId: 'demo-aya', nom: 'Aya', personnage: 'tenue-ville', boucle: [[-20, 11], [-6, 11], [-6, -11], [20, -11], [20, 11]], vitesse: 1.3, emotes: ['salut', 'pouce'] },
  { userId: 'demo-kader', nom: 'Kader', personnage: 'bleu-travail', boucle: [[18, -12], [18.4, -12]], vitesse: .05, emotes: ['bravo', 'danse', 'rire'] },
  { userId: 'demo-ines', nom: 'Inès', personnage: 'tailleur', boucle: [[20, 9], [-4, 9], [-4, -9], [-20, -9], [-20, 9]], vitesse: 1.1, emotes: ['reflexion', 'salut'] },
];

/** Les voisins simulés à l'instant t (secondes) : chacun lance une émote toutes les vingt secondes environ. */
export function voisinsDemo(t: number): VoisinEnLigne[] {
  return VOISINS_DEMO.map((v, i) => {
    const [x, z] = surBoucle(v.boucle, v.vitesse, t + i * 17);
    const cycle = Math.floor((t + i * 7) / 20);
    const enEmote = (t + i * 7) % 20 < DUREE_EMOTE_MS / 1000;
    return { userId: v.userId, nom: v.nom, avatarConfig: { personnage: v.personnage }, x, z, lieu: null, emote: enEmote ? v.emotes[cycle % v.emotes.length] : null };
  });
}

/** Les messages de la démonstration, qui arrivent un à un au fil de la partie (t en secondes). */
const MESSAGES_DEMO: Array<[number, string, string]> = [
  [0, 'Aya', 'Bonjour le quartier ! Quelqu’un au dépôt ce matin ?'],
  [12, 'Kader', 'Oui, il reste du ciment CPJ 42,5. Venez tôt, ça part vite.'],
  [40, 'Inès', 'Qui a fini le chapitre du permis ? Je bloque sur les pièces du dossier.'],
  [75, 'Aya', 'Le plan de masse et la notice ! À l’hôtel de ville, ils sont stricts là-dessus.'],
  [120, 'Kader', 'On se retrouve au maquis ce soir ? 🍗'],
];
export function messagesDemo(t: number): MessageQuartier[] {
  const debut = Date.UTC(2026, 9, 26, 8);
  return MESSAGES_DEMO.filter(([apres]) => apres <= t).map(([apres, nom, texte], i) => ({
    id: `demo-${i}`, userId: VOISINS_DEMO.find(v => v.nom === nom)?.userId ?? 'demo', nom, texte, envoyeLe: new Date(debut + apres * 1000).toISOString(),
  }));
}

/** Le message prêt à partir : espaces resserrés, coupé à la longueur permise ; rien s'il est vide. */
export function messagePret(brut: string) {
  const texte = brut.replace(/\s+/g, ' ').trim().slice(0, LONGUEUR_MESSAGE);
  return texte || null;
}

// ─── Les équipes de quartier ───
// Des joueurs connectés s'invitent (quatre au plus) ; une séance faite pendant qu'un coéquipier est dans le même lieu
// rapporte 10 % d'XP de plus. Mêmes règles qu'au serveur (backend/src/monde/equipe.service.ts).

export const REGLES_EQUIPE = { membresMax: 4, bonusXp: .1 } as const;

export interface MembreEquipe { userId: string; nom: string; enLigne: boolean; lieu: string | null }
export interface EquipeQuartier { id: string; chefId: string; membres: MembreEquipe[] }
export interface InvitationEquipe { id: string; de: string }
export interface EtatEquipe { equipe: EquipeQuartier | null; invitations: InvitationEquipe[] }
export const ETAT_EQUIPE_VIDE: EtatEquipe = { equipe: null, invitations: [] };

export const estCoequipier = (equipe: EquipeQuartier | null, userId: string) => Boolean(equipe?.membres.some(m => m.userId === userId));
/** Les voisins à qui proposer l'équipe : ceux qui n'en font pas déjà partie, tant qu'il reste de la place. */
export function invitables(voisins: readonly VoisinEnLigne[], equipe: EquipeQuartier | null) {
  if ((equipe?.membres.length ?? 1) >= REGLES_EQUIPE.membresMax) return [];
  return voisins.filter(v => !estCoequipier(equipe, v.userId));
}

/** L'équipe de démonstration : le joueur la dirige, et un voisin simulé qu'il invite accepte. */
export function equipeAvec(equipe: EquipeQuartier | null, moi: { userId: string; nom: string }, voisin: Pick<VoisinEnLigne, 'userId' | 'nom'>): EquipeQuartier {
  const base = equipe ?? { id: 'equipe-demo', chefId: moi.userId, membres: [{ ...moi, enLigne: true, lieu: null }] };
  if (estCoequipier(base, voisin.userId) || base.membres.length >= REGLES_EQUIPE.membresMax) return base;
  return { ...base, membres: [...base.membres, { userId: voisin.userId, nom: voisin.nom, enLigne: true, lieu: null }] };
}

// ─── Les promeneurs ───
// Quand moins de deux autres joueurs sont connectés, la place reste vivante : quelques joueurs passés récemment s'y
// promènent avec leur personnage, présentés comme tels (leur niveau, jamais « en ligne »), et sans les inviter.

export const SEUIL_PROMENEURS = 2;
export const PROMENEURS_MAX = 3;
const BOUCLES_PLACE: Point[][] = [
  [[-20, 11], [-6, 11], [-6, -11], [20, -11], [20, 11]],
  [[20, 9], [-4, 9], [-4, -9], [-20, -9], [-20, 9]],
  [[-18, -12], [18, -12], [18, 12], [-18, 12]],
];
export interface JoueurRecent { userId: string; nom: string; avatarConfig: unknown; niveau: number }

/** Les promeneurs de la place à l'instant t (secondes) : aucun dès que deux autres joueurs sont connectés. */
export function promeneurs(recents: readonly JoueurRecent[], connectes: readonly Pick<VoisinEnLigne, 'userId'>[], t: number): VoisinEnLigne[] {
  if (connectes.length >= SEUIL_PROMENEURS) return [];
  const enLigne = new Set(connectes.map(v => v.userId));
  return recents.filter(j => !enLigne.has(j.userId)).slice(0, PROMENEURS_MAX).map((j, i) => {
    const [x, z] = surBoucle(BOUCLES_PLACE[i % BOUCLES_PLACE.length], 1 + i * .15, t + i * 23);
    return { userId: j.userId, nom: j.nom, avatarConfig: j.avatarConfig, x, z, lieu: null, emote: null, promeneur: { niveau: j.niveau } };
  });
}
