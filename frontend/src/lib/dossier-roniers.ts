// Le deuxième dossier du fil rouge : la Résidence Les Rôniers, un R+5 de dix logements et deux commerces pour Daouda
// Touré, le frère de Mme Touré. Il devait bâtir à Cocody ; faute de titre sûr là-bas, sa parcelle est aux Jardins de
// l'Ouest, contre les Résidences des Jardins. Sol mou et pieux, voisins, vente sur plans, maquette numérique, grue à
// tour, planchers à hourdis, façades en hauteur, réception, puis la révision des prix (la leçon d'Akwaba) et un
// groupement avec Bâti-Express. Mêmes chiffres d'un chapitre à l'autre : les 840 m² de plancher font le COS du permis,
// la charge des pieux et l'étage refusé. Sans Three.js ni React.
import { situation, type ChapitreCampagne } from './chapitres-campagne';
import { fr } from './programme-lieu';

export const RONIERS = { id: 'residence-roniers', nom: 'Résidence Les Rôniers', ouvrage: 'R+5 · 10 logements et 2 commerces', client: 'M. Touré' } as const;
/** La parcelle, aux Jardins de l'Ouest : entre les Résidences des Jardins (à l'ouest) et l'avenue nord-sud (à l'est), son
 * portail au sud. Clôturée, on n'y marche pas. */
export const PARCELLE_RONIERS = { slug: 'parcelle-roniers', x: -70.5, z: -35, largeur: 18, profondeur: 13 } as const;
/** Daouda Touré reçoit sur sa parcelle aux heures de chantier. */
export const CLIENT_RONIERS = { nom: 'M. Touré', role: 'Client, frère de Mme Touré', horaires: { ouverture: 8, fermeture: 17 } } as const;

// Les chiffres du R+5, repris d'un chapitre à l'autre.
const COUT_AKWABA = 128.4, SURFACE_AKWABA = 432;                 // le coût réel et la surface de plancher d'Akwaba
const EMPRISE = 140, NIVEAUX = 6, SURFACE = EMPRISE * NIVEAUX;   // 14 × 10 m, rez-de-chaussée et cinq étages : 840 m²
const ESTIMATION = COUT_AKWABA / SURFACE_AKWABA * SURFACE;       // ≈ 249,7 M FCFA
const PARCELLE_M2 = PARCELLE_RONIERS.largeur * PARCELLE_RONIERS.profondeur, COS_MAX = 3.6; // 234 m², COS ≈ 3,59
const CHARGE_M2 = 12, PLANCHERS = 6, CHARGE_TOTALE = PLANCHERS * EMPRISE * CHARGE_M2;    // 10 080 kN
const PORTANCE_PIEU = 450, PIEUX = 24, CADENCE_FORAGE = 3;
const SABLE = 11.5, ANCRAGE = 2.5, PLATEFORME = .5;             // un pieu de 13,5 m
const PRIX_APPARTEMENT = 48, PART_HORS_EAU = .2 + .15 + .35;    // 70 % appelés à la mise hors d'eau
const CHARGE_30M = 1950, BENNE = 400, BETON = 2400;              // courbe de charge de la grue, benne et béton
const BASE_REVISION = 40, I0 = 112, I = 121;
const REVISE = BASE_REVISION * (.15 + .85 * I / I0);              // ≈ 42,73 M FCFA

export const CHAPITRES_RONIERS: ChapitreCampagne[] = [
  {
    id: 'offre-r5', lieu: 'entreprise', titre: 'L’offre du R+5', resume: 'Estimer l’immeuble, sécuriser le marché, proposer une variante.',
    recit: 'Daouda Touré, le frère de Mme Touré, nous consulte pour son immeuble. Il visait Cocody, mais la parcelle qu’on lui proposait là-bas n’avait qu’une attestation villageoise, et un litige en cours : il a acheté un terrain titré aux Jardins de l’Ouest, contre les Résidences des Jardins. Il veut un R+5, deux commerces au rez-de-chaussée et dix logements au-dessus. Bâti-Express est encore sur les rangs : cette fois, on chiffre avec ce qu’Akwaba nous a appris.',
    avancee: 'Offre retenue : le panneau du projet est planté sur la parcelle des Jardins.',
    taches: [
      { id: 'estimation-r5', zone: 'finances', titre: 'Estimation au mètre carré', contenu: { type: 'mesure', mesure: {
        titre: 'Estimation au mètre carré', enonce: 'Avant le métré détaillé, on estime le déboursé du R+5 à partir du coût réel d’Akwaba, ramené au mètre carré de plancher.',
        donnees: [{ libelle: 'Coût réel d’Akwaba', valeur: `${fr(COUT_AKWABA, 1)} M FCFA` }, { libelle: 'Surface de plancher d’Akwaba', valeur: `${SURFACE_AKWABA} m²` }, { libelle: 'Surface de plancher du R+5', valeur: `${SURFACE} m²` }],
        question: 'Déboursé estimé du R+5, en millions de FCFA ?', unite: 'M FCFA', reponse: ESTIMATION, tolerance: .5,
        explication: `${fr(COUT_AKWABA, 1)} ÷ ${SURFACE_AKWABA} ≈ ${fr(COUT_AKWABA / SURFACE_AKWABA, 3)} M FCFA par m² ; × ${SURFACE} m² ≈ ${fr(ESTIMATION, 1)} M FCFA. Une première estimation, que le métré détaillé affinera : les pieux et l’ascenseur du R+5 coûteront plus qu’à Akwaba.` } } },
      { id: 'clauses-marche', zone: 'bureaux', titre: 'Les clauses du marché', contenu: { type: 'selection', selection: {
        titre: 'Les clauses du marché', enonce: 'Le marché du R+5 sera signé avec Daouda Touré. Cette fois, il doit protéger les deux parties dès la première ligne.', consigne: 'Coche ce que le marché doit prévoir.',
        options: [
          { texte: 'Une formule de révision des prix pour le ciment et l’acier', attendu: true, explication: 'La leçon d’Akwaba : la hausse du ciment y a mangé plus d’un cinquième de la marge.' },
          { texte: 'Le délai d’exécution, et des pénalités de retard plafonnées', attendu: true, explication: 'Le client est protégé d’un retard, l’entreprise d’une pénalité sans fin.' },
          { texte: 'Les travaux supplémentaires seulement sur avenant signé', attendu: true, explication: 'Comme la clôture d’Akwaba : rien ne se construit en plus sans un écrit qui en fixe le prix.' },
          { texte: 'Les assurances : tous risques chantier et décennale', attendu: true, explication: 'Un sinistre pendant les travaux, ou dans les dix ans qui suivent, est couvert.' },
          { texte: 'La retenue de garantie et sa date de restitution', attendu: true, explication: 'Elle garantit la levée des réserves, puis revient à l’entreprise.' },
          { texte: 'L’interdiction pour le client de visiter son chantier', attendu: false, explication: 'Le maître d’ouvrage a le droit de suivre ses travaux, en respectant les consignes de sécurité.' },
          { texte: 'L’engagement de ne jamais rien facturer en plus, quoi qu’il demande', attendu: false, explication: 'Une demande nouvelle se chiffre et se signe par avenant ; sinon, l’entreprise paie les idées du client.' },
        ] } } },
      situation('variante-r5', 'direction', 'Moins cher que Bâti-Express ?',
        'Daouda trouve notre prix élevé : Bâti-Express annonce 10 % de moins. Il te demande si l’on peut faire un effort.',
        ['Je propose une variante chiffrée à part, des planchers à hourdis au lieu de dalles pleines, étudiée par le bureau d’études', 'Une variante se présente à côté de l’offre de base, avec son étude et son prix : le client compare en connaissance de cause, et la solidité reste calculée.'],
        [['Je retire l’ascenseur du devis sans le dire', 'L’offre ne répondrait plus à sa demande : c’est tromper le client, et le litige est assuré à la livraison.'], ['Je m’aligne sur Bâti-Express, on se rattrapera sur les avenants', 'Gagner en comptant sur les avenants, c’est préparer un conflit avec le client dès la signature.']]),
    ],
  },
  {
    id: 'sol-jardins', lieu: 'laboratoire', titre: 'Le sol des Jardins', resume: 'Reconnaître un sol mou et justifier des fondations profondes.',
    recit: 'Les Jardins de l’Ouest sont bâtis sur un ancien bas-fond : avant d’y poser un R+5, il faut savoir ce qu’il y a dessous. Ma sondeuse est descendue à quinze mètres sur la parcelle de M. Touré. Regardons ensemble ce qu’elle a remonté.',
    avancee: 'Étude de sol rendue : la sondeuse a percé la parcelle jusqu’à quinze mètres.',
    taches: [
      { id: 'teneur-eau', zone: 'paillasse', titre: 'Teneur en eau de l’argile', contenu: { type: 'mesure', mesure: {
        titre: 'Teneur en eau de l’argile', enonce: 'Un échantillon d’argile prélevé à 4 m est pesé, séché à l’étuve à 105 °C, puis pesé de nouveau.',
        donnees: [{ libelle: 'Masse humide', valeur: '182 g' }, { libelle: 'Masse sèche', valeur: '130 g' }],
        question: 'Teneur en eau, en % de la masse sèche ?', unite: '%', reponse: (182 - 130) / 130 * 100, tolerance: .5,
        explication: `(182 − 130) ÷ 130 = 0,40, soit 40 % : une argile molle, gorgée d’eau, qui tasserait sous des semelles. Le sol porteur, un sable compact, n’apparaît qu’à ${fr(SABLE, 1)} m.` } } },
      { id: 'essais-sol', zone: 'bureau', titre: 'Ce que l’étude doit dire', contenu: { type: 'selection', selection: {
        titre: 'Ce que l’étude doit dire', enonce: 'Pour un R+5 sur un ancien bas-fond, le rapport doit aller bien plus loin qu’à Akwaba.', consigne: 'Coche ce que l’étude doit fournir.',
        options: [
          { texte: 'Des sondages jusqu’au sol porteur, sous l’argile', attendu: true, explication: `On cherche la couche qui portera l’immeuble : ici, un sable compact à ${fr(SABLE, 1)} m.` },
          { texte: 'Des essais pressiométriques, mètre par mètre', attendu: true, explication: 'Ils mesurent comment chaque couche résiste et se déforme : l’ingénieure en a besoin pour calculer les pieux.' },
          { texte: 'Un piézomètre, pour suivre la nappe d’une saison à l’autre', attendu: true, explication: 'L’eau est haute aux Jardins : il faut savoir où elle est en saison des pluies.' },
          { texte: 'L’analyse chimique de l’eau du sol', attendu: true, explication: 'Une eau chargée en sulfates attaque le béton enterré : le ciment des pieux se choisit en conséquence.' },
          { texte: 'Un seul sondage à 2 m, comme pour une maison', attendu: false, explication: 'Deux mètres ne disent rien d’un sol porteur à onze mètres.' },
          { texte: 'L’écrasement des éprouvettes de béton', attendu: false, explication: 'C’est un essai du béton, pas du sol : il viendra pendant le chantier.' },
        ] } } },
      situation('semelles-ou-pieux', 'accueil', 'Des semelles, comme à Akwaba ?',
        'M. Touré a vu les semelles d’Akwaba. Il demande pourquoi on ne ferait pas pareil chez lui : ce serait plus rapide, et moins cher.',
        ['Je lui explique que l’argile molle ne peut pas porter le R+5 : des pieux iront chercher le sable compact', 'Sur dix mètres d’argile molle, des semelles tasseraient, et pas partout de la même façon : l’immeuble fissurerait. Les pieux descendent la charge jusqu’au sol porteur.'],
        [['On fera des semelles plus grandes, ça suffira', 'De grandes semelles chargent toujours la même argile molle : elle tassera quand même, de façon inégale.'], ['On compactera le terrain au rouleau avant de couler', 'Un rouleau compacte quelques dizaines de centimètres, pas dix mètres d’argile gorgée d’eau.']]),
    ],
  },
  {
    id: 'pieux', lieu: 'bureau-etudes', titre: 'Les pieux', resume: 'Compter les pieux, les dimensionner, ménager les voisins.',
    recit: 'Avec le rapport d’Adjoua, je peux fonder le R+5 : douze poteaux, et sous chacun, des pieux forés jusqu’au sable compact. Vérifions mon calcul ensemble, de la charge de l’immeuble à la longueur d’un pieu.',
    avancee: 'Plans des fondations prêts : les vingt-quatre pieux sont piquetés sur la parcelle.',
    taches: [
      { id: 'nombre-pieux', zone: 'calcul', titre: 'Nombre de pieux', contenu: { type: 'mesure', mesure: {
        titre: 'Nombre de pieux', enonce: 'Les pieux portent toute la charge des planchers ; aucun ne doit dépasser sa charge admissible.',
        donnees: [{ libelle: 'Planchers portés', valeur: `${PLANCHERS} (cinq étages et la terrasse)` }, { libelle: 'Surface d’un plancher', valeur: `${EMPRISE} m²` }, { libelle: 'Charge par m² (G + Q)', valeur: `${CHARGE_M2} kN/m²` }, { libelle: 'Charge admissible d’un pieu', valeur: `${PORTANCE_PIEU} kN` }],
        question: 'Nombre minimal de pieux ?', unite: 'pieux', reponse: Math.ceil(CHARGE_TOTALE / PORTANCE_PIEU), tolerance: 0,
        explication: `${PLANCHERS} × ${EMPRISE} × ${CHARGE_M2} = ${fr(CHARGE_TOTALE)} kN à porter ; ${fr(CHARGE_TOTALE)} ÷ ${PORTANCE_PIEU} = ${fr(CHARGE_TOTALE / PORTANCE_PIEU, 1)}, et l’on arrondit toujours au-dessus : ${Math.ceil(CHARGE_TOTALE / PORTANCE_PIEU)} pieux au moins. Le plan en retient ${PIEUX}, deux sous chacun des douze poteaux.` } } },
      { id: 'longueur-pieu', zone: 'bureau', titre: 'Longueur d’un pieu', contenu: { type: 'mesure', mesure: {
        titre: 'Longueur d’un pieu', enonce: 'Chaque pieu est foré depuis la plateforme de travail jusqu’au sable compact, dans lequel il s’ancre.',
        donnees: [{ libelle: 'Toit du sable compact', valeur: `${fr(SABLE, 1)} m sous le terrain naturel` }, { libelle: 'Ancrage dans le sable', valeur: `${fr(ANCRAGE, 1)} m` }, { libelle: 'Plateforme de forage', valeur: `${fr(PLATEFORME, 1)} m sous le terrain naturel` }],
        question: 'Longueur d’un pieu, en mètres ?', unite: 'm', reponse: SABLE + ANCRAGE - PLATEFORME, tolerance: .05,
        explication: `Le pieu descend jusqu’à ${fr(SABLE, 1)} + ${fr(ANCRAGE, 1)} = ${fr(SABLE + ANCRAGE)} m sous le terrain ; il part de la plateforme, à ${fr(PLATEFORME, 1)} m : ${fr(SABLE + ANCRAGE)} − ${fr(PLATEFORME, 1)} = ${fr(SABLE + ANCRAGE - PLATEFORME, 1)} m. C’est son ancrage dans le sable compact qui lui donne l’essentiel de sa portance.` } } },
      situation('pieux-fores', 'maquette', 'Battus ou forés ?',
        'La maison des Kouamé, aux Résidences des Jardins, est à quatre mètres de la limite. Des pieux battus coûteraient moins cher que des pieux forés.',
        ['Je retiens des pieux forés : ni chocs ni vibrations sous les maisons voisines', 'Battre un pieu, c’est l’enfoncer à coups de mouton : les vibrations peuvent fissurer les maisons proches. Le forage évite ce risque, pour un coût un peu plus élevé.'],
        [['Des pieux battus, en prévenant les voisins', 'Prévenir n’empêche pas les vibrations : les fissures arriveraient quand même.'], ['Des pieux battus, la nuit, quand la rue est calme', 'La nuit, le battage réveillerait tout le quartier, et les vibrations seraient les mêmes.']]),
    ],
  },
  {
    id: 'permis-r5', lieu: 'mairie', titre: 'Le permis du R+5', resume: 'Vérifier le foncier et le COS, recevoir un voisin inquiet.',
    recit: 'Un R+5 contre les Résidences des Jardins : le dossier sera lu de près, par nos services comme par les voisins. Vérifions le terrain et ce qu’il permet de bâtir avant le dépôt.',
    avancee: 'Permis accordé : la palissade ferme le chantier, le panneau du permis est affiché.',
    taches: [
      { id: 'foncier-r5', zone: 'domaines', titre: 'Le foncier de la parcelle', contenu: { type: 'selection', selection: {
        titre: 'Le foncier de la parcelle', enonce: 'À Cocody, M. Touré a failli acheter une parcelle sans titre. Ici, on vérifie tout avant le dépôt.', consigne: 'Coche ce qu’il faut vérifier.',
        options: [
          { texte: 'L’ACD ou le titre foncier, au nom de Daouda Touré', attendu: true, explication: 'Seul un titre définitif protège le propriétaire, et la banque qui lui prêtera.' },
          { texte: 'L’absence de litige ou d’opposition sur la parcelle', attendu: true, explication: 'Un litige peut arrêter un chantier en plein gros œuvre : c’est ce qui a fait renoncer à Cocody.' },
          { texte: 'Le bornage, conforme aux limites réelles', attendu: true, explication: 'On bâtit sur sa parcelle, pas sur celle des Résidences.' },
          { texte: 'Le règlement de la zone : hauteur, reculs et COS', attendu: true, explication: 'Il dit ce que la parcelle permet de construire.' },
          { texte: 'Une attestation villageoise, à la place du titre', attendu: false, explication: 'Elle ne suffit pas : seul un titre définitif protège l’acheteur. C’était le piège de la parcelle de Cocody.' },
          { texte: 'L’accord oral du gardien des Résidences', attendu: false, explication: 'Courtois, mais sans aucune valeur pour le permis.' },
        ] } } },
      { id: 'cos-r5', zone: 'urbanisme', titre: 'Coefficient d’occupation du sol', contenu: { type: 'mesure', mesure: {
        titre: 'Coefficient d’occupation du sol', enonce: `Le COS rapporte la surface de plancher à la surface de la parcelle. Le règlement de la zone le limite à ${fr(COS_MAX, 1)}.`,
        donnees: [{ libelle: 'Surface de la parcelle', valeur: `${PARCELLE_M2} m² (${PARCELLE_RONIERS.largeur} × ${PARCELLE_RONIERS.profondeur} m)` }, { libelle: 'Surface de plancher', valeur: `${SURFACE} m² (six niveaux de ${EMPRISE} m²)` }, { libelle: 'COS maximal de la zone', valeur: fr(COS_MAX, 1) }],
        question: 'COS du projet ?', unite: '', reponse: SURFACE / PARCELLE_M2, tolerance: .01,
        explication: `${SURFACE} ÷ ${PARCELLE_M2} ≈ ${fr(SURFACE / PARCELLE_M2, 2)} : sous le maximum de ${fr(COS_MAX, 1)}, le projet est conforme. Mais il ne reste plus la place d’un niveau de plus : retiens-le.` } } },
      situation('voisin-soleil', 'affichage', 'Le soleil de M. Diallo',
        'M. Diallo, qui habite aux Résidences des Jardins, a lu le projet affiché : un R+5 lui prendra son soleil du matin. Il vient à la mairie, furieux.',
        ['Je le reçois, je lui montre que le projet respecte le règlement, et je lui présente les engagements du chantier', 'Un projet conforme peut être bâti, mais un voisin écouté devient rarement un adversaire : horaires, propreté, et un contact sur le chantier.'],
        [['Je lui réponds que ce n’est pas son affaire', 'Un voisin méprisé peut contester le permis, et le chantier commence dans un climat de conflit.'], ['Je lui promets qu’on retirera un étage', 'Une promesse impossible sans l’accord du client et un nouveau permis : elle se retournerait contre nous.']]),
    ],
  },
  {
    id: 'voisins', lieu: 'jardins-residence', titre: 'Les voisins du chantier', resume: 'Constater l’existant, annoncer les nuisances, tenir les horaires.',
    recit: 'Bonjour ! Le chantier de M. Touré commence juste à côté de nos résidences. Les habitants ont des questions, et certains murs ont déjà leurs fissures : faisons les choses dans l’ordre avant le premier coup de foreuse.',
    avancee: 'Constat signé avec les voisins : la base vie s’installe, en bons termes avec les Résidences.',
    taches: [
      { id: 'constat-kouame', zone: 'kouame', titre: 'Le constat chez les Kouamé', contenu: { type: 'selection', selection: {
        titre: 'Le constat chez les Kouamé', enonce: 'Leur maison est la plus proche du chantier. Le constat avant travaux décrit son état avant le premier coup de foreuse.', consigne: 'Coche ce que le constat doit contenir.',
        options: [
          { texte: 'Les fissures existantes, photographiées et mesurées', attendu: true, explication: 'Si une fissure s’ouvre pendant les travaux, on saura ce qui était là avant.' },
          { texte: 'L’état du mur de clôture mitoyen', attendu: true, explication: 'C’est le plus exposé au chantier.' },
          { texte: 'L’état des regards et des canalisations partagés', attendu: true, explication: 'Un camion lourd peut les écraser : on note leur état de départ.' },
          { texte: 'La date, et la signature des Kouamé et de l’entreprise', attendu: true, explication: 'Un constat daté et signé fait foi pour tout le monde ; dressé par un huissier, il pèse encore plus.' },
          { texte: 'La valeur de la maison sur le marché', attendu: false, explication: 'Le constat décrit un état ; il n’estime pas un prix.' },
          { texte: 'La liste des meubles des Kouamé', attendu: false, explication: 'Hors sujet : seul le bâti compte.' },
        ] } } },
      { id: 'duree-forage', zone: 'akissi', titre: 'Combien de jours de bruit ?', contenu: { type: 'mesure', mesure: {
        titre: 'Combien de jours de bruit ?', enonce: 'Mlle Akissi travaille chez elle. Elle demande combien de jours durera le forage des pieux, la phase la plus bruyante.',
        donnees: [{ libelle: 'Pieux à forer', valeur: String(PIEUX) }, { libelle: 'Cadence de la foreuse', valeur: `${CADENCE_FORAGE} pieux par jour` }],
        question: 'Durée du forage, en jours ?', unite: 'jours', reponse: PIEUX / CADENCE_FORAGE, tolerance: 0,
        explication: `${PIEUX} ÷ ${CADENCE_FORAGE} = ${PIEUX / CADENCE_FORAGE} jours de forage. On les annonce aux voisins par affichage, avec les horaires : un bruit annoncé et limité se supporte mieux qu’une surprise.` } } },
      situation('beton-5h', 'diallo', 'Couler à 5 h du matin ?',
        'Pour éviter les embouteillages, le chef de chantier voudrait couler les planchers à 5 h du matin. M. Diallo dort encore à cette heure-là, et l’affichage annonce un chantier de 7 h à 18 h.',
        ['Je tiens les horaires annoncés, et j’organise les toupies en conséquence, à partir de 7 h', 'Les horaires sont un engagement envers les voisins : on adapte la logistique (commande la veille, itinéraire, créneau de la centrale), pas leur sommeil.'],
        [['On coule à 5 h : le béton n’attend pas', 'Le béton n’attend pas, mais il se commande : un coulage à 5 h est une nuisance qu’on peut éviter.'], ['On coule à 5 h, et on offre un cadeau à M. Diallo', 'Un cadeau n’achète pas le sommeil de toute la rue : les horaires annoncés restent les horaires.']]),
    ],
  },
  {
    id: 'vente-plans', lieu: 'banque', titre: 'La vente sur plans', resume: 'Appeler les fonds des acquéreurs, monter le prêt, refuser un étage de trop.',
    recit: 'M. Touré finance son immeuble en vendant les appartements sur plans, avant qu’ils soient bâtis ; notre banque prête le reste. L’argent des acquéreurs doit être protégé, et appelé au rythme du chantier.',
    avancee: 'Financement bouclé : la foreuse perce les vingt-quatre pieux.',
    taches: [
      { id: 'appel-fonds', zone: 'conseiller', titre: 'Les appels de fonds', contenu: { type: 'mesure', mesure: {
        titre: 'Les appels de fonds', enonce: 'Chaque acquéreur paie son appartement par étapes, à mesure que l’immeuble avance.',
        donnees: [{ libelle: 'Prix d’un appartement', valeur: `${PRIX_APPARTEMENT} M FCFA` }, { libelle: 'Échéancier', valeur: '20 % à la signature, 15 % aux fondations, 35 % à la mise hors d’eau, 25 % à l’achèvement, 5 % à la remise des clés' }],
        question: 'Total versé par un acquéreur à la mise hors d’eau, en millions de FCFA ?', unite: 'M FCFA', reponse: PRIX_APPARTEMENT * PART_HORS_EAU, tolerance: .05,
        explication: `20 + 15 + 35 = 70 % ; ${PRIX_APPARTEMENT} × 70 % = ${fr(PRIX_APPARTEMENT * PART_HORS_EAU, 1)} M FCFA. Chaque appel suit une étape réellement atteinte, constatée sur le chantier.` } } },
      { id: 'pret-promoteur', zone: 'guichet', titre: 'Le prêt de M. Touré', contenu: { type: 'selection', selection: {
        titre: 'Le prêt de M. Touré', enonce: 'Les ventes couvrent une partie du coût : la banque prête le reste, sur dossier.', consigne: 'Coche ce que le dossier de prêt doit contenir.',
        options: [
          { texte: 'Le permis de construire accordé', attendu: true, explication: 'Sans permis, pas d’immeuble, donc pas de prêt.' },
          { texte: 'Le titre de la parcelle, qui servira de garantie', attendu: true, explication: 'La banque prend une hypothèque sur le terrain et l’immeuble à venir.' },
          { texte: 'Le bilan prévisionnel de l’opération : coûts, ventes, marge', attendu: true, explication: 'Il montre que l’opération peut rembourser le prêt.' },
          { texte: 'Les contrats de réservation déjà signés', attendu: true, explication: 'Des ventes acquises rassurent la banque.' },
          { texte: 'Un compte dédié à l’opération, où arrivent les paiements des acquéreurs', attendu: true, explication: 'L’argent des acquéreurs paie leur immeuble, et rien d’autre : à part, il se contrôle.' },
          { texte: 'Les plans de décoration des appartements témoins', attendu: false, explication: 'Utiles pour vendre, inutiles pour financer.' },
          { texte: 'Une lettre de Serge Ahoussou promettant de faire moins cher', attendu: false, explication: 'Une offre concurrente écartée n’a rien à faire dans un dossier de prêt.' },
        ] } } },
      situation('etage-de-plus', 'accueil', 'Un étage de plus ?',
        'Les ventes marchent bien. M. Touré voudrait ajouter un sixième étage, deux appartements de plus à vendre, pour rembourser plus vite. Il te demande ton avis devant la conseillère.',
        [`Je lui explique que c’est impossible en l’état : le COS est déjà à ${fr(SURFACE / PARCELLE_M2, 2)} pour ${fr(COS_MAX, 1)}, et les pieux sont calculés pour six planchers`, 'Un étage de plus dépasserait le COS de la zone : pas de permis. Et il faudrait recalculer les fondations, peut-être les refaire. Mieux vaut vendre au bon prix les appartements prévus.'],
        [['On l’ajoute, et on régularisera le permis après', 'Bâtir hors permis expose à l’arrêt du chantier, aux amendes, et jusqu’à la démolition.'], ['On l’ajoute : les pieux ont bien un peu de marge', 'Les pieux sont calculés pour la charge de six planchers : un septième se recalcule. Et le COS l’interdit de toute façon.']]),
    ],
  },
  {
    id: 'maquette', lieu: 'atelier', titre: 'La maquette numérique', resume: 'Assembler tous les plans, résoudre un conflit, vérifier un métré.',
    recit: 'Structure, plomberie, électricité, ascenseur : pour un R+5, on assemble tous les plans dans une seule maquette numérique avant de bâtir. Ici, une erreur coûte un clic ; sur le chantier, des jours.',
    avancee: 'Synthèse validée : les longrines sont coulées sur les pieux, la grue est montée.',
    taches: [
      situation('gaine-poutre', 'grand-ecran', 'Une gaine dans une poutre',
        'La détection des conflits s’allume en rouge : une gaine de ventilation traverse une poutre du plancher du R+2.',
        ['Je signale le conflit à l’ingénieure et au plombier : on déplace la gaine, ou on prévoit une réservation calculée', 'Une poutre ne se perce pas au hasard : c’est l’ingénieure structure qui dit où et comment la traverser.'],
        [['On percera la poutre sur le chantier, ce sera vite fait', 'Percer une poutre, c’est risquer de couper ses aciers : sa résistance n’est plus celle du calcul.'], ['On ignore l’alerte, les ouvriers s’arrangeront', 'Le conflit reviendra sur le chantier, plus cher et plus dangereux.']]),
      { id: 'metre-poteaux', zone: 'postes', titre: 'Le métré des poteaux', contenu: { type: 'mesure', mesure: {
        titre: 'Le métré des poteaux', enonce: 'La maquette sort les quantités toute seule ; tu vérifies celle du béton des poteaux d’un niveau.',
        donnees: [{ libelle: 'Poteaux par niveau', valeur: '12' }, { libelle: 'Section', valeur: '0,30 × 0,30 m' }, { libelle: 'Hauteur sous poutre', valeur: '2,80 m' }],
        question: 'Volume de béton des poteaux d’un niveau, en m³ ?', unite: 'm³', reponse: 12 * .3 * .3 * 2.8, tolerance: .02,
        explication: '0,30 × 0,30 = 0,09 m² ; × 2,80 = 0,252 m³ par poteau ; × 12 = 3,02 m³. La maquette le calcule, mais savoir le vérifier évite de payer une erreur de saisie.' } } },
      { id: 'synthese', zone: 'imprimante', titre: 'Qui valide la synthèse ?', contenu: { type: 'selection', selection: {
        titre: 'Qui valide la synthèse ?', enonce: 'La maquette du R+5 sort de l’imprimante 3D pour M. Touré. Avant de la lui montrer, chaque corps d’état doit avoir validé la synthèse.', consigne: 'Coche qui doit la valider.',
        options: [
          { texte: 'L’ingénieure structure, pour les réservations dans les poutres et les dalles', attendu: true, explication: 'Elle seule peut dire où la structure se traverse.' },
          { texte: 'Le plombier et l’électricien, pour le passage des réseaux', attendu: true, explication: 'Leurs gaines et canalisations doivent trouver leur place sans conflit.' },
          { texte: 'L’ascensoriste, pour la gaine et la fosse de l’ascenseur', attendu: true, explication: 'Ses dimensions se tiennent au centimètre.' },
          { texte: 'Le conducteur de travaux, pour l’ordre du chantier', attendu: true, explication: 'Il vérifie que la maquette se construit dans l’ordre prévu.' },
          { texte: 'Les futurs acquéreurs', attendu: false, explication: 'Ils choisiront leurs finitions plus tard ; les réseaux ne les concernent pas.' },
          { texte: 'Serge, de Bâti-Express', attendu: false, explication: 'Un concurrent n’a pas accès à nos plans.' },
        ] } } },
    ],
  },
  {
    id: 'grue', lieu: 'logistique', titre: 'La grue et le vent', resume: 'Lire la courbe de charge, planifier l’installation, arrêter la grue à temps.',
    recit: 'Une grue à tour pour le R+5, au cœur des Jardins : ses limites se lisent sur la courbe de charge, et sur l’anémomètre. On prépare ici les levages et le plan du chantier.',
    avancee: 'Levages organisés : le gros œuvre monte, niveau par niveau.',
    taches: [
      { id: 'benne-grue', zone: 'quai', titre: 'Remplir la benne', contenu: { type: 'mesure', mesure: {
        titre: 'Remplir la benne', enonce: 'Le poteau à couler est à 30 m du mât. La courbe de charge de la grue donne la masse maximale qu’elle peut lever à cette portée.',
        donnees: [{ libelle: 'Charge admissible à 30 m', valeur: `${fr(CHARGE_30M)} kg` }, { libelle: 'Benne vide', valeur: `${BENNE} kg` }, { libelle: 'Masse volumique du béton', valeur: `${fr(BETON)} kg/m³` }],
        question: 'Volume maximal de béton dans la benne, en m³ ?', unite: 'm³', reponse: (CHARGE_30M - BENNE) / BETON, tolerance: .01,
        explication: `(${fr(CHARGE_30M)} − ${BENNE}) ÷ ${fr(BETON)} ≈ ${fr((CHARGE_30M - BENNE) / BETON, 2)} m³. La benne de 1 m³ ne se remplit donc pas au-delà des deux tiers à cette portée : le grutier lit la courbe de charge avant chaque levage.` } } },
      situation('rafales', 'dispatch', 'Rafales sur les Jardins',
        'Un orage approche : l’anémomètre de la grue affiche des rafales à 80 km/h. La notice impose l’arrêt des levages au-delà de 72 km/h, et une benne de béton attend au sol.',
        ['J’arrête les levages, et je fais mettre la grue en girouette, flèche libre de tourner au vent', 'Au-delà de la limite de la notice, la grue ne lève plus. En girouette, la flèche s’oriente d’elle-même dans le vent, sans forcer sur le mât.'],
        [['On monte cette dernière benne, vite', 'Une charge qui se balance dans les rafales peut heurter l’immeuble ou un ouvrier, et la grue peut basculer.'], ['On bloque la rotation de la flèche pour qu’elle ne bouge plus', 'Bloquée, la flèche prend le vent de travers : c’est ainsi que des grues se renversent.']]),
      { id: 'installation-chantier', zone: 'rayonnages', titre: 'Le plan d’installation', contenu: { type: 'selection', selection: {
        titre: 'Le plan d’installation', enonce: 'La parcelle est petite, et entourée de voisins. Le plan d’installation dit où tout se trouve, avant le premier levage.', consigne: 'Coche ce qui doit y figurer.',
        options: [
          { texte: 'L’aire balayée par la grue, sans charge au-dessus des maisons voisines', attendu: true, explication: 'Une charge ne passe jamais au-dessus des voisins ni de la rue : la grue est bridée en conséquence.' },
          { texte: 'Les zones de stockage, à portée de la grue', attendu: true, explication: 'On lève depuis le stock, sans manutention inutile.' },
          { texte: 'L’accès des toupies et des camions, sans bloquer l’avenue', attendu: true, explication: 'Les livraisons ne doivent pas paralyser le quartier.' },
          { texte: 'La base vie et les sanitaires des ouvriers', attendu: true, explication: 'Indispensables, même sur une petite parcelle.' },
          { texte: 'Un parking pour les acquéreurs', attendu: false, explication: 'Ils viendront visiter, accompagnés ; le chantier n’est pas un parking.' },
          { texte: 'Le stockage des aciers sur le trottoir de l’avenue', attendu: false, explication: 'La voie publique n’est pas un dépôt : les passants doivent pouvoir circuler en sécurité.' },
        ] } } },
    ],
  },
  {
    id: 'planchers', lieu: 'fournisseur', titre: 'Les planchers à hourdis', resume: 'Commander les hourdis, réceptionner les aciers, valider un changement de poutrelles.',
    recit: 'Six planchers à hourdis pour le R+5 : poutrelles, hourdis, treillis et béton de la dalle de compression. On commande juste ce qu’il faut, et on contrôle ce qui arrive.',
    avancee: 'Planchers livrés et coulés : la structure atteint la terrasse, l’échafaudage habille la façade.',
    taches: [
      { id: 'hourdis', zone: 'comptoir', titre: 'Hourdis d’un plancher', contenu: { type: 'mesure', mesure: {
        titre: 'Hourdis d’un plancher', enonce: 'Les hourdis se posent entre les poutrelles, partout sauf dans les trémies. On en commande un peu plus, pour la casse.',
        donnees: [{ libelle: 'Surface d’un plancher', valeur: `${EMPRISE} m²` }, { libelle: 'Trémies (escalier et ascenseur)', valeur: '12 m²' }, { libelle: 'Hourdis par m²', valeur: '8' }, { libelle: 'Casse prévue', valeur: '5 %' }],
        question: 'Hourdis à commander pour un plancher ?', unite: 'hourdis', reponse: Math.ceil((EMPRISE - 12) * 8 * 1.05), tolerance: 2,
        explication: `${EMPRISE} − 12 = 128 m² ; × 8 = ${fr(1024)} hourdis ; + 5 % de casse = ${fr(1075.2, 1)}, soit ${fr(1076)} hourdis. On commande plancher par plancher, au rythme du chantier.` } } },
      { id: 'livraison-aciers', zone: 'reception', titre: 'La livraison d’aciers', contenu: { type: 'selection', selection: {
        titre: 'La livraison d’aciers', enonce: 'Un camion livre les aciers des planchers. Le chauffeur est pressé.', consigne: 'Coche ce que tu fais à la réception.',
        options: [
          { texte: 'Comparer les diamètres et les longueurs à la commande', attendu: true, explication: 'On paie ce qu’on a commandé, et le ferrailleur travaille d’après les plans.' },
          { texte: 'Lire la nuance de l’acier sur le certificat du fabricant', attendu: true, explication: 'La résistance de l’acier fait partie du calcul de l’ingénieure.' },
          { texte: 'Vérifier les barres : pas de rouille qui s’écaille', attendu: true, explication: 'Une fine rouille de surface est sans gravité ; une rouille qui s’écaille ronge l’acier.' },
          { texte: 'Écrire sur le bon les manques et les défauts', attendu: true, explication: 'Une réserve écrite permet de réclamer ; sans elle, la livraison est acceptée telle quelle.' },
          { texte: 'Signer le bon d’abord, pour libérer le camion, et vérifier ensuite', attendu: false, explication: 'Une fois le bon signé sans réserve, il n’y a plus rien à réclamer.' },
          { texte: 'Accepter des barres plus fines, puisqu’elles sont moins chères', attendu: false, explication: 'Un diamètre plus petit, c’est moins d’acier que le calcul : on refuse.' },
        ] } } },
      situation('poutrelles', 'stock', 'Plus de poutrelles',
        'Le fabricant habituel est en rupture de poutrelles. Brou en propose d’une autre marque, disponibles tout de suite, mais prévues pour des portées plus courtes.',
        ['Je fais valider le nouveau modèle par l’ingénieure, portées et charges en main, avant de commander', 'Une poutrelle se choisit pour sa portée et sa charge : en changer sans l’avis de l’ingénieure, c’est jouer avec la solidité du plancher.'],
        [['Je les prends : une poutrelle est une poutrelle', 'Chaque modèle a sa portée maximale : trop courte, la poutrelle fléchit, voire casse.'], ['J’attends le fabricant habituel, sans prévenir personne', 'Le planning glisse en silence : on prévient le conducteur de travaux, et on cherche une solution validée.']]),
    ],
  },
  {
    id: 'facades', lieu: 'construction-nord', titre: 'Les façades en hauteur', resume: 'Ancrer l’échafaudage, organiser la coactivité, monter en sécurité.',
    recit: 'Six niveaux de façade, des maçons, des électriciens et des peintres qui se croisent : sur le R+5, le danger vient de la hauteur et de la coactivité. On revoit ici les règles, avant d’y monter.',
    avancee: 'Façades et finitions achevées : l’immeuble attend sa réception.',
    taches: [
      { id: 'ancrages', zone: 'echafaudage', titre: 'Les ancrages de l’échafaudage', contenu: { type: 'mesure', mesure: {
        titre: 'Les ancrages de l’échafaudage', enonce: 'L’échafaudage couvre toute la façade sud. Sa notice impose un nombre minimal d’ancrages dans le mur.',
        donnees: [{ libelle: 'Longueur de la façade', valeur: '14 m' }, { libelle: 'Hauteur de l’échafaudage', valeur: '19 m' }, { libelle: 'Notice', valeur: 'un ancrage pour 12 m² de façade' }],
        question: 'Nombre minimal d’ancrages ?', unite: 'ancrages', reponse: Math.ceil(14 * 19 / 12), tolerance: 0,
        explication: `14 × 19 = 266 m² ; ÷ 12 ≈ ${fr(266 / 12, 1)}, et l’on arrondit au-dessus : ${Math.ceil(266 / 12)} ancrages au moins, répartis sur toute la façade. Sans eux, un échafaudage de 19 m peut basculer au premier coup de vent.` } } },
      situation('sous-la-charge', 'grue', 'Sous la charge',
        'L’électricien veut tirer ses câbles au pied de la façade, juste sous la trajectoire de la grue, pendant que les maçons montent des palettes d’agglos.',
        ['Je réunis les entreprises : on fixe des zones et des horaires, pour que personne ne travaille sous la charge', 'La coactivité se planifie : un plan commun, des zones balisées, des créneaux. Personne sous une charge en mouvement.'],
        [['Il porte un casque, ça suffit', 'Un casque n’arrête pas une palette d’agglos tombée de vingt mètres.'], ['Chacun fait attention de son côté', 'Chacun ne voit que son travail : sans organisation commune, l’accident arrive entre deux équipes.']]),
      { id: 'avant-de-monter', zone: 'accueil', titre: 'Avant de monter', contenu: { type: 'selection', selection: {
        titre: 'Avant de monter', enonce: 'Les peintres arrivent pour la façade du R+5.', consigne: 'Coche ce qui doit être vérifié avant de monter sur l’échafaudage.',
        options: [
          { texte: 'L’échafaudage a été réceptionné par une personne compétente', attendu: true, explication: 'Monté selon la notice, vérifié avant usage, puis régulièrement.' },
          { texte: 'Planchers complets et garde-corps à chaque niveau', attendu: true, explication: 'Pas de vide où poser le pied, pas de bord sans protection.' },
          { texte: 'L’accès par un escalier ou une échelle intégrée', attendu: true, explication: 'On ne grimpe jamais par les montants.' },
          { texte: 'Les ancrages en place, tels que calculés', attendu: true, explication: 'Ils tiennent l’échafaudage contre le vent.' },
          { texte: 'Un garde-corps retiré pour passer les pots de peinture', attendu: false, explication: 'Un garde-corps retiré, c’est un bord ouvert sur le vide : les charges montent autrement.' },
          { texte: 'Le nombre de pots de peinture commandés', attendu: false, explication: 'Une question de commande, pas de sécurité.' },
        ] } } },
    ],
  },
  {
    id: 'reception-r5', lieu: PARCELLE_RONIERS.slug, titre: 'La réception du R+5', resume: 'Essayer la terrasse, noter les réserves, livrer dans le bon ordre.',
    recit: 'Mon immeuble est fini ! Les acquéreurs attendent leurs clés, et les commerçants veulent ouvrir. Faisons le tour ensemble, terrasse comprise, avant de signer le procès-verbal.',
    avancee: 'Réception prononcée : la Résidence Les Rôniers est livrée, et ses commerces ouvrent.',
    taches: [
      { id: 'mise-en-eau', zone: 'parcelle', titre: 'L’essai de la terrasse', contenu: { type: 'mesure', mesure: {
        titre: 'L’essai de la terrasse', enonce: 'Avant de signer, on vérifie l’étanchéité de la toiture-terrasse : ses évacuations bouchées, on la met en eau pendant 48 heures.',
        donnees: [{ libelle: 'Surface de la terrasse', valeur: `${EMPRISE} m²` }, { libelle: 'Hauteur d’eau', valeur: '5 cm' }],
        question: 'Volume d’eau pour la mise en eau, en m³ ?', unite: 'm³', reponse: EMPRISE * .05, tolerance: .1,
        explication: `${EMPRISE} × 0,05 = ${fr(EMPRISE * .05)} m³ d’eau, soit ${fr(EMPRISE * .05)} tonnes, que la dalle porte sans peine. Si aucune trace n’apparaît au plafond du dernier étage après 48 heures, l’étanchéité est bonne.` } } },
      { id: 'reserves-r5', zone: 'parcelle', titre: 'Les réserves du R+5', contenu: { type: 'selection', selection: {
        titre: 'Les réserves du R+5', enonce: 'Pendant la visite, tu notes ce qui n’est pas conforme au marché.', consigne: 'Coche ce qui doit être inscrit en réserve.',
        options: [
          { texte: 'L’ascenseur s’arrête 3 cm au-dessus du palier du R+4', attendu: true, explication: 'Un défaut de réglage, et de quoi trébucher : l’ascensoriste le reprend.' },
          { texte: 'Une descente d’eau pluviale non raccordée', attendu: true, explication: 'L’eau de la terrasse coulerait le long de la façade.' },
          { texte: 'Le garde-corps d’un balcon du R+3, qui bouge à la main', attendu: true, explication: 'Un danger de chute : à reprendre avant que quiconque s’installe.' },
          { texte: 'La vitrine d’un commerce, rayée', attendu: true, explication: 'Un défaut visible, noté avant l’arrivée du commerçant.' },
          { texte: 'La couleur du hall, que M. Touré trouve finalement trop claire', attendu: false, explication: 'C’était son choix, validé au marché : ce n’est pas un défaut.' },
          { texte: 'Les climatiseurs que les acquéreurs poseront eux-mêmes', attendu: false, explication: 'Ils ne font pas partie du marché.' },
        ] } } },
      situation('cles-acquereurs', 'parcelle', 'Les clés avant la signature ?',
        'Les acquéreurs pressent M. Touré : il voudrait leur remettre les clés dès aujourd’hui, et signer le procès-verbal plus tard.',
        ['D’abord la réception avec l’entreprise, puis la livraison à chaque acquéreur, avec ses propres réserves', 'La réception fait passer l’immeuble de l’entreprise à M. Touré ; ensuite seulement, il livre chaque appartement. Inverser l’ordre brouille tout : qui aurait rayé la vitrine ?'],
        [['On remet les clés tout de suite, la réception attendra', 'Si un acquéreur abîme quelque chose avant la réception, personne ne saura qui doit réparer.'], ['On attend que tout soit parfait, même si ça prend des mois', 'Des réserves mineures n’empêchent pas la réception : on les note, et on les lève dans un délai fixé.']]),
    ],
  },
  {
    id: 'bilan-r5', lieu: 'entreprise', titre: 'Le bilan et le groupement', resume: 'Mesurer ce que la révision des prix a sauvé, et répondre à Bâti-Express.',
    recit: 'La Résidence Les Rôniers est livrée, et la clause de révision a protégé notre marge. Mais j’ai une visite surprise : Serge Ahoussou, de Bâti-Express. Il veut répondre avec nous à l’appel d’offres d’un groupe scolaire, trop gros pour une seule entreprise.',
    avancee: 'L’immeuble rejoint nos références, et Bâti-Express devient partenaire.',
    taches: [
      { id: 'revision-prix', zone: 'finances', titre: 'La révision des prix', contenu: { type: 'mesure', mesure: {
        titre: 'La révision des prix', enonce: 'Le ciment et l’acier ont augmenté pendant le gros œuvre. Cette fois, le marché prévoit une formule de révision, appliquée à chaque situation de travaux ; sa partie fixe, 15 %, ne bouge pas.',
        donnees: [{ libelle: 'Situation n° 5, aux prix de l’offre', valeur: `${BASE_REVISION} M FCFA HT` }, { libelle: 'Formule', valeur: 'P = P0 × (0,15 + 0,85 × I / I0)' }, { libelle: 'Indice à l’offre (I0)', valeur: String(I0) }, { libelle: 'Indice du mois (I)', valeur: String(I) }],
        question: 'Montant révisé de la situation, en millions de FCFA ?', unite: 'M FCFA', reponse: REVISE, tolerance: .05,
        explication: `${I} ÷ ${I0} ≈ ${fr(I / I0, 3)} ; 0,15 + 0,85 × ${fr(I / I0, 3)} ≈ ${fr(.15 + .85 * I / I0, 3)} ; ${BASE_REVISION} × ${fr(.15 + .85 * I / I0, 3)} ≈ ${fr(REVISE, 2)} M FCFA. Sans la clause, l’entreprise aurait payé seule la hausse, comme à Akwaba ; avec elle, le risque est partagé.` } } },
      situation('groupement', 'direction', 'Serge propose un groupement',
        'Serge Ahoussou, de Bâti-Express, propose de répondre ensemble à l’appel d’offres d’un groupe scolaire : trop gros pour l’une ou l’autre entreprise seule.',
        ['On étudie le groupement, avec une convention écrite : qui fait quoi, qui représente le groupement, qui répond de quoi', 'Un groupement permet de viser un marché trop gros pour une seule entreprise. Tout se joue dans la convention : sans elle, le premier désaccord tourne au conflit.'],
        [['On refuse : un concurrent reste un ennemi', 'Les concurrents d’hier font souvent les partenaires de demain : seul compte un accord clair.'], ['On accepte, sur une poignée de main', 'Sans convention écrite, personne ne sait qui paie quoi au premier problème.']]),
      { id: 'convention', zone: 'salle-reunion', titre: 'La convention de groupement', contenu: { type: 'selection', selection: {
        titre: 'La convention de groupement', enonce: 'Avant de répondre ensemble, BTP Life et Bâti-Express écrivent leur convention de groupement.', consigne: 'Coche ce qu’elle doit fixer.',
        options: [
          { texte: 'La répartition des travaux entre les deux entreprises', attendu: true, explication: 'Chacun sait ce qu’il construit.' },
          { texte: 'Le mandataire, qui parle au maître d’ouvrage au nom du groupement', attendu: true, explication: 'Le client a un seul interlocuteur.' },
          { texte: 'La répartition du prix et des paiements', attendu: true, explication: 'Chacun sait ce qu’il touche, et quand.' },
          { texte: 'Ce qui se passe si l’une des entreprises fait défaut', attendu: true, explication: 'Le chantier doit pouvoir continuer : c’est la question de la solidarité entre les membres.' },
          { texte: 'L’échange des fichiers clients des deux entreprises', attendu: false, explication: 'Sans rapport avec le marché, et confidentiel.' },
          { texte: 'L’engagement de ne plus jamais se faire concurrence', attendu: false, explication: 'Une telle entente fausse la concurrence : elle est interdite.' },
        ] } } },
    ],
  },
];

/** Ce qu'on voit sur la parcelle des Rôniers, selon les chapitres validés du dossier (0 à 12 ; livré dès le onzième). */
export const STADES_RONIERS = [
  'Terrain à bâtir', 'Marché signé', 'Sol sondé', 'Pieux implantés', 'Permis affiché', 'Base vie installée', 'Pieux forés',
  'Grue montée', 'Gros œuvre en élévation', 'Structure achevée', 'Prêt pour la réception', 'Immeuble livré', 'Référence de l’entreprise',
] as const;
