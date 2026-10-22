# Monde virtuel — livraison du 19 octobre 2026

## Périmètre

- Personnages articulés communs à la ville, au campus et aux intérieurs : proportions adultes, visage, vêtements, marche et posture assise.
- Sols avec textures photographiques CC0 locales (couleur, normale, rugosité), relief des murs et environnement de reflets partagé.
- Caméra de promenade rapprochée et vue urbaine commutables.
- Calcul de trajets qui contourne les emprises des bâtiments.
- Véhicules remodelés, phases des feux coordonnées avec intervalle de dégagement.
- Six îlots végétalisés, feuillage instancié ; vagues animées sur le GPU.
- Décalage du panneau musical pour dégager la commande de caméra.
- Conservation des travaux de campus déjà présents dans le dossier.

## Vérifications avant publication

- TypeScript : réussi.
- Vitest : 22 suites, 87 tests réussis. Une première exécution a dépassé le délai de 5 secondes sur un test d'interaction ; la relance complète sans rendu 3D actif réussit sans modifier les assertions ni les délais.
- Compilation Next.js locale : réussie. Des lectures du backend local ont renvoyé ECONNREFUSED pendant la génération ; ce build ne valide donc pas les contenus dynamiques du compte.
- Navigateur local : plan, trajet jusqu'au café, entrée dans le bâtiment et arrivée à l'espace Terrasse vérifiés. Aucun message d'erreur dans les logs navigateur consultés.

## Données et limites

Aucune migration, suppression, restauration ou réinitialisation de base de données. Les sauvegardes existantes ne sont pas modifiées par cette livraison. La route simulation-preview reste explicitement une démonstration non sauvegardée.

Le rendu reste stylisé et procédural, pas photoréaliste ni équivalent à un jeu AAA. La circulation n'est pas un simulateur complet de conduite. Validation sur téléphone physique et parcours authentifié non réalisés dans ce lot.

## Publication confirmée

- Vercel : dpl_Gu4LZwuoTPG7HBreXvPe46R97mwA, état READY.
- Domaine principal vérifié : https://btp-life-frontend.vercel.app
- Version immuable : https://btp-life-frontend-jbl0i1dwz-jeanzoundis-projects.vercel.app
- Les pages simulation-preview, universite-preview, residence-preview, bureaux-preview et connexion répondent HTTP 200.
- Les neuf textures locales répondent HTTP 200 avec le type image/jpeg.
- Monde public affiché ; changement entre caméra promenade et vue urbaine vérifié visuellement.
- Parcours public vérifié : plan → résidence → entrée → chambre → sortie dans la ville. Aucun message d'erreur ou d'avertissement dans les logs navigateur consultés.
- Pas de commit ni de push exécuté dans ce lot : publication directe du dossier de travail autorisée par la demande de déploiement.

## Retour arrière

Version de production précédente vérifiée : dpl_58BetdTyBgfoWfJgA5sMUpHTym5W.
URL : https://btp-life-frontend-3qsp9ck6t-jeanzoundis-projects.vercel.app

Revenir à cette version via Vercel si une scène reste vide, si une texture renvoie une erreur HTTP, si l'entrée/sortie d'un bâtiment échoue ou si la sauvegarde connectée régresse. Aucun rollback de données n'est nécessaire pour cette livraison frontend.

Les crédits des textures figurent dans frontend/public/materials/LICENCES.md.
