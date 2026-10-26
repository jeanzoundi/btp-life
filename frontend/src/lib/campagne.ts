// Le fil rouge : une campagne qui suit un même immeuble, la Résidence Akwaba (R+3, huit logements, pour Mme Touré), à
// travers les lieux du quartier. L'offre de l'entreprise, le sol, la structure, le permis, le prêt, la commande, le coulage,
// la sécurité du gros œuvre, puis la réception sur la parcelle : chaque chapitre se joue chez le mentor d'un lieu, avec les
// mêmes chiffres d'un bout à l'autre (les semelles calculées au bureau d'études sont celles qu'on commande au dépôt).
// Le serveur tient la progression et paie (backend/src/carriere/campagne.service.ts). Sans Three.js ni React.
import type { SituationTerrain } from './programme-chantier';
import { fr, type ContenuTache, type SeanceLieu } from './programme-lieu';

export const CAMPAGNE = { id: 'residence-akwaba', nom: 'Résidence Akwaba', ouvrage: 'R+3 · 8 logements', cliente: 'Mme Touré' } as const;
/** Un chapitre se valide à 50 sur 100 (comme au serveur) ; en dessous, il se rejoue aussitôt. */
export const NOTE_CHAPITRE = 50;
/** La parcelle, au Plateau Nord : entre l'hôtel de ville et le laboratoire, face à l'avenue. Clôturée, on n'y marche pas. */
export const PARCELLE_AKWABA = { slug: 'parcelle-akwaba', x: 0, z: -78.5, largeur: 20, profondeur: 13 } as const;
/** Mme Touré reçoit sur sa parcelle aux heures de chantier. */
export const CLIENTE_AKWABA = { nom: 'Mme Touré', role: 'Cliente, propriétaire de la parcelle', horaires: { ouverture: 8, fermeture: 17 } } as const;

export interface TacheCampagne { id: string; zone: string; titre: string; contenu: ContenuTache }
export interface ChapitreCampagne {
  id: string;
  /** Lieu du chapitre : un lieu à programme du quartier, ou la parcelle elle-même pour la réception. */
  lieu: string;
  titre: string;
  /** Ce qui se joue, en une ligne, pour la liste des chapitres. */
  resume: string;
  /** Ce que dit l'interlocuteur en ouvrant le chapitre. */
  recit: string;
  /** Ce qui change sur la parcelle une fois le chapitre validé. */
  avancee: string;
  taches: TacheCampagne[];
}

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });
const situation = (id: string, zone: string, titre: string, texte: string, bonne: [string, string], mauvaises: [string, string][]): TacheCampagne =>
  ({ id, zone, titre, contenu: { type: 'situation', situation: s(id, titre, texte, bonne, mauvaises) } });

// Les chiffres de l'immeuble, repris d'un chapitre à l'autre.
const DEBOURSE = 122, COEF_VENTE = 1.25, TVA = .18;
const PRIX_HT = DEBOURSE * COEF_VENTE;                                  // 152,5 M FCFA
const RUPTURE = 600, SECURITE_SOL = 3, ADMISSIBLE = RUPTURE / SECURITE_SOL; // 200 kPa
const SURFACE_POTEAU = 16, CHARGE_M2 = 12, PLANCHERS = 4;
const CHARGE_POTEAU = SURFACE_POTEAU * CHARGE_M2 * PLANCHERS;           // 768 kN
const COTE_SEMELLE = Math.sqrt(CHARGE_POTEAU / ADMISSIBLE);              // ≈ 1,96 m, arrondi à 2,00 m
const SEMELLES = 16, VOLUME_SEMELLES = SEMELLES * 2 * 2 * .5;          // 32 m³
const BUDGET = 180, PART_BANQUE = .7, RETENUE = .05;

export const CHAPITRES: ChapitreCampagne[] = [
  {
    id: 'offre', lieu: 'entreprise', titre: 'Le marché clé en main', resume: 'Chiffrer et défendre l’offre de l’entreprise.',
    recit: 'Mme Touré a une parcelle au Plateau Nord, entre l’hôtel de ville et le laboratoire. Elle veut y bâtir la Résidence Akwaba : un R+3 de huit logements, livré clé en main, et consulte trois entreprises. Si notre offre l’emporte, c’est toi qui suivras cet immeuble de bout en bout.',
    avancee: 'Offre retenue : le panneau du projet est planté sur la parcelle.',
    taches: [
      { id: 'montant-offre', zone: 'finances', titre: 'Montant de l’offre', contenu: { type: 'mesure', mesure: {
        titre: 'Montant de l’offre', enonce: 'Le déboursé sec couvre matériaux, main-d’œuvre et matériel ; le coefficient de vente ajoute frais généraux et marge. La TVA s’applique ensuite.',
        donnees: [{ libelle: 'Déboursé sec', valeur: `${fr(DEBOURSE)} M FCFA` }, { libelle: 'Coefficient de vente', valeur: fr(COEF_VENTE, 2) }, { libelle: 'TVA', valeur: '18 %' }],
        question: 'Montant de l’offre TTC, en millions de FCFA ?', unite: 'M FCFA', reponse: PRIX_HT * (1 + TVA), tolerance: .1,
        explication: `${fr(DEBOURSE)} × ${fr(COEF_VENTE, 2)} = ${fr(PRIX_HT, 1)} M FCFA hors taxes ; avec la TVA : ${fr(PRIX_HT, 1)} × 1,18 = ${fr(PRIX_HT * (1 + TVA), 2)} M FCFA, dans le budget de ${BUDGET} M annoncé par Mme Touré.` } } },
      { id: 'contenu-offre', zone: 'bureaux', titre: 'Contenu de l’offre', contenu: { type: 'selection', selection: {
        titre: 'Contenu de l’offre', enonce: 'L’offre part demain chez Mme Touré. Elle doit lui permettre de comparer, et nous engager sur ce que nous promettons.', consigne: 'Coche ce que l’offre doit contenir.',
        options: [
          { texte: 'Le devis quantitatif et estimatif, poste par poste', attendu: true, explication: 'Il justifie le prix : chaque ouvrage, sa quantité, son prix unitaire.' },
          { texte: 'Le planning prévisionnel des travaux', attendu: true, explication: 'Il engage l’entreprise sur un délai.' },
          { texte: 'Le mémoire technique : méthodes, matériaux, équipe', attendu: true, explication: 'Il montre comment l’immeuble sera bâti, et par qui.' },
          { texte: 'Les attestations d’assurance responsabilité civile et décennale', attendu: true, explication: 'Elles protègent la cliente en cas de sinistre, pendant les travaux et dix ans après.' },
          { texte: 'L’échéancier des paiements', attendu: true, explication: 'Des paiements liés à l’avancement : chacun sait quand et combien.' },
          { texte: 'Les prix des entreprises concurrentes', attendu: false, explication: 'Ils sont confidentiels : on ne les connaît pas, et on ne doit pas les connaître.' },
          { texte: 'Un cadeau pour remercier Mme Touré', attendu: false, explication: 'Un cadeau pour décrocher un marché, c’est une tentative de corruption.' },
          { texte: 'Les fiches de paie des ouvriers', attendu: false, explication: 'Des données personnelles, sans rapport avec l’offre.' },
        ] } } },
      situation('delai-offre', 'direction', 'Six mois pour tout bâtir',
        'Mme Touré voudrait installer ses locataires dans six mois. Pour un R+3 de huit logements, ton planning en compte douze.',
        ['Je garde un planning réaliste et je le lui explique, phase par phase', 'Fondations, gros œuvre, second œuvre, finitions : chaque phase a sa durée, et le béton son temps de durcissement. Un délai tenu vaut mieux qu’une promesse intenable.'],
        [['J’annonce six mois pour décrocher le marché', 'Le retard serait certain, avec des pénalités et une cliente déçue.'], ['Je ne mets aucun délai dans l’offre', 'Une offre sans délai est incomplète : c’est la porte ouverte aux litiges.']]),
    ],
  },
  {
    id: 'sol', lieu: 'laboratoire', titre: 'Ce que dit le sol', resume: 'Lire les sondages de la parcelle avant toute fondation.',
    recit: 'Avant de dessiner la moindre fondation, il faut savoir sur quoi on construit. Mes techniciens ont sondé la parcelle de la Résidence Akwaba au pénétromètre. Lisons les résultats ensemble.',
    avancee: 'Étude de sol rendue : les points de sondage sont piquetés sur la parcelle.',
    taches: [
      situation('sondages', 'accueil', 'Un seul sondage ?',
        'Pour économiser, Mme Touré demande un seul sondage, au milieu de la parcelle.',
        ['Je maintiens plusieurs sondages, répartis sous l’emprise de l’immeuble', 'Le sol peut changer d’un coin à l’autre : un seul point ne dit rien des autres. Trois sondages au moins sous un immeuble de ce poids.'],
        [['Un sondage suffit, le sol est le même partout', 'Une poche d’argile ou un ancien remblai peut se cacher à quelques mètres du sondage.'], ['On s’en passe, le voisin a bien construit', 'Le voisin ne porte pas un R+3, et son sol n’est pas forcément le même.']]),
      { id: 'admissible', zone: 'paillasse', titre: 'Contrainte admissible', contenu: { type: 'mesure', mesure: {
        titre: 'Contrainte admissible', enonce: 'L’essai donne la contrainte de rupture du sol à 1,50 m de profondeur. On ne fait jamais travailler un sol jusqu’à la rupture.',
        donnees: [{ libelle: 'Contrainte de rupture', valeur: `${fr(RUPTURE)} kPa` }, { libelle: 'Coefficient de sécurité', valeur: String(SECURITE_SOL) }],
        question: 'Contrainte admissible, en kPa ?', unite: 'kPa', reponse: ADMISSIBLE, tolerance: 2,
        explication: `${fr(RUPTURE)} ÷ ${SECURITE_SOL} = ${fr(ADMISSIBLE)} kPa, soit 2 bars : la pression que les semelles pourront transmettre au sol sans risque.` } } },
      situation('nappe', 'bureau', 'L’eau à deux mètres',
        'En pleine saison des pluies, un sondage rencontre l’eau à 2 m de profondeur.',
        ['Je l’inscris au rapport, avec la saison de la mesure : le bureau d’études en tiendra compte et les fouilles prévoiront un pompage', 'La nappe change la façon de creuser et de couler : ceux qui dessinent les fondations doivent le savoir.'],
        [['Je n’en parle pas, la saison sèche arrive', 'L’eau reviendra à la prochaine saison des pluies, sous les fondations.'], ['On remblaiera avec du sable', 'Le sable ne supprime pas l’eau : il faut une solution étudiée.']]),
    ],
  },
  {
    id: 'structure', lieu: 'bureau-etudes', titre: 'Les fondations de l’immeuble', resume: 'Descendre les charges et dimensionner les semelles.',
    recit: `Avec le rapport d’Adjoua, on peut dimensionner. Quatre planchers à porter, seize poteaux, un sol à ${fr(ADMISSIBLE)} kPa. Suis la charge du poteau le plus chargé, de la terrasse jusqu’au sol.`,
    avancee: 'Plans d’exécution prêts : l’implantation de l’immeuble est tracée au cordeau.',
    taches: [
      { id: 'descente', zone: 'calcul', titre: 'Descente de charges', contenu: { type: 'mesure', mesure: {
        titre: 'Descente de charges', enonce: 'Le poteau intérieur le plus chargé reprend la même surface de plancher à chaque niveau, terrasse comprise.',
        donnees: [{ libelle: 'Surface reprise par plancher', valeur: `${SURFACE_POTEAU} m²` }, { libelle: 'Charge par m² (G + Q)', valeur: `${CHARGE_M2} kN/m²` }, { libelle: 'Planchers portés', valeur: `${PLANCHERS} (trois étages et la terrasse)` }],
        question: 'Charge au pied du poteau, en kN ?', unite: 'kN', reponse: CHARGE_POTEAU, tolerance: 2,
        explication: `${SURFACE_POTEAU} × ${CHARGE_M2} × ${PLANCHERS} = ${fr(CHARGE_POTEAU)} kN : la charge que la semelle devra transmettre au sol.` } } },
      { id: 'semelle', zone: 'bureau', titre: 'Côté de la semelle', contenu: { type: 'mesure', mesure: {
        titre: 'Côté de la semelle', enonce: 'Sous ce poteau, une semelle carrée : la pression qu’elle transmet ne doit pas dépasser la contrainte admissible.',
        donnees: [{ libelle: 'Charge du poteau', valeur: `${fr(CHARGE_POTEAU)} kN` }, { libelle: 'Contrainte admissible', valeur: `${fr(ADMISSIBLE)} kPa` }],
        question: 'Côté minimal de la semelle, en mètres ?', unite: 'm', reponse: COTE_SEMELLE, tolerance: .025,
        explication: `Surface = ${fr(CHARGE_POTEAU)} ÷ ${fr(ADMISSIBLE)} = ${fr(CHARGE_POTEAU / ADMISSIBLE, 2)} m² ; côté = √${fr(CHARGE_POTEAU / ADMISSIBLE, 2)} ≈ ${fr(COTE_SEMELLE, 2)} m. Le plan retient 2,00 m pour les seize semelles.` } } },
      { id: 'plans-execution', zone: 'archives', titre: 'Plans d’exécution', contenu: { type: 'selection', selection: {
        titre: 'Plans d’exécution', enonce: 'Avant de les envoyer sur le chantier, tu relis le dossier de structure de la Résidence Akwaba.', consigne: 'Coche ce que le dossier doit contenir.',
        options: [
          { texte: 'Le plan des fondations, avec la cote de chaque semelle', attendu: true, explication: 'Les maçons implantent et coffrent d’après lui.' },
          { texte: 'Les plans de coffrage de chaque plancher', attendu: true, explication: 'Ils donnent poutres, dalles et réservations, niveau par niveau.' },
          { texte: 'Les plans de ferraillage', attendu: true, explication: 'Diamètres, nombres, longueurs : l’acier ne se devine pas.' },
          { texte: 'La note de calcul qui justifie les sections', attendu: true, explication: 'Elle permet au contrôleur technique de vérifier.' },
          { texte: 'Le cartouche de chaque plan : projet, indice, date', attendu: true, explication: 'On sait quelle version on a sous les yeux.' },
          { texte: 'Les plans de décoration des appartements', attendu: false, explication: 'Utiles plus tard, mais étrangers à la structure.' },
          { texte: 'La liste des futurs locataires', attendu: false, explication: 'Hors sujet pour un dossier de structure.' },
        ] } } },
    ],
  },
  {
    id: 'permis', lieu: 'mairie', titre: 'Le permis de construire', resume: 'Déposer un dossier complet et conforme au règlement.',
    recit: 'Plans d’architecte, plans de structure, rapport de sol : le dossier de la Résidence Akwaba prend forme. Vérifions-le avant le dépôt. Un dossier complet et conforme, c’est un permis qui ne traîne pas.',
    avancee: 'Permis accordé : le panneau est affiché sur la palissade, visible depuis l’avenue.',
    taches: [
      { id: 'dossier-immeuble', zone: 'table', titre: 'Dossier d’un immeuble', contenu: { type: 'selection', selection: {
        titre: 'Dossier d’un immeuble', enonce: 'Demande de permis de construire pour un R+3 de huit logements.', consigne: 'Coche les pièces à joindre.',
        options: [
          { texte: 'La demande signée de Mme Touré, propriétaire', attendu: true, explication: 'Elle identifie la demandeuse et le projet.' },
          { texte: 'La copie de l’ACD de la parcelle', attendu: true, explication: 'Le droit de construire repose sur le titre de propriété.' },
          { texte: 'Les plans d’architecte : niveaux, façades, coupes, plan de masse', attendu: true, explication: 'Ils décrivent le projet sur sa parcelle.' },
          { texte: 'Le rapport d’étude de sol', attendu: true, explication: 'Pour un immeuble à étages, il justifie le choix des fondations.' },
          { texte: 'Les plans de structure et la note de calcul', attendu: true, explication: 'Ils montrent que l’immeuble tiendra.' },
          { texte: 'Le devis détaillé de l’entreprise', attendu: false, explication: 'Le prix des travaux ne regarde pas l’instruction du permis.' },
          { texte: 'Les contrats de bail des futurs locataires', attendu: false, explication: 'Ils viendront après la livraison.' },
          { texte: 'Le planning de livraison des agglos', attendu: false, explication: 'C’est l’organisation du chantier, pas une pièce du permis.' },
        ] } } },
      { id: 'surface-plancher', zone: 'urbanisme', titre: 'Surface de plancher', contenu: { type: 'mesure', mesure: {
        titre: 'Surface de plancher', enonce: 'Le permis indique la surface de plancher créée, niveau par niveau.',
        donnees: [{ libelle: 'Emprise d’un niveau', valeur: '12 × 9 m' }, { libelle: 'Niveaux', valeur: 'rez-de-chaussée et trois étages' }],
        question: 'Surface de plancher totale, en m² ?', unite: 'm²', reponse: 432, tolerance: 1,
        explication: '12 × 9 = 108 m² par niveau ; × 4 niveaux = 432 m². C’est le chiffre du dossier, et celui du panneau d’affichage.' } } },
      situation('toit', 'guichet', 'Une pièce sur le toit',
        'Au dépôt, l’instructrice relève sur les plans une buanderie fermée sur le toit-terrasse. Le règlement de la zone limite les immeubles à R+3.',
        ['Je retire la buanderie des plans : la terrasse reste ouverte, conforme au règlement', 'Une pièce fermée et couverte compte comme un niveau : le projet deviendrait un R+4, interdit dans la zone.'],
        [['On la garde, ce n’est qu’une buanderie', 'Fermée et couverte, c’est un niveau de plus : le permis serait refusé.'], ['On la retire des plans, et on la construira après', 'Construire hors permis expose à l’arrêt du chantier, à l’amende, voire à la démolition.']]),
    ],
  },
  {
    id: 'financement', lieu: 'banque', titre: 'Le financement', resume: 'Monter le plan de financement et payer selon l’avancement.',
    recit: 'Mme Touré finance la Résidence Akwaba avec un prêt de notre banque. Le permis est obtenu : on peut boucler le plan de financement, et organiser les paiements de l’entreprise au fil des travaux.',
    avancee: 'Prêt accordé : la base vie s’installe sur le chantier.',
    taches: [
      { id: 'apport', zone: 'conseiller', titre: 'Apport personnel', contenu: { type: 'mesure', mesure: {
        titre: 'Apport personnel', enonce: 'La banque finance au plus 70 % du coût de l’opération ; le reste vient de l’apport de Mme Touré.',
        donnees: [{ libelle: 'Coût de l’opération', valeur: `${BUDGET} M FCFA` }, { libelle: 'Part financée par la banque', valeur: '70 %' }],
        question: 'Apport de Mme Touré, en millions de FCFA ?', unite: 'M FCFA', reponse: BUDGET * (1 - PART_BANQUE), tolerance: .1,
        explication: `${BUDGET} × 30 % = ${fr(BUDGET * (1 - PART_BANQUE))} M FCFA d’apport ; la banque prête les ${fr(BUDGET * PART_BANQUE)} M restants.` } } },
      situation('deblocage', 'guichet', 'Payer l’entreprise',
        'L’entreprise demande que tout le prêt lui soit versé dès la signature.',
        ['Une avance de démarrage, puis des versements sur situations de travaux vérifiées', 'Chaque versement correspond à des travaux faits : la cliente paie ce qui est construit, l’entreprise est payée régulièrement.'],
        [['On verse tout d’un coup, c’est plus simple', 'Si l’entreprise traîne ou disparaît, l’argent est parti sans immeuble.'], ['On ne paie qu’à la livraison', 'Sans paiements en cours de route, l’entreprise ne peut ni acheter ni payer ses ouvriers.']]),
      { id: 'retenue-situation', zone: 'coffre', titre: 'Retenue de garantie', contenu: { type: 'mesure', mesure: {
        titre: 'Retenue de garantie', enonce: 'Première situation : fondations et soubassement. Le marché prévoit une retenue de garantie, rendue une fois les réserves levées.',
        donnees: [{ libelle: 'Travaux de la situation', valeur: '27 M FCFA' }, { libelle: 'Retenue de garantie', valeur: '5 %' }],
        question: 'Montant versé à l’entreprise, en millions de FCFA ?', unite: 'M FCFA', reponse: 27 * (1 - RETENUE), tolerance: .05,
        explication: `27 × (1 − 0,05) = ${fr(27 * (1 - RETENUE), 2)} M FCFA versés ; ${fr(27 * RETENUE, 2)} M restent en garantie jusqu’à la réception.` } } },
    ],
  },
  {
    id: 'commande', lieu: 'fournisseur', titre: 'La commande des fondations', resume: 'Quantifier le béton et les aciers, commander la bonne classe.',
    recit: 'Les plans de fondation de la Résidence Akwaba sont arrivés au dépôt. Seize semelles à couler, des aciers à préparer, le béton à commander à la centrale : on ne doit rien oublier, ni rien gaspiller.',
    avancee: 'Commande passée : les fouilles sont ouvertes, aciers et matériaux stockés sur le chantier.',
    taches: [
      { id: 'beton-semelles', zone: 'comptoir', titre: 'Béton des semelles', contenu: { type: 'mesure', mesure: {
        titre: 'Béton des semelles', enonce: 'Le bureau d’études a retenu seize semelles identiques.',
        donnees: [{ libelle: 'Nombre de semelles', valeur: String(SEMELLES) }, { libelle: 'Dimensions', valeur: '2,00 × 2,00 × 0,50 m' }],
        question: 'Volume de béton à commander, en m³ ?', unite: 'm³', reponse: VOLUME_SEMELLES, tolerance: .1,
        explication: `2 × 2 × 0,5 = 2 m³ par semelle ; × ${SEMELLES} = ${fr(VOLUME_SEMELLES)} m³ de béton.` } } },
      { id: 'aciers-semelles', zone: 'stock', titre: 'Aciers des semelles', contenu: { type: 'mesure', mesure: {
        titre: 'Aciers des semelles', enonce: 'La note de calcul donne un ratio d’acier pour les semelles.',
        donnees: [{ libelle: 'Béton des semelles', valeur: `${fr(VOLUME_SEMELLES)} m³` }, { libelle: 'Ratio d’acier', valeur: '40 kg/m³' }],
        question: 'Masse d’aciers à commander, en kg ?', unite: 'kg', reponse: VOLUME_SEMELLES * 40, tolerance: 5,
        explication: `${fr(VOLUME_SEMELLES)} × 40 = ${fr(VOLUME_SEMELLES * 40)} kg d’aciers, soit un peu moins de 1,3 tonne.` } } },
      situation('classe-beton', 'preparation', 'La classe du béton',
        'Le plan des fondations demande un béton C25/30. La centrale propose un C20/25, moins cher.',
        ['Je commande la classe du plan, C25/30, inscrite sur le bon de commande', 'La résistance du béton fait partie du calcul : la changer, c’est changer la sécurité de l’immeuble.'],
        [['Le C20/25 fera l’affaire, c’est presque pareil', 'Presque, en structure, c’est trop peu : un béton moins résistant que celui du calcul.'], ['Je rajouterai du ciment sur place', 'On ne corrige pas un béton prêt à l’emploi en y versant du ciment au hasard.']]),
    ],
  },
  {
    id: 'coulage', lieu: 'logistique', titre: 'Le jour du coulage', resume: 'Organiser les toupies et le matériel, refuser un béton hors délai.',
    recit: `${fr(VOLUME_SEMELLES)} m³ de béton à couler sous les semelles de la Résidence Akwaba, en une matinée, au cœur du Plateau. Les toupies, le matériel, les horaires : tout se prépare ici.`,
    avancee: 'Fondations coulées : le gros œuvre monte, avec la grue et les échafaudages.',
    taches: [
      { id: 'rotations', zone: 'quai', titre: 'Rotations des toupies', contenu: { type: 'mesure', mesure: {
        titre: 'Rotations des toupies', enonce: 'Le béton arrive de la centrale en camions toupies.',
        donnees: [{ libelle: 'Béton à couler', valeur: `${fr(VOLUME_SEMELLES)} m³` }, { libelle: 'Capacité d’une toupie', valeur: '8 m³' }],
        question: 'Nombre de rotations ?', unite: 'rotations', reponse: VOLUME_SEMELLES / 8, tolerance: 0,
        explication: `${fr(VOLUME_SEMELLES)} ÷ 8 = ${fr(VOLUME_SEMELLES / 8)} rotations, espacées pour que chaque toupie soit vidée avant l’arrivée de la suivante.` } } },
      { id: 'materiel-coulage', zone: 'rayonnages', titre: 'Matériel du coulage', contenu: { type: 'selection', selection: {
        titre: 'Matériel du coulage', enonce: 'Demain, 7 h, première toupie. Tu prépares ce qui part ce soir sur le chantier.', consigne: 'Coche ce qui doit être prêt avant l’arrivée du béton.',
        options: [
          { texte: 'L’aiguille vibrante et son groupe', attendu: true, explication: 'Elle chasse l’air du béton : sans vibration, des vides affaiblissent les semelles.' },
          { texte: 'Le cône d’Abrams pour mesurer l’affaissement', attendu: true, explication: 'On vérifie la consistance de chaque toupie avant de couler.' },
          { texte: 'Les moules à éprouvettes', attendu: true, explication: 'Le laboratoire écrasera les éprouvettes à 7 et 28 jours.' },
          { texte: 'Un accès dégagé jusqu’aux fouilles', attendu: true, explication: 'Une toupie qui attend, c’est un béton qui prend dans la cuve.' },
          { texte: 'Un jerrican d’eau pour fluidifier le béton', attendu: false, explication: 'L’eau ajoutée fait chuter la résistance.' },
          { texte: 'Des sacs de ciment pour épaissir le béton', attendu: false, explication: 'Un béton prêt à l’emploi ne se corrige pas sur le chantier.' },
        ] } } },
      situation('toupie-retard', 'dispatch', 'Toupie en retard',
        'La troisième toupie est bloquée dans les embouteillages du Plateau : elle arrivera avec 1 h 30 de retard, au soleil.',
        ['À son arrivée, je vérifie l’heure de fabrication et l’affaissement, et je refuse le béton s’il a dépassé son délai', 'Un béton qui a trop attendu commence à prendre : le bon de livraison et le cône disent s’il peut encore être coulé.'],
        [['On rajoute de l’eau pour qu’il redevienne maniable', 'L’eau ajoutée fait chuter la résistance : c’est la faute la plus courante sur les chantiers.'], ['On coule quand même, il est payé', 'Une fois coulé, un béton hors délai ne se rattrape plus.']]),
    ],
  },
  {
    id: 'securite', lieu: 'construction-nord', titre: 'La sécurité du gros œuvre', resume: 'Protéger le travail en hauteur pendant que les étages montent.',
    recit: 'Les étages de la Résidence Akwaba montent vite. Avant d’y envoyer l’équipe, on revoit ici, sur le chantier du Plateau, les règles du travail en hauteur et du levage.',
    avancee: 'Gros œuvre et finitions achevés : l’immeuble attend sa réception.',
    taches: [
      situation('tremie', 'echafaudage', 'La trémie de l’escalier',
        'Au R+1, la trémie de l’escalier est ouverte, sans protection, en pleine activité du chantier.',
        ['Je fais fermer la trémie par un garde-corps ou un plancher fixé, et je balise', 'Une trémie ouverte est un piège : on la protège tout de suite, et solidement.'],
        [['On pose une planche dessus', 'Une planche non fixée glisse ou casse : la chute est assurée.'], ['On prévient les ouvriers', 'Une consigne orale s’oublie ; le vide, lui, reste.']]),
      { id: 'charge-grue', zone: 'grue', titre: 'Charge levée', contenu: { type: 'mesure', mesure: {
        titre: 'Charge levée', enonce: 'La grue monte une benne de béton pour le plancher du R+3.',
        donnees: [{ libelle: 'Benne vide', valeur: '350 kg' }, { libelle: 'Béton dans la benne', valeur: '0,5 m³' }, { libelle: 'Masse volumique du béton', valeur: '2 400 kg/m³' }],
        question: 'Masse levée, en kg ?', unite: 'kg', reponse: 350 + .5 * 2400, tolerance: 10,
        explication: '0,5 × 2 400 = 1 200 kg de béton, plus 350 kg de benne : 1 550 kg, à comparer à la charge admissible de la grue à cette portée.' } } },
      { id: 'accueil-securite', zone: 'accueil', titre: 'Accueil des nouveaux', contenu: { type: 'selection', selection: {
        titre: 'Accueil des nouveaux', enonce: 'Trois ouvriers rejoignent le gros œuvre de la Résidence Akwaba.', consigne: 'Coche ce qui fait partie de leur accueil sécurité.',
        options: [
          { texte: 'La présentation des risques du chantier et des consignes', attendu: true, explication: 'Chaque chantier a ses dangers : on les explique avant le premier geste.' },
          { texte: 'La remise des EPI : casque, chaussures, gants, gilet', attendu: true, explication: 'Fournis par l’employeur, adaptés et en bon état.' },
          { texte: 'Les zones interdites : sous la charge de la grue, près des trémies', attendu: true, explication: 'On montre sur place où l’on ne passe pas.' },
          { texte: 'Le numéro d’urgence et la trousse de secours', attendu: true, explication: 'En cas d’accident, chaque minute compte.' },
          { texte: 'Les laisser commencer, ils ont l’habitude', attendu: false, explication: 'L’habitude d’un autre chantier ne dit rien des risques de celui-ci.' },
          { texte: 'Leur faire signer une décharge de responsabilité', attendu: false, explication: 'Une décharge n’enlève rien à l’obligation de sécurité de l’employeur.' },
        ] } } },
    ],
  },
  {
    id: 'reception', lieu: PARCELLE_AKWABA.slug, titre: 'La réception', resume: 'Visiter l’immeuble avec Mme Touré et signer le procès-verbal.',
    recit: 'Le grand jour ! L’immeuble est terminé. Faisons le tour ensemble : je veux tout voir avant de signer le procès-verbal de réception.',
    avancee: 'Réception prononcée : la Résidence Akwaba est livrée, et ses premiers habitants s’installent.',
    taches: [
      { id: 'reserves', zone: 'parcelle', titre: 'Le tour des réserves', contenu: { type: 'selection', selection: {
        titre: 'Le tour des réserves', enonce: 'Pendant la visite, tu notes ce qui n’est pas conforme au marché.', consigne: 'Coche ce qui doit être inscrit en réserve.',
        options: [
          { texte: 'Une fissure en façade, sous une fenêtre du R+2', attendu: true, explication: 'Un défaut d’exécution : à reprendre, donc en réserve.' },
          { texte: 'Une porte palière qui frotte au sol', attendu: true, explication: 'Elle doit être reprise par l’entreprise.' },
          { texte: 'Un carreau fêlé dans une salle de bains du R+1', attendu: true, explication: 'Réserve, avec remplacement du carreau.' },
          { texte: 'Une prise sans courant dans un séjour du R+3', attendu: true, explication: 'L’installation électrique doit fonctionner partout.' },
          { texte: 'La couleur des façades, que Mme Touré n’aime plus', attendu: false, explication: 'C’était son choix, validé au marché : ce n’est pas un défaut.' },
          { texte: 'L’absence de climatiseurs, non prévus au marché', attendu: false, explication: 'On ne réserve que ce qui était prévu au marché.' },
          { texte: 'La hausse du prix du ciment pendant les travaux', attendu: false, explication: 'Une question de coût, pas un défaut de l’immeuble.' },
        ] } } },
      situation('proces-verbal', 'parcelle', 'Signer ou pas ?',
        'Les réserves sont mineures et l’immeuble est habitable. Mme Touré hésite à signer le procès-verbal.',
        ['Je propose une réception avec réserves, à lever dans un délai fixé au procès-verbal', 'La réception transfère l’immeuble à la cliente et fait courir les garanties ; les réserves restent dues par l’entreprise, dans le délai convenu.'],
        [['Elle refuse la réception tant qu’il reste un défaut', 'Refuser pour des défauts mineurs bloque tout : locataires, paiements, garanties.'], ['On signe sans réserves, on s’arrangera entre nous', 'Sans réserves écrites, la cliente perd le moyen d’exiger les reprises.']]),
      { id: 'retenue-finale', zone: 'parcelle', titre: 'La retenue de garantie', contenu: { type: 'mesure', mesure: {
        titre: 'La retenue de garantie', enonce: '5 % ont été retenus sur chaque situation de travaux, jusqu’à la levée des réserves.',
        donnees: [{ libelle: 'Marché hors taxes', valeur: `${fr(PRIX_HT, 1)} M FCFA` }, { libelle: 'Retenue de garantie', valeur: '5 %' }],
        question: 'Montant retenu, en millions de FCFA ?', unite: 'M FCFA', reponse: PRIX_HT * RETENUE, tolerance: .02,
        explication: `${fr(PRIX_HT, 1)} × 5 % = ${fr(PRIX_HT * RETENUE, 3)} M FCFA, rendus à l’entreprise une fois les réserves levées.` } } },
    ],
  },
];

// ─── Progression ───

export interface ProgresCampagne { chapitres: number; termineeLe: string | null }
export const PROGRES_CAMPAGNE_INITIAL: ProgresCampagne = { chapitres: 0, termineeLe: null };

/** Lecture bornée, comme au serveur : un JSON abîmé repart du premier chapitre. */
export function lireProgresCampagne(brut: unknown): ProgresCampagne {
  const c = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const n = Math.floor(Number(c.chapitres));
  const le = typeof c.termineeLe === 'string' && Number.isFinite(Date.parse(c.termineeLe)) ? c.termineeLe : null;
  return { chapitres: Number.isFinite(n) ? Math.max(0, Math.min(CHAPITRES.length, n)) : 0, termineeLe: le };
}

/** Le chapitre à jouer, ou rien quand l'immeuble est livré. */
export const chapitreCourant = (p: Pick<ProgresCampagne, 'chapitres'>) => p.chapitres < CHAPITRES.length ? CHAPITRES[p.chapitres] : null;

/** Applique un chapitre validé (démonstration) : le dernier livre l'immeuble. */
export function appliquerChapitre(p: ProgresCampagne, reussi: boolean, maintenant: Date): ProgresCampagne {
  if (!reussi || p.chapitres >= CHAPITRES.length) return p;
  const chapitres = p.chapitres + 1;
  return { chapitres, termineeLe: chapitres >= CHAPITRES.length ? maintenant.toISOString() : null };
}

// ─── Séance d'un chapitre ───

/** La séance d'un chapitre a la forme d'une séance de lieu : mêmes tâches, mêmes balises, mêmes pastilles. */
export function nouvelleSeanceChapitre(index: number): SeanceLieu {
  const c = CHAPITRES[index];
  return { slug: c.lieu, cycle: 0, etape: index, taches: c.taches.map(t => ({ id: t.id, zone: t.zone, titre: t.titre, type: t.contenu.type })), scores: {} };
}

export const contenuTacheChapitre = (index: number, id: string) => CHAPITRES[index]?.taches.find(t => t.id === id)?.contenu ?? null;

export interface BilanChapitre { note: number; reussies: number; total: number; reussi: boolean; mention: string; argent: number; xp: number; reputation: number }

/** Note sur 100 comme une séance de lieu (présence 10, puis 90 points partagés), validée à 50.
 * Gains : la formule du serveur (gainsChapitre), avant le facteur des besoins ; la réception rapporte bien plus. */
export function bilanChapitre(s: SeanceLieu): BilanChapitre {
  const scores = s.taches.map(t => s.scores[t.id] ?? 0);
  const note = Math.round(10 + 90 * (scores.reduce((n, x) => n + x, 0) / Math.max(1, scores.length)) / 100);
  const reussi = note >= NOTE_CHAPITRE, finale = s.etape === CHAPITRES.length - 1;
  return {
    note, reussies: scores.filter(x => x >= 80).length, total: scores.length, reussi,
    mention: note === 100 ? 'Chapitre sans faute' : note >= 70 ? 'Chapitre réussi' : reussi ? 'Chapitre validé' : 'Chapitre à reprendre',
    argent: reussi ? (finale ? 25_000 : 2_500) : 0,
    xp: reussi ? 30 + Math.round(note / 2) + (finale ? 200 : 0) : 0,
    reputation: reussi ? (finale ? 15 : 2) : 0,
  };
}

// ─── L'immeuble sur la parcelle ───

/** Ce qu'on voit sur la parcelle, selon les chapitres validés (0 à 9). */
export const STADES_AKWABA = [
  'Parcelle bornée', 'Marché signé', 'Sol sondé', 'Implantation tracée', 'Permis affiché',
  'Base vie installée', 'Fondations en cours', 'Gros œuvre en élévation', 'Prêt pour la réception', 'Immeuble livré',
] as const;
export const stadeAkwaba = (p: Pick<ProgresCampagne, 'chapitres'>) => STADES_AKWABA[Math.max(0, Math.min(STADES_AKWABA.length - 1, p.chapitres))];
