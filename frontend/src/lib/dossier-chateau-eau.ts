// Le septième dossier du fil rouge : le Château d'eau des Jardins, un réservoir de 500 m³ perché à 25 mètres, pour la
// Régie des eaux. Besoin en eau d'un quartier, radier sous un ouvrage très lourd, pression de distribution, hauteur
// d'eau et poussée sur la cuve, coffrage grimpant du fût, conduite et matériaux pour l'eau potable, essai d'étanchéité
// et désinfection avant la mise en service, et le bilan de sécurité de toute l'aventure. Sans Three.js ni React.
import { mesure, selection, situation, type DefinitionDossier } from './chapitres-campagne';
import { fr } from './programme-lieu';

// Les chiffres du château d'eau, repris d'un chapitre à l'autre.
const HABITANTS = 6000, LITRES_HABITANT = 80;                         // 480 m³ par jour : une cuve de 500 m³
const POIDS_PLEIN = 14_000, RADIER = 9;                                // kN, diamètre en m : ≈ 220 kPa
const FOND_CUVE = 25;                                                  // m au-dessus du sol : ≈ 2,5 bars
const VOLUME = 500, RAYON_CUVE = 5.5;                                  // m³, m : ≈ 5,26 m d'eau
const HAUTEUR_EAU = VOLUME / (Math.PI * RAYON_CUVE ** 2);
const FUT = 22, LEVEE = 2.75, JOURS_LEVEE = 3;                         // 8 levées, 24 jours
const DEBIT = .03, VITESSE = 1;                                        // m³/s, m/s : ≈ 195 mm
const ACCIDENTS = 2, HEURES = 250_000;                                 // taux de fréquence 8

export const DOSSIER_CHATEAU_EAU: DefinitionDossier = {
  id: 'chateau-eau', nom: 'Château d’eau des Jardins', ouvrage: 'Réservoir de 500 m³ perché à 25 m', client: 'la Régie des eaux',
  parcelle: { slug: 'parcelle-chateau-eau', x: -108, z: -36.5, largeur: 18, profondeur: 11 }, nomParcelle: 'Parcelle du château d’eau',
  accueil: { nom: 'M. Yéo', role: 'Ingénieur de la Régie des eaux', horaires: { ouverture: 7, fermeture: 16 } },
  livraison: 7, hauteurVue: 14,
  stades: ['Terrain réservé', 'Marché signé', 'Sol sondé', 'Permis affiché', 'Radier coulé', 'Fût en élévation', 'Prêt pour la mise en service', 'Château d’eau en service', 'Référence de l’entreprise'],
  bareme: { argent: { chapitre: 9_000, livraison: 90_000, cloture: 30_000 }, xpBase: 70, xpPrime: { livraison: 300, cloture: 180 }, reputation: { chapitre: 6, livraison: 35, cloture: 18 } },
  cloture: 'Le Château d’eau des Jardins dessert six mille habitants sous une pression régulière. Sept ouvrages bouclés : Joseph te confie désormais les grands projets de l’entreprise.',
  chapitres: [
    {
      id: 'offre-chateau', lieu: 'entreprise', titre: 'Un réservoir pour les Jardins', resume: 'Comprendre le besoin, mesurer les risques, s’entourer d’un spécialiste.',
      recit: 'La Régie des eaux veut sécuriser l’eau des Jardins de l’Ouest : un réservoir de 500 m³, perché à 25 mètres pour donner de la pression aux robinets. Un ouvrage que BTP Life n’a jamais fait.',
      avancee: 'Marché signé avec la Régie : le panneau du château d’eau est planté sur la parcelle.',
      taches: [
        mesure('besoin-eau', 'bureaux', 'Le besoin du quartier', {
          enonce: 'Le réservoir doit couvrir au moins une journée de consommation du quartier qu’il dessert.',
          donnees: [['Habitants desservis', fr(HABITANTS)], ['Consommation par habitant', `${LITRES_HABITANT} L par jour`]],
          question: 'Consommation d’une journée, en m³ ?', unite: 'm³', reponse: HABITANTS * LITRES_HABITANT / 1000, tolerance: 1,
          explication: `${fr(HABITANTS)} × ${LITRES_HABITANT} = ${fr(HABITANTS * LITRES_HABITANT)} L, soit ${fr(HABITANTS * LITRES_HABITANT / 1000)} m³ par jour : la cuve de ${VOLUME} m³ garde une journée d’avance en cas de panne du pompage.`,
        }),
        selection('risques-chateau', 'salle-reunion', 'Les risques de l’ouvrage',
          'Avant de répondre, la direction liste ce qui rend ce chantier différent de tous les autres.', 'Coche les vrais risques à préparer.', [
            ['Le travail en grande hauteur, jusqu’à 28 mètres', true, 'Protections collectives, harnais, secours : tout se prépare.'],
            ['L’étanchéité de la cuve', true, 'Une cuve qui fuit est un ouvrage raté.'],
            ['Le vent, sur un ouvrage haut et isolé', true, 'Il arrête la grue et pèse sur le coffrage.'],
            ['La qualité de l’eau potable au contact des matériaux', true, 'Tout ce qui touche l’eau doit être agréé pour cet usage.'],
            ['La couleur de la cuve', false, 'Un choix d’aspect, pas un risque.'],
            ['Le bruit des voisins pendant la nuit', false, 'On ne travaille pas la nuit ; ce n’est pas un risque de l’ouvrage.'],
          ]),
        situation('specialiste-coffrage', 'direction', 'Le coffrage grimpant',
          'Le fût de 22 mètres se coule par levées, avec un coffrage grimpant. Personne chez BTP Life n’en a déjà monté.',
          ['On s’associe à un spécialiste du coffrage grimpant, qui forme nos équipes sur ce chantier', 'Un savoir-faire qu’on n’a pas s’achète et s’apprend : le spécialiste apporte la méthode, nos équipes l’acquièrent.'],
          [['On improvise avec nos coffrages d’étage', 'Des coffrages d’immeuble ne grimpent pas un fût de 22 mètres en sécurité.'], ['On renonce au marché', 'Avec le bon partenaire, l’ouvrage est à notre portée.']]),
      ],
    },
    {
      id: 'sol-chateau', lieu: 'laboratoire', titre: 'Un ouvrage très lourd', resume: 'Calculer la pression sous le radier, choisir les essais, suivre le tassement.',
      recit: 'Plein, le château d’eau pèsera plus de mille quatre cents tonnes, concentrées sur un radier circulaire. Le sol doit le porter sans s’enfoncer de travers.',
      avancee: 'Étude de sol rendue : les points de sondage sont piquetés autour du futur radier.',
      taches: [
        mesure('pression-radier', 'paillasse', 'La pression sous le radier', {
          enonce: 'Tout le poids de l’ouvrage plein se répartit sur un radier circulaire.',
          donnees: [['Poids de l’ouvrage plein', `${fr(POIDS_PLEIN)} kN`], ['Diamètre du radier', `${RADIER} m`]],
          question: 'Pression transmise au sol, en kPa ?', unite: 'kPa', reponse: POIDS_PLEIN / (Math.PI * (RADIER / 2) ** 2), tolerance: 1,
          explication: `Surface : π × ${fr(RADIER / 2, 1)}² ≈ ${fr(Math.PI * (RADIER / 2) ** 2, 1)} m² ; ${fr(POIDS_PLEIN)} ÷ ${fr(Math.PI * (RADIER / 2) ** 2, 1)} ≈ ${fr(POIDS_PLEIN / (Math.PI * (RADIER / 2) ** 2))} kPa. Le sol doit l’admettre, cuve pleine et par grand vent.`,
        }),
        selection('etude-chateau', 'bureau', 'Ce que l’étude doit dire',
          'Pour un ouvrage aussi lourd et aussi haut, le rapport de sol va plus loin que d’habitude.', 'Coche ce qu’il doit fournir.', [
            ['La portance du sol à la profondeur du radier', true, 'Elle dit si le radier peut porter l’ouvrage plein.'],
            ['Le tassement prévisible, et s’il sera uniforme', true, 'Un ouvrage haut qui tasse de travers penche.'],
            ['Le niveau et l’agressivité de la nappe', true, 'Le radier baigne peut-être dans une eau qui attaque le béton.'],
            ['La présence d’anciens remblais sous l’emprise', true, 'Un remblai mou sous une partie du radier, c’est un tassement inégal.'],
            ['La qualité de l’eau distribuée aux habitants', false, 'C’est l’affaire de la Régie, pas de l’étude de sol.'],
            ['La résistance du béton du fût', false, 'Elle se contrôlera au laboratoire, sur éprouvettes.'],
          ]),
        situation('tassement-chateau', 'accueil', 'Trois centimètres de tassement',
          'Le rapport annonce un tassement de trois centimètres à la mise en eau. M. Yéo s’inquiète : le château d’eau va-t-il s’enfoncer ?',
          ['Je lui explique qu’un tassement modéré et uniforme est attendu, et qu’on le suivra avec des repères pendant la première mise en eau', 'Ce qui menace un ouvrage haut, c’est un tassement inégal ; un tassement uniforme et prévu se surveille.'],
          [['Je lui réponds qu’il n’y aura aucun tassement', 'Tout ouvrage lourd tasse un peu : promettre le contraire, c’est mentir au client.'], ['On remplace le radier par des semelles isolées sous le fût', 'Des semelles isolées tasseraient chacune à sa façon : c’est exactement l’inclinaison qu’on veut éviter.']]),
      ],
    },
    {
      id: 'permis-chateau', lieu: 'mairie', titre: 'Un ouvrage visible de tout le quartier', resume: 'Calculer la pression aux robinets, réunir le dossier, rassurer les voisins.',
      recit: 'Un château d’eau se voit de partout, et il inquiète parfois. Le dossier doit montrer pourquoi il est si haut, et pourquoi il est sûr.',
      avancee: 'Permis accordé : la palissade ferme la parcelle, le panneau du permis est affiché.',
      taches: [
        mesure('pression-robinets', 'urbanisme', 'La pression au pied de l’ouvrage', {
          enonce: 'Une colonne d’eau de 10 mètres donne une pression d’environ 1 bar. Le fond de la cuve sera à 25 mètres au-dessus du sol.',
          donnees: [['Hauteur du fond de la cuve', `${FOND_CUVE} m`], ['Règle', '10 m d’eau ≈ 1 bar']],
          question: 'Pression au pied du château d’eau, cuve presque vide, en bars ?', unite: 'bars', reponse: FOND_CUVE / 10, tolerance: .05,
          explication: `${FOND_CUVE} ÷ 10 = ${fr(FOND_CUVE / 10, 1)} bars au niveau du sol, même quand la cuve est presque vide : assez pour monter l’eau au robinet des étages des Jardins.`,
        }),
        selection('dossier-chateau', 'table', 'Le dossier du château d’eau',
          'Le dossier d’un ouvrage public de 28 mètres réunit plusieurs pièces.', 'Coche les pièces à joindre.', [
            ['Les plans de l’ouvrage et son insertion dans le quartier', true, 'On montre ce que verront les habitants.'],
            ['L’étude de sol et la note de calcul', true, 'Elles prouvent que l’ouvrage tiendra, plein et au vent.'],
            ['L’avis de la Régie sur le raccordement au réseau', true, 'L’ouvrage n’a de sens que relié au réseau d’eau.'],
            ['Le dispositif de sécurité pour l’accès en hauteur', true, 'Échelle, garde-corps et ligne de vie pour l’entretien.'],
            ['Les factures d’eau des habitants', false, 'Des données personnelles, sans rapport avec le permis.'],
            ['Le prix de l’eau l’an prochain', false, 'Une décision de la Régie, sans rapport avec le permis.'],
          ]),
        situation('voisins-chateau', 'affichage', 'Et si la cuve cédait ?',
          'Devant l’affichage du permis, une habitante des Jardins s’inquiète : et si la cuve cédait au-dessus de sa maison ?',
          ['Je lui explique les études de sol et de structure, les contrôles du chantier et l’essai de mise en eau, et je l’invite à la réunion d’information', 'Une inquiétude se respecte : on explique, on montre les contrôles, on ouvre la porte.'],
          [['Je lui dis que ce n’est pas son affaire', 'Un voisin méprisé devient un opposant, et le chantier commence mal.'], ['Je lui promets que c’est impossible, sans rien expliquer', 'Une promesse sans explication ne rassure personne.']]),
      ],
    },
    {
      id: 'cuve-chateau', lieu: 'bureau-etudes', titre: 'La cuve', resume: 'Calculer la hauteur d’eau et la poussée, rendre la cuve étanche.',
      recit: 'La cuve est un cylindre de béton de onze mètres de diamètre, qui retient cinq cents tonnes d’eau. Calculons la hauteur d’eau, la poussée sur le fond, et comment la rendre étanche.',
      avancee: 'Cuve calculée : le radier du château d’eau est coulé, les aciers du fût en attente.',
      taches: [
        mesure('hauteur-eau', 'calcul', 'La hauteur d’eau', {
          enonce: 'Le volume d’un cylindre est sa surface de base multipliée par sa hauteur.',
          donnees: [['Volume de la cuve', `${VOLUME} m³`], ['Rayon intérieur', `${fr(RAYON_CUVE, 1)} m`]],
          question: 'Hauteur d’eau, cuve pleine, en mètres ?', unite: 'm', reponse: HAUTEUR_EAU, tolerance: .02,
          explication: `Base : π × ${fr(RAYON_CUVE, 1)}² ≈ ${fr(Math.PI * RAYON_CUVE ** 2, 1)} m² ; ${VOLUME} ÷ ${fr(Math.PI * RAYON_CUVE ** 2, 1)} ≈ ${fr(HAUTEUR_EAU, 2)} m d’eau. On ajoute une revanche au-dessus, pour que l’eau ne déborde jamais.`,
        }),
        mesure('poussee-fond', 'bureau', 'La pression sur le fond', {
          enonce: 'L’eau pèse environ 10 kN par mètre cube : sa pression au fond grandit avec sa hauteur.',
          donnees: [['Hauteur d’eau', `${fr(HAUTEUR_EAU, 2)} m`], ['Poids volumique de l’eau', '10 kN/m³']],
          question: 'Pression de l’eau sur le fond de la cuve, en kPa ?', unite: 'kPa', reponse: 10 * HAUTEUR_EAU, tolerance: .3,
          explication: `10 × ${fr(HAUTEUR_EAU, 2)} ≈ ${fr(10 * HAUTEUR_EAU, 1)} kPa sur le fond, et autant en bas des parois, qui s’ouvriraient comme un tonneau sans leurs aciers horizontaux.`,
        }),
        situation('etancheite-cuve', 'maquette', 'Rendre la cuve étanche',
          'Pour économiser, quelqu’un propose un béton ordinaire, et une peinture étanche à l’intérieur.',
          ['On garde un béton étanche, bien vibré et soigneusement mûri, avec un revêtement agréé pour l’eau potable', 'L’étanchéité vient d’abord du béton ; un revêtement seul se fissure avec le béton qu’il couvre.'],
          [['La peinture suffira, c’est son rôle', 'Si le béton fissure, la peinture fissure avec lui : la cuve fuit.'], ['On remplira la cuve, et on verra où ça fuit', 'Une cuve se conçoit étanche ; réparer après coup, en hauteur, coûte une fortune.']]),
      ],
    },
    {
      id: 'fut-chateau', lieu: 'construction-nord', titre: 'Le fût qui monte', resume: 'Planifier les levées, sécuriser le travail en hauteur, arrêter avant l’orage.',
      recit: 'Le fût monte par levées successives, le coffrage grimpant se hissant sur le béton de la veille. À vingt mètres, la sécurité ne tolère aucune approximation.',
      avancee: 'Le fût monte, levée après levée : le chantier se voit de tout le quartier.',
      taches: [
        mesure('levees-fut', 'echafaudage', 'Le rythme des levées', {
          enonce: 'Chaque levée coule une hauteur fixe de fût ; il faut attendre que le béton durcisse avant de grimper.',
          donnees: [['Hauteur du fût', `${FUT} m`], ['Hauteur d’une levée', `${fr(LEVEE, 2)} m`], ['Une levée tous les', `${JOURS_LEVEE} jours`]],
          question: 'Durée de construction du fût, en jours ?', unite: 'jours', reponse: Math.ceil(FUT / LEVEE) * JOURS_LEVEE, tolerance: 0,
          explication: `${FUT} ÷ ${fr(LEVEE, 2)} = ${Math.ceil(FUT / LEVEE)} levées ; × ${JOURS_LEVEE} jours = ${Math.ceil(FUT / LEVEE) * JOURS_LEVEE} jours. Gagner un jour par levée, c’est grimper sur un béton trop jeune : on ne le fait pas.`,
        }),
        selection('hauteur-chateau', 'accueil', 'Travailler à vingt mètres',
          'Les coffreurs travaillent sur la plateforme du coffrage grimpant, au sommet du fût.', 'Coche les protections indispensables.', [
            ['Des garde-corps tout autour de la plateforme', true, 'La protection collective passe avant tout.'],
            ['Un harnais attaché à un point d’ancrage pour les phases sans garde-corps', true, 'Quand on monte le coffrage, le harnais prend le relais.'],
            ['Des outils attachés, et une zone balisée au pied du fût', true, 'Un marteau qui tombe de vingt mètres tue.'],
            ['Un plan de secours pour évacuer un blessé en hauteur', true, 'On ne l’improvise pas le jour de l’accident.'],
            ['Monter par l’extérieur du coffrage, plus vite', false, 'On monte par l’accès prévu, jamais par l’extérieur.'],
            ['Travailler sans harnais quand il fait très chaud', false, 'La chaleur ne supprime pas le risque : on adapte les horaires, pas la sécurité.'],
          ]),
        situation('orage-fut', 'grue', 'L’orage arrive',
          'Un orage approche avec des éclairs ; trois coffreurs sont au sommet du fût, et le béton de la levée est à moitié coulé.',
          ['Je fais arrêter le coulage, mettre la levée en attente propre et descendre tout le monde avant l’orage', 'Au sommet d’un fût de vingt mètres, sous les éclairs et le vent, personne ne reste : une reprise de bétonnage se traite, une vie non.'],
          [['On finit la levée avant de descendre', 'Quelques mètres cubes ne valent pas trois vies face à la foudre.'], ['Ils restent en haut, abrités sous le coffrage', 'Le sommet métallique d’un ouvrage isolé attire la foudre : ce n’est pas un abri.']]),
      ],
    },
    {
      id: 'equipements-chateau', lieu: 'fournisseur', titre: 'Ce qui touche l’eau', resume: 'Dimensionner la conduite, choisir des matériaux agréés, refuser l’à-peu-près.',
      recit: 'Tout ce qui touchera l’eau des habitants doit être agréé pour l’eau potable : conduites, joints, revêtements. On commande juste, et on vérifie chaque étiquette.',
      avancee: 'Cuve coulée, équipements posés : le château d’eau attend sa mise en service.',
      taches: [
        mesure('diametre-conduite', 'comptoir', 'La conduite d’adduction', {
          enonce: 'La conduite qui remplit la cuve doit passer le débit voulu sans que l’eau y circule trop vite.',
          donnees: [['Débit', `${fr(DEBIT * 1000)} L/s`], ['Vitesse maximale de l’eau', `${VITESSE} m/s`]],
          question: 'Diamètre intérieur minimal de la conduite, en mm ?', unite: 'mm', reponse: Math.sqrt(4 * DEBIT / (Math.PI * VITESSE)) * 1000, tolerance: 2,
          explication: `Section : ${fr(DEBIT, 2)} ÷ ${VITESSE} = ${fr(DEBIT / VITESSE, 2)} m² ; diamètre = √(4 × ${fr(DEBIT / VITESSE, 2)} ÷ π) ≈ ${fr(Math.sqrt(4 * DEBIT / (Math.PI * VITESSE)) * 1000)} mm. On choisit le diamètre commercial au-dessus : 200 mm.`,
        }),
        selection('materiaux-eau-potable', 'reception', 'Les matériaux de l’eau potable',
          'La livraison des conduites, des joints et du revêtement de cuve est arrivée.', 'Coche ce que tu acceptes.', [
            ['Des conduites marquées pour l’eau potable, avec leur certificat', true, 'Le marquage prouve qu’elles ne relâchent rien dans l’eau.'],
            ['Des joints agréés pour l’eau potable', true, 'Un joint ordinaire peut donner un goût, ou pire.'],
            ['Un revêtement de cuve agréé contact alimentaire', true, 'Il sera au contact de l’eau bue par six mille personnes.'],
            ['Des vannes au bon diamètre, avec leur notice', true, 'Elles servent à isoler la cuve pour l’entretien.'],
            ['Des tuyaux d’arrosage, moins chers, pour les petites liaisons', false, 'Ils ne sont pas faits pour l’eau potable.'],
            ['Un reste de peinture de façade pour le haut de la cuve', false, 'Rien de ce qui touche l’eau ne s’improvise.'],
          ]),
        situation('revetement-non-agree', 'stock', 'Un revêtement sans agrément',
          'Le fournisseur habituel est en rupture. Brou propose un revêtement de cuve « équivalent », sans agrément eau potable, disponible tout de suite.',
          ['Je le refuse, et j’attends ou je cherche un revêtement agréé, en prévenant la Régie du délai', 'Sans agrément, rien ne garantit que le revêtement ne relâche rien dans l’eau : la santé de tout un quartier ne s’échange pas contre une semaine.'],
          [['Je le prends, « équivalent » ça veut dire pareil', 'Sans agrément, « équivalent » n’engage personne : c’est l’eau des habitants qu’on risque.'], ['Je le prends pour le haut de la cuve seulement', 'Toute la cuve touche l’eau, ou sa vapeur : pas d’exception.']]),
      ],
    },
    {
      id: 'mise-en-service', lieu: 'parcelle-chateau-eau', titre: 'La mise en service', resume: 'Juger l’essai d’étanchéité, désinfecter, ne distribuer qu’une eau saine.',
      recit: 'Le château d’eau est terminé. Avant d’envoyer une seule goutte aux habitants, on essaie la cuve, on la désinfecte, et on fait analyser l’eau. Faisons-le ensemble.',
      avancee: 'Mise en service prononcée : le Château d’eau des Jardins dessert le quartier.',
      taches: [
        mesure('essai-etancheite', 'parcelle', 'L’essai d’étanchéité', {
          enonce: 'La cuve est remplie puis laissée au repos. Le marché admet une baisse de niveau d’au plus 1/500 de la hauteur d’eau en 24 heures, une fois l’évaporation déduite.',
          donnees: [['Hauteur d’eau', `${fr(HAUTEUR_EAU, 2)} m`], ['Baisse admise', '1/500 de la hauteur en 24 h'], ['Baisse mesurée', '6 mm en 24 h']],
          question: 'Baisse maximale admise, en millimètres ?', unite: 'mm', reponse: HAUTEUR_EAU * 1000 / 500, tolerance: .1,
          explication: `${fr(HAUTEUR_EAU * 1000)} mm ÷ 500 ≈ ${fr(HAUTEUR_EAU * 1000 / 500, 1)} mm admis ; la baisse mesurée de 6 mm est en dessous : la cuve est étanche.`,
        }),
        selection('avant-distribution', 'parcelle', 'Avant de distribuer',
          'La cuve est étanche. Il reste à rendre l’ouvrage sûr pour l’eau et pour ceux qui l’entretiendront.', 'Coche ce qu’il faut faire avant la mise en service.', [
            ['Nettoyer et désinfecter la cuve et les conduites', true, 'Un chantier laisse poussières et germes : on désinfecte, puis on rince.'],
            ['Faire analyser l’eau par un laboratoire agréé', true, 'Seule une analyse dit si l’eau est bonne à boire.'],
            ['Vérifier l’échelle, les garde-corps et la ligne de vie', true, 'Les agents de la Régie monteront pour l’entretien.'],
            ['Fermer et sécuriser les trappes d’accès à la cuve', true, 'Personne ne doit pouvoir y jeter quoi que ce soit.'],
            ['Distribuer d’abord, et analyser ensuite', false, 'On n’envoie jamais aux habitants une eau qu’on n’a pas analysée.'],
            ['Peindre le logo de la Régie avant tout le reste', false, 'C’est de l’aspect : la sécurité de l’eau passe avant.'],
          ]),
        situation('eau-trouble', 'parcelle', 'Une eau trouble',
          'L’analyse revient : l’eau est légèrement trouble, et des germes dépassent les seuils. Les habitants attendent l’eau pour ce soir.',
          ['On ne distribue pas : on vidange, on refait la désinfection et le rinçage, puis une nouvelle analyse', 'Un résultat mauvais se corrige avant de distribuer, jamais après : on recommence jusqu’à une eau saine.'],
          [['On distribue en conseillant de faire bouillir l’eau', 'On ne met pas en service un ouvrage neuf qui distribue une eau non conforme.'], ['On ajoute beaucoup de chlore et on distribue tout de suite', 'Un surdosage rend l’eau imbuvable, et ne garantit rien sans nouvelle analyse.']]),
      ],
    },
    {
      id: 'bilan-chateau', lieu: 'entreprise', titre: 'Sept ouvrages plus tard', resume: 'Mesurer la sécurité de l’entreprise, dire ce qui fait sa réputation, regarder devant.',
      recit: 'De la Résidence Akwaba au Château d’eau des Jardins, sept ouvrages : deux immeubles, une école, un centre de santé, une halle, une résidence et un réservoir. Faisons le bilan, en commençant par ce qui compte le plus : la sécurité.',
      avancee: 'Le château d’eau rejoint nos références, et le fil rouge est bouclé.',
      taches: [
        mesure('taux-frequence', 'finances', 'Le taux de fréquence', {
          enonce: 'Le taux de fréquence compare les accidents avec arrêt de travail aux heures travaillées, ramenées à un million d’heures.',
          donnees: [['Accidents avec arrêt sur le chantier', String(ACCIDENTS)], ['Heures travaillées', fr(HEURES)]],
          question: 'Taux de fréquence du chantier ?', unite: '', reponse: ACCIDENTS * 1_000_000 / HEURES, tolerance: .1,
          explication: `${ACCIDENTS} × 1 000 000 ÷ ${fr(HEURES)} = ${fr(ACCIDENTS * 1_000_000 / HEURES)} accidents avec arrêt par million d’heures. Chaque accident a une cause : on les analyse tous, pour que le prochain chantier en compte moins.`,
        }),
        selection('reputation', 'salle-reunion', 'Ce qui fait une réputation',
          'Joseph veut écrire, pour les nouveaux arrivants, ce qui a fait la réputation de BTP Life.', 'Coche ce qu’il doit écrire.', [
            ['Des chiffres justes, du devis au décompte', true, 'Les clients reviennent quand les prix et les délais sont tenus.'],
            ['Aucun compromis sur la sécurité des équipes et des riverains', true, 'Des chantiers sûrs, même pressés.'],
            ['Des réserves levées, et des garanties honorées', true, 'Le client sait que l’entreprise reste là après la livraison.'],
            ['Aucune enveloppe, jamais', true, 'Les marchés se gagnent sur dossier.'],
            ['Promettre tout ce que le client demande', false, 'On promet ce qu’on peut tenir, et on le tient.'],
            ['Cacher les erreurs pour garder les clients', false, 'Une erreur cachée revient toujours, plus chère : on la reconnaît et on la répare.'],
          ]),
        situation('grands-projets', 'direction', 'Les grands projets',
          'Joseph te propose de prendre la direction des grands projets de BTP Life. Serge, de son côté, t’invite à monter une entreprise avec lui.',
          ['Je prends le temps de choisir, en parlant franchement aux deux : chacune des deux voies se construit sur la confiance gagnée', 'Une carrière se décide en connaissance de cause, sans brûler les ponts : Joseph et Serge comptent tous deux sur ta parole.'],
          [['Je pars avec Serge sans prévenir Joseph', 'On ne quitte pas une entreprise qui t’a fait confiance sans le lui dire en face.'], ['Je refuse les deux, je préfère ne rien changer', 'Refuser par peur de changer, c’est laisser passer ce que sept ouvrages t’ont permis de mériter.']]),
      ],
    },
  ],
};
