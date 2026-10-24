// Plateforme logistique : approvisionner les chantiers du quartier, du conteneur reçu à la livraison signée.
// Mécanique propre : compter, ranger, planifier une tournée et remplir les camions, en plein air sur la plateforme ;
// le bureau du dispatch suit les vrais chantiers du joueur (GET /chantiers/mine).
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

export const PROGRAMME_LOGISTIQUE: ProgrammeLieu = {
  slug: 'logistique', titre: 'Approvisionner les chantiers', cycle: 'tournée',
  mentor: { nom: 'Sékou Traoré', role: 'Chef de quai, Plateforme logistique' }, horaires: { ouverture: 5, fermeture: 19 },
  etapes: [
    { id: 'reception', nom: 'Réceptionner un conteneur', resume: 'Contrôler ce qui arrive avant de le signer : après, il est trop tard pour réclamer.', taches: [
      { id: 'scelle', zone: 'quai', titre: 'Scellé cassé', contenu: () => ({ type: 'situation', situation: s('scelle', 'Scellé cassé',
        'Le conteneur de carrelage arrive avec son scellé cassé.',
        ['Je photographie, j’écris la réserve sur le bon avant d’ouvrir, et je préviens le transporteur', 'La réserve écrite au moment de la réception est la seule preuve pour réclamer ce qui manque.'],
        [['J’ouvre et je verrai bien', 'Sans réserve préalable, le manquant sera à ta charge.'], ['Je refuse tout sans regarder', 'On constate d’abord : refuser sans motif bloque les chantiers pour rien.']]) }) },
      { id: 'palettes', zone: 'quai', titre: 'Compter les palettes', contenu: cycle => {
        const [rangees, colonnes, niveaux] = selon(cycle, [[2, 9, 2], [3, 8, 2], [2, 10, 3], [4, 6, 2]] as const), total = rangees * colonnes * niveaux;
        return { type: 'mesure', mesure: {
          titre: 'Compter les palettes', enonce: 'Les palettes de ciment sont gerbées dans le conteneur ; le bon en annonce un certain nombre.',
          donnees: [{ libelle: 'Rangées', valeur: String(rangees) }, { libelle: 'Palettes par rangée', valeur: String(colonnes) }, { libelle: 'Niveaux', valeur: String(niveaux) }],
          question: 'Nombre de palettes ?', unite: 'palettes', reponse: total, tolerance: 0,
          explication: `${rangees} × ${colonnes} × ${niveaux} = ${total} palettes : à comparer au bon de livraison avant de signer.` } };
      } },
    ] },
    { id: 'stockage', nom: 'Stocker selon les règles', resume: 'Un stock rangé, c’est des accidents évités et des produits qu’on retrouve.', taches: [
      { id: 'regles', zone: 'rayonnages', titre: 'Règles de stockage', contenu: () => ({ type: 'selection', selection: {
        titre: 'Règles de stockage', enonce: 'Tu ranges la livraison dans les racks de la plateforme.', consigne: 'Coche les bonnes règles.',
        options: [
          { texte: 'Les charges lourdes en bas des racks', attendu: true, explication: 'Le centre de gravité reste bas, le rack ne bascule pas.' },
          { texte: 'Les allées et les issues de secours dégagées', attendu: true, explication: 'Le chariot circule et on évacue sans obstacle.' },
          { texte: 'Les produits dangereux à part, avec leurs fiches de sécurité', attendu: true, explication: 'Solvants et bonbonnes ne se mélangent pas au reste.' },
          { texte: 'Premier entré, premier sorti', attendu: true, explication: 'Le ciment et les colles ont une date limite.' },
          { texte: 'La charge maximale de chaque rack affichée et respectée', attendu: true, explication: 'Un rack surchargé peut s’effondrer.' },
          { texte: 'Empiler jusqu’au plafond pour gagner de la place', attendu: false, explication: 'Les piles instables tombent sur les caristes.' },
          { texte: 'Ranger les bonbonnes de gaz près du bureau', attendu: false, explication: 'Un produit dangereux se stocke à l’écart, ventilé.' },
        ] } }) },
      { id: 'caces', zone: 'rayonnages', titre: 'Le chariot élévateur', contenu: () => ({ type: 'situation', situation: s('caces', 'Le chariot élévateur',
        'Un nouveau magasinier veut conduire le chariot élévateur ; il n’a pas son autorisation de conduite.',
        ['Je refuse tant qu’il n’est pas formé et autorisé', 'Conduire un chariot sans formation est une cause majeure d’accidents graves.'],
        [['Je le laisse faire, ce n’est pas compliqué', 'Une palette qui tombe ou un piéton renversé, et c’est le drame.'], ['Je le laisse faire s’il roule doucement', 'La vitesse n’est pas le seul danger : charge, équilibre, angles morts.']]) }) },
    ] },
    { id: 'tournee', nom: 'Planifier la tournée', resume: 'Le bon ordre de livraison : les urgences d’abord, le moins de kilomètres possible.', taches: [
      { id: 'kilometres', zone: 'dispatch', titre: 'Distance de la tournée', contenu: cycle => {
        const [a, ab, bc, retour] = selon(cycle, [[12, 6, 9, 18], [8, 5, 7, 14], [15, 4, 10, 20], [10, 8, 6, 12]] as const), total = a + ab + bc + retour;
        return { type: 'mesure', mesure: {
          titre: 'Distance de la tournée', enonce: 'Un camion livre trois chantiers dans la matinée, puis revient à la plateforme.',
          donnees: [{ libelle: 'Plateforme → chantier A', valeur: `${a} km` }, { libelle: 'A → B', valeur: `${ab} km` }, { libelle: 'B → C', valeur: `${bc} km` }, { libelle: 'C → plateforme', valeur: `${retour} km` }],
          question: 'Distance totale, en km ?', unite: 'km', reponse: total, tolerance: 0,
          explication: `${a} + ${ab} + ${bc} + ${retour} = ${total} km, de quoi estimer le carburant et l’heure de retour.` } };
      } },
      { id: 'priorite', zone: 'dispatch', titre: 'Ordre des livraisons', contenu: () => ({ type: 'situation', situation: s('priorite', 'Ordre des livraisons',
        'Ce matin : une toupie de béton prêt à l’emploi pour une dalle, et des agglos pour un autre chantier.',
        ['La toupie part d’abord : le béton doit être coulé dans l’heure et demie', 'Le béton commence à prendre : en retard, il devient inutilisable. Les agglos peuvent attendre.'],
        [['Les agglos d’abord, c’est sur la route', 'Le béton risque de prendre dans la toupie.'], ['On livre tout en même temps', 'Un seul chauffeur ne peut pas être à deux endroits.']]) }) },
    ] },
    { id: 'chargement', nom: 'Charger les camions', resume: 'Assez de camions, pas un kilo de trop, et une charge bien arrimée.', taches: [
      { id: 'camions', zone: 'quai', titre: 'Nombre de camions', contenu: cycle => {
        const [tonnes, charge] = selon(cycle, [[46, 19], [58, 12], [33, 15], [70, 26]] as const), camions = Math.ceil(tonnes / charge);
        return { type: 'mesure', mesure: {
          titre: 'Nombre de camions', enonce: 'Tous les matériaux du jour doivent partir ce matin, sans dépasser la charge utile.',
          donnees: [{ libelle: 'Matériaux à livrer', valeur: `${tonnes} t` }, { libelle: 'Charge utile d’un camion', valeur: `${charge} t` }],
          question: 'Nombre de camions nécessaires ?', unite: 'camions', reponse: camions, tolerance: 0,
          explication: `${tonnes} ÷ ${charge} = ${fr(tonnes / charge, 2)} : on arrondit au-dessus, ${camions} camions, pour ne surcharger aucun d’eux.` } };
      } },
      { id: 'arrimage', zone: 'quai', titre: 'Les fers qui dépassent', contenu: () => ({ type: 'situation', situation: s('arrimage', 'Les fers qui dépassent',
        'Les barres de 12 m dépassent de l’arrière du plateau.',
        ['Je les sangle sur cornières et je signale le dépassement d’un drapeau rouge', 'Une charge qui glisse ou qui n’est pas signalée peut tuer derrière le camion.'],
        [['Je roule doucement, ça tiendra', 'Au premier freinage, les barres glissent.'], ['Je les attache avec une corde à linge', 'Une corde ne retient pas une tonne d’acier.']]) }) },
    ] },
    { id: 'suivi', nom: 'Suivre les livraisons', resume: 'Prévenir les chantiers, tracer chaque livraison : la confiance se joue là.', taches: [
      { id: 'embouteillage', zone: 'dispatch', titre: 'Camion bloqué', contenu: () => ({ type: 'situation', situation: s('embouteillage', 'Camion bloqué',
        'Le chauffeur appelle : bloqué dans les embouteillages, il aura une heure de retard.',
        ['J’appelle le chef de chantier avec la nouvelle heure, pour qu’il réorganise son équipe', 'Prévenu, le chantier occupe son équipe autrement au lieu de l’attendre les bras croisés.'],
        [['Je ne dis rien, il arrivera bien', 'L’équipe attend pour rien, et la confiance s’use.'], ['Je dis au chauffeur de griller les feux', 'Jamais : la sécurité routière passe avant le planning.']]) }) },
      { id: 'bon', zone: 'dispatch', titre: 'Bon de livraison', contenu: () => ({ type: 'selection', selection: {
        titre: 'Bon de livraison', enonce: 'Tu prépares le bon qui accompagnera la livraison.', consigne: 'Coche ce qu’il doit indiquer.',
        options: [
          { texte: 'La date et l’heure de livraison', attendu: true, explication: 'Elles tracent quand le matériel est arrivé.' },
          { texte: 'La désignation et les quantités', attendu: true, explication: 'C’est ce que le chantier va contrôler.' },
          { texte: 'Le chantier et son adresse', attendu: true, explication: 'Pour livrer au bon endroit.' },
          { texte: 'La signature du réceptionnaire, et ses réserves', attendu: true, explication: 'La signature transfère la responsabilité ; les réserves la limitent.' },
          { texte: 'Le numéro personnel du chauffeur', attendu: false, explication: 'Ce n’est pas une information de livraison.' },
          { texte: 'La météo du jour', attendu: false, explication: 'Inutile sur un bon de livraison.' },
        ] } }) },
    ] },
  ],
};

/** Plateforme de 30 × 22 m en plein air, portail au sud : entrepôt et racks au nord, quai et camions, conteneurs, bureau du dispatch. */
export const PLAN_LOGISTIQUE: PlanLieu = {
  demiLargeur: 15, demiProfondeur: 11, ambiance: 'exterieur', depart: [0, 9.6],
  obstacles: [
    zone(-14.4, -2, -10.6, -6.8),      // racks de l'entrepôt
    zone(1, 14.4, -10.6, -7.6),        // quai de chargement
    zone(3, 5.5, -7.6, -.8),           // camion à quai, l'arrière contre le quai
    zone(9, 11.5, -7.6, -.8),          // second camion à quai
    zone(-14.6, -8, 2, 6),             // conteneurs
    zone(10, 14.8, 4, 8),              // bureau du dispatch
    zone(-1.6, -.4, -4.2, -3),         // chariot élévateur garé
  ],
  stations: { quai: [7.2, -5.5], rayonnages: [-8, -5.8], dispatch: [9, 6], suivi: [12.4, 3.2], mentor: [1.8, -1.6] },
  libelles: { quai: 'Quai de chargement', rayonnages: 'Racks de l’entrepôt', dispatch: 'Dispatch', suivi: 'Suivi des chantiers', mentor: 'Sékou' },
  mentor: { position: [1.8, -3], rotation: 0 },
};
