// Prépare les textures Poly Haven (CC0) pour le jeu : copie, éclaircissement de l'enduit, pavés recolorés en grès chaud.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Utilisation : POLYHAVEN_SOURCE=<dossier des fichiers 1K téléchargés> NODE_PATH=<outils>/node_modules node textures-poly-haven.js
const SOURCE = process.env.POLYHAVEN_SOURCE;
if (!SOURCE) { console.error('POLYHAVEN_SOURCE doit pointer vers les fichiers Poly Haven téléchargés (voir README.md).'); process.exit(1); }
const CIBLE = path.join(__dirname, '..', '..', 'public', 'materials');

async function copier(nom) {
  for (const canal of ['normal', 'rough']) fs.copyFileSync(path.join(SOURCE, `${nom}-${canal}.jpg`), path.join(CIBLE, `${nom}-${canal}.jpg`));
}

/** Ramène la moyenne vers `cible` en gardant les variations de luminance (taches, grain, joints). */
async function recolorer(nom, cible, gamma = .8, saturationConservee = 0) {
  const { data, info } = await sharp(path.join(SOURCE, `${nom}-color.jpg`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let somme = 0;
  for (let i = 0; i < data.length; i += 3) somme += .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
  const moyenne = somme / (data.length / 3);
  const sortie = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 3) {
    const l = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
    const f = Math.pow(Math.max(l, 1) / moyenne, gamma);
    for (let c = 0; c < 3; c++) {
      const neutre = cible[c] * f;
      const garde = data[i + c] * (cible[c] / moyenne) * f / Math.max(.2, l / moyenne);
      sortie[i + c] = Math.max(0, Math.min(255, Math.round(neutre * (1 - saturationConservee) + garde * saturationConservee)));
    }
  }
  await sharp(sortie, { raw: { width: info.width, height: info.height, channels: 3 } }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(CIBLE, `${nom}-color.jpg`));
}

(async () => {
  // Tuiles et tôle : couleurs photographiques d'origine.
  for (const nom of ['clay_roof_tiles_02', 'corrugated_iron']) {
    fs.copyFileSync(path.join(SOURCE, `${nom}-color.jpg`), path.join(CIBLE, `${nom}-color.jpg`));
    await copier(nom);
  }
  // Enduit : presque blanc, la teinte vient de la couleur de chaque bâtiment.
  await recolorer('painted_plaster_wall', [238, 236, 232], .9, .15);
  await copier('painted_plaster_wall');
  // Pavés : grès rosé, joints plus sombres conservés par la luminance d'origine.
  await recolorer('brick_pavement_02', [214, 178, 146], .85);
  await copier('brick_pavement_02');
  fs.copyFileSync(path.join(SOURCE, 'ciel-kloofendal-1k.hdr'), path.join(CIBLE, 'ciel-kloofendal-1k.hdr'));
  for (const f of fs.readdirSync(CIBLE).filter(f => /clay_roof|corrugated|painted_plaster|brick_pavement|ciel-/.test(f))) console.log(f, Math.round(fs.statSync(path.join(CIBLE, f)).size / 1024) + ' Ko');
})();
