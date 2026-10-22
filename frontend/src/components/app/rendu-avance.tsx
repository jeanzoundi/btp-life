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
import { reglagesBloom, reglagesEffets, type NiveauEffets } from '@/lib/rendu-monde';

/** Textes, vitres, halos et marqueurs ne doivent pas assombrir ce qui se trouve derrière eux. */
function exclureDeLOcclusion(objet: THREE.Object3D) {
  if ((objet as THREE.Points).isPoints || (objet as THREE.Line).isLine || (objet as THREE.Sprite).isSprite || objet.userData.sansOcclusion) return true;
  const materiau = (objet as THREE.Mesh).material;
  return Array.isArray(materiau) ? materiau.some(m => m.transparent) : Boolean(materiau?.transparent);
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

/** Prend la main sur le rendu de la scène (priorité 1) : occlusion, halo, étalonnage puis lissage SMAA. */
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
    return { composer, halo };
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
