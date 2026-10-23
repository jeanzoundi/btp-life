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

/** Étalonnage final en espace d'affichage : saturation, hautes lumières chaudes, léger contraste, vignettage,
 * et flou de maquette (tilt-shift) qui garde nette la bande centrale où se trouve le joueur. */
const ETALONNAGE = {
  uniforms: {
    tDiffuse: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
    uChaleur: { value: .6 },
    uSaturation: { value: 1.1 },
    uVignette: { value: .18 },
    uFlou: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uChaleur, uSaturation, uVignette, uFlou; varying vec2 vUv;
    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec3 c = source.rgb;
      float rayon = smoothstep(.2, .5, abs(vUv.y - .52)) * uFlou;
      if (rayon > .05) {
        vec3 somme = c; float n = 1.0;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * .785398 + .39;
          vec2 o = vec2(cos(a), sin(a)) * uTexel * rayon;
          somme += texture2D(tDiffuse, vUv + o).rgb + texture2D(tDiffuse, vUv + o * .5).rgb; n += 2.0;
        }
        c = somme / n;
      }
      c = clamp(c, 0.0, 1.0);
      float l = dot(c, vec3(.2126, .7152, .0722));
      c = mix(vec3(l), c, uSaturation);
      c *= mix(vec3(1.0), vec3(1.06, 1.0, .9), uChaleur * smoothstep(.15, .85, l));
      c = mix(c, c * c * (3.0 - 2.0 * c), .16);
      float vignette = smoothstep(.85, .3, length((vUv - .5) * vec2(1.0, 1.1)));
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

/** Prend la main sur le rendu de la scène (priorité 1) : occlusion, halo, étalonnage, lissage SMAA puis tons chauds et effet maquette. */
export function RenduAvance({ niveau, nuit = false, rayonOcclusion = 1, maquette = false }: { niveau: NiveauEffets; nuit?: boolean; rayonOcclusion?: number; maquette?: boolean }) {
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
    chaine.etalonnage.uniforms.uTexel.value.set(1 / Math.max(1, largeur * dpr), 1 / Math.max(1, hauteur * dpr));
  }, [chaine, dpr, largeur, hauteur]);
  useEffect(() => {
    const { seuil, intensite, rayon } = reglagesBloom(nuit);
    chaine.halo.threshold = seuil; chaine.halo.strength = intensite; chaine.halo.radius = rayon;
    const u = chaine.etalonnage.uniforms;
    u.uChaleur.value = nuit ? .2 : .6;
    // Le flou de maquette coûte 17 lectures par pixel : réservé aux niveaux avec occlusion.
    u.uFlou.value = maquette && occlusion ? 2.4 : 0;
  }, [chaine, nuit, maquette, occlusion]);
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
