// Le quatrième dossier du fil rouge : le Centre de santé de la Lagune, deux niveaux de consultations, de soins et une
// pharmacie, pour la mairie ; BTP Life répond seule. Avance de démarrage, fouilles sous la nappe, permis d'un lieu qui
// reçoit du public et des secours, réserve d'eau et groupe électrogène, surfaces qui se lavent, électriciens habilités,
// réception avant l'ouverture aux patients, décompte final. Sans Three.js ni React.
import { mesure, selection, situation, type DefinitionDossier } from './chapitres-campagne';
import { fr } from './programme-lieu';

// Les chiffres du centre de santé, repris d'un chapitre à l'autre.
const MARCHE = 142, AVANCE = .15, AVENANT = 6.5, DEJA_PAYE = 134.2;      // M FCFA HT
const LONGUEUR = 12, LARGEUR = 9, NIVEAUX = 2;                          // 12 × 9 m, deux niveaux : 216 m²
const SOUS_NAPPE = 1, POROSITE = .3;                                     // 32,4 m³ d'eau à pomper
const PATIENTS = 40, LITRES_PATIENT = 30, PERSONNEL = 10, LITRES_PERSONNEL = 50, AUTONOMIE = 2;
const PUISSANCE = 18, COS_PHI = .8, MARGE = 1.25;                        // ≈ 28,1 kVA
const SOINS = 140, COUPES = 1.08, CARTON = 1.44;                         // 105 cartons
const HEURES = 1200, SEMAINES = 6;                                       // 5 ouvriers
const SALLE = 4 * 4 * 2.8, DEBIT = 134.4;                                // 3 renouvellements par heure
const TRAVAUX = MARCHE + AVENANT;

export const DOSSIER_SANTE: DefinitionDossier = {
  id: 'centre-sante', nom: 'Centre de santé de la Lagune', ouvrage: 'R+1 · consultations, soins et pharmacie', client: 'la mairie',
  parcelle: { slug: 'parcelle-sante', x: 68.5, z: -35, largeur: 14, profondeur: 13 }, nomParcelle: 'Parcelle du centre de santé',
  accueil: { nom: 'Dr Fofana', role: 'Médecin-chef du futur centre de santé', horaires: { ouverture: 8, fermeture: 16 } },
  livraison: 7, hauteurVue: 6,
  stades: ['Terrain réservé', 'Marché attribué', 'Sol et nappe sondés', 'Permis affiché', 'Fondations coulées', 'Gros œuvre en élévation', 'Prêt pour la réception', 'Centre ouvert', 'Référence de l’entreprise'],
  bareme: { argent: { chapitre: 6_000, livraison: 60_000, cloture: 20_000 }, xpBase: 55, xpPrime: { livraison: 270, cloture: 140 }, reputation: { chapitre: 4, livraison: 25, cloture: 12 } },
  cloture: 'Le Centre de santé de la Lagune soigne ses premiers patients, et le décompte est soldé. Tantie Bintou et les commerçantes rêvent d’un marché couvert.',
  chapitres: [
    {
      id: 'offre-sante', lieu: 'entreprise', titre: 'Le centre de santé', resume: 'Répondre seuls, chiffrer l’avance, comprendre ce qu’exige un lieu de soins.',
      recit: 'Cette fois, on répond seuls : un centre de santé de deux niveaux, consultations, soins et pharmacie, pour la mairie. Le Dr Fofana, qui le dirigera, a écrit le programme. Un lieu de soins ne se construit pas comme un logement.',
      avancee: 'Marché attribué : le panneau du centre de santé est planté sur la parcelle.',
      taches: [
        mesure('avance-demarrage', 'finances', 'L’avance de démarrage', {
          enonce: 'Le marché public prévoit une avance de démarrage, versée contre une caution de restitution et remboursée par retenue sur les situations de travaux.',
          donnees: [['Montant du marché', `${MARCHE} M FCFA HT`], ['Avance de démarrage', '15 %']],
          question: 'Montant de l’avance, en millions de FCFA ?', unite: 'M FCFA', reponse: MARCHE * AVANCE, tolerance: .05,
          explication: `${MARCHE} × 15 % = ${fr(MARCHE * AVANCE, 1)} M FCFA pour lancer le chantier : commandes, installation, premières paies. La caution garantit à la mairie qu’elle récupérera l’avance si l’entreprise faisait défaut.`,
        }),
        selection('exigences-soins', 'bureaux', 'Ce qu’exige un lieu de soins',
          'Le programme du Dr Fofana décrit un centre où l’on soigne sans contaminer.', 'Coche ce que le projet doit prévoir.', [
            ['Des circuits séparés pour le propre et le sale', true, 'Le linge souillé et les déchets ne croisent pas le matériel stérile.'],
            ['Des sols et des murs lisses et lavables', true, 'Ils se désinfectent sans laisser de recoins aux germes.'],
            ['Une alimentation électrique secourue par un groupe électrogène', true, 'Une coupure ne doit jamais interrompre un soin.'],
            ['Une réserve d’eau potable', true, 'Le centre doit soigner même pendant une coupure d’eau.'],
            ['Un local fermé et ventilé pour les déchets de soins', true, 'Aiguilles et pansements usagés ne vont pas à la poubelle commune.'],
            ['De la moquette dans les salles de soins', false, 'Elle retient la poussière et les liquides : impossible à désinfecter.'],
            ['Un seul couloir pour tout : patients, linge sale et déchets', false, 'C’est exactement ce que les circuits séparés évitent.'],
          ]),
        situation('radiologie', 'direction', 'Une salle de radiologie en plus ?',
          'Le Dr Fofana voudrait ajouter une salle de radiologie, absente du marché.',
          ['Je réponds que c’est possible par avenant, avec une étude de radioprotection et les autorisations nécessaires', 'Une salle de radiologie demande des murs qui arrêtent les rayons, et une autorisation : on l’étudie, on la chiffre, on la signe avant de construire.'],
          [['On l’aménage dans une pièce prévue pour un bureau', 'Sans protection des murs, les rayons traverseraient les pièces voisines : un danger pour le personnel et les patients.'], ['On refuse : ce n’est pas dans le marché', 'Un marché peut évoluer par avenant : on étudie d’abord la demande avec le client.']]),
      ],
    },
    {
      id: 'eau-sante', lieu: 'laboratoire', titre: 'L’eau sous la parcelle', resume: 'Mesurer l’eau à pomper, fouiller sous la nappe, couler au sec.',
      recit: 'Les sondages du centre de santé ont trouvé la nappe à un mètre de profondeur : les fouilles des semelles descendront dans l’eau. Calculons ce qu’il faudra pomper, et comment couler au sec.',
      avancee: 'Étude de sol et de nappe rendue : les sondages sont piquetés, le pompage est prévu.',
      taches: [
        mesure('eau-fouille', 'paillasse', 'L’eau de la fouille', {
          enonce: 'La fouille générale descend sous la nappe. Seule une part du volume du sable est de l’eau qui s’écoule : sa porosité efficace.',
          donnees: [['Fouille', `${LONGUEUR} × ${LARGEUR} m`], ['Profondeur sous la nappe', `${fr(SOUS_NAPPE, 1)} m`], ['Porosité efficace du sable', '30 %']],
          question: 'Volume d’eau à pomper pour assécher la fouille, en m³ ?', unite: 'm³', reponse: LONGUEUR * LARGEUR * SOUS_NAPPE * POROSITE, tolerance: .3,
          explication: `${LONGUEUR} × ${LARGEUR} × ${fr(SOUS_NAPPE, 1)} = ${LONGUEUR * LARGEUR} m³ de sable noyé ; × 30 % = ${fr(LONGUEUR * LARGEUR * SOUS_NAPPE * POROSITE, 1)} m³ d’eau à pomper au départ, puis l’eau qui revient sans cesse : la pompe tourne tant qu’on travaille sous la nappe.`,
        }),
        selection('fouille-en-eau', 'bureau', 'Travailler sous la nappe',
          'Les semelles du centre se coulent au fond d’une fouille où l’eau arrive en continu.', 'Coche ce qu’il faut prévoir.', [
            ['Un puisard et une pompe, au point bas de la fouille', true, 'L’eau s’y rassemble et en est chassée en continu.'],
            ['Des parois de fouille talutées ou blindées', true, 'Un sable gorgé d’eau s’éboule facilement.'],
            ['Un rejet de l’eau pompée là où il est autorisé, après décantation', true, 'On ne déverse pas une eau boueuse dans la rue ni chez les voisins.'],
            ['Un béton de propreté coulé au sec', true, 'Il donne aux semelles un fond propre et stable.'],
            ['Rejeter l’eau boueuse dans le caniveau de la rue', false, 'Les boues bouchent le réseau et salissent tout le quartier.'],
            ['Couler les semelles dans l’eau, en ajoutant du ciment', false, 'Le ciment est délavé : le béton n’atteint pas sa résistance.'],
          ]),
        situation('pompe-panne', 'accueil', 'La pompe s’est arrêtée',
          'Pendant la nuit, la pompe est tombée en panne : au matin, 20 cm d’eau recouvrent le fond des fouilles, ferraillées et prêtes à couler.',
          ['On pompe de nouveau, on nettoie le fond et on contrôle les aciers avant de couler au sec, et on installe une pompe de secours', 'Couler dans l’eau délave le béton ; une pompe de secours évite que l’incident se répète.'],
          [['On coule quand même : le béton chassera l’eau', 'Le béton se mélange à l’eau et à la boue : la semelle perd sa résistance.'], ['On attend que l’eau s’évapore', 'Sous la nappe, elle ne s’évapore pas : elle remonte.']]),
      ],
    },
    {
      id: 'permis-sante', lieu: 'mairie', titre: 'Le permis du centre', resume: 'Compter le stationnement, réunir les avis, prévoir l’ambulance.',
      recit: 'Un centre de santé reçoit du public toute la journée, et parfois une urgence. Le dossier doit le montrer : stationnement, accès des secours, avis des services concernés.',
      avancee: 'Permis accordé : la palissade ferme la parcelle, le panneau du permis est affiché.',
      taches: [
        mesure('stationnement-sante', 'urbanisme', 'Le stationnement', {
          enonce: 'Le règlement de la zone demande une place de stationnement par tranche de 40 m² de plancher, entamée.',
          donnees: [['Plancher', `${NIVEAUX} niveaux de ${LONGUEUR} × ${LARGEUR} m`], ['Règle', '1 place par tranche de 40 m² entamée']],
          question: 'Nombre de places à prévoir ?', unite: 'places', reponse: Math.ceil(NIVEAUX * LONGUEUR * LARGEUR / 40), tolerance: 0,
          explication: `${NIVEAUX} × ${LONGUEUR} × ${LARGEUR} = ${NIVEAUX * LONGUEUR * LARGEUR} m² ; ÷ 40 = ${fr(NIVEAUX * LONGUEUR * LARGEUR / 40, 1)} : ${Math.ceil(NIVEAUX * LONGUEUR * LARGEUR / 40)} places, dont une réservée aux personnes handicapées, près de l’entrée.`,
        }),
        selection('dossier-sante', 'table', 'Le dossier du centre de santé',
          'Le permis d’un lieu de soins recevant du public réunit plusieurs avis.', 'Coche les pièces à joindre.', [
            ['Les plans du centre et le plan de masse', true, 'Ils décrivent le projet sur sa parcelle.'],
            ['La notice de sécurité incendie', true, 'Un lieu qui reçoit du public doit montrer comment on l’évacue.'],
            ['La notice d’accessibilité', true, 'Un patient en fauteuil doit pouvoir accéder à tous les soins.'],
            ['Le plan d’assainissement des eaux usées', true, 'Les rejets d’un lieu de soins se traitent avant de partir.'],
            ['L’avis des services de santé sur le programme', true, 'Ils vérifient que le centre peut assurer les soins prévus.'],
            ['La liste des futurs patients', false, 'Des données de santé, confidentielles, et sans objet.'],
            ['Le contrat de travail du Dr Fofana', false, 'Sans rapport avec le permis.'],
          ]),
        situation('ambulance', 'guichet', 'Et l’ambulance ?',
          'L’instructrice relève que le plan ne prévoit aucun accès pour une ambulance : l’entrée donne sur un escalier.',
          ['On ajoute un accès de plain-pied pour le brancard, et une aire où l’ambulance s’arrête et repart', 'Un brancard ne monte pas un escalier : l’accès des secours se dessine dès le permis.'],
          [['Les brancardiers porteront le brancard dans l’escalier', 'Porter un patient dans un escalier, c’est risquer la chute pour tout le monde.'], ['L’ambulance s’arrêtera dans l’avenue', 'Bloquer l’avenue à chaque urgence met d’autres personnes en danger.']]),
      ],
    },
    {
      id: 'reseaux-sante', lieu: 'bureau-etudes', titre: 'Les réseaux du centre', resume: 'Dimensionner la réserve d’eau et le groupe électrogène, traiter les eaux usées.',
      recit: 'Un centre de santé doit fonctionner pendant les coupures : réserve d’eau, groupe électrogène, et des eaux usées traitées avant de partir. Dimensionnons tout cela ensemble.',
      avancee: 'Réseaux étudiés : les fondations du centre sont coulées, fourreaux et attentes en place.',
      taches: [
        mesure('reserve-eau', 'calcul', 'La réserve d’eau', {
          enonce: 'La réserve doit couvrir deux jours de coupure d’eau.',
          donnees: [['Patients par jour', `${PATIENTS}, ${LITRES_PATIENT} L chacun`], ['Personnel', `${PERSONNEL}, ${LITRES_PERSONNEL} L chacun`], ['Autonomie', `${AUTONOMIE} jours`]],
          question: 'Volume de la réserve, en litres ?', unite: 'L', reponse: (PATIENTS * LITRES_PATIENT + PERSONNEL * LITRES_PERSONNEL) * AUTONOMIE, tolerance: 20,
          explication: `${PATIENTS} × ${LITRES_PATIENT} + ${PERSONNEL} × ${LITRES_PERSONNEL} = ${fr(PATIENTS * LITRES_PATIENT + PERSONNEL * LITRES_PERSONNEL)} L par jour ; × ${AUTONOMIE} = ${fr((PATIENTS * LITRES_PATIENT + PERSONNEL * LITRES_PERSONNEL) * AUTONOMIE)} L, soit une cuve de ${fr((PATIENTS * LITRES_PATIENT + PERSONNEL * LITRES_PERSONNEL) * AUTONOMIE / 1000, 1)} m³ au moins.`,
        }),
        mesure('groupe-electrogene', 'bureau', 'Le groupe électrogène', {
          enonce: 'Le groupe reprend les circuits prioritaires : soins, froid des vaccins, éclairage. Sa puissance se compte en kVA.',
          donnees: [['Puissance des circuits prioritaires', `${PUISSANCE} kW`], ['Facteur de puissance', fr(COS_PHI, 1)], ['Marge', '25 %']],
          question: 'Puissance minimale du groupe, en kVA ?', unite: 'kVA', reponse: PUISSANCE / COS_PHI * MARGE, tolerance: .2,
          explication: `${PUISSANCE} ÷ ${fr(COS_PHI, 1)} = ${fr(PUISSANCE / COS_PHI, 1)} kVA ; + 25 % de marge ≈ ${fr(PUISSANCE / COS_PHI * MARGE, 1)} kVA : on choisit le groupe de 30 kVA, la taille du dessus.`,
        }),
        situation('eaux-usees', 'maquette', 'Les eaux usées',
          'Le plombier propose de raccorder les eaux usées du centre au caniveau de la rue, « comme tout le monde ».',
          ['Je refuse : les eaux usées vont au réseau d’assainissement, ou à un assainissement autonome étudié, jamais au caniveau', 'Les eaux d’un lieu de soins peuvent porter des germes : elles se traitent, elles ne coulent pas à ciel ouvert devant les maisons.'],
          [['J’accepte : le caniveau est fait pour l’eau', 'Le caniveau reçoit les eaux de pluie, pas les eaux usées : on contaminerait la rue.'], ['On les rejette dans le terrain voisin, plus bas', 'On ne déverse pas ses eaux usées chez les autres : c’est interdit, et dangereux.']]),
      ],
    },
    {
      id: 'surfaces-sante', lieu: 'fournisseur', titre: 'Les surfaces qui se lavent', resume: 'Commander le carrelage, choisir des revêtements lavables, tenir la prescription.',
      recit: 'Les salles de soins demandent des matériaux qui se lavent tous les jours, à grande eau et au désinfectant. On commande juste, et on ne cède rien sur la qualité.',
      avancee: 'Matériaux commandés : le gros œuvre du centre monte, avec sa grue.',
      taches: [
        mesure('carrelage-soins', 'comptoir', 'Le carrelage des soins', {
          enonce: 'Les sols des salles de soins sont en grès cérame 60 × 60, vendu en cartons de 1,44 m². On ajoute les coupes.',
          donnees: [['Surface des salles de soins', `${SOINS} m²`], ['Coupes et casse', '8 %'], ['Un carton', `${fr(CARTON, 2)} m²`]],
          question: 'Cartons à commander ?', unite: 'cartons', reponse: 105, tolerance: 0,
          explication: `${SOINS} × 1,08 = ${fr(SOINS * COUPES, 1)} m² ; ÷ ${fr(CARTON, 2)} = 105 cartons tout juste. Quand la division ne tombe pas juste, on arrondit au-dessus.`,
        }),
        selection('revetements-soins', 'reception', 'Les revêtements des salles de soins',
          'Le Dr Fofana veut des salles qui se désinfectent chaque soir.', 'Coche les revêtements qui conviennent.', [
            ['Un carrelage en grès cérame, aux joints fins', true, 'Dur, étanche, et peu de joints où la saleté s’accroche.'],
            ['Une peinture lessivable sur les murs', true, 'Elle supporte l’éponge et le désinfectant.'],
            ['Des plinthes à gorge, arrondies entre le sol et le mur', true, 'Pas d’angle où la saleté s’accumule.'],
            ['Un plan de travail d’un seul tenant, sans joint', true, 'Rien ne s’infiltre entre deux éléments.'],
            ['Un parquet de bois', false, 'Il absorbe l’eau et les liquides des soins.'],
            ['Un crépi rugueux sur les murs', false, 'Ses aspérités gardent la poussière et les germes.'],
          ]),
        situation('peinture-sante', 'stock', 'La peinture moins chère',
          'Brou propose une peinture mate ordinaire, moitié moins chère que la peinture lessivable prescrite.',
          ['Je tiens la peinture prescrite : dans une salle de soins, un mur se lave chaque jour', 'Une peinture qui ne se lave pas se tache et garde les germes : l’économie se paierait en repeintures, et en hygiène.'],
          [['Je prends la moins chère, personne ne verra la différence', 'Le Dr Fofana la verra au premier lavage : la peinture partira avec l’éponge.'], ['Je mets une couche de moins de la peinture prescrite', 'Une couche de moins, c’est un mur qui s’use deux fois plus vite.']]),
      ],
    },
    {
      id: 'equipe-sante', lieu: 'agence', titre: 'Les bons professionnels', resume: 'Compter l’équipe du second œuvre, vérifier les habilitations, former avant de confier.',
      recit: 'Le second œuvre d’un centre de santé demande des gens qualifiés : électriciens habilités, plombiers, frigoristes pour la chambre froide des vaccins. Voyons l’équipe qu’il te faut, et qui peut faire quoi.',
      avancee: 'Second œuvre achevé : le centre de santé attend sa réception.',
      taches: [
        mesure('equipe-second-oeuvre', 'test', 'L’équipe du second œuvre', {
          enonce: 'Le second œuvre représente un volume d’heures de travail à faire dans un délai fixé.',
          donnees: [['Heures de travail', `${fr(HEURES)} h`], ['Délai', `${SEMAINES} semaines de 5 jours`], ['Journée de travail', '8 h']],
          question: 'Nombre d’ouvriers nécessaires ?', unite: 'ouvriers', reponse: HEURES / (SEMAINES * 5 * 8), tolerance: 0,
          explication: `${SEMAINES} × 5 × 8 = ${SEMAINES * 40} h par ouvrier ; ${fr(HEURES)} ÷ ${SEMAINES * 40} = ${HEURES / (SEMAINES * 40)} ouvriers. Avec un de moins, le délai glisserait d’une semaine et demie.`,
        }),
        selection('habilitations', 'cv', 'Les habilitations',
          'Tu relis les dossiers des candidats.', 'Coche ce qu’il faut vérifier avant de confier un poste.', [
            ['L’habilitation électrique des électriciens', true, 'On ne touche pas un tableau sous tension sans y être formé et habilité.'],
            ['La qualification des frigoristes pour les fluides frigorigènes', true, 'La chambre froide des vaccins ne tolère pas l’approximation.'],
            ['L’aptitude médicale au poste', true, 'Le travail en hauteur ou au bruit demande d’être apte.'],
            ['Les références de chantiers semblables', true, 'Elles montrent ce que le candidat a vraiment fait.'],
            ['L’origine ou la religion des candidats', false, 'C’est de la discrimination : seules les compétences comptent.'],
            ['Les comptes de réseaux sociaux des candidats', false, 'Sans rapport avec leurs compétences.'],
          ]),
        situation('electricien-habilitation', 'entretien', 'Le meilleur, sans habilitation',
          'Le meilleur électricien rencontré n’a pas d’habilitation électrique. Il commence lundi, et le tableau général doit être raccordé.',
          ['Je l’embauche, mais il suit la formation d’habilitation avant de toucher aux tableaux ; en attendant, il travaille hors tension, avec un habilité', 'Le talent ne remplace pas l’habilitation : on forme d’abord, on confie ensuite.'],
          [['Il est bon, il se débrouillera', 'Une erreur sur un tableau sous tension peut tuer : l’habilitation existe pour ça.'], ['Je le refuse : sans habilitation, pas d’embauche', 'Une habilitation se prépare en quelques jours de formation : on perdrait un bon électricien.']]),
      ],
    },
    {
      id: 'reception-sante', lieu: 'parcelle-sante', titre: 'La réception du centre', resume: 'Contrôler l’air des salles, noter les réserves, ouvrir au bon moment.',
      recit: 'Le centre est prêt, et des patients attendent déjà devant la palissade. Faisons le tour ensemble : je veux que tout soit sûr avant d’ouvrir.',
      avancee: 'Centre réceptionné : le Centre de santé de la Lagune reçoit ses premiers patients.',
      taches: [
        mesure('renouvellement-air', 'parcelle', 'L’air de la salle de soins', {
          enonce: 'Dans la salle de soins, la ventilation doit renouveler tout l’air plusieurs fois par heure.',
          donnees: [['Salle', '4 × 4 m, 2,80 m sous plafond'], ['Débit mesuré', `${fr(DEBIT, 1)} m³/h`]],
          question: 'Renouvellements d’air par heure ?', unite: 'par heure', reponse: DEBIT / SALLE, tolerance: .05,
          explication: `4 × 4 × 2,8 = ${fr(SALLE, 1)} m³ ; ${fr(DEBIT, 1)} ÷ ${fr(SALLE, 1)} = ${fr(DEBIT / SALLE)} renouvellements par heure, ce que demande le programme.`,
        }),
        selection('reserves-sante', 'parcelle', 'Les réserves du centre',
          'Pendant la visite, tu notes ce qui n’est pas conforme au marché.', 'Coche ce qui doit être inscrit en réserve.', [
            ['La porte de la salle de soins, trop étroite pour un brancard', true, 'Le marché prévoit le passage d’un brancard : à reprendre.'],
            ['Le lavabo de la salle de soins, sans eau chaude', true, 'Le lavage des mains des soignants en a besoin.'],
            ['Un bloc d’éclairage de secours qui ne s’allume pas', true, 'Un équipement de sécurité en défaut.'],
            ['Un joint de carrelage ouvert dans la salle de soins', true, 'Un nid à germes, à refaire.'],
            ['La couleur des chaises de la salle d’attente', false, 'Du mobilier hors marché, choisi par le centre.'],
            ['L’absence d’appareil de radiologie', false, 'La radiologie n’est pas au marché : elle relève d’un avenant.'],
          ]),
        situation('ouvrir-sante', 'parcelle', 'Ouvrir dès demain ?',
          'Le Dr Fofana voudrait recevoir ses premiers patients dès demain, avant la reprise de l’éclairage de secours.',
          ['On répare l’éclairage de secours avant toute ouverture au public : c’est une réserve de sécurité', 'Les réserves mineures peuvent attendre ; celles qui touchent à la sécurité des personnes se lèvent avant d’ouvrir.'],
          [['On ouvre : l’éclairage de secours ne sert presque jamais', 'Il sert le jour d’une coupure ou d’un incendie, et ce jour-là il doit marcher.'], ['On n’ouvre qu’une fois toutes les réserves levées', 'Une réserve sans danger, comme un joint, n’empêche pas d’ouvrir : on la lève dans le délai convenu.']]),
      ],
    },
    {
      id: 'decompte-sante', lieu: 'banque', titre: 'Le décompte du centre', resume: 'Calculer le solde, connaître les garanties, aider le prochain projet.',
      recit: 'La mairie solde le marché du centre de santé. Faisons le décompte ensemble : l’avenant, ce qui a déjà été payé, et la retenue de garantie.',
      avancee: 'Décompte soldé : le Centre de santé de la Lagune rejoint nos références.',
      taches: [
        mesure('solde-sante', 'coffre', 'Le solde du marché', {
          enonce: 'Le décompte reprend tous les travaux, avenant compris ; la retenue de garantie de 5 % reste due jusqu’à la fin du délai de garantie.',
          donnees: [['Marché', `${MARCHE} M FCFA HT`], ['Avenant', `${fr(AVENANT, 1)} M FCFA HT`], ['Déjà payé', `${fr(DEJA_PAYE, 1)} M FCFA`], ['Retenue de garantie', '5 %']],
          question: 'Solde à payer maintenant, en millions de FCFA ?', unite: 'M FCFA', reponse: TRAVAUX * .95 - DEJA_PAYE, tolerance: .02,
          explication: `${MARCHE} + ${fr(AVENANT, 1)} = ${fr(TRAVAUX, 1)} M ; × 95 % = ${fr(TRAVAUX * .95, 3)} M payables avant la fin de la garantie ; − ${fr(DEJA_PAYE, 1)} déjà versés = ${fr(TRAVAUX * .95 - DEJA_PAYE, 3)} M FCFA. Les ${fr(TRAVAUX * .05, 1)} M de retenue suivront, réserves levées.`,
        }),
        selection('garanties-sante', 'conseiller', 'Ce qui protège encore le centre',
          'La réception est signée, mais le centre reste protégé.', 'Coche ce qui joue encore après la réception.', [
            ['Le délai de garantie d’un an, pour reprendre les défauts signalés', true, 'L’entreprise reprend ce qui apparaît pendant la première année.'],
            ['La garantie décennale, pour la solidité de l’ouvrage', true, 'Pendant dix ans, l’entreprise répond des désordres graves.'],
            ['La garantie des équipements : groupe électrogène, pompes, chambre froide', true, 'Les fabricants et installateurs en répondent.'],
            ['La retenue de garantie, rendue à la fin du délai', true, 'Elle garantit la reprise des défauts pendant ce délai.'],
            ['Une garantie contre l’usure normale des peintures pendant vingt ans', false, 'L’usure normale n’est pas un défaut : l’entretien revient au centre.'],
            ['La prise en charge des dégâts causés par les usagers', false, 'Ce n’est pas un défaut de construction.'],
          ]),
        situation('marche-bintou', 'guichet', 'Le marché de Tantie Bintou',
          'Tantie Bintou, qui préside les commerçantes du Plateau, demande à la banque de financer un marché couvert, et voudrait que BTP Life le construise.',
          ['On l’aide à monter un dossier solide : le projet, les loyers des étals pour rembourser, et une offre chiffrée de BTP Life', 'Un projet remboursé par les loyers des étals se démontre chiffres en main : c’est ce qui convaincra la banque.'],
          [['On promet de construire avant que le financement soit acquis', 'Sans financement, le chantier s’arrêterait au premier impayé.'], ['On refuse : un marché couvert, ce n’est pas assez gros', 'Chaque ouvrage compte, et celui-ci servira tout un quartier.']]),
      ],
    },
  ],
};
