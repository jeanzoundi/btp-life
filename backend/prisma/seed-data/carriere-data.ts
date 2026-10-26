import type { ProfilFamille } from '@prisma/client';

// Contenu de carrière au-delà du niveau 9 : deux échelons de plus par filière, une trentaine d'offres d'emploi et les
// certificats délivrés à la fin des modules de l'académie et des parcours. seed.ts ne fait que les upserter.

export type ProfilSeed = { slug: string; nom: string; description: string; famille: ProfilFamille; niveauDepart: number; ordre: number };

/**
 * Les échelons experts, à la suite du sommet actuel de chaque filière (leur `ordre` continue celui de la famille). Leur
 * niveau de départ dépasse NIVEAU_DEPART_MAX (src/carriere/carriere.service.ts) : on ne peut pas les choisir à la création.
 */
export const PROFILS_EXPERTS: ProfilSeed[] = [
  { slug: 'directeur-travaux', nom: 'Directeur de travaux', description: 'Dirige les conducteurs de travaux d’une agence : marges, sécurité, clients et recrutements.', famille: 'CHANTIER', niveauDepart: 28, ordre: 6 },
  { slug: 'directeur-exploitation', nom: 'Directeur d’exploitation', description: 'Porte le carnet de commandes et les résultats de toute l’entreprise sur le terrain.', famille: 'CHANTIER', niveauDepart: 45, ordre: 7 },

  { slug: 'chef-projet-structure', nom: 'Chef de projet structure', description: 'Pilote les études d’un grand ouvrage, de l’avant-projet au visa du bureau de contrôle.', famille: 'BE', niveauDepart: 24, ordre: 5 },
  { slug: 'directeur-technique', nom: 'Directeur technique', description: 'Garant des choix techniques et des méthodes de tout le bureau d’études.', famille: 'BE', niveauDepart: 40, ordre: 6 },

  { slug: 'bim-manager', nom: 'BIM manager', description: 'Écrit la charte BIM du projet et fait travailler ensemble toutes les maquettes.', famille: 'BIM', niveauDepart: 24, ordre: 5 },
  { slug: 'directeur-numerique', nom: 'Directeur du numérique', description: 'Conduit la transformation numérique de l’entreprise : maquettes, données et outils de chantier.', famille: 'BIM', niveauDepart: 40, ordre: 6 },

  { slug: 'economiste-senior', nom: 'Économiste senior', description: 'Chiffre les appels d’offres importants et arbitre entre les variantes.', famille: 'METRE', niveauDepart: 24, ordre: 5 },
  { slug: 'directeur-etudes-prix', nom: 'Directeur des études de prix', description: 'Décide des prix remis par l’entreprise et de sa stratégie de marchés.', famille: 'METRE', niveauDepart: 40, ordre: 6 },

  { slug: 'auditeur-qse', nom: 'Auditeur QSE', description: 'Audite les chantiers et prépare les certifications qualité, sécurité et environnement.', famille: 'QUALITE', niveauDepart: 24, ordre: 5 },
  { slug: 'directeur-qse', nom: 'Directeur QSE', description: 'Fixe la politique qualité, sécurité et environnement de toute l’entreprise.', famille: 'QUALITE', niveauDepart: 40, ordre: 6 },

  { slug: 'geometre-expert', nom: 'Géomètre-expert', description: 'Fixe les limites des propriétés et signe les plans de bornage et de division.', famille: 'TOPO', niveauDepart: 22, ordre: 4 },
  { slug: 'directeur-cabinet-topographie', nom: 'Directeur de cabinet de topographie', description: 'Dirige un cabinet : grands levés, drones, foncier et équipes de terrain.', famille: 'TOPO', niveauDepart: 38, ordre: 5 },

  { slug: 'expert-geotechnicien', nom: 'Expert géotechnicien', description: 'Tranche les cas difficiles : sols compressibles, glissements, fondations profondes.', famille: 'GEOTECH', niveauDepart: 22, ordre: 4 },
  { slug: 'directeur-laboratoire', nom: 'Directeur de laboratoire', description: 'Dirige un laboratoire d’essais : agréments, matériel et rapports qui engagent.', famille: 'GEOTECH', niveauDepart: 38, ordre: 5 },

  { slug: 'dirigeant-entreprise-generale', nom: 'Dirigeant d’entreprise générale', description: 'Prend des marchés tous corps d’état et coordonne une dizaine de sous-traitants.', famille: 'ENTREPRENEUR', niveauDepart: 28, ordre: 4 },
  { slug: 'promoteur-immobilier', nom: 'Promoteur immobilier', description: 'Achète le terrain, monte le financement et vend les logements qu’il fait construire.', famille: 'ENTREPRENEUR', niveauDepart: 45, ordre: 5 },
];

type Exigence = { slug: string; niveau: number };
export type RegleSeed = {
  source: string;
  cible: string;
  conditions: { niveauMin: number; reputationMin: number; chantiersReussis?: number; competences: Exigence[] };
  /** Mission d'examen (slug), jouable avant le niveau demandé. */
  examen?: string;
};

/** Les promotions vers les échelons experts : niveau 22 à 50, réputation 600 à 800 sur 1000, compétences au niveau 4 ou 5. */
export const REGLES_EXPERTS: RegleSeed[] = [
  { source: 'conducteur-travaux', cible: 'directeur-travaux', conditions: { niveauMin: 30, reputationMin: 700, chantiersReussis: 4, competences: [{ slug: 'decision-chantier', niveau: 4 }, { slug: 'gestion-humaine', niveau: 3 }] }, examen: 'sous-traitant-retard-chaine' },
  { source: 'directeur-travaux', cible: 'directeur-exploitation', conditions: { niveauMin: 48, reputationMin: 800, chantiersReussis: 6, competences: [{ slug: 'decision-chantier', niveau: 5 }, { slug: 'gestion-humaine', niveau: 4 }] }, examen: 'recrutement-conducteur-travaux' },

  { source: 'ingenieur-structure', cible: 'chef-projet-structure', conditions: { niveauMin: 26, reputationMin: 650, competences: [{ slug: 'beton-ferraillage', niveau: 4 }, { slug: 'lecture-plans', niveau: 4 }] }, examen: 'note-calcul-marge-faible' },
  { source: 'chef-projet-structure', cible: 'directeur-technique', conditions: { niveauMin: 50, reputationMin: 800, competences: [{ slug: 'beton-ferraillage', niveau: 5 }, { slug: 'decision-chantier', niveau: 4 }] }, examen: 'controle-technique-refus-permis' },

  { source: 'bim-coordinateur', cible: 'bim-manager', conditions: { niveauMin: 26, reputationMin: 650, competences: [{ slug: 'revit-bim', niveau: 4 }, { slug: 'lecture-plans', niveau: 3 }] }, examen: 'clash-bim-ignore' },
  { source: 'bim-manager', cible: 'directeur-numerique', conditions: { niveauMin: 45, reputationMin: 780, chantiersReussis: 2, competences: [{ slug: 'revit-bim', niveau: 5 }, { slug: 'decision-chantier', niveau: 3 }] } },

  { source: 'economiste', cible: 'economiste-senior', conditions: { niveauMin: 26, reputationMin: 650, competences: [{ slug: 'metre-devis', niveau: 4 }, { slug: 'excel-btp', niveau: 3 }] }, examen: 'devis-poste-oublie' },
  { source: 'economiste-senior', cible: 'directeur-etudes-prix', conditions: { niveauMin: 45, reputationMin: 780, competences: [{ slug: 'metre-devis', niveau: 5 }, { slug: 'decision-chantier', niveau: 3 }] }, examen: 'appel-offres-variante-technique' },

  { source: 'responsable-hse', cible: 'auditeur-qse', conditions: { niveauMin: 28, reputationMin: 650, competences: [{ slug: 'controle-qualite', niveau: 4 }, { slug: 'securite-n1', niveau: 3 }] }, examen: 'audit-hse-non-conformites' },
  { source: 'auditeur-qse', cible: 'directeur-qse', conditions: { niveauMin: 45, reputationMin: 780, competences: [{ slug: 'controle-qualite', niveau: 5 }, { slug: 'reception-travaux', niveau: 4 }] }, examen: 'litige-malfacon-carrelage' },

  { source: 'topographe-confirme', cible: 'geometre-expert', conditions: { niveauMin: 24, reputationMin: 600, competences: [{ slug: 'topographie', niveau: 4 }, { slug: 'lecture-plans', niveau: 3 }] } },
  { source: 'geometre-expert', cible: 'directeur-cabinet-topographie', conditions: { niveauMin: 40, reputationMin: 750, competences: [{ slug: 'topographie', niveau: 5 }, { slug: 'gestion-humaine', niveau: 3 }] } },

  { source: 'ingenieur-geotechnique', cible: 'expert-geotechnicien', conditions: { niveauMin: 24, reputationMin: 600, competences: [{ slug: 'geotechnique', niveau: 4 }, { slug: 'reception-travaux', niveau: 2 }] } },
  { source: 'expert-geotechnicien', cible: 'directeur-laboratoire', conditions: { niveauMin: 40, reputationMin: 750, competences: [{ slug: 'geotechnique', niveau: 5 }, { slug: 'controle-qualite', niveau: 3 }] } },

  { source: 'gerant', cible: 'dirigeant-entreprise-generale', conditions: { niveauMin: 32, reputationMin: 720, chantiersReussis: 4, competences: [{ slug: 'decision-chantier', niveau: 4 }, { slug: 'metre-devis', niveau: 3 }] }, examen: 'lancement-devis-serre' },
  { source: 'dirigeant-entreprise-generale', cible: 'promoteur-immobilier', conditions: { niveauMin: 50, reputationMin: 820, chantiersReussis: 6, competences: [{ slug: 'decision-chantier', niveau: 5 }, { slug: 'metre-devis', niveau: 4 }] }, examen: 'tresorerie-tendue-paie' },
];

export type OffreSeed = {
  titre: string;
  profil: string;
  niveauMin: number;
  reputationMin: number;
  /** Mission à réussir avant d'être retenu (slug). */
  test: string;
  entreprise: string;
  description: string;
  competences?: Exigence[];
  chantiers?: number;
};

/**
 * Les offres d'emploi ajoutées aux cinq premières : de l'entrée dans chaque filière jusqu'aux échelons experts. Comme
 * pour les cinq premières, niveau et réputation reprennent les seuils de la promotion vers le même poste, et les
 * compétences demandées sont celles de cette promotion : une embauche directe ne court-circuite pas la carrière.
 */
export const OFFRES_EMPLOI: OffreSeed[] = [
  // Entrées de filière.
  { titre: 'Stage bureau d’études — Cocody', profil: 'dessinateur-junior', niveauMin: 2, reputationMin: 0, test: 'quiz-autocad', entreprise: 'Akwaba Ingénierie', description: 'Six mois au bureau d’études : relevés, mises au net et premiers plans de coffrage sous la houlette d’un projeteur.', competences: [{ slug: 'autocad-lecture', niveau: 1 }] },
  { titre: 'Stage BIM — maquette d’un collège', profil: 'dessinateur-bim', niveauMin: 3, reputationMin: 0, test: 'quiz-bim', entreprise: 'Studio BIM Lagune', description: 'Modéliser les murs, dalles et menuiseries d’un collège de 12 classes, puis sortir les plans de la maquette.', competences: [{ slug: 'revit-bim', niveau: 1 }] },
  { titre: 'Stage HSE — chantier de logements', profil: 'assistant-hse', niveauMin: 2, reputationMin: 0, test: 'dangers-sur-photo', entreprise: 'Abobo Habitat', description: 'Accueil sécurité des nouveaux, visites de chantier quotidiennes et suivi des EPI sur 40 logements.', competences: [{ slug: 'securite-n1', niveau: 1 }] },
  { titre: 'Topographe junior — lotissement de Bingerville', profil: 'topographe-junior', niveauMin: 4, reputationMin: 200, test: 'implantation-topo', entreprise: 'Ébrié Topo Services', description: 'Lever le terrain naturel et implanter les voiries et les 120 lots d’un lotissement.', competences: [{ slug: 'topographie', niveau: 1 }, { slug: 'lecture-plans', niveau: 1 }] },
  { titre: 'Technicien de laboratoire — essais de sol', profil: 'technicien-labo-sol', niveauMin: 4, reputationMin: 200, test: 'types-de-sols', entreprise: 'Labo Sols Lagune', description: 'Granulométries, limites d’Atterberg et essais Proctor pour les chantiers de la lagune.', competences: [{ slug: 'geotechnique', niveau: 1 }] },
  { titre: 'Maçon qualifié — chantier de Yopougon', profil: 'ouvrier-qualifie', niveauMin: 2, reputationMin: 100, test: 'quiz-materiaux', entreprise: 'Yopougon Bâtir', description: 'Élévation d’agglos, chaînages et enduits sur un immeuble R+2 : le métier s’apprend au geste.', competences: [{ slug: 'maconnerie', niveau: 1 }] },

  // Postes confirmés.
  { titre: 'Dessinateur-projeteur béton armé', profil: 'projeteur', niveauMin: 7, reputationMin: 400, test: 'lecture-plan-poteau', entreprise: 'Cocody Études & Structures', description: 'Plans de coffrage et de ferraillage d’immeubles R+4 à R+8, en lien direct avec l’ingénieur.', competences: [{ slug: 'autocad-lecture', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] },
  { titre: 'BIM modeleur — tour de bureaux au Plateau', profil: 'bim-modeleur', niveauMin: 7, reputationMin: 400, test: 'quiz-bim', entreprise: 'Studio BIM Lagune', description: 'Construire la maquette structure et architecture d’une tour de 18 étages.', competences: [{ slug: 'revit-bim', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] },
  { titre: 'Métreur — rénovation d’écoles', profil: 'metreur-junior', niveauMin: 7, reputationMin: 400, test: 'devis-chambre-simple', entreprise: 'Koumassi Métré Conseil', description: 'Métrés et bordereaux de prix pour la réhabilitation de quinze écoles primaires.', competences: [{ slug: 'metre-devis', niveau: 2 }, { slug: 'excel-btp', niveau: 2 }] },
  { titre: 'Chef de chantier — immeuble R+4 à Cocody', profil: 'chef-chantier', niveauMin: 13, reputationMin: 500, test: 'plancher-fissure-suspecte', entreprise: 'Lagune Bâtiment', description: 'Tenir le planning, les équipes et la qualité d’un immeuble de logements, des fondations au clos-couvert.', competences: [{ slug: 'beton-ferraillage', niveau: 2 }, { slug: 'decision-chantier', niveau: 1 }], chantiers: 1 },
  { titre: 'Topographe confirmé — échangeur autoroutier', profil: 'topographe-confirme', niveauMin: 12, reputationMin: 500, test: 'implantation-topo', entreprise: 'Ébrié Topo Services', description: 'Implanter les appuis et suivre les déformations d’un échangeur en construction.', competences: [{ slug: 'topographie', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] },
  { titre: 'Ingénieur géotechnicien — fondations d’un pont', profil: 'ingenieur-geotechnique', niveauMin: 12, reputationMin: 500, test: 'quiz-geotechnique', entreprise: 'Labo Sols Lagune', description: 'Programmer les sondages, interpréter les essais et dimensionner les pieux d’un pont sur la lagune.', competences: [{ slug: 'geotechnique', niveau: 2 }, { slug: 'reception-travaux', niveau: 1 }] },
  { titre: 'Entrepreneur — petits travaux de rénovation', profil: 'entrepreneur-debutant', niveauMin: 6, reputationMin: 450, test: 'devis-chambre-simple', entreprise: 'Coopérative des artisans de Treichville', description: 'Reprendre les chantiers de rénovation de la coopérative : devis, achats et une petite équipe.', competences: [{ slug: 'maconnerie', niveau: 2 }, { slug: 'gestion-humaine', niveau: 1 }], chantiers: 1 },

  // Métiers visés des parcours.
  { titre: 'Conducteur de travaux — logements sociaux', profil: 'conducteur-travaux', niveauMin: 18, reputationMin: 600, test: 'examen-conducteur-travaux', entreprise: 'Lagune Bâtiment', description: 'Piloter trois chantiers de logements sociaux : budget, planning, sous-traitants et réunions de chantier.', competences: [{ slug: 'decision-chantier', niveau: 3 }], chantiers: 2 },
  { titre: 'Ingénieur structure — hôpital régional', profil: 'ingenieur-structure', niveauMin: 14, reputationMin: 550, test: 'plancher-fissure-suspecte', entreprise: 'Cocody Études & Structures', description: 'Notes de calcul, descentes de charges et visas des plans d’un hôpital de 200 lits.', competences: [{ slug: 'beton-ferraillage', niveau: 3 }, { slug: 'lecture-plans', niveau: 3 }] },
  { titre: 'BIM coordinateur — campus universitaire', profil: 'bim-coordinateur', niveauMin: 14, reputationMin: 550, test: 'clash-bim-ignore', entreprise: 'Studio BIM Lagune', description: 'Réunir les maquettes structure, fluides et architecture d’un campus et lever les conflits chaque semaine.', competences: [{ slug: 'revit-bim', niveau: 3 }, { slug: 'decision-chantier', niveau: 2 }] },
  { titre: 'Économiste de la construction — marchés publics', profil: 'economiste', niveauMin: 14, reputationMin: 550, test: 'devis-poste-oublie', entreprise: 'Koumassi Métré Conseil', description: 'Estimer les projets, rédiger les bordereaux et analyser les offres des marchés publics.', competences: [{ slug: 'metre-devis', niveau: 3 }, { slug: 'excel-btp', niveau: 3 }] },
  { titre: 'Responsable HSE — grands travaux routiers', profil: 'responsable-hse', niveauMin: 14, reputationMin: 550, test: 'reception-ferraillage', entreprise: 'Bassam Travaux Publics', description: 'Plan de prévention, analyses d’accidents et audits sur 80 km de route en travaux.', competences: [{ slug: 'controle-qualite', niveau: 3 }, { slug: 'reception-travaux', niveau: 2 }] },
  { titre: 'Gérant associé — entreprise de second œuvre', profil: 'gerant', niveauMin: 15, reputationMin: 650, test: 'devis-poste-oublie', entreprise: 'Riviera Finitions', description: 'Reprendre la moitié des parts d’une entreprise de carrelage et de peinture, et la faire grandir.', competences: [{ slug: 'decision-chantier', niveau: 2 }, { slug: 'metre-devis', niveau: 2 }], chantiers: 2 },

  // Échelons experts.
  { titre: 'Directeur de travaux — agence d’Abidjan', profil: 'directeur-travaux', niveauMin: 30, reputationMin: 700, test: 'sous-traitant-retard-chaine', entreprise: 'Lagune Bâtiment', description: 'Diriger six conducteurs de travaux et répondre des marges et de la sécurité de l’agence.', competences: [{ slug: 'decision-chantier', niveau: 4 }, { slug: 'gestion-humaine', niveau: 3 }], chantiers: 4 },
  { titre: 'Chef de projet structure — ouvrage d’art', profil: 'chef-projet-structure', niveauMin: 26, reputationMin: 650, test: 'note-calcul-marge-faible', entreprise: 'Akwaba Ingénierie', description: 'Conduire les études d’un viaduc, de l’avant-projet au visa du bureau de contrôle.', competences: [{ slug: 'beton-ferraillage', niveau: 4 }, { slug: 'lecture-plans', niveau: 4 }] },
  { titre: 'BIM manager — programme de 500 logements', profil: 'bim-manager', niveauMin: 26, reputationMin: 650, test: 'clash-bim-ignore', entreprise: 'Abobo Habitat', description: 'Écrire la charte BIM, former les équipes et tenir la maquette de référence d’un grand programme.', competences: [{ slug: 'revit-bim', niveau: 4 }, { slug: 'lecture-plans', niveau: 3 }] },
  { titre: 'Économiste senior — bâtiments publics', profil: 'economiste-senior', niveauMin: 26, reputationMin: 650, test: 'devis-poste-oublie', entreprise: 'Yamoussoukro Génie Civil', description: 'Chiffrer les grands appels d’offres et défendre les variantes devant la direction.', competences: [{ slug: 'metre-devis', niveau: 4 }, { slug: 'excel-btp', niveau: 3 }] },
  { titre: 'Auditeur QSE — groupe de construction', profil: 'auditeur-qse', niveauMin: 28, reputationMin: 650, test: 'audit-hse-non-conformites', entreprise: 'Bassam Travaux Publics', description: 'Auditer vingt chantiers par an et préparer le groupe à ses certifications.', competences: [{ slug: 'controle-qualite', niveau: 4 }, { slug: 'securite-n1', niveau: 3 }] },
  { titre: 'Géomètre-expert — cabinet foncier', profil: 'geometre-expert', niveauMin: 24, reputationMin: 600, test: 'implantation-topo', entreprise: 'Cabinet foncier du Plateau', description: 'Bornages, divisions parcellaires et plans signés pour les notaires et les promoteurs.', competences: [{ slug: 'topographie', niveau: 4 }, { slug: 'lecture-plans', niveau: 3 }] },
  { titre: 'Expert géotechnicien — sols de la lagune', profil: 'expert-geotechnicien', niveauMin: 24, reputationMin: 600, test: 'types-de-sols', entreprise: 'Labo Sols Lagune', description: 'Expertiser les sols compressibles des bords de lagune et les sinistres de fondations.', competences: [{ slug: 'geotechnique', niveau: 4 }, { slug: 'reception-travaux', niveau: 2 }] },
  { titre: 'Directeur technique — bureau d’études', profil: 'directeur-technique', niveauMin: 50, reputationMin: 800, test: 'controle-technique-refus-permis', entreprise: 'Akwaba Ingénierie', description: 'Fixer les méthodes de calcul, valider les choix techniques et signer les études qui engagent le bureau.', competences: [{ slug: 'beton-ferraillage', niveau: 5 }, { slug: 'decision-chantier', niveau: 4 }] },
  { titre: 'Directeur d’exploitation — entreprise générale', profil: 'directeur-exploitation', niveauMin: 48, reputationMin: 800, test: 'recrutement-conducteur-travaux', entreprise: 'Lagune Bâtiment', description: 'Répondre du carnet de commandes, des résultats et de la sécurité de tous les chantiers de l’entreprise.', competences: [{ slug: 'decision-chantier', niveau: 5 }, { slug: 'gestion-humaine', niveau: 4 }], chantiers: 6 },
];

export type CertificatSeed = { slug: string; nom: string; conditions: { type: 'module'; module: string } | { type: 'metier'; profil: string } };

/**
 * Les certificats du jeu : une attestation par module de l'académie (tous ses cours lus), un certificat de fin de
 * parcours par métier visé et un certificat de maîtrise par échelon expert (le poste atteint, par promotion ou embauche).
 */
export function certificatsDuJeu(
  modules: ReadonlyArray<{ slug: string; titre: string }>,
  metiers: ReadonlyArray<{ slug: string; nom: string }>,
  experts: ReadonlyArray<{ slug: string; nom: string }> = PROFILS_EXPERTS,
): CertificatSeed[] {
  return [
    ...modules.map(m => ({ slug: `attestation-${m.slug}`, nom: `Attestation de formation — ${m.titre}`, conditions: { type: 'module' as const, module: m.slug } })),
    ...metiers.map(m => ({ slug: `parcours-${m.slug}`, nom: `Certificat de fin de parcours — ${m.nom}`, conditions: { type: 'metier' as const, profil: m.slug } })),
    ...experts.map(p => ({ slug: `maitrise-${p.slug}`, nom: `Certificat de maîtrise — ${p.nom}`, conditions: { type: 'metier' as const, profil: p.slug } })),
  ];
}
