// Variante de revue uniquement : garde le maillage et le squelette, restaure les textures source 2K.
// Source Microsoft Rocketbox / Construction_Male_03, MIT (licence conservée dans public/personnages).
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

function lireTga(b) {
  const width = b.readUInt16LE(12), height = b.readUInt16LE(14), channels = b[16] / 8;
  if (b[1] !== 0 || ![2, 10].includes(b[2]) || ![3, 4].includes(channels) || !width || !height) throw new Error('TGA non pris en charge');
  const pixels = Buffer.alloc(width * height * channels);
  let src = 18 + b[0], dst = 0;
  const copier = at => {
    if (at + channels > b.length || dst + channels > pixels.length) throw new Error('TGA tronqué');
    pixels[dst] = b[at + 2]; pixels[dst + 1] = b[at + 1]; pixels[dst + 2] = b[at];
    if (channels === 4) pixels[dst + 3] = b[at + 3];
    dst += channels;
  };
  while (dst < pixels.length) {
    if (b[2] === 2) { copier(src); src += channels; continue; }
    const packet = b[src++], count = (packet & 127) + 1;
    if (packet & 128) { for (let i = 0; i < count; i++) copier(src); src += channels; }
    else for (let i = 0; i < count; i++) { copier(src); src += channels; }
  }
  // Origine TGA : normalize vers haut/gauche, sans recolorer les photographies.
  const result = Buffer.alloc(pixels.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sy = b[17] & 32 ? y : height - 1 - y, sx = b[17] & 16 ? width - 1 - x : x;
    const at = (sy * width + sx) * channels;
    pixels.copy(result, (y * width + x) * channels, at, at + channels);
  }
  return { pixels: result, width, height, channels };
}

function ajouterTextures(glb, images) {
  if (glb.readUInt32LE(0) !== 0x46546c67 || glb.readUInt32LE(4) !== 2) throw new Error('GLB invalide');
  const jsonLength = glb.readUInt32LE(12), binHeader = 20 + jsonLength;
  const doc = JSON.parse(glb.toString('utf8', 20, binHeader));
  const chunks = [glb.subarray(binHeader + 8, binHeader + 8 + glb.readUInt32LE(binHeader))];
  let size = chunks[0].length;
  for (const [name, bytes] of images) {
    const image = doc.images.find(i => i.name === name);
    if (!image) throw new Error(`Texture absente : ${name}`);
    const padding = (4 - size % 4) % 4;
    chunks.push(Buffer.alloc(padding), bytes);
    image.bufferView = doc.bufferViews.length;
    doc.bufferViews.push({ buffer: 0, byteOffset: size + padding, byteLength: bytes.length });
    image.mimeType = 'image/webp';
    size += padding + bytes.length;
  }
  // Les offsets des maillages meshopt et leur buffer de secours ne sont pas modifiés.
  doc.buffers[0].byteLength = size;
  const json = Buffer.from(JSON.stringify(doc));
  const jp = Buffer.alloc((4 - json.length % 4) % 4, 32), bp = Buffer.alloc((4 - size % 4) % 4);
  const header = Buffer.alloc(20), binaryHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + json.length + jp.length + size + bp.length, 8);
  header.writeUInt32LE(json.length + jp.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  binaryHeader.writeUInt32LE(size + bp.length, 0); binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, json, jp, binaryHeader, ...chunks, bp]);
}

async function main() {
  const dossier = path.resolve(__dirname, '../../public/personnages');
  const source = 'https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master/Assets/Avatars/Professions/Construction_Male_03/Textures/';
  const images = [];
  for (const partie of ['head', 'body']) for (const carte of ['color', 'normal']) {
    const response = await fetch(`${source}m102_${partie}_${carte}.tga`, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Téléchargement : ${response.status} ${partie}/${carte}`);
    const tga = lireTga(Buffer.from(await response.arrayBuffer()));
    const texture = sharp(tga.pixels, { raw: { width: tga.width, height: tga.height, channels: tga.channels } })
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true });
    const bytes = await texture.webp(carte === 'normal' ? { lossless: true } : { quality: 95 }).toBuffer();
    const metadata = await sharp(bytes).metadata();
    images.push([`ouvrier-casque-${partie}-${carte === 'color' ? 'couleur' : 'relief'}`, bytes]);
    console.log(`${partie}/${carte} : ${metadata.width}×${metadata.height}, ${Math.round(bytes.length / 1024)} Ko`);
  }
  const result = ajouterTextures(await fs.readFile(path.join(dossier, 'ouvrier-casque.glb')), images);
  await fs.writeFile(path.join(dossier, 'ouvrier-studio.glb'), result);
  console.log(`ouvrier-studio.glb : ${Math.round(result.length / 1024)} Ko — original conservé`);
}

module.exports = { lireTga, ajouterTextures };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
