# Monde 3D — style « carnet » et réalisme des personnages et de la ville (22 octobre 2026)

## Interface « Lagune » et nouvelles fonctions (23 octobre)

La première interface copiait de trop près vie2babi.ci : mêmes polices, mêmes cartes crème, même disposition et même vue plongeante. Une deuxième version, « plan d'exécution », a été jugée trop faible. La version « Lagune » les remplace. Elle est commitée localement, pas encore déployée.

- **Style** :
  - Verre sombre et chaud, filets dorés, accents terre cuite et eau de lagune.
  - Polices Bricolage Grotesque (titres et chiffres) et Manrope (texte), auto-hébergées par Next.
  - Icônes dessinées pour le jeu.
  - Panneaux de lieu, de dialogue, de plan, d'options, de planning, de musique et intérieurs dans le même style.
- **Bâtisseur** : médaillon avec anneau d'expérience vers le niveau suivant, niveau, humeur, argent virtuel et réputation, tirés de la vraie carrière.
- **Minicarte** (nouvelle) :
  - Montre la ville autour du joueur, tournée comme la caméra : bâtiments, chaussées, plage, lagune, habitants, repères et objectif.
  - Toucher un bâtiment y envoie le joueur ; toucher la rue l'y fait marcher.
- **Cap d'objectif** (nouveau) : l'objectif en cours avec la distance et une flèche qui pointe vers lui. Le bâtiment visé est mis en valeur dans la ville.
- **Fil d'événements** (nouveau) : trajets, découvertes, missions et besoins urgents. Un besoin sous 25 propose directement le trajet (« Aller manger », « Rentrer dormir »…).
- **Raccourcis** : M plan, J planning, O options, P pause, 1 à 3 pour la vitesse.
- **Téléphone** : versions compactes de la fiche, de l'objectif, de l'horloge et des besoins.
- **Rendu** :
  - Étalonnage « lagune » : ombres légèrement bleu-vert, hautes lumières chaudes, contraste et saturation plus francs.
  - Soleil plus fort et ambiance plus basse pour des ombres nettes.
  - Vue de trois quarts plus proche (24 m, inclinée de 42°) pour voir les personnages. Pas de flou « maquette ».

## Chantier vivant et journée de travail avec Yao (23 octobre)

- **Chantier** : le Grand chantier évolue phase par phase.
  - Phases : implantation et terrassement, fondations, élévation des murs sous échafaudage, toiture-terrasse, finitions, ouvrage livré.
  - Autour : palissade en tôle au bandeau terre cuite, portail, panneau de chantier (nom, phase, avancement) et bungalow.
  - En activité : grue à tour qui tourne avec sa charge, bétonnière, matériaux, ouvriers au travail.
- **Journée de travail** (début possible de 6 h à 18 h) :
  - Yao attend au portail et donne la consigne.
  - Le joueur s'équipe au bungalow, fait le tour de sécurité (trois points le long de la palissade), réceptionne une livraison, puis revient pour le bilan.
  - Chaque étape est une situation de terrain à trois réponses, avec une explication.
  - Les situations changent d'une journée à l'autre : six de sécurité, trois de livraison.
  - L'objectif et la minicarte guident d'un poste à l'autre.
- **Bilan sur 100** : avancement du chantier, plus salaire et expérience en démonstration. La mention « Journée exemplaire » est réservée au sans-faute ; avec une erreur, 85/100 donne « Bonne journée ».
- **Avec un compte et un chantier en cours dans le simulateur** : le bilan joue la vraie journée (`POST /chantiers/mine/:id/journee`), avec salaires, matériaux, imprévus et progression réels, et affiche le journal du jour.
- **Sans chantier** : journée d'apprentissage sur le chantier du quartier. Sa progression est gardée dans le navigateur, car la sauvegarde du monde côté serveur n'accepte pas de nouveau champ.
- **Rythme** : une journée par jour de jeu. La fin de journée avance l'horloge à 17 h.
- **Habitants** : Yao porte sa tenue de chef de chantier, et chaque habitant garde son propre modèle.
- **Balises** : un volume de clic invisible couvre toute la balise, libellé compris. Avant, toucher le libellé ou le losange laissait passer le clic jusqu'au sol, et le joueur partait ailleurs.
- **Aucun changement côté serveur.**
- **Vérifié** :
  - Tests : logique de la journée, géométrie du chantier, panneaux de Yao et des situations. Vitest 159/159 (36 fichiers).
  - TypeScript.
  - En jeu, une journée complète en démonstration :
    - Consigne de Yao, trajet automatique jusqu'au bungalow, équipement.
    - Tour de sécurité (échafaudage, électricité, stockage) : chaque point s'ouvre en touchant sa balise. Le retour reste affiché après la réponse, jusqu'à « Continuer ».
    - Camion de ciment au portail, puis réception.
    - Bilan avec Yao, avec une erreur volontaire : 85/100, 4 bonnes décisions sur 5, chantier de 24 à 42 %, +6 400 FCFA et +71 points d'expérience.
    - Fin de journée : horloge avancée à 17 h, Yao au repos jusqu'au lendemain 6 h, chantier passé à l'élévation des murs, progression gardée dans le navigateur.
    - Deuxième journée, rejouée après le changement de mention, avec d'autres situations (découpe, levage, fouille, livraison d'aciers) : 85/100 donne « Bonne journée », chantier de 42 à 60 %.
    - Aucune erreur dans la console.
- **Non vérifié** : la vraie journée du simulateur avec un compte.

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

Heures en temps universel, celui d'Abidjan. Backend inchangé.

- 01:03 : `dpl_EurDbHSNaWsfDZvKrG3s8562oAyk`, construit depuis le commit 2743b7c. Retour arrière : `dpl_2zKws4eNomaxySmGFzjDg1i42KrH` (commit d1b4597).
- 07:16 : `dpl_9XBnShcQ8YaZxYybvYe5Y4xRvu3x`, construit depuis le commit d7457e9. Même code, avec le texte intégral de la licence OFL. C'est le déploiement en production (alias btp-life-frontend.vercel.app). Retour arrière : `dpl_EurDbHSNaWsfDZvKrG3s8562oAyk`.
- Contrôles du redéploiement :
  - Pages, ressources et API du backend : mêmes résultats que ci-dessous.
  - Licence servie identique au fichier du dépôt.
  - Monde de démonstration chargé sans erreur dans la console.
- Contrôles du premier déploiement :
  - Pages publiques, textures, ciel HDRI, modèles et police : réponse 200, tailles identiques aux fichiers du dépôt.
  - API du backend : 401 sans jeton, 400 pour une connexion vide.
  - Navigateur, sur le site de production : monde de démonstration avec le nouveau HUD, la place des Palmiers et les personnages réalistes ; résidence avec la liste des meubles, le menu « Dormir », le départ du personnage, puis « Arrêter ». Aucune erreur dans la console.
  - Non revu en production : la fin de l'action (pose allongée, barre de progression). Le panneau du navigateur était masqué, ce qui ralentit la page à environ 2 images par seconde. Elle avait été vérifiée en local.

## Limites

- La bibliothèque Rocketbox compte peu de personnages noirs en tenue civile : Awa et Mariam partagent le même modèle. Aucune couleur de peau n'a été retouchée.
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
