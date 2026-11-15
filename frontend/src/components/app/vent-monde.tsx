'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Le temps du vent, partagé par tous les feuillages de la ville : un seul uniforme, aucun rendu React par image. */
export const VENT_MONDE = { value: 0 };

/** Fait souffler le vent tant que le monde n'est pas en pause. À poser une fois dans la scène. */
export function VentMonde({ pause = false, force = 1 }: { pause?: boolean; force?: number }) {
  useFrame((_, delta) => { if (!pause) VENT_MONDE.value += Math.min(delta, .1) * force; });
  return null;
}

/** Feuillage instancié qui frémit au vent : chaque touffe ou palme se balance selon sa place dans la ville (deux ondes
 * déphasées, pour que deux arbres voisins ne bougent pas ensemble) et selon la hauteur du sommet dans la touffe (le bas
 * reste accroché à la branche). Le déplacement se fait dans le repère de l'instance, avant sa matrice : l'amplitude se lit
 * en mètres pour une touffe non déformée. La couleur par instance et les ombres portées suivent, comme avant. */
export function MateriauFeuillage({ couleur = '#ffffff', rugosite = .9, amplitude = .08, deuxFaces = false }: { couleur?: string; rugosite?: number; amplitude?: number; deuxFaces?: boolean }) {
  const materiau = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, side: deuxFaces ? THREE.DoubleSide : THREE.FrontSide });
    m.customProgramCacheKey = () => 'feuillage-vent-v1';
    m.onBeforeCompile = shader => {
      shader.uniforms.uVent = VENT_MONDE;
      shader.uniforms.uAmplitude = { value: amplitude };
      shader.vertexShader = 'uniform float uVent;\nuniform float uAmplitude;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 origineVent = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          vec3 origineVent = vec3(0.0);
        #endif
        float phaseVent = uVent * 1.7 + origineVent.x * 0.31 + origineVent.z * 0.23;
        float rafale = 0.55 + 0.45 * sin(uVent * 0.37 + origineVent.x * 0.05);
        // Une touffe (sphère, y de -1 à 1) bouge surtout par le haut ; une palme (foliole, z de 0 à 1) surtout par le bout.
        float poidsVent = clamp(0.3 + max(position.y, position.z) * 0.7, 0.0, 1.0);
        transformed.x += sin(phaseVent) * uAmplitude * rafale * poidsVent;
        transformed.z += sin(phaseVent * 0.8 + 1.3) * uAmplitude * 0.6 * rafale * poidsVent;
        transformed.y += sin(phaseVent * 2.1) * uAmplitude * 0.25 * rafale * poidsVent;`);
    };
    return m;
  }, [couleur, rugosite, amplitude, deuxFaces]);
  useEffect(() => () => materiau.dispose(), [materiau]);
  return <primitive object={materiau} attach="material" />;
}
