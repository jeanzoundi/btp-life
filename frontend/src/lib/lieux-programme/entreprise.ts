// Tour BTP Life : diriger une entreprise de BTP le temps d'un exercice, de l'appel d'offres au bilan.
// Mécanique propre : les chiffres d'une entreprise (prix de vente, trésorerie, marge) et ses décisions de dirigeant ;
// l'écran des marchés affiche les vrais appels d'offres du jeu (GET /chantiers/marches).
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

export const PROGRAMME_ENTREPRISE: ProgrammeLieu = {
  slug: 'entreprise', titre: 'Diriger une entreprise de BTP', cycle: 'exercice',
  mentor: { nom: 'Joseph Amani', role: 'Directeur général, BTP Life Construction' }, horaires: { ouverture: 8, fermeture: 19 },
  etapes: [
    { id: 'appel-offres', nom: 'Répondre à un appel d’offres', resume: 'Un dossier complet et conforme, ou il n’est même pas ouvert.', taches: [
      { id: 'dossier-ao', zone: 'salle-reunion', titre: 'Dossier de réponse', contenu: () => ({ type: 'selection', selection: {
        titre: 'Dossier de réponse', enonce: 'La commune lance un appel d’offres pour la construction d’une école de six classes.', consigne: 'Coche les pièces de ton offre.',
        options: [
          { texte: 'Le mémoire technique : méthodes, moyens, équipe', attendu: true, explication: 'Il montre comment tu réaliseras le chantier.' },
          { texte: 'Le planning prévisionnel', attendu: true, explication: 'Il prouve que le délai demandé est tenable.' },
          { texte: 'Le bordereau des prix et le détail estimatif', attendu: true, explication: 'C’est l’offre financière, poste par poste.' },
          { texte: 'Les références de chantiers similaires', attendu: true, explication: 'Elles prouvent ton expérience.' },
          { texte: 'Les attestations fiscales et sociales à jour', attendu: true, explication: 'Sans elles, l’offre est écartée d’office.' },
          { texte: 'Un cadeau pour le président de la commission', attendu: false, explication: 'C’est de la corruption : exclusion et poursuites.' },
          { texte: 'L’offre d’un concurrent obtenue en douce', attendu: false, explication: 'Déloyal et illégal.' },
        ] } }) },
      { id: 'visite', zone: 'salle-reunion', titre: 'Visite de site', contenu: () => ({ type: 'situation', situation: s('visite', 'Visite de site',
        'Le règlement prévoit une visite de site obligatoire, à 50 km, un samedi matin.',
        ['J’y vais et je note les accès, le sol et les contraintes du terrain', 'La visite évite les mauvaises surprises chiffrées trop bas, et elle est souvent obligatoire pour répondre.'],
        [['Je réponds sans y aller', 'L’offre risque d’être écartée, et le prix sera à l’aveugle.'], ['J’envoie un stagiaire sans consignes', 'Il reviendra sans les informations qui comptent pour le chiffrage.']]) }) },
    ] },
    { id: 'chiffrage', nom: 'Chiffrer l’offre', resume: 'Un prix juste : tous les coûts, plus une marge qui fait vivre l’entreprise.', taches: [
      { id: 'prix-vente', zone: 'bureaux', titre: 'Prix de vente', contenu: cycle => {
        const [debourse, coefficient] = selon(cycle, [[8_000_000, 1.25], [12_400_000, 1.3], [6_000_000, 1.22], [15_000_000, 1.18]] as const), prix = debourse * coefficient;
        return { type: 'mesure', mesure: {
          titre: 'Prix de vente', enonce: 'Le déboursé sec couvre matériaux, main-d’œuvre et matériel ; le coefficient ajoute frais généraux, aléas et marge.',
          donnees: [{ libelle: 'Déboursé sec', valeur: `${fr(debourse)} F` }, { libelle: 'Coefficient de vente', valeur: fr(coefficient, 2) }],
          question: 'Prix de vente hors taxes, en francs ?', unite: 'F', reponse: prix, tolerance: 0,
          explication: `${fr(debourse)} × ${fr(coefficient, 2)} = ${fr(prix)} F hors taxes.` } };
      } },
      { id: 'prix-bas', zone: 'bureaux', titre: 'Gagner à tout prix', contenu: () => ({ type: 'situation', situation: s('prix-bas', 'Gagner à tout prix',
        'Pour être sûr de gagner, un associé veut retirer toute la marge et une partie des frais.',
        ['Je garde un prix qui couvre les coûts et une marge raisonnable', 'Un marché gagné à perte affaiblit l’entreprise, et le moindre aléa la met en danger.'],
        [['On baisse tout, on se rattrapera sur les avenants', 'Compter sur des avenants incertains, c’est jouer l’entreprise.'], ['On rogne sur la qualité des matériaux', 'Malfaçons, réserves, réputation ruinée : le pire calcul.']]) }) },
    ] },
    { id: 'tresorerie', nom: 'Tenir la trésorerie', resume: 'Une entreprise rentable peut mourir faute de trésorerie : suivre l’argent qui entre et qui sort.', taches: [
      { id: 'solde', zone: 'finances', titre: 'Solde du mois', contenu: cycle => {
        const [depart, entrees, sorties] = selon(cycle, [[1_200_000, 12_000_000, 9_500_000], [3_500_000, 8_000_000, 10_200_000], [800_000, 6_500_000, 6_900_000], [2_000_000, 15_000_000, 13_600_000]] as const);
        const fin = depart + entrees - sorties;
        return { type: 'mesure', mesure: {
          titre: 'Solde du mois', enonce: 'Le directeur financier prépare le plan de trésorerie du mois.',
          donnees: [{ libelle: 'Trésorerie de début de mois', valeur: `${fr(depart)} F` }, { libelle: 'Encaissements prévus', valeur: `${fr(entrees)} F` }, { libelle: 'Décaissements prévus', valeur: `${fr(sorties)} F` }],
          question: 'Trésorerie de fin de mois, en francs ?', unite: 'F', reponse: fin, tolerance: 0,
          explication: `${fr(depart)} + ${fr(entrees)} − ${fr(sorties)} = ${fr(fin)} F${fin < 1_000_000 ? ' : à surveiller de près, la marge de manœuvre est mince.' : '.'}` } };
      } },
      { id: 'impaye', zone: 'finances', titre: 'Le client qui ne paie pas', contenu: () => ({ type: 'situation', situation: s('impaye', 'Le client qui ne paie pas',
        'Un gros client a trois mois de retard ; la paie des ouvriers tombe vendredi.',
        ['Je paie les salaires, je relance le client par écrit puis par mise en demeure', 'Les salaires d’abord : l’équipe tient l’entreprise. Le recouvrement suit sa procédure, par écrit.'],
        [['Je décale les salaires d’un mois', 'Tu perds la confiance de l’équipe, et c’est illégal.'], ['J’arrête tous les chantiers', 'Plus aucun chantier, plus aucune rentrée : la crise s’aggrave.']]) }) },
    ] },
    { id: 'equipe', nom: 'Recruter et manager', resume: 'Les bonnes personnes aux bons postes, et une sécurité qui ne se négocie pas.', taches: [
      { id: 'conducteur', zone: 'salle-reunion', titre: 'Choisir un conducteur de travaux', contenu: () => ({ type: 'situation', situation: s('conducteur', 'Choisir un conducteur de travaux',
        'Deux candidats : ton neveu, sans expérience, et une conductrice de travaux qui a mené trois chantiers semblables.',
        ['Je recrute la conductrice expérimentée, et je propose un stage à mon neveu', 'Le poste demande de l’expérience ; on forme les jeunes sans leur confier ce qu’ils ne peuvent pas encore porter.'],
        [['Mon neveu, la famille d’abord', 'Un chantier mal conduit coûte cher, à l’entreprise comme au neveu.'], ['Je ne recrute personne et je fais tout moi-même', 'Un dirigeant débordé ne dirige plus rien.']]) }) },
      { id: 'accident', zone: 'direction', titre: 'Accident sur un chantier', contenu: () => ({ type: 'situation', situation: s('accident', 'Accident sur un chantier',
        'Un ouvrier s’est blessé en tombant d’un échafaudage mal monté.',
        ['Je fais porter secours, sécuriser la zone, déclarer l’accident et analyser les causes', 'Secourir, protéger, déclarer, puis corriger : c’est la responsabilité du dirigeant.'],
        [['Je fais en sorte que ça ne se sache pas', 'Cacher un accident est illégal, et laisse le danger en place.'], ['Je reproche sa maladresse à l’ouvrier', 'L’échafaudage était mal monté : la faute est d’organisation.']]) }) },
    ] },
    { id: 'bilan', nom: 'Clôturer l’exercice', resume: 'Mesurer ce que l’année a vraiment rapporté, et décider de la suite.', taches: [
      { id: 'marge', zone: 'direction', titre: 'Marge nette', contenu: cycle => {
        const [resultat, ca] = selon(cycle, [[1_800_000, 24_000_000], [3_100_000, 41_000_000], [950_000, 19_000_000], [2_700_000, 30_000_000]] as const), marge = resultat / ca * 100;
        return { type: 'mesure', mesure: {
          titre: 'Marge nette', enonce: 'Le comptable présente les comptes de l’exercice.',
          donnees: [{ libelle: 'Chiffre d’affaires', valeur: `${fr(ca)} F` }, { libelle: 'Résultat net', valeur: `${fr(resultat)} F` }],
          question: 'Marge nette, en % du chiffre d’affaires ?', unite: '%', reponse: marge, tolerance: .05,
          explication: `${fr(resultat)} ÷ ${fr(ca)} = ${fr(marge, 2)} % : ce qui reste à l’entreprise sur chaque franc facturé.` } };
      } },
      { id: 'reinvestir', zone: 'direction', titre: 'Le bénéfice de l’année', contenu: () => ({ type: 'situation', situation: s('reinvestir', 'Le bénéfice de l’année',
        'L’année est bonne. Les associés veulent se partager tout le bénéfice.',
        ['Je propose d’en garder une part en réserve et d’en investir une autre dans le matériel et la formation', 'Les réserves protègent des mauvaises années ; l’investissement prépare les prochains marchés.'],
        [['On partage tout, on l’a mérité', 'À la première année difficile, l’entreprise n’aura aucune réserve.'], ['On achète des voitures de luxe pour la direction', 'Une dépense qui n’apporte rien à l’entreprise.']]) }) },
    ] },
  ],
};

/** Étage de direction de 24 × 16 m, entrée au sud : salle du conseil vitrée, plateau des bureaux, finances, bureau du directeur, écran des marchés. */
export const PLAN_ENTREPRISE: PlanLieu = {
  demiLargeur: 12, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.8],
  obstacles: [
    zone(-8.2, -1.8, -6.6, -4.4),      // table du conseil
    zone(1, 7, -3, -2),                // plateau des bureaux, premier rang
    zone(1, 7, .5, 1.5),               // plateau des bureaux, second rang
    zone(-9.5, -6.5, 3, 4),            // bureau des finances
    zone(7.5, 10.5, 1.8, 2.8),         // bureau du directeur
    zone(-12, -10.4, 5, 8),            // ascenseurs
  ],
  stations: { 'salle-reunion': [-5, -3.6], bureaux: [4, -.75], finances: [-8, 4.7], direction: [11, 2.3], marches: [6, -6.8], mentor: [9, 3.6] },
  libelles: { 'salle-reunion': 'Salle du conseil', bureaux: 'Plateau des bureaux', finances: 'Finances', direction: 'Direction', marches: 'Écran des marchés', mentor: 'Joseph' },
  mentor: { position: [9, 1.3], rotation: 0 },
};
