// Hôtel de ville : obtenir le permis de construire de la villa, du terrain sécurisé au certificat de conformité.
// Mécanique propre : constituer un dossier (choisir les bonnes pièces) et vérifier le projet aux règles d'urbanisme.
import { zone } from '../navigation-plan';
import { fr, selon, type PlanLieu, type ProgrammeLieu } from '../programme-lieu';
import type { SituationTerrain } from '../programme-chantier';

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

/** Emprise au sol maximale de la zone d'habitat du lotissement. */
export const EMPRISE_MAX = 60;

export const PROGRAMME_MAIRIE: ProgrammeLieu = {
  slug: 'mairie', titre: 'Permis de construire', cycle: 'dossier',
  mentor: { nom: 'Akissi Gnahoré', role: 'Instructrice, service de l’urbanisme' }, horaires: { ouverture: 7.5, fermeture: 16 },
  etapes: [
    { id: 'foncier', nom: 'Sécuriser le terrain', resume: 'Avant tout dossier, s’assurer que le terrain appartient bien au client et que ses limites sont justes.', taches: [
      { id: 'acd', zone: 'domaines', titre: 'Attestation villageoise', contenu: () => ({ type: 'situation', situation: s('acd', 'Attestation villageoise',
        'Le client a acheté son terrain avec une simple attestation villageoise.',
        ['Je lui conseille d’obtenir l’ACD avant de construire', 'L’arrêté de concession définitive sécurise la propriété : c’est sur lui, ou sur un titre foncier, que s’appuie le permis.'],
        [['L’attestation suffit pour le permis', 'Une attestation villageoise ne prouve pas la propriété au regard de l’État.'], ['On construit vite, on régularisera après', 'Construire sur un terrain contesté, c’est risquer de tout perdre.']]) }) },
      { id: 'bornage', zone: 'domaines', titre: 'Limites du terrain', contenu: () => ({ type: 'situation', situation: s('bornage', 'Limites du terrain',
        'Les bornes ne correspondent pas au plan du lotissement : le voisin a clôturé deux mètres chez le client.',
        ['Je fais faire un bornage contradictoire par un géomètre-expert', 'Le bornage, en présence des voisins, fixe les limites de façon officielle.'],
        [['On décale la maison et on n’en parle plus', 'Le client perdrait une partie de son terrain sans recours.'], ['On abat la clôture du voisin', 'On ne se fait pas justice soi-même : on fait constater les limites.']]) }) },
    ] },
    { id: 'dossier', nom: 'Constituer le dossier', resume: 'Rassembler les pièces de la demande de permis, avec des plans signés par un architecte agréé.', taches: [
      { id: 'pieces', zone: 'table', titre: 'Pièces du dossier', contenu: () => ({ type: 'selection', selection: {
        titre: 'Pièces du dossier', enonce: 'Demande de permis de construire pour une villa R+1.', consigne: 'Coche les pièces à joindre.',
        options: [
          { texte: 'La demande signée du propriétaire', attendu: true, explication: 'C’est la demande elle-même : elle identifie le demandeur et le projet.' },
          { texte: 'La copie de l’ACD ou du titre foncier', attendu: true, explication: 'Elle prouve le droit de construire sur le terrain.' },
          { texte: 'Le plan de situation et le plan de masse', attendu: true, explication: 'Ils situent le terrain et la maison sur la parcelle.' },
          { texte: 'Les plans, façades et coupes signés par un architecte agréé', attendu: true, explication: 'Ils décrivent le projet et engagent un professionnel.' },
          { texte: 'La notice descriptive du projet', attendu: true, explication: 'Matériaux, surfaces, raccordements : elle complète les plans.' },
          { texte: 'Le devis du maçon', attendu: false, explication: 'Le prix des travaux ne regarde pas l’instruction du permis.' },
          { texte: 'Une photo du permis du voisin', attendu: false, explication: 'Chaque projet est instruit pour lui-même.' },
          { texte: 'La facture des agglos', attendu: false, explication: 'Les achats de matériaux n’ont rien à faire dans le dossier.' },
        ] } }) },
      { id: 'architecte', zone: 'table', titre: 'Signature des plans', contenu: () => ({ type: 'situation', situation: s('architecte', 'Signature des plans',
        'Pour économiser, le client veut faire dessiner ses plans par un dessinateur sans agrément.',
        ['Je lui explique que les plans doivent être signés par un architecte agréé', 'L’architecte engage sa responsabilité sur la conception : c’est une exigence du permis.'],
        [['Un bon dessinateur suffit', 'Sans signature d’un architecte agréé, le dossier sera refusé.'], ['On imitera une signature', 'C’est un faux, puni par la loi.']]) }) },
    ] },
    { id: 'urbanisme', nom: 'Règles d’urbanisme', resume: 'Vérifier le projet aux règles du lotissement : emprise au sol, reculs, hauteur.', taches: [
      { id: 'emprise', zone: 'urbanisme', titre: 'Emprise au sol', contenu: cycle => {
        const [parcelle, garage] = selon(cycle, [[500, 24], [400, 30], [600, 18], [450, 20]] as const), e = (96 + garage) / parcelle * 100;
        return { type: 'mesure', mesure: {
          titre: 'Emprise au sol', enonce: 'Le règlement de la zone limite l’emprise au sol des constructions.',
          donnees: [{ libelle: 'Parcelle', valeur: `${parcelle} m²` }, { libelle: 'Maison', valeur: '12 × 8 m' }, { libelle: 'Garage', valeur: `${garage} m²` }],
          question: 'Emprise au sol, en % de la parcelle ?', unite: '%', reponse: e, tolerance: .3,
          explication: `(96 + ${garage}) ÷ ${parcelle} ≈ ${fr(e, 1)} % : sous le maximum de ${EMPRISE_MAX} % de la zone, le projet respecte la règle.` } };
      } },
      { id: 'recul', zone: 'urbanisme', titre: 'Recul sur la voie', contenu: () => ({ type: 'situation', situation: s('recul', 'Recul sur la voie',
        'Le règlement impose un recul de 5 m par rapport à la voie ; le plan place la façade à 3 m.',
        ['Je fais reculer l’implantation à 5 m sur le plan avant le dépôt', 'Un projet non conforme sera refusé : mieux vaut corriger avant de déposer.'],
        [['Personne ne mesurera', 'Le contrôle de conformité mesure, justement.'], ['On demandera une dérogation une fois construit', 'Une construction hors règles peut être frappée de démolition.']]) }) },
    ] },
    { id: 'depot', nom: 'Dépôt et instruction', resume: 'Déposer le dossier au guichet unique, en obtenir la preuve, et le suivre par la voie officielle.', taches: [
      { id: 'recepisse', zone: 'guichet', titre: 'Récépissé', contenu: () => ({ type: 'situation', situation: s('recepisse', 'Récépissé',
        'Au guichet, l’agent prend le dossier sans rien remettre en échange.',
        ['Je demande le récépissé de dépôt daté, avec le numéro du dossier', 'Le récépissé prouve la date du dépôt et fait partir le délai d’instruction.'],
        [['Je lui fais confiance', 'Sans preuve, un dossier égaré n’a jamais existé.'], ['Je reviendrai demain demander', 'C’est au moment du dépôt que le récépissé se remet.']]) }) },
      { id: 'intermediaire', zone: 'guichet', titre: 'Intermédiaire', contenu: () => ({ type: 'situation', situation: s('intermediaire', 'Intermédiaire',
        'Un homme propose « d’accélérer » le dossier contre une somme d’argent.',
        ['Je refuse et je suis le dossier par la voie officielle', 'Le délai d’instruction est encadré : payer un intermédiaire est de la corruption, sans aucune garantie.'],
        [['J’accepte, tout le monde le fait', 'C’est un délit, pour celui qui paie comme pour celui qui reçoit.'], ['Je négocie le prix', 'Négocier, c’est déjà accepter la corruption.']]) }) },
    ] },
    { id: 'delivrance', nom: 'Délivrance et affichage', resume: 'Recevoir le permis, l’afficher sur le terrain et attendre la fin du délai de recours.', taches: [
      { id: 'panneau', zone: 'affichage', titre: 'Panneau du permis', contenu: () => ({ type: 'selection', selection: {
        titre: 'Panneau du permis', enonce: 'Le permis est accordé : il doit être affiché sur le terrain, visible depuis la voie.', consigne: 'Coche ce que le panneau doit indiquer.',
        options: [
          { texte: 'Le numéro et la date du permis', attendu: true, explication: 'Ils permettent de retrouver le dossier.' },
          { texte: 'Le nom du bénéficiaire', attendu: true, explication: 'On sait qui construit.' },
          { texte: 'La nature des travaux, la surface et la hauteur', attendu: true, explication: 'Les voisins voient ce qui va être construit.' },
          { texte: 'L’adresse de la mairie où consulter le dossier', attendu: true, explication: 'Toute personne intéressée peut consulter le dossier.' },
          { texte: 'Le prix de la maison', attendu: false, explication: 'Le budget du client ne regarde personne.' },
          { texte: 'Le numéro de téléphone du maçon', attendu: false, explication: 'Ce n’est pas une information du permis.' },
          { texte: 'Une publicité pour l’entreprise', attendu: false, explication: 'Le panneau du permis est un affichage légal.' },
        ] } }) },
      { id: 'affichage', zone: 'affichage', titre: 'Affichage obligatoire', contenu: () => ({ type: 'situation', situation: s('affichage', 'Affichage obligatoire',
        'Le client veut commencer les travaux sans afficher le permis sur le terrain.',
        ['J’installe le panneau, visible depuis la voie, pour toute la durée du chantier', 'L’affichage informe les voisins et ouvre le délai de recours : il est obligatoire.'],
        [['Le permis est dans le tiroir, ça suffit', 'Personne ne peut le consulter : le délai de recours ne court pas.'], ['On l’affichera à la fin', 'L’affichage se fait dès le début, pendant tout le chantier.']]) }) },
      { id: 'avant-permis', zone: 'guichet', titre: 'Travaux trop tôt', contenu: () => ({ type: 'situation', situation: s('avant-permis', 'Travaux trop tôt',
        'Le maçon a commencé les fouilles la veille de la délivrance du permis.',
        ['J’arrête les travaux jusqu’à la délivrance du permis', 'Construire sans permis expose à l’arrêt du chantier et à une amende.'],
        [['Le permis arrive demain, ça ne change rien', 'Un jour sans permis reste une infraction, et le permis peut encore être refusé.'], ['On cache les fouilles avec une bâche', 'Dissimuler aggrave l’infraction.']]) }) },
    ] },
    { id: 'conformite', nom: 'Ouverture et conformité', resume: 'Déclarer l’ouverture du chantier, respecter le permis pendant les travaux, puis obtenir le certificat de conformité.', taches: [
      { id: 'doc', zone: 'guichet', titre: 'Ouverture du chantier', contenu: () => ({ type: 'situation', situation: s('doc', 'Ouverture du chantier',
        'Le chantier démarre demain matin.',
        ['Je dépose la déclaration d’ouverture de chantier à la mairie', 'Elle informe l’administration et permet les contrôles pendant les travaux.'],
        [['Le permis suffit, inutile de prévenir', 'La déclaration d’ouverture est une étape à part.'], ['On préviendra à la fin des travaux', 'Elle se dépose au démarrage, pas à la fin.']]) }) },
      { id: 'etage', zone: 'urbanisme', titre: 'Un étage de plus', contenu: () => ({ type: 'situation', situation: s('etage', 'Un étage de plus',
        'En cours de travaux, le client veut ajouter un deuxième étage non prévu au permis.',
        ['Il faut d’abord un permis modificatif, et un nouveau calcul de la structure', 'Construire au-delà du permis expose à la démolition, et les fondations n’ont pas été calculées pour cet étage.'],
        [['On le construit, personne ne verra', 'Le contrôle de conformité le verra, et la structure pourrait céder.'], ['On le construit en matériaux légers, sans demande', 'Même léger, un étage non autorisé reste interdit.']]) }) },
      { id: 'certificat', zone: 'urbanisme', titre: 'Certificat de conformité', contenu: () => ({ type: 'situation', situation: s('certificat', 'Certificat de conformité',
        'Les travaux sont terminés et la villa est prête à être habitée.',
        ['Je demande la visite de conformité pour obtenir le certificat', 'Le certificat atteste que la construction respecte le permis : il est utile pour vendre, louer ou assurer.'],
        [['On s’installe, la mairie viendra si elle veut', 'Sans certificat, la maison reste en situation irrégulière.'], ['Le permis vaut certificat', 'Le permis autorise à construire ; le certificat constate que c’est bien fait.']]) }) },
    ] },
  ],
};

/** Hall de 24 × 16 m, entrée au sud : guichet unique au fond, salle d'attente, domaines et urbanisme à l'est, rédaction et affichage à l'ouest. */
const COLONNES = [[-7, -2], [7, -2], [-7, 4], [7, 4]].map(([x, z]) => zone(x - .35, x + .35, z - .35, z + .35));
export const PLAN_MAIRIE: PlanLieu = {
  demiLargeur: 12, demiProfondeur: 8, ambiance: 'interieur', depart: [0, 6.8],
  obstacles: [
    zone(-9.4, 9.4, -6.2, -4.6),       // guichet unique, comptoir vitré
    zone(-11.4, -9.4, -6.2, -5.4), zone(9.4, 11.4, -6.2, -5.4),
    zone(-5.6, 5.6, .1, 3.4),          // rangées de chaises de la salle d'attente
    ...COLONNES,
    zone(8.2, 10.8, -.2, 1.8),         // bureau des domaines
    zone(7.4, 10.8, -4.1, -2),         // table de l'urbanisme et maquette
    zone(-10.6, -7.4, 3, 4.6),         // table de rédaction
    zone(-11.8, -9.4, -4.2, -1.4),     // archives
    zone(-10.4, -7.6, -.5, -.1),       // panneau d'affichage légal, tourné vers la salle
    zone(2.1, 2.7, 6.2, 6.8),          // distributeur de tickets
  ],
  stations: { domaines: [7.2, .8], table: [-9, 5.7], urbanisme: [6.6, -3.1], guichet: [-2.6, -3.8], affichage: [-9, 1], mentor: [1.8, -2.6] },
  libelles: { domaines: 'Domaines · foncier', table: 'Table de rédaction', urbanisme: 'Urbanisme', guichet: 'Guichet unique', affichage: 'Affichage légal', mentor: 'Akissi' },
  mentor: { position: [1.6, -3.9], rotation: 0 },
};
