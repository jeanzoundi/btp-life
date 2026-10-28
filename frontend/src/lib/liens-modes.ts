// Le monde vivant et le mode classique sont un seul jeu : chaque lieu du quartier a sa page classique, et la plupart
// des pages classiques ont leur lieu. La bascule entre les modes passe de l'un à l'autre au même endroit.

/** Les lieux du quartier : nom affiché et page du mode classique qui lui correspond. */
export const LIEUX_MONDE: Record<string, { nom: string; href: string }> = {
  universite: { nom: 'Université BTP', href: '/app/academie' },
  entreprise: { nom: 'Tour BTP Life', href: '/app/entreprise' },
  chantier: { nom: 'Grand chantier', href: '/app/chantiers' },
  residence: { nom: 'Résidence Lagune', href: '/app/lieu/residence' },
  maquis: { nom: 'Le Maquis', href: '/app/lieu/maquis' },
  cafe: { nom: 'Café des Bâtisseurs', href: '/app/lieu/cafe' },
  banque: { nom: 'Banque BTL', href: '/app/lieu/banque' },
  fournisseur: { nom: 'Dépôt matériaux', href: '/app/fournisseur' },
  mairie: { nom: 'Hôtel de ville', href: '/app/lieu/mairie' },
  laboratoire: { nom: 'Laboratoire des matériaux', href: '/app/lieu/laboratoire' },
  'bureau-etudes': { nom: 'Maison des ingénieurs', href: '/app/competences' },
  'jardins-residence': { nom: 'Résidences des Jardins', href: '/app/competences' },
  marche: { nom: 'Marché des Jardins', href: '/app/lieu/maquis' },
  atelier: { nom: 'Atelier de formation', href: '/app/logiciels' },
  logistique: { nom: 'Plateforme logistique', href: '/app/depot' },
  agence: { nom: 'Agence des talents', href: '/app/offres' },
  'construction-nord': { nom: 'Chantier du Plateau', href: '/app/chantiers' },
  'centre-azur': { nom: 'Centre commercial Azur', href: '/app/dressing' },
  'galerie-palmiers': { nom: 'Galerie des Palmiers', href: '/app/recompenses' },
  marina: { nom: 'Marina BTP Life', href: '/app/lieu/cafe' },
  sports: { nom: 'Complexe sportif', href: '/app/recompenses' },
};

/** Le lieu du quartier d'une page classique (le principal quand plusieurs lieux partagent une page). */
const LIEU_DES_PAGES: Record<string, string> = {
  '/app/academie': 'universite', '/app/entreprise': 'entreprise', '/app/chantiers': 'chantier', '/app/missions': 'chantier',
  '/app/lieu/residence': 'residence', '/app/lieu/maquis': 'maquis', '/app/lieu/cafe': 'cafe', '/app/lieu/banque': 'banque',
  '/app/fournisseur': 'fournisseur', '/app/lieu/mairie': 'mairie', '/app/lieu/laboratoire': 'laboratoire',
  '/app/competences': 'bureau-etudes', '/app/logiciels': 'atelier', '/app/depot': 'logistique', '/app/offres': 'agence',
  '/app/dressing': 'centre-azur', '/app/inventaire': 'centre-azur', '/app/recompenses': 'galerie-palmiers',
};

/** La page classique d'un lieu du quartier ; l'accueil classique s'il n'en a pas. */
export const pageClassique = (slug: string | null | undefined) => (slug && LIEUX_MONDE[slug]?.href) || '/app';

/** Le lieu du quartier d'une page classique (sous-pages comprises), ou null pour une page sans lieu. */
export function lieuDuMonde(chemin: string | null | undefined): string | null {
  if (!chemin) return null;
  const propre = chemin.split(/[?#]/)[0].replace(/\/+$/, '');
  const page = Object.keys(LIEU_DES_PAGES).filter(p => propre === p || propre.startsWith(`${p}/`)).sort((a, b) => b.length - a.length)[0];
  return page ? LIEU_DES_PAGES[page] : null;
}

/** L'adresse du monde vivant, ouvert directement dans un lieu quand on en donne un. */
export const adresseMonde = (slug?: string | null) => slug && LIEUX_MONDE[slug] ? `/app/monde?lieu=${encodeURIComponent(slug)}` : '/app/monde';
