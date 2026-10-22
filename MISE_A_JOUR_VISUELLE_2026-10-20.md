# Passe visuelle — référence Vie 2 Babi

## Changements locaux

- Vue cinéma rapprochée, angle fixe et zoom conservé. La caméra libre reste accessible dans Options, avec aide adaptée.
- Neuf bâtiments reçoivent des devantures détaillées issues de quatre textures originales : café, matériaux, studio d'architecture et restaurant. Atlas partagé de 2,4 Mo, encadrements en relief, marches et auvents ; enseignes remontées pour dégager les vitrines.
- Pavage à joints décalés, variations de teinte et filtrage mipmap pour limiter le scintillement à distance.
- Palmiers à folioles : 216 éléments regroupés en une seule commande de dessin par arbre. Les coordonnées des bâtiments, les itinéraires et le schéma de sauvegarde restent inchangés.
- Aucun changement de base de données, aucun asset copié depuis le site de référence.

## Vérifications

- TypeScript sans erreur.
- Build de production réussi. Des lectures de contenus dynamiques ont émis ECONNREFUSED car le backend local est indisponible : ce build ne valide pas les données des comptes.
- 87 tests existants / 22 suites réussis hors bac à sable (premier lancement bloqué par EPERM sur le cache temporaire).
- Navigateur local : vue initiale après actualisation, trajet vers le café, ouverture des interactions, entrée dans l'intérieur, sortie, caméra libre et retour au cadrage cinéma.

## Limites

Il s'agit d'une première passe visuelle, pas d'une reproduction du site de référence. Les personnages restent procéduraux et stylisés ; les nouvelles vitrines sont des textures sur des façades 3D, et ne créent pas de nouvelles pièces visitables. La densification de la ville et des personnages animés plus détaillés restent à traiter. Validation téléphone et compte connecté non effectuée dans cette passe. Aucun nouveau commit effectué pour cette passe.

## Déploiement production

- Vercel : `dpl_8ksaYgT1ncsmXHsmgUPNm3yesMGr`, statut READY.
- URL : https://btp-life-frontend-2ijev0l24-jeanzoundis-projects.vercel.app
- Alias : https://btp-life-frontend.vercel.app
- Compilation Vercel et génération des 46 pages réussies.
- Contrôles HTTP : connexion, simulation-preview et facades-abidjan-v1.png répondent 200.
- Nouveau cadrage, pavage, palmiers et façade du café observés dans le navigateur public. Plan ouvert et trajet vers le café lancé.
- Contrôle final d'entrée dans le café en production non confirmé : le navigateur d'automatisation a ensuite expiré sur ses commandes. Ne pas confondre cette limite avec les tests locaux d'entrée/sortie déjà réussis.
- Version précédente disponible pour retour arrière : `dpl_Gu4LZwuoTPG7HBreXvPe46R97mwA`, https://btp-life-frontend-jbl0i1dwz-jeanzoundis-projects.vercel.app. Revenir à cette version si une erreur applicative reproductible empêche le chargement du monde ou les interactions.
- Aucun changement de base de données ni de configuration de compte.

Origine et prompt des textures : `frontend/public/materials/FACADES-ORIGINE.md`.
