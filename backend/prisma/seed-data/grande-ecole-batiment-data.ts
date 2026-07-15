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

export const modulesGrandeEcole: ModuleSeed[] = [
  {
    slug: 'geotechnique-bts2',
    titre: 'Géotechnique — BTS2',
    domaine: DOMAINE_GRANDE_ECOLE,
    ordre: 1,
    competence: 'geotechnique',
    cours: geotechniqueCours,
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

export const missionsGrandeEcole: MissionSeed[] = [...geotechniqueMissions];
