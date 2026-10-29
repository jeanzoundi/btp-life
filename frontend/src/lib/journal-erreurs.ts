// Journalisation des erreurs vues par le joueur.
//
// Les dernières restent en local (consultables depuis Paramètres) pour diagnostiquer un plantage rapporté par un joueur,
// au lieu d'un écran blanc muet. En production, chacune est aussi remontée au serveur (POST /erreurs-client, relue dans
// l'administration) : sans service tiers, sans lien avec le compte, seulement le message, la pile et la page.
const CLE = 'btp-life-erreurs';
const MAX = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
/** Au plus quelques erreurs différentes remontées par page : un plantage en boucle ne noie pas le serveur. */
export const ENVOIS_PAR_PAGE = 5;
const envoyees = new Set<string>();

export interface ErreurJournalisee {
  message: string;
  pile?: string;
  chemin: string;
  horodatage: string;
}

/** Bruits sans rapport avec le jeu : scripts tiers sans détail, boucle de ResizeObserver, coupures réseau (rejouées au
 * retour de la connexion), extensions du navigateur. */
const MESSAGES_BRUIT = [/^Script error\.?$/i, /ResizeObserver loop/i, /^(TypeError: )?(Failed to fetch|Load failed|NetworkError)/i];
const PILE_EXTENSION = /(chrome|moz|safari(-web)?)-extension:\/\//i;
export const estUnBruit = (message: string, pile?: string) => MESSAGES_BRUIT.some((b) => b.test(message)) || PILE_EXTENSION.test(pile ?? '');

function remonter(message: string, pile: string | undefined, chemin: string) {
  if (process.env.NODE_ENV !== 'production') return;
  const cle = `${message}|${pile?.split('\n')[1] ?? ''}`;
  if (envoyees.has(cle) || envoyees.size >= ENVOIS_PAR_PAGE) return;
  envoyees.add(cle);
  // keepalive : l'envoi part même si la page se recharge juste après le plantage.
  fetch(`${API_URL}/erreurs-client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ message, pile, chemin, version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) }),
  }).catch(() => { /* la remontée ne doit jamais gêner le joueur */ });
}

export function journaliserErreur(erreur: Error & { digest?: string }) {
  try {
    if (typeof window === 'undefined') return;
    const message = erreur.message || 'Erreur inconnue';
    if (estUnBruit(message, erreur.stack)) return;
    const entree: ErreurJournalisee = {
      message,
      pile: erreur.digest ?? erreur.stack?.slice(0, 500),
      chemin: window.location.pathname,
      horodatage: new Date().toISOString(),
    };
    const precedentes = lireErreurs();
    localStorage.setItem(CLE, JSON.stringify([entree, ...precedentes].slice(0, MAX)));
    // Reste visible dans la console du navigateur pour un diagnostic en direct.
    console.error('[BTP Life]', entree.message, entree.chemin);
    // Le digest d'une erreur de rendu serveur retrouve sa trace dans les journaux Vercel.
    remonter(message, [erreur.digest && `digest ${erreur.digest}`, erreur.stack].filter(Boolean).join('\n').slice(0, 4000) || undefined, entree.chemin);
  } catch {
    /* le journal ne doit jamais faire planter davantage */
  }
}

/** Les erreurs qui échappent aux limites React : gestionnaires d'événements, promesses rejetées, boucle de rendu 3D.
 * Renvoie de quoi retirer les écouteurs. */
export function installerRemonteeErreurs() {
  if (typeof window === 'undefined') return () => {};
  const surErreur = (e: ErrorEvent) => journaliserErreur(e.error instanceof Error ? e.error : new Error(e.message || 'Erreur inconnue'));
  const surRejet = (e: PromiseRejectionEvent) => {
    const raison: unknown = e.reason;
    // Un refus de l'API (session expirée, règle du jeu) est déjà montré au joueur : ce n'est pas un plantage.
    if (raison && typeof raison === 'object' && typeof (raison as { status?: unknown }).status === 'number') return;
    journaliserErreur(raison instanceof Error ? raison : new Error(typeof raison === 'string' ? raison : 'Promesse rejetée sans motif'));
  };
  window.addEventListener('error', surErreur);
  window.addEventListener('unhandledrejection', surRejet);
  return () => {
    window.removeEventListener('error', surErreur);
    window.removeEventListener('unhandledrejection', surRejet);
  };
}

export function lireErreurs(): ErreurJournalisee[] {
  try {
    if (typeof window === 'undefined') return [];
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as ErreurJournalisee[]) : [];
  } catch {
    return [];
  }
}

export function viderErreurs() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* ignoré */
  }
}
