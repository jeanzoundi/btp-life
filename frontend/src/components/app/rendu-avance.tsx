'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { reglagesBloom, reglagesEffets, type NiveauEffets } from '@/lib/rendu-monde';

/** Étalonnage « lagune » en espace d'affichage : ombres légèrement bleu-vert, hautes lumières chaudes,
 * couleurs plus franches, contraste en S et vignettage. Il donne du relief sans effet de maquette. */
const ETALONNAGE = {
  uniforms: {
    tDiffuse: { value: null },
    uTonalite: { value: .7 },
    uSaturation: { value: 1.14 },
    uContraste: { value: .26 },
    uVignette: { value: .22 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTonalite, uSaturation, uContraste, uVignette; varying vec2 vUv;
    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec3 c = clamp(source.rgb, 0.0, 1.0);
      float l = dot(c, vec3(.2126, .7152, .0722));
      c = mix(vec3(l), c, uSaturation);
      vec3 teinte = mix(vec3(.95, 1.0, 1.04), vec3(1.05, 1.0, .93), smoothstep(.12, .78, l));
      c *= mix(vec3(1.0), teinte, uTonalite);
      c = mix(c, c * c * (3.0 - 2.0 * c), uContraste);
      float vignette = smoothstep(.9, .32, length((vUv - .5) * vec2(1.0, 1.12)));
      c *= mix(1.0 - uVignette, 1.0, vignette);
      gl_FragColor = vec4(c, source.a);
    }`,
};

/** Textes, vitres, halos et marqueurs ne doivent pas assombrir ce qui se trouve derrière eux. */
function exclureDeLOcclusion(objet: THREE.Object3D) {
  if ((objet as THREE.Points).isPoints || (objet as THREE.Line).isLine || (objet as THREE.Sprite).isSprite || objet.userData.sansOcclusion) return true;
  const materiau = (objet as THREE.Mesh).material;
  // Les volumes de clic (matériau invisible) seraient sinon dessinés dans la passe de normales et projetteraient des halos.
  return Array.isArray(materiau) ? materiau.some(m => m.transparent || !m.visible) : Boolean(materiau && (materiau.transparent || !materiau.visible));
}

type InternesGtao = { _overrideVisibility: () => void; _visibilityCache: THREE.Object3D[] };

function creerOcclusion(scene: THREE.Scene, camera: THREE.Camera, rayon: number, echelle: number) {
  const pass = new GTAOPass(scene, camera);
  const internes = pass as unknown as InternesGtao;
  internes._overrideVisibility = () => scene.traverse(objet => {
    if (objet.visible && exclureDeLOcclusion(objet)) { objet.visible = false; internes._visibilityCache.push(objet); }
  });
  const redimensionner = pass.setSize.bind(pass);
  pass.setSize = (largeur, hauteur) => redimensionner(Math.max(1, Math.round(largeur * echelle)), Math.max(1, Math.round(hauteur * echelle)));
  pass.updateGtaoMaterial({ radius: rayon, distanceExponent: 1, thickness: 1, scale: 1, samples: echelle < 1 ? 12 : 16 });
  pass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  pass.blendIntensity = .9;
  return pass;
}

/** Prend la main sur le rendu de la scène (priorité 1) : occlusion, halo, lissage SMAA puis étalonnage. */
export function RenduAvance({ niveau, nuit = false, rayonOcclusion = 1 }: { niveau: NiveauEffets; nuit?: boolean; rayonOcclusion?: number }) {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const camera = useThree(s => s.camera);
  const largeur = useThree(s => s.size.width);
  const hauteur = useThree(s => s.size.height);
  const dpr = useThree(s => s.viewport.dpr);
  const { occlusion, echelleOcclusion } = reglagesEffets(niveau);
  const chaine = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    if (occlusion) composer.addPass(creerOcclusion(scene, camera, rayonOcclusion, echelleOcclusion));
    const halo = new UnrealBloomPass(new THREE.Vector2(256, 256), .22, .35, 1.05);
    composer.addPass(halo);
    composer.addPass(new OutputPass());
    // Après l'étalonnage : le SMAA détecte mieux les arêtes sur des valeurs affichées.
    composer.addPass(new SMAAPass());
    const etalonnage = new ShaderPass(ETALONNAGE);
    composer.addPass(etalonnage);
    return { composer, halo, etalonnage };
  }, [gl, scene, camera, occlusion, echelleOcclusion, rayonOcclusion]);
  useEffect(() => () => {
    chaine.composer.passes.forEach(pass => pass.dispose());
    chaine.composer.dispose();
  }, [chaine]);
  useEffect(() => {
    chaine.composer.setPixelRatio(dpr);
    chaine.composer.setSize(largeur, hauteur);
  }, [chaine, dpr, largeur, hauteur]);
  useEffect(() => {
    const { seuil, intensite, rayon } = reglagesBloom(nuit);
    chaine.halo.threshold = seuil; chaine.halo.strength = intensite; chaine.halo.radius = rayon;
    // La nuit, on garde le contraste mais on retire la chaleur, pour que les lampadaires restent la seule source dorée.
    chaine.etalonnage.uniforms.uTonalite.value = nuit ? .3 : .7;
  }, [chaine, nuit]);
  useEffect(() => {
    // Les ombres ne sont recalculées qu'une fois par image, pas à chaque passe ; les statistiques cumulent toutes les passes.
    const ombres = gl.shadowMap.autoUpdate, statistiques = gl.info.autoReset;
    gl.shadowMap.autoUpdate = false; gl.info.autoReset = false;
    return () => { gl.shadowMap.autoUpdate = ombres; gl.shadowMap.needsUpdate = true; gl.info.autoReset = statistiques; };
  }, [gl]);
  useFrame((_, delta) => {
    gl.info.reset();
    gl.shadowMap.needsUpdate = true;
    chaine.composer.render(delta);
  }, 1);
  return null;
}
