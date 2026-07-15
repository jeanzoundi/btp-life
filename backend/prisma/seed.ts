/* Seed de contenu BTP Life — données pilotes Côte d'Ivoire + France.
 * Tout le contenu est data-driven (voir CONCEPTION.md) : ce script est
 * le "back-office initial" avant que l'admin web ne prenne le relais.
 */
import { PrismaClient, ProfilFamille, QuestionType, Rarete } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { missionsData, questionsSupplementaires, questionsVague2 } from './seed-data/missions-data';
import { modulesAcademie, coursSupplementaires, enrichissementCours } from './seed-data/academie-data';
import { MATERIAUX, chantiersGestion } from './seed-data/chantiers-data';
import { modulesGrandeEcole, missionsGrandeEcole } from './seed-data/grande-ecole-batiment-data';
import { avatarItemsData } from './seed-data/avatar-items-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed — pays...');
  const civ = await prisma.pays.upsert({
    where: { codeIso: 'CIV' },
    create: {
      codeIso: 'CIV',
      nom: "Côte d'Ivoire",
      langue: 'fr',
      monnaie: 'Franc CFA (BCEAO)',
      symboleMonnaie: 'FCFA',
      systemeUnites: 'metrique',
      ordre: 1,
    },
    update: {},
  });
  const fra = await prisma.pays.upsert({
    where: { codeIso: 'FRA' },
    create: {
      codeIso: 'FRA',
      nom: 'France',
      langue: 'fr',
      monnaie: 'Euro',
      symboleMonnaie: '€',
      systemeUnites: 'metrique',
      ordre: 2,
    },
    update: {},
  });

  await prisma.referentielNorme.deleteMany({ where: { paysId: civ.id } });
  await prisma.referentielNorme.createMany({
    data: [
      {
        paysId: civ.id,
        categorie: 'BETON',
        nomNorme: 'Dosage béton courant',
        resumePedagogique: 'Dosage usuel 350 kg/m³ de ciment pour un béton de structure courant en zone tropicale.',
      },
      {
        paysId: civ.id,
        categorie: 'HSE',
        nomNorme: 'Port des EPI obligatoire',
        resumePedagogique: 'Casque, chaussures de sécurité et gilet haute visibilité obligatoires sur tout chantier.',
      },
      {
        paysId: civ.id,
        categorie: 'RECEPTION',
        nomNorme: 'Procédure de réception des travaux',
        resumePedagogique: "PV de réception signé par le maître d'ouvrage, réserves levées sous 30 jours.",
      },
    ],
  });

  await prisma.bibliothequePrix.deleteMany({ where: { paysId: civ.id } });
  await prisma.bibliothequePrix.createMany({
    data: [
      // Terrassement
      { paysId: civ.id, categorie: 'terrassement', designation: 'Terrassement pleine masse', unite: 'm³', prixIndicatif: 3500, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'terrassement', designation: 'Fouille en tranchée', unite: 'm³', prixIndicatif: 4200, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'terrassement', designation: 'Remblai compacté', unite: 'm³', prixIndicatif: 2800, devise: 'FCFA' },
      // Béton
      { paysId: civ.id, categorie: 'beton', designation: 'Béton dosé 350kg/m³', unite: 'm³', prixIndicatif: 85000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'beton', designation: 'Béton de propreté 150kg/m³', unite: 'm³', prixIndicatif: 52000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'beton', designation: 'Ciment CPJ 42,5 (sac 50kg)', unite: 'sac', prixIndicatif: 5200, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'beton', designation: 'Sable de rivière', unite: 'm³', prixIndicatif: 12000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'beton', designation: 'Gravier concassé 5/15', unite: 'm³', prixIndicatif: 15000, devise: 'FCFA' },
      // Maçonnerie
      { paysId: civ.id, categorie: 'maconnerie', designation: 'Agglos 15x20x40', unite: 'unité', prixIndicatif: 350, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'maconnerie', designation: 'Agglos 20x20x40', unite: 'unité', prixIndicatif: 420, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'maconnerie', designation: 'Brique de terre cuite', unite: 'unité', prixIndicatif: 180, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'maconnerie', designation: 'Mortier de pose', unite: 'm³', prixIndicatif: 38000, devise: 'FCFA' },
      // Acier
      { paysId: civ.id, categorie: 'acier', designation: 'Fer à béton HA8', unite: 'kg', prixIndicatif: 720, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'acier', designation: 'Fer à béton HA10', unite: 'kg', prixIndicatif: 750, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'acier', designation: 'Fer à béton HA12', unite: 'kg', prixIndicatif: 745, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'acier', designation: 'Treillis soudé ST25', unite: 'm²', prixIndicatif: 2900, devise: 'FCFA' },
      // Coffrage
      { paysId: civ.id, categorie: 'coffrage', designation: 'Contreplaqué coffrage 18mm', unite: 'm²', prixIndicatif: 8500, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'coffrage', designation: 'Étai métallique', unite: 'jour/u', prixIndicatif: 500, devise: 'FCFA' },
      // Couverture
      { paysId: civ.id, categorie: 'couverture', designation: 'Tôle bac alu 8/10', unite: 'm²', prixIndicatif: 6800, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'couverture', designation: 'Charpente bois traité', unite: 'm²', prixIndicatif: 9500, devise: 'FCFA' },
      // Plomberie
      { paysId: civ.id, categorie: 'plomberie', designation: 'Tube PVC évacuation Ø100', unite: 'ml', prixIndicatif: 2200, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'plomberie', designation: 'Robinetterie standard', unite: 'unité', prixIndicatif: 15000, devise: 'FCFA' },
      // Électricité
      { paysId: civ.id, categorie: 'electricite', designation: 'Câble électrique 2,5mm²', unite: 'ml', prixIndicatif: 650, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'electricite', designation: 'Tableau électrique 12 modules', unite: 'unité', prixIndicatif: 45000, devise: 'FCFA' },
      // Peinture
      { paysId: civ.id, categorie: 'peinture', designation: 'Peinture vinylique (pot 20L)', unite: 'pot', prixIndicatif: 28000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'peinture', designation: "Enduit de lissage", unite: 'sac 25kg', prixIndicatif: 6500, devise: 'FCFA' },
      // VRD
      { paysId: civ.id, categorie: 'vrd', designation: 'Buse béton Ø400', unite: 'ml', prixIndicatif: 18000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'vrd', designation: 'Pavé autobloquant', unite: 'm²', prixIndicatif: 9800, devise: 'FCFA' },
      // Main d'œuvre
      { paysId: civ.id, categorie: 'main-oeuvre', designation: 'Journée manœuvre', unite: 'jour', prixIndicatif: 8000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'main-oeuvre', designation: 'Journée maçon qualifié', unite: 'jour', prixIndicatif: 15000, devise: 'FCFA' },
      { paysId: civ.id, categorie: 'main-oeuvre', designation: "Journée chef d'équipe", unite: 'jour', prixIndicatif: 28000, devise: 'FCFA' },
    ],
  });

  await prisma.materiauPays.deleteMany({ where: { paysId: civ.id } });
  await prisma.materiauPays.createMany({
    data: [
      { paysId: civ.id, materiau: 'Ciment CPJ 42,5', disponibilite: 'Abondant', prixIndicatif: 5200, notes: 'Cimenterie locale — livraison sous 48h partout à Abidjan.' },
      { paysId: civ.id, materiau: 'Sable de rivière', disponibilite: 'Abondant', prixIndicatif: 12000, notes: 'Extraction lagunaire — vérifier la salinité avant usage en béton armé.' },
      { paysId: civ.id, materiau: 'Gravier concassé', disponibilite: 'Bon', prixIndicatif: 15000, notes: "Carrières de l'intérieur du pays, délai de 2-3 jours hors Abidjan." },
      { paysId: civ.id, materiau: 'Fer à béton HA', disponibilite: 'Bon', prixIndicatif: 745, notes: 'Prix indexé sur le cours mondial de l\'acier — variations fréquentes.' },
      { paysId: civ.id, materiau: 'Agglos béton', disponibilite: 'Abondant', prixIndicatif: 350, notes: 'Nombreux fabricants locaux, qualité variable — vérifier le dosage.' },
      { paysId: civ.id, materiau: 'Bois de coffrage', disponibilite: 'Bon', prixIndicatif: 8500, notes: 'Essences locales (fromager, samba) traitées anti-termites recommandées.' },
      { paysId: civ.id, materiau: 'Tôle bac alu', disponibilite: 'Bon', prixIndicatif: 6800, notes: 'Résistante à la corrosion — adaptée au climat humide ivoirien.' },
      { paysId: civ.id, materiau: 'Peinture vinylique', disponibilite: 'Abondant', prixIndicatif: 28000, notes: 'Plusieurs marques locales et importées disponibles.' },
      { paysId: civ.id, materiau: 'Carrelage grès cérame', disponibilite: 'Bon', prixIndicatif: 7500, notes: 'Import majoritaire — délai variable selon disponibilité douanière.' },
      { paysId: civ.id, materiau: 'Bitume routier', disponibilite: 'Limité', prixIndicatif: 320000, notes: 'Réservé aux gros chantiers VRD — commande groupée recommandée.' },
    ],
  });

  console.log('Seed — profils...');
  const profilsData: Array<{
    slug: string;
    nom: string;
    description: string;
    famille: ProfilFamille;
    niveauDepart: number;
    ordre: number;
  }> = [
    { slug: 'etudiant-chantier', nom: 'Étudiant BTP', description: 'Élève en filière BTP, découvre le métier.', famille: 'CHANTIER', niveauDepart: 1, ordre: 1 },
    { slug: 'stagiaire-chantier', nom: 'Stagiaire chantier', description: 'Premier stage sur un chantier réel.', famille: 'CHANTIER', niveauDepart: 2, ordre: 2 },
    { slug: 'chef-equipe', nom: "Chef d'équipe", description: 'Encadre 3 à 8 ouvriers.', famille: 'CHANTIER', niveauDepart: 4, ordre: 3 },
    { slug: 'chef-chantier', nom: 'Chef chantier', description: 'Responsable complet d’un chantier.', famille: 'CHANTIER', niveauDepart: 6, ordre: 4 },
    { slug: 'conducteur-travaux', nom: 'Conducteur de travaux', description: 'Pilote plusieurs chantiers, budget et planning.', famille: 'CHANTIER', niveauDepart: 9, ordre: 5 },

    { slug: 'etudiant-be', nom: "Étudiant Bureau d'études", description: 'Se forme à la conception technique.', famille: 'BE', niveauDepart: 1, ordre: 1 },
    { slug: 'dessinateur-junior', nom: 'Dessinateur junior', description: 'Produit des plans sous supervision.', famille: 'BE', niveauDepart: 2, ordre: 2 },
    { slug: 'projeteur', nom: 'Projeteur', description: 'Conçoit des ouvrages détaillés.', famille: 'BE', niveauDepart: 4, ordre: 3 },
    { slug: 'ingenieur-structure', nom: 'Ingénieur structure', description: 'Valide les notes de calcul.', famille: 'BE', niveauDepart: 7, ordre: 4 },

    { slug: 'etudiant-bim', nom: 'Étudiant BIM', description: 'Découvre la maquette numérique.', famille: 'BIM', niveauDepart: 1, ordre: 1 },
    { slug: 'dessinateur-bim', nom: 'Dessinateur BIM', description: 'Modélise des éléments simples.', famille: 'BIM', niveauDepart: 2, ordre: 2 },
    { slug: 'bim-modeleur', nom: 'BIM modeleur', description: 'Construit la maquette complète.', famille: 'BIM', niveauDepart: 4, ordre: 3 },
    { slug: 'bim-coordinateur', nom: 'BIM coordinateur', description: 'Coordonne les maquettes multi-métiers.', famille: 'BIM', niveauDepart: 7, ordre: 4 },

    { slug: 'etudiant-metre', nom: 'Étudiant métré', description: 'Apprend à quantifier les ouvrages.', famille: 'METRE', niveauDepart: 1, ordre: 1 },
    { slug: 'aide-metreur', nom: 'Aide métreur', description: 'Assiste aux métrés de chantier.', famille: 'METRE', niveauDepart: 2, ordre: 2 },
    { slug: 'metreur-junior', nom: 'Métreur junior', description: 'Réalise des métrés autonomes.', famille: 'METRE', niveauDepart: 4, ordre: 3 },
    { slug: 'economiste', nom: 'Économiste de la construction', description: 'Chiffre des projets complets.', famille: 'METRE', niveauDepart: 7, ordre: 4 },

    { slug: 'etudiant-qualite', nom: 'Étudiant Qualité/HSE', description: 'Se forme à la sécurité chantier.', famille: 'QUALITE', niveauDepart: 1, ordre: 1 },
    { slug: 'assistant-hse', nom: 'Assistant HSE', description: 'Applique les procédures de sécurité.', famille: 'QUALITE', niveauDepart: 2, ordre: 2 },
    { slug: 'controleur-qualite', nom: 'Contrôleur qualité', description: 'Contrôle la conformité des ouvrages.', famille: 'QUALITE', niveauDepart: 4, ordre: 3 },
    { slug: 'responsable-hse', nom: 'Responsable Qualité/HSE', description: 'Pilote la politique HSE.', famille: 'QUALITE', niveauDepart: 7, ordre: 4 },

    { slug: 'aide-topographe', nom: 'Aide topographe', description: 'Porte la mire, prend des notes.', famille: 'TOPO', niveauDepart: 1, ordre: 1 },
    { slug: 'topographe-junior', nom: 'Topographe junior', description: 'Réalise des levés simples.', famille: 'TOPO', niveauDepart: 3, ordre: 2 },
    { slug: 'topographe-confirme', nom: 'Topographe confirmé', description: 'Responsable des implantations.', famille: 'TOPO', niveauDepart: 6, ordre: 3 },

    { slug: 'stagiaire-geotech', nom: 'Stagiaire géotechnique', description: 'Découvre les essais de sol.', famille: 'GEOTECH', niveauDepart: 1, ordre: 1 },
    { slug: 'technicien-labo-sol', nom: 'Technicien labo sol', description: 'Réalise des essais en laboratoire.', famille: 'GEOTECH', niveauDepart: 3, ordre: 2 },
    { slug: 'ingenieur-geotechnique', nom: 'Ingénieur géotechnique', description: 'Rédige les rapports géotechniques.', famille: 'GEOTECH', niveauDepart: 6, ordre: 3 },

    { slug: 'ouvrier-qualifie', nom: 'Ouvrier qualifié', description: "Exécute les tâches d'un métier du bâtiment.", famille: 'ENTREPRENEUR', niveauDepart: 2, ordre: 1 },
    { slug: 'entrepreneur-debutant', nom: 'Entrepreneur débutant', description: 'Lance sa première activité.', famille: 'ENTREPRENEUR', niveauDepart: 5, ordre: 2 },
    { slug: 'gerant', nom: 'Gérant multi-chantiers', description: 'Dirige une entreprise en croissance.', famille: 'ENTREPRENEUR', niveauDepart: 8, ordre: 3 },
  ];

  const profils: Record<string, { id: string }> = {};
  for (const p of profilsData) {
    profils[p.slug] = await prisma.profil.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }

  console.log('Seed — métiers cibles...');
  const metiersData: Array<{ slug: string; nom: string; description: string; famille: ProfilFamille }> = [
    { slug: 'conducteur-travaux', nom: 'Conducteur de travaux', description: 'Piloter plusieurs chantiers.', famille: 'CHANTIER' },
    { slug: 'ingenieur-structure', nom: 'Ingénieur structure', description: 'Concevoir des ouvrages sûrs.', famille: 'BE' },
    { slug: 'bim-coordinateur', nom: 'BIM coordinateur', description: 'Coordonner la maquette numérique.', famille: 'BIM' },
    { slug: 'economiste', nom: 'Économiste de la construction', description: 'Chiffrer des projets.', famille: 'METRE' },
    { slug: 'responsable-hse', nom: 'Responsable Qualité/HSE', description: 'Garantir la sécurité chantier.', famille: 'QUALITE' },
    { slug: 'gerant', nom: 'Entrepreneur', description: "Diriger sa propre entreprise.", famille: 'ENTREPRENEUR' },
    { slug: 'topographe-confirme', nom: 'Topographe', description: 'Maîtriser les implantations.', famille: 'TOPO' },
    { slug: 'ingenieur-geotechnique', nom: 'Ingénieur géotechnique', description: 'Étudier les sols.', famille: 'GEOTECH' },
  ];
  const metiers: Record<string, { id: string }> = {};
  for (const m of metiersData) {
    metiers[m.slug] = await prisma.metierCible.upsert({ where: { slug: m.slug }, create: m, update: m });
  }

  console.log('Seed — compétences...');
  const competencesData = [
    { slug: 'bases-btp', nom: 'Bases du BTP', domaine: 'general' },
    { slug: 'securite-n1', nom: 'Sécurité chantier', domaine: 'hse' },
    { slug: 'lecture-plans', nom: 'Lecture de plans', domaine: 'technique' },
    { slug: 'beton-ferraillage', nom: 'Béton et ferraillage', domaine: 'technique' },
    { slug: 'maconnerie', nom: 'Maçonnerie et fondations', domaine: 'technique' },
    { slug: 'metre-devis', nom: 'Métré et devis', domaine: 'gestion' },
    { slug: 'word-rapport', nom: 'Word — rapports', domaine: 'logiciel' },
    { slug: 'excel-btp', nom: 'Excel BTP', domaine: 'logiciel' },
    { slug: 'autocad-lecture', nom: 'AutoCAD (lecture)', domaine: 'logiciel' },
    { slug: 'revit-bim', nom: 'Revit / BIM', domaine: 'logiciel' },
    { slug: 'gestion-humaine', nom: 'Gestion humaine', domaine: 'management' },
    { slug: 'decision-chantier', nom: 'Décision chantier', domaine: 'management' },
    { slug: 'geotechnique', nom: 'Géotechnique', domaine: 'technique' },
    { slug: 'technologie-batiment', nom: 'Technologie du bâtiment', domaine: 'technique' },
    { slug: 'topographie', nom: 'Topographie', domaine: 'technique' },
    { slug: 'controle-qualite', nom: 'Contrôle qualité', domaine: 'hse' },
    { slug: 'reception-travaux', nom: 'Réception des travaux', domaine: 'gestion' },
  ];
  const competences: Record<string, { id: string }> = {};
  for (const c of competencesData) {
    const competence = await prisma.competence.upsert({ where: { slug: c.slug }, create: c, update: c });
    competences[c.slug] = competence;
    await prisma.competenceNiveau.deleteMany({ where: { competenceId: competence.id } });
    await prisma.competenceNiveau.createMany({
      data: [1, 2, 3, 4, 5].map((niveau) => ({
        competenceId: competence.id,
        niveau,
        xpRequis: niveau * 150,
        criteres: `Niveau ${niveau} validé par mission(s) ou examen.`,
      })),
    });
  }

  // L'académie (16 modules + cours riches) est seedée plus bas, après les missions,
  // pour pouvoir lier chaque cours à sa mission pratique.

  console.log('Seed — logiciels...');
  const logicielsData = [
    { slug: 'word', nom: 'Word', categorie: 'bureautique' },
    { slug: 'excel', nom: 'Excel', categorie: 'bureautique' },
    { slug: 'pdf', nom: 'Lecteur PDF', categorie: 'bureautique' },
    { slug: 'autocad', nom: 'AutoCAD', categorie: 'cao' },
    { slug: 'revit', nom: 'Revit', categorie: 'bim' },
    { slug: 'msproject', nom: 'MS Project', categorie: 'planning' },
    { slug: 'archicad', nom: 'ArchiCAD', categorie: 'bim' },
    { slug: 'robot', nom: 'Robot Structural Analysis', categorie: 'calcul' },
    { slug: 'covadis', nom: 'Covadis', categorie: 'vrd-topo' },
    { slug: 'sketchup', nom: 'SketchUp', categorie: 'cao' },
    { slug: 'qgis', nom: 'QGIS', categorie: 'vrd-topo' },
    { slug: 'primavera', nom: 'Primavera P6', categorie: 'planning' },
  ];
  const logiciels: Record<string, { id: string }> = {};
  for (const l of logicielsData) {
    logiciels[l.slug] = await prisma.logiciel.upsert({ where: { slug: l.slug }, create: l, update: l });
  }

  // Exercices simulés par logiciel (affichés dans l'Académie Logiciels).
  const exercicesData: Array<{ logiciel: string; titre: string; typeSimulation: string; niveau: number; competence?: string }> = [
    { logiciel: 'word', titre: 'Rédiger un rapport journalier de chantier', typeSimulation: 'document', niveau: 1, competence: 'word-rapport' },
    { logiciel: 'word', titre: 'Mettre en forme un PV de réunion de chantier', typeSimulation: 'document', niveau: 2, competence: 'word-rapport' },
    { logiciel: 'excel', titre: 'Calculer des volumes de béton', typeSimulation: 'tableur', niveau: 1, competence: 'excel-btp' },
    { logiciel: 'excel', titre: 'Monter un devis quantitatif estimatif (DQE)', typeSimulation: 'tableur', niveau: 2, competence: 'excel-btp' },
    { logiciel: 'excel', titre: 'Suivre un budget de chantier (dépenses vs prévu)', typeSimulation: 'tableur', niveau: 3, competence: 'excel-btp' },
    { logiciel: 'pdf', titre: 'Naviguer dans un dossier de plans PDF', typeSimulation: 'lecture-plan', niveau: 1, competence: 'lecture-plans' },
    { logiciel: 'pdf', titre: 'Annoter un plan pour remontée d\'erreur', typeSimulation: 'lecture-plan', niveau: 2, competence: 'lecture-plans' },
    { logiciel: 'autocad', titre: 'Lire un plan de coffrage et repérer les cotes', typeSimulation: 'lecture-plan', niveau: 1, competence: 'autocad-lecture' },
    { logiciel: 'autocad', titre: 'Repérer une erreur entre plan archi et plan béton', typeSimulation: 'lecture-plan', niveau: 3, competence: 'autocad-lecture' },
    { logiciel: 'revit', titre: 'Explorer une maquette BIM de villa R+1', typeSimulation: 'modelisation', niveau: 1, competence: 'revit-bim' },
    { logiciel: 'revit', titre: 'Extraire des quantités depuis la maquette', typeSimulation: 'modelisation', niveau: 3, competence: 'revit-bim' },
    { logiciel: 'msproject', titre: 'Lire un planning Gantt de gros œuvre', typeSimulation: 'planning', niveau: 1, competence: 'decision-chantier' },
    { logiciel: 'msproject', titre: 'Identifier le chemin critique d\'un projet', typeSimulation: 'planning', niveau: 2, competence: 'decision-chantier' },
    { logiciel: 'archicad', titre: 'Parcourir un modèle architectural', typeSimulation: 'modelisation', niveau: 1, competence: 'revit-bim' },
    { logiciel: 'robot', titre: 'Lire une note de calcul de poutre', typeSimulation: 'calcul', niveau: 3, competence: 'beton-ferraillage' },
    { logiciel: 'covadis', titre: 'Lire un profil en long de voirie', typeSimulation: 'vrd', niveau: 2, competence: 'topographie' },
    { logiciel: 'sketchup', titre: 'Modéliser un muret 3D simple', typeSimulation: 'modelisation', niveau: 1, competence: 'lecture-plans' },
    { logiciel: 'qgis', titre: 'Localiser une parcelle sur fond cadastral', typeSimulation: 'sig', niveau: 2, competence: 'topographie' },
    { logiciel: 'primavera', titre: 'Comprendre un planning multi-lots', typeSimulation: 'planning', niveau: 3, competence: 'decision-chantier' },
  ];
  // Leçons pas-à-pas de chaque exercice logiciel (affichées en diapositives).
  const leconsLogiciels: Record<string, Array<{ type: string; valeur: string }>> = {
    'Rédiger un rapport journalier de chantier': [
      { type: 'objectifs', valeur: 'Créer un document Word structuré\nUtiliser les styles de titres\nProduire un rapport réutilisable chaque jour' },
      { type: 'logiciel', valeur: 'word' },
      { type: 'texte', valeur: "Ouvre un nouveau document et pose la structure avec les styles : Titre 1 pour « Rapport journalier », Titre 2 pour chaque rubrique (Identification, Effectifs, Travaux réalisés, Matériaux reçus, Incidents, Météo). Les styles garantissent une mise en forme homogène et permettent le sommaire automatique." },
      { type: 'texte', valeur: "Remplis chaque rubrique avec des faits : « 6 maçons, 2 manœuvres » ; « coulage dalle haute, axe A-B, 14 m³, fini à 16h30 ». Insère un tableau 2 colonnes pour les effectifs (Insertion > Tableau) — plus lisible qu'une liste." },
      { type: 'astuce', valeur: "Enregistre ton rapport comme modèle (.dotx) : chaque matin, tu ouvres le modèle, tu remplis, tu enregistres sous « RJ_2026-07-04 ». 5 minutes par jour au lieu de 20." },
      { type: 'retenir', valeur: 'Styles de titres = structure + sommaire automatique\nDes faits datés et chiffrés, jamais d\'opinions\nUn modèle réutilisable fait gagner 15 min par jour' },
    ],
    'Mettre en forme un PV de réunion de chantier': [
      { type: 'objectifs', valeur: 'Structurer un PV professionnel\nGérer une liste d\'actions avec responsables\nDiffuser un document propre' },
      { type: 'logiciel', valeur: 'word' },
      { type: 'texte', valeur: "Le PV suit un plan fixe : participants (tableau présents/absents/excusés), points abordés, décisions prises, et surtout le tableau d'actions : Quoi | Qui | Pour quand. Ce tableau est la vraie valeur du PV — sans responsable ni échéance, une action n'existe pas." },
      { type: 'texte', valeur: "Mise en forme : en-tête avec références du chantier, numérotation des PV (PV n°12 du 04/07), pagination automatique. Les décisions se mettent en gras — celui qui relit en 30 secondes doit tout voir." },
      { type: 'attention', valeur: "Le PV fait foi contractuellement : toute réserve d'une entreprise sur une décision doit y figurer mot pour mot. Diffusion sous 48 h, corrections à la réunion suivante." },
      { type: 'retenir', valeur: 'Tableau d\'actions : Quoi | Qui | Quand — sinon rien ne bouge\nPV numérotés et diffusés sous 48 h\nDécisions en gras, réserves mot pour mot' },
    ],
    'Calculer des volumes de béton': [
      { type: 'objectifs', valeur: 'Construire un tableau de calcul propre\nÉcrire des formules de volume\nTotaliser avec SOMME' },
      { type: 'logiciel', valeur: 'excel' },
      { type: 'texte', valeur: "Structure ton tableau : Désignation | Unité | Longueur | Largeur | Épaisseur | Quantité. Une ligne par ouvrage : dalle, semelle S1, poteaux… La colonne Quantité contient la formule =C2*D2*E2 — jamais un résultat tapé à la main." },
      { type: 'texte', valeur: "Pour 4 poteaux identiques, ajoute une colonne Nombre : =C2*D2*E2*F2. Termine par =SOMME(G2:G12) pour le total, puis une ligne marge : =G13*1,05. Affiche 2 décimales." },
      { type: 'exemple', valeur: "Dalle 5×4×0,15 = 3,00 m³ · 4 poteaux de 0,25×0,25×3 = 0,75 m³ · Total 3,75 m³ · Avec 5 % de marge : 3,94 → tu commandes 4 m³." },
      { type: 'retenir', valeur: 'Une formule par cellule calculée, zéro résultat manuel\nColonnes avec unités affichées\nToujours finir par le total + 5 % de marge' },
    ],
    'Monter un devis quantitatif estimatif (DQE)': [
      { type: 'objectifs', valeur: 'Relier quantités et prix par RECHERCHEV\nOrganiser un DQE par lots\nCalculer sous-totaux et TVA' },
      { type: 'logiciel', valeur: 'excel' },
      { type: 'texte', valeur: "Deux feuilles : « Prix » (Désignation | Unité | PU) et « DQE » (N° | Désignation | U | Quantité | PU | Montant). Dans DQE, le PU vient de la bibliothèque : =RECHERCHEV(B2;Prix!A:C;3;FAUX), le Montant : =D2*E2. Modifier un prix met à jour tout le devis." },
      { type: 'texte', valeur: "Structure par lots avec sous-totaux : 100-Terrassement, 200-Fondations, 300-Élévation… SOMME.SI totalise par lot. En pied : Total HT, TVA 18 %, Total TTC." },
      { type: 'attention', valeur: "RECHERCHEV avec VRAI au lieu de FAUX renvoie un prix approximatif sans erreur visible — le bug classique qui fausse un devis de plusieurs millions. Toujours FAUX." },
      { type: 'retenir', valeur: 'PU par RECHERCHEV(…;FAUX), jamais recopié à la main\nDQE par lots numérotés avec sous-totaux\nHT → TVA 18 % → TTC en pied de devis' },
    ],
    'Suivre un budget de chantier (dépenses vs prévu)': [
      { type: 'objectifs', valeur: 'Comparer budget prévu et dépenses réelles\nCalculer écarts et % de consommation\nAlerter visuellement sur les dépassements' },
      { type: 'logiciel', valeur: 'excel' },
      { type: 'texte', valeur: "Colonnes : Poste | Budget prévu | Dépensé | Écart (=B2-C2) | % consommé (=C2/B2 en format pourcentage). Chaque facture s'ajoute au poste concerné. Écart négatif = dépassement." },
      { type: 'texte', valeur: "Mise en forme conditionnelle sur le % : vert < 80 %, orange 80-100 %, rouge > 100 %. Le tableau devient un tableau de bord — les rouges sautent aux yeux en réunion de chantier." },
      { type: 'astuce', valeur: "Compare le % financier au % d'avancement physique : un poste consommé à 90 % pour un travail avancé à 50 % va exploser. C'est cet écart qui prédit les dérives." },
      { type: 'retenir', valeur: 'Écart = prévu − dépensé, poste par poste\nMise en forme conditionnelle = alertes automatiques\n% financier vs % physique : le vrai détecteur de dérive' },
    ],
    'Naviguer dans un dossier de plans PDF': [
      { type: 'objectifs', valeur: 'Se repérer dans un dossier de plans numérique\nMesurer sur un plan PDF calibré\nRetrouver une information vite' },
      { type: 'logiciel', valeur: 'pdf' },
      { type: 'texte', valeur: "Un dossier PDF s'organise comme le papier : situation, masse, niveaux, coupes, détails. Les signets (panneau latéral) sautent au bon plan ; Ctrl+F cherche un texte — « P3 » retrouve toutes les mentions du poteau P3." },
      { type: 'texte', valeur: "L'outil Mesure se calibre sur l'échelle : mesure d'abord une cote CONNUE pour vérifier le calibrage, puis mesure le reste. Sans calibrage vérifié, la mesure PDF ment." },
      { type: 'astuce', valeur: "Vérifie l'indice de révision au cartouche : travailler sur l'indice B quand le C existe, c'est construire faux. Supprime les périmés de ta tablette." },
      { type: 'retenir', valeur: 'Signets pour naviguer, Ctrl+F pour chercher\nCalibrer la mesure sur une cote connue\nToujours vérifier l\'indice de révision' },
    ],
    "Annoter un plan pour remontée d'erreur": [
      { type: 'objectifs', valeur: 'Annoter proprement un PDF\nDocumenter une anomalie de plan\nOrganiser la remontée au bureau d\'études' },
      { type: 'logiciel', valeur: 'pdf' },
      { type: 'texte', valeur: "Outils : nuage (entourer la zone — convention du BTP), flèche + texte (décrire), surligneur (cotes concernées). Chaque annotation porte : le constat, la valeur attendue vs trouvée, ta question précise et l'urgence." },
      { type: 'exemple', valeur: "Nuage rouge autour du poteau P3 : « Coffrage 25×25, cadres ferraillage 22×22 incompatibles. Quelle section retenir ? Coulage jeudi. » Ce niveau de précision obtient une réponse en 2 heures." },
      { type: 'attention', valeur: "On n'annote JAMAIS l'original : « Enregistrer sous » avec suffixe _annotations. L'original reste la référence contractuelle intacte." },
      { type: 'retenir', valeur: 'Nuage = convention BTP pour signaler une zone\nAnnotation = constat + valeurs + question + urgence\nToujours annoter une COPIE' },
    ],
    'Lire un plan de coffrage et repérer les cotes': [
      { type: 'objectifs', valeur: 'Naviguer dans un DWG de coffrage\nIsoler l\'information avec les calques\nMesurer avec les accrochages objet' },
      { type: 'logiciel', valeur: 'autocad' },
      { type: 'texte', valeur: "ZOOM puis E (étendu) pour tout voir. Le plan de coffrage montre la structure vue de dessus : poteaux, poutres en traits doubles, voiles, réservations. Gèle les calques inutiles (commande CALQUE) pour ne garder que la structure." },
      { type: 'texte', valeur: "Entraxe entre deux poteaux : commande DIST, accrochage Centre activé, clic sur chaque poteau — la distance exacte s'affiche. PROPRIETES (Ctrl+1) sur un objet donne toutes ses dimensions." },
      { type: 'astuce', valeur: "F8 (ortho) contraint les mesures à l'horizontale/verticale — parfait pour vérifier des alignements. F3 bascule les accrochages objet." },
      { type: 'retenir', valeur: 'ZOOM E pour tout voir, calques pour isoler\nDIST + accrochages = mesures exactes\nPROPRIETES (Ctrl+1) révèle tout d\'un objet' },
    ],
    'Repérer une erreur entre plan archi et plan béton': [
      { type: 'objectifs', valeur: 'Superposer deux plans dans AutoCAD\nDétecter les incohérences archi/structure\nDocumenter l\'écart pour le BE' },
      { type: 'logiciel', valeur: 'autocad' },
      { type: 'texte', valeur: "Technique : XREF (référence externe) attache le plan archi sous le plan béton, en grisé. Les décalages sautent aux yeux : voile non aligné avec le mur archi, réservation absente, trémie déplacée." },
      { type: 'exemple', valeur: "Cas réel : l'archi décale une baie de 30 cm à l'indice C, le plan béton reste à l'indice B avec le linteau à l'ancienne position. Sans superposition, l'erreur se découvre au chantier — démolition." },
      { type: 'retenir', valeur: 'XREF pour superposer archi et structure\nComparer les indices de révision AVANT tout\nToute incohérence remonte au BE par écrit avec captures' },
    ],
    'Explorer une maquette BIM de villa R+1': [
      { type: 'objectifs', valeur: 'Naviguer dans une maquette Revit\nInterroger les propriétés des objets\nUtiliser vues 3D, plans et coupes' },
      { type: 'logiciel', valeur: 'revit' },
      { type: 'texte', valeur: "L'arborescence du projet liste les vues : plans d'étage, coupes, 3D. La 3D s'orbite (Maj+molette). Clique un mur : la palette Propriétés affiche type, épaisseur, matériau, niveau de base et hauteur." },
      { type: 'texte', valeur: "La zone de coupe (propriétés de la vue 3D) tranche la maquette en direct : tu vois l'intérieur de la villa, les réseaux dans les gaines, l'épaisseur des planchers — une coupe que TU choisis." },
      { type: 'astuce', valeur: "Clique une pièce : sa surface calculée s'affiche automatiquement — entraîne-toi à la vérifier contre le plan, c'est le réflexe du métreur." },
      { type: 'retenir', valeur: 'Tout objet Revit porte ses propriétés\nLa zone de coupe 3D tranche où tu veux\nLes surfaces se calculent seules — mais se vérifient' },
    ],
    'Extraire des quantités depuis la maquette': [
      { type: 'objectifs', valeur: 'Créer une nomenclature Revit\nChoisir champs et regroupements\nExporter vers Excel pour le devis' },
      { type: 'logiciel', valeur: 'revit' },
      { type: 'texte', valeur: "Vue > Nomenclatures : choisis la catégorie (Murs), les champs (Type, Niveau, Volume), le tri par niveau. Revit compte tout : 47,2 m³ de voiles au RDC, actualisé à chaque modification de la maquette." },
      { type: 'texte', valeur: "La nomenclature s'exporte en .txt délimité → Excel → ta feuille Métré du DQE. Le flux complet : maquette → nomenclature → Excel → devis. Zéro double saisie." },
      { type: 'attention', valeur: "Une quantité extraite vaut ce que vaut la maquette : un mur au mauvais type fausse le total. Le métreur BIM vérifie toujours un échantillon à la main." },
      { type: 'retenir', valeur: 'Nomenclature = métré automatique toujours à jour\nExport .txt → Excel → DQE sans ressaisie\nVérifier un échantillon : confiance ≠ crédulité' },
    ],
    'Lire un planning Gantt de gros œuvre': [
      { type: 'objectifs', valeur: 'Décoder barres, liens et jalons\nSituer la date du jour et l\'avancement\nRepérer le chemin critique' },
      { type: 'logiciel', valeur: 'msproject' },
      { type: 'texte', valeur: "Chaque ligne = une tâche, chaque barre = sa durée dans le temps. Flèches = dépendances. Losanges = jalons. Ligne verticale = aujourd'hui. Barres rouges = chemin critique." },
      { type: 'texte', valeur: "L'avancement se lit à la barre noire intérieure : remplie à moitié = 50 %. Si la barre d'avancement s'arrête avant la ligne du jour, la tâche est en retard — c'est visuel et immédiat." },
      { type: 'retenir', valeur: 'Barre = tâche · flèche = dépendance · losange = jalon\nRouge = critique : chaque retard décale la fin\nAvancement avant la ligne du jour = retard' },
    ],
    "Identifier le chemin critique d'un projet": [
      { type: 'objectifs', valeur: 'Afficher et interpréter le chemin critique\nLire les marges totales\nPrioriser les bonnes tâches' },
      { type: 'logiciel', valeur: 'msproject' },
      { type: 'texte', valeur: "Format > Tâches critiques colore en rouge les tâches à marge nulle. La colonne « Marge totale » indique de combien chaque tâche peut glisser sans décaler la fin. Le chef concentre son énergie sur les rouges." },
      { type: 'exemple', valeur: "Fondations (marge 0) et peinture de clôture (marge 12 j) prennent chacune 2 jours de retard : les fondations décalent la livraison, la clôture ne décale rien. Même retard, conséquences opposées." },
      { type: 'retenir', valeur: 'Chemin critique = tâches à marge nulle\nColonne Marge totale = marge de manœuvre\nRenforcer une tâche NON critique ne sert à rien' },
    ],
    'Parcourir un modèle architectural': [
      { type: 'objectifs', valeur: 'Naviguer dans ArchiCAD\nComprendre étages et calques\nLire la composition d\'un élément' },
      { type: 'logiciel', valeur: 'archicad' },
      { type: 'texte', valeur: "ArchiCAD organise le projet par étages : RDC, R+1, toiture. La 3D s'ouvre en fenêtre séparée (F3). Chaque élément cliqué affiche ses réglages : composition multicouche du mur, matériaux, cotes." },
      { type: 'astuce', valeur: "ArchiCAD et Revit partagent les concepts BIM (objets intelligents, étages, nomenclatures) : en maîtriser un, c'est comprendre l'autre à 70 %." },
      { type: 'retenir', valeur: 'Navigation par étages + 3D en parallèle\nUn clic = toute la composition de l\'élément\nMêmes concepts BIM d\'un logiciel à l\'autre' },
    ],
    'Lire une note de calcul de poutre': [
      { type: 'objectifs', valeur: 'Comprendre la structure d\'une note de calcul\nRelier hypothèses, efforts et ferraillage\nVérifier la cohérence avec les plans' },
      { type: 'logiciel', valeur: 'robot' },
      { type: 'texte', valeur: "Une note de calcul suit toujours le même fil : hypothèses (portée, charges G et Q, béton C25/30, acier Fe500), efforts calculés (moment fléchissant en travée, tranchant aux appuis), puis ferraillage résultant (section requise → barres retenues)." },
      { type: 'exemple', valeur: "Poutre 30×50, portée 5 m : moment 85 kN·m → section requise 5,2 cm² → retenu 3HA16 (6,03 cm²). Le plan de ferraillage doit montrer exactement 3HA16 en travée basse — sinon, question au BE." },
      { type: 'retenir', valeur: 'Hypothèses → efforts → ferraillage : le fil de toute note\nSection retenue toujours ≥ section calculée\nNote de calcul et plan de ferraillage doivent coïncider' },
    ],
    'Lire un profil en long de voirie': [
      { type: 'objectifs', valeur: 'Décoder un profil en long\nLire pentes, points hauts et bas\nComprendre déblais et remblais' },
      { type: 'logiciel', valeur: 'covadis' },
      { type: 'texte', valeur: "Le profil en long déroule la route en coupe : horizontal = distances cumulées, vertical = altitudes (échelle amplifiée ×10). Deux lignes : terrain naturel (TN) et projet. Projet au-dessus du TN = remblai, en dessous = déblai." },
      { type: 'texte', valeur: "Le cartouche donne pour chaque point : distance, altitude TN, altitude projet, pente (ex. +2,5 % sur 120 m). Les points bas reçoivent les ouvrages hydrauliques — c'est là que l'eau se rassemble." },
      { type: 'retenir', valeur: 'TN vs projet : dessus = remblai, dessous = déblai\nÉchelle verticale amplifiée — méfie-toi de l\'œil\nPoints bas = ouvrages hydrauliques' },
    ],
    'Modéliser un muret 3D simple': [
      { type: 'objectifs', valeur: 'Créer un volume simple dans SketchUp\nUtiliser Pousser/Tirer\nCoter et présenter le modèle' },
      { type: 'logiciel', valeur: 'sketchup' },
      { type: 'texte', valeur: "Trace un rectangle au sol (tape 6m;0,2m pour des dimensions exactes), puis Pousser/Tirer (P) pour l'extruder à 1,8 m. Ton muret existe en 3D en 30 secondes. Ajoute le chaperon : rectangle au sommet, léger débord, extrusion 5 cm." },
      { type: 'texte', valeur: "Applique un matériau (seau de peinture > béton), ajoute les cotes (outil Cotation). Orbite à la molette ; l'outil Coupe montre l'intérieur du modèle." },
      { type: 'astuce', valeur: "Tape TOUJOURS les dimensions au clavier après l'esquisse : un modèle « à peu près » ne sert à rien en BTP." },
      { type: 'retenir', valeur: 'Rectangle + Pousser/Tirer = 90 % de la modélisation simple\nDimensions au clavier, jamais à l\'œil\nSketchUp = croquis 3D rapide, pas maquette BIM' },
    ],
    'Localiser une parcelle sur fond cadastral': [
      { type: 'objectifs', valeur: 'Charger des couches dans QGIS\nNaviguer sur fond cadastral\nMesurer et identifier une parcelle' },
      { type: 'logiciel', valeur: 'qgis' },
      { type: 'texte', valeur: "QGIS empile des couches : fond satellite, cadastre (limites de parcelles), réseaux. Le panneau Couches gère visibilité et transparence. Navigation comme une carte web, échelle affichée en bas." },
      { type: 'texte', valeur: "L'outil Identifier clique une parcelle et affiche ses attributs (numéro, section, surface). L'outil Règle mesure distances et surfaces sur la carte — vérifie l'emprise réelle avant d'implanter." },
      { type: 'retenir', valeur: 'QGIS = couches empilées (fond + cadastre + réseaux)\nOutil Identifier = attributs de la parcelle\nMesurer l\'emprise AVANT toute implantation' },
    ],
    'Comprendre un planning multi-lots': [
      { type: 'objectifs', valeur: 'Lire un planning multi-entreprises\nComprendre les interfaces entre lots\nRepérer les co-activités à risque' },
      { type: 'logiciel', valeur: 'primavera' },
      { type: 'texte', valeur: "Chaque lot (gros œuvre, électricité, plomberie, peinture) a ses tâches regroupées par WBS (arborescence). Les liens INTER-lots sont les points sensibles : l'électricien ne câble pas avant que le plaquiste ferme — chaque interface est une négociation de dates." },
      { type: 'texte', valeur: "La co-activité (deux lots dans la même zone en même temps) se repère en filtrant par zone : risque sécurité ET productivité. Le planning général arbitre : qui passe en premier, qui attend." },
      { type: 'retenir', valeur: 'WBS = arborescence des lots\nLes liens entre lots = les vrais points de friction\nCo-activité = risque à planifier, jamais à subir' },
    ],
  };

  for (const l of logicielsData) {
    await prisma.exerciceLogiciel.deleteMany({ where: { logicielId: logiciels[l.slug].id } });
  }
  await prisma.exerciceLogiciel.createMany({
    data: exercicesData.map((e) => ({
      logicielId: logiciels[e.logiciel].id,
      titre: e.titre,
      typeSimulation: e.typeSimulation,
      niveau: e.niveau,
      competenceId: e.competence ? competences[e.competence].id : undefined,
      config: { blocs: leconsLogiciels[e.titre] ?? [] },
    })),
  });

  console.log('Seed — badges...');
  const badgesData: Array<{ slug: string; nom: string; description: string; rarete: Rarete }> = [
    { slug: 'securite-n1', nom: 'Sécurité N1', description: 'Bases de la sécurité chantier validées.', rarete: 'BRONZE' },
    { slug: 'rapport-journalier', nom: 'Rapport journalier', description: 'Premier rapport journalier réussi.', rarete: 'BRONZE' },
    { slug: 'excel-btp', nom: 'Excel BTP', description: 'Maîtrise des calculs Excel de chantier.', rarete: 'ARGENT' },
    { slug: 'lecture-plans', nom: 'Lecture de plans', description: 'Sait lire un plan d\'exécution.', rarete: 'ARGENT' },
    { slug: 'beton-n1', nom: 'Béton N1', description: 'Bases du béton armé validées.', rarete: 'BRONZE' },
    { slug: 'chef-equipe', nom: "Chef d'équipe", description: 'Première équipe dirigée avec succès.', rarete: 'ARGENT' },
    { slug: 'stagiaire-valide', nom: 'Stagiaire validé', description: 'Stage terminé avec succès.', rarete: 'OR' },
    { slug: 'metre-devis', nom: 'Métré et devis', description: 'Devis chiffré correctement.', rarete: 'ARGENT' },
    { slug: 'gestion-humaine', nom: 'Gestion humaine', description: 'Conflit d\'équipe résolu avec tact.', rarete: 'ARGENT' },
    { slug: 'perseverance', nom: 'Persévérance', description: 'Réussite après 3 échecs — l\'échec fait partie du chemin.', rarete: 'OR' },
  ];
  const badges: Record<string, { id: string }> = {};
  for (const b of badgesData) {
    badges[b.slug] = await prisma.badge.upsert({
      where: { slug: b.slug },
      create: { ...b, conditions: { description: b.description } },
      update: { ...b, conditions: { description: b.description } },
    });
  }

  console.log('Seed — items avatar (dressing)...');
  for (const item of avatarItemsData) {
    await prisma.itemAvatar.upsert({
      where: { slug: item.slug },
      create: item,
      update: item,
    });
  }

  console.log('Seed — missions (14 types)...');
  for (const [slug, contenus] of Object.entries(questionsVague2)) {
    questionsSupplementaires[slug] = [...(questionsSupplementaires[slug] ?? []), ...contenus];
  }
  missionsData.push(...missionsGrandeEcole);

  const missions: Record<string, { id: string }> = {};
  for (const m of missionsData) {
    m.contenus = [...m.contenus, ...(questionsSupplementaires[m.slug] ?? [])].map((c, i) => ({ ...c, ordre: i + 1 }));
  }
  for (const m of missionsData) {
    const mission = await prisma.mission.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        titre: m.titre,
        description: m.description,
        type: m.type,
        profils: m.profils,
        niveauRequis: m.niveauRequis,
        competences: m.competences.map((slug) => competences[slug].id),
        dureeLimiteSec: m.dureeLimiteSec,
        conditionReussite: m.conditionReussite ?? 60,
        badgeId: m.badge ? badges[m.badge].id : undefined,
        statut: 'PUBLIE',
      },
      update: {
        titre: m.titre,
        description: m.description,
        niveauRequis: m.niveauRequis,
        competences: m.competences.map((slug) => competences[slug].id),
        statut: 'PUBLIE',
      },
    });
    missions[m.slug] = mission;

    await prisma.missionContenu.deleteMany({ where: { missionId: mission.id } });
    await prisma.missionContenu.createMany({
      data: m.contenus.map((c) => ({
        missionId: mission.id,
        ordre: c.ordre,
        typeQuestion: c.typeQuestion,
        enonce: c.enonce,
        options: c.options as never,
        bonnesReponses: c.bonnesReponses as never,
        tolerance: c.tolerance,
        correctionPedagogique: c.correctionPedagogique,
      })),
    });
  }

  console.log('Seed — académie (16 modules)...');
  modulesAcademie.push(...modulesGrandeEcole);

  for (const m of modulesAcademie) {
    const module = await prisma.moduleAcademie.upsert({
      where: { slug: m.slug },
      create: { slug: m.slug, titre: m.titre, domaine: m.domaine, ordre: m.ordre, publie: true },
      update: { titre: m.titre, domaine: m.domaine, ordre: m.ordre, publie: true },
    });
    await prisma.cours.deleteMany({ where: { moduleId: module.id } });
    for (const c of [...m.cours, ...(coursSupplementaires[m.slug] ?? [])]) {
      const enrichi = enrichissementCours[c.titre];
      const blocs = [...(enrichi?.avant ?? []), ...c.blocs, ...(enrichi?.apres ?? [])];
      await prisma.cours.create({
        data: {
          moduleId: module.id,
          titre: c.titre,
          contenu: { blocs },
          competenceId: competences[m.competence].id,
          dureeMin: c.dureeMin + (enrichi ? 8 : 0),
          missionPratiqueId: c.missionPratique ? missions[c.missionPratique]?.id : undefined,
        },
      });
    }
  }

  console.log('Seed — PNJ...');
  const pnjData: Array<{ slug: string; nom: string; role: string }> = [
    { slug: 'mentor-akissi', nom: 'Akissi — Mentor', role: 'PROFESSEUR' },
    { slug: 'maitre-stage-kouame', nom: 'Kouamé — Maître de stage', role: 'MAITRE_STAGE' },
    { slug: 'superviseur-fatou', nom: 'Fatou — Superviseur', role: 'SUPERVISEUR' },
    { slug: 'chef-entreprise-diallo', nom: 'M. Diallo — Chef d\'entreprise', role: 'CHEF_ENTREPRISE' },
    { slug: 'recruteur-adama', nom: 'Adama — Recruteur', role: 'RECRUTEUR' },
    { slug: 'client-madame-toure', nom: 'Mme Touré — Cliente', role: 'CLIENT' },
    { slug: 'chef-chantier-yao', nom: 'Yao — Chef chantier', role: 'CHEF_CHANTIER' },
    { slug: 'controleur-brou', nom: 'Brou — Contrôleur qualité', role: 'CONTROLEUR' },
  ];
  const pnjs: Record<string, { id: string }> = {};
  for (const p of pnjData) {
    pnjs[p.slug] = await prisma.pnj.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, nom: p.nom, role: p.role as never, personnalite: { ton: 'bienveillant' } },
      update: { nom: p.nom },
    });
  }

  console.log('Seed — lieux...');
  const lieuxData: Array<{ slug: string; nom: string; description: string }> = [
    { slug: 'ECOLE', nom: 'École BTP', description: 'Lieu de formation initiale.' },
    { slug: 'CENTRE_FORMATION', nom: 'Centre de formation', description: 'Modules courts et certifiants.' },
    { slug: 'BUREAU_ETUDES', nom: "Bureau d'études", description: 'Conception et calculs.' },
    { slug: 'CHANTIER', nom: 'Chantier', description: 'Là où tout se construit.' },
    { slug: 'ENTREPRISE', nom: 'Entreprise', description: 'Siège de ton employeur virtuel.' },
    { slug: 'FOURNISSEUR', nom: 'Fournisseur', description: 'Matériaux et matériel.' },
    { slug: 'MAIRIE', nom: 'Mairie', description: 'Démarches administratives.' },
    { slug: 'BANQUE', nom: 'Banque', description: 'Financements et comptes virtuels.' },
    { slug: 'LABORATOIRE', nom: 'Laboratoire', description: 'Essais matériaux et sols.' },
    { slug: 'BUREAU_CONTROLE', nom: 'Bureau de contrôle', description: 'Contrôle réglementaire.' },
    { slug: 'DEPOT', nom: 'Dépôt', description: 'Stockage de matériel.' },
    { slug: 'CLIENT', nom: 'Client', description: 'Rendez-vous avec le client.' },
  ];
  for (const l of lieuxData) {
    await prisma.lieu.upsert({
      where: { slug: l.slug as never },
      create: { slug: l.slug as never, nom: l.nom, description: l.description, actions: [] },
      update: { nom: l.nom, description: l.description },
    });
  }

  console.log('Seed — chantiers virtuels (gestion complète)...');

  for (const c of chantiersGestion) {
    const chantier = await prisma.chantier.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug, nom: c.nom, typeProjet: c.typeProjet, paysId: civ.id,
        clientPnjId: pnjs['client-madame-toure'].id, localisationFictive: c.localisation,
        budget: c.budget, devise: 'FCFA', delaiJours: c.delaiJours, description: c.description, statut: 'DISPONIBLE',
        typeMarche: c.typeMarche,
      },
      update: { nom: c.nom, budget: c.budget, delaiJours: c.delaiJours, description: c.description, statut: 'DISPONIBLE', typeMarche: c.typeMarche },
    });

    // Phases recréées avec leurs besoins (jours, équipe, matériaux)
    await prisma.chantierPhase.deleteMany({ where: { chantierId: chantier.id } });
    for (let i = 0; i < c.phases.length; i++) {
      const p = c.phases[i];
      await prisma.chantierPhase.create({
        data: {
          chantierId: chantier.id,
          ordre: i + 1,
          nom: p.nom,
          besoins: { joursEstimes: p.joursEstimes, equipeMin: p.equipeMin, materiaux: p.materiaux },
          missions: { connect: p.missions.filter((s) => missions[s]).map((s) => ({ id: missions[s].id })) },
        },
      });
    }

    // Catalogue de matériaux commandables sur ce chantier
    await prisma.chantierRessource.deleteMany({ where: { chantierId: chantier.id } });
    await prisma.chantierRessource.createMany({
      data: c.materiaux.map((cle) => ({
        chantierId: chantier.id,
        type: 'MATERIAU' as const,
        ref: { nom: MATERIAUX[cle].nom, unite: MATERIAUX[cle].unite },
        quantite: 0,
        coutUnitaire: MATERIAUX[cle].cout,
      })),
    });
  }

  console.log('Seed — offres d\'emploi...');
  // niveauMin aligné sur les seuils de promotion du même poste (voir reglesData plus bas) —
  // sinon une offre d'embauche directe court-circuite la vraie progression de carrière.
  const offresData = [
    { titre: 'Stage chantier — Abidjan', profil: 'stagiaire-chantier', niveauMin: 1, reputationMin: 0, test: 'premier-jour-stage' },
    { titre: 'Aide métreur', profil: 'aide-metreur', niveauMin: 1, reputationMin: 300, test: 'metre-mur-cloture' },
    { titre: "Chef d'équipe — Riviera", profil: 'chef-equipe', niveauMin: 6, reputationMin: 400, test: 'retard-livraison-beton' },
    { titre: 'Assistant conducteur de travaux', profil: 'chef-chantier', niveauMin: 12, reputationMin: 550, test: 'chantier-villa-cocody-etape1' },
    { titre: 'Contrôleur qualité junior', profil: 'controleur-qualite', niveauMin: 6, reputationMin: 450, test: 'reception-ferraillage' },
  ];
  for (const o of offresData) {
    const slugSafe = o.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.offreEmploi.findFirst({ where: { titre: o.titre } });
    if (existing) {
      await prisma.offreEmploi.update({
        where: { id: existing.id },
        data: { niveauMin: o.niveauMin, reputationMin: o.reputationMin },
      });
    } else {
      await prisma.offreEmploi.create({
        data: {
          titre: o.titre,
          paysId: civ.id,
          description: `Offre virtuelle : ${o.titre}.`,
          profilRechercheId: profils[o.profil].id,
          niveauMin: o.niveauMin,
          reputationMin: o.reputationMin,
          testEntreeMissionId: missions[o.test]?.id,
          entrepriseFictive: 'BTP Life Construction SARL',
          statut: 'publiee',
        },
      });
    }
    void slugSafe;
  }

  console.log('Seed — règles de promotion...');
  // Chaque famille a désormais un chemin d'évolution complet (aucun poste n'est un cul-de-sac,
  // sauf le sommet de chaque filière). Conditions cohérentes avec le métier.
  //
  // niveauMin volontairement écarté entre les paliers (le premier poste reste rapide à
  // atteindre, mais les postes seniors/ingénieur demandent désormais 12 à 18 — combiné à la
  // courbe XP plus raide de xpRequisPourNiveau, l'écart étudiant → ingénieur redevient un vrai
  // temps de jeu plutôt qu'une après-midi.
  const reglesData = [
    // ── CHANTIER ──
    { source: 'etudiant-chantier', cible: 'stagiaire-chantier', conditions: { niveauMin: 2, competences: [{ slug: 'securite-n1', niveau: 1 }, { slug: 'bases-btp', niveau: 1 }] } },
    { source: 'stagiaire-chantier', cible: 'chef-equipe', conditions: { niveauMin: 7, reputationMin: 400, competences: [{ slug: 'lecture-plans', niveau: 1 }, { slug: 'gestion-humaine', niveau: 1 }] } },
    { source: 'chef-equipe', cible: 'chef-chantier', conditions: { niveauMin: 13, reputationMin: 500, chantiersReussis: 1, competences: [{ slug: 'beton-ferraillage', niveau: 2 }, { slug: 'decision-chantier', niveau: 1 }] } },
    { source: 'chef-chantier', cible: 'conducteur-travaux', conditions: { niveauMin: 18, reputationMin: 600, chantiersReussis: 2, competences: [{ slug: 'decision-chantier', niveau: 3 }], examenMissionId: missions['examen-conducteur-travaux'].id } },

    // ── BUREAU D'ÉTUDES ──
    { source: 'etudiant-be', cible: 'dessinateur-junior', conditions: { niveauMin: 2, competences: [{ slug: 'autocad-lecture', niveau: 1 }, { slug: 'lecture-plans', niveau: 1 }] } },
    { source: 'dessinateur-junior', cible: 'projeteur', conditions: { niveauMin: 7, reputationMin: 400, competences: [{ slug: 'autocad-lecture', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] } },
    { source: 'projeteur', cible: 'ingenieur-structure', conditions: { niveauMin: 14, reputationMin: 550, competences: [{ slug: 'beton-ferraillage', niveau: 3 }, { slug: 'lecture-plans', niveau: 3 }] } },

    // ── BIM ──
    { source: 'etudiant-bim', cible: 'dessinateur-bim', conditions: { niveauMin: 2, competences: [{ slug: 'autocad-lecture', niveau: 1 }, { slug: 'revit-bim', niveau: 1 }] } },
    { source: 'dessinateur-bim', cible: 'bim-modeleur', conditions: { niveauMin: 7, reputationMin: 400, competences: [{ slug: 'revit-bim', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] } },
    { source: 'bim-modeleur', cible: 'bim-coordinateur', conditions: { niveauMin: 14, reputationMin: 550, competences: [{ slug: 'revit-bim', niveau: 3 }, { slug: 'decision-chantier', niveau: 2 }] } },

    // ── MÉTRÉ / ÉCONOMIE ──
    { source: 'etudiant-metre', cible: 'aide-metreur', conditions: { niveauMin: 2, competences: [{ slug: 'metre-devis', niveau: 1 }, { slug: 'excel-btp', niveau: 1 }] } },
    { source: 'aide-metreur', cible: 'metreur-junior', conditions: { niveauMin: 7, reputationMin: 400, competences: [{ slug: 'metre-devis', niveau: 2 }, { slug: 'excel-btp', niveau: 2 }] } },
    { source: 'metreur-junior', cible: 'economiste', conditions: { niveauMin: 14, reputationMin: 550, competences: [{ slug: 'metre-devis', niveau: 3 }, { slug: 'excel-btp', niveau: 3 }] } },

    // ── QUALITÉ / HSE ──
    { source: 'etudiant-qualite', cible: 'assistant-hse', conditions: { niveauMin: 2, competences: [{ slug: 'securite-n1', niveau: 1 }, { slug: 'controle-qualite', niveau: 1 }] } },
    { source: 'assistant-hse', cible: 'controleur-qualite', conditions: { niveauMin: 7, reputationMin: 400, competences: [{ slug: 'controle-qualite', niveau: 2 }, { slug: 'securite-n1', niveau: 2 }] } },
    { source: 'controleur-qualite', cible: 'responsable-hse', conditions: { niveauMin: 14, reputationMin: 550, competences: [{ slug: 'controle-qualite', niveau: 3 }, { slug: 'reception-travaux', niveau: 2 }] } },

    // ── TOPOGRAPHIE ──
    { source: 'aide-topographe', cible: 'topographe-junior', conditions: { niveauMin: 4, competences: [{ slug: 'topographie', niveau: 1 }, { slug: 'lecture-plans', niveau: 1 }] } },
    { source: 'topographe-junior', cible: 'topographe-confirme', conditions: { niveauMin: 12, reputationMin: 500, competences: [{ slug: 'topographie', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] } },

    // ── GÉOTECHNIQUE ──
    { source: 'stagiaire-geotech', cible: 'technicien-labo-sol', conditions: { niveauMin: 4, competences: [{ slug: 'geotechnique', niveau: 1 }] } },
    { source: 'technicien-labo-sol', cible: 'ingenieur-geotechnique', conditions: { niveauMin: 12, reputationMin: 500, competences: [{ slug: 'geotechnique', niveau: 2 }, { slug: 'reception-travaux', niveau: 1 }] } },

    // ── ENTREPRENEUR ──
    { source: 'ouvrier-qualifie', cible: 'entrepreneur-debutant', conditions: { niveauMin: 6, reputationMin: 450, chantiersReussis: 1, competences: [{ slug: 'maconnerie', niveau: 2 }, { slug: 'gestion-humaine', niveau: 1 }] } },
    { source: 'entrepreneur-debutant', cible: 'gerant', conditions: { niveauMin: 15, reputationMin: 650, chantiersReussis: 2, competences: [{ slug: 'decision-chantier', niveau: 2 }, { slug: 'metre-devis', niveau: 2 }] } },
  ];
  for (const r of reglesData) {
    const existing = await prisma.reglePromotion.findFirst({
      where: { profilSourceId: profils[r.source].id, profilCibleId: profils[r.cible].id },
    });
    if (existing) {
      // Met à jour les conditions (sans casser les demandes de promotion qui référencent la règle).
      await prisma.reglePromotion.update({ where: { id: existing.id }, data: { conditions: r.conditions } });
    } else {
      await prisma.reglePromotion.create({
        data: {
          profilSourceId: profils[r.source].id,
          profilCibleId: profils[r.cible].id,
          conditions: r.conditions,
        },
      });
    }
  }

  console.log('Seed — pages CMS...');
  const pages = [
    { slug: 'cgu', titre: 'CGU', contenu: { texte: 'Conditions générales d\'utilisation de BTP Life.' } },
    { slug: 'confidentialite', titre: 'Confidentialité', contenu: { texte: 'Politique de confidentialité et RGPD.' } },
    { slug: 'mentions-legales', titre: 'Mentions légales', contenu: { texte: 'Éditeur : BTP Life. Hébergeur : à préciser.' } },
    { slug: 'cookies', titre: 'Cookies', contenu: { texte: 'Politique de gestion des cookies.' } },
    {
      slug: 'avertissement',
      titre: 'Avertissement pédagogique',
      contenu: {
        texte:
          "BTP Life est un simulateur pédagogique. Les contenus techniques et normatifs servent à l'apprentissage et ne remplacent pas les normes officielles, les bureaux d'études, les ingénieurs habilités, les laboratoires agréés ni les obligations réglementaires du pays concerné.",
      },
    },
  ];
  for (const p of pages) {
    await prisma.pageCms.upsert({
      where: { slug: p.slug },
      create: { ...p, publie: true },
      update: { ...p, publie: true },
    });
  }

  console.log('Seed — comptes de démonstration...');
  const adminPasswordHash = await argon2.hash('Admin1234!');
  await prisma.user.upsert({
    where: { email: 'admin@btplife.com' },
    create: {
      email: 'admin@btplife.com',
      passwordHash: adminPasswordHash,
      nom: 'Admin BTP Life',
      role: 'ADMIN',
      adminSubRole: 'SUPER_ADMIN',
      emailVerified: true,
      paysId: civ.id,
      carriere: { create: { referentielPaysId: civ.id } },
      cvVirtuel: { create: { contenu: {} } },
    },
    update: {},
  });

  // Compte admin réel de Jean, pour ajouter des matières via le générateur de cours.
  // Le mot de passe n'est jamais écrit en dur dans le repo : si JEAN_ADMIN_PASSWORD n'est
  // pas fourni, le script en génère un aléatoirement et l'affiche une seule fois ici.
  {
    const jeanUserExiste = await prisma.user.findUnique({ where: { email: 'jeanzoundi3@gmail.com' }, select: { id: true } });
    const jeanPasswordClair = process.env.JEAN_ADMIN_PASSWORD ?? (jeanUserExiste ? null : randomBytes(9).toString('base64url'));
    if (jeanPasswordClair) {
      const jeanPasswordHash = await argon2.hash(jeanPasswordClair);
      await prisma.user.upsert({
        where: { email: 'jeanzoundi3@gmail.com' },
        create: {
          email: 'jeanzoundi3@gmail.com',
          passwordHash: jeanPasswordHash,
          nom: 'Jean Zoundi',
          role: 'ADMIN',
          adminSubRole: 'SUPER_ADMIN',
          emailVerified: true,
          paysId: civ.id,
          carriere: { create: { referentielPaysId: civ.id } },
          cvVirtuel: { create: { contenu: {} } },
        },
        update: { passwordHash: jeanPasswordHash },
      });
      if (!process.env.JEAN_ADMIN_PASSWORD) {
        console.log(`  Admin Jean : jeanzoundi3@gmail.com / ${jeanPasswordClair} (généré — à changer après connexion)`);
      }
    } else {
      console.log('  (compte jeanzoundi3@gmail.com déjà présent, mot de passe inchangé)');
    }
  }

  const demoPasswordHash = await argon2.hash('Demo1234!');
  const demo = await prisma.user.upsert({
    where: { email: 'demo@btplife.com' },
    create: {
      email: 'demo@btplife.com',
      passwordHash: demoPasswordHash,
      nom: 'Joueur Démo',
      pseudo: 'DemoBuilder',
      ville: 'Abidjan',
      domaineBtp: 'Gros œuvre',
      emailVerified: true,
      paysId: civ.id,
      carriere: {
        create: {
          referentielPaysId: civ.id,
          profilActuelId: profils['stagiaire-chantier'].id,
          metierCibleId: metiers['conducteur-travaux'].id,
          niveau: 2,
          xp: 250,
          reputation: 550,
          argentVirtuel: 150000,
        },
      },
      avatar: {
        create: {
          nomPersonnage: 'DemoBuilder',
          style: 'realiste',
          tenue: 'gilet-orange',
          equipement: 'casque-blanc',
          metierRepresente: 'stagiaire-chantier',
        },
      },
      cvVirtuel: { create: { contenu: {} } },
    },
    update: {},
  });

  await prisma.userMission.upsert({
    where: { userId_missionId: { userId: demo.id, missionId: missions['premier-jour-stage'].id } },
    create: {
      userId: demo.id,
      missionId: missions['premier-jour-stage'].id,
      statut: 'REUSSIE',
      score: 90,
      meilleurScore: 90,
      tentatives: 1,
      termineeLe: new Date(),
    },
    update: {},
  });

  console.log('Seed terminé ✔');
  console.log('  Admin  : admin@btplife.com / Admin1234!');
  console.log('  Démo   : demo@btplife.com / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
