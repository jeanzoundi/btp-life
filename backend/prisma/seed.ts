/* Seed de contenu BTP Life — données pilotes Côte d'Ivoire + France.
 * Tout le contenu est data-driven (voir CONCEPTION.md) : ce script est
 * le "back-office initial" avant que l'admin web ne prenne le relais.
 */
import { PrismaClient, ProfilFamille, QuestionType, Rarete } from '@prisma/client';
import * as argon2 from 'argon2';

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

  console.log('Seed — missions (14 types)...');
  type ContenuSeed = {
    ordre: number;
    typeQuestion: QuestionType;
    enonce: string;
    options?: unknown;
    bonnesReponses: unknown;
    tolerance?: number;
    correctionPedagogique: string;
  };
  type MissionSeed = {
    slug: string;
    titre: string;
    description: string;
    type:
      | 'QUIZ' | 'CHRONO' | 'ANALYSE_IMAGE' | 'LECTURE_PLAN' | 'CALCUL' | 'METRE' | 'DEVIS'
      | 'RAPPORT' | 'DECISION' | 'GESTION_HUMAINE' | 'SIMULATION_LOGICIEL' | 'CONTROLE_QUALITE'
      | 'CHANTIER_COMPLET' | 'EXAMEN';
    profils: string[];
    niveauRequis: number;
    competences: string[];
    dureeLimiteSec?: number;
    conditionReussite?: number;
    badge?: string;
    contenus: ContenuSeed[];
  };

  const missionsData: MissionSeed[] = [
    {
      slug: 'acteurs-projet-btp',
      titre: "Les acteurs d'un projet BTP",
      description: "Identifie le rôle de chaque acteur d'un chantier.",
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 1,
      competences: ['bases-btp'],
      badge: undefined,
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Qui est responsable de la conception technique du bâtiment ?',
          options: [
            { id: 'a', label: "Le maître d'ouvrage" },
            { id: 'b', label: "Le bureau d'études" },
            { id: 'c', label: 'Le fournisseur' },
          ],
          bonnesReponses: ['b'],
          correctionPedagogique: "Le bureau d'études conçoit et calcule les ouvrages.",
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'Qui dirige l\'exécution quotidienne du chantier ?',
          options: [
            { id: 'a', label: 'Le chef chantier' },
            { id: 'b', label: 'Le banquier' },
            { id: 'c', label: "L'architecte seul" },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Le chef chantier organise le travail quotidien sur le terrain.',
        },
      ],
    },
    {
      slug: 'vocabulaire-chantier',
      titre: 'Vocabulaire de chantier',
      description: 'Connaître les termes essentiels utilisés sur un chantier.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 1,
      competences: ['bases-btp'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Que désigne le terme "coffrage" ?',
          options: [
            { id: 'a', label: 'Le moule qui contient le béton frais' },
            { id: 'b', label: 'Un type de peinture' },
            { id: 'c', label: 'Un outil de topographie' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Le coffrage maintient le béton dans la forme voulue avant sa prise.',
        },
      ],
    },
    {
      slug: 'controle-avant-coulage',
      titre: 'Contrôle avant coulage',
      description: 'Vérifie les points clés avant un coulage de béton, sous pression du temps.',
      type: 'CHRONO',
      profils: ['stagiaire-chantier', 'chef-equipe'],
      niveauRequis: 2,
      competences: ['beton-ferraillage', 'securite-n1'],
      dureeLimiteSec: 420,
      badge: 'beton-n1',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Avant de couler, que dois-tu vérifier en priorité ?',
          options: [
            { id: 'a', label: 'La propreté du chantier' },
            { id: 'b', label: 'Le calage et la solidité du ferraillage' },
            { id: 'c', label: 'La couleur du béton' },
          ],
          bonnesReponses: ['b'],
          correctionPedagogique: 'Un ferraillage mal calé compromet la résistance de l\'ouvrage.',
        },
        {
          ordre: 2,
          typeQuestion: 'NUMERIQUE',
          enonce: 'Quel enrobage minimal (en cm) doit séparer les aciers du coffrage ?',
          bonnesReponses: 3,
          tolerance: 0.5,
          correctionPedagogique: "Un enrobage d'environ 3 cm protège l'acier de la corrosion.",
        },
      ],
    },
    {
      slug: 'dangers-sur-photo',
      titre: 'Repère les dangers sur ce chantier',
      description: 'Analyse une photo de chantier et identifie les risques.',
      type: 'ANALYSE_IMAGE',
      profils: ['etudiant-chantier', 'stagiaire-chantier'],
      niveauRequis: 1,
      competences: ['securite-n1'],
      badge: 'securite-n1',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'ZONE_IMAGE',
          enonce: 'Sélectionne les zones dangereuses sur ce chantier (casque absent, échafaudage instable, câble au sol).',
          options: [
            { id: 'casque', label: 'Ouvrier sans casque' },
            { id: 'echafaudage', label: 'Échafaudage instable' },
            { id: 'cable', label: 'Câble électrique au sol' },
            { id: 'materiel', label: 'Zone de stockage rangée' },
          ],
          bonnesReponses: ['casque', 'echafaudage', 'cable'],
          correctionPedagogique: 'La zone de stockage rangée ne présente pas de danger particulier ici.',
        },
      ],
    },
    {
      slug: 'lecture-plan-poteau',
      titre: 'Trouve la section du poteau P3',
      description: "Exercice de lecture d'un plan de coffrage.",
      type: 'LECTURE_PLAN',
      profils: ['stagiaire-chantier', 'dessinateur-junior'],
      niveauRequis: 2,
      competences: ['lecture-plans'],
      badge: 'lecture-plans',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'ZONE_IMAGE',
          enonce: 'Clique sur le poteau référencé P3 dans le plan.',
          options: [
            { id: 'p1', label: 'Poteau P1' },
            { id: 'p2', label: 'Poteau P2' },
            { id: 'p3', label: 'Poteau P3' },
          ],
          bonnesReponses: ['p3'],
          correctionPedagogique: 'P3 est repérable au croisement des axes C et 3 sur le plan.',
        },
      ],
    },
    {
      slug: 'volume-beton-dalle',
      titre: "Calcul du volume de béton d'une dalle",
      description: 'Calcule la quantité de béton nécessaire.',
      type: 'CALCUL',
      profils: ['stagiaire-chantier', 'aide-metreur'],
      niveauRequis: 2,
      competences: ['beton-ferraillage', 'metre-devis'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'NUMERIQUE',
          enonce: 'Une dalle de 8m x 5m x 0,15m — quel volume de béton en m³ ?',
          bonnesReponses: 6,
          tolerance: 0.1,
          correctionPedagogique: '8 × 5 × 0,15 = 6 m³.',
        },
      ],
    },
    {
      slug: 'metre-mur-cloture',
      titre: "Métré d'un mur de clôture",
      description: 'Calcule la surface et le nombre de parpaings nécessaires.',
      type: 'METRE',
      profils: ['aide-metreur', 'metreur-junior'],
      niveauRequis: 2,
      competences: ['metre-devis'],
      badge: 'metre-devis',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'NUMERIQUE',
          enonce: 'Un mur de 20m de long sur 2m de haut — quelle surface en m² ?',
          bonnesReponses: 40,
          tolerance: 0,
          correctionPedagogique: '20 × 2 = 40 m².',
        },
        {
          ordre: 2,
          typeQuestion: 'NUMERIQUE',
          enonce: 'Avec 12,5 parpaings au m², combien de parpaings pour ce mur (arrondi à l\'unité) ?',
          bonnesReponses: 500,
          tolerance: 10,
          correctionPedagogique: '40 m² × 12,5 = 500 parpaings.',
        },
      ],
    },
    {
      slug: 'devis-chambre-simple',
      titre: "Devis d'une chambre simple",
      description: 'Établis un devis à partir de la bibliothèque de prix Côte d\'Ivoire.',
      type: 'DEVIS',
      profils: ['metreur-junior', 'economiste'],
      niveauRequis: 3,
      competences: ['metre-devis'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'NUMERIQUE',
          enonce: 'Pour 3 m³ de béton à 85 000 FCFA/m³, quel est le coût total en FCFA ?',
          bonnesReponses: 255000,
          tolerance: 0,
          correctionPedagogique: '3 × 85 000 = 255 000 FCFA.',
        },
      ],
    },
    {
      slug: 'rapport-journalier-coulage',
      titre: 'Rapport de la journée de coulage',
      description: 'Rédige un rapport journalier structuré.',
      type: 'RAPPORT',
      profils: ['stagiaire-chantier'],
      niveauRequis: 2,
      competences: ['word-rapport'],
      badge: 'rapport-journalier',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'TEXTE',
          enonce: 'Résume en une phrase les travaux réalisés aujourd\'hui (coulage, effectif, météo).',
          bonnesReponses: ['coulage', 'effectif', 'météo'],
          correctionPedagogique: 'Un bon rapport journalier mentionne toujours les travaux, l\'effectif et la météo.',
        },
      ],
    },
    {
      slug: 'retard-livraison-beton',
      titre: 'Le béton arrive avec 1h de retard',
      description: 'Décision à conséquences face à un imprévu de chantier.',
      type: 'DECISION',
      profils: ['chef-equipe', 'chef-chantier'],
      niveauRequis: 3,
      competences: ['decision-chantier'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'CHOIX_CONSEQUENCE',
          enonce: 'La toupie à béton a 1h de retard, l\'équipe attend. Que fais-tu ?',
          options: [
            { id: 'attendre', label: 'Faire attendre l\'équipe sans rien dire', points: 30, consequences: { reputation: -3, budget: -20000 } },
            { id: 'reorganiser', label: 'Réorganiser l\'équipe sur une autre tâche en attendant', points: 100, consequences: { reputation: 3, budget: 0 } },
            { id: 'annuler', label: 'Annuler le coulage du jour', points: 50, consequences: { reputation: -1, budget: -50000 } },
          ],
          bonnesReponses: 'reorganiser',
          correctionPedagogique: "Réorganiser l'équipe évite la perte de temps et de budget.",
        },
      ],
    },
    {
      slug: 'casque-refuse',
      titre: 'Un ouvrier refuse de porter son casque',
      description: 'Gère un conflit de sécurité avec diplomatie et fermeté.',
      type: 'GESTION_HUMAINE',
      profils: ['chef-equipe'],
      niveauRequis: 3,
      competences: ['gestion-humaine', 'securite-n1'],
      badge: 'gestion-humaine',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'CHOIX_CONSEQUENCE',
          enonce: 'Un ouvrier refuse son casque en zone à risque. Que fais-tu ?',
          options: [
            { id: 'ignorer', label: 'Laisser faire pour ne pas envenimer', points: 10, consequences: { reputation: -5, securite: true } },
            { id: 'expliquer', label: 'Rappeler la règle et expliquer le risque encouru', points: 100, consequences: { reputation: 4, securite: false } },
            { id: 'sanctionner', label: 'Sanctionner immédiatement sans discussion', points: 40, consequences: { reputation: -1, securite: false } },
          ],
          bonnesReponses: 'expliquer',
          correctionPedagogique: 'Expliquer le risque construit une culture sécurité durable — ignorer met en danger toute l\'équipe.',
        },
      ],
    },
    {
      slug: 'excel-calcul-volumes',
      titre: 'Calcul de volumes dans Excel BTP',
      description: 'Simulation d\'un tableur pour calculer des volumes de terrassement.',
      type: 'SIMULATION_LOGICIEL',
      profils: ['aide-metreur', 'stagiaire-chantier'],
      niveauRequis: 2,
      competences: ['excel-btp'],
      badge: 'excel-btp',
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'NUMERIQUE',
          enonce: 'Formule Excel =A1*A2*A3 avec A1=10, A2=4, A3=2 — quel résultat obtiens-tu ?',
          bonnesReponses: 80,
          tolerance: 0,
          correctionPedagogique: '10 × 4 × 2 = 80.',
        },
      ],
    },
    {
      slug: 'reception-ferraillage',
      titre: 'Réception du ferraillage',
      description: 'Checklist de contrôle qualité avant validation.',
      type: 'CONTROLE_QUALITE',
      profils: ['controleur-qualite', 'chef-chantier'],
      niveauRequis: 3,
      competences: ['controle-qualite', 'beton-ferraillage'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Que dois-tu vérifier en priorité avant validation du ferraillage ?',
          options: [
            { id: 'a', label: 'Diamètre, espacement et enrobage des aciers' },
            { id: 'b', label: 'La couleur de la peinture du chantier' },
            { id: 'c', label: 'Le nombre de camions garés' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Diamètre, espacement et enrobage conditionnent la résistance de l\'ouvrage.',
        },
      ],
    },
    {
      slug: 'chantier-villa-cocody-etape1',
      titre: 'Couler la dalle du chantier "Villa Cocody"',
      description: 'Mission chantier complète : de la préparation au coulage.',
      type: 'CHANTIER_COMPLET',
      profils: ['chef-equipe', 'chef-chantier'],
      niveauRequis: 4,
      competences: ['beton-ferraillage', 'decision-chantier'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'ORDONNANCEMENT',
          enonce: 'Remets dans l\'ordre les étapes de coulage d\'une dalle.',
          options: [
            { id: 'implantation', label: 'Implantation' },
            { id: 'coffrage', label: 'Coffrage' },
            { id: 'ferraillage', label: 'Ferraillage' },
            { id: 'coulage', label: 'Coulage du béton' },
          ],
          bonnesReponses: ['implantation', 'coffrage', 'ferraillage', 'coulage'],
          correctionPedagogique: 'On implante, on coffre, on ferraille, puis on coule.',
        },
      ],
    },
    {
      slug: 'examen-conducteur-travaux',
      titre: 'Examen conducteur de travaux',
      description: 'Examen de passage vers le poste de conducteur de travaux.',
      type: 'EXAMEN',
      profils: ['chef-chantier'],
      niveauRequis: 6,
      competences: ['decision-chantier', 'metre-devis', 'gestion-humaine'],
      dureeLimiteSec: 1800,
      conditionReussite: 75,
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Quelle est la priorité absolue lors d\'un arbitrage budget/sécurité ?',
          options: [
            { id: 'a', label: 'Le budget' },
            { id: 'b', label: 'La sécurité' },
            { id: 'c', label: 'Le planning' },
          ],
          bonnesReponses: ['b'],
          correctionPedagogique: 'La sécurité prime toujours, quel qu\'en soit le coût.',
        },
        {
          ordre: 2,
          typeQuestion: 'CHOIX_CONSEQUENCE',
          enonce: 'Le client demande d\'accélérer les travaux en réduisant les contrôles qualité. Que fais-tu ?',
          options: [
            { id: 'accepter', label: 'Accepter pour satisfaire le client', points: 20, consequences: { reputation: -5 } },
            { id: 'negocier', label: 'Négocier un délai réaliste sans sacrifier la qualité', points: 100, consequences: { reputation: 5 } },
          ],
          bonnesReponses: 'negocier',
          correctionPedagogique: 'Un bon conducteur de travaux protège la qualité même sous pression commerciale.',
        },
      ],
    },
    {
      slug: 'types-de-sols',
      titre: 'Les types de sols',
      description: 'Reconnaître les grandes familles de sols et leurs implications.',
      type: 'QUIZ',
      profils: ['stagiaire-geotech'],
      niveauRequis: 2,
      competences: ['geotechnique'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Quel type de sol présente généralement la meilleure portance ?',
          options: [
            { id: 'a', label: 'Sol argileux gorgé d\'eau' },
            { id: 'b', label: 'Sol rocheux sain' },
            { id: 'c', label: 'Sable fin non compacté' },
          ],
          bonnesReponses: ['b'],
          correctionPedagogique: 'Un sol rocheux sain offre en général la meilleure portance pour les fondations.',
        },
      ],
    },
    {
      slug: 'implantation-topo',
      titre: "Implantation d'un bâtiment",
      description: 'Exercice pratique de topographie.',
      type: 'CALCUL',
      profils: ['aide-topographe', 'topographe-junior'],
      niveauRequis: 2,
      competences: ['topographie'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'NUMERIQUE',
          enonce: 'La cote du terrain naturel est 102,30m, le niveau fini prévu est 102,80m. Quel remblai (en m) faut-il apporter ?',
          bonnesReponses: 0.5,
          tolerance: 0.02,
          correctionPedagogique: '102,80 − 102,30 = 0,50 m de remblai.',
        },
      ],
    },
    {
      slug: 'pv-reception-travaux',
      titre: 'PV de réception des travaux',
      description: 'Rédiger un procès-verbal de réception avec réserves.',
      type: 'RAPPORT',
      profils: ['chef-chantier', 'conducteur-travaux'],
      niveauRequis: 5,
      competences: ['reception-travaux'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'TEXTE',
          enonce: 'Cite les éléments obligatoires d\'un PV de réception (réserves, date, signatures).',
          bonnesReponses: ['réserves', 'date', 'signature'],
          correctionPedagogique: 'Un PV de réception mentionne toujours la date, les réserves éventuelles et les signatures des parties.',
        },
      ],
    },
    {
      slug: 'premier-jour-stage',
      titre: 'Premier jour de stage',
      description: 'Découvre les codes du chantier lors de ton premier jour.',
      type: 'QUIZ',
      profils: ['stagiaire-chantier'],
      niveauRequis: 1,
      competences: ['bases-btp', 'securite-n1'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'En arrivant sur un chantier pour la première fois, ta première action est :',
          options: [
            { id: 'a', label: 'Te présenter au chef chantier et récupérer tes EPI' },
            { id: 'b', label: 'Commencer à travailler immédiatement' },
            { id: 'c', label: 'Attendre dans la voiture' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'On se présente toujours au responsable et on s\'équipe avant toute intervention.',
        },
      ],
    },
    // ── Quiz des nouveaux modules académie ──
    {
      slug: 'quiz-topographie',
      titre: 'Quiz — Topographie et implantation',
      description: "Valide les bases de l'implantation d'un ouvrage.",
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 1,
      competences: ['topographie'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: "Que matérialisent les chaises d'implantation sur un chantier ?",
          options: [
            { id: 'a', label: "Les axes et alignements du bâtiment" },
            { id: 'b', label: 'Le niveau de la toiture' },
            { id: 'c', label: "L'emplacement de la grue" },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Les chaises portent les cordeaux qui matérialisent les axes des murs et fondations — c'est la référence de tout le chantier.",
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'À quoi sert un niveau de chantier (lunette optique) ?',
          options: [
            { id: 'a', label: "Mesurer des différences d'altitude entre points" },
            { id: 'b', label: 'Mesurer la température du béton' },
            { id: 'c', label: 'Compter les agglos posés' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Le niveau permet de reporter des altitudes (trait de niveau, fond de fouille) par visées horizontales.",
        },
        {
          ordre: 3,
          typeQuestion: 'NUMERIQUE',
          enonce: "Tu dois vérifier une équerre par la méthode 3-4-5. Si les côtés mesurent 3 m et 4 m, quelle doit être la diagonale (en m) ?",
          bonnesReponses: 5,
          tolerance: 0.01,
          correctionPedagogique: '3² + 4² = 9 + 16 = 25, soit une diagonale de 5 m — le triangle 3-4-5 garantit un angle droit.',
        },
      ],
    },
    {
      slug: 'quiz-geotechnique',
      titre: 'Quiz — Sols et géotechnique',
      description: 'Reconnais les sols et leurs pièges avant de fonder.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['geotechnique'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: "Quel essai mesure la portance d'un sol en place ?",
          options: [
            { id: 'a', label: "L'essai de plaque" },
            { id: 'b', label: 'Le slump test' },
            { id: 'c', label: "L'essai d'étanchéité" },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "L'essai de plaque charge le sol et mesure son enfoncement — le slump test, lui, concerne le béton frais.",
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'Un sol argileux est particulièrement sensible à :',
          options: [
            { id: 'a', label: 'Au retrait-gonflement selon l\'humidité' },
            { id: 'b', label: 'Aux rayons du soleil uniquement' },
            { id: 'c', label: 'Au bruit du chantier' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "L'argile gonfle quand elle s'humidifie et se rétracte en séchant — d'où fissures si les fondations sont mal conçues.",
        },
      ],
    },
    {
      slug: 'quiz-controle-qualite',
      titre: 'Quiz — Contrôle qualité',
      description: 'Non-conformités, essais et traçabilité.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['controle-qualite'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Une non-conformité détectée sur chantier doit être :',
          options: [
            { id: 'a', label: 'Tracée sur une fiche et traitée' },
            { id: 'b', label: 'Cachée pour ne pas retarder le chantier' },
            { id: 'c', label: 'Ignorée si elle est petite' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Toute non-conformité se trace (fiche NC), s\'analyse et se traite — c\'est la base de la qualité.',
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'Le slump test (cône d\'Abrams) contrôle :',
          options: [
            { id: 'a', label: 'La consistance du béton frais' },
            { id: 'b', label: 'La couleur du béton' },
            { id: 'c', label: 'La résistance à 28 jours' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "L'affaissement du cône mesure l'ouvrabilité du béton frais. La résistance à 28 jours se mesure par écrasement d'éprouvettes.",
        },
      ],
    },
    {
      slug: 'quiz-reception-travaux',
      titre: 'Quiz — Réception des travaux',
      description: 'PV, réserves et transfert de l\'ouvrage.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['reception-travaux'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'La réception des travaux marque :',
          options: [
            { id: 'a', label: "Le transfert de l'ouvrage au maître d'ouvrage" },
            { id: 'b', label: 'Le début du chantier' },
            { id: 'c', label: 'La commande des matériaux' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "La réception transfère la garde de l'ouvrage et déclenche les garanties (parfait achèvement, décennale…).",
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'Les "réserves" émises à la réception sont :',
          options: [
            { id: 'a', label: 'Des défauts à corriger, consignés au PV' },
            { id: 'b', label: 'Des stocks de matériaux' },
            { id: 'c', label: 'Des jours de congés' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Les réserves listent les imperfections constatées ; l\'entreprise doit les lever dans le délai convenu.',
        },
      ],
    },
    {
      slug: 'quiz-planification',
      titre: 'Quiz — Planification de chantier',
      description: 'Gantt, chemin critique et enchaînement des tâches.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['decision-chantier'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Un planning Gantt représente :',
          options: [
            { id: 'a', label: 'Les tâches du projet dans le temps' },
            { id: 'b', label: 'Le budget du projet' },
            { id: 'c', label: "L'organigramme de l'entreprise" },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Chaque barre du Gantt représente une tâche positionnée dans le temps avec ses liens de dépendance.',
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'Le chemin critique d\'un planning est :',
          options: [
            { id: 'a', label: 'La suite de tâches sans marge : tout retard décale la fin' },
            { id: 'b', label: "La route d'accès au chantier" },
            { id: 'c', label: 'La liste des risques HSE' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Retarder une tâche du chemin critique retarde le projet entier — on les surveille en priorité.',
        },
        {
          ordre: 3,
          typeQuestion: 'ORDONNANCEMENT',
          enonce: 'Remets ces phases de gros œuvre dans l\'ordre logique :',
          options: [
            { id: 'a', label: 'Terrassement' },
            { id: 'b', label: 'Fondations' },
            { id: 'c', label: 'Élévation des murs' },
            { id: 'd', label: 'Toiture' },
          ],
          bonnesReponses: ['a', 'b', 'c', 'd'],
          correctionPedagogique: 'On terrasse, on fonde, on élève, on couvre — chaque phase prépare la suivante.',
        },
      ],
    },
    {
      slug: 'quiz-materiaux',
      titre: 'Quiz — Matériaux de construction',
      description: 'Ciment, granulats, agglos : les fondamentaux.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 1,
      competences: ['maconnerie'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Le ciment durcit par :',
          options: [
            { id: 'a', label: "Hydratation (réaction chimique avec l'eau)" },
            { id: 'b', label: "Simple séchage à l'air" },
            { id: 'c', label: 'Refroidissement' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Le ciment fait prise par réaction chimique avec l'eau — c'est pourquoi on cure le béton au lieu de le laisser sécher.",
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: 'Un "agglo de 15" désigne un parpaing :',
          options: [
            { id: 'a', label: 'De 15 cm de largeur' },
            { id: 'b', label: 'De 15 kg' },
            { id: 'c', label: 'De 15 cm de longueur' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "L'appellation donne l'épaisseur du mur fini : agglo de 10, 15 ou 20 cm de large (longueur standard 40/50 cm).",
        },
      ],
    },
    {
      slug: 'quiz-coffrage',
      titre: 'Quiz — Coffrage et étaiement',
      description: 'Soutenir et mouler le béton en sécurité.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['beton-ferraillage'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: "Quand peut-on décoffrer une dalle ?",
          options: [
            { id: 'a', label: 'Quand le béton a atteint une résistance suffisante' },
            { id: 'b', label: 'Systématiquement le lendemain' },
            { id: 'c', label: 'Après la peinture' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Le délai dépend de la résistance atteinte (météo, ciment) — décoffrer trop tôt = flèche voire effondrement.',
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: "L'étaiement sert à :",
          options: [
            { id: 'a', label: 'Soutenir provisoirement la structure pendant la prise' },
            { id: 'b', label: 'Décorer le chantier' },
            { id: 'c', label: 'Isoler thermiquement' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Les étais reprennent le poids du béton frais tant qu'il n'est pas autoporteur — on ne les retire jamais sans consigne.",
        },
      ],
    },
    {
      slug: 'quiz-vrd',
      titre: 'Quiz — VRD et assainissement',
      description: 'Voirie, réseaux, pentes et regards.',
      type: 'QUIZ',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['bases-btp'],
      contenus: [
        {
          ordre: 1,
          typeQuestion: 'QCM',
          enonce: 'Que signifie le sigle VRD ?',
          options: [
            { id: 'a', label: 'Voirie et Réseaux Divers' },
            { id: 'b', label: 'Vérification Rapide Des travaux' },
            { id: 'c', label: 'Voie Réservée aux Dumpers' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Les VRD regroupent voirie, eau potable, eaux usées, eaux pluviales, électricité, télécom…',
        },
        {
          ordre: 2,
          typeQuestion: 'QCM',
          enonce: "Pourquoi impose-t-on une pente minimale aux canalisations d'eaux usées ?",
          options: [
            { id: 'a', label: "Pour assurer l'auto-curage (éviter les dépôts)" },
            { id: 'b', label: "Pour ralentir l'eau" },
            { id: 'c', label: 'Pour économiser des tuyaux' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Une pente suffisante (souvent ≥ 1 %) maintient une vitesse d'écoulement qui empêche les matières de se déposer.",
        },
      ],
    },
    // ── Quiz des modules logiciels ──
    {
      slug: 'quiz-autocad',
      titre: 'Quiz — AutoCAD : lire un plan DWG',
      description: 'Calques, échelles et cotations dans AutoCAD.',
      type: 'SIMULATION_LOGICIEL',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['autocad-lecture'],
      contenus: [
        {
          ordre: 1, typeQuestion: 'QCM',
          enonce: 'Le format DWG est :',
          options: [
            { id: 'a', label: "Le format natif des dessins AutoCAD" },
            { id: 'b', label: 'Un type de béton dosé' },
            { id: 'c', label: 'Une norme de sécurité' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'DWG = dessin natif AutoCAD ; le DXF sert aux échanges entre logiciels.',
        },
        {
          ordre: 2, typeQuestion: 'QCM',
          enonce: 'À quoi servent les calques (layers) ?',
          options: [
            { id: 'a', label: 'Organiser le dessin par catégories (murs, cotes, textes…)' },
            { id: 'b', label: 'Imprimer plus vite' },
            { id: 'c', label: 'À rien, on dessine tout au même endroit' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Les calques permettent d\'afficher/masquer chaque famille d\'objets — indispensable pour lire un plan chargé.',
        },
        {
          ordre: 3, typeQuestion: 'QCM',
          enonce: 'Pour mesurer une distance dans un DWG, on utilise :',
          options: [
            { id: 'a', label: 'La commande de mesure (DIST/MEASURE) ou les cotations' },
            { id: 'b', label: 'Une règle posée sur l\'écran' },
            { id: 'c', label: 'On devine à l\'œil' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Le dessin est à l'échelle réelle dans l'espace objet : la commande DIST donne la vraie dimension.",
        },
        {
          ordre: 4, typeQuestion: 'QCM',
          enonce: "Espace objet vs espace présentation :",
          options: [
            { id: 'a', label: "L'objet contient le dessin en vraie grandeur, la présentation gère la mise en page" },
            { id: 'b', label: 'Ce sont deux logiciels différents' },
            { id: 'c', label: "La présentation contient le dessin en vraie grandeur" },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'On dessine en unités réelles dans l\'espace objet ; les fenêtres de présentation appliquent l\'échelle d\'impression.',
        },
        {
          ordre: 5, typeQuestion: 'QCM',
          enonce: 'À la réception d\'un DWG externe, le premier réflexe est :',
          options: [
            { id: 'a', label: "Vérifier les unités et l'échelle du dessin" },
            { id: 'b', label: "L'imprimer directement" },
            { id: 'c', label: 'Supprimer les calques inconnus' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Un dessin en mm interprété en m fausse tout : on contrôle unités, échelle et système de coordonnées avant usage.',
        },
      ],
    },
    {
      slug: 'quiz-bim',
      titre: 'Quiz — BIM & Revit : la maquette numérique',
      description: 'Comprendre la maquette, les clashs et les LOD.',
      type: 'SIMULATION_LOGICIEL',
      profils: ['etudiant-chantier'],
      niveauRequis: 3,
      competences: ['revit-bim'],
      contenus: [
        {
          ordre: 1, typeQuestion: 'QCM',
          enonce: 'BIM signifie :',
          options: [
            { id: 'a', label: 'Building Information Modeling' },
            { id: 'b', label: 'Béton Industriel Moderne' },
            { id: 'c', label: 'Bureau d\'Ingénierie Mécanique' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Le BIM est une méthode de travail autour d\'une maquette numérique partagée, pas seulement un logiciel.',
        },
        {
          ordre: 2, typeQuestion: 'QCM',
          enonce: 'Une maquette BIM contient :',
          options: [
            { id: 'a', label: 'La géométrie 3D ET les données (matériaux, quantités, propriétés)' },
            { id: 'b', label: 'Seulement de jolis rendus 3D' },
            { id: 'c', label: 'Uniquement des plans 2D scannés' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: "Le « I » de BIM est le plus important : chaque objet porte ses informations (béton C25/30, surface, niveau…).",
        },
        {
          ordre: 3, typeQuestion: 'QCM',
          enonce: 'Un "clash" détecté dans la maquette est :',
          options: [
            { id: 'a', label: 'Une collision entre éléments (ex. gaine qui traverse une poutre)' },
            { id: 'b', label: 'Une dispute entre projeteurs' },
            { id: 'c', label: 'Un bug du logiciel' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'La détection de clashs avant travaux évite les percements sauvages et les reprises sur chantier.',
        },
        {
          ordre: 4, typeQuestion: 'QCM',
          enonce: 'Le LOD (Level of Development) exprime :',
          options: [
            { id: 'a', label: 'Le niveau de détail/fiabilité des objets de la maquette' },
            { id: 'b', label: 'La luminosité des rendus' },
            { id: 'c', label: 'Le nombre d\'utilisateurs connectés' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'LOD 100 = volumes conceptuels → LOD 400 = détails de fabrication : on adapte l\'effort au stade du projet.',
        },
        {
          ordre: 5, typeQuestion: 'QCM',
          enonce: 'Pour un métreur, le grand intérêt du BIM est :',
          options: [
            { id: 'a', label: 'Extraire automatiquement des quantités fiables' },
            { id: 'b', label: 'Changer la couleur des murs' },
            { id: 'c', label: 'Supprimer le métré' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Les nomenclatures Revit sortent surfaces et volumes par ouvrage — le métreur vérifie et complète au lieu de tout ressaisir.',
        },
      ],
    },
    {
      slug: 'quiz-excel-avance',
      titre: 'Quiz — Excel BTP avancé',
      description: 'RECHERCHEV, références absolues et formules de devis.',
      type: 'SIMULATION_LOGICIEL',
      profils: ['etudiant-chantier'],
      niveauRequis: 2,
      competences: ['excel-btp'],
      contenus: [
        {
          ordre: 1, typeQuestion: 'QCM',
          enonce: 'La fonction RECHERCHEV sert à :',
          options: [
            { id: 'a', label: 'Chercher une valeur dans la 1re colonne d\'un tableau et renvoyer une colonne associée' },
            { id: 'b', label: 'Vérifier l\'orthographe' },
            { id: 'c', label: 'Dessiner un graphique' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'RECHERCHEV(désignation; bibliothèque_prix; colonne_prix; FAUX) : la base d\'un devis relié à une bibliothèque de prix.',
        },
        {
          ordre: 2, typeQuestion: 'NUMERIQUE',
          enonce: 'Que renvoie =SI(10>5;100;200) ?',
          bonnesReponses: 100, tolerance: 0,
          correctionPedagogique: 'La condition 10>5 est vraie, donc SI renvoie la première valeur : 100.',
        },
        {
          ordre: 3, typeQuestion: 'QCM',
          enonce: '"Figer les volets" permet de :',
          options: [
            { id: 'a', label: 'Garder les lignes d\'en-tête visibles en défilant' },
            { id: 'b', label: 'Verrouiller le fichier par mot de passe' },
            { id: 'c', label: 'Bloquer les formules' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Indispensable sur un DQE de 300 lignes : les en-têtes restent visibles pendant le défilement.',
        },
        {
          ordre: 4, typeQuestion: 'QCM',
          enonce: 'La référence $A$1 dans une formule :',
          options: [
            { id: 'a', label: 'Reste fixe quand on recopie la formule (référence absolue)' },
            { id: 'b', label: 'Change à chaque recopie' },
            { id: 'c', label: 'Provoque une erreur' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Les $ verrouillent ligne et colonne — parfait pour pointer une cellule de taux ou de coefficient unique.',
        },
        {
          ordre: 5, typeQuestion: 'NUMERIQUE',
          enonce: 'Devis : 12 m³ de béton à 65 000 FCFA/m³. Montant total en FCFA ?',
          bonnesReponses: 780000, tolerance: 0,
          correctionPedagogique: '12 × 65 000 = 780 000 FCFA. Dans Excel : =B2*C2 recopié sur toutes les lignes du devis.',
        },
      ],
    },
    {
      slug: 'quiz-msproject',
      titre: 'Quiz — MS Project : piloter le planning',
      description: 'Jalons, liens, Gantt et ligne de base.',
      type: 'SIMULATION_LOGICIEL',
      profils: ['etudiant-chantier'],
      niveauRequis: 3,
      competences: ['decision-chantier'],
      contenus: [
        {
          ordre: 1, typeQuestion: 'QCM',
          enonce: 'Une tâche jalon (milestone) est :',
          options: [
            { id: 'a', label: 'Une tâche de durée nulle qui marque un événement clé' },
            { id: 'b', label: 'La tâche la plus longue du projet' },
            { id: 'c', label: 'Une tâche supprimée' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: '« Réception des travaux », « fin du gros œuvre » : les jalons rythment le projet et se suivent d\'un coup d\'œil.',
        },
        {
          ordre: 2, typeQuestion: 'QCM',
          enonce: 'Un lien fin-début (FS) entre deux tâches signifie :',
          options: [
            { id: 'a', label: 'La seconde commence quand la première se termine' },
            { id: 'b', label: 'Les deux commencent ensemble' },
            { id: 'c', label: 'Les deux finissent ensemble' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'FS est le lien le plus courant : on ne coule pas la dalle avant la fin du ferraillage.',
        },
        {
          ordre: 3, typeQuestion: 'QCM',
          enonce: 'Le diagramme de Gantt affiche :',
          options: [
            { id: 'a', label: 'Les tâches en barres horizontales positionnées dans le temps' },
            { id: 'b', label: 'Le budget en camembert' },
            { id: 'c', label: "L'organigramme de l'équipe" },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Chaque barre = une tâche ; les flèches = les dépendances ; la ligne verticale = la date du jour.',
        },
        {
          ordre: 4, typeQuestion: 'QCM',
          enonce: "Une ressource « surallouée » signifie :",
          options: [
            { id: 'a', label: 'Elle est planifiée au-delà de sa capacité (ex. 16 h/jour)' },
            { id: 'b', label: 'Elle est trop payée' },
            { id: 'c', label: 'Elle a fini son travail en avance' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Une grue ou une équipe ne peut pas être à deux endroits : on lisse ou on re-séquence les tâches.',
        },
        {
          ordre: 5, typeQuestion: 'QCM',
          enonce: 'La ligne de base (baseline) sert à :',
          options: [
            { id: 'a', label: 'Photographier le planning initial pour comparer avec le réel' },
            { id: 'b', label: 'Souligner les titres' },
            { id: 'c', label: 'Supprimer les retards' },
          ],
          bonnesReponses: ['a'],
          correctionPedagogique: 'Sans baseline, impossible de mesurer la dérive : on fige le planning contractuel puis on suit les écarts.',
        },
      ],
    },
  ];

  // Questions supplémentaires fusionnées dans les missions (aucun quiz ne reste à 1-2 questions).
  const questionsSupplementaires: Record<string, ContenuSeed[]> = {
    'acteurs-projet-btp': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Quel est le rôle du bureau de contrôle ?',
        options: [
          { id: 'a', label: "Vérifier la solidité et la sécurité de l'ouvrage" },
          { id: 'b', label: 'Payer les travaux' },
          { id: 'c', label: 'Fournir le ciment' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Le bureau de contrôle est un tiers indépendant qui vérifie la conformité technique (solidité, incendie, accessibilité).",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Le maître d'œuvre est celui qui :",
        options: [
          { id: 'a', label: "Conçoit le projet et dirige l'exécution des travaux" },
          { id: 'b', label: 'Finance le projet' },
          { id: 'c', label: 'Vend le terrain' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Le maître d'œuvre (architecte, BE) conçoit et dirige ; le maître d'ouvrage finance et décide.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "L'entreprise titulaire du marché de travaux :",
        options: [
          { id: 'a', label: 'Exécute les travaux conformément au marché' },
          { id: 'b', label: 'Délivre le permis de construire' },
          { id: 'c', label: 'Contrôle les impôts du chantier' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'entreprise réalise les travaux décrits dans le marché ; le permis relève de l'administration.",
      },
    ],
    'volume-beton-dalle': [
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Dalle de 5 m × 4 m sur 15 cm d\'épaisseur : volume de béton en m³ ?',
        bonnesReponses: 3, tolerance: 0.05,
        correctionPedagogique: '5 × 4 × 0,15 = 3,00 m³. Toujours convertir les cm en m avant de multiplier.',
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Poteau de 25 cm × 25 cm et 3 m de haut : volume en m³ ?',
        bonnesReponses: 0.1875, tolerance: 0.01,
        correctionPedagogique: '0,25 × 0,25 × 3 = 0,1875 m³ — soit environ 0,19 m³ à commander avec la marge.',
      },
    ],
    'casque-refuse': [
      {
        ordre: 0, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: "Un visiteur arrive sur le chantier sans aucun EPI. Que fais-tu ?",
        options: [
          { id: 'a', label: "Je lui fournis casque et gilet avant d'autoriser l'accès" },
          { id: 'b', label: 'Je le laisse passer, il ne reste que 5 minutes' },
          { id: 'c', label: "Je l'ignore, ce n'est pas mon problème" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Aucune exception : toute personne sur chantier porte les EPI. 5 minutes suffisent pour un accident.",
      },
    ],
    'rapport-journalier': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Que doit contenir un rapport journalier de chantier ?',
        options: [
          { id: 'a', label: 'Effectifs, travaux réalisés, incidents, météo' },
          { id: 'b', label: "Les opinions personnelles sur l'équipe" },
          { id: 'c', label: 'Le menu de la cantine' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Des faits datés et chiffrés : le rapport journalier est une pièce contractuelle en cas de litige sur les délais.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'En cas d\'arrêt de chantier pour pluie, on note :',
        options: [
          { id: 'a', label: 'Les heures perdues et les tâches impactées' },
          { id: 'b', label: 'Rien, la pluie ne se note pas' },
          { id: 'c', label: 'Seulement la date' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Les intempéries documentées justifient les prolongations de délai — sans trace écrite, pas de recours.",
      },
    ],
    'excel-calcul-volumes': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Dans Excel, la formule =SOMME(B2:B10) :',
        options: [
          { id: 'a', label: 'Additionne les valeurs de B2 à B10' },
          { id: 'b', label: 'Multiplie B2 par B10' },
          { id: 'c', label: 'Compte les cellules vides' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'SOMME(plage) additionne toute la plage — la formule la plus utilisée des métrés.',
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Que renvoie la formule =2*3*0,2 (volume d\'une semelle en m³) ?',
        bonnesReponses: 1.2, tolerance: 0.01,
        correctionPedagogique: '2 × 3 × 0,2 = 1,2 m³. Excel respecte les priorités de calcul classiques.',
      },
    ],
    'lecture-plan-poteau': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Sur un plan au 1/50, 1 cm mesuré représente :",
        options: [
          { id: 'a', label: '50 cm dans la réalité' },
          { id: 'b', label: '5 m dans la réalité' },
          { id: 'c', label: '50 m dans la réalité' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'échelle 1/50 : les dimensions réelles sont 50 fois plus grandes que sur le papier.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Une coupe AA sur un plan montre :',
        options: [
          { id: 'a', label: "L'ouvrage tranché verticalement selon le trait AA" },
          { id: 'b', label: 'La façade principale' },
          { id: 'c', label: 'La toiture vue du ciel' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La coupe révèle les hauteurs, épaisseurs et niveaux invisibles en vue en plan.',
      },
    ],
    'controle-avant-coulage': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "À quoi servent les cales d'enrobage avant un coulage ?",
        options: [
          { id: 'a', label: 'Garantir la distance entre aciers et coffrage' },
          { id: 'b', label: 'Décorer le ferraillage' },
          { id: 'c', label: 'Alourdir la dalle' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Sans enrobage suffisant, l'acier rouille et le béton éclate : les cales sont obligatoires.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Les aciers sont souillés de terre au moment de couler :',
        options: [
          { id: 'a', label: 'On les nettoie avant le coulage' },
          { id: 'b', label: 'On coule quand même, le béton recouvrira' },
          { id: 'c', label: "On ajoute de l'eau au béton" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "La terre empêche l'adhérence acier-béton, qui est le principe même du béton armé.",
      },
    ],
    'metre-mur-cloture': [
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Mur de 25 m de long et 1,80 m de haut : surface en m² ?',
        bonnesReponses: 45, tolerance: 0.1,
        correctionPedagogique: '25 × 1,80 = 45 m². La surface commande le nombre d\'agglos et le mortier.',
      },
    ],
    'devis-chambre-simple': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Pourquoi ajouter une provision pour imprévus (5-10 %) à un devis ?',
        options: [
          { id: 'a', label: 'Pour absorber les aléas sans perdre d\'argent' },
          { id: 'b', label: 'Pour gonfler artificiellement le prix' },
          { id: 'c', label: "Ce n'est jamais nécessaire" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Casse, reprises, hausses de prix : les aléas existent toujours. Un devis sans provision est un devis à perte.',
      },
    ],
    'quiz-topographie': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Comment s\'appelle une borne de référence altimétrique ?',
        options: [
          { id: 'a', label: 'Un repère de nivellement' },
          { id: 'b', label: 'Un chaînage' },
          { id: 'c', label: 'Un fourreau' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le repère de nivellement (borne NGCI, clou, trait) sert de référence à tous les niveaux du chantier.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Avant d'implanter un bâtiment, on vérifie d'abord :",
        options: [
          { id: 'a', label: "Les limites de propriété et l'alignement" },
          { id: 'b', label: 'La couleur de la façade' },
          { id: 'c', label: 'Le sens du vent' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Construire hors limites ou hors alignement = démolition possible. On vérifie bornes et documents d'urbanisme.",
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Lecture arrière 1,45 m, lecture avant 0,95 m : quel est le dénivelé en m ?',
        bonnesReponses: 0.5, tolerance: 0.01,
        correctionPedagogique: 'Dénivelé = lecture arrière − lecture avant = 1,45 − 0,95 = +0,50 m (le point avant est plus haut).',
      },
    ],
    'quiz-geotechnique': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le rapport géotechnique fournit notamment :',
        options: [
          { id: 'a', label: 'La contrainte admissible du sol' },
          { id: 'b', label: 'Le prix du ciment' },
          { id: 'c', label: 'La météo du mois' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "La contrainte admissible (ex. 2 bars) dimensionne les semelles : c'est LA donnée d'entrée des fondations.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Fonder sur un remblai récent non compacté :',
        options: [
          { id: 'a', label: 'Est à éviter, ou exige un traitement préalable' },
          { id: 'b', label: 'Est idéal, le sol est meuble' },
          { id: 'c', label: 'Équivaut à fonder sur de la roche' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Un remblai non compacté tasse pendant des années : fissures garanties. On purge, compacte ou fonde plus profond.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Une nappe phréatique haute impose :',
        options: [
          { id: 'a', label: 'Pompage/drainage et précautions en fouille' },
          { id: 'b', label: 'Rien de particulier' },
          { id: 'c', label: 'De creuser plus vite avant que l\'eau arrive' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'eau déstabilise les fouilles et agresse les bétons : rabattement de nappe, blindage et béton adapté.",
      },
    ],
    'quiz-controle-qualite': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Les éprouvettes de béton sont généralement écrasées à :',
        options: [
          { id: 'a', label: '7 et 28 jours' },
          { id: 'b', label: '1 jour' },
          { id: 'c', label: '1 an' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "7 jours donne une tendance (~70 % de la résistance), 28 jours la valeur contractuelle.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'À la réception du ferraillage, on vérifie :',
        options: [
          { id: 'a', label: 'Diamètres, nombre, espacements et enrobages' },
          { id: 'b', label: 'La marque de peinture des aciers' },
          { id: 'c', label: 'Uniquement le poids du camion' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'On contrôle la conformité au plan de ferraillage : diamètres, quantités, positions, recouvrements, enrobages.',
      },
      {
        ordre: 0, typeQuestion: 'ORDONNANCEMENT',
        enonce: 'Remets dans l\'ordre le traitement d\'une non-conformité :',
        options: [
          { id: 'a', label: 'Détecter le défaut' },
          { id: 'b', label: 'Tracer sur une fiche NC' },
          { id: 'c', label: 'Corriger' },
          { id: 'd', label: 'Vérifier la correction' },
        ],
        bonnesReponses: ['a', 'b', 'c', 'd'],
        correctionPedagogique: 'Détecter → tracer → corriger → vérifier : sans traçabilité ni vérification, la qualité ne progresse pas.',
      },
    ],
    'quiz-reception-travaux': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'La garantie décennale couvre :',
        options: [
          { id: 'a', label: "La solidité de l'ouvrage pendant 10 ans" },
          { id: 'b', label: 'Les retouches de peinture' },
          { id: 'c', label: "L'entretien courant du bâtiment" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La décennale vise les dommages compromettant la solidité ou rendant l\'ouvrage impropre à sa destination.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Les OPR (opérations préalables à la réception) servent à :',
        options: [
          { id: 'a', label: 'Lister défauts et finitions avant la réception' },
          { id: 'b', label: 'Signer le marché de travaux' },
          { id: 'c', label: 'Commander le béton' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les OPR préparent une réception propre : on détecte et corrige avant, plutôt que d\'accumuler les réserves.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Qui prononce la réception des travaux ?',
        options: [
          { id: 'a', label: "Le maître d'ouvrage" },
          { id: 'b', label: "L'ouvrier le plus ancien" },
          { id: 'c', label: 'Le fournisseur de matériaux' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "La réception est un acte du maître d'ouvrage, généralement assisté du maître d'œuvre.",
      },
    ],
    'quiz-planification': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "La marge libre d'une tâche correspond à :",
        options: [
          { id: 'a', label: 'Son retard possible sans décaler la tâche suivante' },
          { id: 'b', label: 'Son budget restant' },
          { id: 'c', label: 'Sa pause déjeuner' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La marge libre absorbe les aléas localement ; la marge totale protège la date de fin du projet.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Un retard météo sur une tâche NON critique :',
        options: [
          { id: 'a', label: 'Consomme sa marge sans décaler la livraison' },
          { id: 'b', label: 'Décale toujours la date de fin' },
          { id: 'c', label: 'Annule le chantier' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Tant que le retard reste inférieur à la marge, la fin de chantier est préservée — d'où l'importance de suivre les marges.",
      },
    ],
    'quiz-materiaux': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'La classe 42,5 d\'un ciment indique :',
        options: [
          { id: 'a', label: 'Sa résistance normalisée à 28 jours (MPa)' },
          { id: 'b', label: 'Son poids par sac' },
          { id: 'c', label: 'Sa couleur' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: '32,5 / 42,5 / 52,5 : classes de résistance à 28 jours. Plus la classe est haute, plus la montée en résistance est rapide.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le sable destiné au béton doit être :',
        options: [
          { id: 'a', label: 'Propre, sans argile ni matières organiques' },
          { id: 'b', label: 'Du sable de mer non lavé' },
          { id: 'c', label: "N'importe lequel, ça ne change rien" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Argile et sels réduisent l'adhérence et corrodent les aciers — le sable de mer non lavé est proscrit.",
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Béton dosé à 350 kg/m³ : combien de sacs de 50 kg pour 1 m³ ?',
        bonnesReponses: 7, tolerance: 0,
        correctionPedagogique: '350 ÷ 50 = 7 sacs de ciment par m³ de béton.',
      },
    ],
    'quiz-coffrage': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "L'huile de décoffrage sert à :",
        options: [
          { id: 'a', label: 'Faciliter le démoulage sans arracher le parement' },
          { id: 'b', label: 'Accélérer la prise du béton' },
          { id: 'c', label: 'Colorer le béton' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Appliquée en fine couche avant ferraillage, elle protège coffrage et parement. Jamais sur les aciers !",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'La poussée du béton frais sur un coffrage vertical est maximale :',
        options: [
          { id: 'a', label: 'En pied de voile' },
          { id: 'b', label: 'En tête de voile' },
          { id: 'c', label: 'Elle est nulle partout' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La pression hydrostatique croît avec la profondeur : le bas du coffrage encaisse le plus — d\'où les serrages renforcés en pied.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Avant de couler, on vérifie sur le coffrage :',
        options: [
          { id: 'a', label: 'Étanchéité, stabilité, propreté et géométrie' },
          { id: 'b', label: 'Seulement la couleur des panneaux' },
          { id: 'c', label: "Rien si l'équipe est pressée" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Fuite de laitance, coffrage qui bouge ou cote fausse = reprise coûteuse. La check-list avant coulage est systématique.',
      },
    ],
    'quiz-vrd': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Un regard de visite se place :',
        options: [
          { id: 'a', label: 'Aux changements de direction et de pente' },
          { id: 'b', label: "N'importe où, au hasard" },
          { id: 'c', label: 'Uniquement en fin de réseau' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les regards permettent inspection et curage : on les place aux changements de direction, de pente et aux jonctions.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'EU et EP désignent :',
        options: [
          { id: 'a', label: 'Eaux usées et eaux pluviales' },
          { id: 'b', label: 'Eau urbaine et eau potable' },
          { id: 'c', label: 'Électricité urbaine et éclairage public' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Réseaux séparatifs : les EU partent en traitement, les EP vers le milieu naturel — ne jamais les croiser.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le grillage avertisseur se pose :',
        options: [
          { id: 'a', label: 'Au-dessus des réseaux enterrés, à ~30 cm' },
          { id: 'b', label: 'Sous les canalisations' },
          { id: 'c', label: 'Sur la clôture du chantier' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Chaque couleur signale un réseau (rouge = élec, bleu = eau…) : le terrassier est prévenu avant de toucher la conduite.',
      },
    ],
  };

  // Seconde vague : toutes les missions atteignent 4-5 questions minimum.
  const questionsVague2: Record<string, ContenuSeed[]> = {
    'dangers-sur-photo': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Une tranchée de 1,60 m de profondeur non blindée :',
        options: [
          { id: 'a', label: 'Est interdite : blindage ou talutage obligatoire au-delà de 1,30 m' },
          { id: 'b', label: 'Est acceptable si on fait vite' },
          { id: 'c', label: 'Ne présente aucun risque en sol argileux' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Un éboulement de tranchée ensevelit un homme en 2 secondes. Blindage, talutage ou caisson dès 1,30 m.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Une élingue de levage présente des torons coupés :",
        options: [
          { id: 'a', label: 'On la met immédiatement au rebut' },
          { id: 'b', label: 'On la garde pour les charges légères' },
          { id: 'c', label: 'On la répare avec du ruban adhésif' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Une élingue endommagée peut céder sans prévenir : rebut immédiat et remplacement, sans exception.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'La zone de rotation de la grue au-dessus du poste de ferraillage :',
        options: [
          { id: 'a', label: 'Impose de ne jamais faire passer une charge au-dessus des personnes' },
          { id: 'b', label: 'Est sans danger si le grutier est expérimenté' },
          { id: 'c', label: 'Ne concerne que les visiteurs' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le survol de personnel par une charge est proscrit : on organise les rotations et on balise les zones.',
      },
      {
        ordre: 0, typeQuestion: 'ORDONNANCEMENT',
        enonce: 'Tu découvres un danger grave et imminent. Remets tes actions dans le bon ordre :',
        options: [
          { id: 'a', label: 'Faire évacuer la zone' },
          { id: 'b', label: 'Alerter le chef de chantier' },
          { id: 'c', label: 'Baliser la zone dangereuse' },
          { id: 'd', label: 'Participer à la mise en sécurité' },
        ],
        bonnesReponses: ['a', 'b', 'c', 'd'],
        correctionPedagogique: "D'abord protéger les personnes (évacuer), puis alerter, baliser et sécuriser. Les personnes avant tout le reste.",
      },
    ],
    'vocabulaire-chantier': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le "gros œuvre" désigne :',
        options: [
          { id: 'a', label: 'La structure porteuse : fondations, murs, planchers, charpente' },
          { id: 'b', label: 'Les finitions : peinture, carrelage' },
          { id: 'c', label: 'Le mobilier de bureau' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Gros œuvre = ce qui porte le bâtiment. Second œuvre = ce qui le rend habitable (cloisons, électricité, finitions).',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Une "arase" est :',
        options: [
          { id: 'a', label: 'Un niveau horizontal de référence sur lequel on vient poser' },
          { id: 'b', label: 'Un outil de terrassement' },
          { id: 'c', label: 'Une fissure du béton' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'arase (d'un mur, d'une fondation) est la surface horizontale calée à un niveau précis pour recevoir la suite.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le "ferraillage" désigne :',
        options: [
          { id: 'a', label: "L'ensemble des armatures en acier noyées dans le béton" },
          { id: 'b', label: 'La clôture du chantier' },
          { id: 'c', label: 'Les outils du maçon' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les armatures (cadres, filants, treillis) reprennent la traction que le béton seul ne supporte pas.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Un "voile" en béton armé est :',
        options: [
          { id: 'a', label: 'Un mur porteur en béton banché' },
          { id: 'b', label: 'Une bâche de protection' },
          { id: 'c', label: 'Un type de peinture' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le voile est un mur en béton coulé entre banches — porteur et souvent de contreventement.',
      },
    ],
    'premier-jour-stage': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "En arrivant sur le chantier le premier jour, ta priorité est :",
        options: [
          { id: 'a', label: "L'accueil sécurité : consignes, EPI, zones interdites" },
          { id: 'b', label: 'Prendre des photos pour les réseaux sociaux' },
          { id: 'c', label: 'Montrer que tu sais déjà tout' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Tout nouvel arrivant passe par l'accueil sécurité avant de circuler : c'est obligatoire et vital.",
      },
      {
        ordre: 0, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: 'Le chef te confie une tâche que tu ne comprends pas complètement :',
        options: [
          { id: 'a', label: 'Tu fais répéter et reformules pour valider ta compréhension' },
          { id: 'b', label: 'Tu improvises pour ne pas déranger' },
          { id: 'c', label: 'Tu attends sans rien faire' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Reformuler n'est pas une faiblesse : mal comprendre une consigne coûte bien plus cher qu'une question.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le carnet de notes du stagiaire sert à :',
        options: [
          { id: 'a', label: 'Noter vocabulaire, consignes, observations et questions' },
          { id: 'b', label: 'Dessiner pendant les réunions' },
          { id: 'c', label: 'Rien, la mémoire suffit' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le carnet est ton premier outil professionnel : il nourrit tes rapports et montre ton sérieux.',
      },
    ],
    'rapport-journalier-coulage': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Dans le rapport du jour de coulage, il faut absolument tracer :',
        options: [
          { id: 'a', label: 'Volume coulé, heure, météo, essais réalisés, incidents' },
          { id: 'b', label: "L'ambiance de l'équipe" },
          { id: 'c', label: 'Le score du match de la veille' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le coulage est un événement contractuel : volumes, heures et essais font foi en cas de litige qualité.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le camion-toupie est arrivé avec 45 minutes de retard. Dans le rapport :',
        options: [
          { id: 'a', label: "On note l'heure d'arrivée réelle et l'impact sur le coulage" },
          { id: 'b', label: 'On arrondit pour ne fâcher personne' },
          { id: 'c', label: 'On ne mentionne pas les problèmes' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les faits, même désagréables, se tracent : le rapport protège le chantier ET les personnes.',
      },
      {
        ordre: 0, typeQuestion: 'TEXTE',
        enonce: "Rédige en une phrase l'entrée de rapport pour : coulage dalle 12 m³, fin à 16h30, slump conforme.",
        bonnesReponses: ['dalle', '12'],
        correctionPedagogique: 'Exemple : « Coulage de la dalle (12 m³) achevé à 16h30, slump test conforme, aucune réserve. » Court, daté, factuel.',
      },
    ],
    'types-de-sols': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Un sol sableux se reconnaît car :',
        options: [
          { id: 'a', label: 'Il est granuleux et ne colle pas quand il est humide' },
          { id: 'b', label: 'Il colle aux bottes et se roule en boudin' },
          { id: 'c', label: 'Il est toujours noir' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Test de terrain : l'argile humide se roule en boudin, le sable s'effrite. Simple et fiable en première approche.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'La latérite, fréquente en Côte d\'Ivoire, est :',
        options: [
          { id: 'a', label: 'Un sol rouge riche en fer, bon en remblai routier une fois compacté' },
          { id: 'b', label: 'Une roche importée d\'Europe' },
          { id: 'c', label: 'Un type de ciment' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La latérite compactée sert de couche de forme pour pistes et plateformes — un matériau local précieux.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Quel sol est le plus risqué pour fonder sans étude ?',
        options: [
          { id: 'a', label: 'Une argile gonflante en zone alternant pluie et sécheresse' },
          { id: 'b', label: 'Un rocher sain' },
          { id: 'c', label: 'Une grave compactée contrôlée' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'argile gonflante bouge avec l'humidité : fissures en escalier garanties sans précautions adaptées.",
      },
    ],
    'implantation-topo': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Les chaises d\'implantation se placent :',
        options: [
          { id: 'a', label: 'En retrait des fouilles, pour survivre au terrassement' },
          { id: 'b', label: "Exactement à l'emplacement des murs" },
          { id: 'c', label: "N'importe où sur le terrain" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'En retrait, les chaises conservent les axes pendant tout le terrassement : on retend les cordeaux à chaque besoin.',
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Équerre 3-4-5 agrandie : côtés 6 m et 8 m, diagonale attendue en m ?',
        bonnesReponses: 10, tolerance: 0.01,
        correctionPedagogique: '6-8-10 est le triangle 3-4-5 doublé : plus les côtés sont grands, plus le contrôle est précis.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Après l'implantation, la vérification finale consiste à :",
        options: [
          { id: 'a', label: 'Contrôler les diagonales du bâtiment (elles doivent être égales)' },
          { id: 'b', label: 'Prendre une photo' },
          { id: 'c', label: 'Commencer à creuser immédiatement' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Des diagonales égales garantissent la rectangularité : le contrôle ultime avant de creuser.',
      },
    ],
    'retard-livraison-beton': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Passé quel délai après le malaxage un béton prêt à l\'emploi est-il refusé ?',
        options: [
          { id: 'a', label: 'Environ 2 heures (selon température et adjuvants)' },
          { id: 'b', label: '24 heures' },
          { id: 'c', label: 'Il ne périme jamais' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Au-delà de ~2 h la prise a commencé : couler ce béton = résistance non garantie. Rajouter de l\'eau est interdit.',
      },
      {
        ordre: 0, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: 'Le chauffeur propose de "rajouter un peu d\'eau" pour rattraper la maniabilité perdue :',
        options: [
          { id: 'a', label: 'Refus : l\'ajout d\'eau non contrôlé ruine la résistance' },
          { id: 'b', label: "D'accord, ça facilitera la mise en œuvre" },
          { id: 'c', label: 'Peu importe, on est pressés' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Chaque litre d'eau en plus fait chuter la résistance. Seul un adjuvant fluidifiant dosé par la centrale est acceptable.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Pour éviter que le retard ne se reproduise, tu :',
        options: [
          { id: 'a', label: 'Confirmes la commande la veille et cales un créneau avec la centrale' },
          { id: 'b', label: 'Cries sur le chauffeur' },
          { id: 'c', label: 'Changes de métier' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "La logistique s'anticipe : confirmation la veille, créneau précis, itinéraire, et plan B pour les coulages critiques.",
      },
    ],
    'reception-ferraillage': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le recouvrement entre deux barres d\'acier sert à :',
        options: [
          { id: 'a', label: "Transmettre l'effort d'une barre à l'autre (continuité)" },
          { id: 'b', label: 'Faire joli' },
          { id: 'c', label: 'Économiser du béton' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Le recouvrement (souvent 40 à 50 fois le diamètre) assure la continuité mécanique des armatures.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Tu constates HA10 posés là où le plan exige HA12 :',
        options: [
          { id: 'a', label: 'Arrêt du coulage et signalement : non-conformité structurelle' },
          { id: 'b', label: 'On coule, 2 mm ne changent rien' },
          { id: 'c', label: 'On rajoute du béton pour compenser' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'HA10 vs HA12 = 30 % de section en moins : c\'est la solidité qui est en jeu. On ne coule jamais sur un doute structurel.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Les attaches (ligatures) des armatures servent à :',
        options: [
          { id: 'a', label: 'Maintenir la géométrie de la cage pendant le coulage' },
          { id: 'b', label: 'Renforcer la résistance finale du béton' },
          { id: 'c', label: 'Décorer la cage' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les ligatures ne travaillent pas structurellement : elles maintiennent les positions pendant le bétonnage.',
      },
    ],
    'chantier-villa-cocody-etape1': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Avant de couler la dalle de la villa, la check-list minimale comprend :',
        options: [
          { id: 'a', label: 'Coffrage, ferraillage, réservations, essais béton, météo, équipe' },
          { id: 'b', label: 'Uniquement la présence du camion' },
          { id: 'c', label: "L'accord du voisin" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Un coulage se prépare comme un décollage : check-list complète, car il n\'y a pas de retour en arrière.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Les "réservations" à vérifier avant coulage sont :',
        options: [
          { id: 'a', label: 'Les trous et fourreaux prévus pour les réseaux (plomberie, élec)' },
          { id: 'b', label: 'Les places de parking' },
          { id: 'c', label: 'Les commandes de matériaux' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Une réservation oubliée = carottage dans le béton armé, avec risque de couper un acier. On vérifie AVANT.',
      },
      {
        ordre: 0, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: "Il est 15h, le ciel se couvre sérieusement, il reste 8 m³ à couler :",
        options: [
          { id: 'a', label: 'Tu prépares bâches et arrêt propre au joint prévu' },
          { id: 'b', label: 'Tu continues sans rien préparer, il ne pleuvra pas' },
          { id: 'c', label: "Tu arrêtes tout immédiatement n'importe où" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Anticiper : protéger la surface fraîche et prévoir un arrêt de bétonnage à un joint acceptable, jamais n'importe où.",
      },
    ],
    'pv-reception-travaux': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le PV de réception doit mentionner :',
        options: [
          { id: 'a', label: 'Date, parties présentes, décision (avec/sans réserves), liste des réserves' },
          { id: 'b', label: 'Seulement une signature' },
          { id: 'c', label: 'Le montant des salaires' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le PV est l\'acte juridique : sans date ni liste précise des réserves, il est inexploitable en cas de litige.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Une porte qui frotte et une peinture griffée constatées à la réception sont :',
        options: [
          { id: 'a', label: 'Des réserves mineures à lister et corriger' },
          { id: 'b', label: 'Un motif de refus total de réception' },
          { id: 'c', label: 'À ignorer poliment' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les défauts mineurs n\'empêchent pas la réception : ils deviennent des réserves à lever dans le délai convenu.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Un défaut structurel majeur découvert à la réception (fissure traversante) justifie :",
        options: [
          { id: 'a', label: 'Le refus de réception jusqu\'à expertise et reprise' },
          { id: 'b', label: 'Une simple réserve cosmétique' },
          { id: 'c', label: 'Un rabais sur la facture et on oublie' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Quand la solidité est en cause, on ne réceptionne pas : expertise, responsabilités et reprise d'abord.",
      },
    ],
    'examen-conducteur-travaux': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Ta réunion de chantier hebdomadaire doit produire :',
        options: [
          { id: 'a', label: 'Un compte-rendu diffusé : décisions, actions, responsables, délais' },
          { id: 'b', label: 'Une discussion sans trace' },
          { id: 'c', label: 'Un simple café entre collègues' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Sans compte-rendu, pas d\'engagement : chaque action a un responsable et une échéance tracés.',
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Budget chantier 45 000 000 FCFA, dépensé à 60 % pour un avancement de 50 %. Combien de FCFA déjà dépensés ?',
        bonnesReponses: 27000000, tolerance: 1000,
        correctionPedagogique: '45 000 000 × 0,60 = 27 000 000 FCFA. Dépenser 60 % pour 50 % d\'avancement = dérive de 10 points à corriger vite.',
      },
      {
        ordre: 0, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: "Le client exige un changement majeur en cours de chantier (agrandir le salon) :",
        options: [
          { id: 'a', label: 'Avenant écrit : impact chiffré sur coût et délai avant exécution' },
          { id: 'b', label: 'Tu exécutes sur simple parole pour lui faire plaisir' },
          { id: 'c', label: 'Tu refuses sans discussion' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Toute modification passe par un avenant signé : sans écrit, l'entreprise porte seule le surcoût et le retard.",
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le trio que tu pilotes en permanence comme conducteur de travaux :',
        options: [
          { id: 'a', label: 'Coût, délai, qualité (avec la sécurité au-dessus de tout)' },
          { id: 'b', label: 'Salaires, congés, cantine' },
          { id: 'c', label: 'Plans, béton, camions' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le triangle coût-délai-qualité structure chaque décision — et la sécurité est la contrainte non négociable au-dessus.',
      },
    ],
    'lecture-plan-poteau': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'La nomenclature d\'armatures d\'un plan de ferraillage donne :',
        options: [
          { id: 'a', label: 'Repère, diamètre, forme, longueur et nombre de chaque acier' },
          { id: 'b', label: 'Le prix du kilogramme d\'acier' },
          { id: 'c', label: 'Le nom du dessinateur uniquement' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'La nomenclature permet de commander et façonner les aciers sans interpréter le dessin.',
      },
    ],
    'volume-beton-dalle': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Pourquoi commander 3,2 m³ pour un volume théorique de 3,0 m³ ?',
        options: [
          { id: 'a', label: 'Pertes, surépaisseurs et fond de toupie : ~5-10 % de marge' },
          { id: 'b', label: 'Pour le plaisir de payer plus' },
          { id: 'c', label: 'Le béton rétrécit à la livraison' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Manquer de béton en fin de coulage crée un joint imprévu : la marge de 5-10 % est une assurance bon marché.',
      },
    ],
    'excel-calcul-volumes': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Pour recopier une formule sur 50 lignes de métré, tu utilises :',
        options: [
          { id: 'a', label: 'La poignée de recopie (double-clic sur le coin de la cellule)' },
          { id: 'b', label: 'La ressaisie manuelle 50 fois' },
          { id: 'c', label: 'Une capture d\'écran' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Le double-clic sur la poignée recopie jusqu\'en bas du tableau : rapide et sans erreur de saisie.',
      },
    ],
    'metre-mur-cloture': [
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'À 10 agglos par m², combien d\'agglos pour 45 m² de mur (sans marge) ?',
        bonnesReponses: 450, tolerance: 0,
        correctionPedagogique: '45 × 10 = 450 agglos — auxquels on ajoutera ~5 % de casse à la commande.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Dans un métré, on déduit généralement :',
        options: [
          { id: 'a', label: 'Les ouvertures (portes, fenêtres) au-delà du seuil convenu' },
          { id: 'b', label: 'Rien, on compte tout plein' },
          { id: 'c', label: 'La moitié du mur au hasard' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les règles de métré précisent les déductions d\'ouvertures — les connaître évite les litiges de facturation.',
      },
    ],
    'devis-chambre-simple': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: 'Le prix unitaire "pose de carrelage : 4 500 FCFA/m²" comprend :',
        options: [
          { id: 'a', label: 'Main-d\'œuvre, colle, frais et marge (selon décomposition)' },
          { id: 'b', label: 'Seulement le carreau' },
          { id: 'c', label: 'Le transport du client' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Un prix unitaire est un tout : fourniture et/ou pose selon le libellé — toujours lire la décomposition.',
      },
      {
        ordre: 0, typeQuestion: 'NUMERIQUE',
        enonce: 'Devis HT de 2 000 000 FCFA, TVA 18 % : montant TTC en FCFA ?',
        bonnesReponses: 2360000, tolerance: 100,
        correctionPedagogique: '2 000 000 × 1,18 = 2 360 000 FCFA TTC — la TVA ivoirienne standard est de 18 %.',
      },
    ],
    'casque-refuse': [
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Un ouvrier expérimenté refuse le harnais « parce qu'il a l'habitude » :",
        options: [
          { id: 'a', label: "L'expérience ne protège pas de la chute : harnais ou pas de travail en hauteur" },
          { id: 'b', label: 'Son expérience le dispense des règles' },
          { id: 'c', label: 'On négocie un demi-harnais' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: 'Les accidents touchent aussi (surtout) les habitués : la règle est la même pour tous, sans ancienneté qui tienne.',
      },
      {
        ordre: 0, typeQuestion: 'QCM',
        enonce: "Après l'incident, la bonne pratique managériale est :",
        options: [
          { id: 'a', label: 'Un rappel collectif des règles au briefing, sans humilier personne' },
          { id: 'b', label: "Une punition publique pour l'exemple" },
          { id: 'c', label: 'Oublier l\'incident' },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "On traite l'individu en privé et on renforce la règle en collectif : fermeté sur les règles, respect des personnes.",
      },
    ],
  };
  for (const [slug, contenus] of Object.entries(questionsVague2)) {
    questionsSupplementaires[slug] = [...(questionsSupplementaires[slug] ?? []), ...contenus];
  }

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
  type BlocSeed = { type: 'texte' | 'exemple' | 'astuce' | 'attention' | 'objectifs' | 'retenir' | 'schema' | 'logiciel'; valeur: string };
  type CoursSeed = { titre: string; dureeMin: number; blocs: BlocSeed[]; missionPratique?: string };
  type ModuleSeed = { slug: string; titre: string; domaine: string; ordre: number; competence: string; cours: CoursSeed[] };

  const modulesAcademie: ModuleSeed[] = [
    {
      slug: 'introduction-btp', titre: 'Introduction au BTP', domaine: 'general', ordre: 1, competence: 'bases-btp',
      cours: [
        {
          titre: 'Le monde du BTP et ses acteurs', dureeMin: 10, missionPratique: 'acteurs-projet-btp',
          blocs: [
            { type: 'texte', valeur: "Le BTP (Bâtiment et Travaux Publics) regroupe la construction de bâtiments (logements, écoles, bureaux) et les infrastructures (routes, ponts, réseaux). Un projet fait intervenir : le maître d'ouvrage (celui qui commande et paie), le maître d'œuvre (celui qui conçoit et dirige), les entreprises (celles qui exécutent), le bureau de contrôle et le coordonnateur sécurité." },
            { type: 'exemple', valeur: "Pour la construction d'une école à Abidjan : le ministère est maître d'ouvrage, le cabinet d'architecture maître d'œuvre, l'entreprise générale exécute, et le bureau de contrôle vérifie la solidité." },
            { type: 'astuce', valeur: "Retiens : « celui qui paie » (ouvrage) ≠ « celui qui conçoit » (œuvre). La confusion entre les deux est l'erreur n°1 des débutants." },
          ],
        },
        {
          titre: "Le cycle de vie d'un projet", dureeMin: 8,
          blocs: [
            { type: 'texte', valeur: "Un projet suit toujours le même chemin : études de faisabilité → conception (esquisse, avant-projet, projet) → consultation des entreprises → travaux → réception → exploitation/maintenance. Chaque phase produit des documents précis (plans, devis, marchés, PV)." },
            { type: 'attention', valeur: "Plus une erreur est détectée tard, plus elle coûte cher : une erreur de conception corrigée en phase travaux peut coûter 100 fois plus." },
          ],
        },
      ],
    },
    {
      slug: 'securite-chantier', titre: 'Sécurité chantier (HSE)', domaine: 'hse', ordre: 2, competence: 'securite-n1',
      cours: [
        {
          titre: 'Les EPI et les 9 principes de prévention', dureeMin: 12, missionPratique: 'dangers-sur-photo',
          blocs: [
            { type: 'texte', valeur: "Les Équipements de Protection Individuelle (casque, chaussures de sécurité, gilet, gants, lunettes, harnais…) sont la dernière barrière quand le risque n'a pas pu être supprimé. La prévention suit une hiérarchie : éviter le risque > évaluer > combattre à la source > adapter le travail > protection collective > protection individuelle > formation." },
            { type: 'exemple', valeur: "Travail en hauteur sur une dalle : d'abord garde-corps (protection collective), et seulement si impossible, harnais avec point d'ancrage (protection individuelle)." },
            { type: 'attention', valeur: "Un casque a une date de péremption (généralement 3 à 5 ans) et doit être remplacé après tout choc important, même sans fissure visible." },
          ],
        },
        {
          titre: 'Risques majeurs du chantier', dureeMin: 10,
          blocs: [
            { type: 'texte', valeur: "Les 4 tueurs du BTP : chutes de hauteur, engins de chantier (écrasement, renversement), effondrements de tranchées et électrocution. Chaque zone à risque doit être balisée, chaque tranchée de plus de 1,30 m blindée ou talutée." },
            { type: 'astuce', valeur: "Avant chaque tâche, prends 2 minutes pour te demander : « Qu'est-ce qui peut me blesser ici, et qu'est-ce que j'ai prévu contre ça ? » C'est le réflexe pré-task." },
          ],
        },
      ],
    },
    {
      slug: 'lecture-de-plans', titre: 'Lecture de plans', domaine: 'technique', ordre: 3, competence: 'lecture-plans',
      cours: [
        {
          titre: 'Échelles, cotations et symboles', dureeMin: 12, missionPratique: 'lecture-plan-poteau',
          blocs: [
            { type: 'texte', valeur: "Un plan au 1/50 signifie que 1 cm sur le papier représente 50 cm en réalité. Les cotes sont toujours en centimètres (plans archi) ou en mètres (plans VRD). On lit un dossier dans l'ordre : plan de situation → plan de masse → plans de niveaux → coupes → détails." },
            { type: 'exemple', valeur: "Sur un plan au 1/50, un mur mesuré à 6 cm sur papier fait en réalité 6 × 50 = 300 cm = 3,00 m." },
            { type: 'astuce', valeur: "Vérifie toujours l'échelle ET la date de révision du plan. Travailler sur un plan périmé est une cause classique de démolition-reconstruction." },
          ],
        },
        {
          titre: 'Plans de coffrage et de ferraillage', dureeMin: 12,
          blocs: [
            { type: 'texte', valeur: "Le plan de coffrage vu de dessus montre les éléments porteurs (poteaux, poutres, voiles, dalles) avec leurs dimensions. Le plan de ferraillage détaille les aciers : diamètre (HA8, HA10, HA12…), nombre, espacement et recouvrements." },
            { type: 'attention', valeur: "Le repère d'un poteau (ex. P3) doit correspondre entre le plan de coffrage, le plan de ferraillage et la nomenclature — toute incohérence se signale au bureau d'études AVANT de couler." },
          ],
        },
      ],
    },
    {
      slug: 'beton-et-ferraillage', titre: 'Béton et ferraillage', domaine: 'technique', ordre: 4, competence: 'beton-ferraillage',
      cours: [
        {
          titre: 'Composition et dosage du béton', dureeMin: 12, missionPratique: 'volume-beton-dalle',
          blocs: [
            { type: 'texte', valeur: "Le béton = ciment + sable + gravier + eau. Le dosage courant pour du béton de structure est 350 kg de ciment/m³. Trop d'eau = béton faible ; pas assez = béton non maniable. Le rapport eau/ciment est le facteur clé de la résistance." },
            { type: 'exemple', valeur: "Pour 1 m³ de béton dosé à 350 kg : environ 7 sacs de ciment de 50 kg, 400 L de sable, 800 L de gravier et 175 L d'eau (à ajuster selon l'humidité du sable)." },
            { type: 'astuce', valeur: "Règle de chantier : si le béton « brille » beaucoup dans la brouette, il y a probablement trop d'eau." },
          ],
        },
        {
          titre: "Le rôle des armatures", dureeMin: 10, missionPratique: 'controle-avant-coulage',
          blocs: [
            { type: 'texte', valeur: "Le béton résiste très bien à la compression mais mal à la traction : l'acier reprend les efforts de traction. L'enrobage (distance acier-surface) protège l'acier de la corrosion : 3 cm en extérieur, 5 cm en milieu agressif (bord de mer)." },
            { type: 'attention', valeur: "Des aciers qui touchent le fond du coffrage rouilleront : les cales d'enrobage ne sont pas optionnelles." },
          ],
        },
      ],
    },
    {
      slug: 'maconnerie-fondations', titre: 'Maçonnerie et fondations', domaine: 'technique', ordre: 5, competence: 'maconnerie',
      cours: [
        {
          titre: 'Fondations : transmettre les charges au sol', dureeMin: 12, missionPratique: 'quiz-materiaux',
          blocs: [
            { type: 'texte', valeur: "La fondation transmet le poids du bâtiment au sol. Selon la qualité du sol : semelles filantes (murs), semelles isolées (poteaux), radier (sol médiocre), pieux (sol profond). La profondeur hors-gel et l'assise sur le bon sol sont vérifiées en fond de fouille." },
            { type: 'exemple', valeur: "Pour une maison R+1 sur bon sol à Abidjan : semelles filantes de 50-60 cm de large, ancrées à 60-80 cm, avec béton de propreté de 5 cm." },
          ],
        },
        {
          titre: 'Monter un mur en agglos', dureeMin: 10,
          blocs: [
            { type: 'texte', valeur: "Les rangs se posent à joints décalés (appareillage), au cordeau, avec vérification du niveau et de l'aplomb tous les 2-3 rangs. Les chaînages verticaux et horizontaux (béton armé) solidarisent la maçonnerie — obligatoires en zone sismique." },
            { type: 'astuce', valeur: "Un mur qui « danse » au cordeau se corrige au rang suivant, jamais en tapant sur un mur dont le mortier a commencé sa prise." },
          ],
        },
      ],
    },
    {
      slug: 'metre-et-devis', titre: 'Métré et devis', domaine: 'gestion', ordre: 6, competence: 'metre-devis',
      cours: [
        {
          titre: 'Du plan aux quantités', dureeMin: 12, missionPratique: 'metre-mur-cloture',
          blocs: [
            { type: 'texte', valeur: "Le métré consiste à calculer les quantités d'ouvrage depuis les plans : surfaces (m²), volumes (m³), longueurs (ml), unités (u). Chaque quantité s'obtient méthodiquement : on liste, on mesure, on calcule, on vérifie l'ordre de grandeur." },
            { type: 'exemple', valeur: "Mur de clôture de 30 m de long, 2 m de haut, en agglos de 15 : surface = 60 m². À 10 agglos/m², il faut environ 600 agglos (+ 5 % de casse)." },
            { type: 'astuce', valeur: "Toujours vérifier l'ordre de grandeur : un devis de villa qui sort à 3 millions ou 300 millions de FCFA doit immédiatement éveiller le doute." },
          ],
        },
        {
          titre: 'Construire un devis avec la bibliothèque de prix', dureeMin: 12, missionPratique: 'devis-chambre-simple',
          blocs: [
            { type: 'texte', valeur: "Devis = quantités × prix unitaires. Le prix unitaire inclut fournitures, main-d'œuvre, matériel et frais généraux + marge. En Côte d'Ivoire, on raisonne en FCFA avec les prix du marché local (ciment, fer, agglos, main-d'œuvre journalière)." },
            { type: 'attention', valeur: "Un devis sans provision pour imprévus (5-10 %) est un devis qui perdra de l'argent." },
          ],
        },
      ],
    },
    {
      slug: 'logiciels-btp', titre: 'Logiciels BTP', domaine: 'logiciel', ordre: 7, competence: 'excel-btp',
      cours: [
        {
          titre: 'Excel pour le chantier', dureeMin: 12, missionPratique: 'excel-calcul-volumes',
          blocs: [
            { type: 'texte', valeur: "Excel est l'outil n°1 du BTP : métrés, devis, suivis de budget, plannings simples. Les fonctions clés : SOMME, SI, RECHERCHEV, et surtout des tableaux propres avec unités affichées." },
            { type: 'exemple', valeur: "Un tableau de métré type : colonne désignation, unité, longueur, largeur, hauteur, quantité = produit des dimensions." },
          ],
        },
        {
          titre: 'Word et le rapport de chantier', dureeMin: 8, missionPratique: 'rapport-journalier',
          blocs: [
            { type: 'texte', valeur: "Le rapport journalier trace ce qui s'est réellement passé : effectifs, travaux réalisés, matériaux reçus, incidents, météo. C'est un document contractuel en cas de litige sur les délais." },
            { type: 'astuce', valeur: "Un bon rapport se relit en 1 minute : des faits, des chiffres, pas d'opinions." },
          ],
        },
      ],
    },
    {
      slug: 'gestion-humaine', titre: 'Gestion humaine de chantier', domaine: 'management', ordre: 8, competence: 'gestion-humaine',
      cours: [
        {
          titre: "Diriger une équipe sur le terrain", dureeMin: 12, missionPratique: 'casque-refuse',
          blocs: [
            { type: 'texte', valeur: "Un chef d'équipe donne des consignes claires (quoi, où, comment, pour quand), vérifie la compréhension, et fait respecter la sécurité sans humilier. La fermeté sur les règles + le respect des personnes = la recette qui marche." },
            { type: 'exemple', valeur: "Un ouvrier refuse son casque « parce qu'il fait chaud » : on rappelle la règle, on explique le risque, on ne cède pas — et on valorise ceux qui respectent les consignes." },
            { type: 'astuce', valeur: "Critique en privé, félicite en public. L'inverse détruit la motivation d'une équipe en quelques jours." },
          ],
        },
      ],
    },
    {
      slug: 'topographie-implantation', titre: 'Topographie et implantation', domaine: 'technique', ordre: 9, competence: 'topographie',
      cours: [
        {
          titre: "Implanter un ouvrage", dureeMin: 12, missionPratique: 'quiz-topographie',
          blocs: [
            { type: 'texte', valeur: "L'implantation reporte le plan sur le terrain : on matérialise les axes avec des chaises et cordeaux, on vérifie les équerres (méthode 3-4-5 ou théodolite), on reporte les niveaux avec le niveau optique ou laser depuis un repère (borne, trait de niveau)." },
            { type: 'exemple', valeur: "Pour vérifier l'angle droit d'un bâtiment : mesure 3 m sur un côté, 4 m sur l'autre — la diagonale doit faire exactement 5 m." },
            { type: 'attention', valeur: "Une erreur d'implantation découverte après coulage des fondations = démolition. C'est l'étape où l'on prend le temps de tout revérifier." },
          ],
        },
      ],
    },
    {
      slug: 'geotechnique-sols', titre: 'Géotechnique et sols', domaine: 'technique', ordre: 10, competence: 'geotechnique',
      cours: [
        {
          titre: 'Connaître son sol avant de fonder', dureeMin: 12, missionPratique: 'quiz-geotechnique',
          blocs: [
            { type: 'texte', valeur: "Le sol porte tout : l'étude géotechnique (sondages, essais) détermine sa portance et le type de fondation. Sables = bonne portance mais attention à l'eau ; argiles = retrait-gonflement ; remblais non compactés = danger." },
            { type: 'exemple', valeur: "Une fissure en escalier sur un mur est souvent le signe d'un tassement différentiel : une partie du bâtiment s'enfonce plus que l'autre." },
            { type: 'astuce', valeur: "L'eau est l'ennemi n°1 des fondations : drainage et gestion des eaux pluviales se pensent dès la conception." },
          ],
        },
      ],
    },
    {
      slug: 'controle-qualite-chantier', titre: 'Contrôle qualité', domaine: 'hse', ordre: 11, competence: 'controle-qualite',
      cours: [
        {
          titre: 'Contrôler, tracer, corriger', dureeMin: 10, missionPratique: 'quiz-controle-qualite',
          blocs: [
            { type: 'texte', valeur: "La qualité se contrôle à chaque étape : réception des matériaux (bons de livraison, aspect), contrôles en cours (slump test, enrobages, aplombs) et essais (éprouvettes béton écrasées à 7 et 28 jours). Toute non-conformité se trace sur une fiche NC." },
            { type: 'exemple', valeur: "Slump test : on remplit le cône d'Abrams en 3 couches piquées, on soulève, on mesure l'affaissement. 5-9 cm = béton plastique correct pour la plupart des ouvrages courants." },
          ],
        },
      ],
    },
    {
      slug: 'reception-travaux', titre: 'Réception des travaux', domaine: 'gestion', ordre: 12, competence: 'reception-travaux',
      cours: [
        {
          titre: 'PV, réserves et garanties', dureeMin: 10, missionPratique: 'quiz-reception-travaux',
          blocs: [
            { type: 'texte', valeur: "La réception est l'acte par lequel le maître d'ouvrage accepte l'ouvrage. Elle peut être prononcée avec réserves (défauts listés à corriger). Elle déclenche les garanties : parfait achèvement (1 an), bon fonctionnement (2 ans), décennale (10 ans, solidité)." },
            { type: 'attention', valeur: "Sans PV de réception signé, les garanties ne courent pas et les responsabilités restent floues. On ne « livre » jamais un chantier sur une poignée de main." },
          ],
        },
      ],
    },
    {
      slug: 'planification-chantier', titre: 'Planification de chantier', domaine: 'gestion', ordre: 13, competence: 'decision-chantier',
      cours: [
        {
          titre: 'Le planning, colonne vertébrale du chantier', dureeMin: 12, missionPratique: 'quiz-planification',
          blocs: [
            { type: 'texte', valeur: "Le planning Gantt liste les tâches, leurs durées et leurs liens (fin-début, parallèles). Le chemin critique est la chaîne de tâches sans marge : tout retard sur elle décale la livraison. On pilote le chantier en comparant avancement réel vs planifié chaque semaine." },
            { type: 'exemple', valeur: "Si le ferraillage du plancher prend 2 jours de retard et qu'il est sur le chemin critique, le coulage, le décoffrage et TOUTE la suite glissent de 2 jours." },
            { type: 'astuce', valeur: "Prévois les commandes longues (charpente, menuiseries) dès le début : le délai fournisseur tue plus de plannings que la pluie." },
          ],
        },
      ],
    },
    {
      slug: 'materiaux-construction', titre: 'Matériaux de construction', domaine: 'technique', ordre: 14, competence: 'maconnerie',
      cours: [
        {
          titre: 'Ciment, granulats, aciers : bien choisir', dureeMin: 10, missionPratique: 'quiz-materiaux',
          blocs: [
            { type: 'texte', valeur: "Le ciment se choisit selon l'usage (CEM I/II, classes 32,5 / 42,5). Les granulats doivent être propres (pas de terre ni matières organiques). Les aciers HA (haute adhérence) se stockent hors sol et hors boue. Tout matériau se réceptionne : quantité, qualité, conformité au bon de commande." },
            { type: 'attention', valeur: "Un sac de ciment durci en surface a pris l'humidité : sa résistance n'est plus garantie. Stockage sur palettes, sous abri, 10 sacs de hauteur max." },
          ],
        },
      ],
    },
    {
      slug: 'coffrage-etaiement', titre: 'Coffrage et étaiement', domaine: 'technique', ordre: 15, competence: 'beton-ferraillage',
      cours: [
        {
          titre: 'Mouler et soutenir le béton', dureeMin: 10, missionPratique: 'quiz-coffrage',
          blocs: [
            { type: 'texte', valeur: "Le coffrage donne sa forme au béton et doit résister à sa poussée (importante en pied de voile). L'étaiement soutient les planchers tant que le béton n'est pas autoporteur. Étanchéité des joints, huile de décoffrage, contreventement : les 3 vérifications de base." },
            { type: 'attention', valeur: "On ne retire JAMAIS un étai sans consigne du responsable : un plancher jeune peut s'effondrer sous son propre poids." },
          ],
        },
      ],
    },
    {
      slug: 'vrd-assainissement', titre: 'VRD et assainissement', domaine: 'technique', ordre: 16, competence: 'bases-btp',
      cours: [
        {
          titre: 'Réseaux et écoulements', dureeMin: 10, missionPratique: 'quiz-vrd',
          blocs: [
            { type: 'texte', valeur: "Les VRD (Voirie et Réseaux Divers) comprennent voirie, adduction d'eau, eaux usées, eaux pluviales, électricité, télécom. Les canalisations gravitaires exigent une pente régulière (souvent ≥ 1 %) et des regards de visite aux changements de direction." },
            { type: 'exemple', valeur: "Un caniveau bouché à Abidjan en saison des pluies = quartier inondé. Le dimensionnement et l'entretien des réseaux pluviaux sont vitaux." },
          ],
        },
      ],
    },
    // ── Modules logiciels (cours pro + quiz dédiés) ──
    {
      slug: 'autocad-plans', titre: 'AutoCAD — lire des plans DWG', domaine: 'logiciel', ordre: 17, competence: 'autocad-lecture',
      cours: [
        {
          titre: "Naviguer dans un dessin AutoCAD", dureeMin: 12, missionPratique: 'quiz-autocad',
          blocs: [
            { type: 'texte', valeur: "AutoCAD est le standard du dessin technique 2D. Le fichier natif est le DWG. Le dessin vit dans l'espace objet en vraie grandeur (1 unité = 1 mm ou 1 m selon le gabarit) ; les mises en page d'impression se font dans l'espace présentation, où chaque fenêtre applique une échelle (1/50, 1/100…)." },
            { type: 'texte', valeur: "Les calques organisent le dessin : murs, cotations, textes, mobilier, réseaux… On les allume/éteint pour isoler l'information utile. Les commandes essentielles du lecteur de plans : ZOOM/PAN (naviguer), DIST (mesurer), PROPRIETES (interroger un objet), CALQUE (filtrer)." },
            { type: 'exemple', valeur: "Tu reçois le DWG d'un plan de coffrage : tu éteins les calques 'mobilier' et 'textes archi', tu mesures l'entraxe des poteaux avec DIST, et tu vérifies l'épaisseur du voile avec PROPRIETES — sans jamais modifier le dessin." },
            { type: 'astuce', valeur: "Toujours travailler sur une COPIE du DWG reçu et vérifier ses unités (commande UNITES) avant toute mesure : un plan en pouces interprété en mètres a déjà causé des catastrophes." },
          ],
        },
      ],
    },
    {
      slug: 'revit-bim-initiation', titre: 'Revit & BIM — la maquette numérique', domaine: 'logiciel', ordre: 18, competence: 'revit-bim',
      cours: [
        {
          titre: 'Comprendre le BIM et la maquette', dureeMin: 14, missionPratique: 'quiz-bim',
          blocs: [
            { type: 'texte', valeur: "Le BIM (Building Information Modeling) est une méthode de travail : tous les acteurs collaborent autour d'une maquette numérique 3D dont chaque objet porte des informations (matériau, dimensions, niveau, coût…). Revit est le logiciel BIM le plus répandu ; ses « familles » (murs, poteaux, fenêtres) sont des objets paramétriques intelligents." },
            { type: 'texte', valeur: "Trois usages clés sur chantier : visualiser l'ouvrage en 3D avant de le construire, détecter les clashs (une gaine qui traverse une poutre) avant qu'ils coûtent cher, et extraire des nomenclatures (quantités, surfaces) fiables pour le métré." },
            { type: 'exemple', valeur: "Sur la villa R+1 du projet : la maquette révèle que la descente d'eau pluviale traverse le linteau du salon. Détecté en réunion BIM = 1 heure de re-routage. Détecté au chantier = démolition partielle du linteau." },
            { type: 'astuce', valeur: "Le LOD (niveau de développement) évite de sur-modéliser : inutile de dessiner chaque vis en phase d'avant-projet. LOD 200-300 suffit pour les études, LOD 400 pour l'exécution." },
          ],
        },
      ],
    },
    {
      slug: 'excel-btp-avance', titre: 'Excel BTP avancé', domaine: 'logiciel', ordre: 19, competence: 'excel-btp',
      cours: [
        {
          titre: 'Du métré au devis automatisé', dureeMin: 14, missionPratique: 'quiz-excel-avance',
          blocs: [
            { type: 'texte', valeur: "Un classeur de devis professionnel s'organise en feuilles : Métré (quantités calculées), Bibliothèque de prix (désignation, unité, prix unitaire), DQE (devis quantitatif estimatif qui relie les deux). RECHERCHEV va chercher le prix unitaire dans la bibliothèque : plus aucune ressaisie, plus d'erreur de copie." },
            { type: 'texte', valeur: "Les références absolues ($A$1) verrouillent les cellules de paramètres (taux de TVA, coefficient de frais généraux) pendant les recopies. SOMME.SI totalise par lot (gros œuvre, second œuvre). La mise en forme conditionnelle colore automatiquement les dépassements de budget." },
            { type: 'exemple', valeur: "DQE d'une chambre : la colonne Montant contient =Quantité × RECHERCHEV(Désignation; BibliothequePrix; 3; FAUX). Changer un prix dans la bibliothèque met à jour tout le devis instantanément." },
            { type: 'astuce', valeur: "Fige les volets sous la ligne d'en-tête et nomme tes plages (Formules > Gestionnaire de noms) : =RECHERCHEV(A2; PrixCI; 3; FAUX) se relit mieux que des références cryptiques." },
            { type: 'attention', valeur: "RECHERCHEV avec VRAI (valeur approchée) au lieu de FAUX renvoie des prix faux sans avertissement. Toujours FAUX pour une correspondance exacte." },
          ],
        },
      ],
    },
    {
      slug: 'msproject-planning', titre: 'MS Project — piloter le planning', domaine: 'logiciel', ordre: 20, competence: 'decision-chantier',
      cours: [
        {
          titre: 'Construire et suivre un planning de chantier', dureeMin: 14, missionPratique: 'quiz-msproject',
          blocs: [
            { type: 'texte', valeur: "MS Project structure le chantier en tâches hiérarchisées (phases > tâches > sous-tâches), reliées par des liens de dépendance : fin-début (le plus courant), début-début (tâches parallèles), avec décalages éventuels (+2 j de séchage). Les jalons (durée 0) marquent les événements clés : ordre de service, fin du gros œuvre, réception." },
            { type: 'texte', valeur: "Le logiciel calcule automatiquement le chemin critique (en rouge) : la chaîne de tâches sans marge. Avant le démarrage, on enregistre la ligne de base (baseline) — la photographie du planning contractuel — puis on saisit l'avancement réel chaque semaine pour visualiser les dérives." },
            { type: 'exemple', valeur: "Planning de la villa : Terrassement (3 j) → Fondations (5 j) → Élévation (10 j) → Dalle (4 j + 7 j de séchage en décalage) → Charpente. La livraison de la charpente (délai fournisseur 3 semaines) se commande dès le début : c'est elle qui pilote la fin." },
            { type: 'astuce', valeur: "Affiche toujours la colonne « Marge totale » : une tâche à marge nulle est critique, une marge qui fond de semaine en semaine est une alerte avant le retard." },
          ],
        },
      ],
    },
  ];

  // Seconds cours des modules récents — pour des modules complets, jamais un seul cours.
  const coursSupplementaires: Record<string, CoursSeed[]> = {
    'topographie-implantation': [
      {
        titre: 'Niveaux et altimétrie sur chantier', dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "Tous les niveaux du chantier se rapportent à un repère unique (borne ou trait de niveau ±0,00). Le niveau optique donne des lectures sur mire : dénivelé = lecture arrière − lecture avant. Le laser rotatif projette un plan horizontal continu, pratique pour caler fonds de fouille et arases." },
          { type: 'exemple', valeur: "Fond de fouille prévu à −0,80 m : depuis le repère, lecture arrière 1,45 m. La mire posée en fond de fouille doit lire 1,45 + 0,80 = 2,25 m." },
          { type: 'astuce', valeur: "Referme toujours ton cheminement de nivellement sur le point de départ : l'écart de fermeture révèle immédiatement une erreur de lecture." },
        ],
      },
    ],
    'geotechnique-sols': [
      {
        titre: 'Choisir la fondation selon le sol', dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "Bon sol en surface → semelles filantes ou isolées. Sol moyen ou charges fortes → radier général qui répartit. Bon sol en profondeur seulement → pieux ou puits. Le rapport géotechnique donne la contrainte admissible qui dimensionne la surface d'appui : semelle = charge ÷ contrainte." },
          { type: 'exemple', valeur: "Poteau qui descend 30 tonnes sur un sol à 2 bars (20 t/m²) : surface de semelle nécessaire = 30 ÷ 20 = 1,5 m², soit environ 1,25 m × 1,25 m." },
          { type: 'attention', valeur: "Deux fondations voisines sur des sols différents (rocher d'un côté, remblai de l'autre) = tassement différentiel et fissures. On homogénéise ou on joint de rupture." },
        ],
      },
    ],
    'controle-qualite-chantier': [
      {
        titre: 'Les essais du béton', dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "À la livraison : vérification du bon (formulation, heure de départ — béton refusé au-delà de 2 h), slump test pour la consistance, confection d'éprouvettes. Les éprouvettes partent au laboratoire : écrasement à 7 jours (tendance, ~70 % de la résistance) et à 28 jours (valeur contractuelle, ex. C25/30 = 25 MPa sur cylindre)." },
          { type: 'exemple', valeur: "Éprouvette à 7 jours : 19 MPa pour un C25/30 attendu. 19 ÷ 0,7 ≈ 27 MPa projetés à 28 jours : le lot est sur la bonne trajectoire, pas d'alerte." },
          { type: 'astuce', valeur: "Marque chaque éprouvette (date, ouvrage, camion) au marqueur indélébile immédiatement : une éprouvette anonyme ne prouve plus rien." },
        ],
      },
    ],
    'reception-travaux': [
      {
        titre: 'Lever les réserves et clore le chantier', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "Après la réception avec réserves, l'entreprise corrige chaque défaut dans le délai convenu, puis provoque la visite de levée : chaque réserve levée est signée. Le dossier des ouvrages exécutés (DOE) — plans conformes à l'exécution, notices, PV d'essais — se remet au maître d'ouvrage pour l'exploitation du bâtiment." },
          { type: 'attention', valeur: "La retenue de garantie (souvent 5 %) n'est restituée qu'après levée de toutes les réserves : traîner sur une poignée de porte peut bloquer des millions de FCFA." },
        ],
      },
    ],
    'planification-chantier': [
      {
        titre: "Suivre l'avancement et gérer les dérives", dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "Chaque semaine : relever l'avancement physique réel de chaque tâche (%, quantités), le comparer au planifié, identifier les tâches critiques en retard, décider des actions (renfort d'équipe, travail samedi, re-séquencement) et tracer les causes (intempéries, attente de plans, retard fournisseur) pour justifier les délais." },
          { type: 'exemple', valeur: "L'élévation est à 60 % au lieu de 80 % : 2 jours de retard sur tâche critique. Décision : passer de 4 à 6 maçons pendant une semaine — coût de renfort inférieur aux pénalités de retard." },
          { type: 'astuce', valeur: "Un planning affiché dans le bungalow et mis à jour devant l'équipe crée un engagement collectif que les fichiers cachés ne produisent jamais." },
        ],
      },
    ],
    'materiaux-construction': [
      {
        titre: 'Stocker et réceptionner les matériaux', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "Ciment : sur palettes, sous abri sec, 10 sacs de hauteur max, rotation premier entré-premier sorti. Aciers : sur chevrons hors sol et hors boue, par diamètres étiquetés. Granulats : sur aires propres séparées (jamais sable et gravier mélangés). Chaque livraison se réceptionne : quantité, qualité, conformité au bon de commande — avant de signer le bon de livraison." },
          { type: 'attention', valeur: "Signer un bon de livraison sans vérifier vaut acceptation : les 50 sacs manquants deviennent introuvables juridiquement une fois le camion parti." },
        ],
      },
    ],
    'coffrage-etaiement': [
      {
        titre: 'Sécurité du coffrage et cadence de rotation', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "Les banches (coffrages-outils verticaux) exigent stabilisateurs et lest contre le vent — une banche non stabilisée tue. Les tours d'étaiement se montent d'aplomb sur appuis durs, goupilles en place. La rotation des coffrages (décoffrer tôt pour recoffrer plus loin) donne la cadence du gros œuvre : un jeu de banches bien géré coule un voile par jour." },
          { type: 'attention', valeur: "Vent annoncé > 85 km/h : les banches se couchent au sol ou se contreventent en croix. C'est une consigne d'arrêt, pas une option." },
        ],
      },
    ],
    'vrd-assainissement': [
      {
        titre: 'Poser un réseau enterré dans les règles', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "La tranchée se dimensionne selon le diamètre et la profondeur (blindage au-delà de 1,30 m). Le lit de pose (sable, 10 cm) reçoit la canalisation, pente contrôlée au laser. L'enrobage de sable protège le tuyau, le grillage avertisseur se déroule 30 cm au-dessus, puis remblai compacté par couches de 30 cm." },
          { type: 'exemple', valeur: "Canalisation EU sur 40 m avec pente de 1 % : le fil d'eau descend de 40 cm entre le premier et le dernier regard — à vérifier au laser avant remblaiement, jamais après." },
        ],
      },
    ],
  };

  // Enrichissement pédagogique : chaque cours reçoit objectifs, approfondissements et synthèse.
  // Clé = titre du cours. Les lignes des blocs objectifs/retenir sont séparées par \n.
  const enrichissementCours: Record<string, { avant?: BlocSeed[]; apres?: BlocSeed[] }> = {
    'Le monde du BTP et ses acteurs': {
      avant: [{ type: 'objectifs', valeur: "Distinguer maître d'ouvrage, maître d'œuvre et entreprises\nConnaître le rôle du bureau de contrôle et du coordonnateur sécurité\nSituer chaque acteur dans la vie d'un projet réel" }],
      apres: [
        { type: 'texte', valeur: "Autour du trio de base gravitent des acteurs essentiels : le géotechnicien étudie le sol avant conception ; le bureau d'études structure calcule et dessine l'ossature ; le coordonnateur SPS organise la prévention quand plusieurs entreprises se côtoient ; les concessionnaires (eau, électricité, télécom) raccordent l'ouvrage. Dans les marchés publics ivoiriens s'ajoutent le contrôleur financier et les organismes de régulation des marchés." },
        { type: 'texte', valeur: "La relation contractuelle est le squelette du projet : le marché de travaux définit prix, délais, pénalités et modalités de paiement. L'entreprise ne reçoit d'ordres que du maître d'œuvre (jamais directement du client final sur le terrain), et toute modification passe par un ordre de service écrit — jamais verbal. Cette discipline documentaire protège toutes les parties en cas de litige." },
        { type: 'retenir', valeur: "MOA = paie et décide · MOE = conçoit et dirige · Entreprise = exécute\nLe bureau de contrôle est indépendant : il protège les futurs usagers\nAucune modification sans ordre de service écrit\nChaque acteur a un rôle contractuel précis — les court-circuiter crée les litiges" }],
    },
    "Le cycle de vie d'un projet": {
      avant: [{ type: 'objectifs', valeur: "Nommer les phases d'un projet de sa conception à sa maintenance\nComprendre le coût croissant des erreurs tardives\nSavoir quels documents sortent de chaque phase" }],
      apres: [
        { type: 'texte', valeur: "Détail des phases de conception : l'esquisse (ESQ) pose l'idée architecturale ; l'avant-projet sommaire (APS) fixe volumes et surfaces ; l'avant-projet définitif (APD) arrête les choix techniques et le budget ; le projet (PRO) produit les plans d'exécution et le descriptif détaillé. Vient ensuite la consultation : dossier d'appel d'offres, analyse des offres, mise au point du marché." },
        { type: 'exemple', valeur: "Sur un projet d'école de 500 millions FCFA : déplacer une cloison coûte 0 F à l'esquisse (un trait), ~500 000 F en phase PRO (reprise des plans et calculs), et plusieurs millions en phase chantier (démolition, reprise réseaux, retard)." },
        { type: 'retenir', valeur: "ESQ → APS → APD → PRO → appel d'offres → travaux → réception → exploitation\nPlus une erreur est détectée tard, plus elle coûte cher (règle du ×10 par phase)\nChaque phase fige des décisions : les remettre en cause après coûte" }],
    },
    'Les EPI et les 9 principes de prévention': {
      avant: [{ type: 'objectifs', valeur: "Connaître les EPI obligatoires et leur rôle exact\nAppliquer la hiérarchie de prévention avant de recourir aux EPI\nSavoir contrôler l'état de ses équipements" }],
      apres: [
        { type: 'texte', valeur: "Chaque EPI répond à un risque précis : le casque contre les chutes d'objets, les chaussures S3 contre l'écrasement et la perforation, les gants adaptés à la tâche (manutention, produits chimiques, soudure), la protection auditive au-delà de 80 dB, le masque anti-poussière pour la découpe et le ponçage, le harnais dès qu'il n'y a plus de protection collective en hauteur. Un EPI mal ajusté ou dégradé protège mal : sangle de casque réglée, chaussures lacées, harnais vérifié avant chaque usage." },
        { type: 'texte', valeur: "Les 9 principes de prévention forment une logique en cascade : 1. éviter le risque, 2. évaluer ce qui ne peut être évité, 3. combattre le risque à la source, 4. adapter le travail à l'homme, 5. tenir compte de l'évolution technique, 6. remplacer le dangereux par le moins dangereux, 7. planifier la prévention, 8. donner la priorité aux protections collectives, 9. former et informer. L'EPI n'arrive qu'en dernier — c'est le filet, pas la stratégie." },
        { type: 'retenir', valeur: "L'EPI est la DERNIÈRE barrière, jamais la première réponse\nProtection collective (garde-corps, filets) avant protection individuelle\nUn casque se remplace après tout choc, même sans fissure visible\nPas d'EPI adapté = pas de tâche : on ne négocie pas" }],
    },
    'Risques majeurs du chantier': {
      avant: [{ type: 'objectifs', valeur: "Identifier les 4 familles d'accidents mortels du BTP\nConnaître les parades collectives de chacune\nAdopter le réflexe d'analyse avant chaque tâche" }],
      apres: [
        { type: 'texte', valeur: "Chiffres à connaître : les chutes de hauteur représentent environ un tiers des décès du BTP. Toute zone de travail à plus de 2 m exige garde-corps (lisse à 1 m, sous-lisse, plinthe) ou harnais ancré. Les engins tuent par écrasement dans les angles morts : gilet haute visibilité, contact visuel avec le conducteur, zones de circulation séparées. Une tranchée de 1,50 m dans un sable peut s'effondrer en une seconde et 1 m³ de terre pèse 1,8 tonne : blindage ou talutage dès 1,30 m." },
        { type: 'exemple', valeur: "Analyse pré-tâche en 4 questions avant de descendre dans une fouille : Quelle profondeur ? (1,60 m → blindage obligatoire) Le blindage est-il posé ? Où sont les charges et engins en surface ? (à plus de 1 m du bord) Qui me surveille depuis la surface ?" },
        { type: 'retenir', valeur: "4 tueurs : chutes · engins · effondrements · électricité\nGarde-corps dès 2 m, blindage dès 1,30 m de fouille\n1 m³ de terre = 1,8 tonne : aucune chance sans blindage\n2 minutes d'analyse pré-tâche évitent l'accident d'une vie" }],
    },
    'Échelles, cotations et symboles': {
      avant: [{ type: 'objectifs', valeur: "Convertir les mesures papier en dimensions réelles à toutes les échelles\nLire cotations, niveaux et symboles normalisés\nOrganiser sa lecture d'un dossier de plans complet" }],
      apres: [
        { type: 'texte', valeur: "Les échelles usuelles ont chacune leur usage : 1/500 et 1/200 pour les plans de masse, 1/100 et 1/50 pour les plans d'étage, 1/20 pour les coupes de détail, 1/10 voire 1/5 pour les détails d'exécution. Les niveaux se lisent en altitude relative : ±0,00 est le niveau de référence (souvent le sol fini du RDC), +2,80 le dessus du plancher haut, −1,20 le fond de fouille. Symboles courants : hachures pleines = béton, croisillons = maçonnerie, cercle barré = poteau, double trait = mur porteur, trait fin = cloison." },
        { type: 'retenir', valeur: "Échelle 1/50 : 1 cm papier = 50 cm réel — 2 cm = 1 m\nToujours vérifier l'échelle ET l'indice de révision du plan\nOrdre de lecture : situation → masse → niveaux → coupes → détails\n±0,00 est la référence de tous les niveaux du chantier" }],
    },
    'Plans de coffrage et de ferraillage': {
      avant: [{ type: 'objectifs', valeur: "Différencier plan de coffrage et plan de ferraillage\nLire une nomenclature d'aciers\nDétecter une incohérence avant coulage" }],
      apres: [
        { type: 'texte', valeur: "La nomenclature d'aciers accompagne le plan de ferraillage : chaque repère (cadre, épingle, barre) y est décrit avec sa forme façonnée, son diamètre, sa longueur développée et sa quantité. Sur le plan, « 8HA12 e=15 » signifie 8 barres haute adhérence de 12 mm espacées de 15 cm. Les recouvrements (jonction entre deux barres, typiquement 50×diamètre) et les retours d'ancrage sont dessinés — les improviser sur le tas est interdit." },
        { type: 'exemple', valeur: "Contrôle croisé avant coulage du poteau P3 : le plan de coffrage donne 25×25 cm — le plan de ferraillage du P3 doit montrer des cadres compatibles (25 − 2×3 d'enrobage = cadres de 19×19 cm). Si le ferrailleur a des cadres de 22, quelqu'un s'est trompé : STOP, appel au bureau d'études." },
        { type: 'retenir', valeur: "Coffrage = les formes du béton · Ferraillage = les aciers dedans\n8HA12 e=15 : 8 barres HA de 12 mm tous les 15 cm\nRecouvrement typique = 50 fois le diamètre de la barre\nIncohérence entre plans = arrêt et appel au BE, jamais d'improvisation" }],
    },
    'Composition et dosage du béton': {
      avant: [{ type: 'objectifs', valeur: "Composer un béton et comprendre le rôle de chaque constituant\nDoser correctement selon l'usage de l'ouvrage\nMaîtriser l'impact de l'eau sur la résistance" }],
      apres: [
        { type: 'texte', valeur: "Les dosages de référence par usage : béton de propreté 150 kg/m³ (protéger le fond de fouille), béton de forme 250 kg/m³, béton armé courant 350 kg/m³, ouvrages exposés ou fortement sollicités 400 kg/m³. Le rapport eau/ciment idéal tourne autour de 0,5 : au-delà, chaque litre d'eau en trop crée des capillaires qui affaiblissent le béton — 10 % d'eau en trop peut coûter 20 % de résistance. La cure (maintenir le béton humide 7 jours : arrosage, bâches) est aussi importante que le dosage." },
        { type: 'exemple', valeur: "Commande pour une dalle de 12 m³ à 350 kg/m³ : 12 × 7 = 84 sacs de ciment, 12 × 0,4 = 4,8 m³ de sable, 12 × 0,8 = 9,6 m³ de gravier, eau ≈ 2 100 L à ajuster selon l'humidité du sable — plus 5 % de marge sur tout." },
        { type: 'retenir', valeur: "350 kg/m³ = le dosage du béton armé courant\nRapport eau/ciment ≈ 0,5 : l'eau en trop détruit la résistance\n1 m³ à 350 = 7 sacs + 400 L sable + 800 L gravier + ~175 L d'eau\nLa cure des 7 premiers jours fait la moitié de la qualité finale" }],
    },
    'Le rôle des armatures': {
      avant: [{ type: 'objectifs', valeur: "Comprendre pourquoi le béton a besoin d'acier\nPlacer les aciers là où l'ouvrage tire\nRespecter enrobages et façonnage" }],
      apres: [
        { type: 'schema', valeur: 'poutre-flexion' },
        { type: 'schema', valeur: 'enrobage' },

        { type: 'texte', valeur: "Où tire un ouvrage ? Une poutre sur deux appuis fléchit : sa fibre inférieure s'allonge (traction) — les aciers principaux vont en bas. Une console (balcon) tire en haut — les aciers vont en haut : inverser ce ferraillage est l'erreur qui fait tomber les balcons. Les cadres et étriers cousent le béton contre l'effort tranchant près des appuis. Dans un poteau, les aciers longitudinaux aident à la compression et les cadres empêchent leur flambement." },
        { type: 'attention', valeur: "Un acier plié puis déplié à chaud ou cintré trop serré est fragilisé de façon invisible. Le façonnage respecte des mandrins de cintrage minimum — on ne « redresse » jamais un acier à coups de masse pour rattraper une erreur d'implantation." },
        { type: 'retenir', valeur: "Béton = compression · Acier = traction : le duo est indissociable\nPoutre : aciers en bas · Console/balcon : aciers en HAUT\nEnrobage 3 cm (5 cm en bord de mer) : les cales sont vitales\nJamais de pliage-dépliage sauvage des aciers" }],
    },
    'Fondations : transmettre les charges au sol': {
      avant: [{ type: 'objectifs', valeur: "Choisir le type de fondation selon le sol et les charges\nDimensionner une semelle simple par la contrainte admissible\nContrôler un fond de fouille avant coulage" }],
      apres: [
        { type: 'schema', valeur: 'semelle' },

        { type: 'texte', valeur: "Le contrôle du fond de fouille est un moment clé : profondeur conforme au plan (hors gel, ancrage dans le bon sol), sol homogène et conforme au rapport géotechnique (le géotechnicien vient valider en cas de doute), fond propre et sec, béton de propreté coulé rapidement pour protéger le sol des intempéries. Un fond de fouille détrempé par une pluie doit être purgé de sa boue avant tout coulage." },
        { type: 'retenir', valeur: "La fondation adapte le bâtiment au sol, jamais l'inverse\nSurface de semelle = charge ÷ contrainte admissible du sol\nBéton de propreté (5 cm) : protège le sol et les aciers, toujours\nFond de fouille validé AVANT de couler — après, il est trop tard" }],
    },
    'Monter un mur en agglos': {
      avant: [{ type: 'objectifs', valeur: "Monter un mur droit, de niveau et d'aplomb\nRespecter l'appareillage et les chaînages\nDoser le mortier de pose correctement" }],
      apres: [
        { type: 'texte', valeur: "Le mortier de pose se dose à 300-350 kg de ciment par m³ de sable : assez gras pour coller, pas trop pour ne pas fissurer. Joints horizontaux et verticaux de 1 à 1,5 cm, pleins — les joints vides sont des ponts thermiques et des faiblesses. Le premier rang est décisif : posé sur une arase étanche parfaitement de niveau, il conditionne tout le mur. On tend le cordeau à chaque rang, on contrôle l'aplomb au fil à plomb ou au niveau tous les 2-3 rangs." },
        { type: 'exemple', valeur: "Rendement courant : un maçon et son aide posent 15 à 20 m² d'agglos par jour en travail soigné. Pour le mur de clôture de 45 m² du chantier Yopougon, compte 2,5 à 3 jours à deux — c'est exactement ce que le planning simule." },
        { type: 'retenir', valeur: "Joints décalés d'un demi-agglo minimum (appareillage)\nPremier rang parfait = mur parfait ; cordeau à chaque rang\nChaînages verticaux aux angles et tous les 5 m maximum\nJoints pleins de 1-1,5 cm — un joint vide est une fissure future" }],
    },
    'Du plan aux quantités': {
      avant: [{ type: 'objectifs', valeur: "Calculer surfaces, volumes et longueurs depuis un plan\nStructurer un métré vérifiable ligne par ligne\nContrôler ses ordres de grandeur" }],
      apres: [
        { type: 'texte', valeur: "Le métré professionnel suit le principe du « mode de métré » : on annonce comment on mesure (vide pour plein ou déduction des ouvertures, axes ou nus finis) et on s'y tient. Chaque ligne du métré cite sa source (plan, repère, cote) pour être vérifiable par un tiers. Les déductions s'appliquent avec des règles : une ouverture de moins de 0,5 m² ne se déduit généralement pas d'un mur — ces conventions évitent les litiges de règlement." },
        { type: 'retenir', valeur: "Un métré se vérifie ligne par ligne : source + calcul + unité\nAnnoncer son mode de métré et s'y tenir\nOrdres de grandeur : dalle ≈ 0,15 m³ de béton/m², mur ≈ 10 agglos/m²\nToujours +5 % de casse sur les matériaux" }],
    },
    'Construire un devis avec la bibliothèque de prix': {
      avant: [{ type: 'objectifs', valeur: "Composer un prix unitaire complet (déboursé + frais + marge)\nBâtir un DQE ordonné par lots\nProtéger sa marge avec les provisions" }],
      apres: [
        { type: 'texte', valeur: "Anatomie d'un prix unitaire : le déboursé sec (matériaux + main-d'œuvre + matériel directement consommés) est majoré des frais de chantier (installation, gardiennage, eau-électricité de chantier), des frais généraux de l'entreprise (10-15 % : bureaux, salaires administratifs) et de la marge (5-15 % selon le risque et la concurrence). Vendre au déboursé sec, c'est payer pour travailler. Le DQE s'organise par lots (terrassement, gros œuvre, second œuvre…) avec sous-totaux, TVA et récapitulatif." },
        { type: 'exemple', valeur: "PU du m³ de béton armé pour semelles : déboursé sec 95 000 F (matériaux 62 000 + main-d'œuvre 25 000 + matériel 8 000) + frais de chantier 8 % + frais généraux 12 % + marge 10 % ≈ 126 000 F/m³ HT. C'est ce raisonnement que le jeu simule dans tes devis." },
        { type: 'retenir', valeur: "PU = déboursé sec + frais chantier + frais généraux + marge\nDevis sans provision aléas (5-10 %) = chantier à perte\nDQE ordonné par lots avec sous-totaux : lisible = crédible\nComparer son total au ratio marché (prix/m² local) avant d'envoyer" }],
    },
    'Excel pour le chantier': {
      avant: [{ type: 'objectifs', valeur: "Construire des tableaux de métré propres et recalculables\nUtiliser SOMME, SI et les références de cellules\nPrésenter des chiffres exploitables par d'autres" }, { type: 'logiciel', valeur: 'excel' }],
      apres: [
        { type: 'texte', valeur: "Règles d'or d'un classeur de chantier : une donnée ne se saisit qu'une fois (toute répétition est une formule), les unités sont affichées dans les en-têtes, les cellules de saisie se distinguent des cellules calculées (fond coloré), et chaque feuille a un titre, une date et un auteur. Un classeur bien construit se recalcule intégralement quand une seule dimension change — c'est le test de qualité." },
        { type: 'retenir', valeur: "Une donnée = une seule saisie, le reste en formules\nUnités visibles dans chaque en-tête de colonne\n=SOMME(plage) pour les totaux, jamais d'addition manuelle\nUn bon classeur se recalcule tout seul quand une cote change" }],
    },
    'Word et le rapport de chantier': {
      avant: [{ type: 'objectifs', valeur: "Rédiger un rapport journalier factuel et complet\nStructurer un document professionnel réutilisable\nComprendre la valeur contractuelle du rapport" }, { type: 'logiciel', valeur: 'word' }],
      apres: [
        { type: 'texte', valeur: "Structure type du rapport journalier : identification (chantier, date, rédacteur, météo), effectifs par qualification, travaux réalisés avec quantités et localisation (« coulage voile V2, axe B, 12 m³ »), matériaux et matériels reçus, incidents et visites, besoins et points de blocage pour demain. Photos datées en annexe. En cas de réclamation sur les délais deux ans plus tard, ce sont ces rapports qui font foi devant l'expert." },
        { type: 'retenir', valeur: "Des faits, des chiffres, des localisations — zéro opinion\nMétéo et heures perdues systématiquement notées\nLe rapport journalier est une pièce contractuelle\nUn rapport se relit en 1 minute : structure fixe et concision" }],
    },
    "Diriger une équipe sur le terrain": {
      avant: [{ type: 'objectifs', valeur: "Donner des consignes claires et vérifier leur compréhension\nTenir la règle sans casser la motivation\nGérer les conflits avant qu'ils ne dégénèrent" }],
      apres: [
        { type: 'texte', valeur: "Une consigne complète tient en 5 points : quoi (la tâche précise), où (localisation exacte), comment (méthode et matériel), pour quand (échéance réaliste), et le point sécurité associé. Puis on fait reformuler : « explique-moi comment tu vas t'y prendre » révèle les malentendus avant qu'ils coûtent. Le conflit entre deux ouvriers se traite tôt, en privé, en écoutant les deux versions séparément — l'ignorer, c'est le laisser contaminer toute l'équipe (le jeu simule exactement cela avec le moral)." },
        { type: 'retenir', valeur: "Consigne = quoi + où + comment + quand + sécurité\nFaire reformuler : la compréhension se vérifie, ne se suppose pas\nCritique en privé, félicitations en public — jamais l'inverse\nFermeté sur les règles + respect des personnes = autorité durable" }],
    },
    "Implanter un ouvrage": {
      avant: [{ type: 'objectifs', valeur: "Matérialiser les axes d'un bâtiment avec chaises et cordeaux\nVérifier une équerre par la méthode 3-4-5\nReporter les niveaux depuis un repère fiable" }],
      apres: [
        { type: 'schema', valeur: 'triangle-345' },

        { type: 'texte', valeur: "Procédure d'implantation pas à pas : 1. reconnaître bornes et limites de propriété avec les documents d'urbanisme ; 2. tracer l'alignement de référence (souvent parallèle à la voie) ; 3. planter les chaises 1 m en dehors de l'emprise des fouilles pour qu'elles survivent au terrassement ; 4. tendre les cordeaux d'axes et vérifier chaque angle (3-4-5 ou théodolite) ; 5. contrôler les deux diagonales du rectangle — égales à ± 1 cm, sinon l'équerrage est faux ; 6. marquer les axes à la peinture au sol et faire valider avant de creuser." },
        { type: 'retenir', valeur: "Chaises HORS emprise des fouilles, sinon le terrassement les détruit\n3² + 4² = 5² : l'équerre se prouve, ne se devine pas\nDiagonales égales = rectangle vrai\nImplantation validée et contresignée AVANT le premier coup de pelle" }],
    },
    'Connaître son sol avant de fonder': {
      avant: [{ type: 'objectifs', valeur: "Reconnaître les grandes familles de sols et leurs comportements\nLire l'essentiel d'un rapport géotechnique\nRepérer les situations à risque (remblais, nappe, argiles)" }],
      apres: [
        { type: 'texte', valeur: "Le rapport géotechnique type contient : la coupe des sondages (nature et épaisseur des couches), le niveau de la nappe phréatique et ses fluctuations saisonnières, les résultats d'essais (pénétromètre, pressiomètre), la contrainte admissible retenue, et les recommandations de fondation avec leurs sujétions (rabattement de nappe, purge de remblais, drainage). C'est un document d'ingénierie : on applique ses conclusions, on ne les « adapte » pas au budget." },
        { type: 'retenir', valeur: "Sable = portance correcte mais sensible à l'eau\nArgile = retrait-gonflement : fissures si fondations légères\nRemblai non compacté = purge ou fondations profondes\nLa contrainte admissible du rapport n'est pas négociable" }],
    },
    'Contrôler, tracer, corriger': {
      avant: [{ type: 'objectifs', valeur: "Contrôler la qualité à chaque étape, pas seulement à la fin\nTracer les non-conformités pour les traiter vraiment\nConnaître les contrôles du béton frais et durci" }],
      apres: [
        { type: 'schema', valeur: 'cone-abrams' },

        { type: 'texte', valeur: "La fiche de non-conformité (FNC) suit un circuit précis : description factuelle avec photos et localisation, analyse de la cause (méthode des 5 pourquoi : on remonte à la cause racine), action curative (corriger le défaut), action corrective (empêcher la récidive), vérification de l'efficacité et clôture signée. Une FNC sans action corrective traite le symptôme, pas la maladie — le même défaut reviendra au prochain coulage." },
        { type: 'retenir', valeur: "Contrôler en amont coûte 10 fois moins que réparer en aval\nFNC : décrire → analyser la cause → corriger → prévenir → vérifier\nSlump test à chaque camion, éprouvettes à chaque coulage important\nUn défaut non tracé est un défaut qui reviendra" }],
    },
    'PV, réserves et garanties': {
      avant: [{ type: 'objectifs', valeur: "Comprendre les effets juridiques de la réception\nDistinguer les trois garanties et leurs durées\nGérer les réserves jusqu'à leur levée" }],
      apres: [
        { type: 'texte', valeur: "Les trois garanties déclenchées par la réception : le parfait achèvement (1 an) couvre tous les désordres signalés, quelle que soit leur gravité ; le bon fonctionnement (2 ans) couvre les équipements dissociables (menuiseries, robinetterie, ventilation) ; la décennale (10 ans) couvre ce qui compromet la solidité ou rend l'ouvrage impropre à sa destination (fissures structurelles, infiltrations généralisées, affaissements). L'assurance décennale de l'entreprise est obligatoire avant d'ouvrir le chantier — pas après." },
        { type: 'retenir', valeur: "Réception = transfert de garde + point de départ des garanties\n1 an parfait achèvement · 2 ans bon fonctionnement · 10 ans décennale\nRéserves listées au PV, délai de levée fixé, levées signées\nSans PV signé, tout reste flou : jamais de réception verbale" }],
    },
    'Le planning, colonne vertébrale du chantier': {
      avant: [{ type: 'objectifs', valeur: "Construire un enchaînement de tâches réaliste\nIdentifier et surveiller le chemin critique\nPiloter par les écarts entre prévu et réalisé" }],
      apres: [
        { type: 'texte', valeur: "Les durées se calculent, elles ne se devinent pas : quantité ÷ rendement d'équipe. 45 m² de mur à 18 m²/jour pour un binôme = 2,5 jours. On ajoute les temps masqués : séchages (7 jours avant de décoffrer une dalle), délais de livraison, validations du maître d'œuvre. Les tâches s'enchaînent par des liens logiques et le logiciel (ou le tableau) révèle le chemin critique. Un bon planning prévoit 10 % de marge météo en saison des pluies ivoirienne." },
        { type: 'retenir', valeur: "Durée = quantité ÷ rendement, jamais au pifomètre\nChemin critique = zéro marge : le surveiller chaque semaine\nSéchages et délais fournisseurs sont des tâches à part entière\nUn planning sans marge météo est un planning déjà en retard" }],
    },
    'Ciment, granulats, aciers : bien choisir': {
      avant: [{ type: 'objectifs', valeur: "Choisir le bon ciment selon l'usage\nJuger la qualité des granulats sur le chantier\nRéceptionner et stocker sans dégrader" }],
      apres: [
        { type: 'texte', valeur: "Tests de chantier simples : le sable serré dans la main ne doit ni tacher fortement la paume (argile) ni sentir la matière organique ; l'essai de la bouteille (sable + eau, on laisse décanter) révèle la couche d'argile en surface — au-delà de 10 %, sable à laver ou à refuser. Les aciers légèrement rouillés en surface restent utilisables (la rouille adhérente améliore même l'adhérence) mais un acier feuilletant qui perd de la section est à réformer." },
        { type: 'retenir', valeur: "Classe de ciment = résistance à 28 j : 32,5 courant, 42,5 structure\nEssai de la bouteille : plus de 10 % d'argile = sable refusé\nRouille superficielle acceptable, rouille feuilletante = réforme\nCiment : 10 sacs max en hauteur, sous abri, premier entré premier sorti" }],
    },
    'Mouler et soutenir le béton': {
      avant: [{ type: 'objectifs', valeur: "Préparer un coffrage sûr et étanche\nComprendre la poussée du béton frais\nDécoffrer et désétayer au bon moment" }],
      apres: [
        { type: 'texte', valeur: "Délais indicatifs de décoffrage par temps chaud (à moduler selon ciment et météo) : joues de poutres et voiles 24-48 h, dalles sur étais 7 jours avec désétaiement progressif, sous-faces de poutres 14-21 jours. Le désétaiement se fait du centre vers les appuis, jamais l'inverse. Par temps frais ou ciment lent, ces délais s'allongent — en cas de doute, l'écrasement d'une éprouvette d'information tranche." },
        { type: 'retenir', valeur: "La poussée du béton frais est hydrostatique : maximale en pied\nHuile de décoffrage avant ferraillage, jamais sur les aciers\nDécoffrage selon la résistance atteinte, pas selon l'impatience\nJamais retirer un étai sans consigne du responsable" }],
    },
    'Réseaux et écoulements': {
      avant: [{ type: 'objectifs', valeur: "Identifier les réseaux VRD et leurs règles propres\nComprendre pentes, regards et séparation EU/EP\nPrévenir les accrochages de réseaux existants" }],
      apres: [
        { type: 'schema', valeur: 'pente-vrd' },

        { type: 'texte', valeur: "Avant tout terrassement en zone équipée : demande de renseignements auprès des concessionnaires, repérage des réseaux existants, sondages manuels à l'approche. Le code couleur des grillages avertisseurs : rouge = électricité, jaune = gaz, bleu = eau potable, marron = assainissement, vert = télécom. Accrocher un câble 15 kV avec un godet, c'est l'accident grave assuré — les réseaux se cherchent à la main, pas à la pelle mécanique." },
        { type: 'retenir', valeur: "EU et EP séparés : ne jamais croiser les réseaux\nPente ≥ 1 % pour l'auto-curage, regards aux changements de direction\nGrillage avertisseur ~30 cm au-dessus de chaque réseau\nRéseaux existants : repérer puis sonder À LA MAIN" }],
    },
    'Naviguer dans un dessin AutoCAD': {
      avant: [{ type: 'objectifs', valeur: "Ouvrir et parcourir un DWG sans risque pour le dessin\nMesurer et interroger des objets fiablement\nExploiter calques et présentations" }, { type: 'logiciel', valeur: 'autocad' }],
      apres: [
        { type: 'texte', valeur: "Boîte à outils du lecteur de plans : ZOOM étendu pour retrouver un dessin « perdu », PAN pour se déplacer, DIST pour mesurer entre deux points d'accrochage (toujours activer l'accrochage aux extrémités/intersections, sinon on mesure du vide), PROPRIETES pour lire longueur, calque et type d'un objet, GEL/LIBERER de calques pour isoler la structure des cloisons. L'accrochage objet (OSNAP) est la différence entre une mesure exacte et une mesure « à peu près » — à peu près n'existe pas en exécution." },
        { type: 'retenir', valeur: "Travailler sur COPIE, vérifier les UNITES avant toute mesure\nMesurer avec accrochage objet actif, jamais à main levée\nCalques : isoler ce qu'on étudie, geler le reste\nEspace objet = vraie grandeur · présentation = mise en page" }],
    },
    'Comprendre le BIM et la maquette': {
      avant: [{ type: 'objectifs', valeur: "Définir le BIM au-delà du logiciel\nExploiter les données de la maquette (quantités, clashs)\nSituer les niveaux de détail (LOD) et leurs usages" }, { type: 'logiciel', valeur: 'revit' }],
      apres: [
        { type: 'texte', valeur: "Le processus BIM en pratique : chaque discipline (architecture, structure, fluides) modélise sa maquette ; elles se fédèrent régulièrement dans un modèle de coordination où un logiciel détecte les clashs ; les réunions BIM arbitrent les conflits AVANT l'exécution ; les nomenclatures alimentent métrés et commandes. Le format d'échange ouvert IFC permet la collaboration entre logiciels différents. Le BIM ne supprime pas les métiers — il supprime les mauvaises surprises." },
        { type: 'retenir', valeur: "BIM = méthode collaborative, Revit n'est qu'un outil\nLe « I » (information) vaut plus que la 3D\nClash détecté en réunion = 1 h · clash découvert au chantier = démolition\nIFC = format d'échange ouvert entre logiciels BIM" }],
    },
    'Du métré au devis automatisé': {
      avant: [{ type: 'objectifs', valeur: "Relier métré, bibliothèque de prix et DQE par formules\nFiabiliser avec références absolues et RECHERCHEV exacte\nMettre à jour un devis en quelques secondes" }, { type: 'logiciel', valeur: 'excel' }],
      apres: [
        { type: 'texte', valeur: "Architecture du classeur de devis pro : la feuille Métré calcule les quantités depuis les dimensions ; la feuille Bibliothèque centralise les prix unitaires (mise à jour mensuelle des prix ciment/fer qui fluctuent) ; la feuille DQE assemble tout par RECHERCHEV et calcule les montants ; une feuille Synthèse affiche les totaux par lot, la TVA et les ratios de contrôle (prix/m² comparé au marché). Changer le prix du ciment dans la bibliothèque met à jour tous les devis ouverts — zéro ressaisie, zéro oubli." },
        { type: 'retenir', valeur: "Métré → Bibliothèque → DQE : trois feuilles reliées par formules\nRECHERCHEV toujours avec FAUX (correspondance exacte)\n$ pour figer les références des paramètres (TVA, coefficients)\nRatio de contrôle final : ton prix/m² doit rester dans le marché" }],
    },
    'Construire et suivre un planning de chantier': {
      avant: [{ type: 'objectifs', valeur: "Structurer les tâches et leurs liens dans MS Project\nPoser jalons et ligne de base\nSuivre l'avancement et anticiper les dérives" }, { type: 'logiciel', valeur: 'msproject' }],
      apres: [
        { type: 'texte', valeur: "Routine hebdomadaire du pilote de planning : saisir le % d'avancement réel de chaque tâche en cours, comparer à la ligne de base (les barres grises sous les barres actuelles), examiner les tâches critiques en retard, simuler les actions correctives (renfort, re-séquencement) directement dans l'outil avant de décider, mettre à jour les jalons contractuels et diffuser un extrait lisible à l'équipe. Le planning ne sert que s'il vit — un planning figé au premier jour est un poster, pas un outil." },
        { type: 'retenir', valeur: "Jalon = durée nulle = événement contractuel à surveiller\nLien fin-début + décalage pour les séchages (FS + 7 j)\nLigne de base posée AVANT le premier jour de chantier\nRoutine hebdo : avancement réel → écarts → décisions" }],
    },
  };

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

  // Catalogue matériaux commun (ref + coût unitaire FCFA, prix pédagogiques CI)
  const MATERIAUX = {
    ciment: { nom: 'Ciment', unite: 'sac 50 kg', cout: 5500 },
    sable: { nom: 'Sable', unite: 'm³', cout: 15000 },
    gravier: { nom: 'Gravier', unite: 'm³', cout: 25000 },
    fer: { nom: 'Fer HA', unite: 'barre 12 m', cout: 4500 },
    agglos: { nom: 'Agglos 15', unite: 'unité', cout: 450 },
    planches: { nom: 'Planches coffrage', unite: 'unité', cout: 3000 },
  } as const;

  type PhaseGestion = { nom: string; joursEstimes: number; equipeMin: number; materiaux: Record<string, number>; missions: string[] };
  const chantiersGestion: Array<{
    slug: string; nom: string; typeProjet: 'DALLE' | 'CLOTURE' | 'CHAMBRE' | 'R_PLUS_1' | 'ROUTE' | 'URBAIN' | 'DALOT' | 'CANIVEAU' | 'ECOLE' | 'CENTRE_SANTE' | 'MAISON' | 'INDUSTRIEL'; budget: number; delaiJours: number;
    description: string; localisation: string; materiaux: Array<keyof typeof MATERIAUX>; phases: PhaseGestion[];
  }> = [
    {
      slug: 'dalle-riviera', nom: 'Dalle — Villa Riviera', typeProjet: 'DALLE', budget: 3500000, delaiJours: 15,
      description: "Réalisation de la dalle basse d'une villa : implante, ferraille, coule — en gérant stock, équipe et délais.",
      localisation: 'Riviera, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Implantation et coffrage', joursEstimes: 2, equipeMin: 1.5, materiaux: { 'Planches coffrage': 12 }, missions: ['implantation-topo'] },
        { nom: 'Ferraillage', joursEstimes: 4, equipeMin: 2.5, materiaux: { 'Fer HA': 60, 'Planches coffrage': 15 }, missions: ['controle-avant-coulage'] },
        { nom: 'Coulage de la dalle', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 70, Sable: 8, Gravier: 14 }, missions: ['volume-beton-dalle'] },
      ],
    },
    {
      slug: 'cloture-yopougon', nom: 'Clôture — Parcelle Yopougon', typeProjet: 'CLOTURE', budget: 1800000, delaiJours: 10,
      description: "Mur de clôture en agglos : fouilles, élévation, chaînage — un bon chantier d'apprentissage de la gestion.",
      localisation: 'Yopougon, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos'],
      phases: [
        { nom: 'Fouilles et semelle', joursEstimes: 3, equipeMin: 2, materiaux: { Ciment: 25, Sable: 3, Gravier: 5, 'Fer HA': 20 }, missions: ['metre-mur-cloture'] },
        { nom: 'Élévation des agglos', joursEstimes: 4, equipeMin: 2.5, materiaux: { 'Agglos 15': 600, Ciment: 20, Sable: 4 }, missions: [] },
        { nom: 'Chaînage et finitions', joursEstimes: 2, equipeMin: 2, materiaux: { Ciment: 10, 'Fer HA': 12, Sable: 1 }, missions: [] },
      ],
    },
    {
      slug: 'chambre-cocody', nom: 'Chambre simple — Cocody', typeProjet: 'CHAMBRE', budget: 4200000, delaiJours: 20,
      description: 'Une chambre annexe complète, des fondations aux enduits : le chantier le plus long, à toi de tenir budget et planning.',
      localisation: 'Cocody, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations', joursEstimes: 4, equipeMin: 2.5, materiaux: { Ciment: 30, Sable: 4, Gravier: 6, 'Fer HA': 25 }, missions: ['devis-chambre-simple'] },
        { nom: 'Élévation des murs', joursEstimes: 6, equipeMin: 3, materiaux: { 'Agglos 15': 900, Ciment: 25, Sable: 5 }, missions: [] },
        { nom: 'Toiture et chaînage', joursEstimes: 4, equipeMin: 2.5, materiaux: { Ciment: 15, 'Fer HA': 18, 'Planches coffrage': 25 }, missions: [] },
        { nom: 'Enduits et finitions', joursEstimes: 3, equipeMin: 2, materiaux: { Ciment: 20, Sable: 4 }, missions: [] },
      ],
    },
    // ── Grands chantiers (zone industrielle du monde virtuel) — seuils variés selon l'ambition,
    // et pour le pont un accès alternatif réservé à un poste précis (voir CONDITIONS_CHANTIER).
    {
      slug: 'amenagement-koumassi', nom: 'Aménagement — Voirie Koumassi', typeProjet: 'URBAIN', budget: 5800000, delaiJours: 22,
      description: "Un aménagement urbain complet : caniveaux, trottoirs, espaces verts. Premier pas vers les grands projets, dès le niveau 4.",
      localisation: 'Koumassi, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos'],
      phases: [
        { nom: 'Caniveaux et drainage', joursEstimes: 7, equipeMin: 3, materiaux: { Ciment: 35, Sable: 6, Gravier: 10, 'Fer HA': 15 }, missions: [] },
        { nom: 'Trottoirs et bordures', joursEstimes: 8, equipeMin: 3, materiaux: { 'Agglos 15': 500, Ciment: 30, Sable: 6 }, missions: [] },
        { nom: 'Espaces verts et finitions', joursEstimes: 7, equipeMin: 2.5, materiaux: { Ciment: 15, Sable: 4 }, missions: [] },
      ],
    },
    {
      slug: 'villa-r1-marcory', nom: 'Villa R+1 — Marcory', typeProjet: 'R_PLUS_1', budget: 9500000, delaiJours: 35,
      description: "Un vrai projet d'envergure : rez-de-chaussée, dalle intermédiaire et étage. Plus de phases, plus de matériaux à gérer, plus de responsabilités.",
      localisation: 'Marcory, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations renforcées', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 55, Sable: 7, Gravier: 12, 'Fer HA': 45 }, missions: [] },
        { nom: 'Rez-de-chaussée', joursEstimes: 8, equipeMin: 3.5, materiaux: { 'Agglos 15': 1400, Ciment: 45, Sable: 9, 'Fer HA': 20 }, missions: [] },
        { nom: 'Dalle intermédiaire', joursEstimes: 6, equipeMin: 3.5, materiaux: { Ciment: 60, Sable: 8, Gravier: 14, 'Fer HA': 55, 'Planches coffrage': 30 }, missions: [] },
        { nom: 'Étage', joursEstimes: 8, equipeMin: 3.5, materiaux: { 'Agglos 15': 1100, Ciment: 40, Sable: 8, 'Fer HA': 18 }, missions: [] },
        { nom: 'Toiture et finitions', joursEstimes: 8, equipeMin: 3, materiaux: { Ciment: 25, 'Fer HA': 20, 'Planches coffrage': 20 }, missions: [] },
      ],
    },
    {
      slug: 'route-abobo', nom: 'Voirie — Abobo', typeProjet: 'ROUTE', budget: 7200000, delaiJours: 25,
      description: "Un chantier de voirie : terrassement, fondation de chaussée, revêtement. Rien à voir avec le bâtiment — un vrai changement de rythme.",
      localisation: 'Abobo, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer'],
      phases: [
        { nom: 'Terrassement', joursEstimes: 6, equipeMin: 3, materiaux: { Gravier: 40, Sable: 10 }, missions: [] },
        { nom: 'Fondation de chaussée', joursEstimes: 8, equipeMin: 3.5, materiaux: { Gravier: 60, Ciment: 30, 'Fer HA': 10 }, missions: [] },
        { nom: 'Revêtement et finitions', joursEstimes: 6, equipeMin: 3, materiaux: { Ciment: 35, Sable: 12, Gravier: 20 }, missions: [] },
      ],
    },
    {
      slug: 'pont-bassam', nom: 'Pont — Franchissement Bassam', typeProjet: 'DALOT', budget: 14000000, delaiJours: 45,
      description: "Le chantier le plus exigeant : un vrai franchissement, piles et tablier. Réservé au niveau 8, ou accessible plus tôt aux chefs de chantier, conducteurs de travaux et ingénieurs structure confirmés.",
      localisation: 'Grand-Bassam',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Fondations et piles', joursEstimes: 12, equipeMin: 4, materiaux: { Ciment: 90, Sable: 14, Gravier: 22, 'Fer HA': 80 }, missions: [] },
        { nom: 'Coffrage du tablier', joursEstimes: 10, equipeMin: 4, materiaux: { 'Planches coffrage': 60, 'Fer HA': 40 }, missions: [] },
        { nom: 'Coulage du tablier', joursEstimes: 13, equipeMin: 4.5, materiaux: { Ciment: 100, Sable: 16, Gravier: 26, 'Fer HA': 50 }, missions: [] },
        { nom: 'Garde-corps et finitions', joursEstimes: 10, equipeMin: 3, materiaux: { Ciment: 20, 'Fer HA': 15 }, missions: [] },
      ],
    },
    // ── Palier au-delà du plafond de promotion (niveau 9) — la carrière plafonne à
    // conducteur-travaux, mais les chantiers continuent à grandir jusqu'au niveau 20.
    {
      slug: 'assainissement-yopougon', nom: 'Réseau d\'assainissement — Yopougon', typeProjet: 'CANIVEAU', budget: 8500000, delaiJours: 20,
      description: "Un réseau complet de drainage urbain : tranchées, caniveaux, regards de visite et raccordements. Débloqué au niveau 10.",
      localisation: 'Yopougon, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer'],
      phases: [
        { nom: 'Terrassement et tranchées', joursEstimes: 5, equipeMin: 3, materiaux: { Gravier: 30, Sable: 8 }, missions: [] },
        { nom: 'Pose des caniveaux et regards', joursEstimes: 8, equipeMin: 3.5, materiaux: { Ciment: 45, Sable: 10, Gravier: 15, 'Fer HA': 20 }, missions: [] },
        { nom: 'Raccordements et finitions', joursEstimes: 7, equipeMin: 3, materiaux: { Ciment: 20, Sable: 6 }, missions: [] },
      ],
    },
    {
      slug: 'groupe-scolaire-bouake', nom: 'Groupe scolaire — Bouaké', typeProjet: 'ECOLE', budget: 13000000, delaiJours: 30,
      description: "Plusieurs salles de classe, charpente et menuiseries : un vrai bâtiment public à livrer dans les règles. Débloqué au niveau 12.",
      localisation: 'Bouaké',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations et dallage', joursEstimes: 6, equipeMin: 3.5, materiaux: { Ciment: 60, Sable: 9, Gravier: 15, 'Fer HA': 50 }, missions: [] },
        { nom: 'Élévation des salles de classe', joursEstimes: 10, equipeMin: 4, materiaux: { 'Agglos 15': 1800, Ciment: 50, Sable: 10, 'Fer HA': 25 }, missions: [] },
        { nom: 'Charpente et toiture', joursEstimes: 8, equipeMin: 3.5, materiaux: { Ciment: 20, 'Fer HA': 25, 'Planches coffrage': 40 }, missions: [] },
        { nom: 'Menuiseries et finitions', joursEstimes: 6, equipeMin: 3, materiaux: { Ciment: 15, Sable: 5 }, missions: [] },
      ],
    },
    {
      slug: 'centre-sante-sanpedro', nom: 'Centre de santé — San-Pédro', typeProjet: 'CENTRE_SANTE', budget: 17500000, delaiJours: 38,
      description: "Un établissement de santé avec cloisons techniques et étanchéité renforcée — la précision compte plus que la vitesse. Débloqué au niveau 15.",
      localisation: 'San-Pédro',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations spéciales', joursEstimes: 7, equipeMin: 4, materiaux: { Ciment: 75, Sable: 11, Gravier: 18, 'Fer HA': 65 }, missions: [] },
        { nom: 'Élévation et cloisons techniques', joursEstimes: 10, equipeMin: 4, materiaux: { 'Agglos 15': 2000, Ciment: 55, Sable: 11, 'Fer HA': 30 }, missions: [] },
        { nom: 'Dalle et étanchéité', joursEstimes: 9, equipeMin: 4, materiaux: { Ciment: 65, Sable: 10, Gravier: 16, 'Fer HA': 40, 'Planches coffrage': 35 }, missions: [] },
        { nom: 'Réseaux et finitions', joursEstimes: 12, equipeMin: 3.5, materiaux: { Ciment: 30, Sable: 8 }, missions: [] },
      ],
    },
    {
      slug: 'lotissement-anyama', nom: 'Lotissement — Anyama', typeProjet: 'MAISON', budget: 22000000, delaiJours: 45,
      description: "Six maisons livrées ensemble, avec leur propre voirie interne : la coordination d'équipe devient le vrai défi. Débloqué au niveau 18.",
      localisation: 'Anyama, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Voirie interne et VRD', joursEstimes: 8, equipeMin: 4, materiaux: { Gravier: 50, Sable: 12, Ciment: 20 }, missions: [] },
        { nom: 'Fondations des maisons', joursEstimes: 8, equipeMin: 4.5, materiaux: { Ciment: 80, Sable: 12, Gravier: 20, 'Fer HA': 70 }, missions: [] },
        { nom: 'Élévation des maisons', joursEstimes: 12, equipeMin: 5, materiaux: { 'Agglos 15': 3500, Ciment: 70, Sable: 14, 'Fer HA': 35 }, missions: [] },
        { nom: 'Toitures et charpentes', joursEstimes: 9, equipeMin: 4, materiaux: { Ciment: 25, 'Fer HA': 30, 'Planches coffrage': 60 }, missions: [] },
        { nom: 'Finitions et VRD final', joursEstimes: 8, equipeMin: 3.5, materiaux: { Ciment: 25, Sable: 8 }, missions: [] },
      ],
    },
    {
      slug: 'complexe-industriel-sanpedro', nom: 'Complexe industriel — Zone portuaire San-Pédro', typeProjet: 'INDUSTRIEL', budget: 32000000, delaiJours: 60,
      description: "Le chantier le plus ambitieux du jeu : structure métallique, dalles industrielles, réseaux techniques. Réservé au niveau 20, ou accessible plus tôt aux conducteurs de travaux, ingénieurs structure et gérants confirmés.",
      localisation: 'Zone portuaire, San-Pédro',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Terrassement et fondations lourdes', joursEstimes: 10, equipeMin: 5, materiaux: { Ciment: 120, Sable: 18, Gravier: 30, 'Fer HA': 110 }, missions: [] },
        { nom: 'Structure et charpente métallique', joursEstimes: 14, equipeMin: 5.5, materiaux: { 'Fer HA': 150, 'Planches coffrage': 80, Ciment: 40 }, missions: [] },
        { nom: 'Dalles industrielles', joursEstimes: 12, equipeMin: 5, materiaux: { Ciment: 130, Sable: 20, Gravier: 34, 'Fer HA': 70 }, missions: [] },
        { nom: 'Réseaux techniques et équipements', joursEstimes: 14, equipeMin: 4.5, materiaux: { Ciment: 50, 'Fer HA': 40 }, missions: [] },
        { nom: 'Finitions et mise en service', joursEstimes: 10, equipeMin: 4, materiaux: { Ciment: 30, Sable: 10 }, missions: [] },
      ],
    },
  ];

  for (const c of chantiersGestion) {
    const chantier = await prisma.chantier.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug, nom: c.nom, typeProjet: c.typeProjet, paysId: civ.id,
        clientPnjId: pnjs['client-madame-toure'].id, localisationFictive: c.localisation,
        budget: c.budget, devise: 'FCFA', delaiJours: c.delaiJours, description: c.description, statut: 'DISPONIBLE',
      },
      update: { nom: c.nom, budget: c.budget, delaiJours: c.delaiJours, description: c.description, statut: 'DISPONIBLE' },
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
  const offresData = [
    { titre: 'Stage chantier — Abidjan', profil: 'stagiaire-chantier', niveauMin: 1, reputationMin: 0, test: 'premier-jour-stage' },
    { titre: 'Aide métreur', profil: 'aide-metreur', niveauMin: 1, reputationMin: 30, test: 'metre-mur-cloture' },
    { titre: "Chef d'équipe — Riviera", profil: 'chef-equipe', niveauMin: 3, reputationMin: 40, test: 'retard-livraison-beton' },
    { titre: 'Assistant conducteur de travaux', profil: 'chef-chantier', niveauMin: 5, reputationMin: 55, test: 'chantier-villa-cocody-etape1' },
    { titre: 'Contrôleur qualité junior', profil: 'controleur-qualite', niveauMin: 3, reputationMin: 45, test: 'reception-ferraillage' },
  ];
  for (const o of offresData) {
    const slugSafe = o.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.offreEmploi.findFirst({ where: { titre: o.titre } });
    if (!existing) {
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
  const reglesData = [
    // ── CHANTIER ──
    { source: 'etudiant-chantier', cible: 'stagiaire-chantier', conditions: { niveauMin: 2, competences: [{ slug: 'securite-n1', niveau: 1 }, { slug: 'bases-btp', niveau: 1 }] } },
    { source: 'stagiaire-chantier', cible: 'chef-equipe', conditions: { niveauMin: 4, reputationMin: 40, competences: [{ slug: 'lecture-plans', niveau: 1 }, { slug: 'gestion-humaine', niveau: 1 }] } },
    { source: 'chef-equipe', cible: 'chef-chantier', conditions: { niveauMin: 6, reputationMin: 50, chantiersReussis: 1, competences: [{ slug: 'beton-ferraillage', niveau: 2 }, { slug: 'decision-chantier', niveau: 1 }] } },
    { source: 'chef-chantier', cible: 'conducteur-travaux', conditions: { niveauMin: 9, reputationMin: 60, chantiersReussis: 2, competences: [{ slug: 'decision-chantier', niveau: 3 }], examenMissionId: missions['examen-conducteur-travaux'].id } },

    // ── BUREAU D'ÉTUDES ──
    { source: 'etudiant-be', cible: 'dessinateur-junior', conditions: { niveauMin: 2, competences: [{ slug: 'autocad-lecture', niveau: 1 }, { slug: 'lecture-plans', niveau: 1 }] } },
    { source: 'dessinateur-junior', cible: 'projeteur', conditions: { niveauMin: 4, reputationMin: 40, competences: [{ slug: 'autocad-lecture', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] } },
    { source: 'projeteur', cible: 'ingenieur-structure', conditions: { niveauMin: 7, reputationMin: 55, competences: [{ slug: 'beton-ferraillage', niveau: 3 }, { slug: 'lecture-plans', niveau: 3 }] } },

    // ── BIM ──
    { source: 'etudiant-bim', cible: 'dessinateur-bim', conditions: { niveauMin: 2, competences: [{ slug: 'autocad-lecture', niveau: 1 }, { slug: 'revit-bim', niveau: 1 }] } },
    { source: 'dessinateur-bim', cible: 'bim-modeleur', conditions: { niveauMin: 4, reputationMin: 40, competences: [{ slug: 'revit-bim', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] } },
    { source: 'bim-modeleur', cible: 'bim-coordinateur', conditions: { niveauMin: 7, reputationMin: 55, competences: [{ slug: 'revit-bim', niveau: 3 }, { slug: 'decision-chantier', niveau: 2 }] } },

    // ── MÉTRÉ / ÉCONOMIE ──
    { source: 'etudiant-metre', cible: 'aide-metreur', conditions: { niveauMin: 2, competences: [{ slug: 'metre-devis', niveau: 1 }, { slug: 'excel-btp', niveau: 1 }] } },
    { source: 'aide-metreur', cible: 'metreur-junior', conditions: { niveauMin: 4, reputationMin: 40, competences: [{ slug: 'metre-devis', niveau: 2 }, { slug: 'excel-btp', niveau: 2 }] } },
    { source: 'metreur-junior', cible: 'economiste', conditions: { niveauMin: 7, reputationMin: 55, competences: [{ slug: 'metre-devis', niveau: 3 }, { slug: 'excel-btp', niveau: 3 }] } },

    // ── QUALITÉ / HSE ──
    { source: 'etudiant-qualite', cible: 'assistant-hse', conditions: { niveauMin: 2, competences: [{ slug: 'securite-n1', niveau: 1 }, { slug: 'controle-qualite', niveau: 1 }] } },
    { source: 'assistant-hse', cible: 'controleur-qualite', conditions: { niveauMin: 4, reputationMin: 40, competences: [{ slug: 'controle-qualite', niveau: 2 }, { slug: 'securite-n1', niveau: 2 }] } },
    { source: 'controleur-qualite', cible: 'responsable-hse', conditions: { niveauMin: 7, reputationMin: 55, competences: [{ slug: 'controle-qualite', niveau: 3 }, { slug: 'reception-travaux', niveau: 2 }] } },

    // ── TOPOGRAPHIE ──
    { source: 'aide-topographe', cible: 'topographe-junior', conditions: { niveauMin: 3, competences: [{ slug: 'topographie', niveau: 1 }, { slug: 'lecture-plans', niveau: 1 }] } },
    { source: 'topographe-junior', cible: 'topographe-confirme', conditions: { niveauMin: 6, reputationMin: 50, competences: [{ slug: 'topographie', niveau: 2 }, { slug: 'lecture-plans', niveau: 2 }] } },

    // ── GÉOTECHNIQUE ──
    { source: 'stagiaire-geotech', cible: 'technicien-labo-sol', conditions: { niveauMin: 3, competences: [{ slug: 'geotechnique', niveau: 1 }] } },
    { source: 'technicien-labo-sol', cible: 'ingenieur-geotechnique', conditions: { niveauMin: 6, reputationMin: 50, competences: [{ slug: 'geotechnique', niveau: 2 }, { slug: 'reception-travaux', niveau: 1 }] } },

    // ── ENTREPRENEUR ──
    { source: 'ouvrier-qualifie', cible: 'entrepreneur-debutant', conditions: { niveauMin: 5, reputationMin: 45, chantiersReussis: 1, competences: [{ slug: 'maconnerie', niveau: 2 }, { slug: 'gestion-humaine', niveau: 1 }] } },
    { source: 'entrepreneur-debutant', cible: 'gerant', conditions: { niveauMin: 8, reputationMin: 65, chantiersReussis: 2, competences: [{ slug: 'decision-chantier', niveau: 2 }, { slug: 'metre-devis', niveau: 2 }] } },
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
          reputation: 55,
          argentVirtuel: 15000,
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
