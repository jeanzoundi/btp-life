import * as THREE from 'three';
import { FICHIERS_CIEL } from './ressources-legeres';

/** Métadonnées de la carte de gain (format de @monogrid/gainmap-js), écrites par scripts/ressources-3d/alleger-ressources.cjs. */
export interface MetadonneesGain { gainMapMin: number[]; gainMapMax: number[]; gamma: number[]; offsetSdr: number[]; offsetHdr: number[] }

const srgbVersLineaire = Float32Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); });

/** Recompose le ciel HDR comme le décodeur de gainmap-js : (image + décalage) × 2^gain − décalage, le gain interpolé
 * entre son minimum et son maximum. `sdr` et `gain` : pixels RGBA. Rend des demi-flottants RGBA, comme le chargeur .hdr. */
export function recomposerCiel(sdr: ArrayLike<number>, gain: ArrayLike<number>, m: MetadonneesGain, pixels: number) {
  const facteurs = [0, 1, 2].map(c => Float32Array.from({ length: 256 }, (_, i) => Math.pow(2, m.gainMapMin[c] + (m.gainMapMax[c] - m.gainMapMin[c]) * Math.pow(i / 255, 1 / m.gamma[c]))));
  const donnees = new Uint16Array(pixels * 4), un = THREE.DataUtils.toHalfFloat(1);
  for (let p = 0; p < pixels * 4; p += 4) {
    for (let c = 0; c < 3; c++) donnees[p + c] = THREE.DataUtils.toHalfFloat(Math.min(65504, Math.max(0, (srgbVersLineaire[sdr[p + c]] + m.offsetSdr[c]) * facteurs[c][gain[p + c]] - m.offsetHdr[c])));
    donnees[p + 3] = un;
  }
  return donnees;
}

async function pixelsImage(url: string) {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`${url} : ${reponse.status}`);
  const image = await createImageBitmap(await reponse.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const toile = document.createElement('canvas');
  toile.width = image.width; toile.height = image.height;
  const contexte = toile.getContext('2d', { willReadFrequently: true });
  if (!contexte) throw new Error('Canvas 2D indisponible');
  contexte.drawImage(image, 0, 0);
  image.close();
  return contexte.getImageData(0, 0, toile.width, toile.height);
}

let ciel: Promise<THREE.DataTexture> | undefined;

/** Le ciel en DataTexture de demi-flottants, comme le donnait le chargeur .hdr : recomposé une fois sur le processeur, il
 * sert à tous les Canvas (la ville et chaque intérieur ont le leur). Décodée sur le GPU, comme le ferait l'Environment de
 * drei, la texture n'appartiendrait qu'au Canvas qui l'a chargée et les autres l'auraient noire. */
export function chargerCiel() {
  ciel ??= (async () => {
    const [sdr, gain, metadonnees] = await Promise.all([pixelsImage(FICHIERS_CIEL[0]), pixelsImage(FICHIERS_CIEL[1]),
      fetch(FICHIERS_CIEL[2]).then(r => { if (!r.ok) throw new Error(`${FICHIERS_CIEL[2]} : ${r.status}`); return r.json() as Promise<MetadonneesGain>; })]);
    const texture = new THREE.DataTexture(recomposerCiel(sdr.data, gain.data, metadonnees, sdr.width * sdr.height), sdr.width, sdr.height, THREE.RGBAFormat, THREE.HalfFloatType);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    // Lignes du haut en premier, comme le .hdr : retournées à l'envoi, le zénith en haut de la texture.
    texture.flipY = true;
    texture.needsUpdate = true;
    return texture;
  })().catch(erreur => { ciel = undefined; throw erreur; });
  return ciel;
}
