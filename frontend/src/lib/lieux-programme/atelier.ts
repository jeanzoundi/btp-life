// Atelier de formation : les logiciels du chantier, du tableur au modèle BIM, sur de vrais postes.
// Mécanique propre : chaque séance fait manipuler un outil (métré au tableur, cote d'un plan numérique,
// chemin critique d'un planning, quantités d'une maquette) ; le rayon des logiciels montre la maîtrise du joueur.
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

/** Dalles du métré de chaque session : longueur, largeur, épaisseur (m). */
const DALLES: [number, number, number][][] = [
  [[5, 4, .15], [6, 3.5, .15], [4, 4, .12]],
  [[7, 4, .16], [5, 5, .15], [3, 2.5, .12]],
  [[6, 6, .15], [4.5, 3, .12], [5, 2, .12]],
  [[8, 5, .18], [4, 3.5, .15], [3.5, 3, .12]],
];

export const PROGRAMME_ATELIER: ProgrammeLieu = {
  slug: 'atelier', titre: 'Logiciels du chantier', cycle: 'session',
  mentor: { nom: 'Didier Assi', role: 'Formateur numérique et BIM' }, horaires: { ouverture: 8, fermeture: 19 },
  etapes: [
    { id: 'tableur', nom: 'Le métré au tableur', resume: 'Un tableau bien construit calcule à ta place, et se met à jour quand une cote change.', taches: [
      { id: 'total-beton', zone: 'postes', titre: 'Volume des dalles', contenu: cycle => {
        const dalles = selon(cycle, DALLES), volumes = dalles.map(([l, w, e]) => l * w * e), total = volumes.reduce((n, v) => n + v, 0);
        return { type: 'mesure', mesure: {
          titre: 'Volume des dalles', enonce: 'Ta feuille de métré liste trois dalles ; complète la cellule du total.',
          donnees: dalles.map(([l, w, e], i) => ({ libelle: `Dalle ${i + 1}`, valeur: `${fr(l, 1)} × ${fr(w, 1)} m, ${fr(e * 100)} cm` })),
          question: 'Volume total de béton, en m³ ?', unite: 'm³', reponse: total, tolerance: .02,
          explication: `${volumes.map(v => fr(v, 2)).join(' + ')} = ${fr(total, 2)} m³ : longueur × largeur × épaisseur, dalle par dalle, puis la somme.` } };
      } },
      { id: 'formule', zone: 'postes', titre: 'Valeurs ou formules', contenu: () => ({ type: 'situation', situation: s('formule', 'Valeurs ou formules',
        'Un collègue tape directement les résultats dans sa feuille de métré, calculés à la calculatrice.',
        ['Je lui montre les formules qui renvoient aux cellules des cotes', 'Avec des formules, une cote corrigée met tout le métré à jour ; un chiffre tapé reste faux.'],
        [['C’est pareil, du moment que le chiffre est juste', 'Le jour où une cote change, son total sera faux sans que personne ne le voie.'], ['Je lui dis de tout refaire à la main', 'On perdrait le seul intérêt du tableur.']]) }) },
    ] },
    { id: 'plan', nom: 'Lire un plan numérique', resume: 'Calques, cotes et échelles : lire un plan à l’écran sans rien abîmer.', taches: [
      { id: 'calques', zone: 'postes', titre: 'Les calques', contenu: () => ({ type: 'situation', situation: s('calques', 'Les calques',
        'Sur le plan numérique, le réseau électrique cache le ferraillage que tu dois vérifier.',
        ['Je masque le calque électricité le temps de lire le ferraillage', 'Les calques se masquent et se réaffichent : le plan reste complet pour les autres.'],
        [['J’efface les lignes électriques', 'Tu détruis une partie du plan, peut-être pour tout le monde.'], ['J’imprime et je devine', 'Un plan surchargé imprimé reste illisible.']]) }) },
      { id: 'cote', zone: 'grand-ecran', titre: 'Mesurer sur le tirage', contenu: cycle => {
        const [echelle, mesure] = selon(cycle, [[100, 7.35], [50, 9.8], [200, 3.1], [50, 13.4]] as const), reelle = mesure * echelle / 100;
        return { type: 'mesure', mesure: {
          titre: 'Mesurer sur le tirage', enonce: 'Le plan est imprimé à l’échelle ; tu mesures un mur à la règle sur le tirage.',
          donnees: [{ libelle: 'Échelle du tirage', valeur: `1/${echelle}` }, { libelle: 'Longueur mesurée', valeur: `${fr(mesure, 2)} cm` }],
          question: 'Longueur réelle du mur, en mètres ?', unite: 'm', reponse: reelle, tolerance: .01,
          explication: `${fr(mesure, 2)} cm × ${echelle} = ${fr(mesure * echelle)} cm, soit ${fr(reelle, 2)} m.` } };
      } },
    ] },
    { id: 'planning', nom: 'Le planning en diagramme de Gantt', resume: 'Enchaîner les tâches, repérer celles qui ne peuvent pas glisser : le chemin critique.', taches: [
      { id: 'critique', zone: 'grand-ecran', titre: 'Chemin critique', contenu: cycle => {
        const [a, b, c, d] = selon(cycle, [[3, 4, 5, 6], [2, 3, 1, 8], [4, 2, 6, 5], [5, 3, 2, 7]] as const), duree = Math.max(a, c) + b + d;
        return { type: 'mesure', mesure: {
          titre: 'Chemin critique', enonce: 'Les semelles attendent les fouilles et la livraison des aciers ; l’élévation attend les semelles.',
          donnees: [{ libelle: 'Fouilles', valeur: `${a} jours` }, { libelle: 'Livraison des aciers (en parallèle)', valeur: `${c} jours` }, { libelle: 'Semelles', valeur: `${b} jours` }, { libelle: 'Élévation', valeur: `${d} jours` }],
          question: 'Durée minimale de l’ensemble, en jours ?', unite: 'jours', reponse: duree, tolerance: 0,
          explication: `Les semelles démarrent quand les fouilles et les aciers sont prêts : après ${Math.max(a, c)} jours. Puis ${b} + ${d} jours : ${duree} jours au total.` } };
      } },
      { id: 'glissement', zone: 'grand-ecran', titre: 'Deux jours de retard', contenu: () => ({ type: 'situation', situation: s('glissement', 'Deux jours de retard',
        'Les semelles, sur le chemin critique, prennent deux jours de retard.',
        ['Je préviens que la fin glisse de deux jours, et je cherche à rattraper sur une tâche critique', 'Sur le chemin critique, chaque jour perdu repousse la fin, sauf si l’on accélère une autre tâche critique.'],
        [['Rien ne change, on rattrapera bien', 'Sans action, la fin du chantier recule mécaniquement.'], ['Je raccourcis une tâche qui n’est pas critique', 'Elle avait déjà de la marge : la fin ne bouge pas.']]) }) },
    ] },
    { id: 'rapport', nom: 'Le rapport journalier', resume: 'Chaque soir, une page qui dit ce qui s’est passé sur le chantier : c’est la mémoire du chantier.', taches: [
      { id: 'contenu-rapport', zone: 'postes', titre: 'Contenu du rapport', contenu: () => ({ type: 'selection', selection: {
        titre: 'Contenu du rapport', enonce: 'Tu rédiges le rapport de la journée de coulage de la dalle.', consigne: 'Coche ce qui doit y figurer.',
        options: [
          { texte: 'Les effectifs présents, par métier', attendu: true, explication: 'Ils justifient l’avancement et les heures payées.' },
          { texte: 'La météo de la journée', attendu: true, explication: 'Une pluie explique un arrêt, une forte chaleur une cure renforcée.' },
          { texte: 'Les travaux réalisés et les quantités', attendu: true, explication: 'C’est l’avancement réel du chantier.' },
          { texte: 'Les livraisons reçues', attendu: true, explication: 'Elles se rapprochent des bons de livraison.' },
          { texte: 'Les incidents et les visites', attendu: true, explication: 'Un accident évité ou une visite du maître d’ouvrage se notent le jour même.' },
          { texte: 'Ton avis sur le caractère des collègues', attendu: false, explication: 'Un rapport décrit des faits, pas des opinions.' },
          { texte: 'Les rumeurs du quartier', attendu: false, explication: 'Hors sujet.' },
        ] } }) },
      { id: 'photos', zone: 'postes', titre: 'Les photos', contenu: () => ({ type: 'situation', situation: s('photos', 'Les photos',
        'Le ferraillage de la dalle sera caché demain par le béton.',
        ['Je joins au rapport des photos datées du ferraillage avant coulage', 'Une fois coulé, plus rien ne se voit : la photo datée prouve que c’était conforme.'],
        [['Pas besoin, tout le monde l’a vu', 'Dans six mois, personne ne s’en souviendra, et le litige arrivera.'], ['Je photographierai la dalle finie', 'La dalle finie ne montre plus les aciers.']]) }) },
    ] },
    { id: 'bim', nom: 'La maquette numérique (BIM)', resume: 'Un seul modèle partagé : on y voit les conflits avant le chantier et on en tire les quantités.', taches: [
      { id: 'conflit', zone: 'imprimante', titre: 'Conflit de réseaux', contenu: () => ({ type: 'situation', situation: s('conflit', 'Conflit de réseaux',
        'La maquette montre une gaine de ventilation qui traverse une poutre.',
        ['On règle le conflit dans la maquette avec l’ingénieur et le plombier, avant le chantier', 'Corriger un modèle coûte quelques minutes ; percer une poutre coulée peut affaiblir la structure.'],
        [['On percera la poutre sur place', 'Un trou dans une poutre, sans calcul, peut la faire céder.'], ['On ignore, le plombier verra bien', 'Le problème arrivera au pire moment, chantier en cours.']]) }) },
      { id: 'quantites', zone: 'grand-ecran', titre: 'Quantités du modèle', contenu: cycle => {
        const [n, l, h] = selon(cycle, [[12, 1.2, 1.4], [8, 1.5, 1.2], [16, .8, 1.2], [10, 1.4, 1.6]] as const), surface = n * l * h;
        return { type: 'mesure', mesure: {
          titre: 'Quantités du modèle', enonce: 'La maquette compte les fenêtres du bâtiment pour la commande de vitrage.',
          donnees: [{ libelle: 'Nombre de fenêtres', valeur: String(n) }, { libelle: 'Dimensions', valeur: `${fr(l, 2)} × ${fr(h, 2)} m` }],
          question: 'Surface totale de vitrage, en m² ?', unite: 'm²', reponse: surface, tolerance: .05,
          explication: `${n} × ${fr(l, 2)} × ${fr(h, 2)} = ${fr(surface, 2)} m², une quantité que le modèle tient à jour à chaque modification.` } };
      } },
    ] },
  ],
};

/** Salle de 22 × 16 m, entrée au sud : trois rangs de postes face au grand écran, imprimante 3D et maquettes à l'est, rayon des logiciels. */
export const PLAN_ATELIER: PlanLieu = {
  demiLargeur: 11, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.8],
  obstacles: [
    zone(-8.5, 1.5, -2.95, -2.05),     // premier rang de postes
    zone(-8.5, 1.5, -.45, .45),        // deuxième rang
    zone(-8.5, 1.5, 2.05, 2.95),       // troisième rang
    zone(6, 9, -4, -2),                // table de l'imprimante 3D et des maquettes
    zone(10.2, 11, 1, 5),              // rayon des logiciels
    zone(-11, -9.6, -8, -6.6),         // armoire du matériel
  ],
  stations: { postes: [2.2, 0], 'grand-ecran': [-1, -5.6], imprimante: [7.5, -1.3], catalogue: [9.6, 3], mentor: [-7, -5.4] },
  libelles: { postes: 'Ton poste', 'grand-ecran': 'Grand écran', imprimante: 'Imprimante 3D', catalogue: 'Rayon des logiciels', mentor: 'Didier' },
  mentor: { position: [-7, -6.6], rotation: 0 },
};
