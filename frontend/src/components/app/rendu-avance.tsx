'use client';

import { useEffect, useMemo, useRef } from 'react';
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
    // Des couleurs franches mais naturelles : au-delà, la ville prend un air de maquette.
    uSaturation: { value: 1.08 },
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

/** Netteté adaptative (dans l'esprit du CAS d'AMD), en toute fin de chaîne : elle rend aux contours et aux textures le piqué
 * que le lissage SMAA et la mise à l'échelle de l'écran leur retirent, sans souligner les aplats ni le bruit. */
const NETTETE = {
  uniforms: {
    tDiffuse: { value: null },
    uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) },
    uForce: { value: .5 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uForce; varying vec2 vUv;
    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec3 c = source.rgb;
      vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb, s = texture2D(tDiffuse, vUv - vec2(0.0, uTexel.y)).rgb;
      vec3 e = texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb, o = texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.0)).rgb;
      vec3 mini = min(c, min(min(n, s), min(e, o))), maxi = max(c, max(max(n, s), max(e, o)));
      // Moins on a de marge avant le noir ou le blanc, moins on accentue : pas de halos sur les contrastes forts.
      vec3 amplitude = sqrt(clamp(min(mini, 1.0 - maxi) / max(maxi, vec3(1e-4)), 0.0, 1.0));
      vec3 poids = -amplitude * mix(.125, .2, uForce);
      gl_FragColor = vec4(clamp((c + (n + s + e + o) * poids) / (1.0 + 4.0 * poids), 0.0, 1.0), source.a);
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

/** Prend la main sur le rendu de la scène (priorité 1) : occlusion, halo, lissage SMAA, étalonnage puis netteté.
 * `nettete` : force de l'accentuation (plus forte sur téléphone, où l'image est agrandie). `cadenceOmbres` : les ombres ne
 * sont recalculées qu'une image sur `cadenceOmbres` (le soleil bouge lentement ; sur téléphone, c'est autant de gagné). */
export function RenduAvance({ niveau, nuit = false, rayonOcclusion = 1, nettete = .5, cadenceOmbres = 1 }: { niveau: NiveauEffets; nuit?: boolean; rayonOcclusion?: number; nettete?: number; cadenceOmbres?: number }) {
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
    const accentuation = new ShaderPass(NETTETE);
    composer.addPass(accentuation);
    return { composer, halo, etalonnage, accentuation };
  }, [gl, scene, camera, occlusion, echelleOcclusion, rayonOcclusion]);
  useEffect(() => () => {
    chaine.composer.passes.forEach(pass => pass.dispose());
    chaine.composer.dispose();
  }, [chaine]);
  useEffect(() => {
    chaine.composer.setPixelRatio(dpr);
    chaine.composer.setSize(largeur, hauteur);
    chaine.accentuation.uniforms.uTexel.value.set(1 / Math.max(1, largeur * dpr), 1 / Math.max(1, hauteur * dpr));
  }, [chaine, dpr, largeur, hauteur]);
  useEffect(() => { chaine.accentuation.uniforms.uForce.value = nettete; }, [chaine, nettete]);
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
  const image = useRef(0);
  useFrame((_, delta) => {
    gl.info.reset();
    gl.shadowMap.needsUpdate = image.current++ % Math.max(1, cadenceOmbres) === 0;
    chaine.composer.render(delta);
  }, 1);
  return null;
}
