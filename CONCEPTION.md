# BTP Life — Conception Complète de la Plateforme

**Le simulateur de carrière et de vie professionnelle dans le BTP**
*Choisis ton métier. Apprends. Travaille. Évolue. Construis ta carrière.*

Module chantiers virtuels : **BTP Simulator**

---

## Sommaire

1. Architecture fonctionnelle du site
2. Liste complète des pages
3. Parcours utilisateur
4. Parcours administrateur
5. Structure de base de données
6. Modules à développer
7. Système de rôles et permissions
8. Système de missions
9. Système de progression
10. Système de score
11. Système de badges et certificats
12. Système de CV virtuel
13. Système d'offres et promotions
14. Système d'adaptation aux normes par pays
15. Conception PWA mobile
16. Maquettes UX/UI recommandées
17. Stack technique recommandée
18. Plan de développement
19. Checklist de lancement

---

# 1. Architecture fonctionnelle du site

## 1.1 Vue d'ensemble

BTP Life est organisé en **quatre couches fonctionnelles** :

```
┌─────────────────────────────────────────────────────────────┐
│  COUCHE PRÉSENTATION                                        │
│  Site vitrine · App utilisateur (PWA) · Back-office admin   │
├─────────────────────────────────────────────────────────────┤
│  COUCHE MOTEURS DE JEU                                      │
│  Moteur de missions · Moteur de progression · Moteur de     │
│  score · Moteur de normes pays · Moteur d'événements/PNJ    │
│  Moteur économique (argent virtuel) · Moteur de réputation  │
├─────────────────────────────────────────────────────────────┤
│  COUCHE SERVICES                                            │
│  Auth & rôles · CV virtuel · Offres/Promotions · Académies  │
│  Chantiers · Notifications · Paiement · Analytics · Médias  │
├─────────────────────────────────────────────────────────────┤
│  COUCHE DONNÉES                                             │
│  Base relationnelle · Stockage fichiers (plans, images,     │
│  documents) · Cache · File de tâches · Logs                 │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 Domaines fonctionnels

| Domaine | Rôle | Dépendances |
|---|---|---|
| **Identité & Onboarding** | Compte, avatar, profil actuel, métier cible, pays/référentiel | Auth, Normes pays |
| **Carrière (RPG)** | Niveau, XP, réputation, argent virtuel, ancienneté, historique | Progression, Score |
| **Académie BTP** | Cours, modules, quiz, compétences théoriques | Missions, Normes pays |
| **Académie Logiciels** | Simulations Word/Excel/AutoCAD/Revit/MS Project… | Missions, Compétences |
| **BTP Simulator** | Chantiers virtuels, phases, imprévus, équipes, budget | Missions, Gestion humaine, Économie |
| **Moteur de missions** | Missions, tests chronométrés, examens, corrections | Toutes les autres briques |
| **Monde virtuel** | Lieux (école, bureau d'études, mairie, banque…), PNJ, messages, événements | Missions, Carrière |
| **Emploi & Promotion** | Offres virtuelles, candidatures, tests d'entrée, promotions | CV, Compétences, Réputation |
| **CV virtuel** | Agrégation automatique de toute la carrière | Tous les domaines |
| **Référentiel pays** | Normes, unités, monnaies, prix, documents types, HSE | Administrable |
| **Back-office** | CRUD complet de tous les contenus sans recoder | Tous les domaines |
| **Monétisation** | Gratuit / Premium / Écoles / Entreprises / Certifications | Paiement, Rôles |

## 1.3 Logique centrale du produit

Tout tourne autour d'une boucle de jeu :

**Apprendre (Académie) → Pratiquer (Mission) → Être évalué (Score) → Progresser (XP, compétences, réputation) → Débloquer (chantiers, offres, promotions, spécialisations) → Choisir sa suite (école, emploi, entreprise) → Recommencer à un niveau supérieur.**

Chaque contenu (cours, mission, chantier, offre) est relié à : un ou plusieurs **profils**, un **niveau minimum**, des **compétences**, et une éventuelle **variante pays**.

---

# 2. Liste complète des pages

## 2.1 Site public (non connecté)

| Page | URL | Contenu clé |
|---|---|---|
| Accueil | `/` | Hero, concept, 4 étapes, cartes profils, apprentissage fun, PWA, CTA final |
| Découvrir les métiers | `/metiers` | 18+ cartes profils, filtres par domaine (chantier, BE, BIM, topo, géotech…) |
| Détail métier / parcours | `/metiers/:slug` | Description, parcours type, compétences, logiciels, salaire indicatif virtuel |
| BTP Simulator (présentation) | `/simulator` | Démo visuelle des chantiers virtuels |
| Académie (présentation) | `/academie` | Aperçu des modules BTP et logiciels |
| Tarifs | `/tarifs` | Gratuit, Premium, Écoles, Entreprises, Certifications |
| Écoles | `/ecoles` | Offre B2B éducation, démo, contact |
| Entreprises | `/entreprises` | Offre B2B entreprise, cas d'usage formation |
| Blog / Actualités | `/blog` | SEO, conseils carrière BTP |
| Contact | `/contact` | Formulaire + support |
| Connexion | `/connexion` | Email/mot de passe, réinitialisation |
| Inscription | `/inscription` | Formulaire complet (§6 du cahier des charges) |
| CGU | `/cgu` | Conditions générales |
| Confidentialité | `/confidentialite` | RGPD et équivalents locaux |
| Mentions légales | `/mentions-legales` | Éditeur, hébergeur |
| Cookies | `/cookies` | Politique cookies |
| Avertissement pédagogique | `/avertissement` | Mention obligatoire simulateur pédagogique |
| 404 / erreur | `*` | Page thématisée chantier ("zone en travaux") |

## 2.2 Application utilisateur (connecté)

| Page | URL | Contenu clé |
|---|---|---|
| Onboarding | `/onboarding` | 4 étapes : avatar → profil actuel → métier cible → génération parcours |
| Tableau de bord | `/app` | Vue carrière complète (§8 du cahier des charges) |
| Mon parcours | `/app/parcours` | Arbre de carrière, étape actuelle, embranchements possibles |
| Académie BTP | `/app/academie` | Liste des modules avec progression |
| Module de cours | `/app/academie/:module` | Mini-cours, illustrations, quiz, mission pratique |
| Académie Logiciels | `/app/logiciels` | 18 logiciels, niveaux par logiciel |
| Simulation logiciel | `/app/logiciels/:slug/:exercice` | Interface simulée (Excel BTP, rapport Word, plan PDF…) |
| Missions | `/app/missions` | Missions disponibles/en cours/terminées, filtres |
| Mission (jeu) | `/app/missions/:id` | Écran de mission interactif, chrono éventuel |
| Résultat mission | `/app/missions/:id/resultat` | Score, correction, badge, encouragement, CTA suivants |
| Chantiers | `/app/chantiers` | Chantiers accessibles, en cours, réalisés |
| Chantier (jeu) | `/app/chantiers/:id` | Phases, équipe, budget, planning, imprévus, missions liées |
| Gestion d'équipe | `/app/chantiers/:id/equipe` | Ouvriers, moral, rendement, conflits, décisions RH |
| Monde virtuel | `/app/monde` | Carte des lieux (école, BE, mairie, banque, labo, fournisseur…) |
| Lieu virtuel | `/app/monde/:lieu` | Actions contextuelles, PNJ présents |
| Messagerie | `/app/messages` | Messages des PNJ (mentor, recruteur, client, maître de stage…) |
| CV virtuel | `/app/cv` | CV auto-généré, export PDF |
| Offres d'emploi | `/app/offres` | Liste filtrée par pays/profil, candidature, test d'entrée |
| Candidature | `/app/offres/:id/candidature` | CV envoyé, test, résultat, feedback si refus |
| Promotions | `/app/promotions` | Promotions possibles, conditions, demande |
| Badges & certificats | `/app/recompenses` | Galerie badges, certificats téléchargeables |
| Compétences | `/app/competences` | Arbre de compétences par domaine et niveau |
| Mon entreprise | `/app/entreprise` | Création/gestion entreprise virtuelle (parcours entrepreneur) |
| Défis | `/app/defis` | Défis journaliers et hebdomadaires |
| Classements | `/app/classements` | Ligues par pays, école, profil (optionnel v1) |
| Profil & paramètres | `/app/parametres` | Compte, avatar, pays/référentiel, notifications, abonnement |
| Abonnement | `/app/abonnement` | Plan actuel, upgrade, factures |
| Aide & support | `/app/aide` | FAQ, tutoriels, contact support |

## 2.3 Back-office administrateur

| Page | Fonction |
|---|---|
| `/admin` | Dashboard : KPIs (inscrits, missions jouées, taux réussite, revenus) |
| `/admin/utilisateurs` | Gestion utilisateurs, rôles, abonnements, bannissements |
| `/admin/profils-metiers` | Profils, métiers, droits, parcours de carrière |
| `/admin/competences` | Arbre de compétences, niveaux, prérequis |
| `/admin/pays` | Référentiels pays : normes, unités, monnaies, prix, documents, HSE |
| `/admin/academie` | Modules, cours, quiz, illustrations |
| `/admin/logiciels` | Logiciels simulés, exercices |
| `/admin/missions` | Éditeur de missions complet (§18 du cahier des charges) |
| `/admin/chantiers` | Éditeur de chantiers virtuels, phases, imprévus |
| `/admin/pnj` | Personnages non joueurs, scripts de messages, événements |
| `/admin/imprévus` | Bibliothèque d'imprévus et conséquences |
| `/admin/badges` | Badges, certificats, conditions d'obtention |
| `/admin/offres` | Offres d'emploi virtuelles, tests d'entrée |
| `/admin/promotions` | Règles de promotion par profil |
| `/admin/medias` | Banque d'images, plans, documents, données |
| `/admin/abonnements` | Plans, prix, codes promo, comptes écoles/entreprises |
| `/admin/pages` | CMS pages du site (accueil, légal, blog) |
| `/admin/analytics` | Statistiques d'usage, entonnoirs, taux de complétion |
| `/admin/logs` | Logs d'erreurs et d'audit |

## 2.4 Espaces B2B

| Page | Fonction |
|---|---|
| `/ecole/dashboard` | Suivi des étudiants, classes, examens, challenges inter-classes |
| `/ecole/classes/:id` | Progression détaillée par étudiant |
| `/entreprise/dashboard` | Suivi des employés, tests de compétences, campagnes de formation |

---

# 3. Parcours utilisateur

## 3.1 Parcours d'acquisition (visiteur → inscrit)

1. Arrivée sur l'accueil → effet "wow" visuel (hero terre cuite/graphite, chantier stylisé).
2. Scroll : concept RPG → 4 étapes → cartes métiers → apprentissage fun → PWA.
3. Clic **Commencer l'aventure** ou **Découvrir les métiers** → exploration d'un parcours métier → CTA **Créer mon compte gratuitement**.
4. Inscription : nom, prénom/pseudo, email, mot de passe, pays, ville, niveau d'étude, domaine BTP, profil actuel, métier cible.
5. Email de vérification → redirection onboarding.

## 3.2 Onboarding (4 étapes, ~5 minutes)

**Étape 1 — Avatar** : nom du personnage, style, tenue, équipement discret (casque, gilet), métier représenté. Prévisualisation en direct.

**Étape 2 — Profil actuel** : sélection parmi les ~29 profils (étudiant BTP → chef de projet), avec description et niveau de départ associé.

**Étape 3 — Métier cible** : sélection de l'objectif de carrière ; le système affiche la distance estimée (nombre d'étapes, compétences à acquérir).

**Étape 4 — Génération du parcours** : affichage de l'arbre de carrière personnalisé avec embranchements. Exemple :
Étudiant → Stagiaire → Technicien junior → Chef d'équipe → Chef chantier junior → Chef chantier confirmé → Assistant conducteur → Conducteur de travaux.
Écran de bienvenue du **mentor virtuel** + première mission d'introduction proposée immédiatement (règle d'or : l'utilisateur joue sa première mission dans les 3 minutes après l'inscription).

## 3.3 Boucle quotidienne type

1. Ouverture (PWA mobile ou web) → tableau de bord : "Où j'en suis, que faire aujourd'hui ?"
2. Défi journalier (2–5 min) → XP + argent virtuel.
3. Message d'un PNJ (mentor, maître de stage, client) → nouvelle mission ou imprévu.
4. Mission ou session de cours (5–20 min) → écran de résultat → correction → badge éventuel.
5. Progression visible : jauge XP, compétence débloquée, notification "tu es proche du niveau suivant".

## 3.4 Moments de carrière (embranchements)

Après chaque étape majeure (fin de stage, examen réussi, chantier livré), écran de choix :

**Continuer ma formation · Postuler à une offre · Faire un autre stage · Me spécialiser · Améliorer mes logiciels · Demander une promotion · Créer mon entreprise · Voir mon CV virtuel**

Chaque choix modifie le parcours (l'arbre est recalculé) mais reste réversible : la liberté de parcours est un pilier du produit.

## 3.5 Parcours types (résumés)

- **Chantier** : Étudiant → Stagiaire → Chef d'équipe → Chef chantier → Conducteur de travaux
- **Bureau d'études** : Étudiant → Dessinateur junior → Projeteur → Ingénieur structure → Chef de projet technique
- **BIM** : Étudiant → Dessinateur → AutoCAD → Revit → BIM modeleur → BIM coordinateur
- **Topographie** : Étudiant → Aide topographe → Topographe junior → confirmé → Responsable topographie
- **Géotechnique** : Étudiant → Stagiaire géotech → Technicien labo sol → Ingénieur géotechnique → Expert
- **Métré/Devis** : Étudiant → Aide métreur → Métreur junior → Économiste → Chargé d'études de prix
- **Qualité/HSE** : Stagiaire → Assistant HSE → Contrôleur qualité → Responsable qualité/HSE
- **Entrepreneur** : Ouvrier/technicien/chef chantier → Entrepreneur débutant → Gérant → Multi-chantiers

## 3.6 Parcours de refus (pédagogie de l'échec)

Candidature refusée ou test échoué → jamais de cul-de-sac :
score détaillé → explication des manques ("Il te manque : Lecture de plans niveau 2, 1 chantier observé") → plan d'action recommandé avec liens directs vers les cours/missions concernés → bouton **Réessayer** disponible après complétion.

---

# 4. Parcours administrateur

## 4.1 Rôles du back-office

| Rôle admin | Droits |
|---|---|
| **Super-admin** | Tout, y compris rôles admin, paiements, suppression |
| **Éditeur de contenu** | Cours, missions, chantiers, médias, PNJ (création/édition, pas de publication) |
| **Responsable pédagogique** | Validation/publication des contenus, corrections, barèmes |
| **Gestionnaire pays** | Référentiel normes d'un ou plusieurs pays uniquement |
| **Support** | Lecture utilisateurs, réinitialisations, tickets |
| **Gestionnaire B2B** | Comptes écoles/entreprises, licences |

## 4.2 Workflow de création d'une mission (exemple central)

1. **Créer** : titre, description, type (quiz, chrono, lecture de plan, calcul, décision…), profil(s), niveau requis, compétences visées, chantier lié éventuel.
2. **Attacher les médias** : images, plans, documents, données techniques depuis la banque de contenus.
3. **Construire les questions** : QCM, saisies numériques avec tolérance, zones cliquables sur image/plan, ordonnancement, choix à conséquences.
4. **Définir corrections & conséquences** : explication pédagogique par réponse, impact sur score, réputation, moral d'équipe, budget.
5. **Variantes pays** : surcharge des unités, prix, normes citées, documents pour chaque référentiel actif.
6. **Prévisualiser** en tant qu'utilisateur (mode test).
7. **Publier** (statuts : brouillon → relecture → publié → archivé) avec versioning.

Le même workflow (créer → médias → paramètres → variantes pays → prévisualiser → publier) s'applique aux cours, chantiers, offres, badges et PNJ.

## 4.3 Workflow référentiel pays

1. Dupliquer un pays existant comme base (ex. Côte d'Ivoire → Burkina Faso).
2. Ajuster : monnaie, unités, appellations métiers, bibliothèque de prix, documents types, règles HSE, procédures de réception, coefficients.
3. Marquer les missions nécessitant une variante spécifique (le système liste automatiquement les contenus sans variante).
4. Activer le pays → il apparaît à l'inscription.

## 4.4 Supervision

Dashboard admin : inscriptions/jour, missions jouées, taux de réussite par mission (détection des missions trop dures/faciles), taux de complétion onboarding, conversion gratuit→premium, contenus les plus abandonnés, erreurs techniques.

---

# 5. Structure de base de données

Base relationnelle (PostgreSQL). Champs JSONB pour les contenus flexibles (questions, variantes pays). Notation : `PK` clé primaire, `FK` clé étrangère.

## 5.1 Identité et carrière

```
users
  id PK, email UNIQUE, password_hash, nom, pseudo, pays_id FK,
  ville, niveau_etude, domaine_btp, role (user/admin/ecole/entreprise),
  plan (free/premium/school/company), email_verified, created_at

avatars
  id PK, user_id FK UNIQUE, nom_personnage, style, tenue,
  equipement, metier_represente, config JSONB

profils            -- catalogue des ~29 profils (stagiaire, ingénieur…)
  id PK, slug, nom, description, famille (chantier/BE/BIM/topo/geotech/
  metre/qualite/entrepreneur), niveau_depart, ordre

metiers_cibles
  id PK, slug, nom, description, famille

user_carriere      -- état RPG de l'utilisateur
  id PK, user_id FK UNIQUE, profil_actuel_id FK, metier_cible_id FK,
  niveau, xp, reputation, argent_virtuel, anciennete_virtuelle_jours,
  referentiel_pays_id FK, updated_at

carriere_historique
  id PK, user_id FK, type (promotion/embauche/stage/diplome/creation_
  entreprise), profil_id FK, date_virtuelle, details JSONB

parcours           -- arbre de carrière généré
  id PK, user_id FK, etapes JSONB (graph : nœuds profils + conditions),
  etape_courante, genere_le
```

## 5.2 Compétences et apprentissage

```
competences
  id PK, slug, nom, domaine, description, icone

competence_niveaux
  id PK, competence_id FK, niveau (1..5), criteres, xp_requis

user_competences
  id PK, user_id FK, competence_id FK, niveau_actuel, xp,
  validee_le, source (mission/cours/examen)

modules_academie
  id PK, slug, titre, domaine, ordre, illustration_id FK, publie

cours
  id PK, module_id FK, titre, contenu JSONB (blocs texte/image/exemple),
  quiz_id FK, mission_pratique_id FK, competence_id FK, duree_min

logiciels
  id PK, slug (word/excel/autocad/revit/msproject…), nom, categorie

exercices_logiciels
  id PK, logiciel_id FK, titre, type_simulation, config JSONB,
  niveau, competence_id FK

user_logiciels
  id PK, user_id FK, logiciel_id FK, niveau_maitrise, valide_le
```

## 5.3 Missions et évaluation

```
missions
  id PK, slug, titre, description, type (quiz/chrono/analyse_image/
  lecture_plan/calcul/metre/devis/rapport/decision/gestion_humaine/
  simulation_logiciel/controle_qualite/chantier_complet/examen),
  profils JSONB, niveau_requis, competences JSONB, chantier_id FK NULL,
  duree_limite_sec NULL, score_max, condition_reussite,
  badge_id FK NULL, statut (brouillon/relecture/publie/archive),
  version, created_by FK

mission_contenus         -- questions et étapes
  id PK, mission_id FK, ordre, type_question (qcm/numerique/zone_image/
  ordonnancement/choix_consequence/texte), enonce, medias JSONB,
  options JSONB, bonnes_reponses JSONB, tolerance,
  correction_pedagogique, consequences JSONB (score/reputation/
  moral/budget/securite)

mission_variantes_pays
  id PK, mission_id FK, pays_id FK, surcharges JSONB
  (unites, prix, normes_citees, documents, enonces adaptés)

user_missions
  id PK, user_id FK, mission_id FK, statut (dispo/en_cours/reussie/
  echouee), score, temps_utilise_sec, reponses JSONB, erreurs JSONB,
  tentatives, meilleur_score, terminee_le

examens              -- missions de passage de niveau (type=examen)
  liés via missions.type, avec seuil de réussite et cooldown
```

## 5.4 Chantiers virtuels (BTP Simulator)

```
chantiers
  id PK, slug, nom, type_projet (dalle/cloture/chambre/maison/villa/
  R+1/ecole/centre_sante/route/caniveau/dalot/industriel/urbain),
  pays_id FK, client_pnj_id FK, localisation_fictive, budget, devise,
  delai_jours, description, statut

chantier_phases
  id PK, chantier_id FK, ordre, nom (implantation/terrassement/
  fondations/elevation/…), missions JSONB, documents JSONB

chantier_ressources
  id PK, chantier_id FK, type (materiau/ouvrier/fournisseur/materiel),
  ref JSONB, quantite, cout_unitaire

imprevus
  id PK, titre, description, declencheur JSONB (phase/proba/condition),
  options JSONB, consequences JSONB, pays_id FK NULL

user_chantiers
  id PK, user_id FK, chantier_id FK, statut, phase_courante,
  budget_restant, jours_restants, qualite, securite, moral_equipe,
  avancement_pct, evenements_log JSONB, note_finale, termine_le

ouvriers_virtuels    -- instances RH par chantier utilisateur
  id PK, user_chantier_id FK, nom, poste, competence, fatigue,
  motivation, rendement, historique JSONB
```

## 5.5 Monde virtuel et PNJ

```
lieux
  id PK, slug (ecole/centre_formation/bureau_etudes/chantier/entreprise/
  fournisseur/mairie/banque/laboratoire/bureau_controle/depot/client),
  nom, description, illustration_id FK, actions JSONB

pnj
  id PK, slug, nom, role (professeur/maitre_stage/chef_chantier/
  conducteur/ingenieur/client/fournisseur/ouvrier/controleur/hse/
  recruteur/banquier/concurrent/architecte/geotechnicien/topographe),
  avatar_id FK, personnalite JSONB

pnj_messages         -- scripts déclenchés par événements
  id PK, pnj_id FK, declencheur JSONB (evenement/etape/score/aleatoire),
  contenu, actions_proposees JSONB (mission/conseil/imprevu/evaluation)

user_messages
  id PK, user_id FK, pnj_id FK, contenu, actions JSONB, lu, created_at

evenements
  id PK, type (defi_jour/defi_semaine/imprevu/opportunite),
  config JSONB, actif_du, actif_au
```

## 5.6 Récompenses, CV, emploi

```
badges
  id PK, slug, nom, description, icone_id FK, conditions JSONB, rarete

user_badges
  id PK, user_id FK, badge_id FK, obtenu_le, mission_source_id FK

certificats
  id PK, slug, nom, conditions JSONB (missions/examens/score_min),
  template_pdf_id FK, premium_requis BOOL

user_certificats
  id PK, user_id FK, certificat_id FK, numero_unique, delivre_le,
  url_verification

cv_virtuels          -- snapshot recalculé (matérialisé pour l'export)
  id PK, user_id FK UNIQUE, contenu JSONB, maj_le

offres_emploi
  id PK, titre, pays_id FK, description, profil_recherche_id FK,
  competences_requises JSONB, logiciels_requis JSONB, niveau_min,
  chantiers_requis, reputation_min, test_entree_mission_id FK,
  entreprise_fictive, statut, publiee_le

candidatures
  id PK, user_id FK, offre_id FK, statut (envoyee/test/acceptee/
  refusee), score_test, feedback JSONB, created_at

regles_promotion
  id PK, profil_source_id FK, profil_cible_id FK,
  conditions JSONB (competences/missions/chantiers/reputation/
  tests/logiciels/anciennete), examen_mission_id FK NULL

demandes_promotion
  id PK, user_id FK, regle_id FK, statut, evaluation JSONB, decidee_le

entreprises_virtuelles
  id PK, user_id FK, nom, capital_virtuel, employes JSONB,
  chantiers_en_cours JSONB, reputation_entreprise, creee_le
```

## 5.7 Référentiel pays

```
pays
  id PK, code_iso, nom, langue, monnaie, symbole_monnaie,
  systeme_unites, actif, ordre

referentiels_normes
  id PK, pays_id FK, categorie (construction/beton/acier/geotechnique/
  electricite/plomberie/vrd/accessibilite/incendie/hse/reception),
  nom_norme, resume_pedagogique, details JSONB

pays_config
  id PK, pays_id FK, cle (appellations_metiers/documents_types/
  regles_hse/types_contrats/types_marches/niveaux_qualification/
  procedures_reception/acteurs_institutionnels/coefficients),
  valeur JSONB

bibliotheques_prix
  id PK, pays_id FK, categorie, designation, unite, prix_indicatif,
  devise, maj_le

materiaux_pays
  id PK, pays_id FK, materiau, disponibilite, prix_indicatif, notes
```

## 5.8 Contenus, monétisation, technique

```
medias
  id PK, type (image/plan/document/donnee), categorie, titre,
  fichier_url, thumbnail_url, tags JSONB, pays_id FK NULL, licence

abonnements
  id PK, user_id FK, plan, statut, provider (stripe/cinetpay/wave…),
  provider_ref, debut, fin, montant, devise

comptes_b2b
  id PK, type (ecole/entreprise), nom, admin_user_id FK,
  licences_total, licences_utilisees, config JSONB

b2b_membres
  id PK, compte_b2b_id FK, user_id FK, groupe (classe/equipe), role

notifications
  id PK, user_id FK, type, titre, contenu, lien, lue, push_envoyee

audit_logs
  id PK, actor_id FK, action, entite, entite_id, diff JSONB, created_at

pages_cms
  id PK, slug, titre, contenu JSONB, publie, maj_le
```

**Index critiques** : `user_missions(user_id, statut)`, `missions(statut, niveau_requis)`, `offres_emploi(pays_id, statut)`, `user_competences(user_id, competence_id)`, recherche plein texte sur missions/cours.

---

# 6. Modules à développer

| # | Module | Contenu | Priorité |
|---|---|---|---|
| M1 | **Auth & comptes** | Inscription, connexion, vérification email, reset, sessions, RGPD | P0 |
| M2 | **Onboarding & avatar** | 4 étapes, éditeur d'avatar, génération de parcours | P0 |
| M3 | **Référentiel pays** | Pays, normes, unités, monnaies, prix, config admin | P0 |
| M4 | **Moteur de compétences** | Arbre, niveaux, validation, prérequis | P0 |
| M5 | **Académie BTP** | 26 modules de cours, quiz intégrés | P0 |
| M6 | **Académie Logiciels** | Simulations Word/Excel/PDF/AutoCAD lecture (v1), autres (v2) | P0/P1 |
| M7 | **Moteur de missions** | 14 types de missions, chrono, corrections, variantes pays | P0 |
| M8 | **Moteur de score & progression** | XP, niveaux, réputation, argent virtuel, 12 axes d'évaluation | P0 |
| M9 | **BTP Simulator (chantiers)** | Chantiers, phases, budget, planning, imprévus | P0 (simple) / P1 (avancé) |
| M10 | **Gestion humaine** | Ouvriers virtuels, moral, conflits, décisions RH | P1 |
| M11 | **Monde virtuel & PNJ** | Lieux, messagerie PNJ, événements scriptés | P1 |
| M12 | **CV virtuel** | Agrégation auto, page publique, export PDF | P0 |
| M13 | **Offres & candidatures** | Offres, tests d'entrée, feedback de refus | P0 |
| M14 | **Promotions** | Règles, demandes, examens de passage | P1 |
| M15 | **Badges & certificats** | Attribution auto, galerie, PDF vérifiables | P0 |
| M16 | **Entreprise virtuelle** | Création, finances, recrutement, multi-chantiers | P2 |
| M17 | **Défis & rétention** | Défis quotidiens/hebdo, streaks, notifications push | P1 |
| M18 | **Back-office** | CRUD complet tous contenus, workflow publication, prévisualisation | P0 |
| M19 | **Banque de contenus** | Médiathèque images/plans/documents/données taguée | P0 |
| M20 | **Monétisation** | Plans, paiement (carte + mobile money), licences B2B | P1 |
| M21 | **Espaces B2B** | Dashboards écoles/entreprises, suivi apprenants | P2 |
| M22 | **PWA** | Manifest, service worker, offline, push, install prompt | P0 |
| M23 | **Analytics & logs** | Événements produit, entonnoirs, Sentry | P1 |

P0 = lancement, P1 = 1–3 mois après, P2 = 3–6 mois après.

---

# 7. Système de rôles et permissions

## 7.1 Deux plans de rôles distincts

**Rôles plateforme** (techniques) : visiteur, utilisateur, école-admin, entreprise-admin, support, éditeur, responsable pédagogique, gestionnaire pays, super-admin.

**Profils métier** (in-game) : les ~29 profils BTP. Ce sont des états de carrière, pas des rôles techniques — mais ils conditionnent les **droits in-game**.

## 7.2 Droits in-game par profil (extraits)

| Profil | Peut faire | Ne peut pas faire |
|---|---|---|
| Étudiant | Cours, quiz, missions d'intro, visites de chantier (observation) | Diriger, valider, signer des documents |
| Stagiaire | Rapports journaliers, missions assistées, observation active | Gérer seul un chantier, prendre des décisions engageantes |
| Ouvrier / qualifié | Missions d'exécution, sécurité, lecture de consignes | Métré, planning, gestion budget |
| Chef d'équipe | Gérer 3–8 ouvriers, consignes, remontées d'incidents | Gérer le budget, la relation client |
| Chef chantier | 1 chantier complet, équipe, qualité, sécurité, avancement | Plusieurs chantiers simultanés, négociation de marché |
| Conducteur de travaux | Plusieurs chantiers, budget, planning, fournisseurs, client, réunions | Validation structurelle (réservée ingénieur) |
| Dessinateur / projeteur / BIM | Plans, maquettes, corrections de plans | Décisions chantier, validation calculs |
| Ingénieur (structure, géotech…) | Analyse de plans, notes de calcul, validation technique | — (limites de spécialité entre ingénieurs) |
| Métreur / économiste | Métrés, devis, études de prix | Exécution chantier |
| Contrôleur qualité / HSE | Contrôles, non-conformités, arrêts de tâche pour danger | Gestion budget/planning |
| Entrepreneur | Marchés, recrutement, finances, multi-chantiers, banque | Rien n'est illimité : la banque et la réputation le contraignent |

Le moteur de droits vérifie systématiquement : `profil_actuel + niveau + compétences validées` avant de rendre une mission, un chantier ou une action accessible. Une action hors droits n'est jamais cachée bêtement : elle est affichée **verrouillée avec l'explication** ("Réservé aux chefs chantier — il te manque : X, Y"), ce qui alimente la motivation.

## 7.3 Permissions back-office (matrice)

| Ressource | Éditeur | Resp. pédago | Gest. pays | Support | Super-admin |
|---|---|---|---|---|---|
| Missions/cours/chantiers | CRUD brouillon | + publier | lecture | lecture | tout |
| Référentiel pays | lecture | lecture | CRUD (ses pays) | — | tout |
| Utilisateurs | — | — | — | lecture + reset | tout |
| Paiements | — | — | — | lecture | tout |
| Rôles admin | — | — | — | — | tout |

---

# 8. Système de missions

## 8.1 Anatomie d'une mission

Chaque mission est un objet configurable en admin (aucun code requis) :

**Métadonnées** : titre, description, type, profils concernés, niveau requis, compétences visées, chantier lié, durée limite, badge possible, condition de réussite, pays/variantes.
**Contenus** : questions/étapes ordonnées avec médias (images, plans, documents, données techniques).
**Évaluation** : bonnes/mauvaises réponses, tolérances numériques, conséquences, score, correction pédagogique par item.

## 8.2 Les 14 types de missions

| Type | Mécanique | Exemple |
|---|---|---|
| Quiz | QCM/vrai-faux avec correction | "Les acteurs d'un projet BTP" |
| Test chronométré | Quiz ou tâche sous pression de temps | Contrôle avant coulage en 7 min |
| Analyse d'image | Zones cliquables sur photo | "Repère les 5 dangers sur ce chantier" |
| Lecture de plan | Zones cliquables + questions sur plan PDF | "Trouve la section du poteau P3" |
| Calcul | Saisie numérique avec tolérance et unités pays | Volume de béton d'une dalle |
| Métré | Calculs en série depuis un plan | Métré d'un mur de clôture |
| Devis | Quantités × bibliothèque de prix du pays | Devis d'une chambre simple |
| Rapport journalier | Formulaire guidé type Word simulé | Rapport de la journée de coulage |
| Décision | Choix à conséquences (arbre) | "Le béton arrive avec 1h de retard, que fais-tu ?" |
| Gestion humaine | Dialogue + choix RH | Conflit entre deux ouvriers |
| Simulation logiciel | Interface simulée (Excel, AutoCAD lecture…) | Calcul de volumes dans Excel BTP |
| Contrôle qualité | Checklist + détection de non-conformités | Réception du ferraillage |
| Mission chantier complète | Enchaînement multi-étapes sur un chantier | Couler la dalle du chantier "Villa Cocody" |
| Examen | Mission longue à seuil, passage de niveau | Examen conducteur de travaux |

## 8.3 Cycle de vie côté joueur

Disponible (si profil + niveau + prérequis OK) → Briefing (contexte, PNJ, objectifs, chrono annoncé) → Jeu → **Écran de résultat** : score /100, temps, erreurs détaillées, correction pédagogique, points XP, compétence débloquée, badge, message d'encouragement, boutons **Mission suivante / Revoir la correction / Améliorer mon score**.

Échec = jamais punitif : "Pas encore, mais tu es sur la bonne voie" + notion à revoir + nouvel essai (cooldown pour les examens).

## 8.4 Les 60–70 missions de lancement (répartition)

| Catégorie | Nb | Exemples |
|---|---|---|
| 1. Introduction BTP | 5 | Acteurs d'un projet, vocabulaire chantier, cycle de vie d'un projet |
| 2. Missions stagiaire | 6 | Premier jour, rapport journalier, observation de coulage, classement de documents |
| 3. Sécurité chantier | 6 | EPI, dangers en image, décision HSE 3 min, permis de feu, balisage |
| 4. Béton et ferraillage | 6 | Dosage 350 kg/m³, contrôle avant coulage 7 min, lecture plan ferraillage, slump test |
| 5. Maçonnerie et fondations | 5 | Implantation, semelle filante, montage agglos, chaînages |
| 6. Métré et devis | 6 | Métré dalle, métré clôture, devis chambre, vérification de devis 10 min |
| 7. Logiciels BTP | 7 | Word rapport, Excel volumes, Excel devis, lecture PDF plan, erreur AutoCAD, maquette Revit, planning simple |
| 8. Gestion humaine | 5 | Casque refusé, dispute, erreur cachée, équipe fatiguée, apprenti perdu |
| 9. Décisionnel | 5 | Retard livraison, pluie annoncée, client qui change d'avis, budget dépassé |
| 10. Géotechnique | 4 | Types de sols, essai de sol, lecture rapport géotechnique, choix de fondation |
| 11. Bureau d'études | 4 | Lecture plan structure, repérer une erreur de plan, note de calcul simple |
| 12. Topographie | 4 | Niveau, implantation, lecture plan topo, calcul de dénivelé |
| 13. Contrôle qualité | 4 | Fiche de non-conformité, contrôle réception matériaux, checklist qualité |
| 14. Réception des travaux | 3 | PV de réception, réserves, levée de réserves |
| **Total** | **70** | |

Chaque mission est livrée avec sa variante Côte d'Ivoire (pays pilote) ; France en second référentiel de démonstration.

---

# 9. Système de progression

## 9.1 Les cinq monnaies de progression

| Ressource | Gagnée par | Sert à |
|---|---|---|
| **XP** | Missions, cours, défis, chantiers | Monter de niveau (1→50, courbe croissante) |
| **Compétences** | Validation par missions/examens (niveaux 1–5 par compétence) | Conditions d'offres, promotions, missions avancées |
| **Réputation** (0–100) | Qualité, sécurité, délais, décisions justes ; baisse en cas d'erreurs graves | Offres exigeant une réputation min, confiance des PNJ |
| **Argent virtuel** | Salaires virtuels, primes de chantier, défis | Formations premium in-game, création d'entreprise, matériel |
| **Ancienneté virtuelle** | Temps de jeu actif converti en jours de carrière | Conditions de promotion réalistes |

## 9.2 Règle d'or : la progression est conditionnelle, pas automatique

Passer d'un profil au suivant exige **toutes** les conditions de la règle de promotion, par exemple :

**Étudiant → Stagiaire** : bases BTP N1 + sécurité N1 + matériaux N1 + lecture de plans N1 + Word rapport N1 + Excel N1 + test d'entrée réussi.

**Stagiaire → Technicien junior** : 5 rapports journaliers validés + 2 chantiers observés + lecture de plans N2 + Excel BTP N2 + métré N1 + sécurité N2 + examen de fin de stage ≥ 70/100.

**Chef chantier → Conducteur de travaux** : 3 chantiers réussis (note ≥ B) + gestion de 2 équipes simultanées + suivi budget validé + suivi planning validé + 5 imprévus résolus + relation client ≥ 70 + réunions de chantier animées + examen conducteur ≥ 75/100.

Le moteur évalue en continu et affiche sur le tableau de bord : "Il te manque 2 conditions pour demander ta promotion : Excel BTP N2 (tu es à N1), 1 chantier observé."

## 9.3 Embranchements

Après chaque jalon, l'écran de choix (§3.4) permet : formation, emploi, stage, spécialisation, logiciels, promotion, entreprise, changement de parcours. Le graphe de carrière (table `parcours`) est recalculé sans perte d'acquis : compétences et réputation sont transverses.

---

# 10. Système de score

## 10.1 Les 12 axes d'évaluation

Chaque mission note l'utilisateur sur les axes pertinents parmi : **technique, sécurité, qualité, délai, budget, communication, leadership, gestion humaine, logiciel, décision, rentabilité, réputation**.

Score mission = Σ (points par item × poids d'axe), normalisé sur 100.
Bonus chrono : temps restant × coefficient (plafonné à +10).
Malus : erreur de sécurité grave = plafond de score à 50 même si le reste est parfait (la sécurité prime, message pédagogique explicite).

## 10.2 Notes de chantier

Un chantier terminé produit une note globale A/B/C/D calculée sur : qualité finale, respect du budget, respect du délai, sécurité (accidents évités/subis), moral d'équipe, satisfaction client. Cette note alimente le CV virtuel et les conditions de promotion.

## 10.3 Radar de compétences

Le profil affiche un radar sur les 12 axes (moyenne glissante des 20 dernières missions) : l'utilisateur voit ses forces et faiblesses, et le mentor virtuel recommande des missions ciblant les axes faibles.

---

# 11. Système de badges et certificats

## 11.1 Badges (gratuits, instantanés, visuels)

Attribution automatique par conditions JSONB (mission réussie, score min, série, cumul). Raretés : bronze/argent/or. Lancement avec ~25 badges dont : Sécurité N1, Rapport journalier, Excel BTP, Lecture de plans, Béton N1, Ferraillage, Chef d'équipe, Stagiaire validé, AutoCAD lecture, Revit initiation, Contrôle qualité, Gestion humaine, Géotechnique initiation, Topographie initiation, + badges de série (7 jours d'affilée), de vitesse (chrono parfait) et de persévérance (réussite après 3 échecs — l'échec est valorisé).

Animation d'obtention : plein écran, confettis sobres (poussière dorée cuivre), son discret, partage possible.

## 11.2 Certificats (formels, vérifiables, monétisables)

PDF nominatif avec numéro unique et URL de vérification publique (`btplife.com/verif/:numero`). Conditions plus exigeantes (parcours complet + examen). Catalogue de lancement : sécurité chantier, rapport journalier, Excel BTP, lecture de plans, métré et devis, chef chantier junior, gestion chantier, topographie initiation, géotechnique initiation, AutoCAD lecture, Revit/BIM initiation. Les certificats sont un pilier du plan Premium et de l'offre Certifications.

Mention systématique sur chaque certificat : *"Certificat pédagogique délivré par le simulateur BTP Life — ne constitue pas une habilitation officielle."*

---

# 12. Système de CV virtuel

## 12.1 Principe

Le CV n'est jamais rédigé par l'utilisateur : il est **généré automatiquement** par agrégation de la carrière. Chaque événement (mission réussie, chantier livré, examen, badge, promotion, stage) alimente le CV en temps réel — c'est la matérialisation visible de "je construis ma carrière".

## 12.2 Contenu

Identité (nom du joueur, avatar, pays, référentiel) · Profil actuel & métier cible · Niveau et XP · Formations validées (modules académie) · Compétences avec niveaux (radar) · Logiciels maîtrisés avec niveaux · Expériences (chantiers réalisés avec notes A–D, stages, postes occupés avec ancienneté virtuelle) · Badges & certificats · Réputation et notes moyennes · Recommandations des PNJ (maître de stage, chef, client) · Postes accessibles aujourd'hui.

## 12.3 Usages

Pièce jointe automatique des candidatures aux offres · Dossier des demandes de promotion · Export PDF élégant (template dans la charte terre cuite/graphite) · Page publique partageable optionnelle (portfolio pour de vrais recruteurs, argument différenciant pour les écoles).

---

# 13. Système d'offres et promotions

## 13.1 Offres d'emploi virtuelles

Catalogue administrable : stage chantier, assistant technicien, aide métreur, dessinateur junior, assistant topographe, chef d'équipe, chef chantier junior, assistant conducteur, conducteur junior, contrôleur qualité, entrepreneur sous-traitant.

**Pipeline de candidature** :
1. L'offre affiche les exigences (profil, compétences, logiciels, niveau, chantiers, réputation) avec indicateurs vert/orange/rouge selon le CV de l'utilisateur.
2. Candidature → envoi automatique du CV virtuel.
3. **Test d'entrée** (mission dédiée, souvent chronométrée).
4. Décision : acceptée → changement de poste, message de bienvenue du nouveau chef PNJ, nouvelles missions débloquées ; refusée → feedback détaillé + plan d'action + possibilité de repostuler.

Les offres sont filtrées par pays et régénérées périodiquement (rotation gérée en admin ou par règles).

## 13.2 Promotions

Demande initiée par l'utilisateur depuis `/app/promotions` quand les conditions approchent. Le dossier est évalué par : conditions objectives (moteur de règles) + "avis des supérieurs fictifs" (score relationnel accumulé avec les PNJ hiérarchiques) + examen de passage éventuel. Résultat scénarisé : entretien simulé avec le PNJ manager, annonce, écran de félicitations, mise à jour du CV, nouveau salaire virtuel.

---

# 14. Système d'adaptation aux normes par pays

## 14.1 Architecture "contenu global → variante pays"

Chaque contenu pédagogique existe en version **globale** (principes universels : la physique du béton ne change pas) et accepte des **surcharges par pays** : unités, monnaie, prix, appellations métiers, documents types, normes citées, règles HSE, procédures, coefficients.

Résolution à l'exécution :
```
contenu_affiché = contenu_global
                + surcharges(pays_utilisateur)   si elles existent
                + bandeau "Référentiel : Côte d'Ivoire (pédagogique)"
```
Si aucune variante n'existe : affichage du contenu global avec mention "référentiel générique". Le back-office liste automatiquement les contenus sans variante pour chaque pays actif (pilotage de la couverture).

## 14.2 Contenu d'un référentiel pays (administrable)

Langue, monnaie, unités · Appellations des métiers · Documents administratifs types · Niveaux de qualification · Règles HSE · Bibliothèque de prix indicatifs · Matériaux courants et disponibilité · Types de contrats et de marchés (publics/privés) · Normes par catégorie (construction, béton, acier, géotechnique, électricité, plomberie, VRD, accessibilité, incendie) sous forme de **résumés pédagogiques** · Procédures de contrôle et de réception · Acteurs institutionnels · Coefficients et exemples de plans locaux.

## 14.3 Déploiement

Pays pilote : **Côte d'Ivoire** (contenu complet). Second : **France** (démonstration de l'adaptabilité, normes très différentes). Puis Burkina Faso, Sénégal, Mali, Bénin, Togo, Cameroun, Maroc, Canada par duplication + ajustement (workflow §4.3). Objectif : ajouter un pays = travail éditorial de 2–4 semaines, **zéro développement**.

## 14.4 Avertissement obligatoire

Affiché : en pied de page, à l'inscription, sur chaque certificat, et sur chaque contenu normatif :

> **BTP Life est un simulateur pédagogique. Les contenus techniques et normatifs servent à l'apprentissage et ne remplacent pas les normes officielles, les bureaux d'études, les ingénieurs habilités, les laboratoires agréés, les autorités compétentes ou les obligations réglementaires du pays concerné.**

---

# 15. Conception PWA mobile

## 15.1 Exigences

Manifest complet (nom, icônes 192/512 + maskable, `display: standalone`, `theme_color` graphite, `background_color` ivoire, splash screens) · Service worker avec stratégies différenciées :

| Ressource | Stratégie |
|---|---|
| Shell applicatif (HTML/CSS/JS) | Precache + stale-while-revalidate |
| Cours et missions consultés | Cache-first avec expiration (7 j) |
| Images/plans des missions en cours | Prefetch au démarrage de la mission |
| API dynamique (score, CV, offres) | Network-first avec fallback cache |
| Soumission de réponses hors ligne | Background Sync (file d'attente, synchro au retour réseau) |

## 15.2 Mode hors ligne partiel

Disponible offline : tableau de bord (dernier état), cours déjà ouverts, missions téléchargées (bouton "Disponible hors ligne"), CV, badges, progression. Les réponses aux missions offline sont horodatées localement et synchronisées ; les tests chronométrés officiels (examens) exigent une connexion pour l'anti-triche.

## 15.3 Mobile-first

Navigation par barre inférieure 5 onglets : **Accueil · Missions · Chantiers · Messages · Profil**. Cibles tactiles ≥ 48 px, missions jouables au pouce, chrono visible en permanence, mode paysage pour la lecture de plans avec zoom/pan fluide. Notifications push : défi du jour, message PNJ, résultat de candidature, rappel de série — fréquence plafonnée et paramétrable.

Bannière d'installation intelligente : proposée après la première mission réussie (moment de satisfaction), pas à l'arrivée.

Performance cible : LCP < 2,5 s sur réseau 3G (réalité des marchés africains), bundle initial < 200 Ko gzippé, images AVIF/WebP avec lazy loading, mode économie de données.

---

# 16. Maquettes UX/UI recommandées

## 16.1 Direction artistique

**Palette "Matière & Élévation"** :

| Rôle | Couleur | Hex indicatif |
|---|---|---|
| Primaire | Terre cuite | `#C1502E` |
| Secondaire | Vert olive | `#6B7A3F` |
| Accent | Cuivre | `#B87333` |
| Fond clair | Ivoire | `#F5F0E6` |
| Fond sombre / texte | Graphite | `#2B2B2E` |
| Surfaces | Pierre claire / sable chaud | `#E8DCC8` / `#D9B382` |
| Neutres | Gris minéral, brun foncé, argile | `#8A8680` / `#4A342A` / `#A85F4C` |

Interdits (conformes au brief) : bleu marine dominant, jaune chantier saturé, dégradés SaaS violets, dashboards génériques, casque cliché dans le logo.

**Textures** : grain béton subtil en fond, tramage papier calque sur les documents, lignes de cotation architecturales comme éléments décoratifs, motifs de plans en filigrane.

**Typographie** : titres en linéale géométrique à caractère architectural (ex. famille type "Clash Display" / "Archivo Expanded") ; texte courant en humaniste très lisible (ex. "Inter" / "Public Sans") ; données techniques et cotes en monospace (ex. "JetBrains Mono") pour l'ADN "plan d'exécution".

**Logo** : monogramme architectural — élévation stylisée (lignes de fondation → étages → flèche de croissance) formant un "B" ou une tour abstraite ; trait façon plan technique, couleur terre cuite sur ivoire et déclinaison graphite ; pas de casque, pas de bleu/jaune.

## 16.2 Écrans clés à maquetter (Figma)

1. **Accueil public** — hero illustré (scène de chantier stylisée flat/isométrique aux couleurs de la palette : ingénieure à la tablette, topographe, structure en élévation), CTA terre cuite.
2. **Onboarding avatar** — éditeur en 2 colonnes (aperçu / options), progression 1/4 → 4/4 en jauge "niveau de béton coulé".
3. **Tableau de bord** — carte avatar + poste actuel en tête ; jauge XP en "élévation d'immeuble" (chaque niveau = un étage construit) ; blocs : prochaine étape de carrière (avec conditions manquantes), missions du jour, chantier en cours, messages PNJ, réputation, argent virtuel.
4. **Écran de mission** — plein écran immersif, chrono en anneau cuivré, question + média central, feedback immédiat par item.
5. **Résultat de mission** — grande note /100, confettis poussière dorée, correction dépliable, 3 CTA (suivante / correction / améliorer).
6. **Chantier (BTP Simulator)** — vue du chantier en illustration isométrique évoluant avec l'avancement (terrain nu → fondations → élévation → toiture), panneaux latéraux : phases, budget, planning, équipe, alertes imprévus.
7. **Gestion d'équipe** — cartes ouvriers avec jauges moral/fatigue/rendement, dialogues de décision.
8. **CV virtuel** — mise en page "dossier professionnel" premium sur fond ivoire, radar 12 axes, timeline de carrière.
9. **Offre d'emploi** — fiche avec exigences en feux vert/orange/rouge par rapport au profil.
10. **Monde virtuel** — carte illustrée d'un quartier avec les 12 lieux, style plan-masse coloré.
11. **Back-office éditeur de mission** — formulaire multi-onglets (infos / contenus / corrections / variantes pays / prévisualisation).
12. **Vues mobiles** de 1, 3, 4, 5, 6 (mobile-first).

## 16.3 Principes UX

Toujours répondre à "où j'en suis, que faire ensuite ?" · Jamais de cul-de-sac (tout refus donne un plan d'action) · Feedback < 100 ms sur chaque interaction · Célébration proportionnée (micro-animation pour un quiz, plein écran pour une promotion) · Verrouillé ≠ caché (montrer ce qui est à venir motive) · Ton bienveillant du mentor, jamais culpabilisant · Accessibilité : contrastes AA sur toute la palette, tailles ajustables, alternative textuelle aux exercices visuels quand c'est possible.

---

# 17. Stack technique recommandée

| Couche | Choix recommandé | Justification |
|---|---|---|
| Frontend | **Next.js 15 (React, TypeScript)** + Tailwind CSS (design tokens de la palette) | SSR/SSG pour le SEO du site public, App Router, écosystème PWA mature |
| PWA | next-pwa / Serwist (Workbox) | Service worker, precache, background sync |
| State & data | TanStack Query + Zustand | Cache réseau + état de jeu local |
| Animations | Framer Motion + Lottie (célébrations) | Effet "wow" maîtrisé |
| Plans/zones cliquables | SVG + react-zoom-pan-pinch ; PDF.js pour les plans PDF | Missions lecture de plan |
| Backend | **NestJS (Node, TypeScript)** API REST + WebSocket (notifications, chrono serveur) | Structure modulaire alignée sur les moteurs (missions, progression, normes) |
| Base de données | **PostgreSQL** (+ JSONB) via Prisma | Relationnel solide + flexibilité contenus |
| Cache / files | Redis (sessions, classements, files BullMQ) | Défis, notifications, recalculs de CV |
| Stockage fichiers | S3-compatible (AWS S3 / Cloudflare R2) + CDN | Images, plans, documents, certificats PDF |
| Auth | Auth maison JWT + refresh, ou Auth.js ; bcrypt/argon2 | Rôles multiples, comptes B2B |
| Paiement | **Stripe** (cartes, monde) + **CinetPay/PayDunya/Wave** (mobile money Afrique de l'Ouest) | Indispensable pour le marché ivoirien : Orange Money, MTN MoMo, Wave |
| PDF (CV, certificats) | Puppeteer ou react-pdf côté serveur | Templates de la charte |
| Notifications push | Web Push (VAPID) + FCM | PWA + rappels |
| Emails | Resend / Brevo | Vérification, transactionnel |
| Analytics | PostHog (produit) + Plausible (site) | Entonnoirs, missions abandonnées |
| Monitoring | Sentry + logs structurés (Pino) + uptime | Qualité de service |
| Hébergement | Vercel (front) + Railway/Render ou VPS Docker (API/DB) ; CDN Cloudflare (PoP Afrique) | Latence acceptable depuis Abidjan |
| CI/CD | GitHub Actions, environnements staging/prod, migrations Prisma | Sauvegardes DB quotidiennes + test de restauration |

Alternative simplificatrice pour une petite équipe : Supabase (Postgres + Auth + Storage + Realtime) en remplacement de NestJS/Redis/S3 pour le MVP, avec migration progressive vers une API dédiée quand les moteurs se complexifient.

---

# 18. Plan de développement

## Phase 0 — Fondations (semaines 1–4)
Charte graphique finale + logo + design system Figma (tokens, composants) · Maquettes des 12 écrans clés · Setup technique (repo, CI/CD, environnements, DB, auth) · Modèle de données v1 · Décision Supabase vs stack complète.

## Phase 1 — Cœur jouable (semaines 5–12)
M1 Auth · M2 Onboarding + avatar (v1 simple : styles prédéfinis) · M3 Référentiel pays (Côte d'Ivoire) · M4 Compétences · M7 Moteur de missions (types : quiz, chrono, analyse image, lecture plan, calcul, rapport, décision) · M8 Score & progression · M18 Back-office (missions, cours, médias) · M19 Banque de contenus · 20 premières missions + 8 modules académie.
**Jalon : alpha interne jouable de bout en bout (inscription → mission → progression).**

## Phase 2 — Carrière complète (semaines 13–20)
M5 Académie BTP complète (26 modules) · M6 Académie logiciels v1 (Word, Excel, PDF, AutoCAD lecture) · M9 Chantiers virtuels v1 (3 chantiers : dalle, clôture, chambre) · M12 CV virtuel + export PDF · M13 Offres d'emploi (8 offres) · M15 Badges & certificats · M22 PWA complète · 70 missions publiées · Pages légales, tarifs, contact.
**Jalon : bêta fermée (50–100 testeurs : étudiants BTP d'Abidjan, une école partenaire).**

## Phase 3 — Lancement public (semaines 21–26)
Corrections issues de la bêta (équilibrage scores, difficulté, textes) · M20 Monétisation (Premium + mobile money) · M17 Défis & notifications · M11 Monde virtuel & PNJ v1 (mentor, maître de stage, recruteur) · M14 Promotions · France en second référentiel · SEO, performance, sécurité (audit), sauvegardes testées.
**Jalon : lancement public v1.**

## Phase 4 — Croissance (mois 7–12)
M10 Gestion humaine avancée · M9 chantiers complexes (villa, R+1, route, dalot) · M16 Entreprise virtuelle · M21 Espaces écoles/entreprises · M6 logiciels v2 (Revit, MS Project, Covadis…) · 3–4 nouveaux pays · Classements et ligues · Application des retours analytics.

**Équipe recommandée MVP** : 1 chef de projet/produit, 2 développeurs full-stack, 1 UI/UX designer, 1 expert-contenu BTP (ingénieur ou conducteur de travaux), 1 illustrateur (freelance). Le poste contenu est aussi critique que le code : 70 missions de qualité représentent ~10–12 semaines de travail éditorial en parallèle du développement.

---

# 19. Checklist de lancement

## Produit
- [ ] Page d'accueil professionnelle avec hero, concept, 4 étapes, cartes profils, section PWA, CTA final
- [ ] Inscription / connexion / vérification email / reset mot de passe
- [ ] Onboarding 4 étapes (avatar, profil, métier cible, parcours généré)
- [ ] Choix pays/référentiel actif (Côte d'Ivoire + France)
- [ ] Tableau de bord complet (avatar, niveau, XP, réputation, argent, compétences, missions, prochaine étape)
- [ ] Académie BTP : 26 modules avec cours + quiz + mission pratique
- [ ] Académie logiciels : Word, Excel, PDF, AutoCAD lecture
- [ ] ≥ 50 missions publiées (objectif 70), 14 types représentés
- [ ] Tests chronométrés opérationnels (chrono serveur, résultats détaillés)
- [ ] ≥ 3 chantiers virtuels jouables avec phases et imprévus
- [ ] CV virtuel auto-généré + export PDF
- [ ] ≥ 25 badges + 11 certificats vérifiables
- [ ] ≥ 8 offres d'emploi avec tests d'entrée et feedback de refus
- [ ] Module promotions avec règles et examens
- [ ] Messagerie PNJ (mentor + 3 personnages minimum)
- [ ] Défis journaliers

## Back-office
- [ ] CRUD missions, cours, chantiers, badges, offres, PNJ, médias, pages
- [ ] Éditeur de variantes pays + rapport de couverture par pays
- [ ] Gestion utilisateurs, rôles, abonnements
- [ ] Workflow brouillon → relecture → publication + prévisualisation
- [ ] Dashboard KPIs

## PWA & performance
- [ ] Manifest + icônes + splash + installable Android/iOS
- [ ] Service worker : precache, offline partiel, background sync
- [ ] Notifications push opt-in
- [ ] LCP < 2,5 s en 3G, bundle initial < 200 Ko, images optimisées
- [ ] Test réel sur téléphones d'entrée de gamme et réseau mobile ivoirien

## Légal & confiance
- [ ] CGU, politique de confidentialité, mentions légales, cookies
- [ ] Avertissement pédagogique obligatoire (footer + inscription + certificats + contenus normatifs)
- [ ] Consentement données, droit à l'effacement, export des données
- [ ] Page contact + support fonctionnels

## Technique & sécurité
- [ ] HTTPS, en-têtes de sécurité, rate limiting, protection brute force
- [ ] Hash mots de passe (argon2/bcrypt), audit des permissions
- [ ] Sauvegardes DB quotidiennes + restauration testée
- [ ] Monitoring erreurs (Sentry) + uptime + logs
- [ ] Analytics produit avec entonnoirs (inscription → 1re mission → J7)
- [ ] Paiement testé bout en bout : Stripe + mobile money (Orange Money, MTN, Wave), factures, remboursements

## Contenu & équilibre
- [ ] Relecture pédagogique de toutes les missions par l'expert BTP
- [ ] Taux de réussite cible par mission : 60–85 % (équilibrage sur données bêta)
- [ ] Variantes Côte d'Ivoire complètes sur les missions à contenu normatif
- [ ] Textes du mentor : ton bienveillant vérifié, aucun message culpabilisant

## Go / No-Go
- [ ] Bêta : ≥ 70 % des testeurs terminent l'onboarding, ≥ 50 % jouent une 2e session
- [ ] Zéro bug bloquant sur le parcours inscription → mission → résultat
- [ ] Plan de support (canal WhatsApp/email, délai de réponse < 24 h)

---

*BTP Life — simulateur pédagogique. Les contenus techniques, normatifs, financiers et professionnels servent à l'apprentissage et ne remplacent pas les normes officielles, les bureaux d'études, les ingénieurs habilités, les laboratoires agréés, les autorités compétentes ou les obligations réglementaires du pays concerné.*
