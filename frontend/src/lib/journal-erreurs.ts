// Journalisation minimale des erreurs de rendu en production.
//
// Pas de service tiers pour l'instant : on garde les dernières erreurs en local (consultables
// depuis Paramètres) afin de pouvoir diagnostiquer un plantage rapporté par un joueur, au lieu
// d'un écran blanc muet. Brancher Sentry ici plus tard ne changera que ce fichier.
const CLE = 'btp-life-erreurs';
const MAX = 10;

export interface ErreurJournalisee {
  message: string;
  pile?: string;
  chemin: string;
  horodatage: string;
}

export function journaliserErreur(erreur: Error & { digest?: string }) {
  try {
    if (typeof window === 'undefined') return;
    const entree: ErreurJournalisee = {
      message: erreur.message || 'Erreur inconnue',
      pile: erreur.digest ?? erreur.stack?.slice(0, 500),
      chemin: window.location.pathname,
      horodatage: new Date().toISOString(),
    };
    const precedentes = lireErreurs();
    localStorage.setItem(CLE, JSON.stringify([entree, ...precedentes].slice(0, MAX)));
    // Reste visible dans la console du navigateur pour un diagnostic en direct.
    console.error('[BTP Life]', entree.message, entree.chemin);
  } catch {
    /* le journal ne doit jamais faire planter davantage */
  }
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
