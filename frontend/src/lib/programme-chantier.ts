// Programme complet du Grand chantier, du recrutement de l'équipe à la réception : étapes, durée, métiers,
// situations de terrain propres à chaque étape, et recrutement des ouvriers. Sans Three.js ni React, pour rester testable.

export interface Choix { texte: string; correct: boolean; retour: string }
export interface SituationTerrain { id: string; titre: string; situation: string; choix: readonly Choix[] }

/** Ordre d'affichage des choix : les données mettent la bonne réponse en premier, l'écran la place ailleurs selon la
 * situation, toujours au même endroit pour une même situation. Renvoie les indices d'origine dans l'ordre affiché. */
export function ordreChoix(s: { id: string; choix: readonly unknown[] }): number[] {
  let graine = 0;
  for (let i = 0; i < s.id.length; i++) graine = (Math.imul(graine, 31) + s.id.charCodeAt(i)) >>> 0;
  const ordre = s.choix.map((_, i) => i);
  for (let i = ordre.length - 1; i > 0; i--) {
    graine = (Math.imul(graine ^ (graine >>> 15), 2246822519) + 3266489917) >>> 0;
    const j = Math.floor(graine / 2 ** 32 * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  return ordre;
}

/** Endroits du chantier où se déroulent les tâches (repères de l'intérieur du chantier). */
export type ZoneChantier = 'vestiaire' | 'bureau' | 'stockage' | 'ferraillage' | 'betonniere' | 'implantation' | 'fouille' | 'facade-sud' | 'facade-est' | 'acces-etage' | 'entree-ouvrage' | 'portail';

export type Metier = 'Chef d’équipe' | 'Maçon' | 'Manœuvre' | 'Ferrailleur' | 'Coffreur' | 'Électricien' | 'Plombier' | 'Carreleur' | 'Peintre';

/** Salaires journaliers alignés sur le simulateur pour le gros œuvre (POST /chantiers/mine/:id/embaucher). */
export const METIERS: Record<Metier, { salaire: number; icone: string }> = {
  'Chef d’équipe': { salaire: 28_000, icone: '🦺' },
  'Maçon': { salaire: 15_000, icone: '🧱' },
  'Manœuvre': { salaire: 8_000, icone: '🪣' },
  'Ferrailleur': { salaire: 18_000, icone: '🔩' },
  'Coffreur': { salaire: 18_000, icone: '🪵' },
  'Électricien': { salaire: 20_000, icone: '💡' },
  'Plombier': { salaire: 20_000, icone: '🚰' },
  'Carreleur': { salaire: 17_000, icone: '◻️' },
  'Peintre': { salaire: 14_000, icone: '🖌️' },
};

export const SITUATION_EPI: SituationTerrain = {
  id: 'epi', titre: 'Avant d’entrer sur le chantier',
  situation: 'Il fait déjà chaud. Le vestiaire met à disposition casques, chaussures de sécurité et gilets haute visibilité.',
  choix: [
    { texte: 'Casque, chaussures de sécurité et gilet haute visibilité', correct: true, retour: 'C’est la tenue minimale sur un chantier, même pour une simple visite.' },
    { texte: 'Juste le casque, il fait trop chaud pour le reste', correct: false, retour: 'Un clou ou une charge qui tombe ne regarde pas la météo : chaussures et gilet sont obligatoires.' },
    { texte: 'Rien : je ne fais que passer', correct: false, retour: 'Personne n’entre sans équipement, pas même le chef. C’est la première règle du chantier.' },
  ],
};

const s = (id: string, titre: string, situation: string, bonne: [string, string], mauvaises: [string, string][]): SituationTerrain =>
  ({ id, titre, situation, choix: [{ texte: bonne[0], correct: true, retour: bonne[1] }, ...mauvaises.map(([texte, retour]) => ({ texte, correct: false, retour }))] });

// ─── Situations de terrain, étape par étape ───

const IMPLANTATION = [
  s('chaises', 'Chaises d’implantation', 'Les chaises sont posées aux angles. Le maçon veut planter les piquets d’angle à vue, sans tendre de cordeaux.',
    ['Je fais tendre les cordeaux entre les chaises et reporter les axes', 'Les cordeaux matérialisent les axes et restent en place : on pourra recontrôler pendant les fouilles.'],
    [['Je laisse faire, il a l’habitude', 'Sans cordeaux, les axes disparaissent dès que la pelle arrache les piquets.'],
     ['Je trace tout au sol à la chaux, ça suffit', 'La chaux guide la pelle, mais les axes doivent rester tenus au-dessus des fouilles par les chaises et les cordeaux.']]),
  s('equerre', 'Équerrage', 'Pour vérifier l’angle droit, on mesure 3 m sur un côté et 4 m sur l’autre. La diagonale fait 5,12 m.',
    ['Je fais reprendre l’angle jusqu’à obtenir 5,00 m', 'Règle du 3-4-5 : la diagonale doit faire exactement 5 m. À 5,12 m, l’angle est ouvert et tout le bâtiment serait de travers.'],
    [['12 cm sur 5 m, c’est négligeable', 'L’erreur grandit avec la longueur : sur 12 m de façade, le décalage dépasserait 25 cm.'],
     ['On rattrapera à l’élévation des murs', 'Un défaut d’implantation se retrouve dans les fondations, les murs et la dalle : on corrige maintenant, quand c’est gratuit.']]),
  s('niveau', 'Repère de niveau', 'Le plan fixe le niveau 0,00 à 20 cm au-dessus du trottoir. Personne n’a encore posé de repère.',
    ['Je fais fixer un repère durable et noter son altitude', 'Profondeurs de fouille, hauteurs de dalle : tout se mesure depuis ce repère. Il doit rester fixe et visible jusqu’à la fin.'],
    [['On prendra le sol naturel comme référence', 'Le terrain n’est jamais plat : chaque équipe mesurerait depuis un point différent.'],
     ['Le haut d’un piquet suffira', 'Un piquet se fait bousculer en une journée : le repère doit être indéplaçable.']]),
];

const FOUILLES = [
  s('fond-fouille', 'Fond de fouille', 'Le plan demande des fouilles à 80 cm, sur sol ferme. À 60 cm, la pelle tombe sur une terre noire et molle.',
    ['Je fais creuser jusqu’au bon sol et je préviens le conducteur de travaux', 'Une semelle doit reposer sur un sol porteur ; une terre organique se tasse et fissure le bâtiment.'],
    [['On s’arrête à 60 cm, ça ira plus vite', 'Fonder sur un sol mou, c’est risquer tassements et fissures dans quelques mois.'],
     ['On compense avec plus de béton dans la semelle', 'Plus de béton ne rend pas le sol plus porteur. Il faut atteindre le bon sol, ou faire valider une solution par le bureau d’études.']]),
  s('deblais', 'Déblais', 'Les terres extraites sont déposées au ras du bord de la fouille, sur toute sa longueur.',
    ['Je fais reculer les déblais à au moins un mètre du bord', 'Un tas au bord surcharge la paroi : elle peut s’effondrer sur les ouvriers, et la terre retombe dans la fouille.'],
    [['C’est pratique pour le remblai, on laisse', 'Pratique, mais dangereux : la paroi risque l’éboulement.'],
     ['On les étale partout autour', 'Étaler partout bloque les circulations et le stockage : on fait un tas à distance, ou on évacue.']]),
  s('eboulement', 'Paroi instable', 'Dans une partie sableuse, la paroi de la fouille commence à s’effriter. Un manœuvre y travaille à 1,40 m de profondeur.',
    ['Je fais sortir le manœuvre et taluter ou blinder la paroi', 'Au-delà d’environ 1,30 m, une fouille doit être talutée ou blindée : un éboulement ensevelit en quelques secondes.'],
    [['Il se dépêche et il sort', 'Un éboulement ne prévient pas. Personne ne travaille sous une paroi instable.'],
     ['On arrose la paroi pour la tenir', 'L’eau alourdit le sable et favorise l’éboulement.']]),
  s('gaine', 'Gaine découverte', 'La pelle met au jour une gaine rouge enterrée qui traverse la fouille.',
    ['J’arrête la pelle, je fais baliser et je préviens le concessionnaire', 'Une gaine rouge signale un câble électrique : on arrête, on balise et on fait identifier avant de reprendre.'],
    [['On la coupe, elle doit être abandonnée', 'Couper un câble sous tension peut tuer. On ne touche à rien sans identification.'],
     ['On la dégage à la pioche pour voir', 'La pioche peut percer le câble. On arrête et on fait venir le concessionnaire.']]),
];

const SEMELLES = [
  s('proprete', 'Béton de propreté', 'Les fouilles sont prêtes. Le ferrailleur veut poser les cages d’armatures directement sur la terre.',
    ['Je fais d’abord couler 5 cm de béton de propreté', 'Le béton de propreté donne un fond propre et plan, et empêche la terre de souiller les aciers.'],
    [['On pose sur la terre, le béton recouvrira tout', 'Des aciers posés sur la terre rouillent et perdent leur enrobage : la semelle s’affaiblit.'],
     ['On étale des sacs de ciment vides au fond', 'Des sacs ne remplacent pas un béton de propreté : ils pourrissent et laissent des vides.']]),
  s('cales', 'Enrobage des aciers', 'Les cages sont en place, mais elles touchent le fond et les parois de la fouille.',
    ['Je fais poser des cales en béton pour garder 5 cm d’enrobage', 'L’enrobage protège l’acier de la corrosion et assure son adhérence au béton.'],
    [['Le béton coulera dessous de toute façon', 'Sans cales, l’acier reste collé au fond : il rouillera et la semelle perdra sa résistance.'],
     ['On cale avec des cailloux', 'Les cailloux bougent et ne garantissent rien : on utilise des cales prévues pour ça.']]),
  s('attentes', 'Attentes des poteaux', 'Avant le coulage, deux aciers en attente des poteaux sont décalés de 10 cm par rapport aux cordeaux.',
    ['Je fais reprendre leur position avant de couler', 'Une fois le béton pris, une attente mal placée décale tout le poteau.'],
    [['On les pliera en montant les poteaux', 'Plier les aciers les fragilise et décale les charges : interdit sans l’accord du bureau d’études.'],
     ['Le poteau sera un peu de travers, ce n’est pas grave', 'Un poteau décalé transmet mal les charges à sa semelle.']]),
  s('vibration', 'Coulage des semelles', 'Le béton arrive à la brouette. Personne n’utilise le vibreur.',
    ['Je fais vibrer le béton par couches, sans toucher les aciers', 'La vibration chasse l’air et remplit les angles : sans elle, le béton reste plein de vides.'],
    [['On tasse à la pelle, ça suffit', 'Tasser à la pelle laisse des nids de cailloux et des vides.'],
     ['On ajoute de l’eau pour que ça coule mieux', 'L’eau en trop fait chuter la résistance du béton.']]),
  s('dosage', 'Dosage du béton', 'Pour les semelles, le maçon dose le béton « au jugé », à la pelle.',
    ['J’impose le dosage prévu, mesuré au seau (350 kg de ciment par m³)', 'Mesurer au seau garantit la même résistance à chaque gâchée.'],
    [['Au jugé, il a l’habitude', 'Au jugé, chaque gâchée est différente : certaines seront trop faibles.'],
     ['On met moins de ciment pour économiser', 'Un béton sous-dosé ne tient pas les charges calculées.']]),
  s('cure', 'Cure du béton', 'Les semelles viennent d’être coulées en plein soleil, à 34 °C.',
    ['Je fais arroser et couvrir le béton plusieurs jours', 'Le béton durcit avec l’eau : s’il sèche trop vite, il se fissure et perd de la résistance.'],
    [['Le soleil le fera durcir plus vite', 'Le béton ne durcit pas en séchant mais par réaction avec l’eau. Trop de soleil le fissure.'],
     ['On décoffre et on remblaie tout de suite', 'Trop tôt : le béton jeune doit d’abord être protégé.']]),
];

const SOUBASSEMENT = [
  s('agglos-pleins', 'Murs de soubassement', 'Pour monter le soubassement, sous le niveau du sol, le maçon prend des agglos creux de 15.',
    ['Je fais utiliser des agglos pleins', 'Sous le sol, les murs reprennent les charges et la poussée des terres, au contact de l’humidité : agglos pleins.'],
    [['Des creux suffisent, ils seront enterrés', 'Des agglos creux enterrés se gorgent d’humidité et résistent moins.'],
     ['On remplit les creux de terre', 'La terre ne porte rien et garde l’humidité.']]),
  s('remblai', 'Remblai intérieur', 'Avant le dallage, un camion vide 80 cm de terre d’un coup dans le soubassement.',
    ['Je fais compacter par couches de 20 cm, en arrosant', 'Compacté couche par couche, le remblai ne se tassera plus : le dallage ne fissurera pas.'],
    [['On compacte une seule fois en surface', 'En surface seulement, le bas du remblai se tassera et le dallage se fendra.'],
     ['Pas besoin, le dallage portera tout seul', 'Un dallage sur une terre non compactée casse quand le remblai s’affaisse.']]),
  s('herisson', 'Hérisson et film', 'Le remblai est compacté. Le maçon veut couler le dallage directement dessus.',
    ['Je fais poser un hérisson de pierres, un film plastique puis le treillis', 'Le hérisson coupe les remontées d’humidité ; le film et le treillis protègent et arment le dallage.'],
    [['On coule directement, c’est plus rapide', 'Sans hérisson ni film, l’humidité du sol remonte dans le dallage puis dans les murs.'],
     ['Une couche de sable suffit', 'Le sable seul laisse remonter l’humidité.']]),
];

const MACONNERIE = [
  s('cordeau', 'Alignement des rangs', 'Le maçon monte la deuxième rangée d’agglos à l’œil, sans cordeau.',
    ['Je fais tendre un cordeau à chaque rangée et vérifier au niveau', 'Le cordeau garde les rangs droits et horizontaux ; un mur qui ondule se rattrape mal à l’enduit.'],
    [['L’enduit rattrapera', 'Rattraper un mur tordu à l’enduit coûte du mortier, du temps, et se voit quand même.'],
     ['On vérifiera à la fin du mur', 'À la fin, il est trop tard : il faudrait démolir.']]),
  s('aplomb', 'Aplomb', 'Contrôle au fil à plomb : un angle de mur penche de 2 cm sur 1,50 m de hauteur.',
    ['Je fais démonter les rangs en cause et remonter d’aplomb', '2 cm sur 1,50 m deviennent 4 cm à 3 m : on reprend tant que le mortier est frais.'],
    [['On continue, la dalle tiendra le mur', 'Un mur qui penche porte mal la dalle et se fissure.'],
     ['On penche les rangs suivants dans l’autre sens', 'Un mur en zigzag reste un mauvais mur : on reprend proprement.']]),
  s('chainage', 'Poteaux et chaînages', 'Le maçon veut monter les murs jusqu’à la dalle sans chaînage ni poteaux d’angle, « pour aller plus vite ».',
    ['Je fais réaliser poteaux et chaînages comme sur les plans', 'Poteaux et chaînages tiennent les murs ensemble : sans eux, le bâtiment se fissure au moindre tassement.'],
    [['Les agglos sont assez solides seuls', 'Un mur d’agglos sans chaînage se fissure et peut s’ouvrir.'],
     ['On en met seulement en façade', 'Tous les murs porteurs doivent être chaînés, pas seulement ceux qu’on voit.']]),
  s('linteau', 'Linteaux', 'Au-dessus d’une fenêtre, un ouvrier pose les agglos sur une simple planche.',
    ['Je fais couler un linteau en béton armé qui s’appuie de chaque côté', 'Le linteau reprend le poids du mur au-dessus de l’ouverture ; il s’appuie d’au moins 20 cm de chaque côté.'],
    [['La planche suffira', 'La planche pourrira et les agglos tomberont.'],
     ['On glissera un linteau dessous plus tard', 'Impossible de glisser un linteau sous un mur déjà monté.']]),
];

const DALLE = [
  s('etais', 'Étaiement', 'Sous le coffrage de la dalle, les étais sont espacés de 2,50 m et certains reposent sur des agglos posés au sol.',
    ['Je fais resserrer les étais et les poser sur des appuis stables', 'Une dalle fraîche pèse plusieurs tonnes : un étai mal appuyé s’enfonce et tout peut s’effondrer.'],
    [['Les étais sont solides, ça tiendra', 'C’est l’appui et l’espacement qui font la sécurité, pas seulement l’étai.'],
     ['On en ajoutera pendant le coulage si ça bouge', 'Pendant le coulage, passer dessous est dangereux et il est trop tard.']]),
  s('chapeaux', 'Aciers en chapeau', 'Le ferraillage de la dalle est posé, mais il manque les aciers en partie haute au-dessus des poutres.',
    ['Je fais poser les chapeaux prévus au plan avant le coulage', 'Au-dessus des appuis, la dalle travaille en partie haute : sans chapeaux, elle se fissure le long des poutres.'],
    [['Le treillis suffit', 'Le treillis seul ne reprend pas les efforts au-dessus des appuis.'],
     ['On les ajoutera dans la chape', 'Les aciers doivent être dans la dalle, pas dans la chape.']]),
  s('continuite', 'Coulage d’un seul tenant', 'À midi, la moitié de la dalle est coulée. L’équipe veut s’arrêter deux heures en plein soleil.',
    ['Je fais tourner les pauses pour couler sans interruption', 'Une reprise de bétonnage improvisée crée un point faible : une dalle se coule en continu.'],
    [['Pause pour tout le monde, on reprend à 14 h', 'En deux heures au soleil, le béton a commencé à prendre : la jonction sera fragile.'],
     ['On arrose et on reprend demain', 'Une reprise se prévoit à un endroit précis, avec l’accord du bureau d’études.']]),
  s('decoffrage', 'Décoffrage', 'Cinq jours après le coulage, un ouvrier veut retirer les étais pour les utiliser ailleurs.',
    ['J’attends le délai prévu, environ trois semaines', 'Le béton n’atteint sa résistance qu’après plusieurs semaines : décoffrer trop tôt fait fléchir ou casser la dalle.'],
    [['Le béton est dur au toucher, on peut', 'Dur en surface ne veut pas dire résistant.'],
     ['On en retire un sur deux', 'Même partiel, un décoffrage trop tôt met la dalle en danger.']]),
];

const ETAGE = [
  s('tremie', 'Trémie d’escalier', 'La trémie de l’escalier, dans la dalle, n’a aucune protection. Les ouvriers passent juste à côté.',
    ['Je fais poser un garde-corps autour de la trémie', 'Une trémie ouverte, c’est une chute de plus de 3 m : on l’entoure ou on la ferme solidement.'],
    [['Je préviens tout le monde de faire attention', 'Le risque reste là : une protection collective est obligatoire.'],
     ['On pose une planche en travers', 'Une planche seule glisse ou casse : il faut un platelage fixé ou un garde-corps.']]),
  MACONNERIE[1], MACONNERIE[2],
];

const TOITURE = [
  s('pente', 'Forme de pente', 'La forme de pente de la toiture-terrasse a été coulée parfaitement à plat.',
    ['Je fais reprendre une pente d’au moins 1,5 % vers les descentes', 'Sans pente, l’eau stagne sur la terrasse et finit par s’infiltrer.'],
    [['L’étanchéité suffira', 'Même étanche, une terrasse où l’eau stagne vieillit vite et fuit.'],
     ['On percera des trous si l’eau stagne', 'Percer une terrasse étanche, c’est créer une fuite.']]),
  s('releve', 'Relevé d’étanchéité', 'L’étanchéité est posée, mais elle s’arrête au pied de l’acrotère.',
    ['Je fais remonter l’étanchéité d’au moins 15 cm sur l’acrotère', 'L’angle terrasse-acrotère est le point le plus exposé : l’étanchéité doit y remonter.'],
    [['Un joint de mortier suffit', 'Le mortier se fissure et laisse passer l’eau.'],
     ['On peindra l’acrotère', 'Une peinture n’est pas une étanchéité.']]),
];

const FINITIONS = [
  s('enduit', 'Enduit de façade', 'Le maçon veut enduire en une seule couche de 4 cm, en plein soleil, sur un mur sec.',
    ['Je fais humidifier le mur et enduire en plusieurs couches', 'Gobetis, corps d’enduit puis finition : une couche trop épaisse sur un mur sec se fissure et se décolle.'],
    [['Une couche épaisse, c’est plus solide', 'Plus épais n’est pas plus solide : l’enduit se fissure en séchant.'],
     ['Sur un mur bien sec, ça accroche mieux', 'Un mur sec boit l’eau de l’enduit, qui grille et se décolle.']]),
  s('gaines', 'Électricité encastrée', 'L’électricien veut passer les fils directement dans les saignées, sans gaine.',
    ['Je fais poser des gaines avant de reboucher les saignées', 'Les gaines protègent les câbles et permettent de les remplacer sans casser le mur.'],
    [['Le mortier protège assez les fils', 'Un fil noyé sans gaine s’abîme et ne peut plus être remplacé.'],
     ['On mettra les gaines à la prochaine maison', 'Les règles d’installation s’appliquent à chaque logement.']]),
  s('essai-eau', 'Essai de plomberie', 'Le plombier a terminé les canalisations. Le carreleur attend pour fermer les murs.',
    ['Je fais un essai sous pression avant de carreler', 'On teste avant de fermer : une fuite cachée derrière un carrelage coûte une démolition.'],
    [['On carrèle, on verra à l’usage', 'Une fuite découverte après coup oblige à tout casser.'],
     ['On ouvre un robinet pour vérifier', 'Ouvrir un robinet ne met pas le réseau sous pression : les petites fuites passent inaperçues.']]),
  s('douche', 'Pente de la douche', 'Dans la douche, la chape a été tirée bien à plat, sans pente vers le siphon.',
    ['Je fais reprendre la chape avec une pente vers le siphon', 'Sans pente, l’eau stagne dans la douche et finit par s’infiltrer.'],
    [['Le carrelage fera la pente', 'Le carrelage suit la chape : c’est la chape qui doit avoir la pente.'],
     ['On ajoutera un deuxième siphon', 'Un siphon de plus ne sert à rien si l’eau ne coule pas vers lui.']]),
  s('peinture', 'Peinture', 'Le peintre veut peindre l’enduit posé hier, encore humide.',
    ['J’attends que l’enduit sèche, puis sous-couche et peinture', 'Sur un enduit humide, la peinture cloque et se décolle ; la sous-couche fixe le support.'],
    [['On peint, tout séchera ensemble', 'L’humidité prisonnière fera cloquer la peinture.'],
     ['Deux couches épaisses régleront le problème', 'Plus de peinture enferme encore plus d’humidité.']]),
];

const RECEPTION = [
  s('reserves', 'Visite de réception', 'Pendant la visite, le client remarque une porte qui frotte et une fissure sur un enduit.',
    ['Je note ces réserves au procès-verbal, avec un délai pour les lever', 'Une réception avec réserves engage l’entreprise à corriger dans un délai convenu.'],
    [['Je minimise : ce sont des détails', 'Le client a le droit de les faire noter ; les cacher détruit la confiance.'],
     ['Je refuse de signer le procès-verbal', 'Sans procès-verbal, l’ouvrage n’est pas réceptionné et le chantier ne peut pas être clos.']]),
  s('repli', 'Repli du chantier', 'L’équipe veut partir en laissant gravats et chutes au fond de la parcelle.',
    ['Je fais évacuer gravats et déchets avant le repli', 'Un chantier se rend propre : les déchets partent vers une filière adaptée.'],
    [['Le client s’en occupera', 'L’évacuation des déchets fait partie du marché de l’entreprise.'],
     ['On les enterre sous le jardin', 'Enterrer des gravats pollue le sol et cache des défauts au client.']]),
  s('doe', 'Dossier de l’ouvrage', 'Le client demande les plans des réseaux d’eau et d’électricité tels qu’ils ont été réalisés.',
    ['Je lui remets les plans à jour et les notices des équipements', 'Le dossier des ouvrages exécutés lui permettra d’entretenir et de réparer sans casser.'],
    [['Les plans du permis suffisent', 'Les réseaux ont bougé pendant les travaux : seuls les plans à jour sont fiables.'],
     ['Il n’en a pas besoin', 'Sans plans, le moindre dépannage devient une recherche à l’aveugle.']]),
];

// Sécurité, rattachée aux étapes où le risque existe vraiment.
const SECURITE = {
  echafaudage: s('echafaudage', 'Échafaudage', 'Au deuxième niveau de l’échafaudage, un garde-corps manque côté rue. Un maçon y travaille.',
    ['Je fais arrêter le travail en hauteur et poser le garde-corps', 'La chute de hauteur est l’accident le plus grave du BTP : on sécurise d’abord, on reprend ensuite.'],
    [['Je lui demande de faire attention', 'La vigilance ne remplace pas une protection collective.'],
     ['Je le note pour la semaine prochaine', 'Le risque est immédiat : on ne reporte jamais une protection contre les chutes.']]),
  fouille: s('fouille', 'Fouille non balisée', 'La fouille n’est pas balisée et coupe le passage des ouvriers vers le stock.',
    ['Je fais poser un balisage et une passerelle', 'Une fouille doit être signalée et franchissable en sécurité.'],
    [['Je la contourne et je continue', 'Les autres, eux, risquent d’y tomber. Un danger repéré se traite.'],
     ['Ce n’est pas mon rôle', 'La sécurité est l’affaire de tous : on signale et on fait corriger.']]),
  rallonge: s('rallonge', 'Électricité', 'Une rallonge électrique traverse une flaque d’eau près de la bétonnière.',
    ['Je fais couper le courant et déplacer la rallonge', 'Eau et électricité : on coupe d’abord, puis le câble passe en hauteur ou à l’abri.'],
    [['Je l’enjambe avec précaution', 'Le risque d’électrocution reste là pour les autres.'],
     ['J’attends que la flaque sèche', 'En attendant, n’importe qui peut s’électrocuter.']]),
  charge: s('charge', 'Levage', 'La grue déplace une palette d’agglos. Deux ouvriers discutent juste sous la charge.',
    ['Je les fais sortir de la zone et je préviens le grutier', 'Personne ne stationne sous une charge suspendue, jamais.'],
    [['Je les laisse, la palette est bien sanglée', 'Une élingue peut lâcher. La zone sous la charge reste vide.'],
     ['Je fais signe au grutier d’aller plus vite', 'Accélérer augmente le balancement : on dégage d’abord la zone.']]),
  stockage: s('stockage', 'Stockage en rive', 'Des agglos sont empilés sur la dalle, au bord du vide, sur plus d’un mètre.',
    ['Je fais reculer et abaisser la pile', 'Un stock au bord du vide peut tomber sur ceux qui travaillent en dessous.'],
    [['Je laisse, on va les utiliser vite', 'Il suffit d’un choc pour qu’un bloc tombe.'],
     ['Je fais monter encore plus d’agglos', 'Surcharger une dalle au bord du vide aggrave le danger.']]),
  decoupe: s('decoupe', 'Découpe', 'Un ouvrier découpe des agglos à la disqueuse, sans lunettes ni gants.',
    ['Je l’arrête et lui fais mettre lunettes, gants et masque', 'Éclats et poussière de silice : la découpe exige lunettes, gants et masque.'],
    [['Je le laisse finir, ce sera rapide', 'Un éclat dans l’œil ne prend qu’une seconde.'],
     ['Je lui prête mes lunettes de soleil', 'Des lunettes de soleil ne protègent pas des éclats.']]),
  rive: s('rive', 'Travail en rive', 'Sur la terrasse, un ouvrier travaille au bord, avant que l’acrotère soit monté.',
    ['Je fais poser des garde-corps provisoires avant de continuer', 'En rive, la protection collective passe avant tout : garde-corps d’abord, travail ensuite.'],
    [['Il a l’habitude des hauteurs', 'L’habitude ne retient personne en cas de chute.'],
     ['Je lui dis de rester à genoux', 'À genoux, on tombe aussi. Il faut une protection en rive.']]),
};

const LIVRAISONS = {
  ciment: s('ciment', 'Livraison de ciment', 'Bon de livraison : 40 sacs de ciment CPJ 45. Tu comptes 36 sacs, dont 2 déchirés.',
    ['J’accepte en notant mes réserves sur le bon : 34 sacs conformes', 'Les réserves écrites protègent l’entreprise : on ne paie que ce qui est livré en bon état.'],
    [['Je signe sans rien dire, le chauffeur est pressé', 'Une signature sans réserve vaut acceptation : l’entreprise paierait 40 sacs.'],
     ['Je refuse toute la livraison', 'Tout refuser bloque le chantier. On accepte ce qui est conforme et on note le reste.']]),
  fers: s('fers', 'Livraison d’aciers', 'Commande : barres HA12 pour les poteaux. Le camion apporte des barres HA10.',
    ['Je refuse ces barres et je préviens le conducteur de travaux', 'Un diamètre plus faible ne tient pas les charges calculées : la livraison n’est pas conforme.'],
    [['J’accepte, la différence est minime', 'Deux millimètres de moins, c’est environ 30 % d’acier en moins dans le poteau.'],
     ['Je les fais poser en doublant les barres', 'On ne modifie jamais un ferraillage sans l’accord du bureau d’études.']]),
  agglos: s('agglos', 'Livraison d’agglos', 'Une palette d’agglos arrive avec une dizaine de blocs cassés.',
    ['J’accepte en notant les blocs cassés sur le bon', 'Les blocs abîmés seront remplacés ou déduits de la facture.'],
    [['Je fais poser les blocs cassés quand même', 'Des blocs fissurés affaiblissent le mur.'],
     ['Je jette les blocs cassés sans rien noter', 'Sans réserve écrite, l’entreprise paie des blocs inutilisables.']]),
  carrelage: s('carrelage', 'Livraison de carrelage', 'Les cartons de carrelage livrés portent deux numéros de lot différents.',
    ['Je note la différence et je fais poser un seul lot par pièce', 'Deux lots n’ont jamais exactement la même teinte : mélangés, le sol paraîtrait bariolé.'],
    [['Peu importe, c’est le même modèle', 'Même modèle, mais pas la même cuisson : la nuance se verra.'],
     ['Je mélange les cartons pour répartir la différence', 'Mélanger rend la différence visible partout.']]),
};

export type ChargementLivraison = keyof typeof LIVRAISONS;

// ─── Programme ───

export type IdEtape = 'recrutement' | 'implantation' | 'fouilles' | 'semelles' | 'soubassement' | 'elevation' | 'dalle' | 'etage' | 'toiture' | 'finitions' | 'reception';

export interface TacheEtape { situation: SituationTerrain; zone: ZoneChantier }
export interface EtapeChantier {
  id: IdEtape; nom: string; jours: number; resume: string;
  /** Métiers à avoir dans l'équipe pour travailler à cette étape. */
  metiers: Metier[];
  travaux: TacheEtape[]; securite: TacheEtape[];
  livraison?: { chargement: ChargementLivraison; situation: SituationTerrain };
}

const t = (zone: ZoneChantier) => (situation: SituationTerrain): TacheEtape => ({ situation, zone });
const GROS_OEUVRE: Metier[] = ['Chef d’équipe', 'Maçon', 'Manœuvre', 'Ferrailleur', 'Coffreur'];

export const PROGRAMME: readonly EtapeChantier[] = [
  { id: 'recrutement', nom: 'Recrutement de l’équipe', jours: 1, metiers: [], travaux: [], securite: [],
    resume: 'Constituer l’équipe de gros œuvre : chef d’équipe, maçon, manœuvre, ferrailleur et coffreur, dans le budget de main-d’œuvre.' },
  { id: 'implantation', nom: 'Implantation', jours: 1, metiers: ['Chef d’équipe', 'Maçon'], travaux: IMPLANTATION.map(t('implantation')), securite: [],
    resume: 'Reporter le plan sur le terrain : chaises, cordeaux, angles droits et repère de niveau.' },
  { id: 'fouilles', nom: 'Terrassement et fouilles', jours: 2, metiers: ['Manœuvre'], travaux: FOUILLES.map(t('fouille')), securite: [t('fouille')(SECURITE.fouille)],
    resume: 'Creuser les fouilles des semelles jusqu’au bon sol, évacuer les déblais, tenir les parois.' },
  { id: 'semelles', nom: 'Semelles de fondation', jours: 2, metiers: ['Ferrailleur', 'Coffreur', 'Maçon'],
    travaux: [t('fouille')(SEMELLES[0]), t('ferraillage')(SEMELLES[1]), t('ferraillage')(SEMELLES[2]), t('betonniere')(SEMELLES[3]), t('betonniere')(SEMELLES[4]), t('fouille')(SEMELLES[5])],
    securite: [t('betonniere')(SECURITE.rallonge)], livraison: { chargement: 'fers', situation: LIVRAISONS.fers },
    resume: 'Béton de propreté, cages d’armatures et attentes des poteaux, coulage vibré puis cure.' },
  { id: 'soubassement', nom: 'Soubassement et dallage', jours: 1, metiers: ['Maçon', 'Manœuvre'],
    travaux: [t('facade-sud')(SOUBASSEMENT[0]), t('entree-ouvrage')(SOUBASSEMENT[1]), t('entree-ouvrage')(SOUBASSEMENT[2])], securite: [],
    livraison: { chargement: 'agglos', situation: LIVRAISONS.agglos },
    resume: 'Murs de soubassement en agglos pleins, remblai compacté, hérisson et dallage.' },
  { id: 'elevation', nom: 'Élévation du rez-de-chaussée', jours: 2, metiers: ['Maçon', 'Manœuvre'],
    travaux: [t('facade-sud')(MACONNERIE[0]), t('facade-est')(MACONNERIE[1]), t('facade-est')(MACONNERIE[2]), t('facade-sud')(MACONNERIE[3])],
    securite: [t('stockage')(SECURITE.charge), t('stockage')(SECURITE.decoupe)], livraison: { chargement: 'ciment', situation: LIVRAISONS.ciment },
    resume: 'Monter les murs d’agglos au cordeau, d’aplomb, avec poteaux, chaînages et linteaux.' },
  { id: 'dalle', nom: 'Dalle du plancher haut', jours: 2, metiers: ['Coffreur', 'Ferrailleur', 'Maçon'],
    travaux: [t('entree-ouvrage')(DALLE[0]), t('acces-etage')(DALLE[1]), t('betonniere')(DALLE[2]), t('entree-ouvrage')(DALLE[3])],
    securite: [t('acces-etage')(SECURITE.stockage)], livraison: { chargement: 'fers', situation: LIVRAISONS.fers },
    resume: 'Coffrer et étayer, ferrailler avec les chapeaux, couler d’un seul tenant, puis attendre avant de décoffrer.' },
  { id: 'etage', nom: 'Élévation de l’étage', jours: 2, metiers: ['Maçon', 'Manœuvre'], travaux: ETAGE.map(t('acces-etage')),
    securite: [t('facade-sud')(SECURITE.echafaudage), t('stockage')(SECURITE.charge)], livraison: { chargement: 'agglos', situation: LIVRAISONS.agglos },
    resume: 'Monter les murs de l’étage depuis l’échafaudage, trémie d’escalier protégée.' },
  { id: 'toiture', nom: 'Toiture-terrasse', jours: 1, metiers: ['Maçon'], travaux: TOITURE.map(t('acces-etage')), securite: [t('acces-etage')(SECURITE.rive)],
    resume: 'Acrotère, forme de pente et étanchéité de la toiture-terrasse.' },
  { id: 'finitions', nom: 'Finitions', jours: 3, metiers: ['Électricien', 'Plombier', 'Carreleur', 'Peintre'],
    travaux: [t('facade-sud')(FINITIONS[0]), t('entree-ouvrage')(FINITIONS[1]), t('entree-ouvrage')(FINITIONS[2]), t('entree-ouvrage')(FINITIONS[3]), t('facade-est')(FINITIONS[4])],
    securite: [t('facade-est')(SECURITE.echafaudage), t('stockage')(SECURITE.decoupe)], livraison: { chargement: 'carrelage', situation: LIVRAISONS.carrelage },
    resume: 'Enduits, électricité et plomberie encastrées, carrelage, menuiseries et peinture.' },
  { id: 'reception', nom: 'Réception de l’ouvrage', jours: 1, metiers: ['Chef d’équipe'], travaux: [t('entree-ouvrage')(RECEPTION[0]), t('stockage')(RECEPTION[1]), t('bureau')(RECEPTION[2])], securite: [],
    resume: 'Visite avec le client, réserves au procès-verbal, repli propre et dossier de l’ouvrage.' },
];

export const TOTAL_JOURS = PROGRAMME.reduce((n, e) => n + e.jours, 0);

const TOUTES: SituationTerrain[] = [SITUATION_EPI, ...PROGRAMME.flatMap(e => [...e.travaux, ...e.securite].map(x => x.situation)), ...Object.values(LIVRAISONS)];
export const situation = (id: string) => TOUTES.find(x => x.id === id);

const borne = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

/** Étape d'un jour du programme (0 = premier jour) : l'étape, son rang, et le jour à l'intérieur de l'étape (1 = premier). */
export function etapeAuJour(jours: number) {
  let reste = Math.max(0, Math.floor(jours));
  for (let i = 0; i < PROGRAMME.length; i++) {
    if (reste < PROGRAMME[i].jours) return { etape: PROGRAMME[i], index: i, jourEtape: reste + 1 };
    reste -= PROGRAMME[i].jours;
  }
  return null;
}

/** Jours écoulés avant le début d'une étape. */
export const debutEtape = (id: IdEtape) => PROGRAMME.slice(0, PROGRAMME.findIndex(e => e.id === id)).reduce((n, e) => n + e.jours, 0);

export type EtapeVisuelle = IdEtape | 'livre';
export interface EtatVisuel { etape: EtapeVisuelle; nom: string; progression: number; avancement: number; jour: number; total: number }

/** Ce que montre le chantier après `jours` journées comptées : l'étape du jour en cours et sa progression (0 à 1).
 * Le travail du jour est déjà dessiné, si bien que chaque journée comptée fait évoluer l'ouvrage. */
export function etatVisuel(jours: number): EtatVisuel {
  const j = borne(Math.floor(jours), 0, TOTAL_JOURS);
  const avancement = Math.round(j / TOTAL_JOURS * 100);
  const courant = etapeAuJour(j);
  if (!courant) return { etape: 'livre', nom: 'Ouvrage livré', progression: 1, avancement: 100, jour: TOTAL_JOURS, total: TOTAL_JOURS };
  return { etape: courant.etape.id, nom: courant.etape.nom, progression: courant.jourEtape / courant.etape.jours, avancement, jour: j + 1, total: TOTAL_JOURS };
}

/** Rapproche un nom de phase du simulateur (« Fondations », « Gros œuvre »…) de l'étape du programme. */
export function etapeDepuisNom(nom: string): IdEtape | null {
  // « œ » n'est pas décomposé par NFD : on le développe à la main (gros œuvre, second œuvre).
  const n = nom.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/recrut|embauche/.test(n)) return 'recrutement';
  if (/implant|piquet|prepar|install/.test(n)) return 'implantation';
  if (/fouille|terrass|decap|caniveau|drainage/.test(n)) return /semelle/.test(n) ? 'semelles' : 'fouilles';
  if (/fondation|semelle|longrine|radier/.test(n)) return 'semelles';
  if (/soubassement|dallage|herisson/.test(n)) return 'soubassement';
  if (/toit|charpente|couverture|etanch|terrasse/.test(n)) return 'toiture';
  if (/dalle|plancher|ferraill|coulage|coffrage/.test(n)) return 'dalle';
  if (/etage|r\+1/.test(n)) return 'etage';
  if (/elevation|gros.?oeuvre|maconnerie|mur|agglo|rez|poteau|chainage|trottoir|bordure/.test(n)) return 'elevation';
  if (/finition|second.?oeuvre|peinture|electri|plomberie|menuiserie|carrelage|enduit|amenag|espaces verts/.test(n)) return 'finitions';
  if (/recept|livraison|repli/.test(n)) return 'reception';
  return null;
}

// ─── Équipe et recrutement ───

export interface Ouvrier {
  id: string; nom: string; metier: Metier; experience: number; competence: number; salaire: number;
  atout: string; defaut?: string;
  /** Faux pour un profil à risque (refus des EPI, absences, malfaçons) : à éviter. */
  fiable: boolean;
}

const PRENOMS = ['Seydou', 'Konan', 'Adama', 'Kouamé', 'Issouf', 'Brou', 'Lassina', 'Kacou', 'Drissa', 'Yapi', 'Moussa', 'Ehui', 'Siaka', 'Tanoh', 'Ibrahim', 'Assi', 'Mamadou', 'Gnagne', 'Aya', 'Akissi'];
const NOMS = ['Koné', 'Kouassi', 'Traoré', 'N’Guessan', 'Bamba', 'Kouadio', 'Ouattara', 'Yao', 'Diabaté', 'Zadi', 'Coulibaly', 'Séka', 'Fofana', 'Kipré', 'Doumbia', 'Gnahoré', 'Sangaré', 'Lago', 'Dosso', 'Ahoua'];
const ATOUTS: Record<Metier, string> = {
  'Chef d’équipe': 'A dirigé des équipes de huit ouvriers sur des villas R+1',
  'Maçon': 'Murs droits et propres, lit les plans sans aide',
  'Manœuvre': 'Robuste, ponctuel, connaît les règles de sécurité',
  'Ferrailleur': 'Façonne les armatures d’après les plans de ferraillage',
  'Coffreur': 'Coffrages soignés, peu de pertes de bois',
  'Électricien': 'Habilitation électrique à jour',
  'Plombier': 'Teste toujours ses réseaux avant de fermer',
  'Carreleur': 'Poses droites, joints réguliers',
  'Peintre': 'Finitions nettes, protège bien les sols',
};
const RISQUES = ['Refuse souvent de porter le casque', 'Absent six jours le mois dernier, sans prévenir', 'Renvoyé d’un chantier pour malfaçons', 'Travaille en hauteur sans s’attacher'];

/** Hachage déterministe (même graine, mêmes candidats) : la liste ne change pas quand on rouvre le panneau. */
const hacher = (texte: string) => { let h = 2166136261; for (const c of texte) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

/** Candidats du jour pour chaque métier demandé : un profil qualifié, un débutant moins cher, un profil à risque,
 * et pour le chef d'équipe un expert plus cher que le budget ne permet pas de cumuler avec tous les qualifiés. */
export function candidats(graine: number, metiers: readonly Metier[]): Ouvrier[] {
  const liste: Ouvrier[] = [];
  const pris = new Set<string>();
  const nom = (cle: string) => {
    let h = hacher(`${graine}-${cle}`), n = '';
    do { n = `${PRENOMS[h % PRENOMS.length]} ${NOMS[(h >>> 8) % NOMS.length]}`; h = hacher(n + h); } while (pris.has(n));
    pris.add(n); return n;
  };
  metiers.forEach((metier, i) => {
    const base = METIERS[metier].salaire, h = hacher(`${graine}-${metier}`);
    const profils: Ouvrier[] = [
      { id: `${metier}-q`, nom: nom(`${metier}-q`), metier, experience: 6 + h % 7, competence: 74 + h % 10, salaire: base, atout: ATOUTS[metier], fiable: true },
      { id: `${metier}-d`, nom: nom(`${metier}-d`), metier, experience: h % 2, competence: 44 + h % 8, salaire: Math.round(base * .7 / 500) * 500, atout: 'Motivé, sort du centre de formation', defaut: 'Peu d’expérience : à encadrer de près', fiable: true },
      { id: `${metier}-r`, nom: nom(`${metier}-r`), metier, experience: 4 + h % 5, competence: 62 + h % 8, salaire: Math.round(base * .8 / 500) * 500, atout: 'Disponible tout de suite, moins cher', defaut: RISQUES[(h + i) % RISQUES.length], fiable: false },
    ];
    if (metier === 'Chef d’équipe') profils.push({ id: `${metier}-e`, nom: nom(`${metier}-e`), metier, experience: 18, competence: 95, salaire: base + 9_000, atout: 'Vingt ans de métier, très respecté des équipes', fiable: true });
    // Ordre mélangé, mais stable : le bon profil n'est pas toujours en tête.
    liste.push(...profils.sort((a, b) => hacher(`${graine}${a.id}`) - hacher(`${graine}${b.id}`)));
  });
  return liste;
}

/** Budget journalier de main-d'œuvre : la somme des profils qualifiés, plus une petite marge. */
export const budgetRecrutement = (metiers: readonly Metier[]) => metiers.reduce((n, m) => n + METIERS[m].salaire, 0) + 3_000;

export const metiersManquants = (equipe: readonly Ouvrier[], metiers: readonly Metier[]) => metiers.filter(m => !equipe.some(o => o.metier === m));

export interface EvaluationEquipe { note: number; complete: boolean; manquants: Metier[]; risques: Ouvrier[]; depassement: number; masseSalariale: number; remarques: string[] }

/** Note de 0 à 1 : métiers couverts (40 %), profils fiables (35 %), budget tenu (15 %), compétence moyenne (10 %).
 * Seule une équipe complète, sans profil à risque et dans le budget dépasse 0,8 : chaque faute plafonne la note. */
export function evaluerEquipe(choisis: readonly Ouvrier[], metiers: readonly Metier[], budget: number): EvaluationEquipe {
  const manquants = metiersManquants(choisis, metiers);
  const risques = choisis.filter(o => !o.fiable);
  const masseSalariale = choisis.reduce((n, o) => n + o.salaire, 0);
  const depassement = Math.max(0, masseSalariale - budget);
  const competence = choisis.length ? choisis.reduce((n, o) => n + o.competence, 0) / choisis.length : 0;
  const couverture = metiers.length ? (metiers.length - manquants.length) / metiers.length : 1;
  const fiabilite = choisis.length ? 1 - risques.length / choisis.length : 0;
  let note = borne(couverture * .4 + fiabilite * .35 + (depassement === 0 ? .15 : 0) + borne((competence - 40) / 50, 0, 1) * .1, 0, 1);
  if (manquants.length) note = Math.min(note, .6);
  if (risques.length) note = Math.min(note, .8 - .1 * risques.length);
  if (depassement) note = Math.min(note, .75);
  const remarques: string[] = [];
  remarques.push(manquants.length ? `Il manque : ${manquants.join(', ')}. Sans eux, l’étape ne peut pas avancer.` : 'Équipe complète : chaque métier est couvert.');
  for (const o of risques) remarques.push(`Attention à ${o.nom} : ${o.defaut?.toLowerCase()}. Un risque pour toute l’équipe.`);
  if (depassement) remarques.push(`Budget dépassé de ${depassement.toLocaleString('fr-FR')} F par jour : la marge du chantier fond.`);
  if (choisis.some(o => o.experience <= 1)) remarques.push('Un débutant demande de l’encadrement : prévois du temps pour le former.');
  if (!risques.length && !manquants.length && !depassement) remarques.push(competence >= 75 ? 'Équipe expérimentée et fiable : le travail sera propre.' : 'Équipe fiable, dans le budget.');
  return { note, complete: !manquants.length, manquants, risques, depassement, masseSalariale, remarques };
}

/** Lecture tolérante d'un ouvrier sauvegardé dans le navigateur. */
export function lireOuvrier(brut: unknown): Ouvrier | null {
  const o = (brut && typeof brut === 'object' ? brut : {}) as Partial<Ouvrier>;
  if (typeof o.nom !== 'string' || typeof o.id !== 'string' || !o.metier || !(o.metier in METIERS)) return null;
  return {
    id: o.id, nom: o.nom, metier: o.metier, experience: borne(Number(o.experience), 0, 50), competence: borne(Number(o.competence), 0, 100),
    salaire: borne(Number(o.salaire), 0, 200_000), atout: typeof o.atout === 'string' ? o.atout : '', defaut: typeof o.defaut === 'string' ? o.defaut : undefined, fiable: o.fiable !== false,
  };
}
