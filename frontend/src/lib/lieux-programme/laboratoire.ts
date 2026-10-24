// Laboratoire des matériaux : une campagne d'essais du béton d'un ouvrage, de la réception des éprouvettes au rapport.
// Mécanique propre : mesurer et calculer (affaissement, résistance, granulométrie), avec des chiffres qui changent à chaque campagne.
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

/** Section d'une éprouvette cylindrique de 16 × 32 cm, en mm². */
const SECTION = Math.PI * 80 * 80;
const resistance = (kN: number) => kN * 1000 / SECTION;
/** Écrasements à 28 jours de chaque campagne : deux sont conformes, deux ne le sont pas, pour des raisons différentes. */
const ECRASEMENTS_28: readonly [number, number, number][] = [[520, 540, 510], [480, 455, 500], [560, 575, 548], [505, 410, 515]];
const resultats28 = (cycle: number) => selon(cycle, ECRASEMENTS_28).map(resistance);
const conforme = (cycle: number) => { const r = resultats28(cycle), m = r.reduce((a, b) => a + b, 0) / 3; return { r, m, ok: m >= 25 && r.every(x => x >= 21) }; };

export const PROGRAMME_LABORATOIRE: ProgrammeLieu = {
  slug: 'laboratoire', titre: 'Campagne d’essais du béton', cycle: 'campagne',
  mentor: { nom: 'Adjoua Ehui', role: 'Responsable du laboratoire' }, horaires: { ouverture: 7, fermeture: 17 },
  etapes: [
    { id: 'reception', nom: 'Réception des échantillons', resume: 'Enregistrer les éprouvettes du chantier : origine, transport, et la section qui servira à tous les calculs.', taches: [
      { id: 'tracabilite', zone: 'accueil', titre: 'Éprouvettes sans fiche', contenu: () => ({ type: 'situation', situation: s('tracabilite', 'Éprouvettes sans fiche',
        'Trois cylindres de béton arrivent du chantier sans étiquette ni fiche de prélèvement.',
        ['Je les mets de côté et je demande la fiche : ouvrage, date, gâchée, classe', 'Sans traçabilité, un résultat ne prouve rien : on ne saurait pas à quel béton il correspond.'],
        [['Je les enregistre comme ceux d’hier', 'Deviner l’origine fausse tout le dossier qualité.'], ['Je les jette', 'On ne détruit pas un échantillon : on demande la fiche, il servira peut-être.']]) }) },
      { id: 'transport', zone: 'accueil', titre: 'Transport au soleil', contenu: () => ({ type: 'situation', situation: s('transport', 'Transport au soleil',
        'Des éprouvettes d’un jour ont voyagé deux heures en plein soleil, dans un coffre, sans protection.',
        ['Je les enregistre avec une réserve écrite sur les conditions de transport', 'Chaleur et chocs peuvent fausser la résistance : la réserve permettra d’interpréter le résultat.'],
        [['Je ne dis rien, ce sont des détails', 'Un résultat faible serait alors inexplicable, et le chantier accusé à tort.'], ['Je les mets à l’étuve pour rattraper', 'L’étuve sert à sécher les granulats, pas à conserver des éprouvettes.']]) }) },
      { id: 'section', zone: 'bureau', titre: 'Section d’une éprouvette', contenu: () => ({ type: 'mesure', mesure: {
        titre: 'Section d’une éprouvette', enonce: 'Pour calculer les résistances, il faut la section des cylindres du chantier.',
        donnees: [{ libelle: 'Éprouvette', valeur: 'cylindre de 16 cm de diamètre, 32 cm de haut' }],
        question: 'Section, en cm² ?', unite: 'cm²', reponse: Math.PI * 64, tolerance: 1,
        explication: `Rayon 8 cm : S = π × r² = π × 8 × 8 ≈ ${fr(Math.PI * 64, 1)} cm², soit ${fr(SECTION)} mm².` } }) },
    ] },
    { id: 'affaissement', nom: 'Essai d’affaissement', resume: 'Mesurer la consistance du béton frais au cône d’Abrams, et refuser ce qui sort de la commande (classe S2).', taches: [
      { id: 'affaissement', zone: 'beton-frais', titre: 'Mesure au cône', contenu: cycle => {
        const a = selon(cycle, [7.5, 9, 6, 8.5]);
        return { type: 'mesure', mesure: {
          titre: 'Mesure au cône', enonce: 'Le cône est démoulé : le béton s’est affaissé. On mesure du sol au sommet du béton.',
          donnees: [{ libelle: 'Hauteur du cône', valeur: '30 cm' }, { libelle: 'Hauteur du béton après démoulage', valeur: `${fr(30 - a, 1)} cm` }],
          question: 'Affaissement, en cm ?', unite: 'cm', reponse: a, tolerance: .2,
          explication: `Affaissement = 30 − ${fr(30 - a, 1)} = ${fr(a, 1)} cm : classe S2 (5 à 9 cm), un béton plastique, conforme à la commande.` } };
      } },
      { id: 'toupie', zone: 'beton-frais', titre: 'Toupie trop fluide', contenu: () => ({ type: 'situation', situation: s('toupie', 'Toupie trop fluide',
        'La toupie suivante donne 19 cm d’affaissement, alors que la commande demande S2. Le chauffeur propose d’ajouter du ciment dans la cuve.',
        ['Je refuse la toupie et je préviens le chef de chantier', 'Un béton trop fluide contient souvent trop d’eau : il sera moins résistant. Hors classe, il se refuse.'],
        [['J’accepte, il sera plus facile à couler', 'Plus facile à couler, mais plus faible : la consistance fait partie de la commande.'], ['J’accepte l’ajout de ciment', 'On ne corrige pas une toupie au jugé sur le chantier : on la refuse.']]) }) },
      { id: 'cone', zone: 'beton-frais', titre: 'Remplissage du cône', contenu: () => ({ type: 'situation', situation: s('cone', 'Remplissage du cône',
        'Un stagiaire remplit le cône d’un seul coup, tasse le béton du pied, puis le soulève en le tournant.',
        ['Trois couches piquées 25 fois à la tige, on arase, puis on soulève le cône bien droit', 'L’essai est normalisé : sinon, deux laboratoires ne trouveraient jamais la même valeur.'],
        [['Peu importe la méthode, seul le chiffre compte', 'Le chiffre dépend justement de la méthode.'], ['On remplit à moitié pour aller plus vite', 'Un cône à moitié plein ne mesure rien.']]) }) },
    ] },
    { id: 'eprouvettes', nom: 'Confection des éprouvettes', resume: 'Mouler les éprouvettes du béton livré, bien serrées, puis les laisser durcir 24 heures avant démoulage.', taches: [
      { id: 'volume', zone: 'paillasse', titre: 'Béton à prélever', contenu: cycle => {
        const n = selon(cycle, [6, 9, 6, 12]), v = Math.PI * .08 * .08 * .32 * 1000;
        return { type: 'mesure', mesure: {
          titre: 'Béton à prélever', enonce: `On confectionne ${n} éprouvettes : il faut prélever assez de béton dans la toupie.`,
          donnees: [{ libelle: 'Moule', valeur: 'cylindre 16 × 32 cm' }, { libelle: 'Nombre de moules', valeur: String(n) }],
          question: 'Volume total, en litres ?', unite: 'L', reponse: v * n, tolerance: .6,
          explication: `Un moule : π × 0,08² × 0,32 ≈ ${fr(v, 2)} L ; pour ${n} moules, ≈ ${fr(v * n, 1)} L. On prélève un peu plus pour l’essai d’affaissement.` } };
      } },
      { id: 'serrage', zone: 'paillasse', titre: 'Serrage du béton', contenu: () => ({ type: 'situation', situation: s('serrage', 'Serrage du béton',
        'Les moules sont remplis d’une seule couche, sans piquer ni vibrer.',
        ['Je fais remplir en couches serrées à la tige ou à la table vibrante, puis araser', 'Bien serré, le béton de l’éprouvette ressemble à celui de l’ouvrage ; des vides fausseraient la résistance.'],
        [['Le béton se tassera tout seul', 'Les bulles d’air restent prisonnières et affaiblissent l’éprouvette.'], ['Je tape le moule au marteau', 'Les chocs déforment le moule et ne serrent pas le béton.']]) }) },
      { id: 'demoulage', zone: 'paillasse', titre: 'Démoulage', contenu: () => ({ type: 'situation', situation: s('demoulage', 'Démoulage',
        'Un collègue veut démouler les éprouvettes une heure après leur confection, pour libérer les moules.',
        ['J’attends 24 heures, éprouvettes couvertes et à l’abri des chocs', 'Le béton est encore mou au bout d’une heure : démoulé trop tôt, il se déforme et se fissure.'],
        [['D’accord, on manque de moules', 'Une éprouvette abîmée donnera un faux résultat.'], ['Je les démoule et les laisse sécher au soleil', 'Le soleil fait sécher le béton trop vite : il perd de la résistance.']]) }) },
    ] },
    { id: 'sept-jours', nom: 'Cure et écrasement à 7 jours', resume: 'Conserver les éprouvettes dans l’eau à 20 °C, puis en écraser une à 7 jours pour voir si le béton est en bonne voie.', taches: [
      { id: 'bac', zone: 'cure', titre: 'Bac de conservation', contenu: () => ({ type: 'situation', situation: s('bac', 'Bac de conservation',
        'Le bac de conservation s’est vidé pendant la nuit : les éprouvettes sèchent à l’air.',
        ['Je remplis le bac, je vérifie la température et je note l’incident sur la fiche de cure', 'Les éprouvettes se conservent dans l’eau à 20 °C ; un incident doit être tracé pour interpréter les résultats.'],
        [['Ce n’est qu’une nuit, rien à signaler', 'Une nuit au sec peut faire perdre de la résistance : il faut le noter.'], ['Je les arrose de temps en temps', 'La norme demande une immersion à température constante, pas un arrosage.']]) }) },
      { id: 'fc7', zone: 'presse', titre: 'Écrasement à 7 jours', contenu: cycle => {
        const f = selon(cycle, [380, 395, 365, 410]);
        return { type: 'mesure', mesure: {
          titre: 'Écrasement à 7 jours', enonce: 'La presse écrase une éprouvette de 16 × 32 cm et affiche la force de rupture.',
          donnees: [{ libelle: 'Force de rupture', valeur: `${f} kN` }, { libelle: 'Section', valeur: `${fr(SECTION)} mm²` }],
          question: 'Résistance, en MPa ?', unite: 'MPa', reponse: resistance(f), tolerance: .25,
          explication: `fc = F ÷ S = ${fr(f * 1000)} N ÷ ${fr(SECTION)} mm² ≈ ${fr(resistance(f), 1)} MPa (1 MPa = 1 N/mm²). À 7 jours, un béton atteint environ 65 à 70 % de sa résistance finale : il est en bonne voie pour 25 MPa.` } };
      } },
    ] },
    { id: 'granulometrie', nom: 'Granulométrie du sable', resume: 'Contrôler le sable du chantier : sécher, tamiser, calculer le passant, et vérifier sa propreté.', taches: [
      { id: 'sechage', zone: 'granulometrie', titre: 'Échantillon humide', contenu: () => ({ type: 'situation', situation: s('sechage', 'Échantillon humide',
        'Pour aller vite, un technicien veut peser et tamiser le sable encore mouillé.',
        ['Je fais d’abord sécher l’échantillon à l’étuve jusqu’à masse constante', 'L’eau alourdit le sable et colle les grains : les pesées seraient fausses.'],
        [['L’eau ne pèse presque rien', 'Un sable humide peut contenir 5 à 10 % d’eau : c’est bien plus que la précision de l’essai.'], ['Je le sèche au soleil dix minutes', 'Dix minutes ne suffisent pas : on sèche jusqu’à ce que la masse ne change plus.']]) }) },
      { id: 'passant', zone: 'granulometrie', titre: 'Passant au tamis de 2 mm', contenu: cycle => {
        const r = selon(cycle, [120, 150, 90, 135]);
        return { type: 'mesure', mesure: {
          titre: 'Passant au tamis de 2 mm', enonce: 'Après tamisage de l’échantillon sec, on pèse ce qui reste sur le tamis de 2 mm.',
          donnees: [{ libelle: 'Masse de sable sec', valeur: '1 000 g' }, { libelle: 'Refus sur le tamis de 2 mm', valeur: `${r} g` }],
          question: 'Pourcentage passant à 2 mm ?', unite: '%', reponse: (1000 - r) / 10, tolerance: .3,
          explication: `Passant = (1 000 − ${r}) ÷ 1 000 = ${fr((1000 - r) / 10, 1)} % : un sable de rivière courant pour le béton.` } };
      } },
      { id: 'argile', zone: 'granulometrie', titre: 'Sable boueux', contenu: () => ({ type: 'situation', situation: s('argile', 'Sable boueux',
        'Le sable laisse une épaisse couche de boue au fond du seau après lavage.',
        ['Je fais un essai d’équivalent de sable avant de l’accepter', 'Trop d’argile gêne l’adhérence du ciment : l’équivalent de sable mesure la propreté.'],
        [['Il est assez propre pour du béton', 'Une couche de boue visible est justement le signe d’un sable à contrôler.'], ['On compensera avec plus de ciment', 'Le ciment ne corrige pas un sable sale : il faut un sable propre.']]) }) },
    ] },
    { id: 'vingt-huit-jours', nom: 'Écrasement à 28 jours', resume: 'Écraser les trois éprouvettes à 28 jours et juger le béton au critère du marché : moyenne d’au moins 25 MPa, aucun résultat sous 21 MPa.', taches: [
      { id: 'moyenne', zone: 'presse', titre: 'Résistance moyenne', contenu: cycle => {
        const forces = selon(cycle, ECRASEMENTS_28), r = forces.map(resistance), m = r.reduce((a, b) => a + b, 0) / 3;
        return { type: 'mesure', mesure: {
          titre: 'Résistance moyenne', enonce: 'Trois éprouvettes de 16 × 32 cm sont écrasées à 28 jours.',
          donnees: [...forces.map((f, i) => ({ libelle: `Éprouvette ${i + 1}`, valeur: `${f} kN` })), { libelle: 'Section', valeur: `${fr(SECTION)} mm²` }],
          question: 'Résistance moyenne, en MPa ?', unite: 'MPa', reponse: m, tolerance: .25,
          explication: `Résultats : ${r.map(x => fr(x, 1)).join(', ')} MPa ; moyenne ≈ ${fr(m, 1)} MPa.` } };
      } },
      { id: 'conformite', zone: 'presse', titre: 'Conformité', contenu: cycle => {
        const { r, m, ok } = conforme(cycle);
        const valeurs = `${r.map(x => fr(x, 1)).join(', ')} MPa (moyenne ${fr(m, 1)})`;
        const raison = m < 25 && r.some(x => x < 21) ? 'la moyenne est sous 25 MPa et un résultat sous 21 MPa' : m < 25 ? 'la moyenne est sous 25 MPa' : 'un résultat est sous 21 MPa';
        return { type: 'situation', situation: ok
          ? s('conformite', 'Conformité', `Critère du marché : moyenne d’au moins 25 MPa et aucun résultat sous 21 MPa. Résultats : ${valeurs}.`,
            ['Conforme : la moyenne et chaque résultat respectent le critère', 'Les deux conditions sont remplies : le béton est conforme à sa classe.'],
            [['Non conforme : il faudrait 30 MPa partout', '30 MPa est la valeur sur cube de la classe C25/30 ; sur cylindre, le critère est bien 25 MPa.'], ['Impossible de conclure sans refaire les essais', 'Les résultats suffisent : on conclut avec le critère du marché.']])
          : s('conformite', 'Conformité', `Critère du marché : moyenne d’au moins 25 MPa et aucun résultat sous 21 MPa. Résultats : ${valeurs}.`,
            [`Non conforme : ${raison}`, 'Il suffit qu’une condition manque : le béton n’atteint pas sa classe et la suite doit être décidée avec le bureau de contrôle.'],
            [['Conforme, on est tout près', '« Tout près » n’existe pas pour un critère : il est respecté ou non.'], ['Je refais des essais jusqu’à obtenir un bon résultat', 'Choisir ses résultats, c’est falsifier le contrôle.']]) };
      } },
    ] },
    { id: 'rapport', nom: 'Rapport et décision', resume: 'Rédiger le rapport d’essais complet et défendre ses conclusions, même quand elles dérangent.', taches: [
      { id: 'contenu', zone: 'bureau', titre: 'Contenu du rapport', contenu: () => ({ type: 'selection', selection: {
        titre: 'Contenu du rapport', enonce: 'Le rapport d’essais part au chantier et au bureau de contrôle.', consigne: 'Coche ce que le rapport doit contenir.',
        options: [
          { texte: 'L’identification des éprouvettes, de l’ouvrage et de la gâchée', attendu: true, explication: 'Sans elle, impossible de relier un résultat à une partie de l’ouvrage.' },
          { texte: 'Les dates de confection et d’essai', attendu: true, explication: 'L’âge du béton change tout : 7 ou 28 jours.' },
          { texte: 'Chaque résultat et la moyenne', attendu: true, explication: 'Le critère porte à la fois sur la moyenne et sur chaque résultat.' },
          { texte: 'Les conditions de conservation et les incidents', attendu: true, explication: 'Un bac vidé ou un transport au soleil expliquent un résultat.' },
          { texte: 'La conclusion au regard du critère du marché', attendu: true, explication: 'C’est ce qu’attendent le chantier et le bureau de contrôle.' },
          { texte: 'Seulement la moyenne, pour faire simple', attendu: false, explication: 'La moyenne seule peut cacher un résultat très faible.' },
          { texte: 'Des résultats arrondis pour paraître conformes', attendu: false, explication: 'C’est une falsification, avec des conséquences graves si l’ouvrage cède.' },
          { texte: 'L’avis du chauffeur de la toupie', attendu: false, explication: 'Le rapport donne des faits mesurés, pas des opinions.' },
        ] } }) },
      { id: 'decision', zone: 'bureau', titre: 'Pression du chantier', contenu: cycle => ({ type: 'situation', situation: conforme(cycle).ok
        ? s('decision', 'Pression du chantier', 'Le béton est conforme. Le conducteur de travaux te demande de ne pas mentionner l’éprouvette fêlée au démoulage.',
          ['Je mentionne l’incident : un rapport dit tout ce qui s’est passé', 'Un rapport incomplet perd toute valeur le jour où il sert à trancher un litige.'],
          [['D’accord, puisque le béton est conforme', 'Taire un incident, même sans conséquence, rend le rapport douteux.'], ['Je supprime le résultat de cette éprouvette', 'On ne retire pas un résultat qui dérange : on le commente.']])
        : s('decision', 'Pression du chantier', 'Le béton n’est pas conforme. Le chef de chantier te demande de « refaire les essais jusqu’à ce que ça passe ».',
          ['Je transmets le rapport tel quel et je propose des carottages dans l’ouvrage', 'Les carottes prélevées dans la structure diront si elle est sûre ; les résultats ne se choisissent pas.'],
          [['J’écrase d’autres éprouvettes jusqu’à un bon résultat', 'C’est truquer le contrôle : si l’ouvrage cède, ta responsabilité est engagée.'], ['Je garde le rapport pour moi le temps de réfléchir', 'Un résultat non conforme doit être signalé sans délai.']]) }) },
    ] },
  ],
};

/** Laboratoire de 22 × 16 m, entrée au sud. La caméra regarde depuis le sud-sud-est : postes, tableau et façades des
 * équipements lui font face (mur nord), jamais dos à elle. */
export const PLAN_LABORATOIRE: PlanLieu = {
  demiLargeur: 11, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.4],
  obstacles: [
    zone(-9.2, -4.8, 4.1, 5.3),     // comptoir de réception des échantillons
    zone(-10.8, -8, -4.6, 1.2),     // bacs de conservation
    zone(-6.6, -3.4, -7.8, -5.2),   // presse d'écrasement
    zone(-3.3, 3.3, -1.9, -.1),     // paillasse centrale
    zone(3.2, 10.9, -7.8, -5.4),    // tamiseuse, balance et étuve
    zone(-2.6, 2.6, -7.8, -6.3),    // bureau, sous le tableau des résultats
    zone(10.1, 10.9, -3.2, 3.2),    // armoires à échantillons
    zone(8.2, 10, 4, 6),            // malaxeur
    zone(6, 7.6, 4.3, 5.7),         // plaque de l'essai d'affaissement
  ],
  stations: { accueil: [-7, 6.4], 'beton-frais': [6.8, 6.7], paillasse: [0, 1.1], cure: [-7.2, -1.7], presse: [-5, -4.2], granulometrie: [6.4, -4.2], bureau: [0, -5.2], mentor: [2.6, 2.3] },
  libelles: { accueil: 'Réception des échantillons', 'beton-frais': 'Béton frais', paillasse: 'Paillasse', cure: 'Bacs de conservation', presse: 'Presse', granulometrie: 'Granulométrie', bureau: 'Bureau · résultats', mentor: 'Adjoua' },
  mentor: { position: [2.4, 1], rotation: .6 },
};

/** Valeurs affichées au tableau du laboratoire après chaque étape de la campagne. */
export function tableauLaboratoire(cycle: number) {
  const a = selon(cycle, [7.5, 9, 6, 8.5]), f7 = resistance(selon(cycle, [380, 395, 365, 410])), passant = (1000 - selon(cycle, [120, 150, 90, 135])) / 10, c = conforme(cycle);
  return { affaissement: `${fr(a, 1)} cm · S2`, fc7: `${fr(f7, 1)} MPa`, passant: `${fr(passant, 1)} %`, fc28: `${fr(c.m, 1)} MPa`, conforme: c.ok };
}
