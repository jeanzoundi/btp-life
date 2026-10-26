# BTP Life face à GTA et aux Sims : ce qui manque (25 octobre 2026)

**Méthode.** Les chiffres viennent du code et des données du jeu au commit `6d6dfdb` :

- le schéma Prisma (56 modèles) ;
- le contenu du seed (`prisma/seed.ts`, `prisma/seed-data/`) ;
- les tables du monde 3D (`frontend/src/lib`, `quartier-3d.tsx`) ;
- les règles du serveur (`carriere/`, `chantiers/`).

Aucune donnée personnelle de joueur n'a été lue.

GTA sert de repère pour la ville ouverte : se déplacer, une ville qui vit, des missions, l'argent, le jeu en ligne. Les Sims servent de repère pour la vie du personnage : besoins, maison, relations, carrière, objectifs. BTP Life n'a pas à les copier (pas d'armes ni de police, pas de famille sur plusieurs générations). Il s'agit de reprendre ce qui rend leurs mondes vivants, transposé au BTP ivoirien.

## En bref

- **Le point fort est unique : la carrière jouée.**
  - 30 métiers, 81 missions, 296 questions.
  - 131 tâches dans les lieux du monde, un chantier en 18 journées, 16 chantiers à gérer.
  - Ni GTA ni Les Sims ne font vivre un métier aussi concrètement. Les 21 bâtiments de la ville sont tous visitables, chacun avec une fonction.
- **La ville ne vit pas sans le joueur.** 12 passants tournent en boucle et les PNJ n'ont pas d'horaires. La météo ne change rien au jeu, on ne monte dans aucun véhicule et il n'y a pas de téléphone.
- **La vie du personnage reste mince.**
  - Les 4 besoins baissent en heures réelles, alors que l'horloge du monde va 60 fois plus vite.
  - La douche, la télévision et « étudier tes plans » n'ont aucun effet.
  - Le logement ne s'aménage pas et ne se change pas.
  - Les 8 traits promettent des effets qu'aucun code n'applique.
- **L'argent n'a pas de but.**
  - Une séance réussie rapporte jusqu'à 2 000 F, et le plus cher des 33 articles coûte 3 500 F.
  - L'épargne rapporte 0,4 % par jour, composé : environ ×4,3 par an.
  - Il n'y a ni loyer, ni logement à acheter, ni véhicule, ni outillage. L'entreprise du joueur se résume à un nom et aux marchés de la filière entrepreneur.
- **Des données prêtes mais endormies.** 8 des 56 tables ne servent à aucune mécanique :
  - côté jeu : événements et défis, imprévus à choix, messages des PNJ, certificats, entreprise virtuelle ;
  - côté offre commerciale : abonnements et comptes B2B.

## 1. Ce que contient l'application

| Domaine | Données |
|---|---|
| Ville | 236 × 186 m (≈ 0,04 km²), 5 quartiers, 21 bâtiments, tous visitables |
| Lieux à programme | 11 lieux, 59 étapes, 131 tâches (75 situations à trancher, 36 calculs, 20 sélections), un mentor par lieu. Une séance réussie (note d'au moins 40) rapporte 500 + 15 × note F (de 1 100 à 2 000 F) et de 26 à 50 XP ; un échec ne rapporte que quelques XP |
| Grand chantier | 18 journées, 11 phases, recrutement des ouvriers |
| Lieux de vie | Maquis, café, marché, marina, sport, Centre Azur et Galerie : 31 articles. Chez soi : 2 articles, 5 meubles, 6 actions |
| Besoins | Énergie, faim, social, moral. Baisse par heure réelle : 4, 6, 2 et 1 points. L'état des besoins module l'XP de 0,7 à 1,0 |
| Temps et ambiance | 1 h de jeu = 1 min (vitesse ×1 à ×3), 5 météos dont l'harmattan, 4 zones musicales, circulation avec feux, 12 passants sur 6 parcours |
| Personnes | 5 habitants à qui parler (affinité de 0 à 100), 11 mentors, les hôtes des 7 lieux de vie, Yao au chantier, 8 PNJ côté serveur |
| Personnage | 7 personnages 3D, avatar 2D, 39 objets de dressing (6 emplacements, 5 raretés), 8 traits |
| Carrière | 30 profils dans 8 filières (niveau de départ de 1 à 9), 22 règles de promotion, niveaux de 1 à 100, réputation de 0 à 1 000, 17 compétences, 12 logiciels et 19 exercices, 10 badges, 5 offres d'emploi |
| Formation | 81 missions de 14 types (dont 30 quiz et 19 décisions), 296 questions, 23 modules, 89 cours |
| Chantiers gérés | 16 chantiers de 3 à 5 phases, dont des marchés publics et privés. 4 imprévus tirés au hasard : pluie, panne, visite du client, presque-accident |
| Modes | 6 modes de jeu, 19 étapes en tout |
| Multijoueur | Asynchrone : jusqu'à 9 joueurs récemment actifs placés au centre-ville, avec leur profil public et l'action « socialiser » |
| Pages | 49 pages, dont 25 dans l'application connectée |

## 2. Face à GTA : la ville

| | GTA | BTP Life aujourd'hui | Ce qui manque | Priorité |
|---|---|---|---|---|
| Taille et densité | Une région entière : ville, banlieues, campagne, côte | 0,04 km², 5 quartiers, 21 bâtiments, mais tous visitables | Pas besoin d'une région. Il manque des rues de remplissage, des repères d'Abidjan (ponts, tours du Plateau, lagune) et des intérieurs secondaires (boutiques, maisons de voisins) | Moyenne |
| Se déplacer | Courir, sauter, nager ; des centaines de véhicules, des taxis | Marche seule (clic ou ZQSD) et trajet automatique depuis le plan. Les voitures ne sont que du décor | Courir. Le taxi compteur, le gbaka ou le wôrô-wôrô comme trajets rapides payés en FCFA. Plus tard, une moto ou un pick-up de chantier gagné par la carrière | Haute |
| Missions et récit | Une histoire scénarisée avec cinématiques, des appels qui lancent les missions, des missions variées (poursuite, convoi, braquage) | Beaucoup de contenu, mais présenté en panneaux (situations, calculs, sélections). Chaque lieu a son programme isolé, sans fil rouge | Un fil rouge qui traverse la ville : le même immeuble suivi du permis à la mairie au crédit à la banque, puis aux essais du labo, à l'inspection et à la livraison. Des tâches jouées dans l'espace (livrer, inspecter, guider une grue). Des plans de caméra aux moments clés | Haute |
| Une ville qui vit | Des milliers de passants et de voitures avec leurs routines et leurs réactions | 12 passants en boucle, des voitures qui s'arrêtent aux feux, des habitants immobiles | Des horaires : ouvriers au chantier à 6 h, maquis plein à midi, rues vides la nuit. Des passants qui réagissent, une foule différente selon le quartier | Haute |
| Conséquences | Les étoiles de recherche : la police réagit aux écarts | Un écart ne coûte qu'une note dans la séance | L'équivalent BTP : contrôles HSE surprises, amendes de la mairie, réputation qui baisse si on bâcle la sécurité, accident si l'équipe est épuisée | Moyenne |
| Argent et biens | Propriétés, entreprises qui rapportent, garages, bourse | Paie des séances, 33 articles de 300 à 3 500 F, épargne à 0,4 % par jour. Aucune dépense durable | Des buts et des dépenses : loyer, logement plus grand, véhicule, outillage, une entreprise avec capital et employés | Haute |
| Personnalisation | Boutiques de vêtements, coiffeurs, garages de préparation | 7 personnages 3D fixes. Les 39 objets du dressing n'habillent que l'avatar 2D | Le dressing visible sur le personnage 3D, une boutique au Centre Azur qui change la tenue, un coiffeur | Moyenne |
| Activités annexes | Golf, tennis, courses, fléchettes… | Match à cinq et tirs au but, pirogue, marchandage, réseau au café | Plus de rejouabilité : records, tournois, défis entre joueurs | Basse |
| Téléphone | Contacts, SMS, appels, internet, applications | Rien dans le monde. Le courrier ne se lit que chez soi ou sur la page Messages | Un téléphone dans le HUD : messages, appels des mentors qui lancent une étape, itinéraire, banque, offres d'emploi. Il relierait les pages classiques au monde | Haute |
| Ambiance sonore | Radios avec animateurs, bruits de la ville, voix | 4 zones musicales générées et quelques sons d'interface | Bruits de chantier, de marché, de lagune. Une radio quand on prend un taxi | Moyenne |
| Météo et heure | Elles changent la circulation, la conduite, les passants | Effets visuels et une pensée du personnage (« Vite, à l'abri ! »), sans effet sur le jeu | La pluie arrête le chantier et vide les rues. L'harmattan soulève la poussière et fait baisser l'énergie plus vite. La grande saison des pluies (mai à juillet à Abidjan) au calendrier | Moyenne |
| En ligne | Des sessions d'une trentaine de joueurs en temps réel, des bandes, des braquages en coopération, des événements | Asynchrone : 9 places au centre-ville, un profil, « socialiser ». Aucune présence en direct | Une présence en direct (Supabase, qui héberge déjà la base, propose le temps réel), des émotes, un chat de quartier. Puis des chantiers en coopération, avec des entreprises de joueurs à la place des bandes | Haute, mais coûteux |

## 3. Face aux Sims : la vie

| | Les Sims | BTP Life aujourd'hui | Ce qui manque | Priorité |
|---|---|---|---|---|
| Créer son personnage | Corps et visage réglables, coiffures, tenues par occasion, 3 traits et une aspiration, démarche, voix | 7 personnages prêts à l'emploi et un nom, l'avatar 2D (teint, cheveux), 1 à 3 traits parmi 8 | Régler le personnage 3D (teint, coiffure, tenue) : le studio de personnage en cours dans l'autre outil va dans ce sens. Des traits qui changent vraiment le jeu | Moyenne |
| Besoins et humeur | 6 besoins (faim, énergie, vessie, hygiène, divertissement, social) et des émotions qui changent les interactions et le travail | 4 besoins et un moral unique. La baisse suit les heures réelles, alors qu'une journée du monde dure 24 minutes | Faire baisser les besoins au rythme du monde. Ajouter l'hygiène (la douche existe déjà) et le divertissement (les loisirs existent déjà). Des humeurs simples : « bien reposé », « fier de son chantier », « stressé par le délai » | Haute |
| Le logement | Mode construction et achat, des milliers d'objets, déménagements, factures | Un appartement fixe, 5 meubles et 6 actions (dont 3 sans effet), ni décoration ni loyer | **Construire ou rénover son propre logement avec ses compétences** : métré, devis, matériaux au dépôt, travaux. Dans un jeu de BTP, c'est l'idée qui distinguerait BTP Life | Haute |
| Relations | Amitié et romance de −100 à +100, des dizaines d'interactions, des statuts (ami, meilleur ami, rival) | Affinité de 0 à 100 avec 5 habitants (+1 par salut), 3 interactions (saluer, conseil, situation). « Relation amicale » dès 3 sur 100 | Un réseau qui sert la carrière : recommandation pour une offre, cooptation, client fidèle. Plus d'interactions, des seuils cohérents | Moyenne |
| Carrière et compétences | Carrières d'une dizaine de niveaux, quelques carrières jouées, compétences de 1 à 10 | Le point fort : 30 métiers, 22 règles de promotion, 17 compétences, 12 logiciels, CV, candidatures | Des métiers au-delà du niveau de départ 9, alors que les niveaux vont jusqu'à 100 (directeur de travaux, directeur technique, chef d'entreprise). Plus d'offres d'emploi (5 seulement). Des certificats réellement délivrés | Moyenne |
| Cycle de vie et grands moments | Âges, anniversaires, mariages, générations | Une chronologie de carrière (promotions, embauches, diplômes, chantiers livrés), mais aucun moment fêté dans le monde | Des cérémonies dans le monde : remise de diplôme, inauguration du chantier livré, pot de départ, fête de promotion | Basse |
| Autonomie | Les Sims agissent seuls quand on les laisse | Personne n'agit seul, ni le joueur ni les PNJ | Surtout pour les PNJ (voir les horaires dans la partie GTA) | Basse |
| Objectifs | Aspirations par paliers, envies du moment, boutique de récompenses | Métier visé, objectif affiché dans le HUD, 6 modes, 10 badges, classements. La table des défis du jour et de la semaine existe, mais rien ne la lit | Des défis du jour et de la semaine sur la table `Evenement`, déjà éditable dans l'admin. Des paliers vers le métier visé | Haute |
| Événements et saisons | Fêtes, festivals, calendrier, saisons | Aucun événement de quartier, une météo tirée au hasard | Un calendrier : fête de quartier, salon du BTP, inaugurations, saison des pluies qui pèse sur les chantiers | Moyenne |

## 4. Ce que BTP Life fait déjà mieux

- **Des bâtiments qui servent tous.** Dans GTA, la plupart restent fermés ; dans Les Sims, le travail se passe hors champ.
- **Une carrière réellement jouée.** Du vrai contenu professionnel (calculs avec tolérance, normes, situations de chantier) et un mentor qui corrige.
- **Deux modes liés.** Même progression, même carte, même personnage, et la bascule garde l'endroit.
- **Un ancrage local cohérent.** Abidjan, le FCFA, le maquis et le garba, l'harmattan, des mentors aux noms ivoiriens.
- **La valeur pédagogique**, la vraie différence avec les deux références.

## 5. Incohérences relevées dans les données

- **Besoins et horloge.** Les besoins baissent par heure réelle (faim −6, énergie −4, social −2, moral −1), alors qu'une journée du monde dure 24 minutes.
  - Une journée de jeu ne fait baisser la faim que de 2 points environ.
  - Une nuit au lit fait passer l'horloge du monde jusqu'à 6 h 30 sans que la faim baisse pour autant.
- **Traits.** Leurs textes promettent des effets que rien n'applique, ni côté serveur ni côté jeu. Par exemple : « parler aux PNJ remonte ton moral plus qu'à la moyenne », « tu tiens mieux la cadence ».
- **Affinité.** La jauge va jusqu'à 100, mais on est en « relation amicale » dès 3, soit trois saluts.
- **Chez soi.** La douche, la télévision et « étudier tes plans » sont des moments sans effet.
- **Métiers.** Les niveaux vont jusqu'à 100 et 24 missions demandent plus que le niveau 20, mais le dernier métier commence au niveau 9.
- **Économie.** L'épargne rapporte 0,4 % par jour, composé, soit environ ×4,3 par an ; le plafond de 60 jours ne joue qu'après une longue absence. Faute de dépenses durables, l'argent s'accumule.
- **Imprévus.** Les chantiers gérés tirent 4 imprévus écrits en dur, sans choix. Pourtant, la table `Imprevu` prévoit des options et des conséquences, et elle est éditable dans l'admin.
- **Tables sans mécanique.**
  - Côté jeu : `Evenement`, `Imprevu`, `PnjMessage`, `Certificat` (jamais délivré), `EntrepriseVirtuelle` (jamais créée).
  - Côté offre commerciale : `Abonnement`, `CompteB2b`, `B2bMembre`.

## 6. Par où commencer

Ordre proposé, du meilleur rapport entre effet et effort au plus lourd. L'effort est noté S (quelques fichiers), M (un nouveau système) ou L (un chantier de fond).

1. **Besoins au rythme du monde, hygiène, divertissement, humeurs (S à M).**
   - C'est le cœur d'une simulation de vie, et les objets existent déjà : douche, télévision, lieux de loisirs.
   - Calculer la baisse selon le temps du monde : l'heure du monde est déjà sauvegardée dans `etatMonde`.
   - Ajouter deux jauges à `UserCarriere` (une migration), donner un effet à la douche, à la télévision et aux loisirs, et tirer des humeurs des besoins.
2. **Défis du jour et de la semaine, imprévus à choix (S à M).**
   - Ils donnent une raison de revenir chaque jour, et leur contenu s'édite sans déploiement.
   - Lire `Evenement` et `Imprevu` côté serveur, puis les afficher dans le HUD et au Grand chantier.
3. **Des traits et une affinité qui comptent (S).**
   - Appliquer les effets promis par les 8 traits.
   - Poser des seuils d'affinité cohérents, par exemple 20, 50 et 80.
4. **Le téléphone du joueur (M).**
   - Les messages (`UserMessage`), les appels des mentors (`PnjMessage`), l'itinéraire, la banque, les offres.
   - Les pages classiques deviennent accessibles depuis le monde.
5. **Une ville à horaires (M).**
   - Des horaires de PNJ calés sur ceux des lieux, déjà définis.
   - Une foule qui varie selon l'heure et le quartier, une météo qui pèse sur le jeu.
6. **Une économie avec un but (M).**
   - Un loyer à la Résidence Lagune, un logement plus grand, des trajets en taxi ou en gbaka payés, de l'outillage.
   - Ramener l'épargne à un taux de jeu raisonnable.
   - Une entreprise avec capital et employés, sur `EntrepriseVirtuelle`.
7. **Construire et rénover son logement (L).** Métré, devis, matériaux au dépôt, travaux en plusieurs journées : comme le Grand chantier, mais chez soi.
8. **Un fil rouge narratif (L).** Une campagne qui traverse les lieux, avec un concurrent (le rôle `PnjRole.CONCURRENT` existe déjà) et des plans de caméra aux moments clés.
9. **Le jeu en ligne en direct (L).** D'abord la présence, les émotes et un chat de quartier. Ensuite des chantiers à plusieurs et des entreprises de joueurs.
10. **Contenu de carrière (S à M, surtout du contenu).**
    - Des métiers au-delà du niveau 9.
    - Une trentaine d'offres d'emploi au lieu de 5.
    - Des certificats délivrés à la fin des parcours.

## Suivi

- **25 octobre — chantier n° 1 fait** (détails dans `REALISME_MONDE_2026-10-22.md`) :
  - les besoins suivent l'horloge du monde pendant qu'on joue (le sommeil coûte deux fois moins, l'énergie se repose) ;
  - deux jauges en plus : l'hygiène et les loisirs ;
  - des humeurs et une forme qui règle les gains d'XP (+5 % en pleine forme).
- Incohérences du § 5 réglées :
  - besoins et horloge ;
  - douche et télévision sans effet (« étudier tes plans » reste un moment sans effet) ;
  - en plus, le déclin en temps réel qui se perdait dans les arrondis.
- **26 octobre — chantier n° 8 commencé : le fil rouge de la Résidence Akwaba.**
  - Une campagne en neuf chapitres suit le même immeuble (R+3, huit logements, pour Mme Touré) de lieu en lieu :
    1. l'offre clé en main à la Tour BTP Life ;
    2. le sol au laboratoire ;
    3. les fondations à la Maison des ingénieurs ;
    4. le permis à l'hôtel de ville ;
    5. le prêt à la banque ;
    6. la commande au dépôt ;
    7. le coulage à la plateforme logistique ;
    8. la sécurité du gros œuvre au Chantier du Plateau ;
    9. la réception sur la parcelle, avec Mme Touré.
  - Les chiffres se suivent d'un chapitre à l'autre :
    - le sol à 200 kPa du laboratoire donne les semelles de 2 m du bureau d'études ;
    - ces semelles font les 32 m³ commandés au dépôt, puis les quatre toupies du coulage ;
    - la retenue de garantie apprise à la banque est rendue à la réception.
  - Chaque chapitre se joue chez le mentor du lieu, à ses heures d'ouverture. Ses trois tâches se font aux vrais postes de l'intérieur.
  - Le chapitre est validé à 50/100, une seule fois :
    - 2 500 F et jusqu'à 80 XP par chapitre ;
    - 25 000 F, 280 XP et 15 de réputation à la réception.
  - Le serveur tient la progression, dans une nouvelle colonne `UserCarriere.campagne` (migration `20261026090000_campagne`). Il paie dans une transaction sérialisable, et Mme Touré écrit au joueur au permis et à la remise des clés.
  - La parcelle existe dans la ville, au Plateau Nord, entre l'hôtel de ville et le laboratoire :
    - l'immeuble y monte à chaque chapitre validé : bornage, sondages, implantation, permis affiché sur la palissade, base vie, fouilles, gros œuvre avec grue et échafaudage, immeuble fini, puis livré avec ses habitants ;
    - elle figure sur la minicarte, dans l'objectif du HUD et en tête du programme du matin.
  - Complété le même jour, voir plus bas : le concurrent et les plans de caméra.
- **26 octobre — la ville à l'échelle, le téléphone et les transports** (demande hors liste) :
  - véhicules aux vraies dimensions et à l'échelle des personnages (`lib/echelle-monde.ts`) : voiture, taxi orange, gbaka, bus de 11 m, moto ;
  - circulation à droite, files d'attente aux feux, bus à ses abris ; manguiers et flamboyants, lampadaires, ligne électrique, étals, gare des gbakas ;
  - le téléphone (touche T) : messages, appels, GPS, taxi et gbaka payés, banque, offres, fil rouge, agenda, défis, patrimoine.
- **26 octobre — chantier n° 2 fait.** Six défis du jour et quatre de la semaine, réclamés au téléphone ; six imprévus à choix au Grand chantier, lus dans les tables `Evenement` et `Imprevu` (migration `20261026120000_defis`, contenu dans `seed-data/defis-data.ts`).
- **26 octobre — chantier n° 3 fait.** Les huit traits ont leurs effets, au serveur et dans le jeu (XP, réputation, fatigue, social, prix) ; l'affinité passe des paliers à 20, 50 et 80.
- **26 octobre — chantier n° 4 fait.** Le téléphone, ci-dessus.
- **26 octobre — chantier n° 5 fait.** Les habitants suivent les horaires de leurs lieux, la foule et la circulation varient selon l'heure, la pluie sort les parapluies et ralentit la marche ; l'orage ferme le chantier et la météo pèse sur les besoins.
- **26 octobre — chantier n° 6 fait.**
  - Un loyer chaque semaine à la Résidence Lagune, trois logements (studio, deux-pièces, villa) qui reposent plus ou moins bien, des arriérés qui pèsent sur le moral (migration `20261026130000_patrimoine`).
  - De l'outillage qui rend le travail plus efficace ; l'épargne ramenée à 0,06 % par jour sur 500 000 F au plus.
  - Une entreprise avec capital, employés, chiffre d'affaires et charges, sur `EntrepriseVirtuelle`.
- **26 octobre — chantier n° 7 fait.** Quatre travaux chez soi (peinture, carrelage, cloison, terrasse) : le métré à partir des cotes, le devis du dépôt, la commande, puis une journée de travaux par journée du monde, à la Résidence Lagune. Finis, ils donnent du moral à chaque réveil.
- **26 octobre — chantier n° 8 terminé.**
  - Le concurrent, Serge Ahoussou de Bâti-Express (entreprise fictive), rôde devant la parcelle aux heures de chantier, commente les étapes et appelle le joueur.
  - À chaque chapitre validé, la caméra tourne autour de l'immeuble qui vient de franchir une étape, avec un bandeau de cinéma ; le plan attend que le bilan soit refermé.
- **26 octobre — chantier n° 9, première partie faite.**
  - Présence en direct : chaque joueur connecté signale sa position toutes les dix secondes et voit ses voisins marcher dans la ville avec leur personnage.
  - Six émotes au-dessus des têtes, et un chat de quartier sans liens, sans rafales et sans nom réel (migration `20261026150000_monde_en_ligne`).
  - Reste à faire : les chantiers à plusieurs et les entreprises de joueurs.
- **26 octobre — chantier n° 10 fait.**
  - Seize métiers au-delà du niveau 20, deux par filière, qu'on n'atteint que par promotion.
  - 33 offres d'emploi au lieu de 5, de l'entrée dans chaque filière aux échelons experts (`seed-data/carriere-data.ts`).
  - Des certificats enfin délivrés : une attestation par module de l'académie, un certificat par métier visé et par échelon expert, rattrapés pour les joueurs qui les méritaient déjà (migration `20261026140000_certificats_uniques`).
  - En plus : une embauche ne fait plus reculer dans sa filière.
