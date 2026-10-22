'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GOUTTES = 2200;
const ETENDUE = 64;
const HAUTEUR = 30;

/** Averse animée sur le GPU : les gouttes restent ancrées au monde et sont repliées dans un volume qui suit la caméra. */
export function Pluie({ intensite, pause = false }: { intensite: number; pause?: boolean }) {
  const geometrie = useMemo(() => {
    const positions = new Float32Array(GOUTTES * 6), extremites = new Float32Array(GOUTTES * 2);
    for (let i = 0; i < GOUTTES; i++) {
      const x = Math.random() * ETENDUE, y = Math.random() * HAUTEUR, z = Math.random() * ETENDUE;
      positions.set([x, y, z, x, y, z], i * 6);
      extremites.set([0, 1], i * 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aExtremite', new THREE.BufferAttribute(extremites, 1));
    return g;
  }, []);
  const materiau = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTemps: { value: 0 }, uCentre: { value: new THREE.Vector3() }, uOpacite: { value: .45 } },
    vertexShader: `
      uniform float uTemps; uniform vec3 uCentre; attribute float aExtremite; varying float vExtremite;
      void main() {
        float demi = ${(ETENDUE / 2).toFixed(1)};
        vec3 p = vec3(
          uCentre.x - demi + mod(position.x - (uCentre.x - demi), ${ETENDUE.toFixed(1)}),
          mod(position.y - uTemps * 24.0, ${HAUTEUR.toFixed(1)}) - aExtremite * .75,
          uCentre.z - demi + mod(position.z - (uCentre.z - demi), ${ETENDUE.toFixed(1)}));
        p.x += aExtremite * .14;
        vExtremite = aExtremite;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float uOpacite; varying float vExtremite;
      void main() { gl_FragColor = vec4(.78, .84, .9, uOpacite * (1.0 - vExtremite * .7)); }`,
  }), []);
  useEffect(() => () => { geometrie.dispose(); materiau.dispose(); }, [geometrie, materiau]);
  useEffect(() => {
    geometrie.setDrawRange(0, Math.round(GOUTTES * Math.min(1, Math.max(0, intensite))) * 2);
    materiau.uniforms.uOpacite.value = .3 + intensite * .25;
  }, [geometrie, materiau, intensite]);
  useFrame(({ controls, camera }, delta) => {
    if (!pause) materiau.uniforms.uTemps.value += Math.min(delta, .1);
    const cible = (controls as unknown as { target?: THREE.Vector3 })?.target ?? camera.position;
    materiau.uniforms.uCentre.value.copy(cible);
  });
  return <lineSegments geometry={geometrie} material={materiau} frustumCulled={false} userData={{ sansOcclusion: true }} />;
}
