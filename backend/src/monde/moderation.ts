// La modération du chat du quartier. Les grossièretés, insultes et injures racistes ou homophobes sont masquées par des
// astérisques : le message part quand même et la conversation continue, sans le mot. Les numéros de téléphone sont
// retirés (beaucoup de joueurs sont des élèves). Les termes du métier qui ressemblent à une insulte passent : mortier
// bâtard, batardeau, salopette… Les signalements des joueurs et l'administration font le reste.

export const MOTIFS_SIGNALEMENT = ['insulte', 'harcelement', 'spam', 'donnees-perso', 'autre'] as const;
export type MotifSignalement = (typeof MOTIFS_SIGNALEMENT)[number];

/** Mots masqués tels quels (écrits sans accents, comme après normalisation). */
const MOTS = new Set([
  'con', 'cons', 'conne', 'connes', 'pute', 'putes', 'putain', 'putains', 'ptn', 'merde', 'merdes', 'merdique', 'salaud', 'salauds',
  'bite', 'bites', 'chatte', 'chattes', 'couille', 'couilles', 'couillon', 'couillons', 'nique', 'niques', 'ntm', 'fdp', 'tg', 'pd',
  'pede', 'pedes', 'gouine', 'gouines', 'batard', 'batards', 'batarde', 'batardes', 'mougou', 'chintok', 'chinetoque', 'bicot', 'bicots',
  'bamboula', 'shit', 'asshole', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'nigga', 'nigger',
]);
/** Débuts de mots masqués avec toutes leurs formes (enculé, enculer ; connard, connasse ; salope, saloperie…). */
const RACINES = ['encul', 'connard', 'connass', 'salop', 'enfoir', 'niquer', 'niquez', 'tarlouz', 'petass', 'pouffias', 'negr', 'bougnoul', 'youpin', 'fuck', 'bitch', 'motherfuck'];
/** Suites de mots masquées ensemble ; aucun de ces mots n'est grossier seul. */
const EXPRESSIONS = [['ta', 'gueule'], ['fils', 'de', 'chien'], ['sale', 'chien'], ['te', 'faire', 'foutre']];
/** Mots du métier qui commencent comme une insulte. */
const EXCEPTIONS = new Set(['salopette', 'salopettes', 'batardeau', 'batardeaux']);
/** « Bâtard » est aussi un terme de maçonnerie : mortier bâtard (chaux et ciment), enduit bâtard. */
const APRES_TERME_METIER = new Set(['mortier', 'mortiers', 'enduit', 'enduits', 'ciment', 'chaux', 'liant']);
const MOTS_METIER = new Set(['batard', 'batards', 'batarde', 'batardes']);

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '€': 'e' };
/** Un numéro de téléphone : dix chiffres ou plus, séparés ou non (07 08 09 10 11, +225 0708091011). */
const TELEPHONE = /(?:\+|00)?\d(?:[ .-]?\d){9,}/g;

/** Les formes comparées aux listes : lettres décoratives ramenées aux lettres simples (𝐜𝐨𝐧, ｃｏｎ), sans accents ni
 * majuscules, chiffres lus comme des lettres (c0nnard), et les lettres étirées ramenées à une ou deux (saloooope, connnnard). */
function formes(mot: string): string[] {
  const base = mot.normalize('NFKC').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[013457@$€]/g, (c) => LEET[c]);
  return [...new Set([base, base.replace(/(\p{L})\1{2,}/gu, '$1'), base.replace(/(\p{L})\1{2,}/gu, '$1$1')])];
}
const interdit = (forme: string) => !EXCEPTIONS.has(forme) && (MOTS.has(forme) || RACINES.some((r) => forme.startsWith(r)));

interface Jeton { debut: number; fin: number; brut: string; formes: string[] }

/** Masque les mots interdits et retire les numéros de téléphone ; `modere` dit si le message a été retouché. */
export function modererMessage(texte: string): { texte: string; modere: boolean } {
  const jetons: Jeton[] = [...texte.matchAll(/[\p{L}\p{N}@$€]+/gu)].map((m) => ({
    debut: m.index!, fin: m.index! + m[0].length, brut: m[0], formes: /^\d+$/.test(m[0]) ? [] : formes(m[0]),
  }));
  const masques: Array<[number, number]> = [];
  jetons.forEach((j, i) => {
    const metier = j.formes.some((f) => MOTS_METIER.has(f)) && jetons[i - 1]?.formes.some((f) => APRES_TERME_METIER.has(f));
    if (!metier && j.formes.some(interdit)) masques.push([j.debut, j.fin]);
  });
  for (const expression of EXPRESSIONS) {
    for (let i = 0; i + expression.length <= jetons.length; i++) {
      if (expression.every((mot, k) => jetons[i + k].formes.includes(mot))) masques.push([jetons[i].debut, jetons[i + expression.length - 1].fin]);
    }
  }
  // Les lettres espacées pour passer entre les mailles : « c o n n a r d », « p.u.t.e ».
  for (let i = 0; i < jetons.length;) {
    let k = i + 1;
    if (jetons[i].brut.length === 1) while (k < jetons.length && jetons[k].brut.length === 1 && jetons[k].debut - jetons[k - 1].fin <= 2) k++;
    if (k - i >= 3 && formes(jetons.slice(i, k).map((j) => j.brut).join('')).some(interdit)) masques.push([jetons[i].debut, jetons[k - 1].fin]);
    i = k;
  }
  // Les index comptent en unités UTF-16 : on parcourt les caractères en suivant leur position, pour qu'une lettre hors du
  // plan de base (𝐜𝐨𝐧) devienne une seule étoile. Les séparateurs des lettres espacées restent.
  let masque = '', position = 0;
  for (const c of texte) {
    masque += masques.some(([debut, fin]) => position >= debut && position < fin) && /[\p{L}\p{N}@$€]/u.test(c) ? '*' : c;
    position += c.length;
  }
  const sansNumero = masque.replace(TELEPHONE, '[numéro masqué]');
  return { texte: sansNumero, modere: masques.length > 0 || sansNumero !== masque };
}
