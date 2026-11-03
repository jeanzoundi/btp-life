// Variantes web du quartier 3D, légères à télécharger sur données mobiles : textures PBR et devantures en WebP (taille
// normale et taille téléphone), ciel HDR en carte de gain (image JPEG, carte de gain JPEG et métadonnées, recomposées par
// src/lib/ciel-carte-de-gain.ts), personnages GLB aux textures de 512 px au plus pour les téléphones. Les fichiers d'origine restent les sources :
// public/materials (JPG 1K, PNG 2K, HDR 1K) et public/personnages (GLB).
//
//   node scripts/ressources-3d/alleger-ressources.cjs [textures] [devantures] [ciel] [personnages]   (sans argument : tout)
//
// sharp vient des dépendances de Next (node_modules du frontend) ; à défaut, de ../outils-3d (voir README.md).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC = path.join(__dirname, '..', '..', 'public');
const MATERIAUX = path.join(PUBLIC, 'materials');
const PERSONNAGES = path.join(PUBLIC, 'personnages');
const taille = fichier => fs.statSync(fichier).size;
const ko = octets => `${Math.round(octets / 1024)} Ko`;

/** Les sept matières du monde (MatiereMonde dans materiaux-monde.tsx). */
const MATIERES = ['concrete_floor', 'wood_floor', 'asphalt_02', 'painted_plaster_wall', 'brick_pavement_02', 'clay_roof_tiles_02', 'corrugated_iron'];
/** Qualité WebP par carte. Couleur et relief gardent leur grain (normales à 1,5-2° en moyenne des JPG, l'asphalte très
 * granuleux à 6°, adouci par son relief de 0,35) ; la rugosité, presque unie, se compresse sans rien perdre de visible. */
const QUALITE_CARTE = { color: 90, normal: 90, rough: 85 };

async function textures() {
  let avant = 0, normale = 0, telephone = 0;
  for (const matiere of MATIERES) for (const [carte, quality] of Object.entries(QUALITE_CARTE)) {
    const source = path.join(MATERIAUX, `${matiere}-${carte}.jpg`);
    const cible = path.join(MATERIAUX, `${matiere}-${carte}.webp`), petite = path.join(MATERIAUX, `${matiere}-${carte}-512.webp`);
    await sharp(source).removeAlpha().webp({ quality, effort: 6 }).toFile(cible);
    // Sur téléphone, le niveau de mip suivant : l'écran ne montrerait pas le détail du 1024.
    await sharp(source).removeAlpha().resize(512, 512, { kernel: 'lanczos3' }).webp({ quality, effort: 6 }).toFile(petite);
    avant += taille(source); normale += taille(cible); telephone += taille(petite);
  }
  console.log(`Textures : ${ko(avant)} en JPG → ${ko(normale)} en WebP 1024, ${ko(telephone)} en WebP 512`);
}

/** Une seule taille : l'atlas fait 1254 px, une moitié adoucirait les vitrines vues depuis la rue pour 200 Ko gagnés. */
async function devantures() {
  const source = path.join(MATERIAUX, 'facades-abidjan-v1.png');
  const { width, height } = await sharp(source).metadata();
  const cible = path.join(MATERIAUX, 'facades-abidjan-v1.webp');
  await sharp(source).removeAlpha().webp({ quality: 90, effort: 6 }).toFile(cible);
  console.log(`Devantures : ${ko(taille(source))} en PNG ${width}×${height} → ${ko(taille(cible))} en WebP`);
}

/** Radiance RGBE (.hdr) en flottants linéaires, à l'échelle du chargeur de drei (three-stdlib : mantisse × 2^(e-128) / 255,
 * plafonnée au demi-flottant). */
function lireHdr(fichier) {
  const b = fs.readFileSync(fichier);
  let pos = 0;
  const ligne = () => { const debut = pos; while (b[pos] !== 0x0a) pos++; return b.toString('latin1', debut, pos++); };
  while (ligne() !== '');
  const dimensions = /-Y (\d+) \+X (\d+)/.exec(ligne());
  if (!dimensions) throw new Error('Orientation du HDR non prise en charge');
  const hauteur = +dimensions[1], largeur = +dimensions[2];
  const rgb = new Float32Array(largeur * hauteur * 3), scan = new Uint8Array(largeur * 4);
  for (let y = 0; y < hauteur; y++) {
    if (b[pos] === 2 && b[pos + 1] === 2) {
      pos += 4;
      for (let c = 0; c < 4; c++) for (let x = 0; x < largeur;) {
        let n = b[pos++];
        if (n > 128) { const valeur = b[pos++]; for (let i = 128; i < n; i++) scan[(x++) * 4 + c] = valeur; }
        else for (let i = 0; i < n; i++) scan[(x++) * 4 + c] = b[pos++];
      }
    } else { scan.set(b.subarray(pos, pos + largeur * 4)); pos += largeur * 4; }
    for (let x = 0; x < largeur; x++) {
      const e = scan[x * 4 + 3], f = e ? Math.pow(2, e - 128) / 255 : 0;
      for (let c = 0; c < 3; c++) rgb[(y * largeur + x) * 3 + c] = Math.min(scan[x * 4 + c] * f, 65504);
    }
  }
  return { largeur, hauteur, rgb };
}

const srgbVersLineaire = Float64Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); });
const lineaireVersSrgb = l => Math.round(Math.max(0, Math.min(1, l <= .0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - .055)) * 255);
/** Décalage par défaut du format (1/64) ; gamma < 1 : plus de précision pour le ciel, aux gains faibles, que pour le soleil. */
const DECALAGE = 1 / 64, GAMMA = .7;

/** Éclairement (luminance pondérée par le cosinus) reçu par une surface tournée vers chacune des six directions. */
function eclairements(rgb, largeur, hauteur) {
  const directions = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  return directions.map(d => {
    let e = 0;
    for (let y = 0; y < hauteur; y++) {
      const theta = (y + .5) / hauteur * Math.PI, s = Math.sin(theta), cy = Math.cos(theta);
      for (let x = 0; x < largeur; x++) {
        const phi = (x + .5) / largeur * 2 * Math.PI, cos = s * Math.cos(phi) * d[0] + cy * d[1] + s * Math.sin(phi) * d[2];
        if (cos > 0) { const i = (y * largeur + x) * 3; e += (.2126 * rgb[i] + .7152 * rgb[i + 1] + .0722 * rgb[i + 2]) * cos * s; }
      }
    }
    return e;
  });
}

/** Ciel en carte de gain (format de @monogrid/gainmap-js, recomposé par src/lib/ciel-carte-de-gain.ts) : une image
 * ordinaire, le ciel plafonné à 1, et une carte du gain (log2) qui rend au soleil et aux nuages leur intensité. Le gain est calculé contre
 * l'image telle que le navigateur la décodera, compression comprise, et la carte est enregistrée en JPEG de qualité
 * maximale : en qualité moindre, le pic du soleil s'émousse et l'éclairement baisse de plusieurs pour cent. */
async function ciel() {
  const source = path.join(MATERIAUX, 'ciel-kloofendal-1k.hdr');
  const { largeur, hauteur, rgb } = lireHdr(source);
  const n = largeur * hauteur, brut = { raw: { width: largeur, height: hauteur, channels: 3 } };
  const jpeg = quality => ({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' });
  const sdr = Buffer.alloc(n * 3);
  for (let i = 0; i < n * 3; i++) sdr[i] = lineaireVersSrgb(Math.min(rgb[i], 1));
  const fichierSdr = await sharp(sdr, brut).jpeg(jpeg(92)).toBuffer();
  const sdrDecodee = await sharp(fichierSdr).raw().toBuffer();
  const gain = new Float64Array(n * 3), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n * 3; i++) {
    const c = i % 3, g = Math.log2((rgb[i] + DECALAGE) / (srgbVersLineaire[sdrDecodee[i]] + DECALAGE));
    gain[i] = g; min[c] = Math.min(min[c], g); max[c] = Math.max(max[c], g);
  }
  const carte = Buffer.alloc(n * 3);
  for (let i = 0; i < n * 3; i++) { const c = i % 3; carte[i] = Math.round(Math.pow((gain[i] - min[c]) / (max[c] - min[c]), GAMMA) * 255); }
  const fichierGain = await sharp(carte, brut).jpeg(jpeg(100)).toBuffer();
  const metadonnees = { gainMapMin: min, gainMapMax: max, gamma: [GAMMA, GAMMA, GAMMA], offsetSdr: [DECALAGE, DECALAGE, DECALAGE], offsetHdr: [DECALAGE, DECALAGE, DECALAGE], hdrCapacityMin: 0, hdrCapacityMax: Math.max(...max) };
  fs.writeFileSync(path.join(MATERIAUX, 'ciel-kloofendal-1k.jpg'), fichierSdr);
  fs.writeFileSync(path.join(MATERIAUX, 'ciel-kloofendal-1k-gain.jpg'), fichierGain);
  fs.writeFileSync(path.join(MATERIAUX, 'ciel-kloofendal-1k.json'), JSON.stringify(metadonnees));
  // Contrôle : le ciel recomposé comme dans le jeu (ciel-carte-de-gain.ts) doit éclairer comme l'original.
  const sdrRelue = await sharp(fichierSdr).raw().toBuffer(), gainRelu = await sharp(fichierGain).raw().toBuffer();
  const recompose = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    const c = i % 3, t = Math.pow(gainRelu[i] / 255, 1 / GAMMA);
    recompose[i] = Math.min(65504, Math.max(0, (srgbVersLineaire[sdrRelue[i]] + DECALAGE) * Math.pow(2, min[c] * (1 - t) + max[c] * t) - DECALAGE));
  }
  const reference = eclairements(rgb, largeur, hauteur), obtenus = eclairements(recompose, largeur, hauteur);
  const ecart = Math.max(...obtenus.map((e, i) => Math.abs(e / reference[i] - 1))) * 100;
  console.log(`Ciel : ${ko(taille(source))} en HDR → ${ko(fichierSdr.length + fichierGain.length)} en carte de gain (écart d'éclairement ${ecart.toFixed(2)} % au plus)`);
  if (ecart > 1) throw new Error('Carte de gain trop éloignée du HDR d’origine');
}

/** GLB → JSON et tampon binaire. */
function lireGlb(b) {
  if (b.readUInt32LE(0) !== 0x46546c67 || b.readUInt32LE(4) !== 2) throw new Error('GLB invalide');
  const longueurJson = b.readUInt32LE(12), debutBin = 20 + longueurJson;
  return { json: JSON.parse(b.toString('utf8', 20, debutBin)), bin: b.subarray(debutBin + 8, debutBin + 8 + b.readUInt32LE(debutBin)) };
}

function ecrireGlb(json, bin) {
  const texte = Buffer.from(JSON.stringify(json));
  const jsonComplet = Buffer.concat([texte, Buffer.alloc((4 - texte.length % 4) % 4, 0x20)]);
  const binComplet = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const entete = Buffer.alloc(12), enteteJson = Buffer.alloc(8), enteteBin = Buffer.alloc(8);
  entete.writeUInt32LE(0x46546c67, 0); entete.writeUInt32LE(2, 4); entete.writeUInt32LE(12 + 8 + jsonComplet.length + 8 + binComplet.length, 8);
  enteteJson.writeUInt32LE(jsonComplet.length, 0); enteteJson.writeUInt32LE(0x4e4f534a, 4);
  enteteBin.writeUInt32LE(binComplet.length, 0); enteteBin.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([entete, enteteJson, jsonComplet, enteteBin, binComplet]);
}

/** Copie d'un personnage aux textures de 512 px au plus (corps et tête passent de 1024 à 512). Le reste du fichier,
 * maillage compressé meshopt et squelette compris, est recopié octet pour octet ; seules les vues sont replacées. */
async function personnageLeger(nom) {
  const source = path.join(PERSONNAGES, `${nom}.glb`);
  const { json, bin } = lireGlb(fs.readFileSync(source));
  const vue = i => { const v = json.bufferViews[i]; return bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength); };
  const remplacees = new Map();
  for (const image of json.images ?? []) {
    const donnees = vue(image.bufferView), { width, height } = await sharp(donnees).metadata();
    if (Math.max(width, height) <= 512) continue;
    const f = 512 / Math.max(width, height);
    // Mêmes qualités que convertir-rocketbox.js : 82 pour la couleur, 88 pour le relief.
    remplacees.set(image.bufferView, await sharp(donnees).resize(Math.round(width * f), Math.round(height * f), { kernel: 'lanczos3' })
      .webp({ quality: /-relief$/.test(image.name) ? 88 : 82, alphaQuality: 90, effort: 5 }).toBuffer());
  }
  const morceaux = [];
  let longueur = 0;
  const placer = donnees => {
    const decalage = Math.ceil(longueur / 4) * 4;
    morceaux.push(Buffer.alloc(decalage - longueur), donnees);
    longueur = decalage + donnees.length;
    return decalage;
  };
  for (const [i, v] of json.bufferViews.entries()) {
    const meshopt = v.extensions?.EXT_meshopt_compression;
    // Une vue meshopt décrit le tampon de secours (sans données) ; ses octets compressés sont dans le tampon binaire.
    if (meshopt) {
      if (meshopt.buffer !== 0) throw new Error(`${nom} : vue meshopt hors du tampon binaire`);
      meshopt.byteOffset = placer(bin.subarray(meshopt.byteOffset ?? 0, (meshopt.byteOffset ?? 0) + meshopt.byteLength));
    } else {
      if (v.buffer !== 0) throw new Error(`${nom} : vue hors du tampon binaire`);
      const donnees = remplacees.get(i) ?? vue(i);
      v.byteOffset = placer(donnees); v.byteLength = donnees.length;
    }
  }
  json.buffers[0].byteLength = longueur;
  const cible = path.join(PERSONNAGES, `${nom}-512.glb`);
  fs.writeFileSync(cible, ecrireGlb(json, Buffer.concat(morceaux)));
  return [taille(source), taille(cible)];
}

async function personnages() {
  // Ceux du jeu (MODELES_REALISTES) ; la variante de revue ouvrier-studio et les animations, sans texture, n'en ont pas besoin.
  const noms = ['ouvrier-casque', 'chef-chantier', 'cadre-femme', 'femme-ville', 'homme-jean', 'homme-capuche', 'cadre-homme'];
  let avant = 0, apres = 0;
  for (const nom of noms) { const [a, b] = await personnageLeger(nom); avant += a; apres += b; }
  console.log(`Personnages : ${ko(avant)} → ${ko(apres)} avec des textures de 512 px au plus`);
}

const ETAPES = { textures, devantures, ciel, personnages };
(async () => {
  const demandees = process.argv.slice(2);
  for (const nom of demandees.length ? demandees : Object.keys(ETAPES)) {
    if (!ETAPES[nom]) throw new Error(`Étape inconnue : ${nom} (${Object.keys(ETAPES).join(', ')})`);
    await ETAPES[nom]();
  }
})().catch(e => { console.error(e); process.exit(1); });
