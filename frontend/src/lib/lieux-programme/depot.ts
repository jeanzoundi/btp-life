// Dépôt matériaux : la semaine d'une commande de chantier, de la réception d'un fournisseur à la facture.
// Mécanique propre : compter, préparer la bonne commande, peser le chargement et facturer, quantités changeant à chaque commande.
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

/** Masses et prix du dépôt (sacs de 50 kg, HA12 à 0,888 kg/m, agglo creux de 15 à 18 kg). */
export const MASSE_SAC = 50, MASSE_METRE_HA12 = .888, MASSE_AGGLO = 18;
export const PRIX = { sac: 5200, barre: 7600, agglo: 425 };
export const CHARGE_UTILE = 8000;

/** Commande du chantier, différente à chaque cycle : sacs de ciment, barres de HA12 de 12 m, agglos de 15. */
export function commande(cycle: number) {
  const [sacs, barres, agglos] = selon(cycle, [[40, 100, 250], [60, 80, 200], [50, 120, 300], [30, 90, 220]] as const);
  const masse = sacs * MASSE_SAC + barres * 12 * MASSE_METRE_HA12 + agglos * MASSE_AGGLO;
  return { sacs, barres, agglos, masse, montant: sacs * PRIX.sac + barres * PRIX.barre + agglos * PRIX.agglo };
}

export const PROGRAMME_DEPOT: ProgrammeLieu = {
  slug: 'fournisseur', titre: 'Commande d’un chantier', cycle: 'commande',
  mentor: { nom: 'Brou Kouassi', role: 'Chef de dépôt' }, horaires: { ouverture: 6, fermeture: 18 },
  etapes: [
    { id: 'reception', nom: 'Réception d’un fournisseur', resume: 'Contrôler la livraison de la cimenterie et ranger le ciment comme il faut.', taches: [
      { id: 'bon', zone: 'reception', titre: 'Bon de livraison', contenu: cycle => {
        const [annonce, palettes] = selon(cycle, [[400, 19], [300, 14], [500, 24], [360, 17]] as const), compte = palettes * 20;
        return { type: 'situation', situation: s('bon', 'Bon de livraison', `Le camion de la cimenterie livre du CPJ 45. Le bon annonce ${annonce} sacs ; tu comptes ${palettes} palettes de 20 sacs.`,
          [`Je signe pour ${compte} sacs, avec la réserve écrite sur le bon`, 'Une signature vaut acceptation : la réserve évite de payer des sacs jamais reçus.'],
          [[`Je signe pour ${annonce}, le chauffeur rapportera le reste`, 'Sans réserve écrite, le manque est perdu pour le dépôt.'], ['Je refuse toute la livraison', 'Le ciment livré est conforme : on accepte ce qui est là et on note l’écart.']]) };
      } },
      { id: 'abri', zone: 'reception', titre: 'Ciment sous l’orage', contenu: () => ({ type: 'situation', situation: s('abri', 'Ciment sous l’orage',
        'Une palette de ciment est restée dehors, posée à même le sol, sous un ciel d’orage.',
        ['Je la fais rentrer sous le hangar, sur palette, à l’abri de l’humidité', 'Le ciment fait prise dans le sac au contact de l’eau : il se stocke au sec, surélevé, pas plus de dix sacs de haut.'],
        [['Une bâche suffira', 'L’humidité remonte du sol et passe sous la bâche.'], ['Je la laisse, il sera vendu vite', 'Un sac mouillé durcit en quelques heures et devient invendable.']]) }) },
      { id: 'fifo', zone: 'stock', titre: 'Rotation du stock', contenu: () => ({ type: 'situation', situation: s('fifo', 'Rotation du stock',
        'Les nouveaux sacs sont rangés devant les anciens, plus faciles à attraper.',
        ['Je fais sortir les anciens en premier : premier entré, premier sorti', 'Un ciment se conserve environ trois mois : on écoule d’abord les plus anciens.'],
        [['Peu importe, c’est le même ciment', 'Les vieux sacs finissent par durcir au fond du stock.'], ['Je vends les anciens moins cher sans rien dire', 'Un ciment trop vieux doit être contrôlé, pas écoulé en cachette.']]) }) },
    ] },
    { id: 'inventaire', nom: 'Inventaire', resume: 'Compter le stock, comparer au logiciel, et comprendre les écarts avant de corriger.', taches: [
      { id: 'ecart', zone: 'stock', titre: 'Écart de stock', contenu: cycle => {
        const [logiciel, palettes, vrac] = selon(cycle, [[420, 18, 35], [310, 15, 4], [275, 13, 22], [500, 24, 12]] as const);
        return { type: 'mesure', mesure: {
          titre: 'Écart de stock', enonce: 'Inventaire du CPJ 45 sous le hangar.',
          donnees: [{ libelle: 'Stock selon le logiciel', valeur: `${logiciel} sacs` }, { libelle: 'Compté', valeur: `${palettes} palettes de 20 sacs et ${vrac} sacs en vrac` }],
          question: 'Écart (compté − logiciel), en sacs ?', unite: 'sacs', reponse: palettes * 20 + vrac - logiciel, tolerance: 0,
          explication: `Compté : ${palettes} × 20 + ${vrac} = ${palettes * 20 + vrac} sacs ; écart : ${palettes * 20 + vrac} − ${logiciel} = ${palettes * 20 + vrac - logiciel}.` } };
      } },
      { id: 'botte', zone: 'stock', titre: 'Masse d’une botte d’aciers', contenu: cycle => {
        const n = selon(cycle, [100, 80, 120, 90]), masse = n * 12 * MASSE_METRE_HA12;
        return { type: 'mesure', mesure: {
          titre: 'Masse d’une botte d’aciers', enonce: 'Les aciers se vendent à la barre mais se transportent au poids.',
          donnees: [{ libelle: 'Botte', valeur: `${n} barres de HA12 de 12 m` }, { libelle: 'Masse linéique du HA12', valeur: '0,888 kg/m' }],
          question: 'Masse de la botte, en kg ?', unite: 'kg', reponse: masse, tolerance: 3,
          explication: `${n} × 12 m × 0,888 kg/m ≈ ${fr(masse, 1)} kg.` } };
      } },
      { id: 'manque', zone: 'stock', titre: 'Sacs manquants', contenu: () => ({ type: 'situation', situation: s('manque', 'Sacs manquants',
        'L’inventaire montre des sacs manquants par rapport au logiciel.',
        ['Je cherche l’explication dans les bons de sortie et la casse, puis je corrige en le signalant', 'Un écart a une cause : vente non saisie, casse, vol. On la trouve avant de corriger.'],
        [['Je corrige le chiffre sans rien dire', 'L’écart se reproduira, et personne ne saura pourquoi.'], ['Je laisse le logiciel faux', 'Un stock faux fait promettre des livraisons impossibles.']]) }) },
    ] },
    { id: 'preparation', nom: 'Préparation de la commande', resume: 'Préparer exactement ce que le chantier a commandé, sans confondre les références.', taches: [
      { id: 'commande', zone: 'preparation', titre: 'Bon de commande', contenu: cycle => {
        const c = commande(cycle);
        return { type: 'selection', selection: {
          titre: 'Bon de commande', enonce: `Résidence Lagune II commande du ciment pour béton armé, les aciers des poteaux en HA12, des agglos de 15 pour les murs et du sable de rivière lavé.`,
          consigne: 'Coche les produits à préparer.',
          options: [
            { texte: `${c.sacs} sacs de CPJ 45`, attendu: true, explication: 'Le CPJ 45 est le ciment courant du béton armé.' },
            { texte: `${c.sacs} sacs de CPJ 35`, attendu: false, explication: 'Moins résistant, il sert surtout aux mortiers et enduits.' },
            { texte: `${c.barres} barres de HA12`, attendu: true, explication: 'Le diamètre demandé pour les poteaux.' },
            { texte: `${c.barres} barres de HA10`, attendu: false, explication: 'Un diamètre plus faible ne tient pas les charges calculées.' },
            { texte: `${c.agglos} agglos creux de 15`, attendu: true, explication: 'L’épaisseur des murs porteurs de la villa.' },
            { texte: `${c.agglos} agglos de 10`, attendu: false, explication: 'Réservés aux cloisons intérieures.' },
            { texte: '3 m³ de sable de rivière lavé', attendu: true, explication: 'Propre et sans sel, il convient au béton.' },
            { texte: '3 m³ de sable de mer', attendu: false, explication: 'Le sel fait rouiller les aciers : on ne l’emploie jamais pour le béton armé.' },
          ] } };
      } },
      { id: 'chariot', zone: 'preparation', titre: 'Chariot élévateur', contenu: () => ({ type: 'situation', situation: s('chariot', 'Chariot élévateur',
        'Le cariste roule avec une palette levée à deux mètres, un collègue debout sur les fourches pour la tenir.',
        ['J’arrête le chariot : personne sur les fourches, charge basse pendant le déplacement', 'Une charge haute fait basculer le chariot, et une chute des fourches peut tuer.'],
        [['Je les laisse, ils ont l’habitude', 'L’habitude ne stabilise pas un chariot.'], ['Je demande au collègue de bien se tenir', 'Personne ne monte sur les fourches, jamais.']]) }) },
    ] },
    { id: 'chargement', nom: 'Chargement et pesée', resume: 'Charger le plateau, arrimer, et vérifier au pont-bascule que la charge utile est respectée.', taches: [
      { id: 'masse', zone: 'pesee', titre: 'Masse du chargement', contenu: cycle => {
        const c = commande(cycle);
        return { type: 'mesure', mesure: {
          titre: 'Masse du chargement', enonce: 'Avant de passer au pont-bascule, on calcule la masse de la commande sur le plateau (le sable part en benne).',
          donnees: [{ libelle: 'Ciment', valeur: `${c.sacs} sacs de 50 kg` }, { libelle: 'Aciers', valeur: `${c.barres} barres de HA12 de 12 m (0,888 kg/m)` }, { libelle: 'Agglos', valeur: `${c.agglos} agglos de 18 kg` }],
          question: 'Masse totale, en kg ?', unite: 'kg', reponse: c.masse, tolerance: 15,
          explication: `${fr(c.sacs * MASSE_SAC)} + ${fr(c.barres * 12 * MASSE_METRE_HA12, 1)} + ${fr(c.agglos * MASSE_AGGLO)} ≈ ${fr(c.masse)} kg.` } };
      } },
      { id: 'surcharge', zone: 'pesee', titre: 'Charge utile', contenu: cycle => {
        const c = commande(cycle);
        return { type: 'situation', situation: c.masse <= CHARGE_UTILE
          ? s('surcharge', 'Charge utile', `Le pont-bascule confirme ${fr(c.masse)} kg, sous la charge utile de 8 t. Le chauffeur veut ajouter 40 sacs pour un autre client.`,
            ['Je refuse : avec deux tonnes de plus, le camion serait en surcharge', 'Un camion surchargé freine mal et use la route ; l’assurance ne couvre plus un accident.'],
            [['D’accord, c’est sur le chemin', 'Deux tonnes de plus dépassent la charge utile.'], ['Je les fais mettre en vrac sur la cabine', 'Rien ne se transporte sur la cabine.']])
          : s('surcharge', 'Charge utile', `Le pont-bascule affiche ${fr(c.masse)} kg pour une charge utile de 8 t.`,
            ['Je fais deux rotations, ou je retire une partie du chargement', 'Au-delà de la charge utile, le camion est dangereux et en infraction.'],
            [['On part quand même, ce n’est pas loin', 'La distance ne change rien au freinage d’un camion surchargé.'], ['Je fais dégonfler un peu les pneus', 'Les pneus ne portent pas plus pour autant : c’est encore plus dangereux.']]) };
      } },
      { id: 'arrimage', zone: 'chargement', titre: 'Arrimage', contenu: () => ({ type: 'situation', situation: s('arrimage', 'Arrimage',
        'Les palettes sont posées sur le plateau sans sangles, la ridelle arrière ouverte.',
        ['Je fais sangler chaque palette et fermer les ridelles avant le départ', 'Au premier freinage, une charge non arrimée glisse ou tombe sur la route.'],
        [['Le chauffeur roulera doucement', 'Un freinage d’urgence ne se prévoit pas.'], ['Une sangle pour tout le plateau suffit', 'Chaque palette doit être tenue.']]) }) },
    ] },
    { id: 'facturation', nom: 'Livraison et facture', resume: 'Faire signer le bon de livraison, établir la facture et appliquer les règles de paiement.', taches: [
      { id: 'facture', zone: 'comptoir', titre: 'Montant de la facture', contenu: cycle => {
        const c = commande(cycle);
        return { type: 'mesure', mesure: {
          titre: 'Montant de la facture', enonce: 'On facture la commande livrée sur le plateau (le sable est facturé à part).',
          donnees: [{ libelle: `${c.sacs} sacs de CPJ 45`, valeur: `${fr(PRIX.sac)} F le sac` }, { libelle: `${c.barres} barres de HA12`, valeur: `${fr(PRIX.barre)} F la barre` }, { libelle: `${c.agglos} agglos de 15`, valeur: `${fr(PRIX.agglo)} F l’agglo` }],
          question: 'Montant total, en F CFA ?', unite: 'F', reponse: c.montant, tolerance: 0,
          explication: `${fr(c.sacs * PRIX.sac)} + ${fr(c.barres * PRIX.barre)} + ${fr(c.agglos * PRIX.agglo)} = ${fr(c.montant)} F.` } };
      } },
      { id: 'signature', zone: 'chargement', titre: 'Bon de livraison', contenu: () => ({ type: 'situation', situation: s('signature', 'Bon de livraison',
        'Au chantier, le chauffeur dépose la marchandise et repart sans faire signer le bon de livraison.',
        ['Je fais signer le bon par le réceptionnaire du chantier, avec ses réserves éventuelles', 'Le bon signé prouve la livraison : sans lui, le client peut contester la facture.'],
        [['Le client sait bien qu’il a été livré', 'En cas de litige, seule la signature compte.'], ['Je le signe moi-même au retour', 'Signer à la place du client est un faux.']]) }) },
      { id: 'credit', zone: 'comptoir', titre: 'Paiement à crédit', contenu: () => ({ type: 'situation', situation: s('credit', 'Paiement à crédit',
        'Un client habituel veut emporter sa commande et payer « à la fin du mois », sans bon de commande signé.',
        ['Je demande un bon de commande signé ou un acompte, selon les règles du dépôt', 'Le crédit se trace : sans document signé, une créance est impossible à recouvrer.'],
        [['D’accord, je le connais bien', 'La confiance n’empêche pas les oublis ni les faillites.'], ['Je refuse de le servir à l’avenir', 'Il suffit de respecter la procédure : inutile de perdre un client.']]) }) },
    ] },
  ],
};

/** Dépôt de 30 × 22 m : hangar au nord, cour, cases à granulats à l'est, comptoir au sud-ouest, pont-bascule au sud. */
const COLONNES = [-13.5, -4.5, 4.5, 13.5].map(x => zone(x - .3, x + .3, -2.5, -1.9));
export const PLAN_DEPOT: PlanLieu = {
  demiLargeur: 15, demiProfondeur: 11, ambiance: 'exterieur', depart: [0, 9.6],
  obstacles: [
    zone(-13.4, -2.6, -10.8, -8.2),   // racks à aciers, au fond du hangar
    zone(.6, 6.4, -10.8, -8.2),       // racks à tubes et carrelage
    zone(-12.6, -5.4, -7, -3),        // palettes de ciment à l'abri
    ...COLONNES,                      // poteaux du hangar
    zone(8, 14.8, -.8, 8),            // cases à granulats
    zone(-14.6, -9.4, -.8, 2.6),      // agglos stockés dans la cour
    zone(-14.8, -11.4, 3.6, 8.6),     // comptoir et caisse, guichet tourné vers la cour
    zone(.8, 5.4, -1.4, 1.4),         // palettes de la commande préparée
    zone(-6.4, 1.4, 3, 6),            // camion du client
    zone(11.2, 12, 8.6, 9.8),         // borne du pont-bascule
  ],
  stations: { reception: [2.6, -4.4], stock: [-4.6, -5], preparation: [3.1, 2.4], chargement: [-2.4, 7], pesee: [6.6, 8.6], comptoir: [-10.3, 6.2], mentor: [-7.6, 8.6] },
  libelles: { reception: 'Réception', stock: 'Stock de ciment', preparation: 'Préparation', chargement: 'Camion du client', pesee: 'Pont-bascule', comptoir: 'Comptoir · caisse', mentor: 'Brou' },
  mentor: { position: [-8.2, 7.6], rotation: .9 },
};
