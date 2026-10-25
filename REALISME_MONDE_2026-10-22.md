# Monde 3D — style « carnet » et réalisme des personnages et de la ville (22 octobre 2026)

## Choix du personnage et modes classique et virtuel liés (25 octobre)

Ni commité ni déployé. Le serveur change (une route, sans migration) : backend d'abord.

- **Choisis ton personnage** au premier pas dans le monde vivant.
  - Sept personnages, chacun avec son propre modèle 3D réaliste :
    - combinaison de chantier et bleu de travail, casque compris ;
    - tailleur sombre et tenue de ville ;
    - jean et chemise, sweat à capuche, costume.
  - L'écran montre le personnage sur un plateau tournant (flèches ou clavier), son avatar 2D sur chaque carte, et le nom du personnage.
  - Le personnage le plus proche de l'avatar créé à l'inscription est proposé d'abord (teint, cheveux).
  - On le change ensuite à tout moment : en touchant son portrait dans le monde, dans les options, ou depuis l'accueil classique.
- **Le même personnage partout** :
  - En 3D, il est le joueur dans la ville, sur le chantier, à la résidence et dans chaque intérieur. Il garde son casque au chantier et en ville, et l'enlève dans les lieux de vie.
  - En 2D, l'avatar du mode classique prend son teint et ses cheveux : accueil, profil, classements, portrait du monde, autres joueurs. La tenue, le casque et les accessoires restent ceux du dressing.
  - La palette de teints de l'avatar gagne un teint foncé, celui de plusieurs modèles.
  - Les mentors appellent le joueur par le nom choisi.
- **Côté serveur** : `PATCH /carriere/avatar/personnage { personnage, nomPersonnage? }`.
  - Le choix est rangé dans `Avatar.config.personnage`, sans toucher aux réglages du dressing.
  - Un joueur sans avatar en reçoit un à son nom. La liste des personnages est validée.
  - En démonstration, le choix reste dans le navigateur.
- **Les deux modes, un seul jeu** :
  - La bascule « Monde vivant / Classique » garde l'endroit. Depuis la banque du monde, le mode classique ouvre la page de la banque ; depuis les offres d'emploi, le monde vivant ouvre l'Agence des talents. Il en va de même pour la formation, les logiciels, les compétences, les chantiers, le dépôt, le dressing et les récompenses.
  - `/app/monde?lieu=banque` ouvre directement un lieu. La page classique de chaque lieu a son bouton « Y aller dans le monde vivant ».
  - L'accueil classique gagne une carte « Monde vivant » : le personnage avec son bouton pour le changer, et la progression dans les lieux du quartier (étape, cycles bouclés), chacun avec « Y aller ».
  - Une seule table relie lieux et pages : les bâtiments du monde la lisent aussi. Dans la ville, la Galerie mène aux récompenses et le Centre Azur au dressing.
- **Vérifié** :
  - TypeScript, frontend et backend.
  - Vitest 266/266 (48 fichiers), dont la liste des personnages identique à celle du serveur, l'avatar 2D, la table des lieux et pages, la bascule qui garde l'endroit et l'écran du choix.
  - Jest backend 257/257.
  - En jeu, en démonstration :
    - l'écran du choix à la première entrée ;
    - le passage d'un modèle à l'autre sur le plateau ;
    - le choix « Tailleur sombre » renommé Yasmine : le joueur en tailleur dans la ville et au maquis, le portrait et le nom dans l'interface, puis le choix rouvert depuis le portrait et refermé avec Échap ;
    - `?lieu=banque` ouvre la banque, où Fanta salue « Bonjour Yasmine ! ».
  - La démonstration accepte aussi `?lieu=` (`/simulation-preview?lieu=marina`).
- **Fin de la vérification en jeu des lieux du 24 octobre** :
  - Banque : début de séance et première tâche réussie (« Sélection parfaite »).
  - Ouverts directement et dessinés avec leur programme et leur mentor : l'agence, la Maison des ingénieurs, l'atelier, la plateforme logistique et la Tour BTP Life.
- **Non vérifié** : en jeu avec un vrai compte, il faudrait le serveur local, qui pointe sur la base de production. Sont couverts par les tests seulement : la bascule entre modes, la carte de l'accueil et l'enregistrement du personnage.
- **Limite** : les modèles 3D sans casque (tailleur, tenue de ville, jean, capuche, costume) n'en portent pas sur un chantier ; de loin, leur version stylisée en porte un.

## Tous les autres lieux du quartier : banque, agence, bureaux, plateforme, Tour, marché, marina, sport, commerces (24 octobre)

Ni commité ni déployé. Pas de nouvelle migration, mais le serveur change (une compétence par étape, la carte des besoins étendue) : backend d'abord, frontend ensuite.

- **Six bâtiments à programme de plus**, avec la même méthode :
  - un mentor ;
  - un programme en étapes, une séance par jour de jeu aux horaires du lieu, un bilan, 40/100 au moins ;
  - un décor qui évolue avec les étapes ;
  - un poste branché sur un vrai système du jeu.
  - **Banque BTL**, avec Fanta Coulibaly (8 h – 16 h) : « Financer son projet », en 5 étapes.
    - Étapes : ouvrir son compte, épargner pour l'apport, monter le dossier de crédit, comprendre le coût du crédit, signer et décaisser.
    - Les calculs de l'argent : intérêts d'un placement, taux d'endettement (33 % au plus), coût total d'un crédit.
    - Le décor suit le dossier : carte bancaire posée dès l'ouverture du compte, dossier qui grossit au bureau des prêts, porte ronde de la salle des coffres ouverte quand le prêt est accordé.
    - Le guichet d'épargne dépose et retire pour de bon (`POST /carriere/epargne/deposer` et `/retirer`). En démonstration, l'épargne reste dans la partie.
  - **Agence des talents**, avec Esther Kacou (8 h – 17 h) : « Décrocher un poste », en 5 étapes.
    - Étapes : faire le point, le CV, le test technique (un métré de semelles), l'entretien, la proposition.
    - Le décor suit la candidature : le CV sort de l'imprimante, ta copie est notée, le contrat est signé à la fin.
    - Le mur des offres affiche les vraies offres du jeu. On y candidate pour de bon (`POST /offres/:id/candidater`), avec les conditions de niveau, de réputation, de chantiers et de compétences.
  - **Maison des ingénieurs**, avec Inès Diabaté (8 h – 18 h) : « Étude d'une structure », en 6 étapes.
    - Étapes : rassembler les données, descente de charges, dimensionner la semelle, ferrailler la poutre, note de calcul et plans, visa et contrôle.
    - Les vrais calculs d'un bureau d'études : échelle d'un plan, charge sur un poteau, semelle, section d'acier. Chaque étude change les chiffres.
    - La maquette de la structure se monte au fil de l'étude. Le tableau des compétences, au mur, est celui du joueur.
  - **Atelier de formation**, avec Didier Assi (8 h – 19 h) : « Logiciels du chantier », en 5 étapes.
    - Étapes : le métré au tableur, lire un plan numérique, le planning en Gantt et son chemin critique, le rapport journalier, la maquette BIM.
    - Le grand écran montre le logiciel du jour, et la maquette de l'imprimante 3D grandit avec la formation.
    - Le rayon des logiciels montre ceux que le joueur maîtrise.
  - **Plateforme logistique**, avec Sékou Traoré, en plein air (5 h – 19 h) : « Approvisionner les chantiers », en 5 étapes.
    - Étapes : réceptionner un conteneur, stocker selon les règles, planifier la tournée, charger les camions, suivre les livraisons.
    - Le conteneur s'ouvre une fois réceptionné, et les camions à quai sont chargés à l'étape du chargement.
    - Le bureau du dispatch suit les vrais chantiers du joueur (`GET /chantiers/mine`).
  - **Tour BTP Life**, avec Joseph Amani (8 h – 19 h) : « Diriger une entreprise de BTP », en 5 étapes.
    - Étapes : répondre à un appel d'offres, chiffrer l'offre, tenir la trésorerie, recruter et manager, clôturer l'exercice.
    - Les chiffres d'une entreprise : prix de vente depuis le déboursé sec, solde de trésorerie du mois.
    - L'écran des marchés affiche les vrais appels d'offres du jeu (`GET /chantiers/marches`).
  - **Chaque étape forme une compétence** du jeu, dans les neuf lieux à programme : 30 % de la note en XP de compétence. Par exemple, la semelle forme la géotechnique, et l'entretien d'embauche la gestion humaine. Rien en entraînement ni sous 40/100.
- **Cinq lieux de vie de plus**, chacun avec sa mécanique. Le service est le même qu'au maquis : on paie, on attend, c'est prêt, on s'installe, et les jauges bougent une fois l'article consommé.
  - **Marché des Jardins**, avec Maman Akoua (6 h – 19 h).
    - Le décor : quatre étals sous des bâches hautes (fruits, légumes, pagnes, épices), le grill de choukouya qui fume, la banane braisée, les paniers de la vannière, un pousse-pousse.
    - La carte : mangues 300 F, ananas 500 F, banane braisée 500 F, choukouya 1 500 F, et un panier de fruits à partager à 2 000 F (+25 de social).
    - Mécanique propre, **le marchandage** : on salue d'abord, puis on propose −10, −20 ou −35 %. La vendeuse accepte, contre-propose à sa limite, ou se fâche et ne vend plus qu'au prix affiché.
    - Sa limite : 5 % sans salut, 15 % après, et 5 points de plus après 17 h. Le serveur plafonne la remise à 20 % et arrondit aux 25 F.
    - On mange sur le banc, face à la rue.
  - **Marina BTP Life**, avec le capitaine Désiré (8 h – 21 h).
    - Le décor : la lagune, deux pontons sur pieux, des pirogues peintes, une terrasse sous de hautes paillotes, un kiosque à cocos, des cocotiers.
    - La carte : noix de coco 500 F au kiosque, brochettes de crevettes 3 000 F en terrasse.
    - Mécanique propre, **la balade en pirogue**, à 2 000 F : énergie −5, social +35, moral +8.
      - On embarque au bout du grand ponton. Le piroguier pousse à la perche et fait le tour du plan d'eau en 18 secondes.
      - Le joueur est assis dans la pirogue, et la caméra le suit. La pirogue contourne les pontons, puis accoste proue vers la rive.
  - **Complexe sportif**, avec Coach Aya (6 h – 22 h).
    - Le décor : un terrain synthétique à cinq avec ses lignes et ses cages, des projecteurs allumés le soir, une aire de musculation en plein air, une piste en tartan, une buvette, une tribune.
    - Mécanique propre, **le match à cinq** contre l'équipe du dépôt :
      - Neuf joueurs et le ballon bougent, et le joueur court sur le terrain. Le score avance jusqu'à 2 – 2.
      - Puis viennent les tirs au but : on tire, puis on plonge, cinq chacun, puis mort subite.
      - Le match se paie à la fin, 500 F. Le gagner ajoute +10 de social et +4 de moral.
    - Les autres activités : musculation à 1 000 F, assis au banc ; footing à 300 F, un vrai tour de piste en courant ; jus de la buvette à 300 F.
    - Le sport fatigue. Il est refusé à bout de forces, et il reste utile tant que le moral n'est pas au plus haut.
  - **Centre commercial Azur**, avec Mireille (9 h – 22 h).
    - Le décor : des escaliers mécaniques, un espace restauration à trois comptoirs avec leurs menus lumineux, un opticien, une pharmacie, et la Boutique Lagune (portants, gilets haute visibilité, casques, mannequin casqué).
    - La carte, servie à table : shawarma 2 000 F, cocktail de fruits 1 200 F, glace 1 000 F.
    - Mécanique propre, **la cabine d'essayage**, branchée sur la vraie garde-robe. Ce qu'on possède se porte (`POST /carriere/avatar/equiper`), et le reste indique le niveau ou le métier requis.
  - **Galerie des Palmiers**, avec Madame Brou (8 h – 21 h).
    - Le décor : un salon de coiffure, un pressing, une boutique de téléphonie, une pâtisserie, une bijouterie et une librairie.
    - Chaque service se rend à sa boutique, avec son commerçant : coupe 1 500 F, assis au fauteuil ; crédit téléphone 500 F ; pressing 1 000 F ; pâtisserie et café 800 F.
    - Mécanique propre, **la vitrine des réussites** : les vrais badges et certificats du joueur, exposés en 3D au centre de la galerie (douze au plus) et listés avec leur date.
- **Dans la ville** : la carte du Marché des Jardins ne reprend plus le texte du maquis ni son repas à 1 200 F. Les lieux de vie y présentent leur propre accroche.
- **Côté serveur**, sans migration :
  - La carte des besoins passe à 32 articles, ceux de tous les lieux de vie.
  - `POST /carriere/besoins/:action` accepte aussi `remise` (au marché) et `victoire` (au match).
  - Les effets peuvent être négatifs, puisque le sport fatigue. Le serveur répond « Trop fatigué(e) pour ça » si une jauge passait sous 0.
  - Un article qui vise d'abord le moral (sport, pirogue, coiffeur, pressing) reste utile tant que le moral n'est pas à 98.
  - Une séance réussie dans un lieu à programme forme la compétence de l'étape.
- **Vérifié** :
  - TypeScript, frontend et backend.
  - Vitest 248/248 (44 fichiers). Une première passe, sur une machine chargée (8 minutes), avait laissé deux fichiers en erreur sans échec de test ; relancée, elle passe entière en une minute. Elle couvre notamment :
    - les plans des cinq lieux de vie, chaque poste étant accessible depuis l'entrée ;
    - la carte identique à celle du serveur, le marchandage ;
    - la pirogue, qui ne touche aucun ponton ;
    - le tour de piste, le score du match, les tirs au but ;
    - la cabine et la vitrine.
  - Jest backend 254/254 (18 suites).
  - En jeu, en démonstration :
    - Marché : salut, contre-proposition à 250 F au lieu de 300 F, achat, repas sur le banc ; faim +12.
    - Marina : la balade complète, de l'embarquement au retour à quai ; −2 000 F, énergie −5, moral +8, social au maximum.
    - Complexe sportif : rassemblement, match jusqu'à 2 – 2, tirs au but perdus 3 – 4, match réglé 500 F ; énergie −20, moral +8.
    - Centre commercial : l'intérieur et la cabine d'essayage, qui demande en démonstration de se connecter.
    - Galerie : les services refusés (« Pas besoin ») avec moral et social pleins ; la pâtisserie commandée puis récupérée au comptoir ; −800 F, faim +15, énergie +8.
    - Banque : l'intérieur, « Attendre l'ouverture », l'accueil de Fanta et le début de la séance.
  - Correctifs trouvés en jeu :
    - Au marché, les offres affichées sont arrondies aux 25 F, comme le prix payé.
    - Le bouton de la carte dit « Réserver » pour la pirogue seulement : « Choisir » pour une activité, « Demander » pour un service, « Commander » ailleurs.
- **Non vérifié** :
  - En jeu, à cause de la fenêtre de l'aperçu, passée en arrière-plan (0 image par seconde). Les lieux ont été vérifiés le 25 octobre (voir plus haut), la carte du marché non :
    - la suite de la séance à la banque ;
    - l'agence, la Maison des ingénieurs, l'atelier, la plateforme logistique et la Tour BTP Life ;
    - la nouvelle carte du marché dans la ville.
    - Les tests couvrent leurs programmes, l'accès à leurs postes et la carte.
  - Avec un vrai compte, ne sont couverts que par les tests : l'épargne, la candidature, la cabine, la vitrine et les commandes payées.
- **Déploiement** : le backend d'abord, avec la migration `progres_lieux` du 24 octobre s'il ne l'a pas encore. Lancer `npm run test:migrations`, puis `prisma migrate deploy` en mode session, puis le health-check. Le frontend ensuite : il envoie des articles que seul le nouveau serveur connaît.

## Lieux du quartier reliés au jeu : laboratoire, dépôt, mairie, maquis, café, université (24 octobre)

Ni commité ni déployé. Le serveur change (une migration, deux routes, la carte des besoins) : il faudra déployer le backend avant le frontend.

- **La méthode du chantier sur trois autres bâtiments**, avec une mécanique propre à chacun. Un intérieur fidèle au métier, un mentor, un programme en étapes visible dans le décor, une séance par jour de jeu aux horaires du lieu, un bilan. Sous 40/100, l'étape est à refaire.
  - **Laboratoire des matériaux**, avec Adjoua Ehui : « Campagne d'essais du béton » en 7 étapes.
    - Étapes : réception des échantillons, affaissement au cône d'Abrams, confection des éprouvettes, écrasement à 7 jours, granulométrie, résistance à 28 jours et conformité, rapport.
    - Chaque campagne change les chiffres, avec des bétons conformes et d'autres non.
    - Le tableau des résultats se remplit au mur, puis le tampon CONFORME ou NON CONFORME tombe.
  - **Dépôt matériaux**, avec Brou Kouassi, en plein air : « Commande d'un chantier » en 5 étapes.
    - Étapes : réception d'un fournisseur, inventaire, préparation (CPJ 45, HA12, agglos de 15, sable de rivière), chargement et pesée, facturation au franc près.
    - Charge utile de 8 t : une commande sur quatre est en surcharge.
  - **Hôtel de ville**, avec Akissi Gnahoré : « Permis de construire » en 6 étapes.
    - Étapes : terrain (ACD, bornage), dossier, règles d'urbanisme (emprise au sol de 60 % au plus), dépôt (on refuse l'intermédiaire), délivrance et affichage, conformité.
    - Le panneau du dossier, au guichet, suit l'instruction.
  - Trois natures de tâches :
    - Situations à trois réponses, toutes expliquées.
    - Mesures à calculer : tous les points dans la tolérance, la moitié jusqu'au double.
    - Pièces à cocher : chaque intrus retire des points.
- **Les séances payées par le serveur** (avec un compte) : `POST /carriere/lieux/:slug/seance` refuse une étape qui n'est pas celle du jour.
  - XP : modulée par la forme du personnage, comme pour les missions.
  - Argent : 500 F plus 15 F par point, 2 000 F au plus.
  - Réputation : +1, ou +3 quand un cycle est bouclé.
  - La séance fatigue : énergie −5, faim −4.
  - Une seule séance payée par lieu toutes les 20 minutes réelles. Entre-temps, c'est de l'entraînement : la progression avance, avec un quart de l'XP, sans argent ni réputation.
  - La progression est enregistrée dans le compte (`UserCarriere.progresLieux`).
  - En démonstration, tout reste dans le navigateur. Si le serveur ne répond pas, la séance est gardée dans le navigateur, sans gains.
- **Le Maquis Chez Tantie Bintou** : cour à ciel ouvert, tables et chaises en plastique, braisière qui fume, comptoir carrelé, ardoise de la carte, bar et téléviseur, lave-mains, manguier, guirlande le soir.
  - Une vraie carte : garba 1 000 F, alloco poisson 1 500 F, attiéké carpe braisée 2 500 F, foutou sauce graine 3 000 F, poulet braisé 3 500 F, bissap et gingembre 300 F. Chaque plat rassasie plus ou moins.
  - On paie au comptoir, la tantie prépare, c'est servi à table, on s'assoit et on mange. Les jauges montent une fois le plat mangé, ou quand on l'emporte en partant avant.
  - Mécanique propre, **la table des collègues** : à midi et après 17 h, l'équipe du chantier mange ici.
    - Manger avec eux ajoute 20 points de social.
    - Le repas se termine sur la nouvelle du jour. Elle renvoie vers un lieu (laboratoire, dépôt, mairie, chantier, université, banque, agence, café, atelier, Maison des ingénieurs, ou le lit quand on est épuisé), avec un bouton pour y aller.
- **Le Café des Bâtisseurs** : comptoir et machine à expresso, tables de bistrot, coin salon, vitrine sur la rue.
  - Carte : café noir (qui réveille aussi), thé à la menthe, jus de passion, café-croissant, et la tournée pour la table (+60 de social, +5 de relation avec chacun).
  - Mécanique propre, **le réseau** : à midi et après 17 h, une architecte, un gérant de PME et une ingénieure structure sont attablés.
    - Une conversation par personne et par visite : la bonne approche fait grandir la relation (+12), une autre un peu (+3).
    - Chaque palier (30, 60, 90) débloque un conseil.
    - Les relations sont gardées dans la sauvegarde du monde.
  - Le tableau des annonces affiche les vraies offres d'emploi du jeu, celles à portée du niveau en tête, avec un lien vers l'agence.
- **Université BTP** : amphithéâtre avec grand écran et pupitre, gradins et étudiants, bibliothèque, emploi du temps du semestre, vitrine des diplômés.
  - Le doyen, Pr Kouamé N'Dri, propose le prochain cours de l'Académie, module par module : l'Académie d'abord, puis la Grande École.
  - On s'assoit en amphi, et le cours est projeté avec le lecteur de diapositives de l'Académie.
  - Arrivé au bout, le cours est validé dans l'Académie (`POST /carriere/cours/:id/termine`, même mutation hors ligne que la page de l'Académie). Sa mission pratique, payée, est proposée à la fin.
  - La bibliothèque permet de relire n'importe quel cours.
  - En démonstration, les cours suivis restent dans le navigateur. Sans catalogue, deux cours de démonstration.
- **Partout** :
  - « Attendre l'ouverture » et « Revenir demain » passent le temps jusqu'à l'ouverture suivante, chez Yao aussi (6 h). La démo commence à 16 h et l'hôtel de ville ferme à 16 h : sans ce bouton, on le trouvait toujours fermé.
  - Une rue en asphalte et un trottoir pavé entourent chaque intérieur, au lieu d'un vide noir.
  - La bonne réponse n'est plus toujours la première : l'ordre des choix change d'une situation à l'autre, sur le chantier aussi.
  - Les tâches manquées se voient : ✓ réussie, ≈ à moitié, ✗ manquée.
- **Côté serveur** :
  - Migration `20261024090000_progres_lieux` : une colonne JSON. `npm run test:migrations` passe (13 migrations et le seed sur une base neuve).
  - Routes `GET /carriere/lieux` et `POST /carriere/lieux/:slug/seance`.
  - `POST /carriere/besoins/:action` accepte `{ article, tablee }` : un prix et des effets par article, des points ajoutés jusqu'à 100. Sans corps, l'action garde son effet d'avant.
  - `scripts/test-migrations.ts` réessaie la suppression du dossier temporaire. Un fichier encore verrouillé sous Windows ne fait plus échouer un test réussi.
- **Vérifié** :
  - TypeScript, frontend et backend.
  - Vitest 217/217 (43 fichiers). Quatre fichiers avaient dépassé le délai pendant que le serveur de développement compilait ; ils passent relancés à part.
  - Jest backend 249/249 (18 suites), dont la validation de l'étape, les gains, l'entraînement, le cycle bouclé et chaque article de la carte.
  - En jeu, en démonstration :
    - Laboratoire : séance complète de l'étape 1, bilan 100/100, passage à l'essai d'affaissement.
    - Dépôt : séance complète avec une erreur volontaire, bilan 70/100.
    - Hôtel de ville : séance complète, puis « Revenir demain · 7 h 30 ».
    - « Attendre l'ouverture » au laboratoire et au dépôt.
    - Maquis : entrée, fermé avant 10 h, ouverture.
  - Correctifs trouvés en jeu : sol du laboratoire en résine claire et sol carrelé à la mairie, nom du mentor doublé par l'étiquette de sa balise, fente noire au seuil, calcul de la section de l'éprouvette mal arrondi dans l'explication.
- **Non vérifié** :
  - En jeu : le repas au maquis, le café, l'université. La fenêtre de l'aperçu ne dessinait plus aucune image. Les tests couvrent le service complet, la carte, le réseau, l'accès aux postes et l'ordre du semestre.
  - Une séance payée et un repas commandé avec un vrai compte : couverts par les tests Jest seulement.
- **Déploiement** : le backend d'abord (`npm run test:migrations`, puis `prisma migrate deploy` en mode session, puis health-check), le frontend ensuite. Avec l'ancien backend, le frontend garde les séances dans le navigateur, sans gains, et un plat du maquis serait facturé au prix unique d'avant (1 200 F).
- **Suite** : faite le même jour, voir la section précédente. Tous les lieux du quartier ont maintenant leur intérieur.

## Chantier de A à Z : programme, recrutement et intérieur réaliste (23 octobre)

Commité localement, pas encore déployé.

- **Intérieur du Grand chantier** : « Entrer dans le bâtiment » ouvre la parcelle elle-même, à la place de la salle de bureau.
  - Latérite compactée, palissade et portail, base vie (vestiaire et bureau de chantier, portes tournées vers la caméra), sanitaires, citerne, panneau des consignes.
  - Zone de stockage (sable, gravier, ciment bâché, agglos, aciers sur chevrons, planches), atelier de ferraillage, grue, bétonnière.
  - L'ouvrage au stade du jour, avec les engins et accessoires de l'étape : théodolite, mini-pelle, rubalise, brouette, auges, échelle, rouleaux d'étanchéité, pots de peinture.
  - L'équipe recrutée travaille, chacun à son poste selon son métier et l'étape, avec son nom affiché.
  - On se déplace en touchant le sol ou une balise, au clavier, ou depuis la liste du jour.
  - Le Chantier du Plateau se visite de la même façon, sans journée de travail.
- **Programme complet** : 18 journées en 11 étapes, chacune avec ses métiers et ses situations de terrain.
  - Recrutement (1 jour), implantation (1), terrassement et fouilles (2), semelles (2), soubassement et dallage (1), élévation du rez-de-chaussée (2), dalle du plancher haut (2), élévation de l'étage (2), toiture-terrasse (1), finitions (3), réception (1).
  - Chaque journée validée fait avancer le programme d'un jour, et l'ouvrage change à vue, dans la ville comme sur le chantier : chaises et cordeaux, tranchées et déblais, cages d'armatures puis semelles coulées, soubassement et dallage, murs sous échafaudage, dalle étayée, étage, acrotère et citerne, enduits et menuiseries.
  - Sous 40/100, la journée est à refaire et le chantier n'avance pas. Un ouvrage livré laisse place au suivant.
- **Journée** :
  - Équipement au vestiaire, puis recrutement s'il manque un métier.
  - Ensuite, deux ou trois travaux de l'étape et un point de sécurité, dans l'ordre qu'on veut, plus la livraison le premier jour de l'étape.
  - Enfin, le bilan avec Yao, à la base vie.
  - 47 situations à trois réponses, toutes expliquées : fond de fouille, enrobage des aciers, aplomb, étaiement, relevé d'étanchéité, essai de plomberie, procès-verbal de réception…
- **Recrutement** : au bureau de chantier, on choisit un candidat par métier, dans le budget journalier de main-d'œuvre.
  - Pour chaque métier, trois profils : qualifié, débutant moins cher, ou à risque (refus du casque, absences, malfaçons, travail en hauteur sans harnais). Pour le chef d'équipe, un quatrième : un expert trop cher pour tenir le budget avec les autres qualifiés.
  - Les salaires du gros œuvre sont ceux du simulateur : manœuvre 8 000 F, maçon 15 000 F, ferrailleur et coffreur 18 000 F, chef d'équipe 28 000 F.
  - Électricien, plombier, carreleur et peintre s'ajoutent au début des finitions.
  - Seule une équipe complète, fiable et dans le budget est jugée bonne. La meilleure équipe possible vaut tous les points de la journée.
- **Planning et équipe** : depuis Yao ou le chantier, les 18 jours avec l'étape en cours, et l'équipe avec sa masse salariale.
- **Avec un compte et un chantier du simulateur** : la phase en cours est rapprochée d'une étape du programme, pour le visuel et les tâches. L'équipe et le bilan restent ceux du simulateur.
- **Sauvegarde** : une sauvegarde de l'ancienne journée, en pourcentage, repart au début du programme, avec ses compteurs et son repos.
- **Aucun changement côté serveur.**
- **Vérifié** :
  - TypeScript. Vitest 176/176 (38 fichiers), dont le programme, le recrutement, la journée, la géométrie de chaque étape et l'accès à chaque poste de l'intérieur.
  - En jeu :
    - Jour 1 complet : consigne de Yao, vestiaire, recrutement de cinq profils qualifiés pour 87 000 F sur 90 000 F (« Bonne équipe », 97/100), bilan 98/100, chantier à 6 %. Depuis, la meilleure équipe vaut tous les points.
    - Passage à l'implantation, avec chaises et cordeaux.
    - Fouilles, avec mini-pelle, tranchées et déblais.
    - Semelles, vues depuis la ville : semelles coulées et attentes des poteaux.
    - Élévation, avec échafaudage, planning complet et une tâche de maçonnerie du jour 9.
    - Aucune erreur dans la console.
  - Correctifs trouvés en jeu :
    - Les cases du recrutement se plaçaient hors de leur carte : le bouton masqué était positionné par rapport au panneau.
    - Les portes de la base vie tournaient le dos à la caméra, et le joueur disparaissait derrière.
- **Non vérifié** :
  - En jeu, les étapes dalle, étage, toiture, finitions et livraison : seuls les tests de géométrie les couvrent. La fenêtre de l'aperçu est passée en arrière-plan pendant la vérification.
  - La vraie journée du simulateur avec un compte.

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

Commité localement (6a580b8). Le déroulé de la journée décrit ici a été remplacé le jour même par le programme complet, décrit plus haut.

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
