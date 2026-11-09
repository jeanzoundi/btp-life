# Livraison BTP Life — 31 octobre 2026

Les versions backend et frontend ont été publiées à partir d'une copie figée des fichiers actuels, y compris les modifications applicatives non commitées.

- Commit de base : `84b1aa3f59b1c45da8997dd5e9fb564d8af06d73`.
- Copie de livraison : `.tmp-tests/release-20261031-v2/` ; 618 fichiers sources, avec empreintes SHA-256 dans `source-manifest.json`.
- Aucun commit ni push effectué par cette livraison. Le travail présent dans le dossier a été conservé.
- Backend Ready : `dpl_4DQzzopH7Xn4FDmEqWZXx9aj2W74` ; URL propre `https://btp-life-backend-bks2w7sac-jeanzoundis-projects.vercel.app`.
- Frontend Ready : `dpl_246cK7T3AbVB7m82hoK9VwZZALHA` ; URL propre `https://btp-life-frontend-61z37z0i5-jeanzoundis-projects.vercel.app`.
- Alias publics explicitement affectés après compilation : `https://btp-life-backend.vercel.app` puis `https://btp-life-frontend.vercel.app`.

## Modifications incluses

- Journées du chantier de quartier corrigées et rémunérées côté serveur, sans exiger un chantier personnel ; progression persistante et protection contre le double versement.
- Nouvelle première journée guidée : logement, travail, paie, prochain objectif.
- Prime et logement annoncés selon le profil ; accueil corrigé avec une prime de 15 000 à 60 000 F.
- Harmonisation des règles de gains dans la démonstration ; besoins corrigés pour les vitesses accélérées.
- Ajustements des panneaux, du téléphone, des activités et du guide pour limiter les chevauchements.

Cette livraison ne constitue pas une refonte de la carte ou des modèles 3D ; les recommandations de l'analyse restent distinctes du code effectivement présent.

## Contrôles avant publication

- Backend : 34 suites, **429 tests réussis** ; génération Prisma et compilation NestJS réussies.
- Frontend : 87 suites, **472 tests réussis**, relance avec deux workers ; `tsc --noEmit` réussi. La première exécution à forte concurrence avait échoué sur des délais de démarrage des workers et un timeout de test.
- Total : **901 tests**. La compilation Next.js sur Vercel a réussi et généré 51 pages.
- Rejeu des **26 migrations** sur PostgreSQL temporaire, seed, conservation des 88 cours lus, transactions de campagne, transports simultanés et publication additive rejouable validés.
- Tests de concurrence : prime unique, rollback des séances et journées, journée payée une seule fois, progression/compétence/fatigue et nouveau guide vérifiés.
- Le premier test d'intégration s'était arrêté sur une connexion indisponible à la base temporaire. Le rejeu complet a réussi avant tout déploiement du backend.
- Audit des dépendances backend de production : 0 critique, 0 haute, 5 modérées. Les avertissements du build incluant les dépendances de développement ne sont pas assimilés à des vulnérabilités toutes exposées en production.

## Base de production

Le build Vercel a appliqué `20261030110000_chantier_quartier` : ajout du champ JSONB `UserCarriere.chantierQuartier`. Il a ensuite confirmé l'absence de migration en attente. Aucun seed complet n'a été exécuté en production. Aucun nouveau fichier de contenu `seed-data` n'était à publier par rapport au commit de base.

## Contrôles publics

- `POST /api/auth/login` avec un corps vide : 400 attendu, validation active.
- `GET /api/catalog/profils?pageSize=100` : 200.
- Accueil, `/creation-preview`, `/simulation-preview`, `/connexion` : 200.
- L'accueil servi contient bien la nouvelle prime de 15 000 à 60 000 F.
- `GET /api/carriere/journee-chantier` sans connexion : 401 attendu.
- Résultats HTTP : `.tmp-tests/http-public-20261031.json`.
- Navigateur public rechargé : quartier 3D visible, objectif « Rentre chez toi », nouveau guide « Première journée · 0/4 ». Téléphone ouvert et refermé ; le guide disparaît pendant son ouverture puis revient à sa fermeture.
- Capture de la version publique : `.tmp-tests/deploiement-20261031.png`.
- Dernière comparaison des empreintes : aucun fichier applicatif modifié ou ajouté depuis la copie de livraison.

Un parcours connecté complet et une session multijoueur à deux comptes ne sont pas couverts par ces contrôles publics.

## Repli

Versions précédentes : backend `dpl_GcPWbXpjpV8jDPNRtvZ9FJehCc1x`, frontend `dpl_AxVBbxZ1pwwzRrwGEcdZdcNvsgWH`. En cas d'incident bloquant, réaffecter les deux alias aux versions précédentes. Conserver le champ et les progrès créés par la migration additive ; ne pas supprimer les données pour revenir au code précédent.
