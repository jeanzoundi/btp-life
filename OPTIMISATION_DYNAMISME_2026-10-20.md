# Monde 3D — dynamisme et fluidité

## Modifications locales

- Architecture regroupée par matériau avec `InstancedMesh` : les volumes, corniches, fenêtres et balcons utilisent deux lots le jour, trois au maximum la nuit, hors enseignes et devantures. Un volume de sélection simple conserve le clic sur les bâtiments sans tester chaque fenêtre.
- Façades et positions existantes conservées ; ajout de détails de toiture. Paysage et plans d'architecture mémorisés pour éviter les recalculs inutiles.
- Personnages : transitions marche/repos et rotations progressives, léger mouvement du buste. Au-delà de 50 unités de caméra, silhouette arrondie simplifiée ; les animations détaillées invisibles sont suspendues.
- Voitures : accélération et freinage progressifs aux feux, roues animées, feux arrière renforcés à basse vitesse. Le bus conserve son comportement précédent ; pas de nouveau système anti-collision entre véhicules.
- Modes graphiques automatique, élevé et fluide. En automatique, la résolution s'ajuste selon une mesure sur quatre secondes, après trois secondes de chauffe. Cette mesure n'est pas une sauvegarde.
- Rendu extérieur suspendu dans un intérieur ; rendu suspendu quand l'onglet est masqué. Gestion adaptative également appliquée aux intérieurs et au campus.
- Réutilisation des vecteurs de déplacement pour limiter les allocations à chaque image.
- Indicateur dans **Options** : images/s, appels de dessin et résolution. L'indicateur a son propre état React et ne provoque pas le rendu de toute la ville.

## Préservation des données

Aucune migration, suppression ou écriture en base. Aucun changement du format des sauvegardes, du temps de simulation, des comptes ni de la progression. Les modifications déjà présentes dans le dossier ont été conservées. Aucun commit effectué pour ce lot. Déploiement du frontend réalisé le 21 octobre 2026, détaillé ci-dessous.

## Vérification

- Première exécution avec parallélisme par défaut : quatre tests existants ont dépassé leur délai dans un environnement chargé. Relance à deux workers : 98 tests réussis dans 24 fichiers, sans augmenter les délais ni modifier ces tests.
- Relance finale après les derniers ajustements : 98 tests réussis, 24 fichiers, 23,79 secondes à deux workers. Compilation de production, vérification des types et génération des 46 pages réussies.
- Pages `/simulation-preview`, `/universite-preview` et atlas de façades : HTTP 200 sur la version compilée locale.
- Contrôle Three.js hors navigateur : le matériau invisible du volume de sélection reste détectable par le raycaster.
- `git diff --check` : aucune erreur ; avertissements de conversion LF/CRLF uniquement.

## Limites de la validation initiale locale

- Le pilotage du navigateur intégré expire à répétition, même lors de la sélection d'un onglet. Cela ne prouve pas un défaut du jeu, mais empêche de valider le rendu et les interactions après ces changements.
- Aucun gain de FPS mesuré avant/après. La réduction des objets de rendu est vérifiée dans le code et les tests, pas dans un profil GPU réel.
- Durant le build, certaines lectures de contenu échouent avec `ECONNREFUSED` / `ETIMEDOUT` : la réussite de compilation ne valide donc pas les missions, quiz ou données de compte.
- À contrôler dans un navigateur fonctionnel : déplacement, sélection des façades, entrée/sortie des bâtiments, transitions de niveau de détail, options graphiques, retour d'onglet masqué, téléphone et compte connecté.
- Le jeu reste graphiquement stylisé : cette optimisation n'est pas une conversion à un rendu photoréaliste.

Prévisualisation locale : http://localhost:3011/simulation-preview ; ouvrir **Options** pour choisir la qualité et consulter la mesure de fluidité.

## Déploiement du 21 octobre 2026

- Demande utilisateur : « DEPLOY ». Frontend uniquement, backend et base inchangés.
- Tests relancés avant publication : 98/98, 24 fichiers, 23,16 secondes.
- Vercel : `dpl_5C4JNUJQAAjCcmhotEdYVfwxvYWr`, statut `READY` ; compilation, vérification des types et génération des 46 pages réussies sur Vercel.
- URL immuable : https://btp-life-frontend-kfxoq7hl0-jeanzoundis-projects.vercel.app
- Adresse publique : https://btp-life-frontend.vercel.app
- Publication préparée avec `--prod --skip-domain`, puis promotion explicite du déploiement existant. La protection Vercel de l'adresse technique empêchait le test navigateur avant promotion ; elle n'a pas été désactivée.
- Après promotion, l'inspection de l'adresse publique résout le nouvel identifiant. Connexion, simulation-preview, universite-preview et atlas des façades : HTTP 200. API `/api/carriere/monde` : HTTP 401 sans authentification, attendu.
- Navigateur public : monde chargé et inspecté visuellement ; nouvelle option de qualité automatique présente ; déplacement via le plan jusqu'au café, arrivée et interactions, entrée dans l'intérieur 3D, puis sortie dans la ville vérifiés. Reprise du rendu extérieur observée après sortie. Aucun message d'erreur dans les journaux navigateur consultés.
- Mesures affichées pendant ce contrôle : environ 37–52 images/s selon la vue, résolution ×0,80. Ce n'est ni un benchmark comparatif, ni une garantie de performance sur d'autres appareils.
- Capture : `C:\Users\jeanz\.codex\visualizations\2026\10\11\01a12bb9-8aae-7942-88e8-18a937d609c5\deploiement-fluidite-2026-10-21.png`.
- Non vérifié : téléphone, compte connecté, sauvegarde de progression réelle, toutes les pièces et tous les bâtiments ; pas de surveillance instrumentée de 15 minutes ni de validation CI distante (tests locaux et build Vercel effectués).

### Retour arrière

Version précédente vérifiée avant publication : `dpl_8ksaYgT1ncsmXHsmgUPNm3yesMGr`, https://btp-life-frontend-2ijev0l24-jeanzoundis-projects.vercel.app.

En cas d'échec reproductible du chargement du monde ou d'entrée/sortie des lieux lié à cette version, revenir à cette version avec la procédure Vercel de rollback. Aucun rollback de schéma ni de données n'est nécessaire pour ce lot frontend.
