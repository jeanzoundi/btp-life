// Whitelist mapping "kebab-case URL resource" -> "PrismaClient delegate property name".
// Only models listed here are reachable through the generic catalog/admin-crud
// controllers. Anything sensitive (User, Abonnement, AuditLog, ...) is either
// excluded or exposed through a dedicated module with field-level control instead.

export interface ResourceConfig {
  model: string;
  /** Fields that can be used with a "contains" search via ?q= */
  searchFields?: string[];
  /** Default relations to include */
  include?: Record<string, boolean>;
  /** Default order */
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export const CATALOG_RESOURCES: Record<string, ResourceConfig> = {
  pays: { model: 'pays', searchFields: ['nom'], orderBy: { ordre: 'asc' } },
  profils: { model: 'profil', searchFields: ['nom'], orderBy: { ordre: 'asc' } },
  'metiers-cibles': { model: 'metierCible', searchFields: ['nom'] },
  competences: { model: 'competence', searchFields: ['nom', 'domaine'], include: { niveaux: true } },
  'modules-academie': {
    model: 'moduleAcademie',
    searchFields: ['titre'],
    orderBy: { ordre: 'asc' },
    include: { cours: true },
  },
  cours: { model: 'cours', searchFields: ['titre'] },
  logiciels: { model: 'logiciel', searchFields: ['nom'], include: { exercices: true } },
  'exercices-logiciels': { model: 'exerciceLogiciel', searchFields: ['titre'] },
  badges: { model: 'badge', searchFields: ['nom'] },
  certificats: { model: 'certificat', searchFields: ['nom'] },
  'offres-emploi': { model: 'offreEmploi', searchFields: ['titre'], orderBy: { publieeLe: 'desc' } },
  lieux: { model: 'lieu' },
  pnj: { model: 'pnj', searchFields: ['nom'] },
  chantiers: { model: 'chantier', searchFields: ['nom'] },
  medias: { model: 'media', searchFields: ['titre'] },
  'pages-cms': { model: 'pageCms', searchFields: ['titre'] },
  'referentiels-normes': { model: 'referentielNorme' },
  'bibliotheques-prix': { model: 'bibliothequePrix', searchFields: ['designation'] },
  'materiaux-pays': { model: 'materiauPays', searchFields: ['materiau'] },
};

// Admin has everything the catalog has, plus authoring/editorial resources.
export const ADMIN_RESOURCES: Record<string, ResourceConfig> = {
  ...CATALOG_RESOURCES,
  missions: { model: 'mission', searchFields: ['titre'], include: { contenus: true, variantesPays: true } },
  'mission-contenus': { model: 'missionContenu' },
  'mission-variantes-pays': { model: 'missionVariantePays' },
  'chantier-phases': { model: 'chantierPhase' },
  'chantier-ressources': { model: 'chantierRessource' },
  imprevus: { model: 'imprevu', searchFields: ['titre'] },
  'pnj-messages': { model: 'pnjMessage' },
  evenements: { model: 'evenement' },
  'regles-promotion': { model: 'reglePromotion' },
  'pays-config': { model: 'paysConfig' },
  'comptes-b2b': { model: 'compteB2b', searchFields: ['nom'] },
};
