// Le sixième dossier du fil rouge : la Résidence universitaire des Bâtisseurs, quarante-huit chambres sur quatre
// niveaux pour l'université, à livrer avant la rentrée. Préfabrication (prémurs et prédalles) pour tenir le délai,
// béton d'usine contrôlé, chambres accessibles et sécurité incendie, eau chaude solaire et brise-soleil, ballet des
// camions et pose en sécurité, maquette d'exploitation, réception à la rentrée, gain de délai. Sans Three.js ni React.
import { mesure, selection, situation, type DefinitionDossier } from './chapitres-campagne';
import { fr } from './programme-lieu';

// Les chiffres de la résidence, repris d'un chapitre à l'autre.
const COUT = 336, CHAMBRES = 48, NIVEAUX = 4;                          // M FCFA, 12 chambres par niveau
const RUPTURE = 603, DIAMETRE = .16;                                   // kN, m : ≈ 30 MPa
const SECTION = Math.PI * (DIAMETRE / 2) ** 2;
const PART_ACCESSIBLE = .05;                                           // 3 chambres
const LITRES_CHAMBRE = 40, LITRES_M2_CAPTEUR = 50;                     // 38,4 m² de capteurs
const FENETRE = 1.5, SOLEIL = 70;                                      // m, degrés : débord ≈ 0,55 m
const PREDALLES_NIVEAU = 12, PAR_CAMION = 4;                           // 12 rotations
const MINUTES_TEST = 2;                                                // par détecteur et par mois : 19,2 h par an
const LITRES_MESURES = 3, SECONDES = 20;                               // 9 L/min
const SEMAINES_GAGNEES = 6, FRAIS_SEMAINE = 1.2;                       // 7,2 M FCFA

export const DOSSIER_RESIDENCE_U: DefinitionDossier = {
  id: 'residence-universitaire', nom: 'Résidence universitaire des Bâtisseurs', ouvrage: 'R+3 · 48 chambres d’étudiants', client: 'l’université',
  parcelle: { slug: 'parcelle-universitaire', x: 68.5, z: -83.5, largeur: 14, profondeur: 16 }, nomParcelle: 'Parcelle de la résidence universitaire',
  accueil: { nom: 'Pr N’Dri', role: 'Vice-président de l’université', horaires: { ouverture: 8, fermeture: 17 } },
  livraison: 7, hauteurVue: 9,
  stades: ['Terrain réservé', 'Marché signé', 'Sol sondé', 'Permis affiché', 'Fondations coulées', 'Prédalles en pose', 'Prête pour la réception', 'Résidence ouverte', 'Référence de l’entreprise'],
  bareme: { argent: { chapitre: 8_000, livraison: 80_000, cloture: 25_000 }, xpBase: 65, xpPrime: { livraison: 290, cloture: 160 }, reputation: { chapitre: 5, livraison: 30, cloture: 15 } },
  cloture: 'Quarante-huit étudiants vivent à la Résidence universitaire des Bâtisseurs, livrée avant la rentrée grâce à la préfabrication. La Régie des eaux prépare un château d’eau.',
  chapitres: [
    {
      id: 'offre-residence', lieu: 'entreprise', titre: 'La résidence avant la rentrée', resume: 'Chiffrer une chambre, choisir la préfabrication, planifier à rebours.',
      recit: 'L’université veut loger quarante-huit étudiants dès la prochaine rentrée : quatre niveaux de douze chambres. Le délai est serré ; on ne le tiendra qu’avec une méthode, décidée dès l’offre.',
      avancee: 'Marché signé avec l’université : le panneau de la résidence est planté sur la parcelle.',
      taches: [
        mesure('cout-chambre', 'finances', 'Le prix d’une chambre', {
          enonce: 'L’université compare les offres au prix d’une chambre.',
          donnees: [['Prix de l’offre', `${COUT} M FCFA HT`], ['Chambres', String(CHAMBRES)]],
          question: 'Prix d’une chambre, en millions de FCFA ?', unite: 'M FCFA', reponse: COUT / CHAMBRES, tolerance: .02,
          explication: `${COUT} ÷ ${CHAMBRES} = ${fr(COUT / CHAMBRES)} M FCFA par chambre, parties communes comprises : c’est le chiffre que l’université compare d’une offre à l’autre.`,
        }),
        selection('prefabrication', 'bureaux', 'Pourquoi préfabriquer ?',
          'Les murs et les planchers seront coulés en usine, en prémurs et en prédalles, puis posés à la grue.', 'Coche ce que la préfabrication apporte vraiment.', [
            ['Un délai plus court : l’usine coule pendant qu’on fait les fondations', true, 'Les deux chantiers avancent en même temps.'],
            ['Une qualité régulière, coulée à l’abri et contrôlée', true, 'Le béton d’usine ne subit ni la pluie ni le soleil.'],
            ['Moins de déchets et de coffrages sur la parcelle', true, 'Le chantier est plus propre, et plus sûr.'],
            ['Moins de travail en hauteur pendant le gros œuvre', true, 'Les éléments arrivent finis : on les pose, on ne les coffre pas là-haut.'],
            ['Plus besoin de fondations', false, 'Un bâtiment préfabriqué pèse autant : il lui faut ses fondations.'],
            ['Plus besoin de grue', false, 'Au contraire : chaque élément se pose à la grue.'],
          ]),
        situation('planning-rebours', 'direction', 'Partir de la rentrée',
          'Le Pr N’Dri insiste : la résidence doit ouvrir le jour de la rentrée, pas une semaine après.',
          ['On bâtit le planning à rebours depuis la rentrée, avec la commande des éléments préfabriqués comme première échéance', 'Partir de la date à tenir montre ce qu’il faut décider tout de suite : la commande à l’usine, qui conditionne tout le reste.'],
          [['On commence vite, et on verra bien', 'Sans planning, on découvre trop tard que l’usine demande huit semaines.'], ['On promet la date, et on paiera les pénalités s’il le faut', 'Les pénalités ne logent pas les étudiants : c’est l’ouverture qui compte.']]),
      ],
    },
    {
      id: 'beton-usine', lieu: 'laboratoire', titre: 'Le béton de l’usine', resume: 'Calculer une résistance, contrôler la préfabrication, refuser un lot douteux.',
      recit: 'Les prémurs et les prédalles sont coulés loin d’ici, à l’usine. Le laboratoire contrôle leur béton comme sur un chantier : éprouvettes, résultats, et visite de l’usine.',
      avancee: 'Sol sondé et béton de l’usine validé : l’implantation de la résidence est tracée.',
      taches: [
        mesure('resistance-eprouvette', 'presse', 'La résistance d’une éprouvette', {
          enonce: 'Une éprouvette cylindrique de 16 cm de diamètre est écrasée à la presse, à 28 jours.',
          donnees: [['Charge de rupture', `${RUPTURE} kN`], ['Diamètre', '16 cm'], ['Classe prescrite', 'C25/30 : 25 MPa sur cylindre']],
          question: 'Résistance de l’éprouvette, en MPa ?', unite: 'MPa', reponse: RUPTURE / SECTION / 1000, tolerance: .3,
          explication: `Section : π × 0,08² ≈ ${fr(SECTION, 4)} m² ; ${RUPTURE} kN ÷ ${fr(SECTION, 4)} m² ≈ ${fr(RUPTURE / SECTION)} kPa, soit ${fr(RUPTURE / SECTION / 1000, 1)} MPa : au-dessus des 25 MPa demandés sur cylindre.`,
        }),
        selection('visite-usine', 'bureau', 'La visite de l’usine',
          'Avant la première livraison, tu visites l’usine de préfabrication avec le laboratoire.', 'Coche ce qu’il faut vérifier.', [
            ['Les résultats des éprouvettes de chaque lot', true, 'Chaque élément doit pouvoir être relié à son béton.'],
            ['Les plans de fabrication, conformes aux plans d’exécution', true, 'Réservations, aciers, crochets de levage : tout doit y être.'],
            ['Le marquage de chaque élément : repère, date, lot', true, 'Sur le chantier, on sait où poser chaque élément, et d’où il vient.'],
            ['Le temps de durcissement avant le démoulage et le transport', true, 'Un élément transporté trop jeune se fissure.'],
            ['La couleur des camions de l’usine', false, 'Sans rapport avec la qualité des éléments.'],
            ['Le prix de vente des éléments aux autres clients', false, 'Une information commerciale de l’usine, sans rapport avec le contrôle.'],
          ]),
        situation('lot-douteux', 'accueil', 'Un lot à 21 MPa',
          'Les éprouvettes d’un lot de prédalles donnent 21 MPa, pour 25 MPa demandés. Les prédalles doivent partir demain.',
          ['On bloque le lot, on fait carotter les prédalles concernées, et le bureau d’études décide sur les résultats', 'Un résultat faible se vérifie dans l’élément lui-même : on ne pose pas une prédalle douteuse au-dessus de la tête des étudiants.'],
          [['On les pose : 21, c’est presque 25', 'Une prédalle moins résistante que le calcul, c’est une marge de sécurité qui disparaît.'], ['On les mélange aux autres lots, ça ne se verra pas', 'C’est de la fraude : et si l’élément cède, rien ne permettra de retrouver le lot.']]),
      ],
    },
    {
      id: 'permis-residence', lieu: 'mairie', titre: 'Une résidence sûre et accessible', resume: 'Compter les chambres accessibles, prévoir la sécurité incendie, penser à l’étage futur.',
      recit: 'Quarante-huit jeunes qui dorment sous le même toit : le dossier doit montrer qu’ils sont en sécurité la nuit, et que des étudiants en fauteuil y trouvent leur place.',
      avancee: 'Permis accordé : la palissade ferme la parcelle, le panneau du permis est affiché.',
      taches: [
        mesure('chambres-accessibles', 'urbanisme', 'Les chambres accessibles', {
          enonce: 'Le programme demande qu’au moins 5 % des chambres soient adaptées aux personnes en fauteuil, au rez-de-chaussée.',
          donnees: [['Chambres', String(CHAMBRES)], ['Part adaptée', 'au moins 5 %, arrondie au-dessus']],
          question: 'Nombre de chambres adaptées ?', unite: 'chambres', reponse: Math.ceil(CHAMBRES * PART_ACCESSIBLE), tolerance: 0,
          explication: `${CHAMBRES} × 5 % = ${fr(CHAMBRES * PART_ACCESSIBLE, 1)} : ${Math.ceil(CHAMBRES * PART_ACCESSIBLE)} chambres adaptées, avec leur salle d’eau, au rez-de-chaussée et près de l’entrée.`,
        }),
        selection('incendie-residence', 'table', 'La sécurité de nuit',
          'Les étudiants dorment à la résidence : un incendie la nuit doit être détecté, et chacun doit pouvoir sortir.', 'Coche ce que le dossier doit prévoir.', [
            ['Un détecteur de fumée dans chaque chambre', true, 'Il réveille l’occupant avant que la fumée ne l’endorme.'],
            ['Des extincteurs à chaque niveau', true, 'Un début de feu s’éteint dans les premières minutes.'],
            ['Un escalier protégé de la fumée', true, 'C’est la voie de sortie de tous les étages.'],
            ['Un éclairage de sécurité dans les circulations', true, 'Quand le courant coupe, on voit encore où aller.'],
            ['Des grilles soudées aux fenêtres de toutes les chambres', false, 'Elles empêchent de fuir et les secours d’entrer.'],
            ['L’escalier fermé à clé la nuit', false, 'Une sortie fermée à clé ne sert à rien le jour où il faut sortir.'],
          ]),
        situation('etage-futur', 'guichet', 'Un étage de plus, plus tard ?',
          'L’université pense ajouter un niveau de chambres dans quelques années. Elle demande si l’on peut s’y préparer.',
          ['On calcule dès maintenant fondations et structure pour le niveau futur, et on l’écrit dans le dossier', 'Prévoir la charge future ne coûte presque rien aujourd’hui ; renforcer après coup coûterait une fortune, ou serait impossible.'],
          [['On verra le moment venu', 'Le moment venu, les fondations seront sous le bâtiment : impossible de les agrandir.'], ['On construit tout de suite l’étage en plus, sans permis', 'Un étage se construit avec son permis, et quand l’université l’a décidé.']]),
      ],
    },
    {
      id: 'econome-residence', lieu: 'bureau-etudes', titre: 'Une résidence économe', resume: 'Dimensionner l’eau chaude solaire, ombrer les fenêtres, isoler les chambres du bruit.',
      recit: 'Les étudiants paieront leurs charges : une résidence qui chauffe son eau au soleil et se protège de la chaleur coûte moins cher à vivre. Et pour étudier, il faut du calme.',
      avancee: 'Équipements calculés : les fondations de la résidence sont coulées.',
      taches: [
        mesure('eau-chaude-solaire', 'calcul', 'L’eau chaude solaire', {
          enonce: 'Les capteurs solaires du toit chauffent l’eau des douches.',
          donnees: [['Chambres', String(CHAMBRES)], ['Eau chaude par chambre', `${LITRES_CHAMBRE} L par jour`], ['Capteurs', `1 m² pour ${LITRES_M2_CAPTEUR} L par jour`]],
          question: 'Surface de capteurs, en m² ?', unite: 'm²', reponse: CHAMBRES * LITRES_CHAMBRE / LITRES_M2_CAPTEUR, tolerance: .2,
          explication: `${CHAMBRES} × ${LITRES_CHAMBRE} = ${fr(CHAMBRES * LITRES_CHAMBRE)} L par jour ; ÷ ${LITRES_M2_CAPTEUR} = ${fr(CHAMBRES * LITRES_CHAMBRE / LITRES_M2_CAPTEUR, 1)} m² de capteurs, orientés vers le soleil sur le toit-terrasse.`,
        }),
        mesure('brise-soleil', 'bureau', 'Le brise-soleil', {
          enonce: 'Un débord horizontal au-dessus de chaque fenêtre la met à l’ombre quand le soleil est haut.',
          donnees: [['Hauteur de la fenêtre', `${fr(FENETRE, 2)} m`], ['Hauteur du soleil à midi', `${SOLEIL}°`]],
          question: 'Débord nécessaire pour ombrer toute la fenêtre, en mètres ?', unite: 'm', reponse: FENETRE / Math.tan(SOLEIL * Math.PI / 180), tolerance: .02,
          explication: `${fr(FENETRE, 2)} ÷ tan ${SOLEIL}° = ${fr(FENETRE, 2)} ÷ ${fr(Math.tan(SOLEIL * Math.PI / 180), 2)} ≈ ${fr(FENETRE / Math.tan(SOLEIL * Math.PI / 180), 2)} m de débord : à midi, toute la fenêtre est à l’ombre, et la chambre reste plus fraîche.`,
        }),
        situation('bruit-chambres', 'maquette', 'Le bruit du voisin',
          'Pour gagner de la place, l’architecte propose des cloisons légères de 7 cm entre les chambres.',
          ['On garde des murs séparatifs lourds, ou des cloisons doubles isolées, et des portes à joint', 'Le bruit passe à travers ce qui est léger : entre deux chambres, il faut de la masse ou une double paroi.'],
          [['Des cloisons légères suffisent, les étudiants mettront des écouteurs', 'On ne dort pas avec des écouteurs : le bruit du voisin empêcherait d’étudier et de dormir.'], ['Un simple rideau épais sur le mur', 'Un rideau ne fait presque rien contre le bruit qui traverse la cloison.']]),
      ],
    },
    {
      id: 'pose-residence', lieu: 'logistique', titre: 'Le ballet des prédalles', resume: 'Compter les rotations, refuser un élément abîmé, poser en sécurité.',
      recit: 'Les prédalles arrivent de l’usine par camion, quatre à la fois, et la grue les pose une à une. Le rythme des camions fait le rythme du chantier.',
      avancee: 'Prédalles livrées : la résidence monte, un niveau par semaine.',
      taches: [
        mesure('rotations-predalles', 'quai', 'Les rotations des camions', {
          enonce: 'Chaque niveau compte ses prédalles, et un camion en transporte un nombre fixe.',
          donnees: [['Niveaux', String(NIVEAUX)], ['Prédalles par niveau', String(PREDALLES_NIVEAU)], ['Prédalles par camion', String(PAR_CAMION)]],
          question: 'Nombre de rotations de camions ?', unite: 'rotations', reponse: NIVEAUX * PREDALLES_NIVEAU / PAR_CAMION, tolerance: 0,
          explication: `${NIVEAUX} × ${PREDALLES_NIVEAU} = ${NIVEAUX * PREDALLES_NIVEAU} prédalles ; ÷ ${PAR_CAMION} = ${NIVEAUX * PREDALLES_NIVEAU / PAR_CAMION} rotations, programmées pour que la grue n’attende jamais, et qu’aucun camion n’attende dans la rue.`,
        }),
        situation('predalle-fissuree', 'dispatch', 'Une prédalle fissurée',
          'Au déchargement, une prédalle présente une fissure traversante. Le chauffeur assure qu’elle « tiendra ».',
          ['Je la refuse : elle repart à l’usine, et je préviens le bureau d’études et le planning', 'Une prédalle fissurée de part en part n’a plus la résistance du calcul : on ne la pose pas, on la remplace.'],
          [['Je la pose, on bouchera la fissure au mortier', 'Le mortier cache la fissure, il ne rend pas la résistance.'], ['Je la garde sur le chantier pour un usage moins important', 'Il n’y a pas d’usage « moins important » pour un plancher : elle repart.']]),
        selection('pose-predalles', 'rayonnages', 'Poser en sécurité',
          'La grue va poser la première série de prédalles.', 'Coche ce qu’il faut prévoir.', [
            ['Le plan de pose : ordre, repères et appuis de chaque élément', true, 'Chaque prédalle a sa place, marquée à l’usine.'],
            ['Des étais provisoires sous les prédalles, avant le coulage', true, 'Elles ne portent le béton frais que bien étayées.'],
            ['Un palonnier ou des élingues adaptés au poids de chaque élément', true, 'Un élément mal accroché peut basculer en l’air.'],
            ['Des garde-corps en bord de plancher avant d’y travailler', true, 'Les poseurs travaillent au bord du vide.'],
            ['Guider la prédalle à la main, juste dessous', false, 'Jamais sous la charge : on guide aux cordes, à distance.'],
            ['Poser par vent fort pour tenir le planning', false, 'Une grande prédalle prend le vent comme une voile : on arrête.'],
          ]),
      ],
    },
    {
      id: 'maquette-residence', lieu: 'atelier', titre: 'La maquette d’exploitation', resume: 'Livrer une maquette utile, planifier les contrôles, repérer les équipements.',
      recit: 'La résidence vivra des décennies : le service technique de l’université aura besoin de savoir où passe chaque réseau, et quand contrôler chaque équipement. La maquette numérique devient leur outil.',
      avancee: 'Finitions et maquette d’exploitation achevées : la résidence attend sa réception.',
      taches: [
        selection('maquette-exploitation', 'grand-ecran', 'Ce que la maquette doit contenir',
          'La maquette remise à l’université doit décrire la résidence telle qu’elle est bâtie.', 'Coche ce qu’elle doit contenir.', [
            ['Les plans conformes à ce qui a été réellement construit', true, 'Les plans du projet ne suffisent pas : on y reporte chaque changement du chantier.'],
            ['Le tracé des réseaux : eau, électricité, évacuations', true, 'On sait où creuser, où percer, où couper.'],
            ['Les fiches des équipements : chauffe-eau, détecteurs, pompes', true, 'Marque, modèle, garantie et entretien de chacun.'],
            ['Le calendrier des contrôles et de l’entretien', true, 'L’exploitant sait quoi vérifier, et quand.'],
            ['Les notes des étudiants', false, 'Des données personnelles, sans rapport avec le bâtiment.'],
            ['Les plans des concurrents', false, 'Sans rapport, et confidentiels.'],
          ]),
        mesure('tests-detecteurs', 'postes', 'Le temps des contrôles', {
          enonce: 'Chaque détecteur de fumée se teste une fois par mois. L’exploitant veut savoir combien d’heures cela représente par an.',
          donnees: [['Détecteurs', String(CHAMBRES)], ['Durée d’un test', `${MINUTES_TEST} minutes`], ['Fréquence', 'une fois par mois']],
          question: 'Heures de tests par an ?', unite: 'h', reponse: CHAMBRES * MINUTES_TEST * 12 / 60, tolerance: .1,
          explication: `${CHAMBRES} × ${MINUTES_TEST} min × 12 mois = ${fr(CHAMBRES * MINUTES_TEST * 12)} min, soit ${fr(CHAMBRES * MINUTES_TEST * 12 / 60, 1)} heures par an, à prévoir dans le planning du service technique.`,
        }),
        situation('reperer-equipements', 'imprimante', 'Retrouver une vanne',
          'Le service technique demande comment ses agents retrouveront la bonne vanne en cas de fuite, la nuit.',
          ['On étiquette chaque vanne et chaque tableau d’un repère et d’un code relié à la maquette', 'Un repère sur l’équipement, le même dans la maquette : on trouve tout de suite quoi fermer, et où.'],
          [['Le gardien s’en souviendra', 'Le gardien change, oublie, ou n’est pas là la nuit de la fuite.'], ['On range une liste papier au bureau', 'Une liste qu’on ne trouve pas pendant la fuite ne sert à rien.']]),
      ],
    },
    {
      id: 'reception-residence', lieu: 'parcelle-universitaire', titre: 'La réception de la résidence', resume: 'Mesurer le débit des douches, noter les réserves, ouvrir à la rentrée.',
      recit: 'La rentrée est dans quatre jours : les étudiants attendent leurs clés. Faisons le tour des chambres, robinets et douches compris.',
      avancee: 'Résidence réceptionnée : quarante-huit étudiants s’installent pour la rentrée.',
      taches: [
        mesure('debit-douche', 'parcelle', 'Le débit d’une douche', {
          enonce: 'Le programme demande au moins 12 litres par minute à chaque douche. On remplit un seau gradué au pommeau.',
          donnees: [['Eau recueillie', `${LITRES_MESURES} L`], ['Temps', `${SECONDES} secondes`], ['Exigence', '12 L par minute au moins']],
          question: 'Débit mesuré, en litres par minute ?', unite: 'L/min', reponse: LITRES_MESURES / SECONDES * 60, tolerance: .1,
          explication: `${LITRES_MESURES} L en ${SECONDES} s, soit ${LITRES_MESURES} × 60 ÷ ${SECONDES} = ${fr(LITRES_MESURES / SECONDES * 60)} L par minute : sous les 12 exigés. Réserve : vérifier la pression et le réducteur de cette colonne.`,
        }),
        selection('reserves-residence', 'parcelle', 'Les réserves de la résidence',
          'Pendant la visite, tu notes ce qui n’est pas conforme au marché.', 'Coche ce qui doit être inscrit en réserve.', [
            ['Les douches d’une colonne, à 9 L par minute', true, 'Sous l’exigence du programme : à reprendre.'],
            ['Un détecteur de fumée qui ne répond pas au test', true, 'Un équipement de sécurité en défaut.'],
            ['Une porte de chambre qui ne ferme pas à clé', true, 'Chaque étudiant doit pouvoir fermer sa chambre.'],
            ['Un brise-soleil mal fixé au deuxième étage', true, 'Il pourrait tomber au premier coup de vent.'],
            ['Le choix des couleurs des portes, validé au marché', false, 'C’était le choix de l’université : pas un défaut.'],
            ['L’absence de climatisation, non prévue au marché', false, 'Elle n’a jamais été prévue : brise-soleil et ventilation la remplacent.'],
          ]),
        situation('rentree-residence', 'parcelle', 'Les clés à la rentrée',
          'Deux chambres gardent un défaut de plomberie à reprendre ; les quarante-six autres sont prêtes. La rentrée est dans quatre jours.',
          ['On réceptionne avec réserves, les quarante-six chambres ouvrent à la rentrée, et les deux autres dès la reprise', 'Deux chambres en défaut n’empêchent pas d’ouvrir les autres : la réserve fixe le délai de reprise.'],
          [['On ouvre les quarante-huit, les deux étudiants se débrouilleront', 'Loger quelqu’un dans une chambre en défaut, c’est lui faire subir le problème.'], ['On repousse toute l’ouverture d’un mois', 'Quarante-six étudiants sans logement pour deux chambres : disproportionné.']]),
      ],
    },
    {
      id: 'bilan-residence', lieu: 'entreprise', titre: 'Ce que la préfabrication a apporté', resume: 'Chiffrer le délai gagné, garder les leçons, répondre à la Régie des eaux.',
      recit: 'La résidence a ouvert à la date de la rentrée. Mesurons ce que la préfabrication nous a fait gagner, avant de répondre à une demande qui va nous faire grimper : un château d’eau.',
      avancee: 'La résidence rejoint nos références : la préfabrication fait désormais partie de nos méthodes.',
      taches: [
        mesure('gain-delai', 'finances', 'Le délai gagné', {
          enonce: 'Chaque semaine de chantier coûte des frais fixes : encadrement, base vie, grue, gardiennage.',
          donnees: [['Semaines gagnées par la préfabrication', String(SEMAINES_GAGNEES)], ['Frais de chantier par semaine', `${fr(FRAIS_SEMAINE, 1)} M FCFA`]],
          question: 'Frais de chantier économisés, en millions de FCFA ?', unite: 'M FCFA', reponse: SEMAINES_GAGNEES * FRAIS_SEMAINE, tolerance: .05,
          explication: `${SEMAINES_GAGNEES} × ${fr(FRAIS_SEMAINE, 1)} = ${fr(SEMAINES_GAGNEES * FRAIS_SEMAINE, 1)} M FCFA économisés, sans compter l’essentiel : des étudiants logés à la rentrée.`,
        }),
        selection('lecons-prefa', 'salle-reunion', 'Les leçons de la préfabrication',
          'Le retour d’expérience prépare le prochain chantier préfabriqué.', 'Coche ce qu’il faut garder.', [
            ['Décider la préfabrication dès l’offre, et commander tôt à l’usine', true, 'Le délai de l’usine conditionne tout le planning.'],
            ['Contrôler le béton de l’usine comme celui du chantier', true, 'Le lot douteux a été arrêté à temps.'],
            ['Refuser tout élément abîmé à la livraison', true, 'La prédalle fissurée n’a jamais été posée.'],
            ['Remettre une maquette d’exploitation utile', true, 'Le service technique de l’université s’en sert déjà.'],
            ['Supprimer les contrôles pour aller encore plus vite', false, 'Ce sont eux qui ont évité les erreurs coûteuses.'],
            ['Préfabriquer même les fondations sur ce terrain', false, 'Les fondations se coulent en place, adaptées au sol.'],
          ]),
        situation('chateau-eau', 'direction', 'Un château d’eau',
          'La Régie des eaux veut un château d’eau pour les Jardins de l’Ouest : un réservoir de 500 m³ perché à 25 mètres. Joseph te demande si BTP Life doit y aller.',
          ['On y va, en préparant le travail en grande hauteur et en s’appuyant sur un spécialiste du coffrage grimpant', 'Un ouvrage nouveau pour l’entreprise se prépare : méthode, sécurité, et partenaires qui savent faire ce qu’on n’a jamais fait.'],
          [['On y va comme pour un immeuble', 'Un fût de 25 mètres ne se coffre pas comme un étage : c’est une autre méthode.'], ['On refuse : on n’en a jamais fait', 'Chaque ouvrage a été une première : on se prépare, on s’entoure, et on grandit.']]),
      ],
    },
  ],
};
