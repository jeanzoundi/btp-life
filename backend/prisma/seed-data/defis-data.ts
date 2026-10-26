// Défis du jour et de la semaine, et imprévus à choix du Grand chantier. Upsertés par seed.ts dans `Evenement` et
// `Imprevu` : ensuite, ils se modifient depuis l'administration (ressources « evenements » et « imprevus »), sans redéployer.

export type TypeObjectifDefi = 'seances_lieu' | 'chapitres' | 'missions' | 'cours' | 'trajets';
export interface DefiConfig {
  slug: string; titre: string; description: string;
  objectif: { type: TypeObjectifDefi; cible: number };
  recompense: { xp: number; argent: number; reputation?: number };
}

export const DEFIS_JOUR: DefiConfig[] = [
  { slug: 'seance-du-jour', titre: 'Une séance chez un mentor', description: 'Termine une séance dans un lieu du quartier.', objectif: { type: 'seances_lieu', cible: 1 }, recompense: { xp: 25, argent: 1000 } },
  { slug: 'journee-studieuse', titre: 'Journée studieuse', description: 'Termine deux séances dans les lieux du quartier.', objectif: { type: 'seances_lieu', cible: 2 }, recompense: { xp: 45, argent: 1800 } },
  { slug: 'mission-du-jour', titre: 'Mission accomplie', description: 'Réussis une mission.', objectif: { type: 'missions', cible: 1 }, recompense: { xp: 30, argent: 1200 } },
  { slug: 'cours-du-jour', titre: 'Un cours de plus', description: 'Termine un cours de l’académie.', objectif: { type: 'cours', cible: 1 }, recompense: { xp: 20, argent: 600 } },
  { slug: 'en-route', titre: 'En route', description: 'Prends un taxi ou un gbaka pour traverser le quartier.', objectif: { type: 'trajets', cible: 1 }, recompense: { xp: 10, argent: 300 } },
  { slug: 'le-fil-rouge-avance', titre: 'Le fil rouge avance', description: 'Valide un chapitre de la Résidence Akwaba.', objectif: { type: 'chapitres', cible: 1 }, recompense: { xp: 40, argent: 1500 } },
];

export const DEFIS_SEMAINE: DefiConfig[] = [
  { slug: 'habitue-du-quartier', titre: 'Habitué du quartier', description: 'Termine cinq séances dans les lieux cette semaine.', objectif: { type: 'seances_lieu', cible: 5 }, recompense: { xp: 150, argent: 6000, reputation: 3 } },
  { slug: 'semaine-de-terrain', titre: 'Semaine de terrain', description: 'Réussis trois missions cette semaine.', objectif: { type: 'missions', cible: 3 }, recompense: { xp: 160, argent: 6500, reputation: 3 } },
  { slug: 'l-immeuble-monte', titre: 'L’immeuble monte', description: 'Valide deux chapitres du fil rouge cette semaine.', objectif: { type: 'chapitres', cible: 2 }, recompense: { xp: 180, argent: 7000, reputation: 4 } },
  { slug: 'semaine-d-etude', titre: 'Semaine d’étude', description: 'Termine trois cours de l’académie cette semaine.', objectif: { type: 'cours', cible: 3 }, recompense: { xp: 120, argent: 4000, reputation: 2 } },
];

export interface OptionImprevu { texte: string; retour: string; effets: { xp?: number; argent?: number; reputation?: number } }
export interface ImprevuConfig { slug: string; titre: string; description: string; options: OptionImprevu[] }

/** Imprévus du Grand chantier : un par jour, une décision, ses conséquences. La bonne réponse rapporte, la mauvaise coûte. */
export const IMPREVUS: ImprevuConfig[] = [
  { slug: 'toupie-en-retard', titre: 'La toupie a deux heures de retard', description: 'La centrale prévient : le béton du jour arrivera avec deux heures de retard.', options: [
    { texte: 'Je réorganise la journée : coffrages et ferraillage d’abord', retour: 'L’équipe ne perd pas une minute, et le béton arrive sur des coffrages prêts.', effets: { xp: 15, reputation: 2 } },
    { texte: 'J’attends sans rien changer', retour: 'Deux heures payées à attendre : la journée prend du retard.', effets: { reputation: -1 } },
    { texte: 'J’emprunte le béton du chantier voisin sans le dire', retour: 'Le voisin s’en aperçoit : il faut rembourser, et la confiance en prend un coup.', effets: { argent: -2000, reputation: -3 } },
  ] },
  { slug: 'macon-malade', titre: 'Un maçon est malade', description: 'Koné, ton meilleur maçon, appelle : il a de la fièvre.', options: [
    { texte: 'Je lui dis de se soigner et je réorganise les binômes', retour: 'Koné revient guéri ; l’équipe a vu que la santé passe avant tout.', effets: { xp: 10, reputation: 2 } },
    { texte: 'Je lui demande de venir quand même', retour: 'Fiévreux sur un échafaudage : c’est un accident qui attend son heure.', effets: { reputation: -3 } },
    { texte: 'Je recrute un journalier au bord de la route, sans le former', retour: 'Sans accueil sécurité, il fait des erreurs qu’il faut reprendre.', effets: { argent: -1500, reputation: -1 } },
  ] },
  { slug: 'orage-coulage', titre: 'L’orage menace le coulage', description: 'Le ciel se charge au moment de couler la dalle.', options: [
    { texte: 'Je reporte le coulage et je bâche les aciers', retour: 'La dalle sera coulée demain sur un ferraillage propre : la bonne décision.', effets: { xp: 15, reputation: 2 } },
    { texte: 'On coule quand même, vite', retour: 'La pluie délave le béton frais : une partie de la dalle est à reprendre.', effets: { argent: -3000, reputation: -2 } },
    { texte: 'On ajoute du ciment pour compenser la pluie', retour: 'Le béton ne se corrige pas au hasard : le laboratoire le refusera.', effets: { argent: -1000, reputation: -1 } },
  ] },
  { slug: 'inspection-surprise', titre: 'Inspection surprise', description: 'L’inspecteur du travail se présente au portail sans prévenir.', options: [
    { texte: 'Je l’accueille, je présente le registre et je fais la visite', retour: 'Registre à jour, EPI portés : l’inspection se passe bien.', effets: { xp: 20, reputation: 3 } },
    { texte: 'Je le fais attendre le temps de distribuer les casques', retour: 'L’inspecteur l’a vu : il note le défaut et reviendra.', effets: { reputation: -2 } },
    { texte: 'Je lui propose une enveloppe pour qu’il reparte', retour: 'Tentative de corruption : l’affaire est signalée, l’amende est lourde.', effets: { argent: -5000, reputation: -5 } },
  ] },
  { slug: 'voisin-bruit', titre: 'Le voisin se plaint du bruit', description: 'À 6 h 30, un voisin vient se plaindre du marteau-piqueur.', options: [
    { texte: 'Je m’excuse et je décale les travaux bruyants après 8 h', retour: 'Le voisin apprécie : le chantier garde de bonnes relations avec le quartier.', effets: { xp: 10, reputation: 2 } },
    { texte: 'Je lui réponds que le chantier a un permis', retour: 'Le permis n’autorise pas tout : la mairie reçoit une plainte.', effets: { reputation: -2 } },
    { texte: 'Je fais monter le son de la radio du chantier', retour: 'Le conflit s’envenime : la police municipale passe dans l’après-midi.', effets: { reputation: -3 } },
  ] },
  { slug: 'ciment-disparu', titre: 'Des sacs de ciment ont disparu', description: 'L’inventaire du matin compte vingt sacs de moins que la veille.', options: [
    { texte: 'Je recompte, je vérifie les bons de livraison et je ferme le stock à clé', retour: 'Une erreur de livraison explique la moitié de l’écart ; le stock fermé règle le reste.', effets: { xp: 15, reputation: 1 } },
    { texte: 'J’accuse l’équipe devant tout le monde', retour: 'Sans preuve, l’ambiance se dégrade et personne n’ose plus rien dire.', effets: { reputation: -3 } },
    { texte: 'Je ne dis rien et je rachète en douce', retour: 'Le problème reviendra : rien n’a été réglé.', effets: { argent: -2500 } },
  ] },
];
