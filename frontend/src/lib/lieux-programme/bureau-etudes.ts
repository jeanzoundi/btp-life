// Maison des ingénieurs : l'étude d'une structure, des données d'entrée au visa du bureau de contrôle.
// Mécanique propre : les vrais calculs d'un bureau d'études (échelle, descente de charges, semelle, section d'acier),
// avec la maquette de la structure qui se monte au fil de l'étude ; le tableau des compétences est celui du joueur.
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

/** Données de chaque étude : portée du poteau intérieur, charge surfacique, niveaux, contrainte admissible du sol. */
export function etude(cycle: number) {
  const [l1, l2, charge, niveaux, sol] = selon(cycle, [[4, 5, 6.5, 2, 150], [3.5, 4, 6.5, 3, 120], [5, 5, 7, 2, 200], [4, 4.5, 6, 3, 180]] as const);
  const n = l1 * l2 * charge * niveaux;
  return { l1, l2, charge, niveaux, sol, n, surface: n / sol };
}

export const PROGRAMME_BUREAU_ETUDES: ProgrammeLieu = {
  slug: 'bureau-etudes', titre: 'Étude d’une structure', cycle: 'étude',
  mentor: { nom: 'Inès Diabaté', role: 'Ingénieure structure, Maison des ingénieurs' }, horaires: { ouverture: 8, fermeture: 18 },
  etapes: [
    { id: 'donnees', nom: 'Rassembler les données', resume: 'Une étude commence par les plans, le sol et l’usage du bâtiment : sans données justes, le calcul est faux.', taches: [
      { id: 'entrees', zone: 'archives', titre: 'Données d’entrée', contenu: () => ({ type: 'selection', selection: {
        titre: 'Données d’entrée', enonce: 'Tu lances l’étude de la structure d’un immeuble R+2 de logements.', consigne: 'Coche les données indispensables au calcul.',
        options: [
          { texte: 'Les plans de l’architecte, cotés', attendu: true, explication: 'Ils donnent les portées, les hauteurs et la position des éléments porteurs.' },
          { texte: 'Le rapport géotechnique du terrain', attendu: true, explication: 'Il fixe la contrainte admissible du sol, donc les fondations.' },
          { texte: 'Les charges d’exploitation selon l’usage', attendu: true, explication: 'Logement, bureau ou école ne portent pas les mêmes charges.' },
          { texte: 'La classe du béton et la nuance des aciers', attendu: true, explication: 'La résistance des matériaux entre dans chaque calcul.' },
          { texte: 'La couleur des façades', attendu: false, explication: 'Elle ne change rien à la structure.' },
          { texte: 'Le prix de vente des appartements', attendu: false, explication: 'Une donnée commerciale, pas une donnée de calcul.' },
          { texte: 'Le nom du notaire', attendu: false, explication: 'Hors sujet pour l’ingénieur structure.' },
        ] } }) },
      { id: 'echelle', zone: 'archives', titre: 'Lire l’échelle', contenu: cycle => {
        const [echelle, mesure] = selon(cycle, [[50, 6.4], [100, 4.7], [50, 9.2], [20, 12.5]] as const), reelle = mesure * echelle / 100;
        return { type: 'mesure', mesure: {
          titre: 'Lire l’échelle', enonce: 'Sur le plan papier, tu mesures la portée d’une poutre à la règle.',
          donnees: [{ libelle: 'Échelle du plan', valeur: `1/${echelle}` }, { libelle: 'Longueur mesurée', valeur: `${fr(mesure, 1)} cm` }],
          question: 'Portée réelle, en mètres ?', unite: 'm', reponse: reelle, tolerance: .01,
          explication: `Au 1/${echelle}, 1 cm vaut ${fr(echelle / 100, 2)} m : ${fr(mesure, 1)} × ${fr(echelle / 100, 2)} = ${fr(reelle, 2)} m.` } };
      } },
    ] },
    { id: 'charges', nom: 'Descente de charges', resume: 'Suivre le chemin des charges, de la dalle jusqu’au poteau, niveau par niveau.', taches: [
      { id: 'poteau', zone: 'calcul', titre: 'Charge sur un poteau', contenu: cycle => {
        const e = etude(cycle);
        return { type: 'mesure', mesure: {
          titre: 'Charge sur un poteau', enonce: 'Un poteau intérieur reprend la moitié des travées qui l’entourent, à chaque niveau.',
          donnees: [{ libelle: 'Surface reprise', valeur: `${fr(e.l1, 1)} × ${fr(e.l2, 1)} m` }, { libelle: 'Charge par m² (G + Q)', valeur: `${fr(e.charge, 1)} kN/m²` }, { libelle: 'Niveaux portés', valeur: String(e.niveaux) }],
          question: 'Charge totale sur le poteau, en kN ?', unite: 'kN', reponse: e.n, tolerance: 1,
          explication: `${fr(e.l1, 1)} × ${fr(e.l2, 1)} × ${fr(e.charge, 1)} × ${e.niveaux} = ${fr(e.n)} kN, à reporter sur la semelle.` } };
      } },
      { id: 'combinaison', zone: 'calcul', titre: 'Coefficients de sécurité', contenu: () => ({ type: 'situation', situation: s('combinaison', 'Coefficients de sécurité',
        'Un stagiaire demande pourquoi on multiplie les charges par 1,35 et 1,5 avant de dimensionner.',
        ['Pour couvrir les incertitudes : charges plus fortes que prévu, matériaux un peu plus faibles', 'Les coefficients de sécurité garantissent que l’ouvrage tienne même dans des conditions défavorables.'],
        [['C’est pour faire travailler les fournisseurs', 'Aucun rapport : c’est une règle de calcul aux états limites.'], ['On peut les enlever pour économiser', 'Sans marge de sécurité, le moindre écart peut mener à la rupture.']]) }) },
    ] },
    { id: 'fondations', nom: 'Dimensionner la semelle', resume: 'La semelle répartit la charge du poteau sur un sol qui ne supporte qu’une certaine pression.', taches: [
      { id: 'semelle', zone: 'calcul', titre: 'Surface de la semelle', contenu: cycle => {
        const e = etude(cycle);
        return { type: 'mesure', mesure: {
          titre: 'Surface de la semelle', enonce: 'La pression transmise au sol ne doit pas dépasser la contrainte admissible du rapport géotechnique.',
          donnees: [{ libelle: 'Charge du poteau', valeur: `${fr(e.n)} kN` }, { libelle: 'Contrainte admissible du sol', valeur: `${fr(e.sol)} kPa` }],
          question: 'Surface minimale de la semelle, en m² ?', unite: 'm²', reponse: e.surface, tolerance: .02,
          explication: `Surface = charge ÷ contrainte : ${fr(e.n)} ÷ ${fr(e.sol)} = ${fr(e.surface, 2)} m², soit une semelle d’environ ${fr(Math.sqrt(e.surface), 2)} m de côté.` } };
      } },
      { id: 'sol-mou', zone: 'maquette', titre: 'Argile molle', contenu: () => ({ type: 'situation', situation: s('sol-mou', 'Argile molle',
        'Le rapport de sol signale deux mètres d’argile molle avant un bon sol.',
        ['J’adapte les fondations : plus profondes, sur le bon sol, ou un autre type selon l’étude', 'On fonde sur le sol qui porte : poser des semelles dans l’argile molle, c’est préparer les fissures.'],
        [['Je garde des semelles standard à 80 cm', 'Elles reposeraient sur l’argile : tassements et fissures assurés.'], ['Je double le ferraillage des murs', 'Le problème est sous la maison, pas dans les murs.']]) }) },
    ] },
    { id: 'ferraillage', nom: 'Ferrailler la poutre', resume: 'L’acier reprend la traction : sa section et son enrobage se calculent, ils ne se devinent pas.', taches: [
      { id: 'acier', zone: 'calcul', titre: 'Section d’acier', contenu: cycle => {
        const [n, d] = selon(cycle, [[4, 12], [3, 14], [5, 10], [4, 16]] as const), section = n * Math.PI * (d / 10) ** 2 / 4;
        return { type: 'mesure', mesure: {
          titre: 'Section d’acier', enonce: 'La note de calcul demande une section d’acier en bas de poutre ; vérifie celle du plan.',
          donnees: [{ libelle: 'Armatures prévues', valeur: `${n} HA${d}` }, { libelle: 'Diamètre d’une barre', valeur: `${d} mm` }],
          question: 'Section totale, en cm² ?', unite: 'cm²', reponse: section, tolerance: .02,
          explication: `Une barre de ${d} mm fait π × ${fr(d / 10, 1)}² ÷ 4 = ${fr(Math.PI * (d / 10) ** 2 / 4, 2)} cm² ; ${n} barres : ${fr(section, 2)} cm².` } };
      } },
      { id: 'enrobage', zone: 'maquette', titre: 'Enrobage', contenu: () => ({ type: 'situation', situation: s('enrobage', 'Enrobage',
        'Le bâtiment se trouve à deux cents mètres de la lagune.',
        ['Je prévois un enrobage renforcé et je le fais respecter avec des cales', 'L’air salin attaque l’acier : un bon enrobage, tenu par des cales, protège les armatures pendant des décennies.'],
        [['L’enrobage habituel suffit partout', 'En ambiance saline, l’acier trop près de la surface rouille et fait éclater le béton.'], ['Je supprime les cales pour gagner du temps', 'Sans cales, les aciers touchent le coffrage : l’enrobage n’existe plus.']]) }) },
    ] },
    { id: 'note', nom: 'Note de calcul et plans', resume: 'Tout ce qui a été calculé doit être écrit, vérifiable, et traduit en plans pour le chantier.', taches: [
      { id: 'contenu-note', zone: 'bureau', titre: 'Note de calcul', contenu: () => ({ type: 'selection', selection: {
        titre: 'Note de calcul', enonce: 'Tu rédiges la note de calcul pour le bureau de contrôle.', consigne: 'Coche ce qu’elle doit contenir.',
        options: [
          { texte: 'Les hypothèses : charges, matériaux, sol', attendu: true, explication: 'Sans hypothèses écrites, personne ne peut vérifier le calcul.' },
          { texte: 'La descente de charges', attendu: true, explication: 'Elle justifie les efforts dans chaque élément.' },
          { texte: 'Le dimensionnement des poutres, poteaux et semelles', attendu: true, explication: 'C’est le cœur de la note.' },
          { texte: 'Les références des règles de calcul utilisées', attendu: true, explication: 'Elles disent selon quelles règles l’ouvrage est justifié.' },
          { texte: 'L’avis du client sur la couleur des carreaux', attendu: false, explication: 'Hors sujet pour une note de structure.' },
          { texte: 'Le planning des congés du bureau', attendu: false, explication: 'Rien à voir avec la justification de l’ouvrage.' },
        ] } }) },
      { id: 'indice', zone: 'bureau', titre: 'Plan modifié', contenu: () => ({ type: 'situation', situation: s('indice', 'Plan modifié',
        'L’architecte déplace un mur porteur après la diffusion de tes plans de ferraillage.',
        ['Je reprends le calcul, j’édite les plans à un nouvel indice et je les rediffuse', 'Chaque modification se trace : le chantier doit toujours travailler sur le dernier indice.'],
        [['Je corrige au stylo sur le plan du chantier', 'Une correction à la main se perd et ne vaut rien en cas de litige.'], ['Je laisse le plan tel quel, le mur bouge peu', 'Un mur porteur déplacé change les charges : il faut recalculer.']]) }) },
    ] },
    { id: 'visa', nom: 'Visa et contrôle', resume: 'Le bureau de contrôle vérifie l’étude ; sur le chantier, rien ne se modifie sans l’ingénieur.', taches: [
      { id: 'controleur', zone: 'bureau', titre: 'Remarques du contrôleur', contenu: () => ({ type: 'situation', situation: s('controleur', 'Remarques du contrôleur',
        'Le bureau de contrôle refuse ton plan de fondations avec cinq remarques.',
        ['Je réponds point par point, je corrige ce qui doit l’être et je justifie le reste', 'Le contrôle protège tout le monde : on y répond avec des faits et des calculs.'],
        [['Je les ignore et je diffuse quand même', 'Sans visa, le chantier ne peut pas couler les fondations.'], ['Je change de bureau de contrôle', 'Le nouveau relèvera les mêmes erreurs, avec du retard en plus.']]) }) },
      { id: 'poutre', zone: 'maquette', titre: 'Une poutre « inutile »', contenu: () => ({ type: 'situation', situation: s('poutre', 'Une poutre « inutile »',
        'Le chef de chantier veut supprimer une poutre qui « ne sert à rien » pour gagner de la hauteur.',
        ['Je refuse tant qu’un calcul ne démontre pas qu’on peut s’en passer', 'Une poutre reprend des charges, même quand on ne les voit pas : on ne la supprime jamais à l’œil.'],
        [['J’accepte, il a de l’expérience', 'L’expérience ne remplace pas le calcul : c’est la structure qui est en jeu.'], ['Je lui dis de la remplacer par des briques', 'La maçonnerie n’a pas la résistance d’une poutre en béton armé.']]) }) },
    ] },
  ],
};

/** Plateau de 22 × 16 m, entrée au sud : archives au nord-ouest, deux rangs de postes de calcul, maquette à l'est, bureau d'Inès au sud-est. */
export const PLAN_BUREAU_ETUDES: PlanLieu = {
  demiLargeur: 11, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.8],
  obstacles: [
    zone(-10.6, -5.4, -8, -6.6),       // armoires à plans
    zone(-6, 2, -3.2, -2.2),           // postes de calcul, premier rang
    zone(-6, 2, .2, 1.2),              // postes de calcul, second rang
    zone(5, 9, -3.4, -.6),             // table de la maquette
    zone(5.4, 8.6, 3, 4),              // bureau d'Inès
    zone(-9.4, -6.6, 3, 4.6),          // table de revue des plans
    zone(9.8, 11, -8, -6.4),           // traceur de plans
  ],
  stations: { archives: [-8, -5.9], calcul: [-2, -1], maquette: [7, .1], bureau: [-8, 5.3], tableau: [1, -6.9], mentor: [7, 4.7] },
  libelles: { archives: 'Archives des plans', calcul: 'Postes de calcul', maquette: 'Maquette', bureau: 'Table de revue', tableau: 'Tableau des compétences', mentor: 'Inès' },
  mentor: { position: [7, 2.5], rotation: 0 },
};
