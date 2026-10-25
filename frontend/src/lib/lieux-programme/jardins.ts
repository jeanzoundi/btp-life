// Résidences des Jardins : les dépannages chez les voisins, avec le gardien qui connaît chaque appartement.
// Mécanique propre : un voisin, une panne du bâtiment par étape (fuite, prise, fissure, humidité, devis), à diagnostiquer
// et à chiffrer ; la panne réparée disparaît de la cour. Chaque étape forme une compétence (technologie du bâtiment,
// sécurité, maçonnerie, métré).
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

export const PROGRAMME_JARDINS: ProgrammeLieu = {
  slug: 'jardins-residence', titre: 'Dépannages chez les voisins', cycle: 'semaine',
  mentor: { nom: 'Gustave Konan', role: 'Gardien des Résidences des Jardins' }, horaires: { ouverture: 8, fermeture: 19 },
  etapes: [
    { id: 'fuite', nom: 'La fuite sous l’évier', resume: 'Chez Madame Yao, l’eau goutte sous l’évier : couper, trouver, réparer, puis compter ce qu’elle aurait coûté.', taches: [
      { id: 'diagnostic-fuite', zone: 'yao', titre: 'Le meuble trempé', contenu: () => ({ type: 'situation', situation: s('diagnostic-fuite', 'Le meuble trempé',
        'De l’eau goutte sous l’évier de Madame Yao ; le fond du meuble est gonflé d’eau.',
        ['Je coupe l’eau au robinet d’arrêt, je trouve le raccord qui fuit et je change le joint', 'On coupe d’abord, on cherche ensuite : un joint fatigué ou un siphon desserré, c’est la cause la plus fréquente.'],
        [['J’éponge et je glisse une bassine dessous', 'La fuite continue et le meuble finit par pourrir.'], ['J’entoure le tuyau de ruban adhésif', 'Un adhésif ne tient pas sous la pression de l’eau.']]) }) },
      { id: 'litres', zone: 'yao', titre: 'Ce que coûte une goutte', contenu: cycle => {
        const [litres, jours] = selon(cycle, [[4, 30], [6, 30], [3, 31], [5, 28]] as const), total = litres * 24 * jours;
        return { type: 'mesure', mesure: {
          titre: 'Ce que coûte une goutte', enonce: 'Avant la réparation, la fuite remplissait un seau : tu as mesuré son débit.',
          donnees: [{ libelle: 'Perte mesurée', valeur: `${litres} L par heure` }, { libelle: 'Durée', valeur: `${jours} jours` }],
          question: 'Litres perdus sur la période ?', unite: 'L', reponse: total, tolerance: 0,
          explication: `${litres} L × 24 h × ${jours} jours = ${fr(total, 0)} L, de quoi remplir ${Math.round(total / 200)} fûts : une petite fuite pèse lourd sur la facture.` } };
      } },
    ] },
    { id: 'prise', nom: 'La prise qui chauffe', resume: 'Chez Monsieur Diallo, une prise noircie : couper le courant, comprendre la surcharge, sécuriser.', taches: [
      { id: 'noircie', zone: 'diallo', titre: 'La prise noircie', contenu: () => ({ type: 'situation', situation: s('noircie', 'La prise noircie',
        'La prise du salon de Monsieur Diallo est noircie et chaude ; une multiprise y alimente le climatiseur, le fer à repasser et la télévision.',
        ['Je coupe le disjoncteur, je remplace la prise et je fais brancher le climatiseur sur sa propre prise', 'Une prise noircie a déjà chauffé : on la change hors tension, et l’on répartit les gros appareils.'],
        [['Je débranche le fer, ça suffira', 'La prise abîmée reste dangereuse : elle peut prendre feu.'], ['Je touche la prise pour sentir si elle chauffe encore', 'Jamais à mains nues sur un appareil abîmé : risque d’électrocution.']]) }) },
      { id: 'intensite', zone: 'diallo', titre: 'La multiprise surchargée', contenu: cycle => {
        const [clim, fer, tele] = selon(cycle, [[1500, 1200, 100], [1800, 1000, 150], [1200, 1400, 80], [2000, 1100, 120]] as const), puissance = clim + fer + tele, i = puissance / 230;
        return { type: 'mesure', mesure: {
          titre: 'La multiprise surchargée', enonce: 'Tu additionnes ce qui était branché sur la même prise, sous 230 V.',
          donnees: [{ libelle: 'Climatiseur', valeur: `${clim} W` }, { libelle: 'Fer à repasser', valeur: `${fer} W` }, { libelle: 'Télévision', valeur: `${tele} W` }, { libelle: 'Tension', valeur: '230 V' }],
          question: 'Intensité appelée, en ampères ?', unite: 'A', reponse: Math.round(i * 10) / 10, tolerance: .3,
          explication: `I = P ÷ U = ${puissance} W ÷ 230 V = ${fr(i, 1)} A, sur une multiprise prévue pour 10 A en général : elle chauffe, la prise aussi.` } };
      } },
    ] },
    { id: 'fissure', nom: 'La fissure dans le mur', resume: 'Chez la famille Kouamé, une fissure en escalier : observer avant de reboucher, et préparer la reprise.', taches: [
      { id: 'observer', zone: 'kouame', titre: 'La fissure en escalier', contenu: () => ({ type: 'selection', selection: {
        titre: 'La fissure en escalier', enonce: 'Une fissure suit les joints des agglos, en diagonale, depuis l’angle de la fenêtre de la chambre.', consigne: 'Coche ce qu’il faut faire.',
        options: [
          { texte: 'Poser un témoin (jauge ou plâtre daté) pour voir si elle bouge', attendu: true, explication: 'Un témoin qui casse montre que la fissure travaille encore.' },
          { texte: 'Penser à un tassement des fondations sous l’angle', attendu: true, explication: 'Une fissure en escalier qui part d’une ouverture trahit souvent un appui qui s’affaisse.' },
          { texte: 'Faire venir la Maison des ingénieurs si elle s’élargit', attendu: true, explication: 'Une fissure évolutive se diagnostique avec un bureau d’études.' },
          { texte: 'La reboucher à l’enduit et repeindre tout de suite', attendu: false, explication: 'Si elle bouge, elle se rouvrira et l’on aura perdu le témoin.' },
          { texte: 'Conclure que c’est l’humidité, sans rien vérifier', attendu: false, explication: 'Pas de diagnostic sans observation.' },
        ] } }) },
      { id: 'mortier', zone: 'kouame', titre: 'Le mortier de reprise', contenu: cycle => {
        const longueur = selon(cycle, [2.4, 3, 1.8, 3.6]), litres = longueur * .05 * .03 * 1000;
        return { type: 'mesure', mesure: {
          titre: 'Le mortier de reprise', enonce: 'La fissure est stabilisée : on ouvre une saignée le long de la fissure pour la reprendre au mortier.',
          donnees: [{ libelle: 'Longueur', valeur: `${fr(longueur, 1)} m` }, { libelle: 'Largeur', valeur: '5 cm' }, { libelle: 'Profondeur', valeur: '3 cm' }],
          question: 'Volume de mortier, en litres ?', unite: 'L', reponse: Math.round(litres * 10) / 10, tolerance: .2,
          explication: `${fr(longueur, 1)} × 0,05 × 0,03 = ${fr(litres / 1000, 4)} m³, soit ${fr(litres, 1)} L : un seau suffit, gâché en petite quantité.` } };
      } },
    ] },
    { id: 'humidite', nom: 'L’humidité dans la salle d’eau', resume: 'Chez Mademoiselle Akissi, des taches noires sans fuite : la condensation, et des joints à refaire.', taches: [
      { id: 'moisissures', zone: 'akissi', titre: 'Les taches noires', contenu: () => ({ type: 'situation', situation: s('moisissures', 'Les taches noires',
        'Des taches noires couvrent le plafond de la salle d’eau ; pas de fuite, et la fenêtre reste fermée après la douche.',
        ['C’est de la condensation : j’installe un aérateur, je traite les moisissures et je conseille d’aérer', 'Sans fuite, l’eau vient de la vapeur : il faut l’évacuer, sinon les taches reviennent.'],
        [['Je repeins par-dessus en blanc', 'La peinture cache les taches quelques semaines, puis elles reviennent.'], ['Je bouche les aérations pour garder la chaleur', 'C’est le contraire : sans air, la condensation empire.']]) }) },
      { id: 'joints', zone: 'akissi', titre: 'Les joints de la douche', contenu: () => ({ type: 'selection', selection: {
        titre: 'Les joints de la douche', enonce: 'Tu refais l’étanchéité entre le bac et le carrelage.', consigne: 'Coche les bons gestes.',
        options: [
          { texte: 'Retirer entièrement l’ancien joint moisi', attendu: true, explication: 'Un joint posé sur l’ancien ne colle pas et garde les moisissures.' },
          { texte: 'Nettoyer, dégraisser et laisser bien sécher', attendu: true, explication: 'Le mastic n’adhère que sur un support propre et sec.' },
          { texte: 'Utiliser un mastic silicone sanitaire, anti-moisissures', attendu: true, explication: 'Il reste souple et résiste à l’eau et aux champignons.' },
          { texte: 'Appliquer sur le joint encore humide pour gagner du temps', attendu: false, explication: 'Sur un support humide, le joint décolle en quelques jours.' },
          { texte: 'Boucher l’angle au plâtre', attendu: false, explication: 'Le plâtre craint l’eau : il gonfle et s’effrite.' },
        ] } }) },
    ] },
    { id: 'devis', nom: 'Le devis du gardien', resume: 'Pour la cage d’escalier, Gustave veut un devis de peinture : chiffrer juste, et facturer proprement.', taches: [
      { id: 'peinture', zone: 'loge', titre: 'La peinture de la cage d’escalier', contenu: cycle => {
        const [murs, largeur, hauteur, portes] = selon(cycle, [[4, 3.5, 3, 2], [4, 4, 3, 3], [3, 4.5, 2.8, 2], [4, 3, 3.2, 1.6]] as const);
        const surface = murs * largeur * hauteur - portes, litres = surface * 2 / 10;
        return { type: 'mesure', mesure: {
          titre: 'La peinture de la cage d’escalier', enonce: 'Deux couches de peinture acrylique, qui couvre 10 m² par litre et par couche.',
          donnees: [{ libelle: 'Murs', valeur: `${murs} murs de ${fr(largeur, 1)} m × ${fr(hauteur, 1)} m` }, { libelle: 'Portes à déduire', valeur: `${fr(portes, 1)} m²` }, { libelle: 'Couches', valeur: '2' }],
          question: 'Litres de peinture ?', unite: 'L', reponse: Math.round(litres * 10) / 10, tolerance: .3,
          explication: `${murs} × ${fr(largeur, 1)} × ${fr(hauteur, 1)} − ${fr(portes, 1)} = ${fr(surface, 1)} m², × 2 couches ÷ 10 m²/L = ${fr(litres, 1)} L.` } };
      } },
      { id: 'facture', zone: 'loge', titre: 'Payé sans facture ?', contenu: () => ({ type: 'situation', situation: s('facture', 'Payé sans facture ?',
        'Un voisin te propose de te payer en liquide, sans facture, pour que ce soit moins cher.',
        ['Je fais un devis signé et une facture : c’est ma garantie autant que la sienne', 'Sans facture, ni garantie pour le client, ni preuve pour toi en cas de litige.'],
        [['J’accepte, tout le monde fait comme ça', 'Le travail non déclaré te prive de toute protection.'], ['Je double le prix puisqu’il n’y a rien d’écrit', 'Ta réputation s’effondre dès que le quartier l’apprend.']]) }) },
    ] },
  ],
};

/** Cour de 26 × 18 m, portail au sud : deux immeubles au nord (Yao, Diallo, Akissi), un à l'ouest (Kouamé), la loge du gardien. */
export const PLAN_JARDINS: PlanLieu = {
  demiLargeur: 13, demiProfondeur: 9, ambiance: 'exterieur', depart: [0, 7.8],
  obstacles: [
    zone(-12.6, -1.2, -9, -6.6),       // immeuble A (Madame Yao)
    zone(1.2, 12.6, -9, -6.6),         // immeuble B (Monsieur Diallo, Mademoiselle Akissi)
    zone(-13, -10.6, -4.4, 4),         // immeuble C (famille Kouamé)
    zone(-2.8, 2.8, -2.4, 2.4),        // jardin central : manguier, bancs, massif
    zone(-13, -9, 5.4, 9),             // loge du gardien
    zone(10.4, 13, 3.8, 7.6),          // local des compteurs et des poubelles
  ],
  stations: { yao: [-6.6, -5.6], diallo: [3.8, -5.6], akissi: [9.4, -5.6], kouame: [-9.4, 0], loge: [-7.8, 7], mentor: [-6.2, 4.6] },
  libelles: { yao: 'Chez Madame Yao', diallo: 'Chez Monsieur Diallo', akissi: 'Chez Mademoiselle Akissi', kouame: 'Chez les Kouamé', loge: 'Loge du gardien', mentor: 'Gustave' },
  mentor: { position: [-7.6, 4.6], rotation: Math.PI / 2 },
};
