// Le cinquième dossier du fil rouge : le Marché couvert du Plateau, une halle métallique de soixante étals pour les
// commerçantes de Tantie Bintou, remboursée par les loyers. Loyer d'équilibre, massifs contre la pression et le vent,
// issues d'un lieu bondé, pente du toit et poids de la charpente, acier contrôlé et protégé, levage des portiques,
// gouttières, étals attribués sans passe-droit, entretien de la halle. Sans Three.js ni React.
import { mesure, selection, situation, type DefinitionDossier } from './chapitres-campagne';
import { fr } from './programme-lieu';

// Les chiffres de la halle, repris d'un chapitre à l'autre.
const ETALS = 60, REMBOURSEMENT = 1_400_000, LOYER = 25_000;                // FCFA par mois
const CHARGE_POTEAU = 120, MASSIF = 1.2, ADMISSIBLE = 150;                  // kN, m, kPa
const PUBLIC = 450, PAR_ISSUE = 200;                                        // 3 issues
const DEMI_PORTEE = 5, PENTE = .15;                                         // faîtage à 0,75 m
const PORTIQUES = 5, POTEAU = 5, ARBALETRIER = 5.1, MASSE_METRE = 36.1;     // IPE 270
const METRES = PORTIQUES * (2 * POTEAU + 2 * ARBALETRIER);                  // 101 m de profilés
const SURFACE_METRE = 1.04, COUCHES = 2, RENDEMENT = 8;                      // m²/m, couches, m²/L
const PORTIQUE = 730, ANGLE = 30;                                            // kg, degrés de chaque brin sur la verticale
const VERSANT = 80, PLUIE = 100;                                             // m², mm/h

export const DOSSIER_MARCHE: DefinitionDossier = {
  id: 'marche-couvert', nom: 'Marché couvert du Plateau', ouvrage: 'Halle métallique · 60 étals', client: 'les commerçantes du Plateau',
  parcelle: { slug: 'parcelle-marche', x: -70.5, z: -82, largeur: 18, profondeur: 14 }, nomParcelle: 'Parcelle du marché couvert',
  accueil: { nom: 'Tantie Bintou', role: 'Présidente des commerçantes du Plateau', horaires: { ouverture: 6, fermeture: 15 } },
  livraison: 7, hauteurVue: 6,
  stades: ['Terrain réservé', 'Marché signé', 'Sol sondé', 'Permis affiché', 'Massifs coulés', 'Charpente levée', 'Prêt pour la réception', 'Marché ouvert', 'Référence de l’entreprise'],
  bareme: { argent: { chapitre: 7_000, livraison: 70_000, cloture: 22_000 }, xpBase: 60, xpPrime: { livraison: 280, cloture: 150 }, reputation: { chapitre: 5, livraison: 30, cloture: 14 } },
  cloture: 'Soixante commerçantes vendent à l’abri au Marché couvert du Plateau, et leurs loyers remboursent le prêt. L’université cherche une entreprise pour loger ses étudiants.',
  chapitres: [
    {
      id: 'offre-marche', lieu: 'entreprise', titre: 'La halle des commerçantes', resume: 'Calculer le loyer d’équilibre, écrire le programme, choisir la charpente.',
      recit: 'Tantie Bintou et ses commerçantes vendent sous des bâches, en pleine pluie. Elles veulent une halle de soixante étals, payée par un prêt que leurs loyers rembourseront. Un ouvrage simple en apparence, qui doit durer des décennies.',
      avancee: 'Marché signé avec l’association : le panneau de la halle est planté sur la parcelle.',
      taches: [
        mesure('loyer-equilibre', 'finances', 'Le loyer d’équilibre', {
          enonce: 'Le prêt se rembourse chaque mois, et seuls les loyers des étals le paient.',
          donnees: [['Remboursement du prêt', `${fr(REMBOURSEMENT)} FCFA par mois`], ['Nombre d’étals', String(ETALS)]],
          question: 'Loyer minimal d’un étal, en FCFA par mois ?', unite: 'FCFA', reponse: REMBOURSEMENT / ETALS, tolerance: 50,
          explication: `${fr(REMBOURSEMENT)} ÷ ${ETALS} ≈ ${fr(REMBOURSEMENT / ETALS)} FCFA par étal et par mois, juste pour rembourser. L’association retiendra ${fr(LOYER)} FCFA, pour garder de quoi entretenir la halle.`,
        }),
        selection('programme-halle', 'bureaux', 'Le programme de la halle',
          'Une halle de marché se vit de 6 h à 18 h, sous la chaleur et les orages.', 'Coche ce que la halle doit offrir.', [
            ['Une ventilation naturelle : côtés ouverts et faîtage aéré', true, 'L’air chaud monte et s’échappe par le haut ; les côtés ouverts laissent entrer l’air frais.'],
            ['Des points d’eau et des caniveaux de lavage', true, 'On lave les étals et le sol chaque soir.'],
            ['Des plaques translucides dans la couverture', true, 'La lumière du jour suffit à vendre sans éclairage.'],
            ['Des allées assez larges pour les clients et les chariots', true, 'Un marché bondé doit pouvoir circuler, et s’évacuer.'],
            ['Un local à déchets, fermé, près de l’accès des camions', true, 'Les déchets du marché partent sans traverser les étals.'],
            ['Des murs pleins tout autour, pour fermer la halle', false, 'Fermée, la halle devient un four : l’air ne circule plus.'],
            ['La climatisation de toute la halle', false, 'Inutile dans une halle ouverte, et ruineuse pour les commerçantes.'],
          ]),
        situation('bois-ou-metal', 'direction', 'Bois ou métal ?',
          'Tantie Bintou a vu une charpente en bois au village. Elle demande pourquoi ne pas faire pareil, ce serait moins cher.',
          ['Je lui explique qu’on retient une charpente métallique : dix mètres de portée sans poteau au milieu, et pas de termites', 'Le métal franchit de grandes portées avec des profils fins, ne craint pas les termites, et se monte vite ; protégé de la rouille, il dure des décennies.'],
          [['On fait du bois, c’est plus chaleureux', 'Sur dix mètres de portée, il faudrait des poutres énormes ou des poteaux au milieu des allées, et les termites guettent.'], ['On fait du béton armé partout', 'Une charpente en béton serait lourde, lente à couler, et demanderait des fondations bien plus grosses.']]),
      ],
    },
    {
      id: 'massifs-marche', lieu: 'laboratoire', titre: 'Les massifs de la halle', resume: 'Vérifier la pression sous un massif, connaître le sol, tenir la halle au vent.',
      recit: 'Chaque poteau de la halle repose sur un massif de béton. Il doit porter le toit sans enfoncer le sol, mais aussi le retenir quand le vent cherche à l’arracher.',
      avancee: 'Étude de sol rendue : les points de sondage sont piquetés sur la parcelle.',
      taches: [
        mesure('pression-massif', 'paillasse', 'La pression sous un massif', {
          enonce: 'On compare la pression transmise par un massif carré à la contrainte admissible du sol.',
          donnees: [['Charge d’un poteau', `${CHARGE_POTEAU} kN`], ['Massif', `${fr(MASSIF, 1)} × ${fr(MASSIF, 1)} m`], ['Contrainte admissible du sol', `${ADMISSIBLE} kPa`]],
          question: 'Pression sous le massif, en kPa ?', unite: 'kPa', reponse: CHARGE_POTEAU / (MASSIF * MASSIF), tolerance: .5,
          explication: `${fr(MASSIF, 1)} × ${fr(MASSIF, 1)} = ${fr(MASSIF * MASSIF, 2)} m² ; ${CHARGE_POTEAU} ÷ ${fr(MASSIF * MASSIF, 2)} ≈ ${fr(CHARGE_POTEAU / (MASSIF * MASSIF), 1)} kPa, bien sous les ${ADMISSIBLE} kPa admissibles. Le massif est surtout dimensionné par le vent.`,
        }),
        selection('sol-halle', 'bureau', 'Ce que l’étude doit dire',
          'Pour une halle légère sur massifs, le rapport de sol reste indispensable.', 'Coche ce qu’il doit fournir.', [
            ['La contrainte admissible du sol à la profondeur des massifs', true, 'Elle fixe la taille des massifs.'],
            ['Le niveau de la nappe', true, 'Elle change la façon de fouiller, et allège le poids des massifs immergés.'],
            ['La présence d’anciens remblais', true, 'Un massif posé sur un remblai mou s’enfonce de travers.'],
            ['La nature du sol pour les dallages des allées', true, 'Les allées supporteront des chariots tous les jours.'],
            ['Le prix des étals', false, 'Sans rapport avec le sol.'],
            ['La résistance de l’acier de la charpente', false, 'C’est un contrôle de l’acier, pas du sol.'],
          ]),
        situation('vent-arrachement', 'accueil', 'Le vent sous le toit',
          'Le technicien s’étonne : avec un toit si léger, pourquoi des massifs aussi gros ?',
          ['Parce qu’un orage peut soulever la toiture : le poids des massifs et leurs tiges d’ancrage la retiennent au sol', 'Sur une halle ouverte, le vent s’engouffre sous la couverture et la tire vers le haut ; le massif sert de lest.'],
          [['Par précaution, on met toujours plus de béton', 'On ne dimensionne pas « par précaution » : on calcule le soulèvement au vent.'], ['Ils sont trop gros, on peut les réduire de moitié', 'Réduits, ils ne retiendraient plus la toiture au premier coup de vent.']]),
      ],
    },
    {
      id: 'permis-marche', lieu: 'mairie', titre: 'Un lieu qui reçoit du monde', resume: 'Compter les issues, réunir le dossier, recaser les commerçantes pendant le chantier.',
      recit: 'Un marché, c’est des centaines de personnes en même temps, entre des étals et des marchandises. Le dossier doit montrer qu’on l’évacue vite, et que les commerçantes ne perdent pas leurs clients pendant les travaux.',
      avancee: 'Permis accordé : la palissade ferme la parcelle, le panneau du permis est affiché.',
      taches: [
        mesure('issues-marche', 'urbanisme', 'Les issues de la halle', {
          enonce: 'Le règlement retenu demande une issue par tranche de 200 personnes accueillies, entamée.',
          donnees: [['Public attendu au plus fort', `${PUBLIC} personnes`], ['Règle', `1 issue par tranche de ${PAR_ISSUE} personnes entamée`]],
          question: 'Nombre minimal d’issues ?', unite: 'issues', reponse: Math.ceil(PUBLIC / PAR_ISSUE), tolerance: 0,
          explication: `${PUBLIC} ÷ ${PAR_ISSUE} = ${fr(PUBLIC / PAR_ISSUE, 2)} : ${Math.ceil(PUBLIC / PAR_ISSUE)} issues au moins, sur des côtés différents, jamais encombrées par les marchandises.`,
        }),
        selection('dossier-marche', 'table', 'Le dossier de la halle',
          'La halle sera un lieu recevant du public, ouvert sur la rue.', 'Coche les pièces à joindre au permis.', [
            ['Les plans de la halle et le plan de masse', true, 'Ils décrivent l’ouvrage sur sa parcelle.'],
            ['La notice de sécurité : issues, allées, extincteurs', true, 'Un lieu bondé doit s’évacuer sans bousculade.'],
            ['Le plan de gestion des eaux de pluie', true, 'Un grand toit déverse beaucoup d’eau d’un coup.'],
            ['Le plan d’accès des livraisons et des déchets', true, 'Les camions ne doivent pas traverser la foule.'],
            ['La liste des produits vendus par chaque commerçante', false, 'Sans rapport avec le permis.'],
            ['Les comptes personnels de Tantie Bintou', false, 'Le financement passe par l’association et la banque, pas par le permis.'],
          ]),
        situation('commercantes-chantier', 'guichet', 'Où vendre pendant le chantier ?',
          'Les commerçantes vendent aujourd’hui sur le terrain même de la halle. Le chantier va durer quatre mois.',
          ['On organise avec la mairie un marché provisoire tout proche, sûr et signalé, pendant toute la durée des travaux', 'Les commerçantes vivent de leurs ventes : un emplacement provisoire leur garde leurs clients, et le chantier se fait sans public.'],
          [['Elles vendront au bord du chantier, contre la palissade', 'Des clients serrés contre un chantier, au milieu des camions : l’accident est assuré.'], ['Elles attendront la fin des travaux', 'Quatre mois sans vendre : beaucoup ne pourraient plus payer leur loyer à l’ouverture.']]),
      ],
    },
    {
      id: 'charpente-marche', lieu: 'bureau-etudes', titre: 'La charpente métallique', resume: 'Donner sa pente au toit, peser les portiques, choisir les assemblages.',
      recit: 'Cinq portiques en profilés IPE, couverts de bacs d’acier : une charpente simple, mais chaque chiffre compte. Calculons la pente, le poids de l’acier, et la façon d’assembler.',
      avancee: 'Charpente calculée : les massifs de la halle sont coulés, tiges d’ancrage en attente.',
      taches: [
        mesure('pente-toit', 'calcul', 'La pente du toit', {
          enonce: 'Le toit a deux versants. Chacun couvre une demi-largeur de la halle, avec la pente que demande la couverture.',
          donnees: [['Demi-largeur de la halle', `${DEMI_PORTEE} m`], ['Pente des versants', '15 %']],
          question: 'Hauteur du faîtage au-dessus des sablières, en mètres ?', unite: 'm', reponse: DEMI_PORTEE * PENTE, tolerance: .02,
          explication: `${DEMI_PORTEE} × 0,15 = ${fr(DEMI_PORTEE * PENTE, 2)} m : assez de pente pour que l’eau file vers les gouttières, et un faîtage qui laisse l’air chaud sortir.`,
        }),
        mesure('poids-charpente', 'bureau', 'Le poids de l’acier', {
          enonce: 'Chaque portique compte deux poteaux et deux arbalétriers, en IPE 270.',
          donnees: [['Portiques', String(PORTIQUES)], ['Poteau', `${POTEAU} m`], ['Arbalétrier', `${fr(ARBALETRIER, 1)} m`], ['IPE 270', `${fr(MASSE_METRE, 1)} kg par mètre`]],
          question: 'Masse d’acier des portiques, en kg ?', unite: 'kg', reponse: METRES * MASSE_METRE, tolerance: 10,
          explication: `2 × ${POTEAU} + 2 × ${fr(ARBALETRIER, 1)} = ${fr(2 * POTEAU + 2 * ARBALETRIER, 1)} m par portique ; × ${PORTIQUES} = ${fr(METRES)} m ; × ${fr(MASSE_METRE, 1)} ≈ ${fr(METRES * MASSE_METRE)} kg d’acier, sans compter les pannes ni les boulons.`,
        }),
        situation('souder-ou-boulonner', 'maquette', 'Souder sur le chantier ?',
          'Le charpentier propose de souder tous les assemblages sur le chantier, en hauteur, « pour aller plus vite ».',
          ['Les soudures se font à l’atelier, et les assemblages du chantier sont boulonnés', 'Une soudure en hauteur, au vent et au soleil, se contrôle mal ; à l’atelier, elle est faite à plat et vérifiée. Sur le chantier, on boulonne.'],
          [['On soude tout sur place, c’est plus solide', 'Une soudure mal faite en hauteur est plus fragile qu’un bon boulonnage, et dangereuse à exécuter.'], ['On colle les assemblages, c’est moderne', 'Une charpente métallique ne se colle pas : elle se boulonne ou se soude.']]),
      ],
    },
    {
      id: 'acier-marche', lieu: 'fournisseur', titre: 'L’acier de la halle', resume: 'Calculer la peinture, contrôler les profilés, traiter la rouille.',
      recit: 'Les profilés arrivent au dépôt. Un acier mal protégé rouille en quelques saisons des pluies : on contrôle ce qui arrive, et on commande de quoi le peindre comme il faut.',
      avancee: 'Acier livré et contrôlé : les portiques se lèvent un à un, avec la grue.',
      taches: [
        mesure('peinture-acier', 'comptoir', 'La peinture anticorrosion', {
          enonce: 'Les profilés reçoivent deux couches de peinture anticorrosion. On compte la surface à peindre, puis les litres.',
          donnees: [['Longueur de profilés', `${fr(METRES)} m`], ['Surface à peindre par mètre', `${fr(SURFACE_METRE, 2)} m²`], ['Couches', String(COUCHES)], ['Rendement', `${RENDEMENT} m² par litre`]],
          question: 'Litres de peinture à commander (arrondis au litre supérieur) ?', unite: 'L', reponse: Math.ceil(METRES * SURFACE_METRE * COUCHES / RENDEMENT), tolerance: 0,
          explication: `${fr(METRES)} × ${fr(SURFACE_METRE, 2)} = ${fr(METRES * SURFACE_METRE, 2)} m² ; × ${COUCHES} couches = ${fr(METRES * SURFACE_METRE * COUCHES, 2)} m² ; ÷ ${RENDEMENT} ≈ ${fr(METRES * SURFACE_METRE * COUCHES / RENDEMENT, 2)} L : on commande ${Math.ceil(METRES * SURFACE_METRE * COUCHES / RENDEMENT)} litres.`,
        }),
        selection('controle-profiles', 'reception', 'La livraison des profilés',
          'Le camion de profilés est au quai.', 'Coche ce que tu contrôles.', [
            ['Le certificat de l’acier : sa nuance et son usine', true, 'La résistance de l’acier fait partie du calcul.'],
            ['Les sections et les longueurs, comparées aux plans', true, 'Un profilé plus petit ne porte pas la charge prévue.'],
            ['Des barres droites, sans pli ni choc', true, 'Un profilé tordu au transport ne se remet pas droit à la main.'],
            ['L’état de la couche de protection', true, 'Une rayure laissée nue, c’est le départ de la rouille.'],
            ['La couleur de la peinture de finition', false, 'Elle se choisit plus tard ; ce n’est pas un contrôle de réception.'],
            ['Le poids d’un seul boulon', false, 'Sans intérêt pour accepter la livraison.'],
          ]),
        situation('rouille-profiles', 'stock', 'De la rouille sur les profilés',
          'Des profilés stockés sous la pluie présentent une rouille de surface, orange, qui part à la brosse.',
          ['On brosse jusqu’au métal sain, puis on passe le primaire anticorrosion avant de peindre', 'Une rouille de surface se traite ; peinte telle quelle, elle continuerait de ronger l’acier sous la peinture.'],
          [['On peint directement par-dessus', 'La rouille continuerait sous la peinture, qui finirait par cloquer et tomber.'], ['On jette tous les profilés', 'Une rouille superficielle ne justifie pas de les jeter : on les traite, et on les stocke à l’abri.']]),
      ],
    },
    {
      id: 'levage-marche', lieu: 'logistique', titre: 'Le levage des portiques', resume: 'Calculer l’effort dans les élingues, baliser, arrêter quand le vent forcit.',
      recit: 'Un portique de sept cents kilos, accroché par deux élingues, qui monte au-dessus des têtes : le levage de la halle se prépare comme une opération à part entière.',
      avancee: 'Couverture posée, étals montés : la halle attend sa réception.',
      taches: [
        mesure('effort-elingue', 'quai', 'L’effort dans une élingue', {
          enonce: 'Le portique est levé par deux brins d’élingue ; chacun fait un angle avec la verticale, ce qui augmente l’effort qu’il porte.',
          donnees: [['Masse du portique', `${PORTIQUE} kg`], ['Brins', '2'], ['Angle de chaque brin avec la verticale', `${ANGLE}°`]],
          question: 'Charge portée par chaque brin, en kg ?', unite: 'kg', reponse: PORTIQUE / (2 * Math.cos(ANGLE * Math.PI / 180)), tolerance: 3,
          explication: `${PORTIQUE} ÷ (2 × cos ${ANGLE}°) = ${PORTIQUE} ÷ ${fr(2 * Math.cos(ANGLE * Math.PI / 180), 3)} ≈ ${fr(PORTIQUE / (2 * Math.cos(ANGLE * Math.PI / 180)))} kg par brin, plus que la moitié du portique. Plus les brins s’écartent, plus chacun travaille : on choisit des élingues en conséquence.`,
        }),
        situation('vent-portique', 'dispatch', 'Le vent se lève',
          'Un portique est en l’air quand le vent forcit : la pièce commence à tourner au bout des élingues.',
          ['On pose le portique au sol en le guidant aux cordes, et on arrête les levages jusqu’à ce que le vent retombe', 'Un portique offre une grande prise au vent : on ne le laisse pas tourner au-dessus des équipes, on le pose et on attend.'],
          [['On le tient à la main pour le stabiliser', 'Personne ne retient un portique pris par le vent : on se fait écraser.'], ['On accélère pour le mettre en place avant la rafale', 'Monter plus vite une charge qui tourne, c’est risquer de heurter les autres portiques et les monteurs.']]),
        selection('balisage-levage', 'rayonnages', 'Préparer un levage',
          'Demain, on lève les cinq portiques de la halle.', 'Coche ce qu’il faut prévoir.', [
            ['Une zone de levage balisée, interdite à tous sauf aux monteurs', true, 'Personne ne passe sous une charge.'],
            ['Un seul chef de manœuvre, qui guide le grutier', true, 'Deux voix qui donnent des ordres, c’est l’accident.'],
            ['Des cordes de guidage attachées au portique', true, 'On le guide de loin, sans le toucher à la main.'],
            ['Des élingues contrôlées, adaptées à la charge', true, 'Une élingue usée ou trop faible casse sans prévenir.'],
            ['Des monteurs qui guident sous la charge, pour plus de précision', false, 'Jamais sous la charge : on guide aux cordes, à distance.'],
            ['Un levage pendant la vente, pour ne pas fermer le marché provisoire', false, 'Le levage se fait sans public autour.'],
          ]),
      ],
    },
    {
      id: 'reception-marche', lieu: 'parcelle-marche', titre: 'La réception de la halle', resume: 'Vérifier les gouttières, noter les réserves, attribuer les étals sans passe-droit.',
      recit: 'La halle est prête, et toutes les commerçantes sont là ! Faisons le tour ensemble, gouttières comprises : la première averse ne doit pas tomber sur les étals.',
      avancee: 'Halle réceptionnée : soixante commerçantes vendent à l’abri au Marché couvert du Plateau.',
      taches: [
        mesure('gouttiere', 'parcelle', 'Les gouttières', {
          enonce: 'Chaque versant déverse la pluie dans sa gouttière. On calcule le débit qu’elle doit évacuer sous une forte averse.',
          donnees: [['Surface d’un versant', `${VERSANT} m²`], ['Averse de référence', `${PLUIE} mm par heure`]],
          question: 'Débit à évacuer par la gouttière d’un versant, en litres par seconde ?', unite: 'L/s', reponse: VERSANT * PLUIE / 3600, tolerance: .05,
          explication: `${VERSANT} m² × ${fr(PLUIE / 1000, 1)} m = ${fr(VERSANT * PLUIE / 1000)} m³ par heure, soit ${fr(VERSANT * PLUIE)} L ÷ 3 600 s ≈ ${fr(VERSANT * PLUIE / 3600, 2)} L/s : c’est ce que la gouttière et ses descentes doivent avaler sans déborder.`,
        }),
        selection('reserves-marche', 'parcelle', 'Les réserves de la halle',
          'Pendant la visite, tu notes ce qui n’est pas conforme au marché.', 'Coche ce qui doit être inscrit en réserve.', [
            ['Une plaque de couverture qui laisse passer l’eau', true, 'Une fuite au-dessus des étals : à reprendre.'],
            ['Un caniveau en contre-pente, où l’eau stagne', true, 'L’eau doit partir, pas croupir entre les étals.'],
            ['Un écrou manquant à un pied de poteau', true, 'Chaque ancrage compte quand le vent souffle.'],
            ['Un robinet sans évacuation sous l’évier', true, 'L’eau du lavage coulerait dans l’allée.'],
            ['La couleur des étals, que certaines trouvent trop sombre', false, 'C’était le choix de l’association : pas un défaut.'],
            ['L’absence de climatisation', false, 'Elle n’a jamais été prévue : la halle est ventilée naturellement.'],
          ]),
        situation('meilleurs-etals', 'parcelle', 'Les meilleurs étals',
          'Tantie Bintou te demande, discrètement, de réserver les étals près de l’entrée à sa famille.',
          ['Je lui rappelle que l’attribution revient à l’association, selon des règles connues de toutes, par exemple un tirage au sort', 'L’entreprise livre la halle ; elle n’attribue pas les étals. Des règles claires évitent les disputes, et protègent Tantie Bintou elle-même.'],
          [['J’accepte, c’est la cliente', 'Une faveur cachée finit toujours par se savoir, et elle divise les commerçantes.'], ['Je réserve aussi un étal pour BTP Life', 'L’entreprise n’a rien à vendre au marché : ce serait un abus.']]),
      ],
    },
    {
      id: 'bilan-marche', lieu: 'banque', titre: 'La halle qui se rembourse', resume: 'Vérifier ce qui reste pour l’entretien, écrire le plan d’entretien, aider l’université.',
      recit: 'La halle vit, et les loyers tombent chaque mois. Vérifions que le prêt se rembourse et qu’il reste de quoi entretenir l’ouvrage : un marché mal entretenu se dégrade en quelques saisons.',
      avancee: 'Prêt sur les rails : le Marché couvert du Plateau rejoint nos références.',
      taches: [
        mesure('reste-entretien', 'conseiller', 'Ce qui reste pour l’entretien', {
          enonce: 'L’association a fixé le loyer au-dessus du minimum : la différence finance l’entretien.',
          donnees: [['Étals loués', String(ETALS)], ['Loyer d’un étal', `${fr(LOYER)} FCFA par mois`], ['Remboursement du prêt', `${fr(REMBOURSEMENT)} FCFA par mois`]],
          question: 'Ce qui reste chaque mois pour l’entretien, en FCFA ?', unite: 'FCFA', reponse: ETALS * LOYER - REMBOURSEMENT, tolerance: 0,
          explication: `${ETALS} × ${fr(LOYER)} = ${fr(ETALS * LOYER)} FCFA ; − ${fr(REMBOURSEMENT)} = ${fr(ETALS * LOYER - REMBOURSEMENT)} FCFA par mois pour l’entretien : gouttières, peinture, caniveaux.`,
        }),
        selection('entretien-halle', 'guichet', 'Le plan d’entretien',
          'La banque veut savoir comment la halle sera entretenue pendant toute la durée du prêt.', 'Coche ce que le plan d’entretien doit prévoir.', [
            ['Nettoyer les gouttières avant chaque saison des pluies', true, 'Une gouttière bouchée déborde sur les étals.'],
            ['Contrôler le serrage des boulons de la charpente chaque année', true, 'Le vent et les dilatations desserrent les assemblages.'],
            ['Retoucher la peinture dès qu’une rouille apparaît', true, 'Une tache de rouille traitée tôt coûte peu ; laissée, elle ronge l’acier.'],
            ['Curer les caniveaux chaque semaine', true, 'Des caniveaux bouchés, c’est de l’eau stagnante et des moustiques.'],
            ['Attendre une fuite pour monter sur le toit', false, 'L’entretien se prévoit : réparer après coup coûte plus cher.'],
            ['Repeindre toute la halle chaque année', false, 'Inutile et coûteux : on retouche là où c’est nécessaire.'],
          ]),
        situation('residence-etudiants', 'accueil', 'La résidence des étudiants',
          'Le vice-président de l’université ouvre un compte à la banque. Il cherche une entreprise pour bâtir une résidence de quarante-huit chambres avant la prochaine rentrée.',
          ['On le rencontre pour comprendre son délai, et on étudie une construction en partie préfabriquée pour le tenir', 'Un délai serré se prépare dès l’offre : la préfabrication fait gagner des semaines si on la décide tôt.'],
          [['On promet la date sans rien étudier', 'Une promesse de délai sans méthode, ce sont des pénalités assurées.'], ['On refuse : la rentrée est trop proche', 'Avant de refuser, on cherche une méthode qui tienne le délai.']]),
      ],
    },
  ],
};
