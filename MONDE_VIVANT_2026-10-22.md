# Monde 3D — rendu avancé, temps, humeur et météo (22 octobre 2026)

## Changements

- **Rendu avancé** sans nouvelle dépendance (passes intégrées à Three.js) : occlusion ambiante GTAO, halo lumineux, étalonnage puis anti-crénelage SMAA. Les textes, vitres, pluie et marqueurs sont exclus de l'occlusion pour éviter les halos sombres. Les ombres ne sont calculées qu'une fois par image.
  - Fluide : rendu direct, comme avant.
  - Automatique : halo + lissage sur mobile ; occlusion en demi-résolution sur ordinateur. Un effet est retiré si l'image reste sous 30 i/s alors que la résolution est déjà au minimum.
  - Élevée : occlusion pleine résolution.
  - Le choix fait en ville s'applique désormais aussi aux intérieurs et au campus (rayon d'occlusion adapté aux pièces).
- **Vitesses du temps** Ⅱ / ▶ / ▶▶ / ▶▶▶ : l'horloge, les habitants, les passants, les voitures, le bus et les bateaux accélèrent. Le joueur garde sa vitesse de marche et les chronomètres de mission restent en temps réel.
- **Losange d'humeur** au-dessus du joueur, vert / jaune / rouge selon la moyenne des besoins.
- **Bulles de pensée** : le joueur pense à son besoin le plus critique, sinon à la météo ou à l'heure. Les cinq habitants ont des pensées liées à leur métier et visibles à moins de 34 m.
- **Météo** déterministe par tranche de 3 h de jeu, suivant les saisons d'Abidjan : soleil, nuageux, averse, orage avec éclairs, harmattan. Pluie animée sur le GPU, ciel voilé, brouillard rapproché, lampadaires allumés par temps sombre. Un réglage dans **Options** permet de forcer la météo.
- L'indicateur de fluidité affiche aussi les effets actifs.

## Données

Aucun changement du format de sauvegarde, du backend ni de la base. La vitesse et la météo forcée ne sont pas sauvegardées : elles reviennent à 1x et automatique au rechargement. Le temps écoulé hors ligne reste rejoué à 1x.

## Vérifications

- TypeScript sans erreur ; Vitest 109/109 (27 fichiers, deux workers). 11 nouveaux tests : niveaux d'effets, saisons et ambiance météo, pensées, horloge en 2x/3x.
- Build de production local réussi. Les lectures du backend local échouent toujours (`ECONNREFUSED` / `ETIMEDOUT`) : les contenus dynamiques ne sont pas validés par ce build.
- Navigateur local : averse, orage, harmattan, passage en 3x (10 s réelles = 30 min de jeu), qualité élevée, intérieur de la résidence, mise en page à 375 px.
  - Correction après contrôle : seuil du halo de jour relevé (les murs blancs débordaient).
  - Correction après contrôle : cartouche du quartier déplacé sur mobile (il chevauchait les commandes de vitesse).
  - Correction après contrôle : icône d'harmattan remplacée (🌫️ ne s'affichait pas).
- Mesures sur la machine de développement, panneau du navigateur intégré, non comparatives :
  - Automatique (occlusion ½) : environ 35 i/s.
  - Élevée : environ 26 i/s.
  - Automatique en vue étroite (< 768 px, halo + lissage) : 45 à 54 i/s.

## Déploiement

- Vercel : `dpl_2zKws4eNomaxySmGFzjDg1i42KrH`, READY, alias https://btp-life-frontend.vercel.app (URL immuable https://btp-life-frontend-cty7mca3k-jeanzoundis-projects.vercel.app).
- HTTP 200 : `/`, `/connexion`, `/simulation-preview`, `/residence-preview`, `/universite-preview`, atlas des façades. Le backend répond 401 sans authentification sur `/api/carriere/monde`, comme attendu ; il n'a pas été modifié.
- Navigateur public : monde chargé, commandes de vitesse et météo présentes, plan → café → entrée dans l'intérieur → sortie en ville, rendu repris. Aucune erreur dans la console.
- Non vérifié : téléphone physique, compte connecté et sauvegarde réelle.
- Code déployé depuis le dossier de travail, pas encore commité au moment du déploiement.

## Retour arrière

Version précédente : `dpl_5C4JNUJQAAjCcmhotEdYVfwxvYWr` (commit `4c3b2a2`), https://btp-life-frontend-kfxoq7hl0-jeanzoundis-projects.vercel.app.

En cas de scène noire ou d'images/s effondrées sur un appareil, passer d'abord en **Mode fluide** dans Options : il désactive tous les effets. Si le problème persiste, revenir à cette version via `vercel rollback`. Aucun retour arrière de données n'est nécessaire.
