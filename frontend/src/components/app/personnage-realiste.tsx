'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as clonerAvecSquelette } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { cadenceAnimation, etatAnimation, MODELES_REALISTES, type ModeleRealiste } from '@/lib/personnages-realistes';

const chemin = (modele: ModeleRealiste) => `/personnages/${modele}.glb`;
const animations = (genre: 'h' | 'f') => `/personnages/animations-${genre}.glb`;

/** Ne fait avancer l'animation que si le personnage est réellement affiché (niveau de détail, intérieur fermé…). */
function estAffiche(objet: THREE.Object3D | null) {
  for (let o = objet; o; o = o.parent) if (!o.visible) return false;
  return true;
}

export interface PersonnageRealisteProps {
  modele: ModeleRealiste; marche?: boolean; assis?: boolean; prof?: boolean; allure?: number; nom?: string;
}

/** Personnage photoréaliste articulé (Microsoft Rocketbox, MIT) : un squelette cloné par instance, fondus entre animations. */
export function PersonnageRealiste({ modele, marche, assis, prof, allure, nom }: PersonnageRealisteProps) {
  const { genre } = MODELES_REALISTES[modele];
  const { scene } = useGLTF(chemin(modele), false, true);
  const { animations: clips } = useGLTF(animations(genre), false, true);
  const instance = useMemo(() => {
    const copie = clonerAvecSquelette(scene);
    copie.traverse(o => {
      const maillage = o as THREE.SkinnedMesh;
      // La boîte englobante d'un maillage animé reste celle de la pose de repos : on évite qu'il disparaisse en bord d'écran.
      if (maillage.isMesh) { maillage.castShadow = true; maillage.frustumCulled = false; }
    });
    return copie;
  }, [scene]);
  const mixeur = useMemo(() => new THREE.AnimationMixer(instance), [instance]);
  const actions = useMemo(() => Object.fromEntries(clips.map(c => [c.name, mixeur.clipAction(c)])), [clips, mixeur]);
  const etat = etatAnimation({ marche, assis, prof, allure });
  const courante = useRef<THREE.AnimationAction | null>(null);
  useEffect(() => {
    const suivante = actions[etat] ?? actions.repos;
    if (!suivante) return;
    suivante.timeScale = cadenceAnimation(etat, allure);
    if (suivante === courante.current) return;
    suivante.reset().setEffectiveWeight(1);
    // Départ décalé au hasard : une foule ne respire ni ne marche jamais à l'unisson.
    if (!courante.current) suivante.time = Math.random() * suivante.getClip().duration;
    suivante.fadeIn(courante.current ? .3 : 0).play();
    courante.current?.fadeOut(.3);
    courante.current = suivante;
  }, [actions, etat, allure]);
  // Au démontage (et au double montage du mode strict), on repart de zéro : l'animation sera relancée au prochain effet.
  useEffect(() => () => { mixeur.stopAllAction(); courante.current = null; }, [mixeur]);
  const groupe = useRef<THREE.Group>(null), etiquette = useRef<THREE.Group>(null);
  const monde = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    if (!estAffiche(groupe.current)) return;
    mixeur.update(Math.min(delta, .1));
    if (etiquette.current && groupe.current) { groupe.current.getWorldPosition(monde); etiquette.current.visible = camera.position.distanceTo(monde) < 15; }
  });
  return <group ref={groupe}>
    <primitive object={instance} />
    {nom && <group ref={etiquette}><Billboard position={[0, 2.12, 0]}><Text fontSize={.14} color="#fff4d9" outlineColor="#193d39" outlineWidth={.012}>{nom}</Text></Billboard></group>}
  </group>;
}

// Le joueur et les animations sont demandés dès l'ouverture du monde ; les autres modèles à la première apparition.
useGLTF.preload(chemin('ouvrier-casque'), false, true);
useGLTF.preload(animations('h'), false, true);
useGLTF.preload(animations('f'), false, true);
