// Chantier du Plateau : l'inspection sécurité d'un vrai chantier de R+3, avec le coordinateur SPS.
// Mécanique propre : chercher les risques sur le chantier même (EPI, échafaudage, tranchée, levage) et les faire corriger ;
// chaque étape validée fait disparaître le danger du décor. Elle forme la compétence « Sécurité chantier ».
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

export const PROGRAMME_PLATEAU: ProgrammeLieu = {
  slug: 'construction-nord', titre: 'Inspection sécurité du chantier', cycle: 'visite',
  mentor: { nom: 'Ibrahim Bamba', role: 'Coordinateur sécurité et santé (SPS)' }, horaires: { ouverture: 7, fermeture: 17 },
  etapes: [
    { id: 'accueil', nom: 'Accueil et équipements', resume: 'Personne n’entre sans ses équipements : à commencer par les visiteurs.', taches: [
      { id: 'epi', zone: 'accueil', titre: 'Les EPI pour entrer', contenu: () => ({ type: 'selection', selection: {
        titre: 'Les EPI pour entrer', enonce: 'À l’accueil du chantier, tu équipes l’équipe d’inspection.', consigne: 'Coche les équipements obligatoires sur ce chantier.',
        options: [
          { texte: 'Casque de chantier', attendu: true, explication: 'Les chutes d’objets sont la première cause de blessure à la tête.' },
          { texte: 'Chaussures de sécurité', attendu: true, explication: 'Coque contre l’écrasement, semelle contre les clous.' },
          { texte: 'Gilet haute visibilité', attendu: true, explication: 'Les engins et la grue doivent te voir.' },
          { texte: 'Gants adaptés à la tâche', attendu: true, explication: 'Ferraillage, coffrage : les mains sont exposées.' },
          { texte: 'Des sandales légères, il fait chaud', attendu: false, explication: 'Un clou ou un agglo qui tombe, et c’est l’accident.' },
          { texte: 'Des lunettes de soleil à la place des lunettes de protection', attendu: false, explication: 'Elles ne protègent ni des éclats ni de la laitance.' },
        ] } }) },
      { id: 'visiteur', zone: 'accueil', titre: 'Le livreur en sandales', contenu: () => ({ type: 'situation', situation: s('visiteur', 'Le livreur en sandales',
        'Un fournisseur veut traverser le chantier en sandales et sans casque pour déposer un document au bureau.',
        ['Il attend à l’accueil, ou on lui prête casque et chaussures avant de l’accompagner', 'Les règles valent pour tout le monde : un visiteur ne connaît pas les dangers du chantier.'],
        [['Il passe vite, ce n’est qu’une minute', 'Une minute suffit pour un accident.'], ['Je le laisse passer s’il longe la palissade', 'La palissade n’arrête ni les chutes d’objets ni les engins.']]) }) },
    ] },
    { id: 'echafaudage', nom: 'L’échafaudage de façade', resume: 'Garde-corps, planchers, charges : un échafaudage se contrôle avant d’y monter.', taches: [
      { id: 'garde-corps', zone: 'echafaudage', titre: 'Les défauts de l’échafaudage', contenu: () => ({ type: 'selection', selection: {
        titre: 'Les défauts de l’échafaudage', enonce: 'Tu inspectes l’échafaudage de la façade sud, du pied au dernier niveau.', consigne: 'Coche les non-conformités à faire corriger.',
        options: [
          { texte: 'Un garde-corps manque au deuxième niveau', attendu: true, explication: 'Sans garde-corps, une chute de six mètres est mortelle.' },
          { texte: 'Une planche manque, laissant un trou dans le plancher', attendu: true, explication: 'Un trou dans un plancher se comble avant tout travail.' },
          { texte: 'Pas de plinthe au bord des planchers', attendu: true, explication: 'La plinthe retient les outils et les gravats qui tomberaient sur les passants.' },
          { texte: 'L’échafaudage est amarré à la façade', attendu: false, explication: 'C’est conforme : l’amarrage l’empêche de basculer.' },
          { texte: 'On monte par l’escalier intérieur de l’échafaudage', attendu: false, explication: 'C’est conforme : on ne grimpe jamais par l’extérieur.' },
        ] } }) },
      { id: 'charge', zone: 'echafaudage', titre: 'La charge du plancher', contenu: cycle => {
        const [longueur, largeur] = selon(cycle, [[3, .7], [2.5, .6], [3, .6], [2, .7]] as const), charge = 200 * longueur * largeur;
        return { type: 'mesure', mesure: {
          titre: 'La charge du plancher', enonce: 'L’échafaudage est de classe 3 : ses planchers admettent 200 kg par mètre carré, ouvriers et matériaux compris.',
          donnees: [{ libelle: 'Plancher', valeur: `${fr(longueur, 1)} m × ${fr(largeur, 1)} m` }, { libelle: 'Charge admissible', valeur: '200 kg/m²' }],
          question: 'Charge maximale sur ce plancher, en kg ?', unite: 'kg', reponse: Math.round(charge), tolerance: 0,
          explication: `200 × ${fr(longueur, 1)} × ${fr(largeur, 1)} = ${fr(charge, 0)} kg : deux ouvriers (160 kg) et huit sacs de ciment (280 kg) ne passent pas toujours.` } };
      } },
    ] },
    { id: 'tranchee', nom: 'Fouilles et tranchées', resume: 'Au-delà de 1,30 m, une paroi peut s’effondrer : on blinde ou on talute avant de descendre.', taches: [
      { id: 'blindage', zone: 'tranchee', titre: 'La tranchée non blindée', contenu: () => ({ type: 'situation', situation: s('blindage', 'La tranchée non blindée',
        'Une tranchée de 1,60 m aux parois verticales ; un ouvrier s’apprête à y descendre poser un tuyau, la terre est entassée au bord.',
        ['J’arrête : on blinde (ou on talute) les parois et on éloigne les déblais du bord avant qu’il descende', 'Une paroi verticale de plus de 1,30 m peut s’effondrer ; la terre au bord la surcharge encore.'],
        [['Il descend vite, il sera remonté avant', 'Un éboulement ne prévient pas : un mètre cube de terre pèse près de deux tonnes.'], ['On met des planches sur les déblais pour qu’ils tiennent', 'Le poids des déblais reste au bord de la fouille.']]) }) },
      { id: 'talus', zone: 'tranchee', titre: 'Taluter à 45°', contenu: cycle => {
        const profondeur = selon(cycle, [1.6, 1.4, 2, 1.8]), largeur = .8, haut = largeur + 2 * profondeur;
        return { type: 'mesure', mesure: {
          titre: 'Taluter à 45°', enonce: 'Plutôt que de blinder, on talute les deux parois à 45°, depuis un fond de 0,80 m de large.',
          donnees: [{ libelle: 'Profondeur', valeur: `${fr(profondeur, 1)} m` }, { libelle: 'Largeur au fond', valeur: '0,80 m' }, { libelle: 'Pente des talus', valeur: '45°' }],
          question: 'Largeur de la tranchée en haut, en mètres ?', unite: 'm', reponse: Math.round(haut * 10) / 10, tolerance: .05,
          explication: `À 45°, chaque talus s’élargit d’autant qu’il est profond : 0,80 + 2 × ${fr(profondeur, 1)} = ${fr(haut, 1)} m en haut.` } };
      } },
    ] },
    { id: 'levage', nom: 'Le levage à la grue', resume: 'Personne sous une charge suspendue, et des élingues en bon état.', taches: [
      { id: 'zone-levage', zone: 'grue', titre: 'La benne au-dessus des coffreurs', contenu: () => ({ type: 'situation', situation: s('zone-levage', 'La benne au-dessus des coffreurs',
        'La grue fait passer une benne de béton au-dessus de deux ouvriers qui coffrent un poteau.',
        ['Je fais arrêter le levage, puis on balise la zone sous la trajectoire de la charge', 'Personne ne travaille sous une charge suspendue : une élingue qui lâche ne pardonne pas.'],
        [['Je leur dis de lever les yeux de temps en temps', 'On ne se protège pas d’une benne de béton en la regardant.'], ['C’est au grutier de faire attention', 'La sécurité du levage se partage : le grutier ne voit pas tout.']]) }) },
      { id: 'elingues', zone: 'grue', titre: 'Les élingues avant le levage', contenu: () => ({ type: 'selection', selection: {
        titre: 'Les élingues avant le levage', enonce: 'Tu contrôles les accessoires de levage avant la reprise.', consigne: 'Coche ce qui doit être vérifié.',
        options: [
          { texte: 'Pas de fil cassé, de nœud ni d’écrasement sur l’élingue', attendu: true, explication: 'Une élingue abîmée perd une grande part de sa résistance.' },
          { texte: 'La charge maximale est marquée sur l’élingue', attendu: true, explication: 'Sans marquage, on ne sait pas ce qu’elle peut lever.' },
          { texte: 'Le crochet a son linguet de sécurité', attendu: true, explication: 'Le linguet empêche l’élingue de sortir du crochet.' },
          { texte: 'L’élingue réparée avec du fil de fer, ça tient', attendu: false, explication: 'Une élingue réparée de fortune se jette.' },
          { texte: 'On essaie une charge inconnue, on verra si ça lève', attendu: false, explication: 'On connaît toujours le poids avant de lever.' },
        ] } }) },
    ] },
    { id: 'rapport', nom: 'Le rapport d’inspection', resume: 'Écrire ce qu’on a vu, qui corrige quoi et pour quand : et refuser un danger qui revient.', taches: [
      { id: 'contenu', zone: 'bureau', titre: 'Le rapport', contenu: () => ({ type: 'selection', selection: {
        titre: 'Le rapport', enonce: 'Tu rédiges le rapport d’inspection pour le conducteur de travaux.', consigne: 'Coche ce qu’il doit contenir.',
        options: [
          { texte: 'Les non-conformités constatées, photos à l’appui', attendu: true, explication: 'Le constat précis évite toute contestation.' },
          { texte: 'Les actions correctives et leur délai', attendu: true, explication: 'Un risque se corrige avant une date, pas « un jour ».' },
          { texte: 'Le responsable de chaque action', attendu: true, explication: 'Sans responsable, personne ne s’en charge.' },
          { texte: 'La date de la visite et ta signature', attendu: true, explication: 'Le rapport engage celui qui l’a rédigé.' },
          { texte: 'Des reproches personnels contre un ouvrier', attendu: false, explication: 'On décrit des situations, pas des personnes.' },
        ] } }) },
      { id: 'recidive', zone: 'bureau', titre: 'Le garde-corps encore absent', contenu: () => ({ type: 'situation', situation: s('recidive', 'Le garde-corps encore absent',
        'À la visite suivante, le garde-corps du deuxième niveau manque toujours, alors qu’il était au rapport.',
        ['J’interdis l’accès au niveau jusqu’à sa remise en place, et je le consigne au registre', 'Un danger grave déjà signalé ne se tolère plus : on arrête la zone.'],
        [['Je le note encore pour la prochaine fois', 'Le danger reste, et ta signature engage ta responsabilité.'], ['Je le remets moi-même sans rien dire', 'Le problème reviendra : l’entreprise doit savoir et corriger.']]) }) },
    ] },
  ],
};

/** Chantier de 30 × 22 m, portail au sud : l'immeuble en R+3 et son échafaudage au nord, la grue, la tranchée, le bureau. */
export const PLAN_PLATEAU: PlanLieu = {
  demiLargeur: 15, demiProfondeur: 11, ambiance: 'exterieur', depart: [0, 9.8],
  obstacles: [
    zone(-8, 8, -10.6, -4.6),          // immeuble en construction
    zone(-8.4, 8.4, -4.6, -3.4),       // échafaudage de façade
    zone(9.6, 12.4, -9.8, -7),         // pied de la grue
    zone(-13.4, -10, -6, 4),           // tranchée
    zone(8.6, 14.4, 5, 9.4),           // bureau de chantier et accueil
    zone(-14, -8, 5.6, 9.6),           // stock de matériaux
  ],
  stations: { accueil: [7.4, 7.2], echafaudage: [0, -2.2], tranchee: [-8.8, -1], grue: [11, -5.6], bureau: [11.4, 3.8], mentor: [3, 6.2] },
  libelles: { accueil: 'Accueil sécurité', echafaudage: 'Échafaudage', tranchee: 'Tranchée', grue: 'Zone de levage', bureau: 'Bureau de chantier', mentor: 'Ibrahim' },
  mentor: { position: [3, 4.8], rotation: 0 },
};
