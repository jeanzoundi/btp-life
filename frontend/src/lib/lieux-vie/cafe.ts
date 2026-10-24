// Le Café des Bâtisseurs : comptoir et machine à expresso, tables de bistrot, tableau des annonces, et la table où
// se retrouvent une architecte, un patron de PME et une ingénieure. On y gagne du lien social… et un réseau.
import { zone, type Assise, type Point } from '../navigation-plan';
import type { SituationTerrain } from '../programme-chantier';
import type { ArticleCarte, LieuVie } from '.';

export const ARTICLES_CAFE: ArticleCarte[] = [
  { id: 'cafe-noir', nom: 'Café noir', detail: 'Serré, au comptoir', categorie: 'boisson', action: 'social', prix: 300, effets: { energie: 15, social: 10 }, moral: 1, preparation: 2, message: 'Un café serré au comptoir, et la conversation démarre.' },
  { id: 'the-menthe', nom: 'Thé à la menthe', detail: 'Servi en trois verres, on prend le temps', categorie: 'boisson', action: 'social', prix: 300, effets: { social: 20 }, moral: 1, preparation: 3, message: 'Le thé à la menthe, servi en trois verres : on prend le temps.' },
  { id: 'jus-passion', nom: 'Jus de passion', detail: 'Pressé minute, bien frais', categorie: 'boisson', action: 'social', prix: 500, effets: { faim: 5, social: 15 }, moral: 2, preparation: 2, message: 'Un jus de passion frais en terrasse.' },
  { id: 'cafe-croissant', nom: 'Café et croissant', detail: 'La pause des bâtisseurs', categorie: 'plat', action: 'social', prix: 900, effets: { faim: 20, energie: 12, social: 10 }, moral: 2, preparation: 3, message: 'Café et croissant : la pause des bâtisseurs.' },
  { id: 'tournee', nom: 'Tournée pour la table', detail: 'Tu offres à boire à toute la table', categorie: 'boisson', action: 'social', prix: 2500, effets: { social: 60 }, moral: 6, preparation: 4, message: 'Tu offres la tournée : toute la table trinque avec toi.' },
];

export const TABLES_CAFE: Point[] = [[-6.2, -1.6], [-2.5, -1.6], [1.6, -1.6], [-6.2, 2.2], [-2.5, 2.2]];

export const CAFE: LieuVie = {
  slug: 'cafe', nom: 'Café des Bâtisseurs',
  accroche: 'Chefs de chantier, dessinateurs et ingénieurs s’y croisent : le réseau se construit ici autant que sur les fondations.',
  hote: { nom: 'Kader', role: 'Gérant du café' },
  horaires: { ouverture: 7, fermeture: 21 },
  carte: ARTICLES_CAFE,
  plan: {
    ambiance: 'interieur', demiLargeur: 10, demiProfondeur: 7, depart: [0, 5.8],
    obstacles: [
      zone(-7.4, 1.4, -7, -4.7), // comptoir et machine à expresso
      ...TABLES_CAFE.map(([x, z]) => zone(x - .85, x + .85, z - .85, z + .85)),
      zone(4.1, 6.9, .1, 2.9), // table du réseau
      zone(-9.6, -6.4, 4.2, 7), // coin canapé
      zone(8.7, 10, -7, -5.7), // grande plante du coin
    ],
    stations: { comptoir: [-3, -4.1], table: [-2.5, 3.5], reseau: [5.5, 3.5], annonces: [6.2, -5.7], mentor: [-3, -4.1] },
    libelles: { comptoir: 'Comptoir', table: 'Ta table', reseau: 'Table du réseau', annonces: 'Tableau des annonces', mentor: 'Kader' },
    mentor: { position: [-3, -6.1], rotation: 0 },
  },
};

export const ASSISES_CAFE: Record<'table' | 'reseau', Assise> = {
  table: { position: [-2.5, 2.9], rotation: Math.PI },
  reseau: { position: [5.5, 2.45], rotation: Math.PI },
};

export interface Professionnel {
  /** Nom complet : c'est aussi la clé de la relation, gardée dans l'état du monde (relations). */
  nom: string; metier: string; presentation: string;
  /** Modèle : « prof » donne la tenue de bureau ; la variante choisit l'homme ou la femme. */
  prof: boolean; variante: number;
  /** Place autour de la table du réseau. */
  place: Assise;
  conversations: SituationTerrain[];
  conseils: { seuil: number; texte: string }[];
}

const c = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

export const PROFESSIONNELS: Professionnel[] = [
  {
    nom: 'Aminata Koné', metier: 'Architecte', prof: true, variante: 0, place: { position: [5.5, .55], rotation: 0 },
    presentation: 'Elle dessine des maisons et des écoles à Cocody et à Bingerville. Elle cherche des gens de chantier qui comprennent ses plans.',
    conversations: [
      c('kone-poteau', 'Un poteau qui gêne', 'Mon client veut supprimer un poteau du rez-de-chaussée pour agrandir son salon. Ton avis ?',
        ['On ne supprime rien sans l’ingénieur structure : il faudra une poutre de reprise calculée.', 'Exactement. Un homme de chantier qui écoute l’ingénieur, c’est précieux.'],
        [['Si le poteau gêne, on l’enlève : la dalle tiendra.', 'Elle ne tiendra pas : sans reprise de charge, c’est l’accident assuré.'], ['Ce n’est pas mon affaire, je suis sur le chantier.', 'Sur un chantier, la structure regarde tout le monde.']]),
      c('kone-fraicheur', 'Une maison fraîche', 'Sous notre climat, comment garder une maison fraîche sans tout climatiser ?',
        ['Orienter les ouvertures, faire traverser l’air, protéger les façades du soleil de l’ouest.', 'C’est l’architecture bioclimatique. Tu as l’œil, j’aime ça.'],
        [['Mettre de grandes baies vitrées plein ouest pour la lumière.', 'Plein ouest, tu fabriques un four tous les après-midi.'], ['Peindre les murs en sombre.', 'Le sombre absorbe la chaleur : c’est l’inverse qu’il faut.']]),
      c('kone-permis', 'Un permis « arrangé »', 'Un client hésite entre un permis « arrangé » et la procédure normale. Que lui conseilles-tu ?',
        ['La procédure normale : un permis douteux peut faire arrêter le chantier, voire démolir.', 'Merci. L’honnêteté se voit, et elle se recommande.'],
        [['Un petit billet accélère tout, tout le monde le fait.', 'Et un jour, tout le monde se fait prendre. Pas avec moi.'], ['Construire d’abord, le permis suivra.', 'La mairie peut tout arrêter du jour au lendemain.']]),
    ],
    conseils: [
      { seuil: 30, texte: 'À la mairie, un dossier complet passe deux fois plus vite : plans, titre foncier, attestation de l’architecte. Akissi te le dira.' },
      { seuil: 60, texte: 'J’ai donné ton nom à deux clients qui cherchent un conducteur de travaux sérieux. On parle de toi.' },
      { seuil: 90, texte: 'Tu as la rigueur d’un chef de projet. Le jour où tu montes ta structure, je te confie mes chantiers.' },
    ],
  },
  {
    nom: 'Serge Aka', metier: 'Gérant d’une PME de construction', prof: true, variante: 1, place: { position: [4.55, 1.5], rotation: Math.PI / 2 },
    presentation: 'Vingt ouvriers, trois chantiers en cours à Yopougon. Il a commencé maçon, il connaît la valeur d’une équipe fiable.',
    conversations: [
      c('aka-retard', 'Un client qui paie en retard', 'Un client me paie avec trois mois de retard. Mes ouvriers attendent leur salaire. Toi, tu ferais quoi ?',
        ['Payer les ouvriers d’abord, relancer le client par écrit, et exiger des acomptes dans les prochains contrats.', 'C’est ce que je fais. Une équipe payée à l’heure, c’est une équipe qui reste.'],
        [['Ne plus payer les ouvriers tant que le client ne paie pas.', 'Tu perds ton équipe et ta réputation en une semaine.'], ['Abandonner le chantier.', 'Tu perdrais le client, la caution et ton nom.']]),
      c('aka-prix', 'Répondre à un appel d’offres', 'Je réponds à un appel d’offres. Comment fixer mon prix ?',
        ['Faire un métré précis, chiffrer matériaux, main-d’œuvre et frais, puis ajouter une marge raisonnable.', 'Voilà comment on dure dans ce métier.'],
        [['Mettre le prix le plus bas pour gagner, on verra après.', 'Le chantier à perte, c’est la faillite au bout du compte.'], ['Reprendre le prix d’un concurrent.', 'Son prix ne connaît ni tes coûts ni ton chantier.']]),
      c('aka-harnais', 'Le harnais refusé', 'Un ouvrier refuse son harnais en hauteur : il dit qu’il a l’habitude.',
        ['Pas de harnais, pas de travail en hauteur : je l’explique et la règle vaut pour tous.', 'Bien. La sécurité ne se négocie pas, même avec les anciens.'],
        [['Je le laisse faire, il est expérimenté.', 'Une chute de six mètres, l’expérience n’y change rien.'], ['Je lui retire une journée de salaire sans explication.', 'Sans explication, il recommencera dès que tu auras le dos tourné.']]),
    ],
    conseils: [
      { seuil: 30, texte: 'Au dépôt, fais toujours signer le bon de livraison avec tes réserves : c’est ta seule preuve en cas de litige.' },
      { seuil: 60, texte: 'Mets de côté à la banque : le jour où tu lanceras ton chantier, l’apport fera la différence.' },
      { seuil: 90, texte: 'Si tu montes ton entreprise, viens me voir : je te présenterai mon banquier et mes fournisseurs.' },
    ],
  },
  {
    nom: 'Inès Diabaté', metier: 'Ingénieure structure', prof: false, variante: 1, place: { position: [6.45, 1.5], rotation: -Math.PI / 2 },
    presentation: 'Elle calcule les poutres, les dalles et les fondations des immeubles du Plateau. Elle déteste les approximations.',
    conversations: [
      c('diabate-ferraillage', 'Un ferraillage non vérifié', 'On coule un poteau demain matin, et personne n’a vérifié le ferraillage. Tu ferais quoi ?',
        ['Je refuse de couler tant que le ferraillage n’est pas contrôlé : barres, cadres, enrobage.', 'Parfait. Une fois dans le béton, plus rien ne se rattrape.'],
        [['On coule, on vérifiera après.', 'Après, c’est dans le béton : plus rien ne se vérifie.'], ['On ajoute du ciment pour compenser.', 'Plus de ciment ne remplace jamais une armature.']]),
      c('diabate-enrobage', 'L’enrobage près de la lagune', 'Pourquoi l’enrobage des armatures compte-t-il autant, ici près de la lagune ?',
        ['Il protège l’acier de la corrosion : l’air salin attaque les armatures trop proches de la surface.', 'Exactement. Deux centimètres de trop peu, et l’acier rouille en dix ans.'],
        [['C’est surtout pour l’esthétique.', 'Rien d’esthétique : c’est la durée de vie de l’ouvrage qui est en jeu.'], ['Pour économiser de l’acier.', 'Au contraire, c’est pour qu’il dure.']]),
      c('diabate-fissure', 'Une fissure en escalier', 'Une fissure en escalier apparaît dans un mur porteur en agglos. Première chose à faire ?',
        ['Poser des témoins et faire diagnostiquer les fondations : c’est souvent un tassement.', 'Oui. On soigne la cause, pas la fissure.'],
        [['La reboucher à l’enduit.', 'Tu caches le symptôme, la cause reste et la fissure revient.'], ['Repeindre le mur.', 'La peinture ne tient pas un mur qui bouge.']]),
    ],
    conseils: [
      { seuil: 30, texte: 'Au labo, attends toujours les résultats à 28 jours avant de juger un béton : à 7 jours, on n’a qu’une tendance.' },
      { seuil: 60, texte: 'Je t’enverrai mes notes de calcul : regarde comment je descends les charges, ça t’aidera au chantier.' },
      { seuil: 90, texte: 'Tu raisonnes comme une ingénieure. Pense à la Grande École de l’université : tu y as ta place.' },
    ],
  },
];

/** Les professionnels passent à la pause de midi et après le travail. */
export const RESEAU_PRESENT = (heure: number) => (heure >= 12 && heure < 14) || (heure >= 17 && heure < 21);
/** Offrir la tournée à la table du réseau rapproche de chacun. */
export const POINTS_TOURNEE = 5;

/** Points gagnés à chaque conversation : la bonne approche fait vraiment avancer la relation, les autres un peu. */
export const POINTS_RELATION = { juste: 12, autre: 3 };

/** Conversation du moment : on change de sujet à chaque palier de 12 points, un faux pas fait reprendre le même. */
export const conversationDu = (pro: Professionnel, relation: number) => pro.conversations[Math.floor(Math.max(0, relation) / POINTS_RELATION.juste) % pro.conversations.length];

export function niveauRelation(relation: number) {
  return relation >= 90 ? 'Mentor' : relation >= 60 ? 'Allié' : relation >= 30 ? 'Contact' : 'Connaissance';
}

/** Conseils débloqués par la relation, du premier au dernier. */
export const conseilsObtenus = (pro: Professionnel, relation: number) => pro.conseils.filter(x => relation >= x.seuil);
