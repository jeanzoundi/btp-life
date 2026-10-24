// Agence des talents : décrocher un poste, du bilan de ses atouts à la signature du contrat.
// Mécanique propre : préparer sa candidature comme un vrai recrutement (CV, test technique, entretien,
// négociation), puis candidater pour de bon aux offres du jeu (POST /offres/:id/candidater).
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

export const PROGRAMME_AGENCE: ProgrammeLieu = {
  slug: 'agence', titre: 'Décrocher un poste', cycle: 'candidature',
  mentor: { nom: 'Esther Kacou', role: 'Chargée de recrutement, Agence des talents' }, horaires: { ouverture: 8, fermeture: 17 },
  etapes: [
    { id: 'bilan', nom: 'Faire le point', resume: 'Savoir ce que tu sais faire, et viser le poste qui te correspond.', taches: [
      { id: 'atouts', zone: 'accueil', titre: 'Tes atouts', contenu: () => ({ type: 'selection', selection: {
        titre: 'Tes atouts', enonce: 'Tu vises un poste de chef de chantier dans une PME du bâtiment.', consigne: 'Coche les atouts à mettre en avant.',
        options: [
          { texte: 'Tu as encadré une équipe de maçons et de manœuvres', attendu: true, explication: 'Diriger une équipe est le cœur du métier de chef de chantier.' },
          { texte: 'Tu lis les plans de coffrage et de ferraillage', attendu: true, explication: 'Sans lecture de plans, impossible de contrôler ce qui se construit.' },
          { texte: 'Tu fais respecter le port des EPI', attendu: true, explication: 'La sécurité de l’équipe est sous la responsabilité du chef.' },
          { texte: 'Tu suis les quantités et les livraisons', attendu: true, explication: 'Le métré et les bons de livraison tiennent le budget du chantier.' },
          { texte: 'Tu connais personnellement le maire', attendu: false, explication: 'Un recruteur cherche des compétences, pas des relations.' },
          { texte: 'Tu es le meilleur au jeu de dames du quartier', attendu: false, explication: 'Sympathique, mais hors sujet pour ce poste.' },
          { texte: 'Tu n’as jamais été malade', attendu: false, explication: 'Ce n’est ni vérifiable ni un argument professionnel.' },
        ] } }) },
      { id: 'cible', zone: 'accueil', titre: 'Le bon poste', contenu: () => ({ type: 'situation', situation: s('cible', 'Le bon poste',
        'Tu as deux ans d’expérience de chef d’équipe. Trois offres : conducteur de travaux senior, chef de chantier, manœuvre.',
        ['Je vise chef de chantier, l’étape suivante de mon parcours', 'Le poste correspond à ton expérience et te fait progresser : ta candidature sera crédible.'],
        [['Conducteur de travaux senior, autant viser haut', 'Il faut des années d’expérience que tu n’as pas encore : refus quasi certain.'], ['Manœuvre, pour être sûr d’être pris', 'Tu te sous-estimes, et le recruteur le remarquera.']]) }) },
    ] },
    { id: 'cv', nom: 'Le CV', resume: 'Un CV clair qui montre les chantiers que tu as faits, ce que tu sais faire, et qui peut le confirmer.', taches: [
      { id: 'contenu-cv', zone: 'cv', titre: 'Contenu du CV', contenu: () => ({ type: 'selection', selection: {
        titre: 'Contenu du CV', enonce: 'Tu rédiges ton CV pour le poste de chef de chantier.', consigne: 'Coche ce qui doit y figurer.',
        options: [
          { texte: 'Les chantiers réalisés : nature, montant, ton rôle, les dates', attendu: true, explication: 'C’est la preuve concrète de ton expérience.' },
          { texte: 'Les logiciels que tu maîtrises', attendu: true, explication: 'Tableur, lecture de plans numériques : de vrais atouts.' },
          { texte: 'Tes formations et habilitations', attendu: true, explication: 'Sauveteur secouriste, travail en hauteur : elles rassurent l’employeur.' },
          { texte: 'Deux références joignables', attendu: true, explication: 'Un ancien chef qui confirme ton travail vaut mieux qu’un long discours.' },
          { texte: 'Un chantier que tu n’as pas fait, pour étoffer', attendu: false, explication: 'Un mensonge se découvre au premier appel de référence.' },
          { texte: 'Ton numéro de compte bancaire', attendu: false, explication: 'Il n’a rien à faire sur un CV, et c’est risqué.' },
          { texte: 'La liste de tes plats préférés', attendu: false, explication: 'Hors sujet : le recruteur a peu de temps.' },
        ] } }) },
      { id: 'trou', zone: 'cv', titre: 'Huit mois sans emploi', contenu: () => ({ type: 'situation', situation: s('trou', 'Huit mois sans emploi',
        'Ton CV montre huit mois sans emploi l’an dernier.',
        ['Je l’explique franchement : la formation suivie, les petits chantiers, ce que j’ai appris', 'Une période expliquée et utile ne fait pas peur ; un trou caché, si.'],
        [['Je décale les dates pour le cacher', 'Une vérification suffit à te disqualifier pour tromperie.'], ['Je n’en parle pas, on verra bien', 'Le recruteur posera la question, et tu seras pris de court.']]) }) },
    ] },
    { id: 'test', nom: 'Le test technique', resume: 'Avant l’entretien, l’entreprise vérifie ce que tu sais faire, sur le papier.', taches: [
      { id: 'metre-test', zone: 'test', titre: 'Métré de semelles', contenu: cycle => {
        const [nombre, cote, hauteur] = selon(cycle, [[12, .8, .4], [8, 1, .35], [10, .9, .4], [16, .7, .3]] as const), v = nombre * cote * cote * hauteur;
        return { type: 'mesure', mesure: {
          titre: 'Métré de semelles', enonce: 'Le test commence par un métré simple : le béton des semelles isolées d’un bâtiment.',
          donnees: [{ libelle: 'Nombre de semelles', valeur: String(nombre) }, { libelle: 'Dimensions', valeur: `${fr(cote, 2)} × ${fr(cote, 2)} m` }, { libelle: 'Hauteur', valeur: `${fr(hauteur, 2)} m` }],
          question: 'Volume total de béton, en m³ ?', unite: 'm³', reponse: v, tolerance: .02,
          explication: `${nombre} × ${fr(cote, 2)} × ${fr(cote, 2)} × ${fr(hauteur, 2)} = ${fr(v, 3)} m³.` } };
      } },
      { id: 'echafaudage', zone: 'test', titre: 'Photo de chantier', contenu: () => ({ type: 'situation', situation: s('echafaudage', 'Photo de chantier',
        'Sur la photo du test, un ouvrier travaille à quatre mètres de haut sur un échafaudage sans garde-corps.',
        ['J’arrête le travail et je fais poser les garde-corps avant de reprendre', 'Une chute de quatre mètres peut tuer : la protection collective passe avant le planning.'],
        [['Je lui dis de faire attention', 'L’attention ne retient personne quand on glisse.'], ['Je termine la journée et je verrai demain', 'Le risque est là maintenant, pas demain.']]) }) },
    ] },
    { id: 'entretien', nom: 'L’entretien', resume: 'Convaincre en restant vrai : des exemples précis, de la sécurité, de l’intérêt pour l’entreprise.', taches: [
      { id: 'echec', zone: 'entretien', titre: '« Parlez-moi d’un échec »', contenu: () => ({ type: 'situation', situation: s('echec', '« Parlez-moi d’un échec »',
        'Le recruteur te demande de raconter un échec sur un chantier.',
        ['Je raconte un cas précis, ce que j’ai fait pour corriger, et ce que j’ai changé depuis', 'Un échec dont on a tiré une leçon montre de la lucidité et de la méthode.'],
        [['Je n’ai jamais connu d’échec', 'Personne ne le croira : c’est un manque de recul.'], ['Je raconte l’erreur d’un collègue', 'Rejeter la faute sur les autres est un très mauvais signal.']]) }) },
      { id: 'beton-refuse', zone: 'entretien', titre: 'Mise en situation', contenu: () => ({ type: 'situation', situation: s('beton-refuse', 'Mise en situation',
        '« Le béton livré n’est pas celui du bon de commande. Que faites-vous ? »',
        ['Je refuse la toupie ou je l’accepte sous réserve écrite, et je préviens le conducteur de travaux', 'Tracer et prévenir : c’est la réponse d’un chef de chantier fiable.'],
        [['Je coule quand même, l’équipe attend', 'Un mauvais béton dans une structure, c’est un ouvrage à démolir.'], ['Je renvoie le chauffeur sans rien noter', 'Sans trace écrite, le litige avec le fournisseur est perdu.']]) }) },
      { id: 'entreprise', zone: 'entretien', titre: '« Pourquoi nous ? »', contenu: () => ({ type: 'situation', situation: s('entreprise', '« Pourquoi nous ? »',
        'On te demande pourquoi tu veux rejoindre cette entreprise.',
        ['Je cite leurs chantiers récents et ce que je peux y apporter', 'Montrer que tu t’es renseigné prouve ta motivation mieux que n’importe quel compliment.'],
        [['Parce que je cherche du travail', 'Vrai, mais cela ne distingue en rien ta candidature.'], ['Parce que vous payez bien, paraît-il', 'Parler d’argent d’entrée laisse une mauvaise impression.']]) }) },
    ] },
    { id: 'proposition', nom: 'La proposition', resume: 'Comprendre l’offre, négocier avec des arguments, réussir la période d’essai.', taches: [
      { id: 'annuel', zone: 'entretien', titre: 'Salaire annuel', contenu: cycle => {
        const [mensuel, mois, prime] = selon(cycle, [[450_000, 13, 0], [600_000, 13, 0], [380_000, 12, 200_000], [520_000, 13, 150_000]] as const), total = mensuel * mois + prime;
        return { type: 'mesure', mesure: {
          titre: 'Salaire annuel', enonce: 'L’entreprise te fait une proposition écrite ; compare-la sur l’année.',
          donnees: [{ libelle: 'Salaire mensuel brut', valeur: `${fr(mensuel)} F` }, { libelle: 'Nombre de mois payés', valeur: String(mois) }, { libelle: 'Prime de fin de chantier', valeur: `${fr(prime)} F` }],
          question: 'Total brut sur l’année, en francs ?', unite: 'F', reponse: total, tolerance: 0,
          explication: `${fr(mensuel)} × ${mois} + ${fr(prime)} = ${fr(total)} F brut par an.` } };
      } },
      { id: 'negocier', zone: 'entretien', titre: 'Négocier', contenu: () => ({ type: 'situation', situation: s('negocier', 'Négocier',
        'La proposition est un peu en dessous de ce qui se pratique pour ce poste.',
        ['Je demande un ajustement en m’appuyant sur les salaires du marché et sur mon expérience', 'Une demande argumentée et raisonnable se discute ; elle montre que tu connais ta valeur.'],
        [['J’invente une autre offre pour faire monter le prix', 'Un bluff découvert ruine la confiance avant même le premier jour.'], ['Je pose un ultimatum : c’est ça ou rien', 'Un ultimatum ferme la discussion, souvent à ton détriment.']]) }) },
      { id: 'essai', zone: 'accueil', titre: 'Période d’essai', contenu: () => ({ type: 'situation', situation: s('essai', 'Période d’essai',
        'Le contrat prévoit trois mois d’essai.',
        ['Je suis ponctuel, je respecte les consignes et je fais le point avec mon chef chaque mois', 'L’essai sert aux deux parties à se découvrir : la régularité fait la différence.'],
        [['Je me relâche, le contrat est signé', 'Pendant l’essai, l’une ou l’autre partie peut arrêter sans préavis long.'], ['Je refuse les tâches qui ne me plaisent pas', 'Pendant l’essai, on démontre sa polyvalence.']]) }) },
    ] },
  ],
};

/** Agence de 22 × 16 m, entrée au sud : accueil et mur des offres au fond, espace CV à l'ouest, salle de test au centre, bureaux d'entretien à l'est. */
export const PLAN_AGENCE: PlanLieu = {
  demiLargeur: 11, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.8],
  obstacles: [
    zone(-4, 4, -6.6, -5.4),           // comptoir d'accueil
    zone(-10.4, -6.6, 1.2, 2.2),       // espace CV, postes informatiques
    zone(-2.2, 1.4, .4, 1.6),          // table de la salle de test
    zone(5.4, 7.6, -3.6, -2.6),        // bureau d'entretien
    zone(5.4, 7.6, 1.4, 2.4),          // bureau de la chargée de recrutement
    zone(2.2, 5, 4.6, 5.6),            // chaises d'attente
    zone(9.8, 11, -8, -6.2),           // fontaine à eau et plante
  ],
  stations: { accueil: [0, -4.6], cv: [-8.5, 2.9], test: [-.4, 2.3], entretien: [6.5, -1.9], offres: [-6.5, -5.4], mentor: [6.5, 3.1] },
  libelles: { accueil: 'Accueil', cv: 'Espace CV', test: 'Salle de test', entretien: 'Bureau d’entretien', offres: 'Mur des offres', mentor: 'Esther' },
  mentor: { position: [6.5, .9], rotation: 0 },
};
