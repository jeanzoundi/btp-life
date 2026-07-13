export type BlocSeed = { type: 'texte' | 'exemple' | 'astuce' | 'attention' | 'objectifs' | 'retenir' | 'schema' | 'logiciel'; valeur: string };
export type CoursSeed = { titre: string; dureeMin: number; blocs: BlocSeed[]; missionPratique?: string };
export type ModuleSeed = { slug: string; titre: string; domaine: string; ordre: number; competence: string; cours: CoursSeed[] };

export const modulesAcademie: ModuleSeed[] = [
    {
      slug: 'introduction-btp', titre: 'Introduction au BTP', domaine: 'general', ordre: 1, competence: 'bases-btp',
      cours: [
        {
          titre: 'Le monde du BTP et ses acteurs', dureeMin: 10, missionPratique: 'acteurs-projet-btp',
          blocs: [
            { type: 'texte', valeur: "Le BTP (Bâtiment et Travaux Publics) regroupe la construction de bâtiments (logements, écoles, bureaux) et les infrastructures (routes, ponts, réseaux). Un projet fait intervenir : le maître d'ouvrage (celui qui commande et paie), le maître d'œuvre (celui qui conçoit et dirige), les entreprises (celles qui exécutent), le bureau de contrôle et le coordonnateur sécurité." },
            { type: 'exemple', valeur: "Pour la construction d'une école à Abidjan : le ministère est maître d'ouvrage, le cabinet d'architecture maître d'œuvre, l'entreprise générale exécute, et le bureau de contrôle vérifie la solidité." },
            { type: 'astuce', valeur: "Retiens : « celui qui paie » (ouvrage) ≠ « celui qui conçoit » (œuvre). La confusion entre les deux est l'erreur n°1 des débutants." },
          ],
        },
        {
          titre: "Le cycle de vie d'un projet", dureeMin: 8,
          blocs: [
            { type: 'texte', valeur: "Un projet suit toujours le même chemin : études de faisabilité → conception (esquisse, avant-projet, projet) → consultation des entreprises → travaux → réception → exploitation/maintenance. Chaque phase produit des documents précis (plans, devis, marchés, PV)." },
            { type: 'attention', valeur: "Plus une erreur est détectée tard, plus elle coûte cher : une erreur de conception corrigée en phase travaux peut coûter 100 fois plus." },
          ],
        },
      ],
    },
    {
      slug: 'securite-chantier', titre: 'Sécurité chantier (HSE)', domaine: 'hse', ordre: 2, competence: 'securite-n1',
      cours: [
        {
          titre: 'Les EPI et les 9 principes de prévention', dureeMin: 12, missionPratique: 'dangers-sur-photo',
          blocs: [
            { type: 'texte', valeur: "Les Équipements de Protection Individuelle (casque, chaussures de sécurité, gilet, gants, lunettes, harnais…) sont la dernière barrière quand le risque n'a pas pu être supprimé. La prévention suit une hiérarchie : éviter le risque > évaluer > combattre à la source > adapter le travail > protection collective > protection individuelle > formation." },
            { type: 'exemple', valeur: "Travail en hauteur sur une dalle : d'abord garde-corps (protection collective), et seulement si impossible, harnais avec point d'ancrage (protection individuelle)." },
            { type: 'attention', valeur: "Un casque a une date de péremption (généralement 3 à 5 ans) et doit être remplacé après tout choc important, même sans fissure visible." },
          ],
        },
        {
          titre: 'Risques majeurs du chantier', dureeMin: 10,
          blocs: [
            { type: 'texte', valeur: "Les 4 tueurs du BTP : chutes de hauteur, engins de chantier (écrasement, renversement), effondrements de tranchées et électrocution. Chaque zone à risque doit être balisée, chaque tranchée de plus de 1,30 m blindée ou talutée." },
            { type: 'astuce', valeur: "Avant chaque tâche, prends 2 minutes pour te demander : « Qu'est-ce qui peut me blesser ici, et qu'est-ce que j'ai prévu contre ça ? » C'est le réflexe pré-task." },
          ],
        },
      ],
    },
    {
      slug: 'lecture-de-plans', titre: 'Lecture de plans', domaine: 'technique', ordre: 3, competence: 'lecture-plans',
      cours: [
        {
          titre: 'Échelles, cotations et symboles', dureeMin: 12, missionPratique: 'lecture-plan-poteau',
          blocs: [
            { type: 'texte', valeur: "Un plan au 1/50 signifie que 1 cm sur le papier représente 50 cm en réalité. Les cotes sont toujours en centimètres (plans archi) ou en mètres (plans VRD). On lit un dossier dans l'ordre : plan de situation → plan de masse → plans de niveaux → coupes → détails." },
            { type: 'exemple', valeur: "Sur un plan au 1/50, un mur mesuré à 6 cm sur papier fait en réalité 6 × 50 = 300 cm = 3,00 m." },
            { type: 'astuce', valeur: "Vérifie toujours l'échelle ET la date de révision du plan. Travailler sur un plan périmé est une cause classique de démolition-reconstruction." },
          ],
        },
        {
          titre: 'Plans de coffrage et de ferraillage', dureeMin: 12,
          blocs: [
            { type: 'texte', valeur: "Le plan de coffrage vu de dessus montre les éléments porteurs (poteaux, poutres, voiles, dalles) avec leurs dimensions. Le plan de ferraillage détaille les aciers : diamètre (HA8, HA10, HA12…), nombre, espacement et recouvrements." },
            { type: 'attention', valeur: "Le repère d'un poteau (ex. P3) doit correspondre entre le plan de coffrage, le plan de ferraillage et la nomenclature — toute incohérence se signale au bureau d'études AVANT de couler." },
          ],
        },
      ],
    },
    {
      slug: 'beton-et-ferraillage', titre: 'Béton et ferraillage', domaine: 'technique', ordre: 4, competence: 'beton-ferraillage',
      cours: [
        {
          titre: 'Composition et dosage du béton', dureeMin: 12, missionPratique: 'volume-beton-dalle',
          blocs: [
            { type: 'texte', valeur: "Le béton = ciment + sable + gravier + eau. Le dosage courant pour du béton de structure est 350 kg de ciment/m³. Trop d'eau = béton faible ; pas assez = béton non maniable. Le rapport eau/ciment est le facteur clé de la résistance." },
            { type: 'exemple', valeur: "Pour 1 m³ de béton dosé à 350 kg : environ 7 sacs de ciment de 50 kg, 400 L de sable, 800 L de gravier et 175 L d'eau (à ajuster selon l'humidité du sable)." },
            { type: 'astuce', valeur: "Règle de chantier : si le béton « brille » beaucoup dans la brouette, il y a probablement trop d'eau." },
          ],
        },
        {
          titre: "Le rôle des armatures", dureeMin: 10, missionPratique: 'controle-avant-coulage',
          blocs: [
            { type: 'texte', valeur: "Le béton résiste très bien à la compression mais mal à la traction : l'acier reprend les efforts de traction. L'enrobage (distance acier-surface) protège l'acier de la corrosion : 3 cm en extérieur, 5 cm en milieu agressif (bord de mer)." },
            { type: 'attention', valeur: "Des aciers qui touchent le fond du coffrage rouilleront : les cales d'enrobage ne sont pas optionnelles." },
          ],
        },
      ],
    },
    {
      slug: 'maconnerie-fondations', titre: 'Maçonnerie et fondations', domaine: 'technique', ordre: 5, competence: 'maconnerie',
      cours: [
        {
          titre: 'Fondations : transmettre les charges au sol', dureeMin: 12, missionPratique: 'quiz-materiaux',
          blocs: [
            { type: 'texte', valeur: "La fondation transmet le poids du bâtiment au sol. Selon la qualité du sol : semelles filantes (murs), semelles isolées (poteaux), radier (sol médiocre), pieux (sol profond). La profondeur hors-gel et l'assise sur le bon sol sont vérifiées en fond de fouille." },
            { type: 'exemple', valeur: "Pour une maison R+1 sur bon sol à Abidjan : semelles filantes de 50-60 cm de large, ancrées à 60-80 cm, avec béton de propreté de 5 cm." },
          ],
        },
        {
          titre: 'Monter un mur en agglos', dureeMin: 10,
          blocs: [
            { type: 'texte', valeur: "Les rangs se posent à joints décalés (appareillage), au cordeau, avec vérification du niveau et de l'aplomb tous les 2-3 rangs. Les chaînages verticaux et horizontaux (béton armé) solidarisent la maçonnerie — obligatoires en zone sismique." },
            { type: 'astuce', valeur: "Un mur qui « danse » au cordeau se corrige au rang suivant, jamais en tapant sur un mur dont le mortier a commencé sa prise." },
          ],
        },
      ],
    },
    {
      slug: 'metre-et-devis', titre: 'Métré et devis', domaine: 'gestion', ordre: 6, competence: 'metre-devis',
      cours: [
        {
          titre: 'Du plan aux quantités', dureeMin: 12, missionPratique: 'metre-mur-cloture',
          blocs: [
            { type: 'texte', valeur: "Le métré consiste à calculer les quantités d'ouvrage depuis les plans : surfaces (m²), volumes (m³), longueurs (ml), unités (u). Chaque quantité s'obtient méthodiquement : on liste, on mesure, on calcule, on vérifie l'ordre de grandeur." },
            { type: 'exemple', valeur: "Mur de clôture de 30 m de long, 2 m de haut, en agglos de 15 : surface = 60 m². À 10 agglos/m², il faut environ 600 agglos (+ 5 % de casse)." },
            { type: 'astuce', valeur: "Toujours vérifier l'ordre de grandeur : un devis de villa qui sort à 3 millions ou 300 millions de FCFA doit immédiatement éveiller le doute." },
          ],
        },
        {
          titre: 'Construire un devis avec la bibliothèque de prix', dureeMin: 12, missionPratique: 'devis-chambre-simple',
          blocs: [
            { type: 'texte', valeur: "Devis = quantités × prix unitaires. Le prix unitaire inclut fournitures, main-d'œuvre, matériel et frais généraux + marge. En Côte d'Ivoire, on raisonne en FCFA avec les prix du marché local (ciment, fer, agglos, main-d'œuvre journalière)." },
            { type: 'attention', valeur: "Un devis sans provision pour imprévus (5-10 %) est un devis qui perdra de l'argent." },
          ],
        },
      ],
    },
    {
      slug: 'logiciels-btp', titre: 'Logiciels BTP', domaine: 'logiciel', ordre: 7, competence: 'excel-btp',
      cours: [
        {
          titre: 'Excel pour le chantier', dureeMin: 12, missionPratique: 'excel-calcul-volumes',
          blocs: [
            { type: 'texte', valeur: "Excel est l'outil n°1 du BTP : métrés, devis, suivis de budget, plannings simples. Les fonctions clés : SOMME, SI, RECHERCHEV, et surtout des tableaux propres avec unités affichées." },
            { type: 'exemple', valeur: "Un tableau de métré type : colonne désignation, unité, longueur, largeur, hauteur, quantité = produit des dimensions." },
          ],
        },
        {
          titre: 'Word et le rapport de chantier', dureeMin: 8, missionPratique: 'rapport-journalier',
          blocs: [
            { type: 'texte', valeur: "Le rapport journalier trace ce qui s'est réellement passé : effectifs, travaux réalisés, matériaux reçus, incidents, météo. C'est un document contractuel en cas de litige sur les délais." },
            { type: 'astuce', valeur: "Un bon rapport se relit en 1 minute : des faits, des chiffres, pas d'opinions." },
          ],
        },
      ],
    },
    {
      slug: 'gestion-humaine', titre: 'Gestion humaine de chantier', domaine: 'management', ordre: 8, competence: 'gestion-humaine',
      cours: [
        {
          titre: "Diriger une équipe sur le terrain", dureeMin: 12, missionPratique: 'casque-refuse',
          blocs: [
            { type: 'texte', valeur: "Un chef d'équipe donne des consignes claires (quoi, où, comment, pour quand), vérifie la compréhension, et fait respecter la sécurité sans humilier. La fermeté sur les règles + le respect des personnes = la recette qui marche." },
            { type: 'exemple', valeur: "Un ouvrier refuse son casque « parce qu'il fait chaud » : on rappelle la règle, on explique le risque, on ne cède pas — et on valorise ceux qui respectent les consignes." },
            { type: 'astuce', valeur: "Critique en privé, félicite en public. L'inverse détruit la motivation d'une équipe en quelques jours." },
          ],
        },
      ],
    },
    {
      slug: 'topographie-implantation', titre: 'Topographie et implantation', domaine: 'technique', ordre: 9, competence: 'topographie',
      cours: [
        {
          titre: "Implanter un ouvrage", dureeMin: 12, missionPratique: 'quiz-topographie',
          blocs: [
            { type: 'texte', valeur: "L'implantation reporte le plan sur le terrain : on matérialise les axes avec des chaises et cordeaux, on vérifie les équerres (méthode 3-4-5 ou théodolite), on reporte les niveaux avec le niveau optique ou laser depuis un repère (borne, trait de niveau)." },
            { type: 'exemple', valeur: "Pour vérifier l'angle droit d'un bâtiment : mesure 3 m sur un côté, 4 m sur l'autre — la diagonale doit faire exactement 5 m." },
            { type: 'attention', valeur: "Une erreur d'implantation découverte après coulage des fondations = démolition. C'est l'étape où l'on prend le temps de tout revérifier." },
          ],
        },
      ],
    },
    {
      slug: 'geotechnique-sols', titre: 'Géotechnique et sols', domaine: 'technique', ordre: 10, competence: 'geotechnique',
      cours: [
        {
          titre: 'Connaître son sol avant de fonder', dureeMin: 12, missionPratique: 'quiz-geotechnique',
          blocs: [
            { type: 'texte', valeur: "Le sol porte tout : l'étude géotechnique (sondages, essais) détermine sa portance et le type de fondation. Sables = bonne portance mais attention à l'eau ; argiles = retrait-gonflement ; remblais non compactés = danger." },
            { type: 'exemple', valeur: "Une fissure en escalier sur un mur est souvent le signe d'un tassement différentiel : une partie du bâtiment s'enfonce plus que l'autre." },
            { type: 'astuce', valeur: "L'eau est l'ennemi n°1 des fondations : drainage et gestion des eaux pluviales se pensent dès la conception." },
          ],
        },
      ],
    },
    {
      slug: 'controle-qualite-chantier', titre: 'Contrôle qualité', domaine: 'hse', ordre: 11, competence: 'controle-qualite',
      cours: [
        {
          titre: 'Contrôler, tracer, corriger', dureeMin: 10, missionPratique: 'quiz-controle-qualite',
          blocs: [
            { type: 'texte', valeur: "La qualité se contrôle à chaque étape : réception des matériaux (bons de livraison, aspect), contrôles en cours (slump test, enrobages, aplombs) et essais (éprouvettes béton écrasées à 7 et 28 jours). Toute non-conformité se trace sur une fiche NC." },
            { type: 'exemple', valeur: "Slump test : on remplit le cône d'Abrams en 3 couches piquées, on soulève, on mesure l'affaissement. 5-9 cm = béton plastique correct pour la plupart des ouvrages courants." },
          ],
        },
      ],
    },
    {
      slug: 'reception-travaux', titre: 'Réception des travaux', domaine: 'gestion', ordre: 12, competence: 'reception-travaux',
      cours: [
        {
          titre: 'PV, réserves et garanties', dureeMin: 10, missionPratique: 'quiz-reception-travaux',
          blocs: [
            { type: 'texte', valeur: "La réception est l'acte par lequel le maître d'ouvrage accepte l'ouvrage. Elle peut être prononcée avec réserves (défauts listés à corriger). Elle déclenche les garanties : parfait achèvement (1 an), bon fonctionnement (2 ans), décennale (10 ans, solidité)." },
            { type: 'attention', valeur: "Sans PV de réception signé, les garanties ne courent pas et les responsabilités restent floues. On ne « livre » jamais un chantier sur une poignée de main." },
          ],
        },
      ],
    },
    {
      slug: 'planification-chantier', titre: 'Planification de chantier', domaine: 'gestion', ordre: 13, competence: 'decision-chantier',
      cours: [
        {
          titre: 'Le planning, colonne vertébrale du chantier', dureeMin: 12, missionPratique: 'quiz-planification',
          blocs: [
            { type: 'texte', valeur: "Le planning Gantt liste les tâches, leurs durées et leurs liens (fin-début, parallèles). Le chemin critique est la chaîne de tâches sans marge : tout retard sur elle décale la livraison. On pilote le chantier en comparant avancement réel vs planifié chaque semaine." },
            { type: 'exemple', valeur: "Si le ferraillage du plancher prend 2 jours de retard et qu'il est sur le chemin critique, le coulage, le décoffrage et TOUTE la suite glissent de 2 jours." },
            { type: 'astuce', valeur: "Prévois les commandes longues (charpente, menuiseries) dès le début : le délai fournisseur tue plus de plannings que la pluie." },
          ],
        },
      ],
    },
    {
      slug: 'materiaux-construction', titre: 'Matériaux de construction', domaine: 'technique', ordre: 14, competence: 'maconnerie',
      cours: [
        {
          titre: 'Ciment, granulats, aciers : bien choisir', dureeMin: 10, missionPratique: 'quiz-materiaux',
          blocs: [
            { type: 'texte', valeur: "Le ciment se choisit selon l'usage (CEM I/II, classes 32,5 / 42,5). Les granulats doivent être propres (pas de terre ni matières organiques). Les aciers HA (haute adhérence) se stockent hors sol et hors boue. Tout matériau se réceptionne : quantité, qualité, conformité au bon de commande." },
            { type: 'attention', valeur: "Un sac de ciment durci en surface a pris l'humidité : sa résistance n'est plus garantie. Stockage sur palettes, sous abri, 10 sacs de hauteur max." },
          ],
        },
      ],
    },
    {
      slug: 'coffrage-etaiement', titre: 'Coffrage et étaiement', domaine: 'technique', ordre: 15, competence: 'beton-ferraillage',
      cours: [
        {
          titre: 'Mouler et soutenir le béton', dureeMin: 10, missionPratique: 'quiz-coffrage',
          blocs: [
            { type: 'texte', valeur: "Le coffrage donne sa forme au béton et doit résister à sa poussée (importante en pied de voile). L'étaiement soutient les planchers tant que le béton n'est pas autoporteur. Étanchéité des joints, huile de décoffrage, contreventement : les 3 vérifications de base." },
            { type: 'attention', valeur: "On ne retire JAMAIS un étai sans consigne du responsable : un plancher jeune peut s'effondrer sous son propre poids." },
          ],
        },
      ],
    },
    {
      slug: 'vrd-assainissement', titre: 'VRD et assainissement', domaine: 'technique', ordre: 16, competence: 'bases-btp',
      cours: [
        {
          titre: 'Réseaux et écoulements', dureeMin: 10, missionPratique: 'quiz-vrd',
          blocs: [
            { type: 'texte', valeur: "Les VRD (Voirie et Réseaux Divers) comprennent voirie, adduction d'eau, eaux usées, eaux pluviales, électricité, télécom. Les canalisations gravitaires exigent une pente régulière (souvent ≥ 1 %) et des regards de visite aux changements de direction." },
            { type: 'exemple', valeur: "Un caniveau bouché à Abidjan en saison des pluies = quartier inondé. Le dimensionnement et l'entretien des réseaux pluviaux sont vitaux." },
          ],
        },
      ],
    },
    // ── Modules logiciels (cours pro + quiz dédiés) ──
    {
      slug: 'autocad-plans', titre: 'AutoCAD — lire des plans DWG', domaine: 'logiciel', ordre: 17, competence: 'autocad-lecture',
      cours: [
        {
          titre: "Naviguer dans un dessin AutoCAD", dureeMin: 12, missionPratique: 'quiz-autocad',
          blocs: [
            { type: 'texte', valeur: "AutoCAD est le standard du dessin technique 2D. Le fichier natif est le DWG. Le dessin vit dans l'espace objet en vraie grandeur (1 unité = 1 mm ou 1 m selon le gabarit) ; les mises en page d'impression se font dans l'espace présentation, où chaque fenêtre applique une échelle (1/50, 1/100…)." },
            { type: 'texte', valeur: "Les calques organisent le dessin : murs, cotations, textes, mobilier, réseaux… On les allume/éteint pour isoler l'information utile. Les commandes essentielles du lecteur de plans : ZOOM/PAN (naviguer), DIST (mesurer), PROPRIETES (interroger un objet), CALQUE (filtrer)." },
            { type: 'exemple', valeur: "Tu reçois le DWG d'un plan de coffrage : tu éteins les calques 'mobilier' et 'textes archi', tu mesures l'entraxe des poteaux avec DIST, et tu vérifies l'épaisseur du voile avec PROPRIETES — sans jamais modifier le dessin." },
            { type: 'astuce', valeur: "Toujours travailler sur une COPIE du DWG reçu et vérifier ses unités (commande UNITES) avant toute mesure : un plan en pouces interprété en mètres a déjà causé des catastrophes." },
          ],
        },
      ],
    },
    {
      slug: 'revit-bim-initiation', titre: 'Revit & BIM — la maquette numérique', domaine: 'logiciel', ordre: 18, competence: 'revit-bim',
      cours: [
        {
          titre: 'Comprendre le BIM et la maquette', dureeMin: 14, missionPratique: 'quiz-bim',
          blocs: [
            { type: 'texte', valeur: "Le BIM (Building Information Modeling) est une méthode de travail : tous les acteurs collaborent autour d'une maquette numérique 3D dont chaque objet porte des informations (matériau, dimensions, niveau, coût…). Revit est le logiciel BIM le plus répandu ; ses « familles » (murs, poteaux, fenêtres) sont des objets paramétriques intelligents." },
            { type: 'texte', valeur: "Trois usages clés sur chantier : visualiser l'ouvrage en 3D avant de le construire, détecter les clashs (une gaine qui traverse une poutre) avant qu'ils coûtent cher, et extraire des nomenclatures (quantités, surfaces) fiables pour le métré." },
            { type: 'exemple', valeur: "Sur la villa R+1 du projet : la maquette révèle que la descente d'eau pluviale traverse le linteau du salon. Détecté en réunion BIM = 1 heure de re-routage. Détecté au chantier = démolition partielle du linteau." },
            { type: 'astuce', valeur: "Le LOD (niveau de développement) évite de sur-modéliser : inutile de dessiner chaque vis en phase d'avant-projet. LOD 200-300 suffit pour les études, LOD 400 pour l'exécution." },
          ],
        },
      ],
    },
    {
      slug: 'excel-btp-avance', titre: 'Excel BTP avancé', domaine: 'logiciel', ordre: 19, competence: 'excel-btp',
      cours: [
        {
          titre: 'Du métré au devis automatisé', dureeMin: 14, missionPratique: 'quiz-excel-avance',
          blocs: [
            { type: 'texte', valeur: "Un classeur de devis professionnel s'organise en feuilles : Métré (quantités calculées), Bibliothèque de prix (désignation, unité, prix unitaire), DQE (devis quantitatif estimatif qui relie les deux). RECHERCHEV va chercher le prix unitaire dans la bibliothèque : plus aucune ressaisie, plus d'erreur de copie." },
            { type: 'texte', valeur: "Les références absolues ($A$1) verrouillent les cellules de paramètres (taux de TVA, coefficient de frais généraux) pendant les recopies. SOMME.SI totalise par lot (gros œuvre, second œuvre). La mise en forme conditionnelle colore automatiquement les dépassements de budget." },
            { type: 'exemple', valeur: "DQE d'une chambre : la colonne Montant contient =Quantité × RECHERCHEV(Désignation; BibliothequePrix; 3; FAUX). Changer un prix dans la bibliothèque met à jour tout le devis instantanément." },
            { type: 'astuce', valeur: "Fige les volets sous la ligne d'en-tête et nomme tes plages (Formules > Gestionnaire de noms) : =RECHERCHEV(A2; PrixCI; 3; FAUX) se relit mieux que des références cryptiques." },
            { type: 'attention', valeur: "RECHERCHEV avec VRAI (valeur approchée) au lieu de FAUX renvoie des prix faux sans avertissement. Toujours FAUX pour une correspondance exacte." },
          ],
        },
      ],
    },
    {
      slug: 'msproject-planning', titre: 'MS Project — piloter le planning', domaine: 'logiciel', ordre: 20, competence: 'decision-chantier',
      cours: [
        {
          titre: 'Construire et suivre un planning de chantier', dureeMin: 14, missionPratique: 'quiz-msproject',
          blocs: [
            { type: 'texte', valeur: "MS Project structure le chantier en tâches hiérarchisées (phases > tâches > sous-tâches), reliées par des liens de dépendance : fin-début (le plus courant), début-début (tâches parallèles), avec décalages éventuels (+2 j de séchage). Les jalons (durée 0) marquent les événements clés : ordre de service, fin du gros œuvre, réception." },
            { type: 'texte', valeur: "Le logiciel calcule automatiquement le chemin critique (en rouge) : la chaîne de tâches sans marge. Avant le démarrage, on enregistre la ligne de base (baseline) — la photographie du planning contractuel — puis on saisit l'avancement réel chaque semaine pour visualiser les dérives." },
            { type: 'exemple', valeur: "Planning de la villa : Terrassement (3 j) → Fondations (5 j) → Élévation (10 j) → Dalle (4 j + 7 j de séchage en décalage) → Charpente. La livraison de la charpente (délai fournisseur 3 semaines) se commande dès le début : c'est elle qui pilote la fin." },
            { type: 'astuce', valeur: "Affiche toujours la colonne « Marge totale » : une tâche à marge nulle est critique, une marge qui fond de semaine en semaine est une alerte avant le retard." },
          ],
        },
      ],
    },
  ];

  // Seconds cours des modules récents — pour des modules complets, jamais un seul cours.
export const coursSupplementaires: Record<string, CoursSeed[]> = {
    'topographie-implantation': [
      {
        titre: 'Niveaux et altimétrie sur chantier', dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "Tous les niveaux du chantier se rapportent à un repère unique (borne ou trait de niveau ±0,00). Le niveau optique donne des lectures sur mire : dénivelé = lecture arrière − lecture avant. Le laser rotatif projette un plan horizontal continu, pratique pour caler fonds de fouille et arases." },
          { type: 'exemple', valeur: "Fond de fouille prévu à −0,80 m : depuis le repère, lecture arrière 1,45 m. La mire posée en fond de fouille doit lire 1,45 + 0,80 = 2,25 m." },
          { type: 'astuce', valeur: "Referme toujours ton cheminement de nivellement sur le point de départ : l'écart de fermeture révèle immédiatement une erreur de lecture." },
        ],
      },
    ],
    'geotechnique-sols': [
      {
        titre: 'Choisir la fondation selon le sol', dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "Bon sol en surface → semelles filantes ou isolées. Sol moyen ou charges fortes → radier général qui répartit. Bon sol en profondeur seulement → pieux ou puits. Le rapport géotechnique donne la contrainte admissible qui dimensionne la surface d'appui : semelle = charge ÷ contrainte." },
          { type: 'exemple', valeur: "Poteau qui descend 30 tonnes sur un sol à 2 bars (20 t/m²) : surface de semelle nécessaire = 30 ÷ 20 = 1,5 m², soit environ 1,25 m × 1,25 m." },
          { type: 'attention', valeur: "Deux fondations voisines sur des sols différents (rocher d'un côté, remblai de l'autre) = tassement différentiel et fissures. On homogénéise ou on joint de rupture." },
        ],
      },
    ],
    'controle-qualite-chantier': [
      {
        titre: 'Les essais du béton', dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "À la livraison : vérification du bon (formulation, heure de départ — béton refusé au-delà de 2 h), slump test pour la consistance, confection d'éprouvettes. Les éprouvettes partent au laboratoire : écrasement à 7 jours (tendance, ~70 % de la résistance) et à 28 jours (valeur contractuelle, ex. C25/30 = 25 MPa sur cylindre)." },
          { type: 'exemple', valeur: "Éprouvette à 7 jours : 19 MPa pour un C25/30 attendu. 19 ÷ 0,7 ≈ 27 MPa projetés à 28 jours : le lot est sur la bonne trajectoire, pas d'alerte." },
          { type: 'astuce', valeur: "Marque chaque éprouvette (date, ouvrage, camion) au marqueur indélébile immédiatement : une éprouvette anonyme ne prouve plus rien." },
        ],
      },
    ],
    'reception-travaux': [
      {
        titre: 'Lever les réserves et clore le chantier', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "Après la réception avec réserves, l'entreprise corrige chaque défaut dans le délai convenu, puis provoque la visite de levée : chaque réserve levée est signée. Le dossier des ouvrages exécutés (DOE) — plans conformes à l'exécution, notices, PV d'essais — se remet au maître d'ouvrage pour l'exploitation du bâtiment." },
          { type: 'attention', valeur: "La retenue de garantie (souvent 5 %) n'est restituée qu'après levée de toutes les réserves : traîner sur une poignée de porte peut bloquer des millions de FCFA." },
        ],
      },
    ],
    'planification-chantier': [
      {
        titre: "Suivre l'avancement et gérer les dérives", dureeMin: 10,
        blocs: [
          { type: 'texte', valeur: "Chaque semaine : relever l'avancement physique réel de chaque tâche (%, quantités), le comparer au planifié, identifier les tâches critiques en retard, décider des actions (renfort d'équipe, travail samedi, re-séquencement) et tracer les causes (intempéries, attente de plans, retard fournisseur) pour justifier les délais." },
          { type: 'exemple', valeur: "L'élévation est à 60 % au lieu de 80 % : 2 jours de retard sur tâche critique. Décision : passer de 4 à 6 maçons pendant une semaine — coût de renfort inférieur aux pénalités de retard." },
          { type: 'astuce', valeur: "Un planning affiché dans le bungalow et mis à jour devant l'équipe crée un engagement collectif que les fichiers cachés ne produisent jamais." },
        ],
      },
    ],
    'materiaux-construction': [
      {
        titre: 'Stocker et réceptionner les matériaux', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "Ciment : sur palettes, sous abri sec, 10 sacs de hauteur max, rotation premier entré-premier sorti. Aciers : sur chevrons hors sol et hors boue, par diamètres étiquetés. Granulats : sur aires propres séparées (jamais sable et gravier mélangés). Chaque livraison se réceptionne : quantité, qualité, conformité au bon de commande — avant de signer le bon de livraison." },
          { type: 'attention', valeur: "Signer un bon de livraison sans vérifier vaut acceptation : les 50 sacs manquants deviennent introuvables juridiquement une fois le camion parti." },
        ],
      },
    ],
    'coffrage-etaiement': [
      {
        titre: 'Sécurité du coffrage et cadence de rotation', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "Les banches (coffrages-outils verticaux) exigent stabilisateurs et lest contre le vent — une banche non stabilisée tue. Les tours d'étaiement se montent d'aplomb sur appuis durs, goupilles en place. La rotation des coffrages (décoffrer tôt pour recoffrer plus loin) donne la cadence du gros œuvre : un jeu de banches bien géré coule un voile par jour." },
          { type: 'attention', valeur: "Vent annoncé > 85 km/h : les banches se couchent au sol ou se contreventent en croix. C'est une consigne d'arrêt, pas une option." },
        ],
      },
    ],
    'vrd-assainissement': [
      {
        titre: 'Poser un réseau enterré dans les règles', dureeMin: 8,
        blocs: [
          { type: 'texte', valeur: "La tranchée se dimensionne selon le diamètre et la profondeur (blindage au-delà de 1,30 m). Le lit de pose (sable, 10 cm) reçoit la canalisation, pente contrôlée au laser. L'enrobage de sable protège le tuyau, le grillage avertisseur se déroule 30 cm au-dessus, puis remblai compacté par couches de 30 cm." },
          { type: 'exemple', valeur: "Canalisation EU sur 40 m avec pente de 1 % : le fil d'eau descend de 40 cm entre le premier et le dernier regard — à vérifier au laser avant remblaiement, jamais après." },
        ],
      },
    ],
  };

  // Enrichissement pédagogique : chaque cours reçoit objectifs, approfondissements et synthèse.
  // Clé = titre du cours. Les lignes des blocs objectifs/retenir sont séparées par \n.
export const enrichissementCours: Record<string, { avant?: BlocSeed[]; apres?: BlocSeed[] }> = {
    'Le monde du BTP et ses acteurs': {
      avant: [{ type: 'objectifs', valeur: "Distinguer maître d'ouvrage, maître d'œuvre et entreprises\nConnaître le rôle du bureau de contrôle et du coordonnateur sécurité\nSituer chaque acteur dans la vie d'un projet réel" }],
      apres: [
        { type: 'texte', valeur: "Autour du trio de base gravitent des acteurs essentiels : le géotechnicien étudie le sol avant conception ; le bureau d'études structure calcule et dessine l'ossature ; le coordonnateur SPS organise la prévention quand plusieurs entreprises se côtoient ; les concessionnaires (eau, électricité, télécom) raccordent l'ouvrage. Dans les marchés publics ivoiriens s'ajoutent le contrôleur financier et les organismes de régulation des marchés." },
        { type: 'texte', valeur: "La relation contractuelle est le squelette du projet : le marché de travaux définit prix, délais, pénalités et modalités de paiement. L'entreprise ne reçoit d'ordres que du maître d'œuvre (jamais directement du client final sur le terrain), et toute modification passe par un ordre de service écrit — jamais verbal. Cette discipline documentaire protège toutes les parties en cas de litige." },
        { type: 'retenir', valeur: "MOA = paie et décide · MOE = conçoit et dirige · Entreprise = exécute\nLe bureau de contrôle est indépendant : il protège les futurs usagers\nAucune modification sans ordre de service écrit\nChaque acteur a un rôle contractuel précis — les court-circuiter crée les litiges" }],
    },
    "Le cycle de vie d'un projet": {
      avant: [{ type: 'objectifs', valeur: "Nommer les phases d'un projet de sa conception à sa maintenance\nComprendre le coût croissant des erreurs tardives\nSavoir quels documents sortent de chaque phase" }],
      apres: [
        { type: 'texte', valeur: "Détail des phases de conception : l'esquisse (ESQ) pose l'idée architecturale ; l'avant-projet sommaire (APS) fixe volumes et surfaces ; l'avant-projet définitif (APD) arrête les choix techniques et le budget ; le projet (PRO) produit les plans d'exécution et le descriptif détaillé. Vient ensuite la consultation : dossier d'appel d'offres, analyse des offres, mise au point du marché." },
        { type: 'exemple', valeur: "Sur un projet d'école de 500 millions FCFA : déplacer une cloison coûte 0 F à l'esquisse (un trait), ~500 000 F en phase PRO (reprise des plans et calculs), et plusieurs millions en phase chantier (démolition, reprise réseaux, retard)." },
        { type: 'retenir', valeur: "ESQ → APS → APD → PRO → appel d'offres → travaux → réception → exploitation\nPlus une erreur est détectée tard, plus elle coûte cher (règle du ×10 par phase)\nChaque phase fige des décisions : les remettre en cause après coûte" }],
    },
    'Les EPI et les 9 principes de prévention': {
      avant: [{ type: 'objectifs', valeur: "Connaître les EPI obligatoires et leur rôle exact\nAppliquer la hiérarchie de prévention avant de recourir aux EPI\nSavoir contrôler l'état de ses équipements" }],
      apres: [
        { type: 'texte', valeur: "Chaque EPI répond à un risque précis : le casque contre les chutes d'objets, les chaussures S3 contre l'écrasement et la perforation, les gants adaptés à la tâche (manutention, produits chimiques, soudure), la protection auditive au-delà de 80 dB, le masque anti-poussière pour la découpe et le ponçage, le harnais dès qu'il n'y a plus de protection collective en hauteur. Un EPI mal ajusté ou dégradé protège mal : sangle de casque réglée, chaussures lacées, harnais vérifié avant chaque usage." },
        { type: 'texte', valeur: "Les 9 principes de prévention forment une logique en cascade : 1. éviter le risque, 2. évaluer ce qui ne peut être évité, 3. combattre le risque à la source, 4. adapter le travail à l'homme, 5. tenir compte de l'évolution technique, 6. remplacer le dangereux par le moins dangereux, 7. planifier la prévention, 8. donner la priorité aux protections collectives, 9. former et informer. L'EPI n'arrive qu'en dernier — c'est le filet, pas la stratégie." },
        { type: 'retenir', valeur: "L'EPI est la DERNIÈRE barrière, jamais la première réponse\nProtection collective (garde-corps, filets) avant protection individuelle\nUn casque se remplace après tout choc, même sans fissure visible\nPas d'EPI adapté = pas de tâche : on ne négocie pas" }],
    },
    'Risques majeurs du chantier': {
      avant: [{ type: 'objectifs', valeur: "Identifier les 4 familles d'accidents mortels du BTP\nConnaître les parades collectives de chacune\nAdopter le réflexe d'analyse avant chaque tâche" }],
      apres: [
        { type: 'texte', valeur: "Chiffres à connaître : les chutes de hauteur représentent environ un tiers des décès du BTP. Toute zone de travail à plus de 2 m exige garde-corps (lisse à 1 m, sous-lisse, plinthe) ou harnais ancré. Les engins tuent par écrasement dans les angles morts : gilet haute visibilité, contact visuel avec le conducteur, zones de circulation séparées. Une tranchée de 1,50 m dans un sable peut s'effondrer en une seconde et 1 m³ de terre pèse 1,8 tonne : blindage ou talutage dès 1,30 m." },
        { type: 'exemple', valeur: "Analyse pré-tâche en 4 questions avant de descendre dans une fouille : Quelle profondeur ? (1,60 m → blindage obligatoire) Le blindage est-il posé ? Où sont les charges et engins en surface ? (à plus de 1 m du bord) Qui me surveille depuis la surface ?" },
        { type: 'retenir', valeur: "4 tueurs : chutes · engins · effondrements · électricité\nGarde-corps dès 2 m, blindage dès 1,30 m de fouille\n1 m³ de terre = 1,8 tonne : aucune chance sans blindage\n2 minutes d'analyse pré-tâche évitent l'accident d'une vie" }],
    },
    'Échelles, cotations et symboles': {
      avant: [{ type: 'objectifs', valeur: "Convertir les mesures papier en dimensions réelles à toutes les échelles\nLire cotations, niveaux et symboles normalisés\nOrganiser sa lecture d'un dossier de plans complet" }],
      apres: [
        { type: 'texte', valeur: "Les échelles usuelles ont chacune leur usage : 1/500 et 1/200 pour les plans de masse, 1/100 et 1/50 pour les plans d'étage, 1/20 pour les coupes de détail, 1/10 voire 1/5 pour les détails d'exécution. Les niveaux se lisent en altitude relative : ±0,00 est le niveau de référence (souvent le sol fini du RDC), +2,80 le dessus du plancher haut, −1,20 le fond de fouille. Symboles courants : hachures pleines = béton, croisillons = maçonnerie, cercle barré = poteau, double trait = mur porteur, trait fin = cloison." },
        { type: 'retenir', valeur: "Échelle 1/50 : 1 cm papier = 50 cm réel — 2 cm = 1 m\nToujours vérifier l'échelle ET l'indice de révision du plan\nOrdre de lecture : situation → masse → niveaux → coupes → détails\n±0,00 est la référence de tous les niveaux du chantier" }],
    },
    'Plans de coffrage et de ferraillage': {
      avant: [{ type: 'objectifs', valeur: "Différencier plan de coffrage et plan de ferraillage\nLire une nomenclature d'aciers\nDétecter une incohérence avant coulage" }],
      apres: [
        { type: 'texte', valeur: "La nomenclature d'aciers accompagne le plan de ferraillage : chaque repère (cadre, épingle, barre) y est décrit avec sa forme façonnée, son diamètre, sa longueur développée et sa quantité. Sur le plan, « 8HA12 e=15 » signifie 8 barres haute adhérence de 12 mm espacées de 15 cm. Les recouvrements (jonction entre deux barres, typiquement 50×diamètre) et les retours d'ancrage sont dessinés — les improviser sur le tas est interdit." },
        { type: 'exemple', valeur: "Contrôle croisé avant coulage du poteau P3 : le plan de coffrage donne 25×25 cm — le plan de ferraillage du P3 doit montrer des cadres compatibles (25 − 2×3 d'enrobage = cadres de 19×19 cm). Si le ferrailleur a des cadres de 22, quelqu'un s'est trompé : STOP, appel au bureau d'études." },
        { type: 'retenir', valeur: "Coffrage = les formes du béton · Ferraillage = les aciers dedans\n8HA12 e=15 : 8 barres HA de 12 mm tous les 15 cm\nRecouvrement typique = 50 fois le diamètre de la barre\nIncohérence entre plans = arrêt et appel au BE, jamais d'improvisation" }],
    },
    'Composition et dosage du béton': {
      avant: [{ type: 'objectifs', valeur: "Composer un béton et comprendre le rôle de chaque constituant\nDoser correctement selon l'usage de l'ouvrage\nMaîtriser l'impact de l'eau sur la résistance" }],
      apres: [
        { type: 'texte', valeur: "Les dosages de référence par usage : béton de propreté 150 kg/m³ (protéger le fond de fouille), béton de forme 250 kg/m³, béton armé courant 350 kg/m³, ouvrages exposés ou fortement sollicités 400 kg/m³. Le rapport eau/ciment idéal tourne autour de 0,5 : au-delà, chaque litre d'eau en trop crée des capillaires qui affaiblissent le béton — 10 % d'eau en trop peut coûter 20 % de résistance. La cure (maintenir le béton humide 7 jours : arrosage, bâches) est aussi importante que le dosage." },
        { type: 'exemple', valeur: "Commande pour une dalle de 12 m³ à 350 kg/m³ : 12 × 7 = 84 sacs de ciment, 12 × 0,4 = 4,8 m³ de sable, 12 × 0,8 = 9,6 m³ de gravier, eau ≈ 2 100 L à ajuster selon l'humidité du sable — plus 5 % de marge sur tout." },
        { type: 'retenir', valeur: "350 kg/m³ = le dosage du béton armé courant\nRapport eau/ciment ≈ 0,5 : l'eau en trop détruit la résistance\n1 m³ à 350 = 7 sacs + 400 L sable + 800 L gravier + ~175 L d'eau\nLa cure des 7 premiers jours fait la moitié de la qualité finale" }],
    },
    'Le rôle des armatures': {
      avant: [{ type: 'objectifs', valeur: "Comprendre pourquoi le béton a besoin d'acier\nPlacer les aciers là où l'ouvrage tire\nRespecter enrobages et façonnage" }],
      apres: [
        { type: 'schema', valeur: 'poutre-flexion' },
        { type: 'schema', valeur: 'enrobage' },

        { type: 'texte', valeur: "Où tire un ouvrage ? Une poutre sur deux appuis fléchit : sa fibre inférieure s'allonge (traction) — les aciers principaux vont en bas. Une console (balcon) tire en haut — les aciers vont en haut : inverser ce ferraillage est l'erreur qui fait tomber les balcons. Les cadres et étriers cousent le béton contre l'effort tranchant près des appuis. Dans un poteau, les aciers longitudinaux aident à la compression et les cadres empêchent leur flambement." },
        { type: 'attention', valeur: "Un acier plié puis déplié à chaud ou cintré trop serré est fragilisé de façon invisible. Le façonnage respecte des mandrins de cintrage minimum — on ne « redresse » jamais un acier à coups de masse pour rattraper une erreur d'implantation." },
        { type: 'retenir', valeur: "Béton = compression · Acier = traction : le duo est indissociable\nPoutre : aciers en bas · Console/balcon : aciers en HAUT\nEnrobage 3 cm (5 cm en bord de mer) : les cales sont vitales\nJamais de pliage-dépliage sauvage des aciers" }],
    },
    'Fondations : transmettre les charges au sol': {
      avant: [{ type: 'objectifs', valeur: "Choisir le type de fondation selon le sol et les charges\nDimensionner une semelle simple par la contrainte admissible\nContrôler un fond de fouille avant coulage" }],
      apres: [
        { type: 'schema', valeur: 'semelle' },

        { type: 'texte', valeur: "Le contrôle du fond de fouille est un moment clé : profondeur conforme au plan (hors gel, ancrage dans le bon sol), sol homogène et conforme au rapport géotechnique (le géotechnicien vient valider en cas de doute), fond propre et sec, béton de propreté coulé rapidement pour protéger le sol des intempéries. Un fond de fouille détrempé par une pluie doit être purgé de sa boue avant tout coulage." },
        { type: 'retenir', valeur: "La fondation adapte le bâtiment au sol, jamais l'inverse\nSurface de semelle = charge ÷ contrainte admissible du sol\nBéton de propreté (5 cm) : protège le sol et les aciers, toujours\nFond de fouille validé AVANT de couler — après, il est trop tard" }],
    },
    'Monter un mur en agglos': {
      avant: [{ type: 'objectifs', valeur: "Monter un mur droit, de niveau et d'aplomb\nRespecter l'appareillage et les chaînages\nDoser le mortier de pose correctement" }],
      apres: [
        { type: 'texte', valeur: "Le mortier de pose se dose à 300-350 kg de ciment par m³ de sable : assez gras pour coller, pas trop pour ne pas fissurer. Joints horizontaux et verticaux de 1 à 1,5 cm, pleins — les joints vides sont des ponts thermiques et des faiblesses. Le premier rang est décisif : posé sur une arase étanche parfaitement de niveau, il conditionne tout le mur. On tend le cordeau à chaque rang, on contrôle l'aplomb au fil à plomb ou au niveau tous les 2-3 rangs." },
        { type: 'exemple', valeur: "Rendement courant : un maçon et son aide posent 15 à 20 m² d'agglos par jour en travail soigné. Pour le mur de clôture de 45 m² du chantier Yopougon, compte 2,5 à 3 jours à deux — c'est exactement ce que le planning simule." },
        { type: 'retenir', valeur: "Joints décalés d'un demi-agglo minimum (appareillage)\nPremier rang parfait = mur parfait ; cordeau à chaque rang\nChaînages verticaux aux angles et tous les 5 m maximum\nJoints pleins de 1-1,5 cm — un joint vide est une fissure future" }],
    },
    'Du plan aux quantités': {
      avant: [{ type: 'objectifs', valeur: "Calculer surfaces, volumes et longueurs depuis un plan\nStructurer un métré vérifiable ligne par ligne\nContrôler ses ordres de grandeur" }],
      apres: [
        { type: 'texte', valeur: "Le métré professionnel suit le principe du « mode de métré » : on annonce comment on mesure (vide pour plein ou déduction des ouvertures, axes ou nus finis) et on s'y tient. Chaque ligne du métré cite sa source (plan, repère, cote) pour être vérifiable par un tiers. Les déductions s'appliquent avec des règles : une ouverture de moins de 0,5 m² ne se déduit généralement pas d'un mur — ces conventions évitent les litiges de règlement." },
        { type: 'retenir', valeur: "Un métré se vérifie ligne par ligne : source + calcul + unité\nAnnoncer son mode de métré et s'y tenir\nOrdres de grandeur : dalle ≈ 0,15 m³ de béton/m², mur ≈ 10 agglos/m²\nToujours +5 % de casse sur les matériaux" }],
    },
    'Construire un devis avec la bibliothèque de prix': {
      avant: [{ type: 'objectifs', valeur: "Composer un prix unitaire complet (déboursé + frais + marge)\nBâtir un DQE ordonné par lots\nProtéger sa marge avec les provisions" }],
      apres: [
        { type: 'texte', valeur: "Anatomie d'un prix unitaire : le déboursé sec (matériaux + main-d'œuvre + matériel directement consommés) est majoré des frais de chantier (installation, gardiennage, eau-électricité de chantier), des frais généraux de l'entreprise (10-15 % : bureaux, salaires administratifs) et de la marge (5-15 % selon le risque et la concurrence). Vendre au déboursé sec, c'est payer pour travailler. Le DQE s'organise par lots (terrassement, gros œuvre, second œuvre…) avec sous-totaux, TVA et récapitulatif." },
        { type: 'exemple', valeur: "PU du m³ de béton armé pour semelles : déboursé sec 95 000 F (matériaux 62 000 + main-d'œuvre 25 000 + matériel 8 000) + frais de chantier 8 % + frais généraux 12 % + marge 10 % ≈ 126 000 F/m³ HT. C'est ce raisonnement que le jeu simule dans tes devis." },
        { type: 'retenir', valeur: "PU = déboursé sec + frais chantier + frais généraux + marge\nDevis sans provision aléas (5-10 %) = chantier à perte\nDQE ordonné par lots avec sous-totaux : lisible = crédible\nComparer son total au ratio marché (prix/m² local) avant d'envoyer" }],
    },
    'Excel pour le chantier': {
      avant: [{ type: 'objectifs', valeur: "Construire des tableaux de métré propres et recalculables\nUtiliser SOMME, SI et les références de cellules\nPrésenter des chiffres exploitables par d'autres" }, { type: 'logiciel', valeur: 'excel' }],
      apres: [
        { type: 'texte', valeur: "Règles d'or d'un classeur de chantier : une donnée ne se saisit qu'une fois (toute répétition est une formule), les unités sont affichées dans les en-têtes, les cellules de saisie se distinguent des cellules calculées (fond coloré), et chaque feuille a un titre, une date et un auteur. Un classeur bien construit se recalcule intégralement quand une seule dimension change — c'est le test de qualité." },
        { type: 'retenir', valeur: "Une donnée = une seule saisie, le reste en formules\nUnités visibles dans chaque en-tête de colonne\n=SOMME(plage) pour les totaux, jamais d'addition manuelle\nUn bon classeur se recalcule tout seul quand une cote change" }],
    },
    'Word et le rapport de chantier': {
      avant: [{ type: 'objectifs', valeur: "Rédiger un rapport journalier factuel et complet\nStructurer un document professionnel réutilisable\nComprendre la valeur contractuelle du rapport" }, { type: 'logiciel', valeur: 'word' }],
      apres: [
        { type: 'texte', valeur: "Structure type du rapport journalier : identification (chantier, date, rédacteur, météo), effectifs par qualification, travaux réalisés avec quantités et localisation (« coulage voile V2, axe B, 12 m³ »), matériaux et matériels reçus, incidents et visites, besoins et points de blocage pour demain. Photos datées en annexe. En cas de réclamation sur les délais deux ans plus tard, ce sont ces rapports qui font foi devant l'expert." },
        { type: 'retenir', valeur: "Des faits, des chiffres, des localisations — zéro opinion\nMétéo et heures perdues systématiquement notées\nLe rapport journalier est une pièce contractuelle\nUn rapport se relit en 1 minute : structure fixe et concision" }],
    },
    "Diriger une équipe sur le terrain": {
      avant: [{ type: 'objectifs', valeur: "Donner des consignes claires et vérifier leur compréhension\nTenir la règle sans casser la motivation\nGérer les conflits avant qu'ils ne dégénèrent" }],
      apres: [
        { type: 'texte', valeur: "Une consigne complète tient en 5 points : quoi (la tâche précise), où (localisation exacte), comment (méthode et matériel), pour quand (échéance réaliste), et le point sécurité associé. Puis on fait reformuler : « explique-moi comment tu vas t'y prendre » révèle les malentendus avant qu'ils coûtent. Le conflit entre deux ouvriers se traite tôt, en privé, en écoutant les deux versions séparément — l'ignorer, c'est le laisser contaminer toute l'équipe (le jeu simule exactement cela avec le moral)." },
        { type: 'retenir', valeur: "Consigne = quoi + où + comment + quand + sécurité\nFaire reformuler : la compréhension se vérifie, ne se suppose pas\nCritique en privé, félicitations en public — jamais l'inverse\nFermeté sur les règles + respect des personnes = autorité durable" }],
    },
    "Implanter un ouvrage": {
      avant: [{ type: 'objectifs', valeur: "Matérialiser les axes d'un bâtiment avec chaises et cordeaux\nVérifier une équerre par la méthode 3-4-5\nReporter les niveaux depuis un repère fiable" }],
      apres: [
        { type: 'schema', valeur: 'triangle-345' },

        { type: 'texte', valeur: "Procédure d'implantation pas à pas : 1. reconnaître bornes et limites de propriété avec les documents d'urbanisme ; 2. tracer l'alignement de référence (souvent parallèle à la voie) ; 3. planter les chaises 1 m en dehors de l'emprise des fouilles pour qu'elles survivent au terrassement ; 4. tendre les cordeaux d'axes et vérifier chaque angle (3-4-5 ou théodolite) ; 5. contrôler les deux diagonales du rectangle — égales à ± 1 cm, sinon l'équerrage est faux ; 6. marquer les axes à la peinture au sol et faire valider avant de creuser." },
        { type: 'retenir', valeur: "Chaises HORS emprise des fouilles, sinon le terrassement les détruit\n3² + 4² = 5² : l'équerre se prouve, ne se devine pas\nDiagonales égales = rectangle vrai\nImplantation validée et contresignée AVANT le premier coup de pelle" }],
    },
    'Connaître son sol avant de fonder': {
      avant: [{ type: 'objectifs', valeur: "Reconnaître les grandes familles de sols et leurs comportements\nLire l'essentiel d'un rapport géotechnique\nRepérer les situations à risque (remblais, nappe, argiles)" }],
      apres: [
        { type: 'texte', valeur: "Le rapport géotechnique type contient : la coupe des sondages (nature et épaisseur des couches), le niveau de la nappe phréatique et ses fluctuations saisonnières, les résultats d'essais (pénétromètre, pressiomètre), la contrainte admissible retenue, et les recommandations de fondation avec leurs sujétions (rabattement de nappe, purge de remblais, drainage). C'est un document d'ingénierie : on applique ses conclusions, on ne les « adapte » pas au budget." },
        { type: 'retenir', valeur: "Sable = portance correcte mais sensible à l'eau\nArgile = retrait-gonflement : fissures si fondations légères\nRemblai non compacté = purge ou fondations profondes\nLa contrainte admissible du rapport n'est pas négociable" }],
    },
    'Contrôler, tracer, corriger': {
      avant: [{ type: 'objectifs', valeur: "Contrôler la qualité à chaque étape, pas seulement à la fin\nTracer les non-conformités pour les traiter vraiment\nConnaître les contrôles du béton frais et durci" }],
      apres: [
        { type: 'schema', valeur: 'cone-abrams' },

        { type: 'texte', valeur: "La fiche de non-conformité (FNC) suit un circuit précis : description factuelle avec photos et localisation, analyse de la cause (méthode des 5 pourquoi : on remonte à la cause racine), action curative (corriger le défaut), action corrective (empêcher la récidive), vérification de l'efficacité et clôture signée. Une FNC sans action corrective traite le symptôme, pas la maladie — le même défaut reviendra au prochain coulage." },
        { type: 'retenir', valeur: "Contrôler en amont coûte 10 fois moins que réparer en aval\nFNC : décrire → analyser la cause → corriger → prévenir → vérifier\nSlump test à chaque camion, éprouvettes à chaque coulage important\nUn défaut non tracé est un défaut qui reviendra" }],
    },
    'PV, réserves et garanties': {
      avant: [{ type: 'objectifs', valeur: "Comprendre les effets juridiques de la réception\nDistinguer les trois garanties et leurs durées\nGérer les réserves jusqu'à leur levée" }],
      apres: [
        { type: 'texte', valeur: "Les trois garanties déclenchées par la réception : le parfait achèvement (1 an) couvre tous les désordres signalés, quelle que soit leur gravité ; le bon fonctionnement (2 ans) couvre les équipements dissociables (menuiseries, robinetterie, ventilation) ; la décennale (10 ans) couvre ce qui compromet la solidité ou rend l'ouvrage impropre à sa destination (fissures structurelles, infiltrations généralisées, affaissements). L'assurance décennale de l'entreprise est obligatoire avant d'ouvrir le chantier — pas après." },
        { type: 'retenir', valeur: "Réception = transfert de garde + point de départ des garanties\n1 an parfait achèvement · 2 ans bon fonctionnement · 10 ans décennale\nRéserves listées au PV, délai de levée fixé, levées signées\nSans PV signé, tout reste flou : jamais de réception verbale" }],
    },
    'Le planning, colonne vertébrale du chantier': {
      avant: [{ type: 'objectifs', valeur: "Construire un enchaînement de tâches réaliste\nIdentifier et surveiller le chemin critique\nPiloter par les écarts entre prévu et réalisé" }],
      apres: [
        { type: 'texte', valeur: "Les durées se calculent, elles ne se devinent pas : quantité ÷ rendement d'équipe. 45 m² de mur à 18 m²/jour pour un binôme = 2,5 jours. On ajoute les temps masqués : séchages (7 jours avant de décoffrer une dalle), délais de livraison, validations du maître d'œuvre. Les tâches s'enchaînent par des liens logiques et le logiciel (ou le tableau) révèle le chemin critique. Un bon planning prévoit 10 % de marge météo en saison des pluies ivoirienne." },
        { type: 'retenir', valeur: "Durée = quantité ÷ rendement, jamais au pifomètre\nChemin critique = zéro marge : le surveiller chaque semaine\nSéchages et délais fournisseurs sont des tâches à part entière\nUn planning sans marge météo est un planning déjà en retard" }],
    },
    'Ciment, granulats, aciers : bien choisir': {
      avant: [{ type: 'objectifs', valeur: "Choisir le bon ciment selon l'usage\nJuger la qualité des granulats sur le chantier\nRéceptionner et stocker sans dégrader" }],
      apres: [
        { type: 'texte', valeur: "Tests de chantier simples : le sable serré dans la main ne doit ni tacher fortement la paume (argile) ni sentir la matière organique ; l'essai de la bouteille (sable + eau, on laisse décanter) révèle la couche d'argile en surface — au-delà de 10 %, sable à laver ou à refuser. Les aciers légèrement rouillés en surface restent utilisables (la rouille adhérente améliore même l'adhérence) mais un acier feuilletant qui perd de la section est à réformer." },
        { type: 'retenir', valeur: "Classe de ciment = résistance à 28 j : 32,5 courant, 42,5 structure\nEssai de la bouteille : plus de 10 % d'argile = sable refusé\nRouille superficielle acceptable, rouille feuilletante = réforme\nCiment : 10 sacs max en hauteur, sous abri, premier entré premier sorti" }],
    },
    'Mouler et soutenir le béton': {
      avant: [{ type: 'objectifs', valeur: "Préparer un coffrage sûr et étanche\nComprendre la poussée du béton frais\nDécoffrer et désétayer au bon moment" }],
      apres: [
        { type: 'texte', valeur: "Délais indicatifs de décoffrage par temps chaud (à moduler selon ciment et météo) : joues de poutres et voiles 24-48 h, dalles sur étais 7 jours avec désétaiement progressif, sous-faces de poutres 14-21 jours. Le désétaiement se fait du centre vers les appuis, jamais l'inverse. Par temps frais ou ciment lent, ces délais s'allongent — en cas de doute, l'écrasement d'une éprouvette d'information tranche." },
        { type: 'retenir', valeur: "La poussée du béton frais est hydrostatique : maximale en pied\nHuile de décoffrage avant ferraillage, jamais sur les aciers\nDécoffrage selon la résistance atteinte, pas selon l'impatience\nJamais retirer un étai sans consigne du responsable" }],
    },
    'Réseaux et écoulements': {
      avant: [{ type: 'objectifs', valeur: "Identifier les réseaux VRD et leurs règles propres\nComprendre pentes, regards et séparation EU/EP\nPrévenir les accrochages de réseaux existants" }],
      apres: [
        { type: 'schema', valeur: 'pente-vrd' },

        { type: 'texte', valeur: "Avant tout terrassement en zone équipée : demande de renseignements auprès des concessionnaires, repérage des réseaux existants, sondages manuels à l'approche. Le code couleur des grillages avertisseurs : rouge = électricité, jaune = gaz, bleu = eau potable, marron = assainissement, vert = télécom. Accrocher un câble 15 kV avec un godet, c'est l'accident grave assuré — les réseaux se cherchent à la main, pas à la pelle mécanique." },
        { type: 'retenir', valeur: "EU et EP séparés : ne jamais croiser les réseaux\nPente ≥ 1 % pour l'auto-curage, regards aux changements de direction\nGrillage avertisseur ~30 cm au-dessus de chaque réseau\nRéseaux existants : repérer puis sonder À LA MAIN" }],
    },
    'Naviguer dans un dessin AutoCAD': {
      avant: [{ type: 'objectifs', valeur: "Ouvrir et parcourir un DWG sans risque pour le dessin\nMesurer et interroger des objets fiablement\nExploiter calques et présentations" }, { type: 'logiciel', valeur: 'autocad' }],
      apres: [
        { type: 'texte', valeur: "Boîte à outils du lecteur de plans : ZOOM étendu pour retrouver un dessin « perdu », PAN pour se déplacer, DIST pour mesurer entre deux points d'accrochage (toujours activer l'accrochage aux extrémités/intersections, sinon on mesure du vide), PROPRIETES pour lire longueur, calque et type d'un objet, GEL/LIBERER de calques pour isoler la structure des cloisons. L'accrochage objet (OSNAP) est la différence entre une mesure exacte et une mesure « à peu près » — à peu près n'existe pas en exécution." },
        { type: 'retenir', valeur: "Travailler sur COPIE, vérifier les UNITES avant toute mesure\nMesurer avec accrochage objet actif, jamais à main levée\nCalques : isoler ce qu'on étudie, geler le reste\nEspace objet = vraie grandeur · présentation = mise en page" }],
    },
    'Comprendre le BIM et la maquette': {
      avant: [{ type: 'objectifs', valeur: "Définir le BIM au-delà du logiciel\nExploiter les données de la maquette (quantités, clashs)\nSituer les niveaux de détail (LOD) et leurs usages" }, { type: 'logiciel', valeur: 'revit' }],
      apres: [
        { type: 'texte', valeur: "Le processus BIM en pratique : chaque discipline (architecture, structure, fluides) modélise sa maquette ; elles se fédèrent régulièrement dans un modèle de coordination où un logiciel détecte les clashs ; les réunions BIM arbitrent les conflits AVANT l'exécution ; les nomenclatures alimentent métrés et commandes. Le format d'échange ouvert IFC permet la collaboration entre logiciels différents. Le BIM ne supprime pas les métiers — il supprime les mauvaises surprises." },
        { type: 'retenir', valeur: "BIM = méthode collaborative, Revit n'est qu'un outil\nLe « I » (information) vaut plus que la 3D\nClash détecté en réunion = 1 h · clash découvert au chantier = démolition\nIFC = format d'échange ouvert entre logiciels BIM" }],
    },
    'Du métré au devis automatisé': {
      avant: [{ type: 'objectifs', valeur: "Relier métré, bibliothèque de prix et DQE par formules\nFiabiliser avec références absolues et RECHERCHEV exacte\nMettre à jour un devis en quelques secondes" }, { type: 'logiciel', valeur: 'excel' }],
      apres: [
        { type: 'texte', valeur: "Architecture du classeur de devis pro : la feuille Métré calcule les quantités depuis les dimensions ; la feuille Bibliothèque centralise les prix unitaires (mise à jour mensuelle des prix ciment/fer qui fluctuent) ; la feuille DQE assemble tout par RECHERCHEV et calcule les montants ; une feuille Synthèse affiche les totaux par lot, la TVA et les ratios de contrôle (prix/m² comparé au marché). Changer le prix du ciment dans la bibliothèque met à jour tous les devis ouverts — zéro ressaisie, zéro oubli." },
        { type: 'retenir', valeur: "Métré → Bibliothèque → DQE : trois feuilles reliées par formules\nRECHERCHEV toujours avec FAUX (correspondance exacte)\n$ pour figer les références des paramètres (TVA, coefficients)\nRatio de contrôle final : ton prix/m² doit rester dans le marché" }],
    },
    'Construire et suivre un planning de chantier': {
      avant: [{ type: 'objectifs', valeur: "Structurer les tâches et leurs liens dans MS Project\nPoser jalons et ligne de base\nSuivre l'avancement et anticiper les dérives" }, { type: 'logiciel', valeur: 'msproject' }],
      apres: [
        { type: 'texte', valeur: "Routine hebdomadaire du pilote de planning : saisir le % d'avancement réel de chaque tâche en cours, comparer à la ligne de base (les barres grises sous les barres actuelles), examiner les tâches critiques en retard, simuler les actions correctives (renfort, re-séquencement) directement dans l'outil avant de décider, mettre à jour les jalons contractuels et diffuser un extrait lisible à l'équipe. Le planning ne sert que s'il vit — un planning figé au premier jour est un poster, pas un outil." },
        { type: 'retenir', valeur: "Jalon = durée nulle = événement contractuel à surveiller\nLien fin-début + décalage pour les séchages (FS + 7 j)\nLigne de base posée AVANT le premier jour de chantier\nRoutine hebdo : avancement réel → écarts → décisions" }],
    },
  };
