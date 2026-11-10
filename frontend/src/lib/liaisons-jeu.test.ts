import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BATIMENTS } from './batiments-ville';
import { CHAPITRES, DOSSIERS, dossierDe, dossierDeParcelle } from './campagne';
import { LIEUX_PROGRAMME } from './lieux-programme';

// Les liaisons du jeu, vérifiées sur les sources (audit d'avant lancement) : chaque appel au serveur vise une route qui
// existe, chaque lien interne une page qui existe, chaque lieu cité un bâtiment du quartier ou la parcelle d'un dossier.
// Un appel ou un lien cassé ne se voit sinon qu'en jouant : une erreur 404, ou une page « introuvable ».

const FRONT = join(process.cwd(), 'src'), BACK = join(process.cwd(), '../backend/src');
const sources = (dossier: string, garder: (p: string) => boolean): string[] => readdirSync(dossier).flatMap(n => {
  const p = join(dossier, n);
  return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : sources(p, garder)) : garder(p) ? [p] : [];
});
const JEU = sources(FRONT, p => /\.(ts|tsx)$/.test(p) && !/\.test\.(ts|tsx)$/.test(p)).map(f => ({ f: relative(process.cwd(), f), texte: readFileSync(f, 'utf8') }));
const ligne = (texte: string, i: number) => texte.slice(0, i).split('\n').length;
/** Un chemin en segments ; tout segment calculé (${…}, :param, [slug]) devient « :p », qui correspond à n'importe quel segment. */
const segments = (chemin: string) => chemin.split('?')[0].split('#')[0].replace(/\$\{[^}]*\}/g, ':p').split('/').filter(Boolean)
  .map(s => (s.startsWith(':') || s.includes(':p') || /^\[.*\]$/.test(s) ? ':p' : s));
const correspond = (a: string[], b: string[]) => a.length === b.length && a.every((s, i) => s === b[i] || s === ':p' || b[i] === ':p');

/** Le texte d'une chaîne qui commence à `debut` (guillemet compris), ${…} imbriqués compris. */
function chaine(texte: string, debut: number) {
  const guillemet = texte[debut];
  let j = debut + 1, profondeur = 0;
  for (; j < texte.length; j++) {
    if (guillemet === '`' && texte[j] === '$' && texte[j + 1] === '{') { profondeur++; j++; continue; }
    if (guillemet === '`' && texte[j] === '}' && profondeur) { profondeur--; continue; }
    if (texte[j] === guillemet && !profondeur && texte[j - 1] !== '\\') break;
  }
  return texte.slice(debut + 1, j);
}

const ROUTES = sources(BACK, p => p.endsWith('.controller.ts')).flatMap(f => {
  const texte = readFileSync(f, 'utf8');
  const prefixe = texte.match(/@Controller\(\s*'([^']*)'/)?.[1] ?? '';
  return [...texte.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:'([^']*)')?\s*\)/g)].map(m => ({ methode: m[1].toUpperCase(), chemin: segments(`${prefixe}/${m[2] ?? ''}`) }));
});

/** Les appels du jeu au serveur dont le chemin est écrit dans l'appel : api.get/post/patch/delete, fetchCatalog (lecture),
 * et les fetch(`${API_URL}/…`) directs (méthode libre). Un chemin passé par une variable est vérifié à la main. */
function appelsJeu() {
  const appels: { methode: string | null; chemin: string[]; brut: string; source: string }[] = [];
  for (const { f, texte } of JEU) {
    for (const m of texte.matchAll(/\b(api\.(get|post|patch|delete)|fetchCatalog)\s*/g)) {
      let i = m.index! + m[0].length;
      // Paramètre de type éventuel, à chevrons équilibrés (les flèches => ne ferment rien).
      if (texte[i] === '<') {
        for (let profondeur = 0; i < texte.length; i++) {
          if (texte[i] === '<') profondeur++;
          else if (texte[i] === '>' && texte[i - 1] !== '=' && --profondeur === 0) { i++; break; }
        }
      }
      while (/\s/.test(texte[i])) i++;
      if (texte[i] !== '(') continue;
      i++;
      while (/\s/.test(texte[i])) i++;
      if (!['\'', '"', '`'].includes(texte[i])) continue;
      const brut = chaine(texte, i);
      appels.push({ methode: m[2] ? m[2].toUpperCase() : 'GET', chemin: segments(brut), brut, source: `${f}:${ligne(texte, m.index!)}` });
    }
    for (const m of texte.matchAll(/fetch\(\s*`\$\{API_URL\}(\/[^`]*)`/g)) appels.push({ methode: null, chemin: segments(m[1]), brut: m[1], source: `${f}:${ligne(texte, m.index!)}` });
  }
  return appels;
}

const PAGES = sources(join(FRONT, 'app'), p => /[\\/]page\.tsx$/.test(p))
  .map(p => segments(relative(join(FRONT, 'app'), p).split(sep).slice(0, -1).filter(s => !/^\(.*\)$/.test(s)).join('/')));

describe('les liaisons du jeu', () => {
  it('chaque appel du jeu au serveur vise une route qui existe (méthode et chemin)', () => {
    const appels = appelsJeu();
    expect(appels.length).toBeGreaterThan(150);
    const orphelins = appels.filter(a => !ROUTES.some(r => (a.methode === null || r.methode === a.methode) && correspond(a.chemin, r.chemin)))
      .map(a => `${a.methode ?? '?'} ${a.brut} ← ${a.source}`);
    expect(orphelins).toEqual([]);
  });

  it('chaque lien interne du jeu mène à une page qui existe', () => {
    const motifs = [
      /\bhref\s*=\s*\{?\s*(['"`])(\/[^'"`]*)\1/g,
      /\bhref\s*:\s*(['"`])(\/[^'"`]*)\1/g,
      /\b(?:router\.(?:push|replace)|redirect|permanentRedirect)\(\s*(['"`])(\/[^'"`]*)\1/g,
      /\blocation\.(?:href|assign|replace)\s*(?:=|\()\s*(['"`])(\/[^'"`]*)\1/g,
    ];
    const liens = JEU.flatMap(({ f, texte }) => motifs.flatMap(motif => [...texte.matchAll(motif)]
      .filter(m => !/^\/(api|_next)\b/.test(m[2]) && !/\.[a-z0-9]{2,5}$/i.test(m[2].split(/[?#]/)[0]))
      .map(m => ({ chemin: segments(m[2]), brut: m[2], source: `${f}:${ligne(texte, m.index!)}` }))));
    expect(liens.length).toBeGreaterThan(150);
    expect(liens.filter(l => !PAGES.some(p => correspond(l.chemin, p))).map(l => `${l.brut} ← ${l.source}`)).toEqual([]);
  });

  it('chaque lieu cité est un bâtiment du quartier ou la parcelle d’un dossier du fil rouge', () => {
    const lieux = new Set([...BATIMENTS.map(b => b.slug), ...DOSSIERS.map(d => d.parcelle.slug)]);
    const inconnus = JEU.flatMap(({ f, texte }) => [...texte.matchAll(/\blieu: '([a-z0-9-]+)'/g)].filter(m => !lieux.has(m[1])).map(m => `${m[1]} ← ${f}:${ligne(texte, m.index!)}`));
    expect(inconnus).toEqual([]);
  });

  it('chaque chapitre du fil rouge se joue dans un lieu à programme, ou sur la parcelle de son propre dossier', () => {
    CHAPITRES.forEach((chapitre, rang) => {
      if (LIEUX_PROGRAMME[chapitre.lieu]) return;
      expect(dossierDeParcelle(chapitre.lieu), `${chapitre.id} (${chapitre.lieu})`).toBe(dossierDe(rang));
    });
  });
});
