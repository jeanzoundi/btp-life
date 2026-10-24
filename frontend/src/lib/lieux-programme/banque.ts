// Banque BTL : financer son projet, du compte ouvert au décaissement du prêt par tranches.
// Mécanique propre : les calculs de l'argent (intérêts, taux d'endettement, coût du crédit) et un guichet
// d'épargne qui fonctionne vraiment (POST /carriere/epargne/deposer et /retirer).
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

/** Part maximale des revenus consacrée aux mensualités, règle des banques de la place. */
export const ENDETTEMENT_MAX = 33;
/** Miroir de TAUX_INTERET_JOURNALIER (backend/src/carriere/epargne.service.ts) pour l'affichage du guichet. */
export const TAUX_EPARGNE_JOUR = .004;

export const PROGRAMME_BANQUE: ProgrammeLieu = {
  slug: 'banque', titre: 'Financer son projet', cycle: 'dossier',
  mentor: { nom: 'Fanta Coulibaly', role: 'Conseillère clientèle, Banque BTL' }, horaires: { ouverture: 8, fermeture: 16 },
  etapes: [
    { id: 'compte', nom: 'Ouvrir son compte', resume: 'Un compte à ton nom, des pièces en règle : la base de toute relation avec la banque.', taches: [
      { id: 'pieces-compte', zone: 'accueil', titre: 'Pièces d’ouverture', contenu: () => ({ type: 'selection', selection: {
        titre: 'Pièces d’ouverture', enonce: 'Tu ouvres un compte courant pour recevoir ton salaire et tes primes de chantier.', consigne: 'Coche les pièces à présenter.',
        options: [
          { texte: 'Ta pièce d’identité en cours de validité', attendu: true, explication: 'La banque doit savoir qui tu es : c’est une obligation légale.' },
          { texte: 'Un justificatif de domicile récent', attendu: true, explication: 'Facture d’eau ou d’électricité de moins de trois mois.' },
          { texte: 'Ton contrat de travail ou un bulletin de salaire', attendu: true, explication: 'Il justifie tes revenus et l’origine de l’argent.' },
          { texte: 'Deux photos d’identité', attendu: true, explication: 'Elles complètent le dossier d’ouverture.' },
          { texte: 'La carte d’identité de ton chef de chantier', attendu: false, explication: 'Le compte est à ton nom : seules tes pièces comptent.' },
          { texte: 'Ta carte de fidélité du supermarché', attendu: false, explication: 'Elle ne prouve rien à la banque.' },
          { texte: 'Une facture de téléphone d’un ami', attendu: false, explication: 'Un justificatif doit être à ton nom.' },
        ] } }) },
      { id: 'procuration', zone: 'guichet', titre: 'Retrait pour un autre', contenu: () => ({ type: 'situation', situation: s('procuration', 'Retrait pour un autre',
        'Un collègue veut retirer de l’argent sur ton compte « pour te rendre service », sans aucun papier.',
        ['Je signe une procuration écrite à son nom, s’il doit vraiment le faire', 'La procuration fixe ce qu’il peut faire ; il présentera aussi sa pièce d’identité.'],
        [['Je lui donne mon code de carte, c’est plus simple', 'Ton code est personnel : le donner, c’est perdre toute protection.'], ['Je dis au guichetier de le laisser faire', 'Sans procuration, la banque refusera, et elle aura raison.']]) }) },
    ] },
    { id: 'epargne', nom: 'Épargner pour l’apport', resume: 'Mettre de côté chaque mois : pour un chantier ou un prêt, il faut un apport personnel.', taches: [
      { id: 'interets', zone: 'guichet', titre: 'Intérêts d’un placement', contenu: cycle => {
        const [capital, taux, mois] = selon(cycle, [[500_000, 4, 6], [800_000, 3.5, 12], [1_200_000, 4.5, 8], [300_000, 5, 9]] as const), i = capital * taux / 100 * mois / 12;
        return { type: 'mesure', mesure: {
          titre: 'Intérêts d’un placement', enonce: 'Ton épargne est placée sur un compte à intérêts simples.',
          donnees: [{ libelle: 'Somme placée', valeur: `${fr(capital)} F` }, { libelle: 'Taux annuel', valeur: `${fr(taux, 1)} %` }, { libelle: 'Durée', valeur: `${mois} mois` }],
          question: 'Intérêts gagnés, en francs ?', unite: 'F', reponse: i, tolerance: 1,
          explication: `Intérêts simples = somme × taux × durée : ${fr(capital)} × ${fr(taux, 1)} % × ${mois}/12 = ${fr(i)} F.` } };
      } },
      { id: 'precaution', zone: 'conseiller', titre: 'Épargne de précaution', contenu: () => ({ type: 'situation', situation: s('precaution', 'Épargne de précaution',
        'Tu veux placer toutes tes économies dans le terrain de ton futur chantier.',
        ['Je garde d’abord trois à six mois de dépenses disponibles, et je place le reste', 'Une panne, une maladie, un chantier qui tarde à payer : la réserve évite de s’endetter dans l’urgence.'],
        [['Je place tout, je gagne bien ma vie', 'Le moindre imprévu te forcerait à emprunter cher.'], ['Je garde tout en liquide à la maison', 'L’argent ne rapporte rien et peut être volé.']]) }) },
    ] },
    { id: 'dossier', nom: 'Monter le dossier de crédit', resume: 'Prouver ton projet et ta capacité à rembourser : la banque prête sur pièces, pas sur parole.', taches: [
      { id: 'pieces-credit', zone: 'conseiller', titre: 'Dossier de prêt', contenu: () => ({ type: 'selection', selection: {
        titre: 'Dossier de prêt', enonce: 'Tu demandes un prêt pour construire une villa sur ton terrain.', consigne: 'Coche les pièces du dossier.',
        options: [
          { texte: 'Le titre foncier ou l’ACD du terrain', attendu: true, explication: 'La banque vérifie que tu construis sur un terrain qui t’appartient.' },
          { texte: 'Le permis de construire et les plans', attendu: true, explication: 'Le projet doit être autorisé avant d’être financé.' },
          { texte: 'Le devis détaillé de l’entreprise', attendu: true, explication: 'Il fixe le montant à financer, poste par poste.' },
          { texte: 'Tes trois derniers bulletins de salaire', attendu: true, explication: 'Ils mesurent tes revenus réguliers.' },
          { texte: 'Tes relevés bancaires des trois derniers mois', attendu: true, explication: 'Ils montrent comment tu gères ton argent.' },
          { texte: 'Une photo du terrain prise au téléphone', attendu: false, explication: 'Elle ne prouve ni la propriété ni la valeur.' },
          { texte: 'La promesse orale du vendeur des agglos', attendu: false, explication: 'Une promesse orale n’a aucune valeur pour la banque.' },
        ] } }) },
      { id: 'endettement', zone: 'conseiller', titre: 'Taux d’endettement', contenu: cycle => {
        const revenu = selon(cycle, [450_000, 600_000, 380_000, 520_000]), m = revenu * ENDETTEMENT_MAX / 100;
        return { type: 'mesure', mesure: {
          titre: 'Taux d’endettement', enonce: `La banque ne laisse pas les mensualités dépasser ${ENDETTEMENT_MAX} % des revenus.`,
          donnees: [{ libelle: 'Salaire net mensuel', valeur: `${fr(revenu)} F` }, { libelle: 'Autres crédits', valeur: 'aucun' }],
          question: 'Mensualité maximale, en francs ?', unite: 'F', reponse: m, tolerance: 100,
          explication: `${fr(revenu)} × ${ENDETTEMENT_MAX} % = ${fr(m)} F : au-delà, le budget du ménage ne tient plus.` } };
      } },
    ] },
    { id: 'credit', nom: 'Comprendre le coût du crédit', resume: 'Un prêt se rembourse avec des intérêts : savoir ce qu’il coûte vraiment avant de signer.', taches: [
      { id: 'cout', zone: 'conseiller', titre: 'Coût total du crédit', contenu: cycle => {
        const [capital, mois, mensualite] = selon(cycle, [[6_000_000, 60, 125_000], [4_000_000, 48, 98_500], [8_000_000, 84, 121_000], [5_000_000, 60, 104_000]] as const);
        const cout = mensualite * mois - capital;
        return { type: 'mesure', mesure: {
          titre: 'Coût total du crédit', enonce: 'L’offre de prêt indique la mensualité ; à toi de calculer ce que coûte vraiment le crédit.',
          donnees: [{ libelle: 'Somme empruntée', valeur: `${fr(capital)} F` }, { libelle: 'Durée', valeur: `${mois} mois` }, { libelle: 'Mensualité', valeur: `${fr(mensualite)} F` }],
          question: 'Coût total des intérêts, en francs ?', unite: 'F', reponse: cout, tolerance: 0,
          explication: `${fr(mensualite)} × ${mois} = ${fr(mensualite * mois)} F remboursés, moins ${fr(capital)} F empruntés : ${fr(cout)} F d’intérêts.` } };
      } },
      { id: 'assurance', zone: 'conseiller', titre: 'Assurance emprunteur', contenu: () => ({ type: 'situation', situation: s('assurance', 'Assurance emprunteur',
        'La conseillère te propose l’assurance décès-invalidité avec le prêt ; tu trouves que c’est une dépense de trop.',
        ['Je la prends : elle rembourse le prêt si un accident m’empêche de travailler', 'Sur un chantier, le risque existe : sans assurance, la dette retomberait sur ta famille.'],
        [['Je la refuse, je suis prudent sur le chantier', 'La prudence n’empêche pas tous les accidents.'], ['Je mens sur ma santé pour payer moins', 'Une fausse déclaration annule la garantie au moment où tu en aurais besoin.']]) }) },
    ] },
    { id: 'decaissement', nom: 'Signer et décaisser', resume: 'Relire l’offre, signer, puis recevoir les fonds au rythme du chantier.', taches: [
      { id: 'tranches', zone: 'coffre', titre: 'Déblocage des fonds', contenu: () => ({ type: 'situation', situation: s('tranches', 'Déblocage des fonds',
        'Le prêt est accordé. Le maçon réclame tout l’argent tout de suite, en liquide.',
        ['Je fais débloquer les fonds par tranches, sur justificatifs d’avancement', 'Chaque tranche paie un travail fait : l’argent suit le chantier, et personne ne disparaît avec.'],
        [['Je retire tout et je le lui donne', 'S’il abandonne le chantier, tu rembourses un prêt pour rien.'], ['Je garde tout sur mon compte courant', 'L’argent du prêt doit financer le projet prévu, pas dormir.']]) }) },
      { id: 'offre', zone: 'conseiller', titre: 'Relire l’offre', contenu: () => ({ type: 'situation', situation: s('offre', 'Relire l’offre',
        'L’offre de prêt fait douze pages ; on te presse de signer avant midi.',
        ['Je relis le taux global, la durée, l’assurance et les pénalités avant de signer', 'Tu t’engages pour des années : ce que tu signes, tu dois le comprendre.'],
        [['Je signe, la banque sait ce qu’elle fait', 'La banque défend ses intérêts ; à toi de défendre les tiens.'], ['Je fais signer mon cousin à ma place', 'Seul l’emprunteur peut signer : c’est un faux.']]) }) },
      { id: 'arnaque', zone: 'dab', titre: 'Message suspect', contenu: () => ({ type: 'situation', situation: s('arnaque', 'Message suspect',
        'Un SMS « de la banque » annonce que ton compte est bloqué et demande ton code secret pour le débloquer.',
        ['Je ne réponds pas, et j’appelle la banque au numéro officiel', 'Une banque ne demande jamais ton code : c’est une tentative d’escroquerie.'],
        [['J’envoie le code, c’est urgent', 'L’escroc vide ton compte dans la minute.'], ['Je clique sur le lien pour vérifier', 'Le lien mène à un faux site qui vole tes identifiants.']]) }) },
    ] },
  ],
};

/** Agence de 22 × 16 m, entrée au sud : guichets vitrés au fond, guichet d'épargne à gauche, conseillers à l'est, salle d'attente au centre. */
export const PLAN_BANQUE: PlanLieu = {
  demiLargeur: 11, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.8],
  obstacles: [
    zone(-10.6, 2.6, -6.4, -5.2),      // guichets vitrés
    zone(5.8, 8.2, -2.2, -1),          // bureau de la conseillère
    zone(5.8, 8.2, 2, 3.2),            // bureau des prêts
    zone(-6, 0, .4, 2.4),              // salle d'attente
    zone(1.5, 4.5, 4.4, 5.4),          // accueil
    zone(-11, -10.2, 2.4, 3.6),        // distributeur automatique
    zone(-3.3, -2.7, -2.3, -1.7), zone(2.7, 3.3, -2.3, -1.7), // colonnes
  ],
  stations: { accueil: [3, 6.1], guichet: [-3.5, -4.5], epargne: [-8.5, -4.5], conseiller: [7, 4], dab: [-9.6, 3], coffre: [8.5, -6.2], mentor: [7, -.3] },
  libelles: { accueil: 'Accueil', guichet: 'Guichets', epargne: 'Guichet épargne', conseiller: 'Bureau des prêts', dab: 'Distributeur', coffre: 'Salle des coffres', mentor: 'Fanta' },
  mentor: { position: [7, -2.7], rotation: 0 },
};
