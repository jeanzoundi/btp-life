'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { humiditeSuivante } from '@/lib/meteo-monde';
import { flaquesQuartier } from '@/lib/voirie-ville';
import { HUMIDITE_SOLS } from './materiaux-monde';

const FLAQUES = flaquesQuartier();

/** Le bord d'une flaque : opaque au centre, fondu vers l'extérieur (le disque garde ses coordonnées de texture en carré). */
function bordFondu() {
  const toile = document.createElement('canvas');
  toile.width = toile.height = 64;
  const dessin = toile.getContext('2d');
  if (dessin) {
    const degrade = dessin.createRadialGradient(32, 32, 12, 32, 32, 32);
    degrade.addColorStop(0, '#fff'); degrade.addColorStop(1, '#000');
    dessin.fillStyle = degrade; dessin.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(toile);
}

/** La ville sous la pluie : l'humidité des sols monte avec l'averse et retombe après (un seul uniforme, partagé par
 * l'asphalte, les pavés, les trottoirs et le pied des bâtiments), et des flaques s'ouvrent au bord des chaussées. Une
 * flaque est un miroir d'eau : presque métallique et lisse, elle renvoie le ciel de l'éclairage d'ambiance (plus clair
 * que l'asphalte mouillé le jour, sombre la nuit), teintée de gris bleuté, aux bords fondus dans la chaussée. */
export function SolsMouilles({ pluie, pause }: { pluie: number; pause: boolean }) {
  const flaques = useRef<THREE.InstancedMesh>(null);
  const materiau = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9db0bc', roughness: .06, metalness: .92, alphaMap: bordFondu(), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  }), []);
  useLayoutEffect(() => {
    if (!flaques.current) return;
    const o = new THREE.Object3D();
    FLAQUES.forEach((f, i) => {
      o.position.set(f.x, .09, f.z); o.rotation.set(-Math.PI / 2, 0, f.angle); o.scale.set(f.rx, f.rz, 1); o.updateMatrix();
      flaques.current!.setMatrixAt(i, o.matrix);
    });
    flaques.current.instanceMatrix.needsUpdate = true;
    flaques.current.computeBoundingSphere();
  }, []);
  // En quittant la ville, les sols redeviennent secs : rien ne reste mouillé d'une visite à l'autre.
  useEffect(() => () => { HUMIDITE_SOLS.value = 0; materiau.alphaMap?.dispose(); materiau.dispose(); }, [materiau]);
  useFrame((_, delta) => {
    // Le temps réel compte, même quand l'image saccade : la pluie mouille autant sur un téléphone lent.
    if (!pause) HUMIDITE_SOLS.value = humiditeSuivante(HUMIDITE_SOLS.value, pluie, Math.min(delta, 1));
    // Les flaques ne se forment qu'une fois le sol bien mouillé, et disparaissent les premières en séchant.
    materiau.opacity = .75 * THREE.MathUtils.smoothstep(HUMIDITE_SOLS.value, .3, .9);
    if (flaques.current) flaques.current.visible = materiau.opacity > .01;
  });
  return <instancedMesh ref={flaques} args={[undefined, materiau, FLAQUES.length]} visible={false} receiveShadow userData={{ sansOcclusion: true }}>
    <circleGeometry args={[1, 20]} />
  </instancedMesh>;
}
