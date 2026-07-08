-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'ECOLE', 'ENTREPRISE');

-- CreateEnum
CREATE TYPE "AdminSubRole" AS ENUM ('SUPER_ADMIN', 'EDITEUR', 'RESPONSABLE_PEDAGOGIQUE', 'GESTIONNAIRE_PAYS', 'SUPPORT', 'GESTIONNAIRE_B2B');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PREMIUM', 'SCHOOL', 'COMPANY');

-- CreateEnum
CREATE TYPE "ProfilFamille" AS ENUM ('CHANTIER', 'BE', 'BIM', 'TOPO', 'GEOTECH', 'METRE', 'QUALITE', 'ENTREPRENEUR');

-- CreateEnum
CREATE TYPE "CarriereEvenementType" AS ENUM ('PROMOTION', 'EMBAUCHE', 'STAGE', 'DIPLOME', 'CREATION_ENTREPRISE', 'CHANTIER_LIVRE');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('QUIZ', 'CHRONO', 'ANALYSE_IMAGE', 'LECTURE_PLAN', 'CALCUL', 'METRE', 'DEVIS', 'RAPPORT', 'DECISION', 'GESTION_HUMAINE', 'SIMULATION_LOGICIEL', 'CONTROLE_QUALITE', 'CHANTIER_COMPLET', 'EXAMEN');

-- CreateEnum
CREATE TYPE "MissionStatut" AS ENUM ('BROUILLON', 'RELECTURE', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCM', 'NUMERIQUE', 'ZONE_IMAGE', 'ORDONNANCEMENT', 'CHOIX_CONSEQUENCE', 'TEXTE');

-- CreateEnum
CREATE TYPE "UserMissionStatut" AS ENUM ('DISPONIBLE', 'EN_COURS', 'REUSSIE', 'ECHOUEE');

-- CreateEnum
CREATE TYPE "ChantierType" AS ENUM ('DALLE', 'CLOTURE', 'CHAMBRE', 'MAISON', 'VILLA', 'R_PLUS_1', 'ECOLE', 'CENTRE_SANTE', 'ROUTE', 'CANIVEAU', 'DALOT', 'INDUSTRIEL', 'URBAIN');

-- CreateEnum
CREATE TYPE "ChantierStatut" AS ENUM ('BROUILLON', 'DISPONIBLE', 'EN_COURS', 'TERMINE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "RessourceType" AS ENUM ('MATERIAU', 'OUVRIER', 'FOURNISSEUR', 'MATERIEL');

-- CreateEnum
CREATE TYPE "LieuSlug" AS ENUM ('ECOLE', 'CENTRE_FORMATION', 'BUREAU_ETUDES', 'CHANTIER', 'ENTREPRISE', 'FOURNISSEUR', 'MAIRIE', 'BANQUE', 'LABORATOIRE', 'BUREAU_CONTROLE', 'DEPOT', 'CLIENT');

-- CreateEnum
CREATE TYPE "PnjRole" AS ENUM ('PROFESSEUR', 'MAITRE_STAGE', 'CHEF_CHANTIER', 'CONDUCTEUR', 'INGENIEUR', 'CLIENT', 'FOURNISSEUR', 'OUVRIER', 'CONTROLEUR', 'HSE', 'RECRUTEUR', 'BANQUIER', 'CONCURRENT', 'ARCHITECTE', 'GEOTECHNICIEN', 'TOPOGRAPHE');

-- CreateEnum
CREATE TYPE "EvenementType" AS ENUM ('DEFI_JOUR', 'DEFI_SEMAINE', 'IMPREVU', 'OPPORTUNITE');

-- CreateEnum
CREATE TYPE "CandidatureStatut" AS ENUM ('ENVOYEE', 'TEST', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "DemandePromotionStatut" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "NormeCategorie" AS ENUM ('CONSTRUCTION', 'BETON', 'ACIER', 'GEOTECHNIQUE', 'ELECTRICITE', 'PLOMBERIE', 'VRD', 'ACCESSIBILITE', 'INCENDIE', 'HSE', 'RECEPTION');

-- CreateEnum
CREATE TYPE "PaysConfigCle" AS ENUM ('APPELLATIONS_METIERS', 'DOCUMENTS_TYPES', 'REGLES_HSE', 'TYPES_CONTRATS', 'TYPES_MARCHES', 'NIVEAUX_QUALIFICATION', 'PROCEDURES_RECEPTION', 'ACTEURS_INSTITUTIONNELS', 'COEFFICIENTS');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'PLAN', 'DOCUMENT', 'DONNEE');

-- CreateEnum
CREATE TYPE "AbonnementStatut" AS ENUM ('ACTIF', 'EXPIRE', 'ANNULE', 'IMPAYE');

-- CreateEnum
CREATE TYPE "AbonnementProvider" AS ENUM ('STRIPE', 'CINETPAY', 'PAYDUNYA', 'WAVE', 'MANUEL');

-- CreateEnum
CREATE TYPE "CompteB2bType" AS ENUM ('ECOLE', 'ENTREPRISE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEFI', 'MESSAGE_PNJ', 'CANDIDATURE', 'RAPPEL_SERIE', 'BADGE', 'PROMOTION', 'SYSTEME');

-- CreateEnum
CREATE TYPE "Rarete" AS ENUM ('BRONZE', 'ARGENT', 'OR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "pseudo" TEXT,
    "paysId" TEXT,
    "ville" TEXT,
    "niveauEtude" TEXT,
    "domaineBtp" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "adminSubRole" "AdminSubRole",
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "banni" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avatar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nomPersonnage" TEXT NOT NULL,
    "style" TEXT,
    "tenue" TEXT,
    "equipement" TEXT,
    "metierRepresente" TEXT,
    "config" JSONB,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profil" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "famille" "ProfilFamille" NOT NULL,
    "niveauDepart" INTEGER NOT NULL DEFAULT 1,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetierCible" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "famille" "ProfilFamille" NOT NULL,

    CONSTRAINT "MetierCible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCarriere" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profilActuelId" TEXT,
    "metierCibleId" TEXT,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "argentVirtuel" INTEGER NOT NULL DEFAULT 0,
    "ancienneteVirtuelleJours" INTEGER NOT NULL DEFAULT 0,
    "referentielPaysId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCarriere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarriereHistorique" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CarriereEvenementType" NOT NULL,
    "profilId" TEXT,
    "dateVirtuelle" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB,

    CONSTRAINT "CarriereHistorique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcours" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "etapes" JSONB NOT NULL,
    "etapeCourante" INTEGER NOT NULL DEFAULT 0,
    "genereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parcours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competence" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,
    "description" TEXT,
    "icone" TEXT,

    CONSTRAINT "Competence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetenceNiveau" (
    "id" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL,
    "criteres" TEXT,
    "xpRequis" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CompetenceNiveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompetence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competenceId" TEXT NOT NULL,
    "niveauActuel" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "valideeLe" TIMESTAMP(3),
    "source" TEXT,

    CONSTRAINT "UserCompetence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleAcademie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "illustrationId" TEXT,
    "publie" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ModuleAcademie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cours" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" JSONB NOT NULL,
    "quizMissionId" TEXT,
    "missionPratiqueId" TEXT,
    "competenceId" TEXT,
    "dureeMin" INTEGER,

    CONSTRAINT "Cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logiciel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,

    CONSTRAINT "Logiciel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciceLogiciel" (
    "id" TEXT NOT NULL,
    "logicielId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "typeSimulation" TEXT NOT NULL,
    "config" JSONB,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "competenceId" TEXT,

    CONSTRAINT "ExerciceLogiciel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLogiciel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "logicielId" TEXT NOT NULL,
    "niveauMaitrise" INTEGER NOT NULL DEFAULT 0,
    "valideLe" TIMESTAMP(3),

    CONSTRAINT "UserLogiciel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "MissionType" NOT NULL,
    "profils" JSONB,
    "niveauRequis" INTEGER NOT NULL DEFAULT 1,
    "competences" JSONB,
    "chantierId" TEXT,
    "dureeLimiteSec" INTEGER,
    "scoreMax" INTEGER NOT NULL DEFAULT 100,
    "conditionReussite" INTEGER NOT NULL DEFAULT 60,
    "badgeId" TEXT,
    "statut" "MissionStatut" NOT NULL DEFAULT 'BROUILLON',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionContenu" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "typeQuestion" "QuestionType" NOT NULL,
    "enonce" TEXT NOT NULL,
    "medias" JSONB,
    "options" JSONB,
    "bonnesReponses" JSONB,
    "tolerance" DOUBLE PRECISION,
    "correctionPedagogique" TEXT,
    "consequences" JSONB,

    CONSTRAINT "MissionContenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionVariantePays" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "surcharges" JSONB NOT NULL,

    CONSTRAINT "MissionVariantePays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "statut" "UserMissionStatut" NOT NULL DEFAULT 'DISPONIBLE',
    "score" INTEGER,
    "tempsUtiliseSec" INTEGER,
    "reponses" JSONB,
    "erreurs" JSONB,
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "meilleurScore" INTEGER,
    "termineeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chantier" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeProjet" "ChantierType" NOT NULL,
    "paysId" TEXT,
    "clientPnjId" TEXT,
    "localisationFictive" TEXT,
    "budget" INTEGER NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "delaiJours" INTEGER NOT NULL,
    "description" TEXT,
    "statut" "ChantierStatut" NOT NULL DEFAULT 'BROUILLON',

    CONSTRAINT "Chantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChantierPhase" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "documents" JSONB,

    CONSTRAINT "ChantierPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChantierRessource" (
    "id" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "type" "RessourceType" NOT NULL,
    "ref" JSONB NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "coutUnitaire" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ChantierRessource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imprevu" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "declencheur" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "consequences" JSONB NOT NULL,
    "paysId" TEXT,

    CONSTRAINT "Imprevu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChantier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chantierId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "phaseCourante" INTEGER NOT NULL DEFAULT 0,
    "budgetRestant" INTEGER NOT NULL,
    "joursRestants" INTEGER NOT NULL,
    "qualite" INTEGER NOT NULL DEFAULT 100,
    "securite" INTEGER NOT NULL DEFAULT 100,
    "moralEquipe" INTEGER NOT NULL DEFAULT 100,
    "avancementPct" INTEGER NOT NULL DEFAULT 0,
    "evenementsLog" JSONB,
    "noteFinale" TEXT,
    "termineLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChantier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OuvrierVirtuel" (
    "id" TEXT NOT NULL,
    "userChantierId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "competence" INTEGER NOT NULL DEFAULT 50,
    "fatigue" INTEGER NOT NULL DEFAULT 0,
    "motivation" INTEGER NOT NULL DEFAULT 80,
    "rendement" INTEGER NOT NULL DEFAULT 80,
    "historique" JSONB,

    CONSTRAINT "OuvrierVirtuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lieu" (
    "id" TEXT NOT NULL,
    "slug" "LieuSlug" NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "illustrationId" TEXT,
    "actions" JSONB,

    CONSTRAINT "Lieu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pnj" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "PnjRole" NOT NULL,
    "avatarId" TEXT,
    "personnalite" JSONB,

    CONSTRAINT "Pnj_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PnjMessage" (
    "id" TEXT NOT NULL,
    "pnjId" TEXT NOT NULL,
    "declencheur" JSONB NOT NULL,
    "contenu" TEXT NOT NULL,
    "actionsProposees" JSONB,

    CONSTRAINT "PnjMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pnjId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "actions" JSONB,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" TEXT NOT NULL,
    "type" "EvenementType" NOT NULL,
    "config" JSONB NOT NULL,
    "actifDu" TIMESTAMP(3),
    "actifAu" TIMESTAMP(3),

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "iconeId" TEXT,
    "conditions" JSONB NOT NULL,
    "rarete" "Rarete" NOT NULL DEFAULT 'BRONZE',

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "obtenuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "missionSourceId" TEXT,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificat" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "templatePdfId" TEXT,
    "premiumRequis" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Certificat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCertificat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificatId" TEXT NOT NULL,
    "numeroUnique" TEXT NOT NULL,
    "delivreLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urlVerification" TEXT,

    CONSTRAINT "UserCertificat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvVirtuel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contenu" JSONB NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvVirtuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffreEmploi" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "paysId" TEXT,
    "description" TEXT,
    "profilRechercheId" TEXT,
    "competencesRequises" JSONB,
    "logicielsRequis" JSONB,
    "niveauMin" INTEGER NOT NULL DEFAULT 1,
    "chantiersRequis" INTEGER NOT NULL DEFAULT 0,
    "reputationMin" INTEGER NOT NULL DEFAULT 0,
    "testEntreeMissionId" TEXT,
    "entrepriseFictive" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'publiee',
    "publieeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffreEmploi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offreId" TEXT NOT NULL,
    "statut" "CandidatureStatut" NOT NULL DEFAULT 'ENVOYEE',
    "scoreTest" INTEGER,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglePromotion" (
    "id" TEXT NOT NULL,
    "profilSourceId" TEXT NOT NULL,
    "profilCibleId" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "examenMissionId" TEXT,

    CONSTRAINT "ReglePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandePromotion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "regleId" TEXT NOT NULL,
    "statut" "DemandePromotionStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "evaluation" JSONB,
    "decideeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepriseVirtuelle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "capitalVirtuel" INTEGER NOT NULL DEFAULT 0,
    "employes" JSONB,
    "chantiersEnCours" JSONB,
    "reputationEntreprise" INTEGER NOT NULL DEFAULT 50,
    "creeeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseVirtuelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pays" (
    "id" TEXT NOT NULL,
    "codeIso" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "monnaie" TEXT NOT NULL,
    "symboleMonnaie" TEXT NOT NULL,
    "systemeUnites" TEXT NOT NULL DEFAULT 'metrique',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferentielNorme" (
    "id" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "categorie" "NormeCategorie" NOT NULL,
    "nomNorme" TEXT NOT NULL,
    "resumePedagogique" TEXT,
    "details" JSONB,

    CONSTRAINT "ReferentielNorme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaysConfig" (
    "id" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "cle" "PaysConfigCle" NOT NULL,
    "valeur" JSONB NOT NULL,

    CONSTRAINT "PaysConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BibliothequePrix" (
    "id" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prixIndicatif" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibliothequePrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriauPays" (
    "id" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "materiau" TEXT NOT NULL,
    "disponibilite" TEXT,
    "prixIndicatif" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "MateriauPays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "categorie" TEXT,
    "titre" TEXT NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" JSONB,
    "paysId" TEXT,
    "licence" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonnement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "statut" "AbonnementStatut" NOT NULL DEFAULT 'ACTIF',
    "provider" "AbonnementProvider" NOT NULL,
    "providerRef" TEXT,
    "debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "montant" INTEGER NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',

    CONSTRAINT "Abonnement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteB2b" (
    "id" TEXT NOT NULL,
    "type" "CompteB2bType" NOT NULL,
    "nom" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "licencesTotal" INTEGER NOT NULL DEFAULT 0,
    "licencesUtilisees" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,

    CONSTRAINT "CompteB2b_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "B2bMembre" (
    "id" TEXT NOT NULL,
    "compteB2bId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupe" TEXT,
    "role" TEXT,

    CONSTRAINT "B2bMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "lien" TEXT,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "pushEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageCms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" JSONB NOT NULL,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageCms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PhaseMissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_userId_key" ON "Avatar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profil_slug_key" ON "Profil"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MetierCible_slug_key" ON "MetierCible"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserCarriere_userId_key" ON "UserCarriere"("userId");

-- CreateIndex
CREATE INDEX "CarriereHistorique_userId_idx" ON "CarriereHistorique"("userId");

-- CreateIndex
CREATE INDEX "Parcours_userId_idx" ON "Parcours"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Competence_slug_key" ON "Competence"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceNiveau_competenceId_niveau_key" ON "CompetenceNiveau"("competenceId", "niveau");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompetence_userId_competenceId_key" ON "UserCompetence"("userId", "competenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAcademie_slug_key" ON "ModuleAcademie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Logiciel_slug_key" ON "Logiciel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserLogiciel_userId_logicielId_key" ON "UserLogiciel"("userId", "logicielId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_slug_key" ON "Mission"("slug");

-- CreateIndex
CREATE INDEX "Mission_statut_niveauRequis_idx" ON "Mission"("statut", "niveauRequis");

-- CreateIndex
CREATE INDEX "MissionContenu_missionId_idx" ON "MissionContenu"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionVariantePays_missionId_paysId_key" ON "MissionVariantePays"("missionId", "paysId");

-- CreateIndex
CREATE INDEX "UserMission_userId_statut_idx" ON "UserMission"("userId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "UserMission_userId_missionId_key" ON "UserMission"("userId", "missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Chantier_slug_key" ON "Chantier"("slug");

-- CreateIndex
CREATE INDEX "UserChantier_userId_idx" ON "UserChantier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lieu_slug_key" ON "Lieu"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pnj_slug_key" ON "Pnj"("slug");

-- CreateIndex
CREATE INDEX "UserMessage_userId_lu_idx" ON "UserMessage"("userId", "lu");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificat_slug_key" ON "Certificat"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserCertificat_numeroUnique_key" ON "UserCertificat"("numeroUnique");

-- CreateIndex
CREATE UNIQUE INDEX "CvVirtuel_userId_key" ON "CvVirtuel"("userId");

-- CreateIndex
CREATE INDEX "Candidature_userId_idx" ON "Candidature"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pays_codeIso_key" ON "Pays"("codeIso");

-- CreateIndex
CREATE UNIQUE INDEX "PaysConfig_paysId_cle_key" ON "PaysConfig"("paysId", "cle");

-- CreateIndex
CREATE UNIQUE INDEX "B2bMembre_userId_key" ON "B2bMembre"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_lue_idx" ON "Notification"("userId", "lue");

-- CreateIndex
CREATE INDEX "AuditLog_entite_entiteId_idx" ON "AuditLog"("entite", "entiteId");

-- CreateIndex
CREATE UNIQUE INDEX "PageCms_slug_key" ON "PageCms"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_PhaseMissions_AB_unique" ON "_PhaseMissions"("A", "B");

-- CreateIndex
CREATE INDEX "_PhaseMissions_B_index" ON "_PhaseMissions"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCarriere" ADD CONSTRAINT "UserCarriere_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCarriere" ADD CONSTRAINT "UserCarriere_profilActuelId_fkey" FOREIGN KEY ("profilActuelId") REFERENCES "Profil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCarriere" ADD CONSTRAINT "UserCarriere_metierCibleId_fkey" FOREIGN KEY ("metierCibleId") REFERENCES "MetierCible"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCarriere" ADD CONSTRAINT "UserCarriere_referentielPaysId_fkey" FOREIGN KEY ("referentielPaysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarriereHistorique" ADD CONSTRAINT "CarriereHistorique_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarriereHistorique" ADD CONSTRAINT "CarriereHistorique_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcours" ADD CONSTRAINT "Parcours_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetenceNiveau" ADD CONSTRAINT "CompetenceNiveau_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompetence" ADD CONSTRAINT "UserCompetence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompetence" ADD CONSTRAINT "UserCompetence_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAcademie" ADD CONSTRAINT "ModuleAcademie_illustrationId_fkey" FOREIGN KEY ("illustrationId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ModuleAcademie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_quizMissionId_fkey" FOREIGN KEY ("quizMissionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_missionPratiqueId_fkey" FOREIGN KEY ("missionPratiqueId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cours" ADD CONSTRAINT "Cours_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciceLogiciel" ADD CONSTRAINT "ExerciceLogiciel_logicielId_fkey" FOREIGN KEY ("logicielId") REFERENCES "Logiciel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciceLogiciel" ADD CONSTRAINT "ExerciceLogiciel_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLogiciel" ADD CONSTRAINT "UserLogiciel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLogiciel" ADD CONSTRAINT "UserLogiciel_logicielId_fkey" FOREIGN KEY ("logicielId") REFERENCES "Logiciel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionContenu" ADD CONSTRAINT "MissionContenu_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionVariantePays" ADD CONSTRAINT "MissionVariantePays_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionVariantePays" ADD CONSTRAINT "MissionVariantePays_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chantier" ADD CONSTRAINT "Chantier_clientPnjId_fkey" FOREIGN KEY ("clientPnjId") REFERENCES "Pnj"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChantierPhase" ADD CONSTRAINT "ChantierPhase_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChantierRessource" ADD CONSTRAINT "ChantierRessource_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imprevu" ADD CONSTRAINT "Imprevu_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChantier" ADD CONSTRAINT "UserChantier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChantier" ADD CONSTRAINT "UserChantier_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OuvrierVirtuel" ADD CONSTRAINT "OuvrierVirtuel_userChantierId_fkey" FOREIGN KEY ("userChantierId") REFERENCES "UserChantier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lieu" ADD CONSTRAINT "Lieu_illustrationId_fkey" FOREIGN KEY ("illustrationId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PnjMessage" ADD CONSTRAINT "PnjMessage_pnjId_fkey" FOREIGN KEY ("pnjId") REFERENCES "Pnj"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessage" ADD CONSTRAINT "UserMessage_pnjId_fkey" FOREIGN KEY ("pnjId") REFERENCES "Pnj"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_iconeId_fkey" FOREIGN KEY ("iconeId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificat" ADD CONSTRAINT "Certificat_templatePdfId_fkey" FOREIGN KEY ("templatePdfId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertificat" ADD CONSTRAINT "UserCertificat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertificat" ADD CONSTRAINT "UserCertificat_certificatId_fkey" FOREIGN KEY ("certificatId") REFERENCES "Certificat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvVirtuel" ADD CONSTRAINT "CvVirtuel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffreEmploi" ADD CONSTRAINT "OffreEmploi_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffreEmploi" ADD CONSTRAINT "OffreEmploi_profilRechercheId_fkey" FOREIGN KEY ("profilRechercheId") REFERENCES "Profil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffreEmploi" ADD CONSTRAINT "OffreEmploi_testEntreeMissionId_fkey" FOREIGN KEY ("testEntreeMissionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidature" ADD CONSTRAINT "Candidature_offreId_fkey" FOREIGN KEY ("offreId") REFERENCES "OffreEmploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglePromotion" ADD CONSTRAINT "ReglePromotion_profilSourceId_fkey" FOREIGN KEY ("profilSourceId") REFERENCES "Profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglePromotion" ADD CONSTRAINT "ReglePromotion_profilCibleId_fkey" FOREIGN KEY ("profilCibleId") REFERENCES "Profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandePromotion" ADD CONSTRAINT "DemandePromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandePromotion" ADD CONSTRAINT "DemandePromotion_regleId_fkey" FOREIGN KEY ("regleId") REFERENCES "ReglePromotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseVirtuelle" ADD CONSTRAINT "EntrepriseVirtuelle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferentielNorme" ADD CONSTRAINT "ReferentielNorme_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaysConfig" ADD CONSTRAINT "PaysConfig_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BibliothequePrix" ADD CONSTRAINT "BibliothequePrix_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriauPays" ADD CONSTRAINT "MateriauPays_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abonnement" ADD CONSTRAINT "Abonnement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteB2b" ADD CONSTRAINT "CompteB2b_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2bMembre" ADD CONSTRAINT "B2bMembre_compteB2bId_fkey" FOREIGN KEY ("compteB2bId") REFERENCES "CompteB2b"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "B2bMembre" ADD CONSTRAINT "B2bMembre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhaseMissions" ADD CONSTRAINT "_PhaseMissions_A_fkey" FOREIGN KEY ("A") REFERENCES "ChantierPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PhaseMissions" ADD CONSTRAINT "_PhaseMissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
