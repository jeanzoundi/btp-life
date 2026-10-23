# Monde 3D — style « carnet » et réalisme des personnages et de la ville (22 octobre 2026)

## Style d'interface (référence vie2babi.ci, sans reprise de leurs ressources)

- HUD en cartes crème à bord encré et ombres franches. Polices Bungee et Archivo, auto-hébergées par Next.
- Carte profil en haut : argent virtuel, niveau, météo, heure. Boutons plan et options, pastille d'objectif du moment, pastille de quartier, vitesses du temps.
- Besoins en anneaux en bas de l'écran. Panneaux de lieu, de dialogue, de plan, d'options et de modes, ainsi que les intérieurs, dans le même style.
- Vue plongeante face au nord, reculée automatiquement en portrait. Le joueur arrive par la porte, côté façade, et reste repérable derrière les toits (losange et anneau toujours visibles).

## Réalisme

- **Personnages** : 7 modèles articulés Microsoft Rocketbox (licence MIT). Ouvrier casqué pour le joueur, chef de chantier, cadres, tenues de ville.
  - 11 animations : course, marche, repos, assis, parle, salue.
  - Fondus entre animations et cadence calée sur la vitesse de déplacement.
  - De 6 400 à 9 400 triangles par personnage, environ 0,4 à 0,8 Mo chacun, environ 6 Mo au total avec les animations.
  - Les personnages stylisés de l'autre outil (identités, palettes) servent de version de chargement. Leur silhouette prend le relais au-delà de 60 m du joueur.
- **Ville** : matériaux photographiques Poly Haven (CC0) projetés en coordonnées monde, pour qu'un mètre de mur reste un mètre de texture.
  - Enduit sur les murs, tuiles canal sur les toits, pavés de grès, tôle ondulée sur les kiosques et abris.
  - Ciel HDRI pour l'éclairage d'ambiance et les reflets, dont l'intensité suit la journée.
- **Textes 3D** : police locale Noto Sans (OFL) par défaut. Auparavant, les étiquettes chargeaient une police depuis un CDN externe ; si ce chargement échouait, la scène restait vide. C'était le cas de la vue « personnages » de `/direction-artistique`.
- **Performance** :
  - 324 tirets de marquage, bandes de passages piétons et éléments de garde-corps instanciés en une seule commande de dessin.
  - Matériau d'enduit partagé par couleur.
  - Appels de dessin passés d'environ 950 à environ 750.

## Intérieurs interactifs

- **Principe** : on touche un meuble, ou on le choisit dans la liste du panneau. Un menu propose les actions, avec leur coût, leur effet et leur durée. Le personnage s'y rend puis prend la pose (allongé, assis ou debout) avec une barre de progression ; « Arrêter », un déplacement manuel ou Échap interrompent l'action.
- **Appartement** :
  - Lit : dormir.
  - Canapé : regarder la télévision (l'écran s'allume), inviter un voisin.
  - Table et chaise : étudier ses plans.
  - Cuisinière : cuisiner, avec de la vapeur.
  - Douche : jet d'eau.
  - Une télévision et une chaise ont été ajoutées au mobilier ; à la maison, le bâtisseur retire son casque.
- **Maquis et café** : commander un plat au comptoir, s'attabler pour discuter. Ailleurs : se renseigner à l'accueil. Lieux de loisirs : se détendre sur la banquette.
- **Effets** : dormir, cuisiner, commander, recevoir un voisin et discuter passent par les actions existantes du serveur (`POST /carriere/besoins/:action`), avec les mêmes coûts : repos gratuit, repas 1 200 F, social 900 F.
  - Le serveur est appelé au début de l'action : un solde insuffisant l'arrête aussitôt, avec le message du serveur.
  - En démonstration, les jauges de la ville évoluent avec la même règle, sans sauvegarde.
  - Les autres actions sont des moments de vie sans effet sur les jauges, et le menu l'indique.
- **Mobile** : le panneau des pièces se replie par défaut pour laisser voir et toucher les meubles.
- **Aucun changement côté serveur.**

## Travail parallèle

Un autre outil a travaillé de 08:35 à 12:40 dans le même dossier : personnages stylisés et identités, place des Palmiers, page `/direction-artistique`, tests associés. Les deux séries de changements cohabitent. Modifications de ma part dans ses fichiers :

- `humain-monde.tsx` : enveloppe qui affiche le modèle réaliste de près et sa version stylisée de loin.
- `personnage-stylise.tsx` : option `silhouette`.

## Vérifications

- TypeScript sans erreur.
- Vitest 133/133 (32 fichiers), dont l'accessibilité de chaque meuble depuis l'entrée selon la vraie navigation de chaque lieu.
- Navigateur, intérieurs :
  - Canapé et télévision (pose assise), lit (pose allongée), cuisine, douche.
  - Parcours ville → résidence → « Dormir » → sortie : énergie de 78 à 100 et moral de 82 à 86 en démo.
  - Maquis : « Commander un plat », faim de 64 à 100.
- Build de production réussi (47 pages).
- Navigateur local : joueur réaliste en repos puis en course, orienté dans le sens du déplacement. Personnages réalistes dans la ville, à la résidence et dans l'atelier `/direction-artistique` (gros plans de Jean et de Fatou, cheveux compris).
- Fluidité mesurée dans le panneau étroit de l'aperçu : 34 à 41 images/s en qualité automatique (halo et lissage, résolution ×1,10 à ×1,25). Ce n'est pas un banc d'essai et cela ne garantit rien sur d'autres appareils.
- Non vérifié : téléphone physique, compte connecté et sauvegarde réelle.

## Déploiement (23 octobre)

- Frontend en production : `dpl_EurDbHSNaWsfDZvKrG3s8562oAyk` (alias btp-life-frontend.vercel.app), construit depuis le commit 2743b7c. Backend inchangé.
- Retour arrière : `dpl_2zKws4eNomaxySmGFzjDg1i42KrH` (commit d1b4597).
- Contrôles :
  - Pages publiques, textures, ciel HDRI, modèles et police : réponse 200, tailles identiques aux fichiers du dépôt.
  - API du backend : 401 sans jeton, 400 pour une connexion vide.
  - Navigateur, sur le site de production : monde de démonstration avec le nouveau HUD, la place des Palmiers et les personnages réalistes ; résidence avec la liste des meubles, le menu « Dormir », le départ du personnage, puis « Arrêter ». Aucune erreur dans la console.
  - Non revu en production : la fin de l'action (pose allongée, barre de progression). Le panneau du navigateur était masqué, ce qui ralentit la page à environ 2 images par seconde. Elle avait été vérifiée en local.

## Limites

- La bibliothèque Rocketbox compte peu de personnages noirs en tenue civile : Awa et Mariam partagent le même modèle. Aucune couleur de peau n'a été retouchée.
- Le texte intégral de la licence OFL 1.1 reste à joindre à `public/fonts/LICENCE-NOTO.md`. La police n'embarque que la mention de copyright et l'adresse de la licence.
- Commits locaux uniquement, sans push.

## Commits

Cinq commits locaux, dans l'ordre où le travail a été fait :

1. Style (3dc0297).
2. Ville réaliste (26ec814).
3. Travail de l'autre outil, tel quel (64adca6).
4. Personnages réalistes (a7ab880).
5. Intérieurs interactifs (2743b7c).

L'autre outil s'appuyait sur les matériaux de la ville, posés juste avant : son aperçu de la place centrale utilise les pavés Poly Haven. Le réalisme est donc réparti avant et après son commit, pour que chaque commit compile seul.

Régénération des ressources : `frontend/scripts/ressources-3d/README.md`. Crédits : `frontend/public/personnages/CREDITS.md` et `frontend/public/materials/LICENCES.md`.
