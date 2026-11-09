// Le troisième dossier du fil rouge : le Groupe scolaire des Palmiers, une école publique de six classes en plein
// centre, gagnée par le groupement BTP Life et Bâti-Express (né à la fin des Rôniers). Marché public sans corruption,
// plateforme à recompacter, ordre de service et pénalités, accessibilité et évacuation, murs en agglos, sécurité d'un
// chantier commun près des enfants, réception en commission, partage du résultat. Sans Three.js ni React.
import { mesure, selection, situation, type DefinitionDossier } from './chapitres-campagne';
import { fr } from './programme-lieu';

// Les chiffres de l'école, repris d'un chapitre à l'autre.
const DEBOURSE = 150, MAJORATIONS = [1.08, 1.10, 1.06];
const PRIX = MAJORATIONS.reduce((p, m) => p * m, DEBOURSE);         // ≈ 188,89 M FCFA HT
const PROCTOR = 1.95, EN_PLACE = 1.8;                                // t/m³ : 92,3 % pour 95 % exigés
const RETARD = 20;                                                   // jours
const NIVEAU_ENTREE = .4, PENTE_MAX = .05;                           // rampe de 8 m
const ELEVES_ETAGE = 3 * 40, ADULTES_ETAGE = 4;                      // 124 personnes : 2 unités de passage
const MURS = 640, OUVERTURES = 160, AGGLOS_M2 = 12.5;                // 6 300 agglos, casse comprise
const PLANCHER = 160, MAILLE = 1.2;                                  // 112 étais
const CLASSE = 7 * 7;                                                // 49 m² : 8,2 m² de fenêtres
const COUT_REEL = 171.2, PART_BTP = .6;                              // ≈ 10,62 M FCFA pour BTP Life

export const DOSSIER_ECOLE: DefinitionDossier = {
  id: 'groupe-scolaire', nom: 'Groupe scolaire des Palmiers', ouvrage: 'R+1 · 6 classes et un préau', client: 'la mairie',
  parcelle: { slug: 'parcelle-ecole', x: -24, z: -39, largeur: 24, profondeur: 12 }, nomParcelle: 'Terrain de l’école',
  accueil: { nom: 'M. Kanga', role: 'Directeur des services techniques de la mairie', horaires: { ouverture: 8, fermeture: 16 } },
  livraison: 7, hauteurVue: 6,
  stades: ['Terrain réservé', 'Marché attribué', 'Plateforme contrôlée', 'Ordre de service affiché', 'Fondations coulées', 'Gros œuvre en élévation', 'Prêt pour la réception', 'École ouverte', 'Référence de l’entreprise'],
  bareme: { argent: { chapitre: 5_000, livraison: 50_000, cloture: 18_000 }, xpBase: 50, xpPrime: { livraison: 260, cloture: 130 }, reputation: { chapitre: 4, livraison: 25, cloture: 12 } },
  cloture: 'Les élèves ont fait leur rentrée au Groupe scolaire des Palmiers, et le groupement s’est soldé en bons termes. La mairie lance maintenant un centre de santé.',
  chapitres: [
    {
      id: 'marche-ecole', lieu: 'entreprise', titre: 'L’appel d’offres de la mairie', resume: 'Chiffrer une offre publique en groupement, sans rien céder à la corruption.',
      recit: 'La mairie lance l’appel d’offres du Groupe scolaire des Palmiers : six classes et un préau, en plein centre. Avec Bâti-Express, on répond en groupement, et c’est nous le mandataire. Un marché public se gagne sur dossier, au centime près.',
      avancee: 'Le groupement remporte le marché : le panneau du projet est planté sur le terrain de l’école.',
      taches: [
        mesure('prix-ecole', 'finances', 'Le prix de l’offre', {
          enonce: 'Le déboursé sec est majoré, l’un après l’autre, des frais de chantier, des frais généraux, puis du bénéfice et des aléas.',
          donnees: [['Déboursé sec', `${DEBOURSE} M FCFA`], ['Frais de chantier', '+ 8 %'], ['Frais généraux', '+ 10 %'], ['Bénéfice et aléas', '+ 6 %']],
          question: 'Prix de l’offre hors taxes, en millions de FCFA ?', unite: 'M FCFA', reponse: PRIX, tolerance: .1,
          explication: `${DEBOURSE} × 1,08 = 162 ; × 1,10 = 178,2 ; × 1,06 ≈ ${fr(PRIX, 2)} M FCFA. Les majorations se multiplient : les additionner (24 %) donnerait 186 M, et l’offre serait fausse.`,
        }),
        selection('dossier-candidature', 'bureaux', 'Le dossier de candidature',
          'Le dossier d’appel d’offres (DAO) fixe les pièces à fournir : une pièce manquante, et l’offre est écartée sans être lue.', 'Coche ce que le dossier doit contenir.', [
            ['La convention de groupement, signée des deux entreprises', true, 'Elle désigne BTP Life comme mandataire, qui parle au nom du groupement.'],
            ['Les attestations fiscales et sociales à jour', true, 'Une administration ne signe pas avec une entreprise en dette d’impôts ou de cotisations.'],
            ['La caution de soumission demandée par le DAO', true, 'Elle garantit que le groupement signera s’il est retenu.'],
            ['Les références de travaux semblables : Akwaba et les Rôniers', true, 'Des chantiers livrés prouvent que le groupement sait faire.'],
            ['Le bordereau des prix et le devis estimatif, signés', true, 'Ils fixent le prix proposé, poste par poste.'],
            ['Une lettre d’un conseiller municipal qui recommande l’entreprise', false, 'Une recommandation politique n’a rien à faire dans une offre : seul le dossier compte.'],
            ['Les photos de l’équipe dirigeante', false, 'Le DAO ne les demande pas : elles n’ajoutent rien à l’offre.'],
          ]),
        situation('enveloppe', 'direction', 'Un coup de pouce ?',
          'Un agent de la mairie propose de « faire passer » l’offre du groupement en tête de la commission, contre une enveloppe.',
          ['Je refuse net, et je le signale à la direction', 'Une offre se gagne sur dossier. Payer pour être favorisé, c’est de la corruption : l’entreprise risque l’exclusion des marchés publics, et ses dirigeants des poursuites.'],
          [['J’accepte : tout le monde le fait', 'Ce n’est pas une excuse : la corruption fausse la concurrence, et peut coûter le marché, l’entreprise et la liberté.'], ['Je fais semblant d’accepter, puis je ne paie pas', 'On ne joue pas avec ce genre de proposition : on la refuse clairement, et on la signale.']]),
      ],
    },
    {
      id: 'terrain-ecole', lieu: 'laboratoire', titre: 'Le terrain de l’école', resume: 'Contrôler le compactage de la plateforme avant de fonder.',
      recit: 'Le terrain de l’école est un ancien terrain de jeux, remblayé il y a des années. Avant de fonder, on contrôle la plateforme couche par couche : un remblai mal compacté tasse sous les bâtiments.',
      avancee: 'Plateforme contrôlée : les points d’essai sont piquetés sur le terrain.',
      taches: [
        mesure('compactage', 'paillasse', 'Le taux de compactage', {
          enonce: 'L’essai Proctor donne la densité sèche maximale du remblai ; on la compare à celle mesurée en place.',
          donnees: [['Densité sèche maximale (Proctor)', `${fr(PROCTOR, 2)} t/m³`], ['Densité sèche en place', `${fr(EN_PLACE, 2)} t/m³`], ['Exigence du marché', 'au moins 95 %']],
          question: 'Taux de compactage, en % ?', unite: '%', reponse: EN_PLACE / PROCTOR * 100, tolerance: .3,
          explication: `${fr(EN_PLACE, 2)} ÷ ${fr(PROCTOR, 2)} ≈ ${fr(EN_PLACE / PROCTOR, 3)}, soit ${fr(EN_PLACE / PROCTOR * 100, 1)} % : moins que les 95 % exigés. Le remblai doit être recompacté.`,
        }),
        situation('recompacter', 'accueil', '92 %, ça passe ?',
          'Le chef d’équipe trouve que 92 %, c’est presque 95 %. Il veut commencer les fondations dès demain.',
          ['On recompacte par couches de 30 cm, à la bonne teneur en eau, et on refait l’essai avant de fonder', 'Un remblai trop peu compacté tasse sous la charge : les dallages fissurent, les murs bougent. On reprend, puis on mesure de nouveau.'],
          [['On commence : la différence est faible', 'Trois points de moins, c’est un sol plus mou partout : les tassements viendront après la livraison.'], ['On arrose bien le terrain et on attend', 'L’eau seule ne compacte rien : il faut le rouleau, couche par couche.']]),
        selection('essais-plateforme', 'bureau', 'Les essais de la plateforme',
          'Pour accepter la plateforme avant les fondations, le laboratoire choisit ses essais.', 'Coche les essais utiles.', [
            ['L’essai Proctor du remblai', true, 'Il donne la densité de référence.'],
            ['La densité en place, au gammadensimètre', true, 'Elle dit si le compactage atteint l’exigence.'],
            ['La teneur en eau du remblai', true, 'Trop sec ou trop humide, un sol se compacte mal.'],
            ['L’essai de chargement à la plaque', true, 'Il mesure la portance de la plateforme.'],
            ['Le cône d’Abrams', false, 'C’est un essai du béton frais, pas du sol.'],
            ['L’écrasement d’éprouvettes de béton', false, 'Encore un essai du béton : il viendra au moment du coulage.'],
          ]),
      ],
    },
    {
      id: 'ordre-service-ecole', lieu: 'mairie', titre: 'L’ordre de service', resume: 'Démarrer à l’ordre de service, afficher le chantier public, discuter d’un délai.',
      recit: 'Pour un équipement public, l’ordre de service fixe le premier jour du délai. Le marché prévoit des pénalités si l’école n’est pas livrée à temps : voyons ce qu’elles représentent, et ce que le panneau du chantier doit annoncer.',
      avancee: 'Ordre de service notifié : la palissade ferme le terrain, le panneau du chantier public est affiché.',
      taches: [
        mesure('penalites-ecole', 'table', 'Les pénalités de retard', {
          enonce: 'Le marché prévoit un millième du montant par jour de retard, plafonné à 5 % du marché.',
          donnees: [['Montant du marché', `${fr(PRIX, 2)} M FCFA HT`], ['Pénalité par jour', '1/1 000 du marché'], ['Retard envisagé', `${RETARD} jours`]],
          question: `Pénalités pour ${RETARD} jours de retard, en millions de FCFA ?`, unite: 'M FCFA', reponse: PRIX / 1000 * RETARD, tolerance: .02,
          explication: `${fr(PRIX, 2)} ÷ 1 000 ≈ ${fr(PRIX / 1000, 3)} M par jour ; × ${RETARD} ≈ ${fr(PRIX / 1000 * RETARD, 2)} M FCFA, sous le plafond de ${fr(PRIX * .05, 2)} M (5 %). De quoi effacer une bonne part de la marge : le planning se tient dès le premier jour.`,
        }),
        selection('panneau-public', 'affichage', 'Le panneau du chantier public',
          'Sur un chantier public, le panneau dit aux habitants ce qui se construit avec leur argent.', 'Coche ce qu’il doit annoncer.', [
            ['Le maître d’ouvrage : la mairie', true, 'Chacun sait qui commande l’ouvrage.'],
            ['Le titulaire : le groupement BTP Life et Bâti-Express', true, 'Chacun sait qui construit, et à qui s’adresser.'],
            ['Le montant du marché et son financement', true, 'L’argent public se montre : chacun sait ce que coûte l’école.'],
            ['Le délai d’exécution', true, 'Le quartier sait quand l’école ouvrira.'],
            ['Les noms et les salaires des ouvriers', false, 'Des données personnelles, sans rapport avec l’ouvrage.'],
            ['Les prix unitaires du bordereau', false, 'Le détail des prix reste dans le marché ; le panneau annonce le montant total.'],
          ]),
        situation('avant-rentree', 'guichet', 'Avant la rentrée ?',
          'Le maire voudrait l’école pour la rentrée, deux mois avant la date prévue au marché.',
          ['Je propose de livrer le rez-de-chaussée pour la rentrée et l’étage ensuite, par avenant', 'Un phasage étudié et écrit dans un avenant répond au besoin, sans sacrifier la sécurité ni la qualité.'],
          [['J’accepte la nouvelle date sans rien changer', 'Promettre deux mois de moins sans moyens en plus, ce sont des pénalités assurées et des finitions bâclées.'], ['Je refuse : le marché est le marché', 'Un marché peut évoluer par avenant : on cherche d’abord une solution avec le client.']]),
      ],
    },
    {
      id: 'ecole-pour-tous', lieu: 'bureau-etudes', titre: 'Une école pour tous', resume: 'Dessiner une rampe accessible, un escalier d’évacuation et des classes ventilées.',
      recit: 'Une école reçoit des enfants, des parents et des enseignants, dont certains en fauteuil roulant. Les plans d’exécution doivent le prévoir : l’accès, l’évacuation en cas d’incendie, et des classes où l’on respire.',
      avancee: 'Plans d’exécution validés : les fondations de l’école sont coulées.',
      taches: [
        mesure('rampe', 'calcul', 'La rampe d’accès', {
          enonce: `L’entrée de l’école est ${fr(NIVEAU_ENTREE * 100)} cm au-dessus de la cour. Le programme limite la pente des rampes à 5 %.`,
          donnees: [['Différence de niveau', `${fr(NIVEAU_ENTREE, 2)} m`], ['Pente maximale', '5 %']],
          question: 'Longueur minimale de la rampe, en mètres ?', unite: 'm', reponse: NIVEAU_ENTREE / PENTE_MAX, tolerance: .05,
          explication: `${fr(NIVEAU_ENTREE, 2)} ÷ 0,05 = ${fr(NIVEAU_ENTREE / PENTE_MAX)} m de rampe, avec des mains courantes et un palier en haut. Plus raide, un fauteuil roulant ne la monte pas seul.`,
        }),
        mesure('unites-passage', 'bureau', 'L’escalier d’évacuation', {
          enonce: 'Le règlement de sécurité retenu demande une unité de passage par tranche de 100 personnes à évacuer par l’escalier.',
          donnees: [['Élèves à l’étage', `3 classes de 40`], ['Adultes à l’étage', String(ADULTES_ETAGE)], ['Une unité de passage', 'pour 100 personnes, entamées']],
          question: 'Nombre d’unités de passage de l’escalier ?', unite: 'unités', reponse: Math.ceil((ELEVES_ETAGE + ADULTES_ETAGE) / 100), tolerance: 0,
          explication: `3 × 40 + ${ADULTES_ETAGE} = ${ELEVES_ETAGE + ADULTES_ETAGE} personnes à l’étage : il faut ${Math.ceil((ELEVES_ETAGE + ADULTES_ETAGE) / 100)} unités de passage. On arrondit toujours au-dessus : 101 personnes en demandent déjà deux.`,
        }),
        situation('ventilation-ecole', 'maquette', 'Climatiser les classes ?',
          'Le maire propose de climatiser les six classes, fenêtres fixes, « pour le confort des élèves ».',
          ['Je propose une ventilation naturelle traversante : grandes ouvertures face à face, brise-soleil et débords de toit', 'Sous notre climat, l’air qui traverse la classe et l’ombre des brise-soleil rafraîchissent sans facture ; la climatisation coûterait chaque mois, et une panne rendrait les classes invivables.'],
          [['Des fenêtres fixes et la climatisation partout', 'Fenêtres fixes : à la moindre coupure de courant, la classe devient une étuve.'], ['De petites fenêtres, pour garder la fraîcheur', 'Sans air qui circule, la chaleur s’accumule : les élèves ne suivent plus.']]),
      ],
    },
    {
      id: 'murs-ecole', lieu: 'fournisseur', titre: 'Les murs de l’école', resume: 'Compter les agglos, contrôler la livraison, livrer sans danger près des écoles.',
      recit: 'Poteaux et planchers en béton armé, murs en agglos de 15 : on compte au plus juste, on contrôle ce qui arrive, et on livre sans mettre en danger les élèves du quartier.',
      avancee: 'Agglos et ciment livrés : le gros œuvre de l’école monte, avec sa grue.',
      taches: [
        mesure('agglos-ecole', 'comptoir', 'Les agglos des murs', {
          enonce: 'On compte la surface des murs moins les ouvertures, puis on ajoute la casse.',
          donnees: [['Surface des murs', `${MURS} m²`], ['Portes et fenêtres', `${OUVERTURES} m²`], ['Agglos de 15 par m²', fr(AGGLOS_M2, 1)], ['Casse prévue', '5 %']],
          question: 'Agglos à commander ?', unite: 'agglos', reponse: (MURS - OUVERTURES) * AGGLOS_M2 * 1.05, tolerance: 10,
          explication: `${MURS} − ${OUVERTURES} = ${MURS - OUVERTURES} m² ; × ${fr(AGGLOS_M2, 1)} = ${fr((MURS - OUVERTURES) * AGGLOS_M2)} agglos ; + 5 % de casse = ${fr((MURS - OUVERTURES) * AGGLOS_M2 * 1.05)} agglos.`,
        }),
        selection('controle-agglos', 'reception', 'La livraison d’agglos',
          'Le camion de l’usine décharge les premières palettes.', 'Coche ce que tu contrôles.', [
            ['Les dimensions et l’épaisseur des parois', true, 'Un agglo de 15 trop mince ne porte pas ce que le calcul prévoit.'],
            ['Des blocs bien secs, qui ne s’effritent pas sous l’ongle', true, 'Un bloc trop frais, ou trop pauvre en ciment, s’effrite : il ne tiendra pas.'],
            ['Les angles et les arêtes, sans casse', true, 'Des blocs ébréchés font des murs fragiles et des joints trop épais.'],
            ['La quantité, comparée au bon de livraison', true, 'On signe ce qu’on a reçu, pas ce qu’on a commandé.'],
            ['La couleur, la plus blanche possible', false, 'La couleur ne dit rien de la résistance.'],
            ['Le prix payé par le voisin pour ses agglos', false, 'Sans rapport avec la qualité de cette livraison.'],
          ]),
        situation('sortie-ecoles', 'chargement', 'La livraison de 11 h 30',
          'Le camion d’agglos doit arriver à 11 h 30, à l’heure où les élèves du collège voisin sortent.',
          ['Je décale la livraison hors des heures d’entrée et de sortie, avec un homme trafic pour guider le camion', 'Un camion qui manœuvre au milieu des enfants, c’est le risque d’un accident grave : on choisit l’heure, et on guide la manœuvre.'],
          [['Le chauffeur fera attention', 'En marche arrière, un chauffeur ne voit pas un enfant derrière son camion.'], ['On fait passer le camion par le trottoir, pour aller plus vite', 'Le trottoir appartient aux piétons, surtout à l’heure de la sortie.']]),
      ],
    },
    {
      id: 'securite-groupement', lieu: 'construction-nord', titre: 'La sécurité en groupement', resume: 'Une seule organisation de sécurité pour deux entreprises, et des enfants à protéger.',
      recit: 'Deux entreprises, deux habitudes : sur ce chantier, les équipes de Bâti-Express et les nôtres suivent les mêmes règles. Et l’école est en plein quartier : les enfants passent devant tous les jours.',
      avancee: 'Gros œuvre et finitions achevés : l’école attend sa réception.',
      taches: [
        situation('deux-regles', 'bureau', 'Deux entreprises, deux règles',
          'Au bord de la dalle de l’étage, les ouvriers de Bâti-Express travaillent sans protection ; ceux de BTP Life portent un harnais.',
          ['Un seul plan de sécurité pour tout le chantier, et le travail s’arrête tant que le bord n’est pas protégé par un garde-corps', 'Sur un chantier commun, la sécurité est commune : le mandataire coordonne, et un bord de dalle se protège d’abord par un garde-corps.'],
          [['Chaque entreprise gère ses ouvriers', 'Une chute sur le chantier engage tout le groupement, et le maître d’ouvrage.'], ['On leur prête quelques harnais', 'Un harnais sans point d’ancrage ni formation ne protège personne ; le garde-corps passe avant.']]),
        mesure('etais-ecole', 'echafaudage', 'Les étais du plancher', {
          enonce: 'Le plancher de l’étage est coulé sur un coffrage tenu par des étais, posés en quadrillage.',
          donnees: [['Surface du plancher', `${PLANCHER} m²`], ['Maille d’étaiement', `${fr(MAILLE, 2)} × ${fr(MAILLE, 2)} m`]],
          question: 'Nombre minimal d’étais ?', unite: 'étais', reponse: Math.ceil(PLANCHER / (MAILLE * MAILLE)), tolerance: 0,
          explication: `${fr(MAILLE, 2)} × ${fr(MAILLE, 2)} = ${fr(MAILLE * MAILLE, 2)} m² par étai ; ${PLANCHER} ÷ ${fr(MAILLE * MAILLE, 2)} ≈ ${fr(PLANCHER / (MAILLE * MAILLE), 1)} : ${Math.ceil(PLANCHER / (MAILLE * MAILLE))} étais au moins. On ne les retire qu’une fois le béton assez résistant, sur l’avis du bureau d’études.`,
        }),
        selection('enfants-chantier', 'accueil', 'Des enfants à côté',
          'Les élèves du quartier longent la palissade matin et soir.', 'Coche les mesures à prendre.', [
            ['Une palissade pleine, et un portail fermé hors des livraisons', true, 'Rien ne doit attirer ni laisser passer un enfant curieux.'],
            ['Aucune manœuvre d’engin aux heures d’entrée et de sortie', true, 'C’est le moment où les trottoirs sont pleins.'],
            ['Les fouilles et les trémies protégées, même dans l’enceinte', true, 'Un enfant qui se faufile ne doit pas pouvoir tomber.'],
            ['Les stocks loin de la palissade', true, 'Sinon, on s’en sert pour grimper.'],
            ['Le portail ouvert, pour aérer le chantier', false, 'Un portail ouvert invite les curieux, et d’abord les enfants.'],
            ['Les ferrailles posées contre la palissade, côté rue', false, 'Elles servent d’échelle et dépassent : on les range à l’écart.'],
          ]),
      ],
    },
    {
      id: 'reception-ecole', lieu: 'parcelle-ecole', titre: 'La réception de l’école', resume: 'Réceptionner en commission, vérifier la lumière, régler une fuite avant la rentrée.',
      recit: 'La commission de réception est là : la mairie, le maître d’œuvre, le bureau de contrôle, et vous, le groupement. Les élèves arrivent dans trois jours : faisons le tour, classe par classe.',
      avancee: 'École réceptionnée : les élèves font leur rentrée au Groupe scolaire des Palmiers.',
      taches: [
        selection('commission', 'parcelle', 'La commission de réception',
          'Pour un équipement public, la réception se fait en commission : chacun signe pour ce qui le concerne.', 'Coche qui doit y être.', [
            ['Le maître d’ouvrage : la mairie', true, 'C’est lui qui reçoit l’école.'],
            ['Le maître d’œuvre, qui a suivi les travaux', true, 'Il propose la réception, avec ou sans réserves.'],
            ['Le bureau de contrôle, pour la solidité et la sécurité', true, 'Il dit si l’école peut recevoir des élèves.'],
            ['BTP Life, mandataire du groupement', true, 'Il parle et signe au nom des deux entreprises.'],
            ['Les parents d’élèves', false, 'Ils découvriront l’école à la rentrée : la réception est un acte entre la mairie et le groupement.'],
            ['Bâti-Express seul, sans le mandataire', false, 'Le groupement s’exprime par son mandataire.'],
          ]),
        mesure('lumiere-classe', 'parcelle', 'La lumière des classes', {
          enonce: 'Le programme demande des fenêtres d’au moins un sixième de la surface de chaque classe.',
          donnees: [['Classe', '7 × 7 m'], ['Surface vitrée minimale', 'un sixième de la surface au sol']],
          question: 'Surface vitrée minimale d’une classe, en m² ?', unite: 'm²', reponse: CLASSE / 6, tolerance: .1,
          explication: `7 × 7 = ${CLASSE} m² ; ${CLASSE} ÷ 6 ≈ ${fr(CLASSE / 6, 1)} m² de fenêtres par classe, réparties pour éclairer tous les pupitres.`,
        }),
        situation('fuite-classe', 'parcelle', 'Une fuite à trois jours de la rentrée',
          'Une tache d’eau s’étend au plafond d’une classe de l’étage : la descente d’eau pluviale fuit. La rentrée est dans trois jours.',
          ['On réceptionne avec une réserve, on répare la descente tout de suite, et la classe reste fermée jusqu’à la reprise', 'La réserve oblige le groupement à réparer ; la réception permet aux autres classes d’ouvrir à la date prévue.'],
          [['On repeint le plafond avant la visite', 'Cacher un défaut ne le répare pas : la fuite reviendra à la première pluie.'], ['On refuse la réception jusqu’à la saison sèche', 'Un défaut localisé et réparable n’empêche pas la réception : on le note en réserve.']]),
      ],
    },
    {
      id: 'bilan-ecole', lieu: 'entreprise', titre: 'Le bilan du groupement', resume: 'Partager le résultat, garder les bonnes pratiques, choisir le prochain marché.',
      recit: 'L’école est livrée, les élèves sont là. Reste à partager le résultat avec Bâti-Express, à garder ce qui a marché, et à regarder le prochain appel d’offres de la mairie : un centre de santé.',
      avancee: 'Groupement soldé : le Groupe scolaire des Palmiers rejoint nos références.',
      taches: [
        mesure('part-resultat', 'finances', 'La part de BTP Life', {
          enonce: 'Le résultat du groupement se partage selon la convention : 60 % pour BTP Life, 40 % pour Bâti-Express.',
          donnees: [['Prix du marché', `${fr(PRIX, 2)} M FCFA HT`], ['Coût réel des travaux', `${fr(COUT_REEL, 1)} M FCFA`], ['Part de BTP Life', '60 %']],
          question: 'Part du résultat revenant à BTP Life, en millions de FCFA ?', unite: 'M FCFA', reponse: (PRIX - COUT_REEL) * PART_BTP, tolerance: .05,
          explication: `${fr(PRIX, 2)} − ${fr(COUT_REEL, 1)} ≈ ${fr(PRIX - COUT_REEL, 2)} M FCFA de résultat ; × 60 % ≈ ${fr((PRIX - COUT_REEL) * PART_BTP, 2)} M FCFA pour BTP Life, le reste pour Bâti-Express.`,
        }),
        selection('lecons-groupement', 'salle-reunion', 'Ce que le groupement nous a appris',
          'Avant de ranger le dossier, on écrit ce qui servira au prochain groupement.', 'Coche les leçons à garder.', [
            ['Un seul mandataire face à la mairie : aucune consigne contradictoire', true, 'Le client avait un seul interlocuteur.'],
            ['Un plan de sécurité commun, présenté à chaque nouvel arrivant', true, 'Les deux équipes ont fini par travailler comme une seule.'],
            ['Le phasage de la rentrée, négocié par avenant', true, 'Le besoin du client a été tenu sans sacrifier la sécurité.'],
            ['Les essais de compactage avant de fonder', true, 'La plateforme reprise a évité des tassements.'],
            ['Faire porter les retards à Bâti-Express', false, 'Un groupement réussit ou échoue ensemble : on cherche des causes, pas un coupable.'],
            ['Ne plus jamais répondre en groupement', false, 'Le groupement a permis de gagner un marché trop gros pour nous seuls.'],
          ]),
        situation('centre-sante', 'direction', 'Le centre de santé',
          'La mairie lance l’appel d’offres d’un centre de santé. Serge voudrait reconduire le groupement ; tes équipes sont libres, et l’ouvrage est à notre taille.',
          ['On répond seuls, parce que l’ouvrage est à notre taille, et on le dit franchement à Serge, qui reste un partenaire', 'Chaque marché se décide sur ses besoins : un groupement partage aussi la marge, et une relation de confiance se garde en se parlant franchement.'],
          [['On reconduit le groupement, par habitude', 'Un groupement se justifie quand l’ouvrage dépasse nos moyens ; ici, il ne ferait que partager la marge.'], ['On répond seuls sans rien dire à Serge', 'Un partenaire se prévient : la confiance d’hier compte pour les marchés de demain.']]),
      ],
    },
  ],
};
