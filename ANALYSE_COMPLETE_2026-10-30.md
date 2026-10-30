# BTP Life — analyse complète (30 octobre 2026)

Analyse du code local (commit `9070bd2`) et des versions en ligne (jeu et serveur du 28 octobre). J'ai lu le code serveur et
jeu, audité chaque route qui verse de l'argent ou de l'XP, relancé les tests et la compilation de production, et contrôlé les
pages publiques et la démonstration en ligne. Aucun compte créé, aucune connexion ni écriture en production.

**Mise à jour du 30 octobre, après l'analyse.** Trois constats sont corrigés localement :

- le seed ne contient plus de mot de passe (partie code de S1) ;
- la ferme à XP des offres perdues (S3) ;
- le double paiement des missions (S4).

Ces correctifs ajoutent une troisième migration en attente (`20261030100000_offres_marches`). Les comptes déjà créés en
production restent à neutraliser.

## Verdict

En 48 heures, le jeu a beaucoup gagné :

- les séances sont corrigées par le serveur ;
- le chat est modéré ;
- les erreurs des joueurs remontent ;
- un seul objectif s'affiche à l'écran ;
- le personnage se fait sur mesure ;
- le départ dépend du poste choisi.

La base technique reste solide : 868 tests verts, migrations rejouées sur une vraie base Postgres, compilation de production
réussie.

Mais quatre points bloquent :

1. **Un compte super-administrateur au mot de passe public.** Le dépôt GitHub `jeanzoundi/btp-life` est **public**. Depuis
   le premier commit, le seed y crée `admin@btplife.com` avec un mot de passe écrit en clair (`prisma/seed.ts`, ligne 831),
   ainsi qu'un compte de démonstration. Si le seed complet a déjà tourné sur la base de production, n'importe qui peut
   administrer le jeu.
2. **Rien de ce qui a été corrigé n'est en ligne.** 23 commits ne sont pas poussés : le push a été refusé par le
   classificateur du mode automatique. Les 15 derniers ne sont pas déployés, dont deux migrations. En production, la note
   des séances est donc encore crue sur parole : 2 000 F et 50 XP par appel.
3. **La boucle de travail principale ne paie pas.** La « Journée de travail avec Yao », proposée en tête des objectifs,
   dure une journée de jeu entière. Connecté, elle ne rapporte ni salaire ni XP tant que le joueur n'a pas son propre
   chantier (« journée d'apprentissage »). Elle coûte pourtant de l'énergie et de la faim.
4. **Le monde partagé n'a toujours pas d'heure commune.** La décision est attendue (`PLAN_SUITE_2026-10-29.md`).

## À faire tout de suite

1. **En production, neutraliser `admin@btplife.com` et `demo@btplife.com`** : Administration → Utilisateurs →
   « Suspendre ». La connexion et le renouvellement de session refusent les comptes suspendus. À défaut, changer leurs
   mots de passe. Puis vérifier la liste des administrateurs et les actions récentes de l'administration.
2. **Corriger le seed** — *fait localement le 30 octobre.* Le mot de passe vient de `SEED_ADMIN_PASSWORD` ou
   `SEED_DEMO_PASSWORD`, sinon il est tiré au hasard et affiché une seule fois à la création. Le README ne publie plus ces
   mots de passe. L'historique Git public garde les anciens : d'où l'étape 1.
3. **Pousser les 26 commits**, ce qui lance la CI GitHub, puis déployer : serveur d'abord (les migrations s'appliquent au
   build), jeu ensuite, à quelques minutes d'intervalle. Entre les deux, un jeu resté sur l'ancienne version reçoit
   « recharge le jeu » à la fin d'une séance.

## 1. État des lieux

| Mesure | Valeur |
|---|---|
| Code serveur | 7 624 lignes (94 fichiers), plus 6 935 lignes de contenu et de seed |
| Code jeu | 31 755 lignes : logique 6 761, composants 16 574, pages 8 281 |
| Tests | serveur 411 (33 suites), jeu 457 (83 fichiers), tous verts ; 10 000 lignes de tests |
| Vérification des migrations | 24 migrations, seed et 4 scripts de transactions sur Postgres réel : vert |
| Compilation de production | réussie ; page du monde 3D : 322 ko, 843 ko au premier chargement |
| Surface | 52 pages, 121 routes API (19 contrôleurs), 63 modèles de données |
| Contenu | 81 missions, 23 modules et 88 cours, 16 chantiers de gestion (dont 4 appels d'offres), 11 lieux à mentor (59 étapes, 131 tâches), fil rouge en 9 chapitres, 21 lieux visitables, 46 profils, 28 offres d'emploi, 6 défis du jour, 4 de la semaine, 6 imprévus, 39 objets d'avatar |
| Ressources 3D | 31 Mo dans `public/`, dont 14 Mo de modèles de personnages (10 fichiers GLB) |
| Dépendances (production) | serveur : aucune faille haute, 5 modérées hors de portée ; jeu : postcss embarqué par Next 15 (1 haute, 1 modérée, à la compilation seulement) |
| Écart avec GitHub | 23 commits locaux non poussés et 15 non déployés au moment de l'analyse ; 26 et 18 avec les correctifs du 30 octobre (trois migrations en attente) |

## 2. Ce qui a changé depuis le 28 octobre

| Changement | Statut |
|---|---|
| Personnage sur mesure (coiffure, barbe, teint, tenue), refonte de l'accueil, textes publics corrigés | en ligne |
| La démonstration démarre à 9 h, mentors ouverts | en ligne |
| Réglages rapides : guide rejoué si l'envoi échoue, aides tactiles, racine de compilation fixée | local |
| Guide des premiers pas vérifié par le serveur (réservé aux débutants, séance réelle exigée) | local |
| Séances corrigées par le serveur à partir des réponses brutes | local |
| Chat modéré : filtre, signalements, retrait au 3ᵉ signalement, page d'administration ; masquer un joueur | local |
| Erreurs des joueurs remontées au serveur, page d'administration | local |
| Brouillons des mentions légales, CGU, confidentialité et cookies | à compléter (identité de l'éditeur) |
| `quartier-3d.tsx` découpé (1 446 → 1 093 lignes) | local |
| Failles hautes des dépendances serveur corrigées | local |
| Un seul objectif principal à l'écran | local |
| Prime de départ selon le poste, chambre en cité universitaire pour les étudiants | local |
| ADR-002 (le web reste le client principal) et plans (heure commune, cursus, montées de version) | documents |

## 3. Sécurité et triche

| # | Constat | Où | Gravité |
|---|---|---|---|
| S1 | Compte super-administrateur et compte de démonstration créés par le seed avec des mots de passe écrits en clair, dans un dépôt public | `prisma/seed.ts` (avant le 30/10) | **Critique** — seed corrigé localement ; comptes de production à vérifier |
| S2 | Note des séances crue sur parole | production actuelle | **Haute** jusqu'au déploiement (corrigé localement) |
| S3 | Ferme à XP : chaque offre perdue sur un marché rapporte 15 XP, sans délai ni limite ; on peut aussi relancer l'offre jusqu'à gagner au prix maximal. Il faut être entrepreneur, niveau 30 et 200 de réputation. Le classement est trié par XP | `chantiers.service.ts`, `soumettreOffre` | Moyenne — **corrigé, local** : perdu, le marché revient à un concurrent pendant 24 h, l'XP de consolation n'est versée qu'une fois |
| S4 | Mission soumise deux fois en même temps : deux paiements possibles, car la correction et le versement ne sont pas dans une transaction sérialisable (contraire à la règle du projet) | `missions.service.ts`, `submit` | Moyenne — **corrigé, local** : le second envoi devient un entraînement |
| S5 | Valeurs déclarées par le jeu : remise au marché (plafonnée), victoire au match, tablée au maquis, heures de jeu passées, distance des trajets | `besoins.service.ts`, `transport.service.ts` | Faible (confort, pas d'argent créé) |
| S6 | Demandes de promotion refusées enregistrées à chaque clic, sans limite | `promotions.service.ts` | Faible |

Ce qui est sain : missions corrigées par le serveur ; fil rouge, défis (progrès recalculé depuis les vraies données),
promotions (conditions vérifiées), chantiers de gestion (simulation et livraison protégée par un verrou), épargne (intérêts
calculés sur l'heure réelle). Aucun secret n'est versionné : seulement des fichiers d'exemple.

## 4. Bugs

### Ceux de l'analyse du 28 octobre

| # | Bug | Statut |
|---|---|---|
| 1 | Note des séances crue sur parole | corrigé, local |
| 2 | « Fais quelques pas » ne se validait jamais | corrigé, en ligne |
| 3 | Guide déclaratif, même au niveau 30 | corrigé, local |
| 4 | Formulaire de contact factice | corrigé, en ligne (lien e-mail) |
| 5 | Pages légales d'une ligne (« Hébergeur : à préciser », toujours en ligne ce matin) | brouillons prêts, identité à fournir |
| 6, 7 | Écoles, entreprises, certificats vérifiables : promesses non tenues | textes corrigés, en ligne |
| 8, 9 | Catégories brutes de l'académie, compteurs de l'accueil | corrigés, en ligne |
| 10 | Vignettes de personnage identiques | corrigé (personnage sur mesure), en ligne |
| 11, 12, 14 | Nom du café, message du personnage en démonstration, drapeau | corrigés, en ligne |
| 13, 16, 17, 19 | Raccourcis clavier sur écran tactile, guide qui rate un geste, tests instables, racine de compilation | corrigés, local |
| 15 | Blog vide | retiré du menu, mais encore dans le sitemap |
| 18 | Alerte de développement de drei | sans effet en ligne |

### Nouveaux

| # | Bug | Où | Gravité |
|---|---|---|---|
| B1 | La journée avec Yao ne paie rien en jeu connecté sans chantier personnel, alors qu'elle est proposée comme objectif principal | `quartier-3d.tsx` (`faireLeBilan`), `panneau-journee-chantier.tsx` | Élevée (boucle de jeu) |
| B2 | Le test de l'accueil attendait l'ancienne prime de 25 000 F | `app/onboarding/page.test.tsx` | Corrigé |
| B3 | Le filtre du chat prend une suite d'années (« 2024 2025 2026 ») pour un numéro de téléphone | `moderation.ts`, `TELEPHONE` | Faible |
| B4 | Pages légales lentes : 2,8 à 5,1 s, rendues à chaque visite en interrogeant l'API | `legal/[slug]` | Faible |
| B5 | Sur un écran étroit, le panneau du guide se pose au milieu de la scène, près du personnage | `quartier-3d.tsx`, placement du guide | Faible |
| B6 | Le lint du jeu ne tourne plus : ESLint 9 attend `eslint.config.js` | `frontend` | Faible |

## 5. Le jeu

**La boucle.** L'objectif unique rend enfin le jeu lisible : activité commencée, besoin urgent, guide, fil rouge, journée de
Yao, vie libre. Mais deux des activités proposées ne paient rien en jeu connecté : la journée de Yao, et la vie libre (les
repères ne rapportent que des points d'exploration gardés par le navigateur). Le joueur suit l'objectif et s'appauvrit.

**L'économie.** Une heure de jeu passe en une minute réelle à la vitesse ×1. La faim baisse de 6 points par heure de jeu :
nourrir son personnage coûte environ 2 900 F par journée de jeu, soit près de 7 000 F par heure réelle. Une séance parfaite
rapporte 2 000 F, une fois toutes les 20 minutes réelles par lieu. Le loyer, lui, se paie par semaine réelle (5 000 à
55 000 F) : il pèse peu face à la nourriture. Effet pervers : aux vitesses ×2 et ×3, la nourriture coûte deux ou trois fois
plus par heure réelle, alors que les séances restent plafonnées en temps réel. Jouer vite appauvrit. Les défis (environ
6 400 F par jour et 23 500 F par semaine) et le fil rouge équilibrent, mais le fil rouge s'arrête au chapitre 9.

**La progression.** La courbe va jusqu'au niveau 100, soit 2,46 millions d'XP. Le contenu payant s'épuise bien avant :
missions réussies une seule fois, 9 chapitres, 11 lieux. Au-delà, le rejeu d'entraînement (25 % de l'XP) et, à partir du
niveau 30, la ferme à XP des offres perdues (S3) deviennent les seules façons de monter.

**Les débuts.** Cinq portes d'entrée, et désormais des départs différents : prime de 15 000 à 60 000 F, chambre en cité
universitaire pour les étudiants. Le vrai cursus BTS ou ingénieur reste à construire (plan dans `PLAN_SUITE_2026-10-29.md`).

**Le multijoueur.** Présence, chat modéré, signalements, équipes à +10 % d'XP. Sans heure commune, on partage la carte, pas
la journée. Aucun événement de quartier n'a lieu à heure fixe.

**Le personnage.** Le personnage sur mesure comble le premier manque d'attachement. Les modèles réalistes pèsent lourd
(14 Mo pour dix personnages) pour des joueurs aux données mobiles chères.

**Le contenu.** Il a du fond et un ancrage local : Plateau, Riviera, gbaka, attiéké, harmattan. Les chiffres techniques
vérifiés tiennent la route, par exemple 7,5 cm d'affaissement au cône d'Abrams pour un béton plastique. Le corrigé serveur
des séances est généré depuis le contenu du jeu et testé : une modification de programme qui n'est pas répercutée fait
échouer les tests.

## 6. La technique

**Points forts.**

- L'autorité serveur est enfin cohérente : séances, fil rouge et guide sont corrigés à partir des réponses brutes.
- Transactions sérialisables avec nouvelle tentative pour l'argent.
- Migrations rejouées sur une base neuve avant chaque déploiement.
- Publication additive du contenu en production.
- Tests nombreux et lisibles.
- Une CI GitHub (types, tests, compilation) qui tournera dès le prochain push.

**Points faibles.**

- La CI n'a validé aucun des 23 derniers commits, faute de push.
- Les tests unitaires simulent Prisma et n'exercent pas la couche HTTP. Le test de fumée HTTP du 29 octobre n'est pas
  versionné : il faut des tests de bout en bout avant de monter NestJS ou Next.
- La présence relevée toutes les 10 secondes coûte une invocation serverless toutes les 10 secondes par joueur connecté,
  soit 8 640 par jour pour un joueur qui reste. Le coût montera avec l'audience.
- Les barèmes existent en double (jeu et serveur), tenus par des tests de part et d'autre : la discipline fonctionne, mais
  chaque réglage coûte double.
- La première compilation en développement prend 15 minutes sur ce poste : chaque vérification dans le navigateur coûte cher.
- Il n'y a pas d'environnement de recette : le serveur local pointe sur la production, donc les parcours connectés ne se
  testent qu'en ligne.
- Le dossier de travail porte 4,9 Go de dossiers Unreal, surtout des fichiers de compilation ignorés par Git (ADR-002).

## 7. Vitrine et conformité

- Les pages légales en ligne tiennent toujours en une ligne. Les brouillons (`legal/`) attendent l'identité de l'éditeur,
  les durées de conservation et la règle pour les mineurs.
- Les messages du chat sont conservés sans limite. Il n'existe ni suppression de compte ni export des données en
  libre-service (demandes par e-mail, sous un mois).
- Aucun outil de mesure d'audience : le stockage local reste strictement nécessaire, donc pas de bandeau de consentement.
  La politique cookies le dit.
- Le blog vide est encore dans le sitemap.

## 8. Ordre conseillé

1. **Aujourd'hui** : neutraliser les comptes du seed en production (S1), pousser, déployer serveur puis jeu. Le seed est
   déjà corrigé localement.
2. **Fermer les deux fuites restantes** — *fait localement le 30 octobre* : délai de 24 h par marché perdu et XP de
   consolation unique (S3) ; correction et paiement des missions dans une transaction sérialisable (S4).
3. **Faire payer le travail** : une journée avec Yao corrigée par le serveur à partir des réponses brutes, comme les séances
   (B1). Revoir le coût de la nourriture aux vitesses ×2 et ×3.
4. **Publier les textes légaux** dès que l'identité de l'éditeur est fournie ; ajouter une purge des messages du chat.
5. **Décider de l'heure commune** (option D proposée, puis C).
6. **Mobile** : placer le guide hors du centre sur écran étroit (B5), compresser les modèles GLB, mesurer sur un vrai
   téléphone d'entrée de gamme.
7. **Contenu** : la suite du fil rouge après le chapitre 9, puis le BTS Bâtiment.
8. **Outillage** : tests HTTP de bout en bout, environnement de recette, lint réparé, puis montées NestJS et Next.
