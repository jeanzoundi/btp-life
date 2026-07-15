// Grande École du Bâtiment — niveau BTS2, contenu réel adapté de supports de cours BTS
// Génie Civil-Bâtiment (Géotechnique, Métré, Technologie des structures & Pathologie du
// bâtiment). Domaine séparé de l'Académie de base ('grande-ecole-batiment') : cf.
// frontend/src/app/app/academie/page.tsx (filtre ?ecole=) et le bâtiment dédié dans
// quartier-iso.tsx. Un quiz par CHAPITRE (pas par leçon) pour rester raisonnable en nombre
// de missions ; un examen de synthèse par matière.
import type { CoursSeed, ModuleSeed } from './academie-data';
import type { ContenuSeed, MissionSeed } from './missions-data';

export const DOMAINE_GRANDE_ECOLE = 'grande-ecole-batiment';

// ═══════════════════════════════════════════════════════════════════════
// GÉOTECHNIQUE — 4 chapitres / 13 leçons (BTS2, filière Génie Civil-Bâtiment)
// ═══════════════════════════════════════════════════════════════════════

const geotechniqueCours: CoursSeed[] = [
  // ── Chapitre 1 : Généralités sur la géotechnique ──
  {
    titre: 'Présentation de la géotechnique',
    dureeMin: 10,
    blocs: [
      { type: 'objectifs', valeur: "Définir la géotechnique\nSituer le rôle du géotechnicien à chaque étape d'un projet\nComprendre pourquoi une étude géotechnique est indispensable" },
      { type: 'texte', valeur: "La géotechnique est l'étude des propriétés mécaniques, physiques et hydrauliques des sols en vue de leur application à la construction. Elle intervient à tous les stades d'un projet : étude d'impact, choix du site, avant-projet, assistance à la maîtrise d'œuvre, contrôle des travaux, diagnostic des désordres." },
      { type: 'texte', valeur: "Elle joue un rôle essentiel dans presque tous les ouvrages : fondations de bâtiments, ponts et usines, ouvrages de soutènement, stabilité des talus, terrassements routiers, VRD, tunnels, barrages en terre, ouvrages portuaires — partout où le sol supporte ou constitue l'ouvrage." },
      { type: 'attention', valeur: "Négliger l'étude géotechnique d'un site n'élimine jamais le risque du sol : cela ne fait que le reporter, souvent bien plus cher, au moment des désordres." },
      { type: 'retenir', valeur: "Géotechnique = mécanique des sols + mécanique des roches + géologie de l'ingénieur, appliquées à la construction.\nL'étude géotechnique sert le maître d'ouvrage (choix du site), le maître d'œuvre (dimensionnement) et l'entreprise (méthodes, délais, chiffrage)." },
    ],
  },
  {
    titre: 'Le sol : définitions et champs d\'application',
    dureeMin: 12,
    missionPratique: 'geo-quiz-chapitre1',
    blocs: [
      { type: 'texte', valeur: "En géotechnique, une roche est un agrégat naturel massif de matière minérale — un assemblage de grains liés par des forces de cohésion fortes et permanentes. Le sol, par opposition, est un agrégat naturel de grains minéraux séparables par une action mécanique légère : c'est le résultat de l'altération physique et/ou chimique des roches." },
      { type: 'texte', valeur: "Le sol présente deux originalités majeures : c'est un matériau triphasique (grains solides + eau + air), et c'est un milieu discontinu qu'il faut étudier à la fois dans sa globalité et dans sa composition élémentaire." },
      { type: 'exemple', valeur: "Utilisations du sol en génie civil : support d'ouvrage (fondations superficielles ou profondes), matériau de construction (remblais, digues, barrages en terre), ou ouvrage lui-même (déblais, talus, canaux)." },
      { type: 'attention', valeur: "Les accidents géotechniques induits par un ouvrage viennent presque toujours d'un défaut de maîtrise de trois paramètres : la nature du sol, sa portance, et ses tassements — en particulier les tassements différentiels, plus destructeurs que les tassements uniformes." },
      { type: 'retenir', valeur: "Roche = cohésion forte et permanente. Sol = grains séparables mécaniquement.\n3 usages du sol en génie civil : support, matériau, ouvrage." },
    ],
  },

  // ── Chapitre 2 : Reconnaissance et étude des sols ──
  {
    titre: 'Méthodologie de reconnaissance des sols',
    dureeMin: 12,
    blocs: [
      { type: 'objectifs', valeur: "Connaître les trois objectifs d'une reconnaissance de sol\nDistinguer méthodes directes et indirectes\nSavoir dans quel ordre mener une reconnaissance" },
      { type: 'texte', valeur: "La reconnaissance des sols a un triple objectif : définir la nature, la position et l'épaisseur des couches ; préciser les caractéristiques de la nappe aquifère ; étudier les relations contraintes/déformations dans le temps pour prévoir les tassements et choisir la structure portante." },
      { type: 'texte', valeur: "On commence toujours par l'enquête de terrain et l'examen des documents existants (cartes géologiques, géotechniques, topographiques — en Côte d'Ivoire : LBTP, BNETD, SODEMI, Direction de la Géologie), avant d'engager des reconnaissances plus coûteuses en profondeur." },
      { type: 'exemple', valeur: "La géophysique (méthodes indirectes : sismique, électrique, gravimétrique) précise les données géologiques depuis la surface. Les sondages (méthodes directes : puits, tranchées, forages) prélèvent de vrais échantillons, analysés en laboratoire." },
      { type: 'retenir', valeur: "Ordre logique : enquête de site → documents existants → géophysique (indirecte, en surface) → sondages (directs, avec prélèvement).\nToujours partir du moins coûteux vers le plus coûteux." },
    ],
  },
  {
    titre: 'Les essais d\'étude des sols (laboratoire et in situ)',
    dureeMin: 14,
    blocs: [
      { type: 'texte', valeur: "Les essais de laboratoire portent sur des échantillons prélevés : essais d'identification (granulométrie, Atterberg, équivalent de sable...) et essais mécaniques (cisaillement rectiligne, triaxial, œdométrique, CBR, Proctor). Ils exigent des échantillons intacts et une reconstitution fidèle des conditions du sol en place." },
      { type: 'texte', valeur: "Les essais in situ (pénétromètre dynamique, pénétromètre statique, pressiomètre) sont réalisés directement dans le sol, dans les conditions réelles où il sera sollicité par l'ouvrage. Ils sont plus rapides et économiques mais leur interprétation reste plus empirique." },
      { type: 'attention', valeur: "Un essai en laboratoire n'est jamais meilleur qu'un essai in situ dans l'absolu : chacun a son domaine — essais in situ pour les fondations profondes, essais de laboratoire pour les remblais et les talus. On les combine souvent." },
      { type: 'retenir', valeur: "Laboratoire : conditions maîtrisées, mais échantillon parfois perturbé.\nIn situ : conditions réelles, mais interprétation plus empirique.\nPénétromètre = résistance de pointe. Pressiomètre = module et pression limite, pour tassements et fondations." },
    ],
  },
  {
    titre: 'Analyse qualitative des essais de propriétés mécaniques',
    dureeMin: 10,
    missionPratique: 'geo-quiz-chapitre2',
    blocs: [
      { type: 'texte', valeur: "Les essais de laboratoire ont pour eux des conditions environnementales bien maîtrisées, mais la difficulté principale reste l'extraction d'un échantillon réellement intact — le transport et le conditionnement peuvent eux-mêmes altérer les résultats." },
      { type: 'texte', valeur: "Les essais en place ont l'avantage d'un mode de sollicitation proche de celui qu'imposera l'ouvrage réel, et restent économiques quand ils sont menés depuis la surface. Mais ils sont globaux : ils isolent mal les propriétés mécaniques élémentaires (résistance au cisaillement, compressibilité)." },
      { type: 'astuce', valeur: "Retiens ce réflexe d'examen : \"essais en place pour les fondations profondes, essais de laboratoire pour les remblais et talus\" — c'est la règle pratique la plus citée dans ce chapitre." },
    ],
  },

  // ── Chapitre 3 : Propriétés physiques des sols ──
  {
    titre: 'Éléments constitutifs des sols',
    dureeMin: 12,
    blocs: [
      { type: 'texte', valeur: "Un échantillon de sol est constitué de trois phases : solide (grains minéraux), liquide (eau) et gazeuse (air). L'eau existe sous trois formes : eau de constitution (liée chimiquement au minéral), eau adsorbée (film autour de chaque grain, jouant un rôle de lubrifiant), et eau interstitielle (libre ou capillaire, qui circule entre les grains)." },
      { type: 'texte', valeur: "Selon leur dimension, les particules solides sont classées : argiles (d < 2 μm), limons (2-20 μm), sables fins (20-200 μm), sables grossiers (0,2-2 mm), graviers (2-20 mm), cailloux (> 20 mm). Les minéraux argileux (kaolinite, illite, montmorillonite) diffèrent fortement de la roche mère, contrairement aux minéraux non argileux (quartz)." },
      { type: 'exemple', valeur: "En Côte d'Ivoire, les argiles d'altération issues de la décomposition des latérites en climat chaud et humide dominent largement le paysage géotechnique national." },
      { type: 'retenir', valeur: "3 phases : solide + liquide + gazeuse.\nTaille croissante : argile < limon < sable < gravier < cailloux.\nL'eau adsorbée influence fortement le comportement mécanique — jamais négligeable." },
    ],
  },
  {
    titre: 'Structure des sols grenus et des sols fins',
    dureeMin: 12,
    blocs: [
      { type: 'texte', valeur: "Les sols grenus (> 20 μm) tiennent essentiellement par les forces de pesanteur et le contact grain à grain : ils sont dits pulvérulents. Leur stabilité dépend du nombre de contacts entre grains — un sol bien gradué (granulométrie étalée) est plus stable qu'un sol mal gradué." },
      { type: 'texte', valeur: "Les sols fins (< 20 μm) sont dominés par les forces d'attraction intergranulaires (électriques, Van der Waals). Les argiles sont formées d'un empilement de feuillets : la kaolinite est stable et inactive (liaisons hydrogène fortes), l'illite a un comportement normal, la montmorillonite est très active et peut gonfler spectaculairement au contact de l'eau." },
      { type: 'attention', valeur: "La montmorillonite (base de la bentonite, utilisée en boue de forage et parois moulées) est l'argile la plus dangereuse pour l'ingénieur : gonflement au mouillage, retrait au séchage — une source classique de désordres sur fondations superficielles." },
      { type: 'retenir', valeur: "Sols grenus = pesanteur + contact grain à grain (pulvérulents).\nSols fins = cohésion par attraction intergranulaire.\nKaolinite (inactive) < Illite (normale) < Montmorillonite (active, gonflante)." },
    ],
  },
  {
    titre: 'Propriétés caractéristiques : le diagramme des trois phases',
    dureeMin: 14,
    blocs: [
      { type: 'objectifs', valeur: "Représenter un sol par le schéma poids-volume\nCalculer les paramètres d'état (teneur en eau, indice des vides, porosité, degré de saturation)\nAppliquer les formules sur un exercice" },
      { type: 'schema', valeur: 'phases-du-sol' },
      { type: 'texte', valeur: "Caractériser complètement un sol demande trois paramètres indépendants : un qui quantifie le poids volumique, un qui quantifie l'importance des vides, un qui quantifie la présence d'eau. Les paramètres sans dimension (teneur en eau ω, indice des vides e, porosité n, degré de saturation Sr) sont les plus importants : ils décrivent l'état réel du sol." },
      { type: 'exemple', valeur: "Poids volumique γ = W/V. Teneur en eau ω = Ww/Ws (en %). Indice des vides e = Vv/Vs. Porosité n = Vv/V. Degré de saturation Sr = Vw/Vv (en %). Poids volumique de l'eau γw ≈ 10 kN/m³." },
      { type: 'retenir', valeur: "Toujours partir du schéma poids-volume pour retrouver une formule à l'examen plutôt que de l'apprendre par cœur.\nSol saturé : Va = 0, donc Vv = Vw." },
    ],
  },
  {
    titre: 'Identification des sols : granulométrie, Atterberg, VBS',
    dureeMin: 16,
    blocs: [
      { type: 'texte', valeur: "L'analyse granulométrique détermine les proportions de grains de chaque taille (tamisage pour D > 80 μm, sédimentométrie en dessous). Le coefficient d'uniformité Cu = D60/D10 et le coefficient de courbure Cc caractérisent l'étalement de la courbe : Cu < 2 = granulométrie serrée, Cu > 2 = granulométrie étalée." },
      { type: 'schema', valeur: 'courbe-granulometrique' },
      { type: 'texte', valeur: "Les limites d'Atterberg définissent les états de consistance des sols fins : liquide, plastique, semi-solide, solide. La limite de liquidité WL sépare liquide et plastique ; la limite de plasticité WP sépare plastique et semi-solide. L'indice de plasticité IP = WL − WP mesure l'étendue du domaine plastique — plus il est grand, plus le sol est sensible aux variations de teneur en eau." },
      { type: 'schema', valeur: 'limites-atterberg' },
      { type: 'exemple', valeur: "La Valeur de Bleu du Sol (VBS) caractérise l'argilosité : VBS < 0,2 = sol sableux insensible à l'eau ; VBS > 8 = sol très argileux, très plastique. L'équivalent de sable (ES) évalue la propreté d'un sable : ES = 100 = sable pur et propre." },
      { type: 'retenir', valeur: "Cu = D60/D10 (uniformité). IP = WL − WP (plasticité).\nPlus IP est grand, plus le sol gonfle/se retire avec l'eau — donc plus il est risqué en fondation." },
    ],
  },
  {
    titre: 'Classification géotechnique des sols (LPC et sols ivoiriens)',
    dureeMin: 14,
    missionPratique: 'geo-quiz-chapitre3',
    blocs: [
      { type: 'texte', valeur: "La classification LPC (Laboratoire Central des Ponts et Chaussées), calquée sur la classification américaine USCS, est la référence utilisée en Côte d'Ivoire. Elle distingue trois grandes familles : sols grenus (> 50 % de particules > 0,08 mm), sols fins (> 50 % < 0,08 mm), et sols organiques." },
      { type: 'texte', valeur: "Pour un sol grenu propre (< 5 % de fines), on utilise les coefficients de Hazen : une grave est bien graduée si Cu > 4 et 1 < Cc < 3 ; un sable est bien gradué si Cu > 6 et 1 < Cc < 3. Au-delà de 12 % de fines, on classe la fraction fine avec le diagramme de plasticité de Casagrande." },
      { type: 'exemple', valeur: "La classification géotechnique des sols ivoiriens (LBTP, Atlan puis Cougny) ajoute un critère d'origine géologique aux critères de granulométrie et de plasticité — adaptée aux graveleux latéritiques (G1, G2, G3) et aux argiles d'altération sur granite ou sur schiste, très présents dans le socle précambrien qui couvre 97,5 % du territoire ivoirien." },
      { type: 'attention', valeur: "Ne pas confondre : la classification LPC est normalisée et universelle (utilisée officiellement en Côte d'Ivoire) ; la classification LBTP des sols ivoiriens est un complément local, pensé pour les sols routiers latéritiques du pays." },
      { type: 'retenir', valeur: "Sol grenu = plus de 50 % > 0,08 mm. Sol fin = plus de 50 % < 0,08 mm.\nMoins de 5 % de fines → coefficients de Hazen. Plus de 12 % de fines → diagramme de Casagrande." },
    ],
  },

  // ── Chapitre 4 : Compactage des sols ──
  {
    titre: 'Les facteurs du compactage',
    dureeMin: 10,
    blocs: [
      { type: 'texte', valeur: "Le compactage est la réduction instantanée du volume d'un sol sans modification de sa teneur en eau : il augmente la densité sèche, la résistance mécanique, et diminue la compressibilité et la perméabilité. C'est en 1933 que l'ingénieur Proctor met en évidence l'influence de la teneur en eau sur le poids spécifique sec obtenu." },
      { type: 'texte', valeur: "Pour une teneur en eau raisonnable, l'eau joue un rôle de lubrifiant et la densité sèche augmente. Au-delà d'un certain seuil, elle chute : c'est l'optimum Proctor. La courbe est très aplatie pour les sables (peu sensibles à l'eau) et très marquée pour les argiles plastiques." },
      { type: 'attention', valeur: "Un matériau à courbe Proctor aplatie (sable) tolère mieux les écarts d'exécution, mais demande une énergie de compactage plus importante pour être réellement amélioré." },
      { type: 'retenir', valeur: "Compacter = réduire le volume sans changer la teneur en eau, en augmentant la densité sèche.\nPlus l'énergie de compactage augmente, plus le poids volumique maximum augmente et plus la courbe devient pointue." },
    ],
  },
  {
    titre: 'Les essais de compactage au laboratoire (Proctor, CBR)',
    dureeMin: 14,
    blocs: [
      { type: 'texte', valeur: "L'essai Proctor détermine la teneur en eau optimale (ωopt) et la densité sèche maximale (γd max) pour une énergie de compactage donnée. Il existe deux variantes normalisées : le Proctor normal (faible énergie) et le Proctor modifié (énergie poussée)." },
      { type: 'schema', valeur: 'courbe-proctor' },
      { type: 'texte', valeur: "L'essai CBR (Californian Bearing Ratio) mesure la portance d'un sol par poinçonnement : l'échantillon, compacté à la teneur en eau optimale Proctor, est poinçonné jusqu'à 10 mm d'enfoncement. L'indice CBR (en %) compare la pression nécessaire à celle d'un matériau de référence — plus il est élevé, meilleure est la portance." },
      { type: 'exemple', valeur: "Relations empiriques entre CBR et module de Young E : E = 65×CBR^0,65 (Jeuffroy-Bachel), E = 100×CBR (Heukelon), E = 50×CBR (méthode russe)." },
      { type: 'retenir', valeur: "Proctor → teneur en eau optimale + densité sèche maximale.\nCBR → portance du sol (poinçonnement), essentiel pour dimensionner une chaussée." },
    ],
  },
  {
    titre: 'Le compactage des sols in situ',
    dureeMin: 12,
    missionPratique: 'geo-quiz-chapitre4',
    blocs: [
      { type: 'objectifs', valeur: "Connaître les trois objectifs du compactage de chantier\nComprendre le rôle de la planche d'essai\nCalculer un degré de compacité" },
      { type: 'texte', valeur: "Sur le chantier, le compactage vise trois objectifs : supprimer les tassements ultérieurs, augmenter les caractéristiques mécaniques (portance, module), et assurer l'imperméabilité de la couche. La planche d'essai, réalisée avant l'ouverture du chantier de terrassement, fixe les paramètres réels (engin, nombre de passes, vitesse) pour atteindre la compacité prescrite." },
      { type: 'texte', valeur: "Le degré de compacité Dc compare le poids volumique sec obtenu sur le chantier à celui de l'optimum Proctor de référence : Dc = γd chantier / γd Opt Proctor. Les cahiers des charges exigent couramment Dc ≥ 95 %." },
      { type: 'exemple', valeur: "Le choix de l'engin dépend du sol : rouleau lisse pour sables/graves bien gradués, rouleau à pieds de mouton pour sols fins à plus de 20 % de fines, plaques vibrantes pour petites surfaces. Le contrôle sur chantier se fait par densitomètre à membrane, nucléo-densimètre, cône de sable, ou essai à la plaque (module de Westergaard)." },
      { type: 'retenir', valeur: "Compacter au chantier = viser ω = ωopt ± 2 % et le nombre de passes optimal (souvent 3 à 8 pour 30 cm de couche).\nDc = γd chantier / γd Opt Proctor — exigence courante : Dc ≥ 95 %." },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// MÉTRÉ — 3 chapitres / 18 leçons (BTS2, filière Génie Civil-Bâtiment)
// ═══════════════════════════════════════════════════════════════════════

const metreCours: CoursSeed[] = [
  // ── Chapitre A : Avants-métrés (7 leçons) ──
  {
    titre: 'Avant-métré de terrassement',
    dureeMin: 14,
    blocs: [
      { type: 'objectifs', valeur: "Distinguer déblai et remblai\nConnaître les types de fouilles et les classes de terrain\nCalculer un volume de terre à évacuer avec le foisonnement" },
      { type: 'texte', valeur: "Le terrassement est l'ensemble des travaux de modification du relief d'un terrain. Un déblai abaisse le niveau du terrain par enlèvement de terre ; un remblai le relève par apport de terre. On distingue plusieurs types de fouilles selon leurs dimensions : la fouille en rigole (largeur ≤ 2,00 m, profondeur ≤ 1,00 m), la fouille en tranchée (plus profonde que large), et la fouille en excavation ou puits/trou (superficielle, largeur ≤ 2,00 m et profondeur ≤ la moitié de la largeur)." },
      { type: 'exemple', valeur: "Les terrains sont classés en six catégories A à F selon leur dureté : A (terre végétale, sable), B (terre argileuse ou caillouteuse), C (argile plastique, marne compacte), D (roche moyennement dure), E (roche dure au marteau-piqueur), F (roche très dure, à la mine ou dynamite)." },
      { type: 'attention', valeur: "Le coefficient de foisonnement passager (toujours > 1, ex. argile f = 1,35) sert à calculer le volume de terre à évacuer. Le coefficient de foisonnement permanent ou résiduel (ex. argile kr = 1,10) sert à calculer le volume de terre à utiliser pour un remblai soigneusement damé — ce ne sont pas le même coefficient." },
      { type: 'retenir', valeur: "Décapage : m² si épaisseur < 25 cm, sinon m³. Déblais et remblais des fouilles : toujours en m³ « aux vides » (formes géométriques), sans tenir compte du foisonnement — celui-ci n'intervient qu'après, pour évaluer les cubes à évacuer ou à apporter." },
    ],
  },
  {
    titre: 'Avant-métré de béton',
    dureeMin: 14,
    blocs: [
      { type: 'texte', valeur: "Comme pour le terrassement, l'avant-métré de béton commence par une décomposition de la structure en ouvrages élémentaires : béton de propreté, semelles (isolées ou filantes), radiers, dallages, dalles, voiles, poteaux, longrines, poutres, consoles, escaliers, chaînages (horizontaux ou verticaux), linteaux." },
      { type: 'texte', valeur: "La quantité de béton d'un ouvrage élémentaire est généralement évaluée en mètre cube (« cube »), sauf le béton de propreté et le dallage qui peuvent être évalués en m² si le prix unitaire est défini à la surface." },
      { type: 'exemple', valeur: "Pour un ouvrage à section constante : longrines, poutres, chaînages horizontaux, linteaux → volume = section × longueur. Poteaux, chaînages verticaux (raidisseurs), voiles → volume = section × hauteur." },
      { type: 'attention', valeur: "Ouvertures ou réservations de moins de 0,50 m² négligées. Longueur d'un linteau = largeur de la baie + longueurs sur appuis. Longueur d'une longrine ou d'un chaînage horizontal mesurée entre les nus des poteaux ou des raidisseurs." },
      { type: 'retenir', valeur: "Le terme « cube » désigne toujours le volume de béton (ou de déblai/remblai) à déterminer dans un avant-métré." },
    ],
  },
  {
    titre: 'Avant-métré de ferraillage',
    dureeMin: 14,
    blocs: [
      { type: 'texte', valeur: "Il existe deux approches : les ratios d'aciers (kg par m³ de béton, issus de bilans de chantiers antérieurs) pour une estimation rapide, et la méthode des masses linéiques pour un calcul précis à partir des plans d'armatures." },
      { type: 'exemple', valeur: "Ratios usuels (kg/m³) : semelles filantes 20-25, semelles isolées 60-120, longrines 100-130, poteaux 140-150, poutres 130-150, dalles pleines 60-80, raidisseurs 100-150, chaînages et linteaux 80-120, escaliers 60-80. Les treillis soudés sont quantifiés en m² (surface réelle, sans déduire les vides < 1,00 m²)." },
      { type: 'texte', valeur: "Méthode des masses linéiques : la masse d'aciers par repère = longueur développée (Ldev) × nombre de barres (n) × masse linéique du diamètre. La masse totale par ouvrage élémentaire est la somme des masses de tous ses repères." },
      { type: 'exemple', valeur: "Masse linéique par diamètre (kg/m) : Ø6 = 0,222 · Ø8 = 0,395 · Ø10 = 0,617 · Ø12 = 0,888 · Ø14 = 1,208 · Ø16 = 1,578 · Ø20 = 2,466 · Ø25 = 3,853 · Ø32 = 6,313 · Ø40 = 9,865." },
      { type: 'retenir', valeur: "Estimation rapide : Quantité d'aciers ≈ (Cube béton ou surface) × Ratio d'aciers.\nCalcul précis : M/repère = Ldev × n × masse linéique, puis somme par ouvrage élémentaire." },
    ],
  },
  {
    titre: 'Avant-métré de coffrage',
    dureeMin: 12,
    blocs: [
      { type: 'texte', valeur: "Le coffrage (bois ou métal, ordinaire ou soigné) impose, comme le béton, une décomposition de la structure en ouvrages élémentaires. Il est toujours évalué en mètre carré (m²) : c'est l'aire de la surface du béton en contact direct avec le matériau de coffrage (le moule)." },
      { type: 'exemple', valeur: "Formule générale : Surface de coffrage = (périmètre ou linéaire des faces coffrées) × hauteur coffrée × n. Pour les semelles, longrines, chaînages horizontaux et linteaux à section constante, on applique ce même principe au fond de moule et aux faces latérales." },
      { type: 'attention', valeur: "Les trémies ou réservations de surface inférieure à 0,50 m² sont négligées — même seuil que pour le terrassement, mais différent de celui du ferraillage (1,00 m² pour les treillis soudés)." },
      { type: 'retenir', valeur: "Coffrage = même décomposition que le béton, mais mesure de surface de contact, pas de volume." },
    ],
  },
  {
    titre: 'Avant-métré de maçonnerie',
    dureeMin: 12,
    blocs: [
      { type: 'texte', valeur: "Les quantités de maçonnerie sont définies par nature et par épaisseur brute (10, 12, 15, 20 cm) : agglomérés pleins ou creux de mortier/béton, briques creuses ou pleines, géobéton, claustras. Elles sont évaluées en m²." },
      { type: 'exemple', valeur: "Typologie courante d'un bâtiment : murs de soubassement en fondation (agglos pleins de 20 ou 15), murs de façade en élévation (agglos creux de 20), murs intérieurs (agglos creux de 15 ou 10)." },
      { type: 'texte', valeur: "Les enduits et chapes au mortier de ciment complètent la maçonnerie : enduit extérieur (dosé à 300 kg/m³, ép. 1,5 cm), enduit intérieur (250 kg/m³, ép. 1,5 cm, sur la hauteur sous plafond + 10 cm), chape (400 kg/m³, ép. 5 cm)." },
      { type: 'retenir', valeur: "Surface de maçonnerie = linéaire du mur × hauteur de maçonnerie, ouvertures déduites selon les mêmes principes de seuil que le béton et le coffrage." },
    ],
  },
  {
    titre: 'Avant-métré de charpente bois',
    dureeMin: 10,
    blocs: [
      { type: 'texte', valeur: "Les pièces de charpente bois se distinguent par leur section : madrier (ex. 7,5×22,5 cm), bastaing (5×15 cm), chevron (6×6 à 12×12 cm), planche (3×22 à 3,5×25 cm), liteau (1,5×4 à 3×3 cm), volige (épaisseur 1,2 à 2,2 cm, largeur 10 à 30 cm)." },
      { type: 'exemple', valeur: "Formule générale : Cube de bois = section × (longueur ou linéaire). C'est le même principe que pour les ouvrages en béton à section constante — poteaux, longrines, chaînages." },
      { type: 'retenir', valeur: "Fermes triangulées, pannes et planches de rive se quantifient toutes avec section × longueur ; seule la section change selon la pièce." },
    ],
  },
  {
    titre: 'Avant-métré de couverture',
    dureeMin: 10,
    missionPratique: 'metre-quiz-chapitre-a',
    blocs: [
      { type: 'texte', valeur: "La couverture sur charpente se compose de la tôle bac aluzinc (épaisseur type 7/10e) et de ses accessoires : faîtières, arêtiers, noues (souvent en tôle aluminium)." },
      { type: 'texte', valeur: "La couverture elle-même est quantifiée par versant (la surface de chaque pan de toiture), tandis que les accessoires (faîtières, arêtiers, noues) sont quantifiés en mètre linéaire, chacun avec sa propre ligne dans l'avant-métré." },
      { type: 'astuce', valeur: "Réflexe d'examen : ne jamais confondre la surface de couverture (par versant, en m²) avec le linéaire des accessoires (faîtières/arêtiers/noues, en mL) — ce sont deux familles d'unités bien distinctes dans le même avant-métré." },
    ],
  },

  // ── Chapitre B : Calculs d'approvisionnements (3 leçons) ──
  {
    titre: "Calculs d'approvisionnement — Ciment, sable, gravier",
    dureeMin: 14,
    blocs: [
      { type: 'objectifs', valeur: "Lire un tableau de dosage en matériaux\nCalculer une quantité de ciment, sable ou gravier à partir d'un volume de béton\nAppliquer un pourcentage de pertes présumées" },
      { type: 'texte', valeur: "Chaque type de béton ou mortier a un dosage normalisé en ciment (kg/m³), sable (l/m³) et gravier (l/m³). Exemples courants : béton de propreté 150/400/800, semelles-longrines-poteaux-poutres-consoles-dalles pleines en B.A 350/400/800, dallage en B.A 200/400/800, chape au mortier de ciment 400/1000/—, enduit au mortier de ciment 300/1000/—." },
      { type: 'exemple', valeur: "Pertes présumées habituelles : ciment 2 %, sable 3 %, gravier 3 %. Ces pourcentages compensent le gaspillage inévitable sur chantier (répandage, transport, mise en œuvre)." },
      { type: 'retenir', valeur: "Quantité de matériau = Volume de l'ouvrage × Dosage (kg ou l / m³) × (1 + % pertes / 100)." },
    ],
  },
  {
    titre: "Calculs d'approvisionnement — Agglomérés, briques, hourdis",
    dureeMin: 12,
    blocs: [
      { type: 'texte', valeur: "Les quantités concernent les surfaces de maçonnerie en agglomérés et briques, et les surfaces de plancher à corps creux. Elles sont estimées à partir de ratios d'unités au mètre carré." },
      { type: 'exemple', valeur: "Ratios usuels : agglomérés pleins ou creux (long. 40 cm) ≈ 11,5 U/m² ; agglomérés (long. 50 cm) ≈ 9,5 U/m² ; briques creuses (57×30 cm) ≈ 5,5 U/m² ; hourdis pour poutrelles préfabriquées (entraxe 60 cm) ≈ 8,5 U/m² ; hourdis pour poutrelles coulées sur place (entraxe 50 cm) ≈ 10 U/m²." },
      { type: 'attention', valeur: "Les pertes présumées sont plus élevées pour les agglomérés de béton/mortier et les hourdis-entrevous de plancher (1 à 2 %) que pour les blocs en terre cuite comme les briques (0,5 à 1 %)." },
      { type: 'retenir', valeur: "Nombre d'unités à commander = Surface de l'ouvrage × Ratio (U/m²) × (1 + % pertes / 100)." },
    ],
  },
  {
    titre: "Calculs d'approvisionnement — Fer à béton",
    dureeMin: 12,
    missionPratique: 'metre-quiz-chapitre-b',
    blocs: [
      { type: 'texte', valeur: "La fiche d'approvisionnement en barres d'acier reprend, ouvrage élémentaire par ouvrage élémentaire, le nombre d'éléments à façonner et leur longueur, répartis par diamètre. Pour chaque diamètre, on additionne les longueurs de tous les ouvrages afin d'obtenir une longueur totale par diamètre." },
      { type: 'texte', valeur: "Cette longueur totale est ensuite majorée d'un pourcentage pour chutes (couramment 5 %), avant de déterminer le nombre de barres commerciales de 12 m à commander." },
      { type: 'exemple', valeur: "Nombre de barres de 12 m à commander = Longueur totale majorée (m) ÷ 12, arrondi à l'entier supérieur — on ne commande jamais une fraction de barre." },
      { type: 'retenir', valeur: "Chaîne de calcul : longueur par diamètre → + 5 % de chutes → ÷ 12 m → nombre de barres à commander, arrondi au-dessus." },
    ],
  },

  // ── Chapitre C : Étude de prix (8 leçons) ──
  {
    titre: 'Mode de passation des marchés',
    dureeMin: 10,
    blocs: [
      { type: 'texte', valeur: "Un marché de travaux est le contrat par lequel un entrepreneur s'engage à exécuter des travaux pour le compte d'un maître d'ouvrage, qui s'engage en retour à en payer le montant selon les clauses du contrat." },
      { type: 'texte', valeur: "Quatre modes de passation : le gré à gré (entente directe, fréquent chez les particuliers) ; l'appel d'offres, ouvert ou restreint (mise en concurrence, mais l'examen des soumissions n'est pas public et le client n'est pas obligé de choisir le mieux-disant) ; l'adjudication, ouverte ou restreinte (examen en séance publique, avec obligation d'attribuer au mieux-disant) ; le concours (pour des travaux à caractère technique, artistique ou scientifique)." },
      { type: 'attention', valeur: "Ne pas confondre appel d'offres et adjudication : dans l'appel d'offres, le client garde la liberté de choix ; dans l'adjudication, l'examen est public et l'attribution au mieux-disant est obligatoire (sous réserve de garanties suffisantes)." },
      { type: 'retenir', valeur: "4 modes de passation : gré à gré / appel d'offres (ouvert ou restreint) / adjudication (ouverte ou restreinte) / concours." },
    ],
  },
  {
    titre: 'Mode de règlement des marchés',
    dureeMin: 10,
    blocs: [
      { type: 'texte', valeur: "Le marché à prix global forfaitaire fixe un montant global à l'avance, à partir d'un avant-métré et d'un bordereau de prix établis par l'entrepreneur soumissionnaire ; réservé aux petits travaux à délai court." },
      { type: 'texte', valeur: "Le marché à prix unitaire règle l'entreprise sur la base des quantités réellement réalisées, multipliées par des prix unitaires fixés à la soumission — le plus intéressant pour l'entreprise, car il suit l'exécution réelle." },
      { type: 'texte', valeur: "Le marché sur dépenses contrôlées ne fixe aucun prix à l'avance : le montant est établi sur justification des dépenses réelles, augmentées du bénéfice. Le marché en régie est un contrat de location de services : le client ou le maître d'œuvre assure lui-même la direction des travaux, l'entrepreneur agissant en simple prestataire." },
      { type: 'retenir', valeur: "4 modes de règlement : prix global forfaitaire / prix unitaire / dépenses contrôlées / régie. Le prix unitaire reste le plus courant dans le bâtiment." },
    ],
  },
  {
    titre: "Composition d'un dossier d'appel d'offre",
    dureeMin: 10,
    blocs: [
      { type: 'texte', valeur: "L'appel d'offre consiste à porter à la connaissance des entreprises, par lettre individuelle, affiche ou publication, un projet de construction élaboré par le maître d'œuvre, en les invitant à proposer un prix pour l'exécution des travaux." },
      { type: 'texte', valeur: "Le dossier d'appel d'offre comprend des pièces graphiques (plans de situation et de masse, plans de conception architecturale, plans de détails) et des pièces écrites (devis descriptif, devis quantitatif et estimatif, données géotechniques du site, cahiers des prescriptions techniques ou cahiers de charges)." },
      { type: 'retenir', valeur: "Un dossier d'appel d'offre complet = pièces graphiques + pièces écrites, jamais l'un sans l'autre." },
    ],
  },
  {
    titre: "Analyse d'un dossier d'appel d'offre avec rédaction de la soumission",
    dureeMin: 14,
    blocs: [
      { type: 'objectifs', valeur: "Distinguer étude juridique, étude technique et étude de prix\nComprendre le rôle de la visite de site\nSavoir ce que contient une soumission" },
      { type: 'texte', valeur: "L'étude juridique (direction générale) examine les cahiers des charges : conditions du marché, délais d'exécution, modes de règlement, révision des prix — elle débouche sur un avis favorable ou défavorable à participer." },
      { type: 'texte', valeur: "L'étude technique (service des travaux) identifie le type de construction et les techniques de mise en œuvre, complétée par une visite de site : conformité des plans, état naturel des lieux, sondages du sous-sol, constructions mitoyennes, viabilités, et, si le chantier est isolé, ressources locales en matériaux et main d'œuvre." },
      { type: 'texte', valeur: "L'étude de prix recherche les quantités de travaux (avant-métré), puis détermine les prix de vente unitaires : calcul des déboursés secs, calcul des coûts de réalisation, calcul du coefficient de vente, calcul des prix de vente unitaires hors taxe, rédaction du devis estimatif." },
      { type: 'retenir', valeur: "La soumission = offre technique (capacités humaines, matérielles, expérience) + offre financière (le prix proposé) — c'est l'engagement final et formel de l'entreprise." },
    ],
  },
  {
    titre: 'Composition d\'un prix de vente de travaux de bâtiment',
    dureeMin: 14,
    blocs: [
      { type: 'objectifs', valeur: "Mémoriser la chaîne déboursés secs → prix de vente TTC\nComprendre le rôle de la marge bénéficiaire et de la TVA" },
      { type: 'schema', valeur: 'schema-prix-vente' },
      { type: 'texte', valeur: "Les déboursés secs (D.S) regroupent main d'œuvre, matériaux, matériel et matières consommables. Ajoutés aux frais de chantier (F.C : personnel du chantier, installation et repliement, matériels non affectables, frais complémentaires), ils forment les déboursés totaux (D.T), aussi appelés coût de réalisation (C.R)." },
      { type: 'texte', valeur: "Au coût de réalisation s'ajoutent les frais généraux (F.G : administratif, comptable, commercial, financier) et les frais de marché (F.M : adjudication, cautionnement, bureau d'études et de contrôle, assurances complémentaires, dossier) pour obtenir le prix de revient hors taxe (P.R)." },
      { type: 'exemple', valeur: "Le prix de revient, augmenté de la marge bénéficiaire (B, souvent 10 % ou plus du prix de vente hors taxe), donne le prix de vente hors taxe (P.V.H.T). Celui-ci, majoré de la TVA, donne le prix de vente toutes taxes comprises (P.V.T.T.C)." },
      { type: 'retenir', valeur: "Formule littérale à retenir : P.V.H.T = D.S + F.C + F.M + F.G + B." },
    ],
  },
  {
    titre: 'Calcul des déboursés secs',
    dureeMin: 16,
    blocs: [
      { type: 'texte', valeur: "Déboursé sec de matériau : D.S = P.R.C (Prix Rendu Chantier) × Dosage × (1 + % pertes / 100). Exemple : ciment CPA 325 à 120 000 F/t, dosage 350 kg/m³, pertes 2 % ; sable 0/5 à 7 500 F/m³, 450 l/m³, pertes 4 % ; gravier 5/25 à 16 500 F/m³, 850 l/m³, pertes 3 %." },
      { type: 'texte', valeur: "Déboursé sec de main d'œuvre : D.S(M.O) = tu × THM, où le temps unitaire tu (en h par unité d'ouvrage) = (Horaire journalier Hjr × effectif n) / Rendement journalier qr de l'équipe, et le taux horaire moyen THM (F/h) = somme des salaires horaires de l'équipe / effectif n." },
      { type: 'exemple', valeur: "Équipe : 1 Chef d'Équipe (750 F/h), 2 Ouvriers Spécialisés (550 F/h chacun), 3 Ouvriers Manœuvres (360 F/h chacun), Hjr = 8 h/j, qr = 15 m³/j. THM = (750 + 2×550 + 3×360) / 6 ≈ 488 F/h. tu = (8 × 6) / 15 ≈ 3,2 h/m³. D.S(M.O) ≈ 3,2 × 488 ≈ 1 563 F/m³." },
      { type: 'texte', valeur: "Déboursé sec de matériel : pour un matériel loué, on rapporte le coût de location journalier au rendement journalier de l'équipe ; pour un matériel acheté et amorti, on rapporte le coût d'achat au rendement journalier multiplié par le nombre de jours effectifs de travail dans le mois (souvent 22 jours sur 30)." },
      { type: 'retenir', valeur: "3 familles de déboursés secs, 3 méthodes : matériaux (P.R.C × dosage × pertes), main d'œuvre (tu × THM), matériel (coût / rendement, éventuellement amorti sur les jours effectifs)." },
    ],
  },
  {
    titre: "Calcul du coefficient de vente d'une entreprise",
    dureeMin: 12,
    blocs: [
      { type: 'texte', valeur: "Le coefficient de vente Kv permet de passer directement d'un déboursé sec au prix de vente unitaire hors taxe, sans reconstruire toute la chaîne (frais de chantier, frais généraux, frais de marché, bénéfice) à chaque ouvrage élémentaire." },
      { type: 'exemple', valeur: "Lorsque tous les frais et le bénéfice sont exprimés en pourcentage du P.V.U.H.T, on a : Kv = 100 % / (100 % − (somme des frais % + bénéfice %)). Exemple : frais + bénéfice = 20 % du P.V.U.H.T → Kv = 100 / (100 − 20) = 100 / 80 = 1,25." },
      { type: 'retenir', valeur: "Kv se calcule une seule fois pour l'entreprise (ou par type de marché), puis sert directement pour tous les ouvrages élémentaires du sous-détail de prix." },
    ],
  },
  {
    titre: "Calcul d'un prix de vente unitaire hors taxe (PVUHT)",
    dureeMin: 12,
    missionPratique: 'metre-quiz-chapitre-c',
    blocs: [
      { type: 'texte', valeur: "Le sous-détail de prix est le document qui résume, pour un ouvrage élémentaire donné, l'analyse détaillée des déboursés secs (matériaux, main d'œuvre, matériel), le coefficient de vente de l'entreprise, et le calcul du prix de vente unitaire hors taxe." },
      { type: 'exemple', valeur: "Une fois Kv connu, la formule finale est directe : P.V.U.H.T = D.S × Kv. C'est cette formule que l'entreprise applique concrètement, ouvrage après ouvrage, pour construire son bordereau de prix et répondre à un appel d'offres." },
      { type: 'retenir', valeur: "P.V.U.H.T = Déboursé Sec × Coefficient de vente — la formule opérationnelle finale de tout le chapitre étude de prix." },
    ],
  },
];

export const modulesGrandeEcole: ModuleSeed[] = [
  {
    slug: 'geotechnique-bts2',
    titre: 'Géotechnique — BTS2',
    domaine: DOMAINE_GRANDE_ECOLE,
    ordre: 1,
    competence: 'geotechnique',
    cours: geotechniqueCours,
  },
  {
    slug: 'metre-bts2',
    titre: 'Métré — BTS2',
    domaine: DOMAINE_GRANDE_ECOLE,
    ordre: 2,
    competence: 'metre-devis',
    cours: metreCours,
  },
];

// Profils GEOTECH existants (voir profilsData dans seed.ts) — thématiquement les plus proches.
const PROFILS_GEOTECH = ['stagiaire-geotech', 'technicien-labo-sol', 'ingenieur-geotechnique'];

const geotechniqueMissions: MissionSeed[] = [
  {
    slug: 'geo-quiz-chapitre1',
    titre: 'Quiz — Généralités sur la géotechnique',
    description: "Vérifie tes acquis sur le rôle de la géotechnique et la définition du sol.",
    type: 'QUIZ',
    profils: PROFILS_GEOTECH,
    niveauRequis: 1,
    competences: ['geotechnique'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: 'La géotechnique est...',
        options: [
          { id: 'a', label: "L'étude des propriétés mécaniques, physiques et hydrauliques des sols en vue de leur application à la construction" },
          { id: 'b', label: "Uniquement l'étude de la résistance du béton armé" },
          { id: 'c', label: "La science qui calcule le prix des terrassements" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est la définition même du cours : mécanique des sols + mécanique des roches + géologie de l'ingénieur, appliquées à la construction.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Ce qui distingue un sol d'une roche, en géotechnique...",
        options: [
          { id: 'a', label: "Le sol est un agrégat de grains séparables par une action mécanique légère ; la roche a une cohésion forte et permanente" },
          { id: 'b', label: "Le sol est toujours plus dur que la roche" },
          { id: 'c', label: "Il n'y a aucune différence, ce sont des synonymes" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "La roche est un assemblage massif à cohésion forte ; le sol résulte de son altération et se sépare facilement en grains.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "Le sol est un matériau...",
        options: [
          { id: 'a', label: "Triphasique (solide + eau + air) et discontinu" },
          { id: 'b', label: "Monophasique et homogène" },
          { id: 'c', label: "Toujours sec et sans vide" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Les deux originalités du sol : trois phases (grains, eau, air), et un milieu discontinu à étudier globalement et élément par élément.",
      },
      {
        ordre: 4, typeQuestion: 'QCM',
        enonce: "Un accident géotechnique où le sol est utilisé comme support d'ouvrage vient le plus souvent...",
        options: [
          { id: 'a', label: "D'une mauvaise maîtrise de la nature du sol, de sa portance ou de ses tassements" },
          { id: 'b', label: "Uniquement d'une erreur de coffrage" },
          { id: 'c', label: "D'un défaut de peinture des façades" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Ces trois paramètres — nature, portance, tassements (surtout différentiels) — sont la cause la plus fréquente de désordres sur fondations.",
      },
    ],
  },
  {
    slug: 'geo-quiz-chapitre2',
    titre: 'Quiz — Reconnaissance et étude des sols',
    description: "Méthodes directes/indirectes, essais de laboratoire et in situ.",
    type: 'QUIZ',
    profils: PROFILS_GEOTECH,
    niveauRequis: 4,
    competences: ['geotechnique'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "Avant d'engager des sondages coûteux, la première étape d'une reconnaissance de sol est...",
        options: [
          { id: 'a', label: "L'enquête de terrain et l'examen des documents existants (cartes géologiques, géotechniques...)" },
          { id: 'b', label: "Le forage carotté immédiat sur toute la parcelle" },
          { id: 'c', label: "L'essai Proctor" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "On part toujours du moins coûteux (enquête, documents) vers le plus coûteux (sondages en profondeur).",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "La géophysique (sismique, électrique, gravimétrique) est une méthode de reconnaissance...",
        options: [
          { id: 'a', label: "Indirecte, réalisée depuis la surface, sans prélèvement" },
          { id: 'b', label: "Directe, avec prélèvement d'échantillons" },
          { id: 'c', label: "Réservée uniquement aux essais de laboratoire" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Les sondages (puits, forages) sont les méthodes directes, avec prélèvement. La géophysique reste indirecte, en surface.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "L'essai pressiométrique...",
        options: [
          { id: 'a', label: "Mesure le module pressiométrique et la pression limite, utiles pour les tassements et fondations" },
          { id: 'b', label: "Sert uniquement à mesurer la couleur du sol" },
          { id: 'c', label: "Remplace totalement les essais de laboratoire dans tous les cas" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Il consiste à charger le sol en place via une sonde dilatable dans un forage préalable, pour calculer tassements et stabilité des fondations.",
      },
      {
        ordre: 4, typeQuestion: 'QCM',
        enonce: "Pour une étude de remblais et de talus, on privilégiera plutôt...",
        options: [
          { id: 'a', label: "Les essais de laboratoire" },
          { id: 'b', label: "Les essais en place uniquement" },
          { id: 'c', label: "Aucun essai n'est nécessaire" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Règle pratique du cours : essais en place pour les fondations profondes, essais de laboratoire pour les remblais et talus.",
      },
    ],
  },
  {
    slug: 'geo-quiz-chapitre3',
    titre: 'Quiz — Propriétés physiques et classification des sols',
    description: "Phases du sol, granulométrie, Atterberg, classification LPC.",
    type: 'QUIZ',
    profils: PROFILS_GEOTECH,
    niveauRequis: 8,
    competences: ['geotechnique'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "Dans le schéma poids-volume, l'indice des vides e est défini par...",
        options: [
          { id: 'a', label: "e = Vv / Vs (volume des vides sur volume des grains solides)" },
          { id: 'b', label: "e = Ws / W (poids des grains sur poids total)" },
          { id: 'c', label: "e = V (volume total du sol)" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'indice des vides rapporte le volume des vides (air + eau) au volume des grains solides.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Un coefficient d'uniformité (Hazen) Cu = D60/D10 inférieur à 2 signifie...",
        options: [
          { id: 'a', label: "Une granulométrie serrée (uniforme)" },
          { id: 'b', label: "Une granulométrie étalée (bien graduée)" },
          { id: 'c', label: "Un sol totalement argileux" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Cu < 2 = granulométrie serrée/uniforme ; Cu > 2 = étalée ou variée.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "L'indice de plasticité IP = WL − WP mesure...",
        options: [
          { id: 'a', label: "L'étendue du domaine plastique du sol, donc sa sensibilité à l'eau" },
          { id: 'b', label: "Le poids volumique des grains solides" },
          { id: 'c', label: "La vitesse de sédimentation des particules" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Plus IP est grand, plus le sol est sensible aux variations de teneur en eau : gonflement et retrait plus marqués.",
      },
      {
        ordre: 4, typeQuestion: 'QCM',
        enonce: "Dans la classification LPC, un sol est dit \"grenu\" quand...",
        options: [
          { id: 'a', label: "Plus de 50 % de ses particules ont un diamètre supérieur à 0,08 mm" },
          { id: 'b', label: "Plus de 50 % de ses particules ont un diamètre inférieur à 0,08 mm" },
          { id: 'c', label: "Il contient plus de 30 % de matières organiques" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est l'inverse pour les sols fins (> 50 % < 0,08 mm). Au-delà de 30 % de matières organiques, on parle de tourbe.",
      },
      {
        ordre: 5, typeQuestion: 'QCM',
        enonce: "La montmorillonite, comparée à la kaolinite...",
        options: [
          { id: 'a', label: "Est beaucoup plus active : elle gonfle fortement au contact de l'eau" },
          { id: 'b', label: "Est totalement inactive et stable" },
          { id: 'c', label: "N'existe pas dans les sols argileux" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Liaisons très lâches entre feuillets → l'eau s'infiltre facilement → gonflement spectaculaire. La kaolinite, à l'inverse, est stable et inactive.",
      },
    ],
  },
  {
    slug: 'geo-quiz-chapitre4',
    titre: 'Quiz — Compactage des sols',
    description: "Essai Proctor, essai CBR, compactage in situ et degré de compacité.",
    type: 'QUIZ',
    profils: PROFILS_GEOTECH,
    niveauRequis: 12,
    competences: ['geotechnique'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "L'essai Proctor a pour but de déterminer...",
        options: [
          { id: 'a', label: "La teneur en eau optimale et la densité sèche maximale pour une énergie de compactage donnée" },
          { id: 'b', label: "La résistance à la traction des aciers" },
          { id: 'c', label: "Le dosage en ciment d'un béton" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est la définition même de l'essai, mis au point par l'ingénieur Proctor en 1933.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Sur la courbe Proctor, au-delà de la teneur en eau optimale...",
        options: [
          { id: 'a', label: "La densité sèche chute (versant mouillé)" },
          { id: 'b', label: "La densité sèche continue d'augmenter indéfiniment" },
          { id: 'c', label: "Le sol devient incompressible" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Trop d'eau occupe la place des grains solides et absorbe l'énergie de compactage sans profit : la densité sèche redescend.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "L'essai CBR mesure...",
        options: [
          { id: 'a', label: "La portance du sol par poinçonnement" },
          { id: 'b', label: "La perméabilité du sol" },
          { id: 'c', label: "La teneur en matières organiques" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'indice CBR (Californian Bearing Ratio) compare la résistance au poinçonnement à celle d'un matériau de référence.",
      },
      {
        ordre: 4, typeQuestion: 'NUMERIQUE',
        enonce: "Un chantier obtient γd chantier = 18,4 kN/m³ pour un γd Opt Proctor de laboratoire de 19,2 kN/m³. Quel est le degré de compacité Dc, en % (arrondi à l'entier) ?",
        bonnesReponses: 96, tolerance: 1,
        correctionPedagogique: "Dc = γd chantier / γd Opt Proctor = 18,4 / 19,2 ≈ 0,958, soit environ 96 % — au-dessus du seuil courant de 95 %, le compactage est conforme.",
      },
      {
        ordre: 5, typeQuestion: 'QCM',
        enonce: "Le rouleau à pieds de mouton est le plus indiqué pour...",
        options: [
          { id: 'a', label: "Les sols fins à plus de 20 % de fines" },
          { id: 'b', label: "Les sols grossiers et caillouteux" },
          { id: 'c', label: "Les sables secs uniquement" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Ses pieds pénètrent et malaxent les sols fins argileux — il est au contraire déconseillé sur des sols grossiers et caillouteux.",
      },
    ],
  },
  {
    slug: 'geo-examen-final',
    titre: "Examen de synthèse — Géotechnique BTS2",
    description: "Épreuve finale couvrant les 4 chapitres du programme de géotechnique.",
    type: 'EXAMEN',
    profils: PROFILS_GEOTECH,
    niveauRequis: 15,
    competences: ['geotechnique'],
    conditionReussite: 70,
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "La géotechnique intervient à tous les stades d'un projet, notamment...",
        options: [
          { id: 'a', label: "Le choix du site, l'avant-projet, le contrôle des travaux et le diagnostic des désordres" },
          { id: 'b', label: "Uniquement la facturation finale du chantier" },
          { id: 'c', label: "Seulement après la réception des travaux" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "L'intervention du géotechnicien est nécessaire à toutes les étapes, de l'étude d'impact au diagnostic des sinistres.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Une reconnaissance de sol a pour triple objectif de définir...",
        options: [
          { id: 'a', label: "La nature/position/épaisseur des couches, les caractéristiques de la nappe, et le comportement dans le temps (tassements)" },
          { id: 'b', label: "Uniquement la couleur du terrain" },
          { id: 'c', label: "Le prix de vente du terrain" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Ces trois objectifs conditionnent le choix du type de fondation et de la structure porteuse.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "L'eau adsorbée dans un sol...",
        options: [
          { id: 'a', label: "Forme un film autour de chaque grain et joue un rôle de lubrifiant, avec une forte influence mécanique" },
          { id: 'b', label: "Est totalement mobile et s'évacue à température ambiante" },
          { id: 'c', label: "N'a aucune influence sur le comportement du sol" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Contrairement à l'eau libre, l'eau adsorbée n'est mobile qu'à très haute température (> 300°C) et pèse lourd sur le comportement mécanique.",
      },
      {
        ordre: 4, typeQuestion: 'QCM',
        enonce: "Un indice de plasticité IP élevé signifie qu'un sol...",
        options: [
          { id: 'a', label: "Est très sensible aux variations de teneur en eau (gonflement/retrait marqués)" },
          { id: 'b', label: "Est un sable propre et bien gradué" },
          { id: 'c', label: "Ne contient aucune argile" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "IP = WL − WP : plus il est grand, plus la zone de comportement plastique est large, et plus le risque de déformation est élevé.",
      },
      {
        ordre: 5, typeQuestion: 'QCM',
        enonce: "Selon la classification LPC, un sol grenu propre est bien gradué si...",
        options: [
          { id: 'a', label: "Cu et Cc respectent les seuils définis (ex. grave : Cu > 4 et 1 < Cc < 3)" },
          { id: 'b', label: "Sa teneur en eau naturelle dépasse 50 %" },
          { id: 'c', label: "Il contient plus de 12 % de fines" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Au-delà de 12 % de fines, on ne raisonne plus avec Cu/Cc seuls : on passe au diagramme de plasticité de Casagrande.",
      },
      {
        ordre: 6, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: "Sur un chantier de remblai, le sol arrive avec une teneur en eau nettement supérieure à l'optimum Proctor. Que fais-tu ?",
        options: [
          { id: 'augmenter-energie', label: "Augmenter l'énergie de compactage sans toucher à la teneur en eau", points: 60, consequences: { budget: -20000 } },
          { id: 'assecher', label: "Tenter d'assécher le sol avant compactage", points: 30, consequences: { budget: -80000 } },
          { id: 'ignorer', label: "Compacter tel quel, sans ajustement", points: 0, consequences: { budget: -300000, reputation: -5 } },
        ],
        bonnesReponses: 'augmenter-energie',
        correctionPedagogique: "Le cours est clair : assécher un terrain est pratiquement impraticable. La solution réaliste est d'augmenter l'énergie de compactage sans modifier la teneur en eau.",
      },
      {
        ordre: 7, typeQuestion: 'NUMERIQUE',
        enonce: "Un sol a une limite de liquidité WL = 52 % et une limite de plasticité WP = 28 %. Quel est son indice de plasticité IP, en % ?",
        bonnesReponses: 24, tolerance: 1,
        correctionPedagogique: "IP = WL − WP = 52 − 28 = 24 %. Un IP de cet ordre correspond à un sol plastique.",
      },
      {
        ordre: 8, typeQuestion: 'QCM',
        enonce: "Le degré de compacité Dc exigé couramment par les cahiers des charges est de l'ordre de...",
        options: [
          { id: 'a', label: "95 %" },
          { id: 'b', label: "50 %" },
          { id: 'c', label: "150 %" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Dc = γd chantier / γd Opt Proctor ≥ 95 % est l'exigence courante des cahiers des charges de terrassement.",
      },
    ],
  },
];

// Profils existants (voir profilsData dans seed.ts) déjà liés au métré/devis.
const PROFILS_METRE = ['aide-metreur', 'metreur-junior', 'economiste'];

const metreMissions: MissionSeed[] = [
  {
    slug: 'metre-quiz-chapitre-a',
    titre: 'Quiz — Avants-métrés (terrassement, béton, ferraillage, coffrage, maçonnerie, bois, couverture)',
    description: "Vérifie tes acquis sur les 7 leçons du chapitre Avants-métrés.",
    type: 'QUIZ',
    profils: PROFILS_METRE,
    niveauRequis: 1,
    competences: ['metre-devis'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "Dans le vocabulaire du terrassement, un remblai est...",
        options: [
          { id: 'a', label: "Un relèvement du niveau du terrain par apport de terre" },
          { id: 'b', label: "Un abaissement du niveau du terrain par enlèvement de terre" },
          { id: 'c', label: "Une classe de terrain rocheux" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Déblai = abaissement par enlèvement ; remblai = relèvement par apport de terre.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Le coefficient de foisonnement permanent (résiduel) sert à...",
        options: [
          { id: 'a', label: "Calculer le volume de terre à utiliser pour un remblai soigneusement damé" },
          { id: 'b', label: "Calculer le volume de terre à évacuer à la décharge" },
          { id: 'c', label: "Calculer le dosage en ciment d'un béton" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Le foisonnement passager sert à évacuer ; le foisonnement permanent (résiduel) sert à remblayer — deux coefficients distincts.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "Pour un ouvrage élémentaire en béton à section constante comme un poteau ou un voile, le volume se calcule par...",
        options: [
          { id: 'a', label: "Section × hauteur" },
          { id: 'b', label: "Section × largeur" },
          { id: 'c', label: "Périmètre × épaisseur" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Poteaux, chaînages verticaux et voiles : volume = section × hauteur. Pour les longrines, poutres et chaînages horizontaux, c'est section × longueur.",
      },
      {
        ordre: 4, typeQuestion: 'QCM',
        enonce: "Une trémie ou réservation est négligée dans un avant-métré de coffrage lorsque sa surface est...",
        options: [
          { id: 'a', label: "Inférieure à 0,50 m²" },
          { id: 'b', label: "Inférieure à 5,00 m²" },
          { id: 'c', label: "Jamais négligée, quelle que soit sa taille" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Seuil de 0,50 m², identique à celui du terrassement et du béton (pour le coffrage et les ouvertures courantes).",
      },
      {
        ordre: 5, typeQuestion: 'QCM',
        enonce: "La quantité d'aciers d'un ouvrage élémentaire peut être rapidement estimée par...",
        options: [
          { id: 'a', label: "Cube de béton (ou surface) × ratio d'aciers en kg/m³ (ou kg/m²)" },
          { id: 'b', label: "Périmètre du bâtiment × nombre d'étages" },
          { id: 'c', label: "Longueur de la charpente bois uniquement" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est la méthode rapide des ratios (ex. poteaux 140-150 kg/m³) ; la méthode précise reste les masses linéiques par repère.",
      },
    ],
  },
  {
    slug: 'metre-quiz-chapitre-b',
    titre: "Quiz — Calculs d'approvisionnements",
    description: "Ciment/sable/gravier, agglomérés/briques/hourdis, fer à béton.",
    type: 'QUIZ',
    profils: PROFILS_METRE,
    niveauRequis: 6,
    competences: ['metre-devis'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "La quantité de ciment nécessaire pour un ouvrage se calcule par...",
        options: [
          { id: 'a', label: "Volume de l'ouvrage × dosage en kg/m³ × (1 + % de pertes)" },
          { id: 'b', label: "Surface de l'ouvrage × prix du ciment au sac" },
          { id: 'c', label: "Nombre d'ouvriers × durée du chantier" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est la formule générale d'approvisionnement en matériaux liquides/pulvérulents, appliquée aussi au sable et au gravier.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Pour des agglomérés de longueur 40 cm, le ratio usuel d'approvisionnement est d'environ...",
        options: [
          { id: 'a', label: "11,5 unités/m²" },
          { id: 'b', label: "5,5 unités/m²" },
          { id: 'c', label: "50 unités/m²" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "11,5 U/m² pour les agglos de 40 cm de long (9,5 U/m² pour ceux de 50 cm). 5,5 U/m² correspond plutôt aux briques creuses (57×30 cm).",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "Le pourcentage de pertes présumées est généralement le plus faible pour...",
        options: [
          { id: 'a', label: "Les blocs en terre cuite et les hourdis de plancher (0,5 à 1 %)" },
          { id: 'b', label: "Les agglomérés de béton ou de mortier pour murs (1 à 2 %)" },
          { id: 'c', label: "Le ciment (toujours 10 %)" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Les blocs en terre cuite (briques, hourdis) cassent moins facilement à la mise en œuvre que les agglomérés de béton.",
      },
      {
        ordre: 4, typeQuestion: 'NUMERIQUE',
        enonce: "Une fiche d'approvisionnement en aciers HA12 donne une longueur totale, majoration pour chutes de 5 % déjà incluse, de 138 m. Combien de barres de 12 m faut-il commander (arrondi à l'entier supérieur) ?",
        bonnesReponses: 12, tolerance: 0,
        correctionPedagogique: "138 ÷ 12 = 11,5, arrondi à l'entier supérieur : 12 barres. On ne commande jamais une fraction de barre.",
      },
    ],
  },
  {
    slug: 'metre-quiz-chapitre-c',
    titre: 'Quiz — Étude de prix',
    description: "Marchés, dossiers d'appel d'offre, déboursés secs, coefficient de vente, PVUHT.",
    type: 'QUIZ',
    profils: PROFILS_METRE,
    niveauRequis: 10,
    competences: ['metre-devis'],
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "Dans un marché par adjudication, l'examen des soumissions...",
        options: [
          { id: 'a', label: "Est fait en séance publique, avec obligation d'attribuer le marché au mieux-disant" },
          { id: 'b', label: "N'est jamais public et le client choisit librement" },
          { id: 'c', label: "N'existe pas : le marché est automatique" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est ce qui distingue l'adjudication de l'appel d'offres : examen public et obligation d'attribution au mieux-disant (sous réserve de garanties suffisantes).",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Un marché à prix unitaire est réglé sur la base de...",
        options: [
          { id: 'a', label: "Les quantités réellement réalisées × les prix unitaires proposés à la soumission" },
          { id: 'b', label: "Un montant global fixé une fois pour toutes, quelles que soient les quantités" },
          { id: 'c', label: "Les seules dépenses justifiées par l'entrepreneur" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "C'est le principe du prix unitaire ; le prix global forfaitaire fixe un montant en bloc, les dépenses contrôlées se règlent sur justificatifs.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "La formule littérale du prix de vente hors taxe est...",
        options: [
          { id: 'a', label: "P.V.H.T = D.S + F.C + F.M + F.G + B" },
          { id: 'b', label: "P.V.H.T = D.S × TVA" },
          { id: 'c', label: "P.V.H.T = Bénéfice uniquement" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Déboursés secs + frais de chantier + frais de marché + frais généraux + bénéfice = prix de vente hors taxe.",
      },
      {
        ordre: 4, typeQuestion: 'QCM',
        enonce: "Le coefficient de vente Kv d'une entreprise permet de...",
        options: [
          { id: 'a', label: "Passer directement du déboursé sec au prix de vente unitaire HT (PVUHT = D.S × Kv)" },
          { id: 'b', label: "Calculer uniquement la TVA à payer" },
          { id: 'c', label: "Remplacer entièrement l'avant-métré" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Kv se calcule une fois pour l'entreprise, puis s'applique directement à chaque déboursé sec du sous-détail de prix.",
      },
      {
        ordre: 5, typeQuestion: 'NUMERIQUE',
        enonce: "Une entreprise a des frais et un bénéfice représentant ensemble 20 % de son PVUHT. Quel est son coefficient de vente Kv (arrondi à 2 décimales) ?",
        bonnesReponses: 1.25, tolerance: 0.02,
        correctionPedagogique: "Kv = 100 % / (100 % − 20 %) = 100 / 80 = 1,25.",
      },
    ],
  },
  {
    slug: 'metre-examen-final',
    titre: 'Examen de synthèse — Métré BTS2',
    description: "Épreuve finale couvrant les 3 chapitres du programme de métré.",
    type: 'EXAMEN',
    profils: PROFILS_METRE,
    niveauRequis: 14,
    competences: ['metre-devis'],
    conditionReussite: 70,
    contenus: [
      {
        ordre: 1, typeQuestion: 'QCM',
        enonce: "Le coefficient de foisonnement passager sert à calculer...",
        options: [
          { id: 'a', label: "Le volume de terre à évacuer" },
          { id: 'b', label: "Le dosage en ciment d'un béton" },
          { id: 'c', label: "La surface de coffrage" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Le foisonnement passager (toujours > 1) majore le déblai restant pour donner le volume réel à évacuer.",
      },
      {
        ordre: 2, typeQuestion: 'QCM',
        enonce: "Pour un ouvrage à section constante comme une longrine, le volume de béton se calcule par...",
        options: [
          { id: 'a', label: "Section × longueur" },
          { id: 'b', label: "Section × hauteur" },
          { id: 'c', label: "Périmètre × épaisseur de coffrage" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Longrines, poutres, chaînages horizontaux et linteaux : section × longueur. Poteaux et voiles : section × hauteur.",
      },
      {
        ordre: 3, typeQuestion: 'QCM',
        enonce: "La formule générale pour calculer une quantité de matériau d'approvisionnement à partir d'un volume d'ouvrage est...",
        options: [
          { id: 'a', label: "Volume × dosage × (1 + % de pertes)" },
          { id: 'b', label: "Volume ÷ nombre d'ouvriers" },
          { id: 'c', label: "Surface du chantier × coefficient de vente" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Vrai pour le ciment, le sable et le gravier — seuls le dosage et le % de pertes changent selon le matériau et l'ouvrage.",
      },
      {
        ordre: 4, typeQuestion: 'NUMERIQUE',
        enonce: "Une équipe de 5 ouvriers travaille 8 h/jour avec un rendement de 20 m³/jour. Quel est le temps unitaire tu, en heures par m³ (arrondi à 1 décimale) ?",
        bonnesReponses: 2.0, tolerance: 0.1,
        correctionPedagogique: "tu = (Hjr × n) / qr = (8 × 5) / 20 = 40 / 20 = 2,0 h/m³.",
      },
      {
        ordre: 5, typeQuestion: 'QCM',
        enonce: "Dans un sous-détail de prix, le PVUHT d'un ouvrage élémentaire s'obtient par...",
        options: [
          { id: 'a', label: "D.S × Kv (déboursé sec × coefficient de vente)" },
          { id: 'b', label: "D.S + TVA uniquement" },
          { id: 'c', label: "Prix du marché ÷ surface du terrain" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "Formule opérationnelle finale du chapitre étude de prix : PVUHT = D.S × Kv.",
      },
      {
        ordre: 6, typeQuestion: 'CHOIX_CONSEQUENCE',
        enonce: "Ton entreprise a mal évalué son coefficient de vente Kv (trop bas) avant de répondre à un appel d'offres par adjudication. La remise des offres est demain matin. Que fais-tu ?",
        options: [
          { id: 'recalculer', label: "Recalculer correctement Kv cette nuit et corriger le bordereau de prix avant la remise", points: 60, consequences: { budget: -10000 } },
          { id: 'signer', label: "Remettre l'offre telle quelle en espérant se rattraper sur des avenants en cours de chantier", points: 0, consequences: { budget: -400000, reputation: -8 } },
          { id: 'retirer', label: "Retirer purement et simplement l'entreprise de l'appel d'offres", points: 30, consequences: { budget: -20000, reputation: -2 } },
        ],
        bonnesReponses: 'recalculer',
        correctionPedagogique: "Un Kv trop bas signifie un prix de vente sous-évalué : chaque ouvrage vendu perd de l'argent. Le cours est clair — le sous-détail de prix doit être fiable avant la remise, pas corrigé après coup sur le dos du client via des avenants.",
      },
      {
        ordre: 7, typeQuestion: 'QCM',
        enonce: "Un plancher à corps creux (hourdis + poutrelles préfabriquées, entraxe 60 cm) se quantifie en général avec un ratio proche de...",
        options: [
          { id: 'a', label: "8,5 hourdis/m²" },
          { id: 'b', label: "1 hourdis/m²" },
          { id: 'c', label: "50 hourdis/m²" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "8,5 U/m² pour un entraxe de 60 cm avec poutrelles préfabriquées (10 U/m² pour un entraxe de 50 cm avec poutrelles coulées sur place).",
      },
      {
        ordre: 8, typeQuestion: 'QCM',
        enonce: "Le marché en régie se caractérise par...",
        options: [
          { id: 'a', label: "Le client ou le maître d'œuvre assure la direction des travaux, l'entrepreneur agissant en simple prestataire de services" },
          { id: 'b', label: "Un prix global forfaitaire fixé à l'avance" },
          { id: 'c', label: "Un examen des soumissions en séance publique" },
        ],
        bonnesReponses: ['a'],
        correctionPedagogique: "En régie, l'entrepreneur loue ses services (matériel, main d'œuvre) mais c'est le client/maître d'œuvre qui dirige et endosse les responsabilités habituellement portées par l'entrepreneur.",
      },
    ],
  },
];

export const missionsGrandeEcole: MissionSeed[] = [...geotechniqueMissions, ...metreMissions];
