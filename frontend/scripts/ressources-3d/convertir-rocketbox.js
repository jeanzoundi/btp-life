// Convertit les personnages Microsoft Rocketbox (MIT) en GLB légers pour le web :
// FBX -> glTF (FBX2glTF), textures TGA 2048 -> WebP 1024/512, matériaux réglés, compression meshopt.
// Les animations sont regroupées par genre ; la marche est ramenée sur place.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS, EXTTextureWebP } = require('@gltf-transform/extensions');
const { dedup, prune, weld, quantize, meshopt, resample, mergeDocuments, unpartition } = require('@gltf-transform/functions');
const { MeshoptEncoder, MeshoptDecoder } = require('meshoptimizer');

// Utilisation (voir README.md du même dossier) :
//   ROCKETBOX_ASSETS=<clone de github.com/microsoft/Microsoft-Rocketbox>/Assets NODE_PATH=<outils>/node_modules node convertir-rocketbox.js [--animations]
const BRUT = process.env.ROCKETBOX_ASSETS;
if (!BRUT || !fs.existsSync(path.join(BRUT, 'Avatars'))) { console.error('ROCKETBOX_ASSETS doit pointer vers le dossier Assets du dépôt Microsoft-Rocketbox.'); process.exit(1); }
const TMP = path.join(require('os').tmpdir(), 'btp-rocketbox');
const SORTIE = path.join(__dirname, '..', '..', 'public', 'personnages');
const FBX2GLTF = path.join(path.dirname(require.resolve('fbx2gltf/package.json')), 'bin', process.platform === 'win32' ? 'Windows_NT' : process.platform === 'darwin' ? 'Darwin' : 'Linux', process.platform === 'win32' ? 'FBX2glTF.exe' : 'FBX2glTF');

const PERSONNAGES = [
  { id: 'ouvrier-casque', source: 'Professions/Construction_Male_03' },
  { id: 'chef-chantier', source: 'Professions/Construction_Male_08' },
  { id: 'cadre-femme', source: 'Professions/Business_Female_01' },
  { id: 'femme-ville', source: 'Adults/Female_Party_02' },
  { id: 'homme-jean', source: 'Adults/Male_Adult_12' },
  { id: 'homme-capuche', source: 'Adults/Male_Adult_18' },
  { id: 'cadre-homme', source: 'Professions/Business_Male_05' },
];
const ANIMATIONS = {
  h: { course: 'xy/m_run_neutral_01', marche: 'xy/m_walk_neutral_01', repos: 'static/m_idle_neutral_01', assis: 'static/m_sit_chair_idle_neutral_01', parle: 'static/m_gestic_talk_neutral_01', salue: 'static/m_wave_01' },
  f: { course: 'xy/f_run_neutral_01', marche: 'xy/f_walk_neutral_01', repos: 'static/f_idle_neutral_01', assis: 'static/f_sit_chair_idle_neutral_01', parle: 'static/f_gestic_talk_neutral_01' },
};

/** Décodeur TGA minimal (types 2 et 10, 24/32 bits) : rend des pixels RGB(A) ligne du haut en premier. */
function lireTGA(fichier) {
  const b = fs.readFileSync(fichier);
  const idLen = b[0], type = b[2], largeur = b.readUInt16LE(12), hauteur = b.readUInt16LE(14), bits = b[16], desc = b[17];
  if (![2, 10].includes(type) || ![24, 32].includes(bits)) throw new Error(`TGA non pris en charge (${type}, ${bits} bits) : ${fichier}`);
  const canaux = bits / 8, pixels = Buffer.alloc(largeur * hauteur * canaux);
  let src = 18 + idLen, dst = 0;
  const copier = (o) => { pixels[dst] = b[o + 2]; pixels[dst + 1] = b[o + 1]; pixels[dst + 2] = b[o]; if (canaux === 4) pixels[dst + 3] = b[o + 3]; dst += canaux; };
  if (type === 2) { while (dst < pixels.length) { copier(src); src += canaux; } }
  else while (dst < pixels.length) {
    const entete = b[src++], n = (entete & 0x7f) + 1;
    if (entete & 0x80) { for (let i = 0; i < n; i++) copier(src); src += canaux; }
    else for (let i = 0; i < n; i++) { copier(src); src += canaux; }
  }
  // Bit 5 du descripteur à 0 : l'image est stockée de bas en haut.
  if (!(desc & 0x20)) {
    const ligne = largeur * canaux, tmp = Buffer.alloc(ligne);
    for (let y = 0; y < hauteur >> 1; y++) {
      const a = y * ligne, z = (hauteur - 1 - y) * ligne;
      pixels.copy(tmp, 0, a, a + ligne); pixels.copy(pixels, a, z, z + ligne); tmp.copy(pixels, z);
    }
  }
  return { pixels, largeur, hauteur, canaux };
}

async function texteWebP(fichier, taille, qualite) {
  const t = lireTGA(fichier);
  const image = await sharp(t.pixels, { raw: { width: t.largeur, height: t.hauteur, channels: t.canaux } })
    .resize(taille, taille).webp({ quality: qualite, alphaQuality: 90, effort: 5 }).toBuffer();
  return { image, alpha: t.canaux === 4 };
}

function fbxVersGltf(fbx, nom) {
  fs.mkdirSync(TMP, { recursive: true });
  execFileSync(FBX2GLTF, ['-i', fbx, '-o', path.join(TMP, nom)], { stdio: 'pipe' });
  return path.join(TMP, `${nom}_out`, `${nom}.gltf`);
}

async function entreeSortie() {
  await MeshoptEncoder.ready; await MeshoptDecoder.ready;
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
}

async function convertirPersonnage(io, { id, source }) {
  const dossier = path.join(BRUT, 'Avatars', source);
  const nomSource = path.basename(source);
  const doc = await io.read(fbxVersGltf(path.join(dossier, 'Export', `${nomSource}.fbx`), id));
  const racine = doc.getRoot();
  racine.listTextures().forEach(t => t.dispose());
  racine.listAnimations().forEach(a => a.dispose());
  doc.createExtension(EXTTextureWebP).setRequired(true);
  for (const mat of racine.listMaterials()) {
    const nom = mat.getName(), partie = nom.split('_').slice(1).join('_');
    const taille = partie === 'body' || partie === 'head' ? 1024 : 512;
    const couleur = path.join(dossier, 'Textures', `${nom}_color.tga`), relief = path.join(dossier, 'Textures', `${nom}_normal.tga`);
    if (fs.existsSync(couleur)) {
      const { image, alpha } = await texteWebP(couleur, taille, 82);
      mat.setBaseColorTexture(doc.createTexture(`${id}-${partie}-couleur`).setImage(image).setMimeType('image/webp'));
      if (alpha) mat.setAlphaMode('MASK').setAlphaCutoff(.45).setDoubleSided(true);
    }
    if (fs.existsSync(relief)) {
      const { image } = await texteWebP(relief, taille, 88);
      mat.setNormalTexture(doc.createTexture(`${id}-${partie}-relief`).setImage(image).setMimeType('image/webp'));
    }
    mat.setMetallicFactor(0).setRoughnessFactor(partie === 'helmet' ? .42 : partie === 'head' ? .6 : .82).setBaseColorFactor([1, 1, 1, 1]);
  }
  await doc.transform(dedup(), prune(), weld(), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const fichier = path.join(SORTIE, `${id}.glb`);
  await io.write(fichier, doc);
  const triangles = racine.listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((b, p) => b + (p.getIndices()?.getCount() ?? 0) / 3, 0), 0);
  return { id, source: nomSource, ko: Math.round(fs.statSync(fichier).size / 1024), triangles, materiaux: racine.listMaterials().map(m => m.getName()).join(' ') };
}

/** Supprime le déplacement de la racine sur les axes où le clip avance (la marche reste sur place, le balancement vertical est gardé). */
function surPlace(doc) {
  for (const anim of doc.getRoot().listAnimations()) for (const canal of anim.listChannels()) {
    if (canal.getTargetPath() !== 'translation' || canal.getTargetNode()?.getName() !== 'Bip01') continue;
    const sortie = canal.getSampler().getOutput(), valeurs = sortie.getArray();
    const n = valeurs.length / 3;
    for (let c = 0; c < 3; c++) {
      const derive = valeurs[(n - 1) * 3 + c] - valeurs[c];
      if (Math.abs(derive) > .05) for (let i = 0; i < n; i++) valeurs[i * 3 + c] = valeurs[c];
    }
    sortie.setArray(valeurs);
  }
}

async function convertirAnimations(io, genre, clips) {
  let cible = null;
  for (const [nomClip, chemin] of Object.entries(clips)) {
    const [dossier, nom] = chemin.split('/');
    const doc = await io.read(fbxVersGltf(path.join(BRUT, 'Animations', `all_animations_max_motextr_${dossier}`, `${nom}.max.fbx`), `anim-${genre}-${nomClip}`));
    const racine = doc.getRoot();
    racine.listNodes().forEach(n => n.setMesh(null).setSkin(null));
    racine.listMeshes().forEach(m => m.dispose()); racine.listSkins().forEach(s => s.dispose());
    racine.listMaterials().forEach(m => m.dispose()); racine.listTextures().forEach(t => t.dispose());
    const anims = racine.listAnimations();
    anims.slice(1).forEach(a => a.dispose());
    anims[0].setName(nomClip);
    if (nomClip === 'marche' || nomClip === 'course') surPlace(doc);
    if (!cible) cible = doc; else mergeDocuments(cible, doc);
  }
  // Chaque clip fusionné apporte sa copie du squelette : on les fait tous viser le premier, sinon le chargeur
  // renomme les doublons (Bip01_1…) et seules les pistes du premier clip trouvent leurs os.
  const racine = cible.getRoot(), parNom = new Map();
  for (const n of racine.listNodes()) if (!parNom.has(n.getName())) parNom.set(n.getName(), n);
  for (const anim of racine.listAnimations()) for (const canal of anim.listChannels()) {
    const n = canal.getTargetNode();
    if (!n) continue;
    // Repères propres à 3ds Max, absents des personnages : leurs pistes ne feraient que générer des avertissements.
    if (n.getName() === 'MotionExtractionHelper' || n.getName() === 'Bip01 Footsteps') { canal.dispose(); continue; }
    const reference = parNom.get(n.getName());
    if (reference && reference !== n) canal.setTargetNode(reference);
  }
  racine.listScenes().slice(1).forEach(scene => scene.dispose());
  await cible.transform(resample(), dedup(), prune({ keepLeaves: true }), unpartition(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const noms = racine.listNodes().map(n => n.getName());
  if (new Set(noms).size !== noms.length) throw new Error('noms de nœuds encore dupliqués dans ' + genre);
  const fichier = path.join(SORTIE, `animations-${genre}.glb`);
  await io.write(fichier, cible);
  return { fichier: path.basename(fichier), ko: Math.round(fs.statSync(fichier).size / 1024), clips: cible.getRoot().listAnimations().map(a => `${a.getName()} ${a.listSamplers()[0]?.getInput()?.getMax([])?.[0]?.toFixed(2)}s`).join(', ') };
}

(async () => {
  fs.mkdirSync(SORTIE, { recursive: true });
  const io = await entreeSortie();
  if (!process.argv.includes('--animations')) for (const p of PERSONNAGES) console.log(JSON.stringify(await convertirPersonnage(io, p)));
  for (const [genre, clips] of Object.entries(ANIMATIONS)) console.log(JSON.stringify(await convertirAnimations(io, genre, clips)));
})().catch(e => { console.error(e); process.exit(1); });
