#!/usr/bin/env node
// Captures du monde 3D depuis des points de vue fixes, pour comparer le rendu avant et après un changement (même endroit,
// même heure, même ciel). Chrome (ou Edge) tourne sans fenêtre et se pilote par son protocole de débogage : aucun
// paquet à installer. La démonstration doit tourner (npm run dev, ou npm run build puis npm run start pour des temps de
// chargement proches de la version publiée) ; les images vont dans captures-monde/<horodatage>/. Ne rien modifier dans
// src pendant les captures : le rechargement à chaud rouvrirait le quartier au milieu d'une vue.
// Pour chaque vue, mesures.json relève le temps jusqu'au quartier affiché (HUD et ville dessinée), les appels de dessin
// et les triangles par image (ce qui coûte au téléphone, quel que soit l'appareil), les images par seconde et le moteur
// de rendu utilisé (un rendu logiciel sans carte graphique donne des images par seconde sans valeur pour un téléphone :
// seuls les appels et triangles comptent). Une vue dont le quartier ne s'affiche pas est notée « pret: false », sans
// image, et le script finit en erreur. La qualité graphique est fixée (élevée par défaut) : en automatique, le jeu
// retire résolution et effets quand l'image ralentit, et les appels par image changeraient d'une série à l'autre.
// Pour approcher un téléphone : --largeur 390 --hauteur 844 --qualite auto.
//
//   node scripts/captures-monde.mjs [--url http://localhost:3000] [--largeur 1440] [--hauteur 900] [--attente 9000]
//                                   [--delai 240000] [--qualite elevee|auto|fluide] [--vues place-jour,place-nuit] [--vues depart]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Les points de vue : où se tient le joueur (la caméra le suit), à quelle heure et sous quel ciel. */
export const VUES = [
  { nom: 'place-jour', vue: [0, 6], heure: 10, meteo: 'soleil' },
  { nom: 'residence-maquis', vue: [-22, 38], heure: 16.5, meteo: 'soleil' },
  { nom: 'chantier', vue: [31, 34], heure: 9, meteo: 'nuageux' },
  { nom: 'carrefour-ouest', vue: [-60, -3], heure: 11, meteo: 'soleil' },
  { nom: 'place-pluie', vue: [0, 6], heure: 10, meteo: 'averse' },
  { nom: 'place-nuit', vue: [0, 6], heure: 21, meteo: 'soleil' },
];
/** Sur demande seulement (--vues depart) : l'arrivée sans réglage, telle que toute version du jeu l'ouvre (9 h, météo du
 * moment). Elle sert à mesurer une version plus ancienne, publiée avant les points de vue fixes, contre la version du jour. */
const DEPART = { nom: 'depart' };

const options = Object.fromEntries(process.argv.slice(2).reduce((paires, arg, i, args) => arg.startsWith('--') ? [...paires, [arg.slice(2), args[i + 1]]] : paires, []));
const base = options.url ?? 'http://localhost:3000';
const largeur = Number(options.largeur ?? 1440), hauteur = Number(options.hauteur ?? 900), attente = Number(options.attente ?? 9000);
// La première vue attend aussi la compilation de la page par le serveur de développement : plusieurs minutes au besoin.
const delai = Number(options.delai ?? 240000);
const qualite = options.qualite ?? 'elevee';
if (!['elevee', 'auto', 'fluide'].includes(qualite)) { console.error('--qualite : elevee, auto ou fluide.'); process.exit(1); }
const choisies = options.vues ? [...VUES, DEPART].filter(v => options.vues.split(',').includes(v.nom)) : VUES;

const NAVIGATEURS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const navigateur = options.navigateur ?? NAVIGATEURS.find(existsSync);
if (!navigateur) { console.error('Aucun Chrome ni Edge trouvé : précise --navigateur <chemin>.'); process.exit(1); }

const pause = ms => new Promise(r => setTimeout(r, ms));

/** Compte, page par page, les appels de dessin WebGL de chaque image, les triangles envoyés et les images affichées ; et,
 * pour le chargement, les programmes de shaders liés, le temps passé à attendre leur compilation (la première question
 * posée à un programme ou à un shader bloque jusqu'à la fin de sa compilation) et le temps d'envoi des textures. */
const COMPTEUR_WEBGL = `(() => {
  const c = { appels: 0, triangles: 0, images: [], moteur: null, programmes: 0, msCompilation: 0, msTextures: 0 };
  const chronometrer = (proto, nom, cle) => {
    const origine = proto[nom]; if (!origine) return;
    proto[nom] = function (...a) { const t0 = performance.now(); try { return origine.apply(this, a); } finally { c[cle] += performance.now() - t0; } };
  };
  const triangles = (mode, n) => mode === 4 ? n / 3 : mode === 5 || mode === 6 ? Math.max(0, n - 2) : 0;
  for (const proto of [window.WebGLRenderingContext && WebGLRenderingContext.prototype, window.WebGL2RenderingContext && WebGL2RenderingContext.prototype].filter(Boolean)) {
    for (const nom of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const origine = proto[nom]; if (!origine) continue;
      proto[nom] = function (...a) {
        const t = triangles(a[0], nom.startsWith('drawArrays') ? a[2] : a[1]) * (nom.endsWith('Instanced') ? (nom.startsWith('drawArrays') ? a[3] : a[4]) : 1);
        // Un appel aux arguments incomplets ne doit pas rendre tout le relevé illisible (NaN).
        c.appels++; if (Number.isFinite(t)) c.triangles += t;
        if (!c.moteur) { try { const ext = this.getExtension('WEBGL_debug_renderer_info'); c.moteur = ext ? this.getParameter(ext.UNMASKED_RENDERER_WEBGL) : this.getParameter(this.RENDERER); } catch (e) { c.moteur = 'inconnu'; } }
        return origine.apply(this, a);
      };
    }
    const lier = proto.linkProgram;
    proto.linkProgram = function (...a) { c.programmes++; return lier.apply(this, a); };
    for (const nom of ['getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'getShaderInfoLog', 'getActiveUniform', 'getActiveAttrib', 'getUniformLocation', 'getAttribLocation']) chronometrer(proto, nom, 'msCompilation');
    for (const nom of ['texImage2D', 'texSubImage2D', 'texStorage2D', 'compressedTexImage2D', 'generateMipmap']) chronometrer(proto, nom, 'msTextures');
  }
  const boucle = t => { if (c.appels) c.images.push({ t, appels: c.appels, triangles: c.triangles }); c.appels = 0; c.triangles = 0; requestAnimationFrame(boucle); };
  requestAnimationFrame(boucle);
  const mediane = l => { const s = [...l].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  c.releve = () => {
    const recentes = c.images.slice(-60), duree = recentes.length > 1 ? (recentes.at(-1).t - recentes[0].t) / 1000 : 0;
    return { moteur: c.moteur, appelsParImage: mediane(recentes.map(i => i.appels)), trianglesParImage: Math.round(mediane(recentes.map(i => i.triangles))), imagesParSeconde: duree ? Math.round((recentes.length - 1) / duree * 10) / 10 : 0,
      programmesShaders: c.programmes, secondesCompilation: Math.round(c.msCompilation / 100) / 10, secondesTextures: Math.round(c.msTextures / 100) / 10 };
  };
  window.__mesuresBtp = c;
})();`;
/** Le quartier est affiché quand le HUD est là et que la ville s'est dessinée : l'écran d'ouverture et la création du
 * personnage tiennent en quelques appels par image, le quartier en compte des centaines. Une page rouverte repart d'un
 * compteur vide : elle attend sa propre première image. */
const QUARTIER_AFFICHE = `(() => {
  const m = window.__mesuresBtp;
  return Boolean(document.querySelector('button[aria-label="Options"]')) && Boolean(m && m.images.some(i => i.appels >= 100));
})()`;
const profil = mkdtempSync(join(tmpdir(), 'btp-captures-'));
const port = 9300 + Math.floor(Math.random() * 500);
const processus = spawn(navigateur, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, `--window-size=${largeur},${hauteur}`,
  '--no-first-run', '--no-default-browser-check', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });

async function connecter() {
  for (let essai = 0; essai < 50; essai++) {
    try { const cibles = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const page = cibles.find(c => c.type === 'page'); if (page) return page.webSocketDebuggerUrl; } catch { /* Le navigateur démarre encore. */ }
    await pause(200);
  }
  throw new Error('Le navigateur ne répond pas au protocole de débogage.');
}

let suivant = 0;
const enAttente = new Map();
function envoyer(ws, method, params = {}) {
  const id = ++suivant;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resoudre, rejeter) => enAttente.set(id, { resoudre, rejeter }));
}

try {
  const ws = new WebSocket(await connecter());
  await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (!m.id || !enAttente.has(m.id)) return;
    const { resoudre, rejeter } = enAttente.get(m.id); enAttente.delete(m.id);
    if (m.error) rejeter(new Error(m.error.message)); else resoudre(m.result);
  };
  await envoyer(ws, 'Page.enable');
  await envoyer(ws, 'Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: 1, mobile: largeur < 768 });
  // Un personnage déjà choisi : la démonstration s'ouvre directement sur le quartier.
  await envoyer(ws, 'Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('btp-life-personnage-demo', JSON.stringify({ personnage: 'combinaison', nom: 'Capture' })); localStorage.setItem('btp-life-qualite', ${JSON.stringify(qualite)}); } catch {}` });
  await envoyer(ws, 'Page.addScriptToEvaluateOnNewDocument', { source: COMPTEUR_WEBGL });
  const affiche = async () => (await envoyer(ws, 'Runtime.evaluate', { expression: QUARTIER_AFFICHE, returnByValue: true })).result.value === true;
  const attendreQuartier = async limite => { while (Date.now() < limite) { if (await affiche()) return true; await pause(500); } return false; };
  const mesures = [];
  const dossier = join(process.cwd(), 'captures-monde', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
  mkdirSync(dossier, { recursive: true });
  for (const v of choisies) {
    const url = v.vue ? `${base}/simulation-preview?vue=${v.vue.join(',')}&heure=${v.heure}&meteo=${v.meteo}` : `${base}/simulation-preview`;
    const depart = Date.now(), limite = depart + delai;
    await envoyer(ws, 'Page.navigate', { url });
    let pret = await attendreQuartier(limite);
    const secondes = Math.round((Date.now() - depart) / 100) / 10;
    // On laisse ensuite les textures, les personnages et la pluie s'installer ; si la page s'est rouverte entre-temps
    // (rechargement à chaud), on attend de nouveau le quartier avant de capturer.
    let stable = false;
    for (let essai = 0; pret && !stable && essai < 3; essai++) {
      await pause(attente);
      stable = await affiche();
      if (!stable) pret = await attendreQuartier(limite);
    }
    if (!pret || !stable) {
      mesures.push({ vue: v.nom, url, pret: false });
      console.log(`✗ ${v.nom} : quartier non affiché après ${Math.round(delai / 1000)} s (${url})`);
      process.exitCode = 1;
      continue;
    }
    const { data } = await envoyer(ws, 'Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(dossier, `${v.nom}.png`), Buffer.from(data, 'base64'));
    const { result: releve } = await envoyer(ws, 'Runtime.evaluate', { expression: 'window.__mesuresBtp ? window.__mesuresBtp.releve() : null', returnByValue: true });
    mesures.push({ vue: v.nom, url, pret: true, secondesJusquAuQuartier: secondes, ...(releve.value ?? {}) });
    console.log(`✓ ${v.nom} (${url})`);
  }
  writeFileSync(join(dossier, 'mesures.json'), JSON.stringify({ largeur, hauteur, qualite, mesures }, null, 2));
  console.log(`Captures et mesures dans ${dossier}`);
  ws.close();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  processus.kill();
  await pause(500);
  try { rmSync(profil, { recursive: true, force: true }); } catch { /* Le profil temporaire partira avec le dossier temporaire. */ }
}
