'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { REFERENCES_MODELES, type TeintesPersonnage } from '@/lib/personnages-joueur';
import type { ModeleRealiste } from '@/lib/personnages-realistes';

// Le personnage sur mesure sur un corps réaliste : on garde ses textures (plis, coutures, grain de peau) et on en change
// les couleurs dans le shader. La peau se reconnaît à sa teinte chaude proche de celle du modèle et prend le teint
// choisi ; le reste du corps devient le haut ou le bas selon sa hauteur au repos (au-dessus ou au-dessous des hanches),
// à la clarté près, pour garder les plis ; la chevelure prend la couleur des cheveux. Les modèles partagent leurs
// matériaux entre instances : on travaille sur des copies, propres à ce personnage. Les couleurs vivent dans des
// uniformes : le créateur les fait varier en direct sans recompiler.

const luminance = (c: THREE.Color) => c.r * .2126 + c.g * .7152 + c.b * .0722;
/** Le rôle d'un matériau Rocketbox d'après son nom : corps (vêtements et mains), tête, ou chevelure translucide. */
const roleDe = (nom: string) => /_body$/i.test(nom) ? 0 : /_head$/i.test(nom) ? 1 : /_opacity$/i.test(nom) ? 2 : null;
const CHEVEUX_DES_MODELES = new THREE.Color('#1e1715');

const TEINTE_GLSL = `#include <map_fragment>
  {
    vec3 texel = diffuseColor.rgb;
    float lum = dot(texel, vec3(.2126, .7152, .0722)), lumPeau = max(dot(uPeauBase, vec3(.2126, .7152, .0722)), 1e-4), rapport = lum / lumPeau;
    float peau = (1.0 - smoothstep(.25, .6, distance(texel / max(lum, 1e-4), uPeauBase / lumPeau))) * smoothstep(.25, .45, rapport) * (1.0 - smoothstep(1.8, 3.5, rapport));
    if (uRole < .5) {
      vec3 vetement = vHauteurRepos > uHanche ? uHaut * clamp(lum / max(uLumHaut, 1e-3), 0.0, 2.4) : uBas * clamp(lum / max(uLumBas, 1e-3), 0.0, 2.4);
      diffuseColor.rgb = mix(vetement, texel * uPeau, peau);
    } else if (uRole < 1.5) {
      diffuseColor.rgb = mix(texel, texel * uPeau, peau);
    } else {
      diffuseColor.rgb = mix(uCheveux * clamp(lum / max(uLumCheveux, 1e-3), 0.0, 2.4), texel * uPeau, peau);
    }
  }`;

function copieTeinte(origine: THREE.MeshStandardMaterial, role: number, uniformes: Record<string, THREE.IUniform>) {
  const copie = origine.clone();
  copie.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniformes, { uRole: { value: role } });
    shader.vertexShader = 'uniform vec3 uAxe;\nvarying float vHauteurRepos;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vHauteurRepos = dot(position, uAxe);');
    shader.fragmentShader = 'uniform vec3 uPeau, uPeauBase, uHaut, uBas, uCheveux;\nuniform float uLumHaut, uLumBas, uLumCheveux, uHanche, uRole;\nvarying float vHauteurRepos;\n'
      + shader.fragmentShader.replace('#include <map_fragment>', TEINTE_GLSL);
  };
  copie.customProgramCacheKey = () => 'sur-mesure-v1';
  return copie;
}

export function TeintesSurMesure({ teintes, modele, children }: { teintes: TeintesPersonnage; modele: ModeleRealiste; children: ReactNode }) {
  const groupe = useRef<THREE.Group>(null);
  const uniformes = useMemo(() => ({
    uAxe: { value: new THREE.Vector3(0, 0, 1) }, uHanche: { value: 0 },
    uPeau: { value: new THREE.Vector3(1, 1, 1) }, uPeauBase: { value: new THREE.Vector3(.1, .04, .02) },
    uHaut: { value: new THREE.Vector3() }, uBas: { value: new THREE.Vector3() }, uCheveux: { value: new THREE.Vector3() },
    uLumHaut: { value: .05 }, uLumBas: { value: .05 }, uLumCheveux: { value: luminance(CHEVEUX_DES_MODELES) },
  }), []);
  useEffect(() => {
    const reference = REFERENCES_MODELES[modele];
    const peau = new THREE.Color(teintes.peau), base = new THREE.Color(reference.peau);
    uniformes.uPeau.value.set(...([peau.r / base.r, peau.g / base.g, peau.b / base.b].map(v => Math.min(4, Number.isFinite(v) ? v : 1)) as [number, number, number]));
    uniformes.uPeauBase.value.set(base.r, base.g, base.b);
    const haut = new THREE.Color(teintes.haut), bas = new THREE.Color(teintes.bas), cheveux = new THREE.Color(teintes.cheveux);
    uniformes.uHaut.value.set(haut.r, haut.g, haut.b); uniformes.uBas.value.set(bas.r, bas.g, bas.b); uniformes.uCheveux.value.set(cheveux.r, cheveux.g, cheveux.b);
    uniformes.uLumHaut.value = luminance(new THREE.Color(reference.haut)); uniformes.uLumBas.value = luminance(new THREE.Color(reference.bas));
  }, [teintes.peau, teintes.haut, teintes.bas, teintes.cheveux, modele, uniformes]);
  const copies = useRef(new Map<THREE.Material, THREE.Material>());
  // Le corps arrive après son chargement, et un changement de silhouette en apporte un neuf : on vérifie à chaque image,
  // ce qui ne coûte presque rien pour un seul personnage (une poignée de maillages déjà marqués).
  useFrame(() => {
    groupe.current?.traverse(o => {
      const maillage = o as THREE.SkinnedMesh;
      if (!maillage.isMesh || maillage.userData.surMesure || Array.isArray(maillage.material)) return;
      const origine = maillage.material as THREE.MeshStandardMaterial;
      const role = roleDe(origine.name ?? '');
      if (role === null || !origine.isMeshStandardMaterial) return;
      if (role === 0) {
        // Debout au repos : l'axe le plus long du corps est la verticale, les hanches à un peu plus de la moitié.
        maillage.geometry.computeBoundingBox();
        const boite = maillage.geometry.boundingBox!, etendue = boite.getSize(new THREE.Vector3());
        const axe = etendue.z >= etendue.y && etendue.z >= etendue.x ? 2 : etendue.y >= etendue.x ? 1 : 0;
        uniformes.uAxe.value.set(axe === 0 ? 1 : 0, axe === 1 ? 1 : 0, axe === 2 ? 1 : 0);
        uniformes.uHanche.value = boite.min.getComponent(axe) + .52 * etendue.getComponent(axe);
      }
      let copie = copies.current.get(origine);
      if (!copie) { copie = copieTeinte(origine, role, uniformes); copies.current.set(origine, copie); }
      maillage.material = copie; maillage.userData.surMesure = true;
    });
  });
  useEffect(() => () => { copies.current.forEach(m => m.dispose()); copies.current.clear(); }, []);
  return <group ref={groupe}>{children}</group>;
}
