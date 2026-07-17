// Banques de messages variés pour ne jamais répéter le même texte en boucle — un ton chaleureux et
// jamais culpabilisant, cohérent avec la mentor Akissi (voir guide-mentor.tsx côté frontend).

export function messageAleatoire(banque: string[]): string {
  return banque[Math.floor(Math.random() * banque.length)];
}

export const MESSAGES_SERIE_EN_DANGER: string[] = [
  "Ta série est encore en vie... mais plus pour longtemps si tu ne joues pas aujourd'hui !",
  "Un petit chantier aujourd'hui et ta série continue. Ça prend 5 minutes.",
  "N'oublie pas de venir jouer aujourd'hui — ta série mérite mieux qu'une pause.",
  "Akissi t'attend sur le chantier. Une mission suffit pour garder ta série.",
  "Tu es à deux doigts de perdre ta série. Une mission rapide et c'est réglé.",
  "Ta série de jours consécutifs tient à un fil — viens la sauver.",
  "Petit rappel amical : ta série de jours joués touche à sa fin si tu ne repasses pas aujourd'hui.",
  "Une mission, deux minutes, ta série sauvée. À toi de jouer.",
  "Ne laisse pas ta série s'arrêter là — reviens sur le chantier aujourd'hui.",
  "Ta régularité paie sur le long terme. Ne casse pas ta série pour aujourd'hui.",
  "Il te reste quelques heures pour garder ta série intacte.",
  "Chaque jour joué compte. Ta série t'attend pour continuer sa route.",
  "Un chantier t'attend, et ta série aussi. Viens y faire un tour.",
  "Tu as construit une belle série de jours consécutifs — ne la laisse pas s'effondrer aujourd'hui.",
  "5 minutes suffisent pour garder ta série vivante. On t'attend.",
];

export const MESSAGES_RETOUR_INACTIF: string[] = [
  "Ça fait un moment... Le chantier a bien avancé sans toi, viens voir !",
  "On ne t'a pas vu récemment. Tes collègues virtuels se demandent où tu es passé.",
  "Ton chantier t'attend patiemment. Reviens quand tu veux, il n'y a pas de pression.",
  "Tu nous manques sur le chantier ! Une petite mission pour reprendre le rythme ?",
  "Ça fait quelques jours — l'occasion parfaite de reprendre là où tu t'étais arrêté.",
  "Ton personnage a hâte de retourner sur le terrain. On y va ?",
  "Un peu de temps libre ? C'est le moment idéal pour relancer ta carrière BTP.",
  "Akissi garde un œil sur tes progrès. Reviens quand tu es prêt, elle t'aidera.",
  "Ta carrière t'attend, sans horloge qui tourne. Reviens à ton rythme.",
  "Quelques minutes suffisent pour reprendre le fil de ta carrière.",
  "On a gardé ta place sur le chantier. Prêt à y retourner ?",
  "De nouvelles missions t'attendent depuis ton dernier passage.",
  "Reprendre là où tu t'es arrêté ne prend que quelques minutes.",
  "Ton avatar s'ennuie un peu sans toi. Viens le faire progresser.",
  "Pas de souci si tu as été occupé — ta progression est toujours là, prête à continuer.",
];

export const MESSAGES_NIVEAU: string[] = [
  'Tu progresses à vitesse grand V, continue comme ça !',
  'Ton expérience de terrain se voit — bravo pour ce palier franchi.',
  'Un niveau de plus, une carrière qui prend forme.',
  'Ce niveau, tu l\'as mérité mission après mission.',
  'Ta progression est solide. Prochain palier en vue !',
];

export const MESSAGES_BADGE: string[] = [
  'Un nouveau badge pour ta collection — bien joué !',
  'Ce badge récompense ton travail. Continue sur cette lancée.',
  'Une preuve de plus de ton savoir-faire sur le chantier.',
  'Badge débloqué — ton CV virtuel s\'enrichit encore.',
];

export const MESSAGES_PROMOTION: string[] = [
  'Une promotion méritée après tout ce travail de terrain.',
  'Ta carrière avance d\'un cran — félicitations pour ce nouveau poste.',
  'Le fruit de ta persévérance : un nouveau poste t\'attend.',
  'Promotion décrochée ! Ton parcours BTP continue de grandir.',
];
