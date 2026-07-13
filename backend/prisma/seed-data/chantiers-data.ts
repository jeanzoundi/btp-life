export const MATERIAUX = {
    ciment: { nom: 'Ciment', unite: 'sac 50 kg', cout: 5500 },
    sable: { nom: 'Sable', unite: 'm³', cout: 15000 },
    gravier: { nom: 'Gravier', unite: 'm³', cout: 25000 },
    fer: { nom: 'Fer HA', unite: 'barre 12 m', cout: 4500 },
    agglos: { nom: 'Agglos 15', unite: 'unité', cout: 450 },
    planches: { nom: 'Planches coffrage', unite: 'unité', cout: 3000 },
  } as const;

export type PhaseGestion = { nom: string; joursEstimes: number; equipeMin: number; materiaux: Record<string, number>; missions: string[] };
export const chantiersGestion: Array<{
    slug: string; nom: string; typeProjet: 'DALLE' | 'CLOTURE' | 'CHAMBRE' | 'R_PLUS_1' | 'ROUTE' | 'URBAIN' | 'DALOT' | 'CANIVEAU' | 'ECOLE' | 'CENTRE_SANTE' | 'MAISON' | 'INDUSTRIEL'; budget: number; delaiJours: number;
    description: string; localisation: string; materiaux: Array<keyof typeof MATERIAUX>; phases: PhaseGestion[];
    /** Non défini = chantier classique. Défini = marché à appel d'offres (filière ENTREPRENEUR, voir soumettreOffre). */
    typeMarche?: 'PRIVE' | 'PUBLIC';
  }> = [
    {
      slug: 'dalle-riviera', nom: 'Dalle — Villa Riviera', typeProjet: 'DALLE', budget: 3500000, delaiJours: 15,
      description: "Réalisation de la dalle basse d'une villa : implante, ferraille, coule — en gérant stock, équipe et délais.",
      localisation: 'Riviera, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Implantation et coffrage', joursEstimes: 2, equipeMin: 1.5, materiaux: { 'Planches coffrage': 12 }, missions: ['implantation-topo'] },
        { nom: 'Ferraillage', joursEstimes: 4, equipeMin: 2.5, materiaux: { 'Fer HA': 60, 'Planches coffrage': 15 }, missions: ['controle-avant-coulage'] },
        { nom: 'Coulage de la dalle', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 70, Sable: 8, Gravier: 14 }, missions: ['volume-beton-dalle'] },
      ],
    },
    {
      slug: 'cloture-yopougon', nom: 'Clôture — Parcelle Yopougon', typeProjet: 'CLOTURE', budget: 1800000, delaiJours: 10,
      description: "Mur de clôture en agglos : fouilles, élévation, chaînage — un bon chantier d'apprentissage de la gestion.",
      localisation: 'Yopougon, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos'],
      phases: [
        { nom: 'Fouilles et semelle', joursEstimes: 3, equipeMin: 2, materiaux: { Ciment: 25, Sable: 3, Gravier: 5, 'Fer HA': 20 }, missions: ['metre-mur-cloture'] },
        { nom: 'Élévation des agglos', joursEstimes: 4, equipeMin: 2.5, materiaux: { 'Agglos 15': 600, Ciment: 20, Sable: 4 }, missions: [] },
        { nom: 'Chaînage et finitions', joursEstimes: 2, equipeMin: 2, materiaux: { Ciment: 10, 'Fer HA': 12, Sable: 1 }, missions: [] },
      ],
    },
    {
      slug: 'chambre-cocody', nom: 'Chambre simple — Cocody', typeProjet: 'CHAMBRE', budget: 4200000, delaiJours: 20,
      description: 'Une chambre annexe complète, des fondations aux enduits : le chantier le plus long, à toi de tenir budget et planning.',
      localisation: 'Cocody, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations', joursEstimes: 4, equipeMin: 2.5, materiaux: { Ciment: 30, Sable: 4, Gravier: 6, 'Fer HA': 25 }, missions: ['devis-chambre-simple'] },
        { nom: 'Élévation des murs', joursEstimes: 6, equipeMin: 3, materiaux: { 'Agglos 15': 900, Ciment: 25, Sable: 5 }, missions: [] },
        { nom: 'Toiture et chaînage', joursEstimes: 4, equipeMin: 2.5, materiaux: { Ciment: 15, 'Fer HA': 18, 'Planches coffrage': 25 }, missions: [] },
        { nom: 'Enduits et finitions', joursEstimes: 3, equipeMin: 2, materiaux: { Ciment: 20, Sable: 4 }, missions: [] },
      ],
    },
    // ── Grands chantiers (zone industrielle du monde virtuel) — seuils variés selon l'ambition,
    // et pour le pont un accès alternatif réservé à un poste précis (voir CONDITIONS_CHANTIER).
    {
      slug: 'amenagement-koumassi', nom: 'Aménagement — Voirie Koumassi', typeProjet: 'URBAIN', budget: 5800000, delaiJours: 22,
      description: "Un aménagement urbain complet : caniveaux, trottoirs, espaces verts. Premier pas vers les grands projets, dès le niveau 4.",
      localisation: 'Koumassi, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos'],
      phases: [
        { nom: 'Caniveaux et drainage', joursEstimes: 7, equipeMin: 3, materiaux: { Ciment: 35, Sable: 6, Gravier: 10, 'Fer HA': 15 }, missions: [] },
        { nom: 'Trottoirs et bordures', joursEstimes: 8, equipeMin: 3, materiaux: { 'Agglos 15': 500, Ciment: 30, Sable: 6 }, missions: [] },
        { nom: 'Espaces verts et finitions', joursEstimes: 7, equipeMin: 2.5, materiaux: { Ciment: 15, Sable: 4 }, missions: [] },
      ],
    },
    {
      slug: 'villa-r1-marcory', nom: 'Villa R+1 — Marcory', typeProjet: 'R_PLUS_1', budget: 9500000, delaiJours: 35,
      description: "Un vrai projet d'envergure : rez-de-chaussée, dalle intermédiaire et étage. Plus de phases, plus de matériaux à gérer, plus de responsabilités.",
      localisation: 'Marcory, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations renforcées', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 55, Sable: 7, Gravier: 12, 'Fer HA': 45 }, missions: [] },
        { nom: 'Rez-de-chaussée', joursEstimes: 8, equipeMin: 3.5, materiaux: { 'Agglos 15': 1400, Ciment: 45, Sable: 9, 'Fer HA': 20 }, missions: [] },
        { nom: 'Dalle intermédiaire', joursEstimes: 6, equipeMin: 3.5, materiaux: { Ciment: 60, Sable: 8, Gravier: 14, 'Fer HA': 55, 'Planches coffrage': 30 }, missions: [] },
        { nom: 'Étage', joursEstimes: 8, equipeMin: 3.5, materiaux: { 'Agglos 15': 1100, Ciment: 40, Sable: 8, 'Fer HA': 18 }, missions: [] },
        { nom: 'Toiture et finitions', joursEstimes: 8, equipeMin: 3, materiaux: { Ciment: 25, 'Fer HA': 20, 'Planches coffrage': 20 }, missions: [] },
      ],
    },
    {
      slug: 'route-abobo', nom: 'Voirie — Abobo', typeProjet: 'ROUTE', budget: 7200000, delaiJours: 25,
      description: "Un chantier de voirie : terrassement, fondation de chaussée, revêtement. Rien à voir avec le bâtiment — un vrai changement de rythme.",
      localisation: 'Abobo, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer'],
      phases: [
        { nom: 'Terrassement', joursEstimes: 6, equipeMin: 3, materiaux: { Gravier: 40, Sable: 10 }, missions: [] },
        { nom: 'Fondation de chaussée', joursEstimes: 8, equipeMin: 3.5, materiaux: { Gravier: 60, Ciment: 30, 'Fer HA': 10 }, missions: [] },
        { nom: 'Revêtement et finitions', joursEstimes: 6, equipeMin: 3, materiaux: { Ciment: 35, Sable: 12, Gravier: 20 }, missions: [] },
      ],
    },
    {
      slug: 'pont-bassam', nom: 'Pont — Franchissement Bassam', typeProjet: 'DALOT', budget: 14000000, delaiJours: 45,
      description: "Le chantier le plus exigeant : un vrai franchissement, piles et tablier. Réservé au niveau 8, ou accessible plus tôt aux chefs de chantier, conducteurs de travaux et ingénieurs structure confirmés.",
      localisation: 'Grand-Bassam',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Fondations et piles', joursEstimes: 12, equipeMin: 4, materiaux: { Ciment: 90, Sable: 14, Gravier: 22, 'Fer HA': 80 }, missions: [] },
        { nom: 'Coffrage du tablier', joursEstimes: 10, equipeMin: 4, materiaux: { 'Planches coffrage': 60, 'Fer HA': 40 }, missions: [] },
        { nom: 'Coulage du tablier', joursEstimes: 13, equipeMin: 4.5, materiaux: { Ciment: 100, Sable: 16, Gravier: 26, 'Fer HA': 50 }, missions: [] },
        { nom: 'Garde-corps et finitions', joursEstimes: 10, equipeMin: 3, materiaux: { Ciment: 20, 'Fer HA': 15 }, missions: [] },
      ],
    },
    // ── Palier au-delà du plafond de promotion (niveau 9) — la carrière plafonne à
    // conducteur-travaux, mais les chantiers continuent à grandir jusqu'au niveau 20.
    {
      slug: 'assainissement-yopougon', nom: 'Réseau d\'assainissement — Yopougon', typeProjet: 'CANIVEAU', budget: 8500000, delaiJours: 20,
      description: "Un réseau complet de drainage urbain : tranchées, caniveaux, regards de visite et raccordements. Débloqué au niveau 10.",
      localisation: 'Yopougon, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer'],
      phases: [
        { nom: 'Terrassement et tranchées', joursEstimes: 5, equipeMin: 3, materiaux: { Gravier: 30, Sable: 8 }, missions: [] },
        { nom: 'Pose des caniveaux et regards', joursEstimes: 8, equipeMin: 3.5, materiaux: { Ciment: 45, Sable: 10, Gravier: 15, 'Fer HA': 20 }, missions: [] },
        { nom: 'Raccordements et finitions', joursEstimes: 7, equipeMin: 3, materiaux: { Ciment: 20, Sable: 6 }, missions: [] },
      ],
    },
    {
      slug: 'groupe-scolaire-bouake', nom: 'Groupe scolaire — Bouaké', typeProjet: 'ECOLE', budget: 13000000, delaiJours: 30,
      description: "Plusieurs salles de classe, charpente et menuiseries : un vrai bâtiment public à livrer dans les règles. Débloqué au niveau 12.",
      localisation: 'Bouaké',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations et dallage', joursEstimes: 6, equipeMin: 3.5, materiaux: { Ciment: 60, Sable: 9, Gravier: 15, 'Fer HA': 50 }, missions: [] },
        { nom: 'Élévation des salles de classe', joursEstimes: 10, equipeMin: 4, materiaux: { 'Agglos 15': 1800, Ciment: 50, Sable: 10, 'Fer HA': 25 }, missions: [] },
        { nom: 'Charpente et toiture', joursEstimes: 8, equipeMin: 3.5, materiaux: { Ciment: 20, 'Fer HA': 25, 'Planches coffrage': 40 }, missions: [] },
        { nom: 'Menuiseries et finitions', joursEstimes: 6, equipeMin: 3, materiaux: { Ciment: 15, Sable: 5 }, missions: [] },
      ],
    },
    {
      slug: 'centre-sante-sanpedro', nom: 'Centre de santé — San-Pédro', typeProjet: 'CENTRE_SANTE', budget: 17500000, delaiJours: 38,
      description: "Un établissement de santé avec cloisons techniques et étanchéité renforcée — la précision compte plus que la vitesse. Débloqué au niveau 15.",
      localisation: 'San-Pédro',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations spéciales', joursEstimes: 7, equipeMin: 4, materiaux: { Ciment: 75, Sable: 11, Gravier: 18, 'Fer HA': 65 }, missions: [] },
        { nom: 'Élévation et cloisons techniques', joursEstimes: 10, equipeMin: 4, materiaux: { 'Agglos 15': 2000, Ciment: 55, Sable: 11, 'Fer HA': 30 }, missions: [] },
        { nom: 'Dalle et étanchéité', joursEstimes: 9, equipeMin: 4, materiaux: { Ciment: 65, Sable: 10, Gravier: 16, 'Fer HA': 40, 'Planches coffrage': 35 }, missions: [] },
        { nom: 'Réseaux et finitions', joursEstimes: 12, equipeMin: 3.5, materiaux: { Ciment: 30, Sable: 8 }, missions: [] },
      ],
    },
    {
      slug: 'lotissement-anyama', nom: 'Lotissement — Anyama', typeProjet: 'MAISON', budget: 22000000, delaiJours: 45,
      description: "Six maisons livrées ensemble, avec leur propre voirie interne : la coordination d'équipe devient le vrai défi. Débloqué au niveau 18.",
      localisation: 'Anyama, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Voirie interne et VRD', joursEstimes: 8, equipeMin: 4, materiaux: { Gravier: 50, Sable: 12, Ciment: 20 }, missions: [] },
        { nom: 'Fondations des maisons', joursEstimes: 8, equipeMin: 4.5, materiaux: { Ciment: 80, Sable: 12, Gravier: 20, 'Fer HA': 70 }, missions: [] },
        { nom: 'Élévation des maisons', joursEstimes: 12, equipeMin: 5, materiaux: { 'Agglos 15': 3500, Ciment: 70, Sable: 14, 'Fer HA': 35 }, missions: [] },
        { nom: 'Toitures et charpentes', joursEstimes: 9, equipeMin: 4, materiaux: { Ciment: 25, 'Fer HA': 30, 'Planches coffrage': 60 }, missions: [] },
        { nom: 'Finitions et VRD final', joursEstimes: 8, equipeMin: 3.5, materiaux: { Ciment: 25, Sable: 8 }, missions: [] },
      ],
    },
    {
      slug: 'complexe-industriel-sanpedro', nom: 'Complexe industriel — Zone portuaire San-Pédro', typeProjet: 'INDUSTRIEL', budget: 32000000, delaiJours: 60,
      description: "Le chantier le plus ambitieux du jeu : structure métallique, dalles industrielles, réseaux techniques. Réservé au niveau 20, ou accessible plus tôt aux conducteurs de travaux, ingénieurs structure et gérants confirmés.",
      localisation: 'Zone portuaire, San-Pédro',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Terrassement et fondations lourdes', joursEstimes: 10, equipeMin: 5, materiaux: { Ciment: 120, Sable: 18, Gravier: 30, 'Fer HA': 110 }, missions: [] },
        { nom: 'Structure et charpente métallique', joursEstimes: 14, equipeMin: 5.5, materiaux: { 'Fer HA': 150, 'Planches coffrage': 80, Ciment: 40 }, missions: [] },
        { nom: 'Dalles industrielles', joursEstimes: 12, equipeMin: 5, materiaux: { Ciment: 130, Sable: 20, Gravier: 34, 'Fer HA': 70 }, missions: [] },
        { nom: 'Réseaux techniques et équipements', joursEstimes: 14, equipeMin: 4.5, materiaux: { Ciment: 50, 'Fer HA': 40 }, missions: [] },
        { nom: 'Finitions et mise en service', joursEstimes: 10, equipeMin: 4, materiaux: { Ciment: 30, Sable: 10 }, missions: [] },
      ],
    },
    // ── Marchés à appel d'offres (filière ENTREPRENEUR uniquement) — remportés en soumettant
    // un prix concurrentiel plutôt que débloqués par niveau seul (voir soumettreOffre).
    {
      slug: 'marche-prive-extension-riviera', nom: 'Extension de villa — Client particulier, Riviera', typeProjet: 'DALLE', budget: 4500000, delaiJours: 18,
      typeMarche: 'PRIVE',
      description: "Un particulier veut agrandir sa villa. Marché privé : le prix pèse lourd dans la sélection, mais un dossier léger suffit.",
      localisation: 'Riviera, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'planches'],
      phases: [
        { nom: 'Fondations de l\'extension', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 35, Sable: 5, Gravier: 8, 'Fer HA': 28 }, missions: [] },
        { nom: 'Élévation et dalle', joursEstimes: 8, equipeMin: 3, materiaux: { Ciment: 40, Sable: 7, Gravier: 10, 'Fer HA': 22, 'Planches coffrage': 18 }, missions: [] },
        { nom: 'Finitions', joursEstimes: 5, equipeMin: 2.5, materiaux: { Ciment: 15, Sable: 3 }, missions: [] },
      ],
    },
    {
      slug: 'marche-prive-immeuble-marcory', nom: 'Immeuble de bureaux — Promoteur privé, Marcory', typeProjet: 'R_PLUS_1', budget: 13000000, delaiJours: 32,
      typeMarche: 'PRIVE',
      description: "Un promoteur privé lance un petit immeuble de bureaux. Marché privé plus ambitieux : réputation utile, mais le prix reste déterminant.",
      localisation: 'Marcory, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos', 'planches'],
      phases: [
        { nom: 'Fondations', joursEstimes: 6, equipeMin: 3.5, materiaux: { Ciment: 60, Sable: 9, Gravier: 15, 'Fer HA': 50 }, missions: [] },
        { nom: 'Structure et élévation', joursEstimes: 12, equipeMin: 4, materiaux: { 'Agglos 15': 1600, Ciment: 55, Sable: 11, 'Fer HA': 30, 'Planches coffrage': 25 }, missions: [] },
        { nom: 'Second œuvre', joursEstimes: 9, equipeMin: 3.5, materiaux: { Ciment: 25, Sable: 6 }, missions: [] },
        { nom: 'Finitions et livraison', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 15, Sable: 4 }, missions: [] },
      ],
    },
    {
      slug: 'marche-public-ecole-yopougon', nom: 'Réhabilitation d\'école publique — Mairie de Yopougon', typeProjet: 'ECOLE', budget: 9500000, delaiJours: 28,
      typeMarche: 'PUBLIC',
      description: "Appel d'offres de la mairie pour réhabiliter une école. Marché public : la réputation (valeur technique du dossier) compte presque autant que le prix.",
      localisation: 'Yopougon, Abidjan',
      materiaux: ['ciment', 'sable', 'gravier', 'fer', 'agglos'],
      phases: [
        { nom: 'Diagnostic et reprises de structure', joursEstimes: 6, equipeMin: 3.5, materiaux: { Ciment: 40, Sable: 6, Gravier: 10, 'Fer HA': 30 }, missions: [] },
        { nom: 'Reprise des salles de classe', joursEstimes: 10, equipeMin: 4, materiaux: { 'Agglos 15': 900, Ciment: 35, Sable: 7 }, missions: [] },
        { nom: 'Toiture et menuiseries', joursEstimes: 7, equipeMin: 3, materiaux: { Ciment: 15, 'Fer HA': 12 }, missions: [] },
        { nom: 'Finitions et réception', joursEstimes: 5, equipeMin: 3, materiaux: { Ciment: 12, Sable: 3 }, missions: [] },
      ],
    },
    {
      slug: 'marche-public-voirie-regionale', nom: 'Voirie communale — Conseil régional', typeProjet: 'ROUTE', budget: 21000000, delaiJours: 42,
      typeMarche: 'PUBLIC',
      description: "Le plus gros marché du jeu : réfection de voirie pour le conseil régional. Exige une réputation solide — la concurrence est rude et le dossier technique pèse lourd.",
      localisation: 'Zone régionale',
      materiaux: ['ciment', 'sable', 'gravier', 'fer'],
      phases: [
        { nom: 'Terrassement', joursEstimes: 9, equipeMin: 4.5, materiaux: { Gravier: 60, Sable: 14 }, missions: [] },
        { nom: 'Fondation de chaussée', joursEstimes: 12, equipeMin: 5, materiaux: { Gravier: 90, Ciment: 45, 'Fer HA': 15 }, missions: [] },
        { nom: 'Revêtement', joursEstimes: 12, equipeMin: 4.5, materiaux: { Ciment: 55, Sable: 18, Gravier: 30 }, missions: [] },
        { nom: 'Signalisation et finitions', joursEstimes: 9, equipeMin: 3.5, materiaux: { Ciment: 20, Sable: 6 }, missions: [] },
      ],
    },
  ];
