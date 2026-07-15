// Catalogue du dressing/inventaire d'avatar. Chaque item modifie un seul « slot »
// de AvatarConfig (frontend/src/components/app/avatar-btp.tsx) — équiper un item
// fusionne son configPatch dans Avatar.config, le rendu SVG ne connaît pas les items.
// Toutes les valeurs de configPatch doivent exister dans OPTIONS_AVATAR côté frontend.

export type ItemAvatarSeed = {
  slug: string;
  nom: string;
  description?: string;
  categorie: 'CASQUE' | 'TENUE' | 'LUNETTES' | 'OUTIL' | 'ECUSSON' | 'CADRE';
  rarete: 'COMMUN' | 'PROFESSIONNEL' | 'RARE' | 'EXPERT' | 'LEGENDAIRE';
  metierRequis?: string;
  niveauRequis: number;
  configPatch: Record<string, string>;
  ordre?: number;
};

// Tenues de départ par métier (profils réels du jeu, voir profilsData dans seed.ts) :
// un item CASQUE + un item TENUE par profession, débloqués dès le niveau 1 si le
// joueur a choisi ce profil de départ.
const TENUES_METIER: Array<{ slug: string; metier: string; nom: string; casque: [string, string]; tenue: [string, string] }> = [
  { slug: 'etudiant', metier: 'etudiant-chantier', nom: 'Étudiant BTP', casque: ['aucun', '#F5F0E6'], tenue: ['chemise', '#2B2B2E'] },
  { slug: 'stagiaire', metier: 'stagiaire-chantier', nom: 'Stagiaire chantier', casque: ['standard', '#D9B382'], tenue: ['gilet', '#C1502E'] },
  { slug: 'chef-equipe', metier: 'chef-equipe', nom: "Chef d'équipe", casque: ['standard', '#6B7A3F'], tenue: ['gilet', '#6B7A3F'] },
  { slug: 'chef-chantier', metier: 'chef-chantier', nom: 'Chef de chantier', casque: ['standard', '#F5F0E6'], tenue: ['gilet', '#C1502E'] },
  { slug: 'conducteur-travaux', metier: 'conducteur-travaux', nom: 'Conducteur de travaux', casque: ['standard', '#F5F0E6'], tenue: ['chemise', '#2B2B2E'] },
  { slug: 'ouvrier', metier: 'ouvrier-qualifie', nom: 'Ouvrier qualifié', casque: ['standard', '#D9B382'], tenue: ['bleu', '#2B2B2E'] },
  { slug: 'projeteur', metier: 'projeteur', nom: 'Dessinateur-projeteur', casque: ['aucun', '#F5F0E6'], tenue: ['chemise', '#4A342A'] },
  { slug: 'bim-modeleur', metier: 'bim-modeleur', nom: 'BIM Modeleur', casque: ['aucun', '#F5F0E6'], tenue: ['chemise', '#2B2B2E'] },
  { slug: 'ingenieur-structure', metier: 'ingenieur-structure', nom: 'Ingénieur génie civil', casque: ['visiere', '#F5F0E6'], tenue: ['chemise', '#6B7A3F'] },
  { slug: 'topographe', metier: 'topographe-junior', nom: 'Topographe', casque: ['standard', '#D9B382'], tenue: ['bleu', '#4A342A'] },
  { slug: 'responsable-hse', metier: 'responsable-hse', nom: 'Responsable HSE', casque: ['visiere', '#6B7A3F'], tenue: ['gilet', '#B87333'] },
  { slug: 'entrepreneur', metier: 'entrepreneur-debutant', nom: 'Entrepreneur BTP', casque: ['aucun', '#F5F0E6'], tenue: ['chemise', '#2B2B2E'] },
];

const tenuesItems: ItemAvatarSeed[] = TENUES_METIER.flatMap((m, i): ItemAvatarSeed[] => [
  {
    slug: `casque-depart-${m.slug}`,
    nom: `Casque — ${m.nom}`,
    description: `Casque de départ du profil ${m.nom}.`,
    categorie: 'CASQUE',
    rarete: 'COMMUN',
    metierRequis: m.metier,
    niveauRequis: 1,
    configPatch: { casqueStyle: m.casque[0], casque: m.casque[1] },
    ordre: i * 2,
  },
  {
    slug: `tenue-depart-${m.slug}`,
    nom: `Tenue — ${m.nom}`,
    description: `Tenue de départ du profil ${m.nom}.`,
    categorie: 'TENUE',
    rarete: 'COMMUN',
    metierRequis: m.metier,
    niveauRequis: 1,
    configPatch: { typeTenue: m.tenue[0], couleurTenue: m.tenue[1] },
    ordre: i * 2 + 1,
  },
]);

// Lunettes — accessoires universels, débloqués à l'ancienneté.
const lunettesItems: ItemAvatarSeed[] = [
  { slug: 'lunettes-protection', nom: 'Lunettes de protection', description: 'Indispensables sur tout chantier actif.', categorie: 'LUNETTES', rarete: 'PROFESSIONNEL', niveauRequis: 3, configPatch: { lunettes: 'securite' } },
  { slug: 'lunettes-terrain', nom: 'Lunettes de terrain', description: 'Pour les longues journées en extérieur.', categorie: 'LUNETTES', rarete: 'RARE', niveauRequis: 8, configPatch: { lunettes: 'soleil' } },
];

// Outils — liés à un métier précis, débloqués en progressant dans ce profil.
const outilsItems: ItemAvatarSeed[] = [
  { slug: 'outil-marteau-ouvrier', nom: 'Marteau de chantier', description: "L'outil de base de l'ouvrier qualifié.", categorie: 'OUTIL', rarete: 'COMMUN', metierRequis: 'ouvrier-qualifie', niveauRequis: 2, configPatch: { outil: 'marteau' } },
  { slug: 'outil-cle-ouvrier', nom: 'Clé de serrage', description: 'Pour les ouvrages nécessitant précision et force.', categorie: 'OUTIL', rarete: 'PROFESSIONNEL', metierRequis: 'ouvrier-qualifie', niveauRequis: 4, configPatch: { outil: 'cle' } },
  { slug: 'outil-metre-topographe', nom: 'Mètre de topographe', description: 'Pour les relevés et implantations sur le terrain.', categorie: 'OUTIL', rarete: 'PROFESSIONNEL', metierRequis: 'topographe-junior', niveauRequis: 3, configPatch: { outil: 'metre' } },
  { slug: 'outil-plan-projeteur', nom: 'Rouleau de plans', description: "L'attribut du bureau d'études.", categorie: 'OUTIL', rarete: 'RARE', metierRequis: 'projeteur', niveauRequis: 5, configPatch: { outil: 'plan' } },
  { slug: 'outil-tablette-chantier', nom: 'Tablette de suivi chantier', description: 'Pour piloter avancement, stocks et personnel.', categorie: 'OUTIL', rarete: 'RARE', metierRequis: 'chef-chantier', niveauRequis: 6, configPatch: { outil: 'tablette' } },
  { slug: 'outil-tablette-bim', nom: 'Tablette maquette BIM', description: 'Consulte la maquette numérique directement sur site.', categorie: 'OUTIL', rarete: 'EXPERT', metierRequis: 'bim-modeleur', niveauRequis: 8, configPatch: { outil: 'tablette' } },
];

// Écussons — insignes de réussite, certains universels, certains liés à un métier.
const ecussonsItems: ItemAvatarSeed[] = [
  { slug: 'ecusson-truelle-metier', nom: 'Écusson Truelle', description: 'Le symbole du travail manuel bien fait.', categorie: 'ECUSSON', rarete: 'RARE', metierRequis: 'ouvrier-qualifie', niveauRequis: 6, configPatch: { ecusson: 'truelle' } },
  { slug: 'ecusson-etoile-excellence', nom: 'Écusson Excellence', description: 'Récompense une progression exemplaire.', categorie: 'ECUSSON', rarete: 'EXPERT', niveauRequis: 10, configPatch: { ecusson: 'etoile' } },
  { slug: 'ecusson-eclair-performance', nom: 'Écusson Performance', description: 'Pour les carrières qui avancent vite et bien.', categorie: 'ECUSSON', rarete: 'EXPERT', niveauRequis: 12, configPatch: { ecusson: 'eclair' } },
  { slug: 'ecusson-grue-direction', nom: 'Écusson Direction de chantier', description: "Réservé à ceux qui dirigent des chantiers entiers.", categorie: 'ECUSSON', rarete: 'LEGENDAIRE', metierRequis: 'chef-chantier', niveauRequis: 15, configPatch: { ecusson: 'grue' } },
];

// Cadres — prestige visuel pur, jalons de progression générale (niveaux 5/12/20).
const cadresItems: ItemAvatarSeed[] = [
  { slug: 'cadre-bronze', nom: 'Cadre Bronze', description: 'Premier jalon de carrière.', categorie: 'CADRE', rarete: 'PROFESSIONNEL', niveauRequis: 5, configPatch: { cadre: 'bronze' } },
  { slug: 'cadre-argent', nom: 'Cadre Argent', description: 'Une carrière confirmée.', categorie: 'CADRE', rarete: 'EXPERT', niveauRequis: 12, configPatch: { cadre: 'argent' } },
  { slug: 'cadre-or', nom: 'Cadre Or', description: 'Le prestige des figures reconnues de BTP Life.', categorie: 'CADRE', rarete: 'LEGENDAIRE', niveauRequis: 20, configPatch: { cadre: 'or' } },
];

export const avatarItemsData: ItemAvatarSeed[] = [
  ...tenuesItems,
  ...lunettesItems,
  ...outilsItems,
  ...ecussonsItems,
  ...cadresItems,
];
