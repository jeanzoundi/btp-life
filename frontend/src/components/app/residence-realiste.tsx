'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { avancerResidence, cheminResidence, PLAN_RESIDENCE as PLAN, POINTS_RESIDENCE } from '@/lib/plan-residence';
import type { PointInterieur } from '@/lib/navigation-interieur';
import type { ObjetInterieur } from '@/lib/objets-interieurs';
import { VieInterieure } from './vie-interieure';
import { SurfaceBloc } from './materiaux-monde';
import { HumainJoueur } from './personnage-joueur';
import { JetDouche, Vapeur, ZonesObjets, type InteractionsInterieur, type UsageObjet } from './objets-interieurs-3d';

type V3 = [number, number, number];
function Bloc({ p, s, c, doux = false, metal = 0 }: { p: V3; s: V3; c: string; doux?: boolean; metal?: number }) {
  const material = <SurfaceBloc dimensions={s} couleur={c} metal={metal}/>;
  return doux ? <RoundedBox position={p} args={s} radius={.04} smoothness={2} castShadow receiveShadow>{material}</RoundedBox> :
    <mesh position={p} castShadow receiveShadow><boxGeometry args={s} />{material}</mesh>;
}
function Tube({ p, r, h, c }: { p: V3; r: number; h: number; c: string }) {
  return <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[r, r, h, 16]} /><meshStandardMaterial color={c} roughness={.6} /></mesh>;
}
function Plante({ p }: { p: V3 }) {
  return <group position={p}><Tube p={[0, .22, 0]} r={.22} h={.44} c="#aa7454" />{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.4) * .18, .65 + i % 3 * .13, Math.cos(i * 2.4) * .18]} rotation={[0, i, .3]} scale={[.16, .45, .09]} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#49684a' : '#63844d'} /></mesh>)}</group>;
}
function Lampe({ p }: { p: V3 }) {
  return <group position={p}><Tube p={[0, .025, 0]} r={.15} h={.05} c="#3b3936" /><Tube p={[0, .22, 0]} r={.025} h={.4} c="#ad8655" /><mesh position={[0, .46, 0]}><coneGeometry args={[.24, .3, 24, 1, true]} /><meshStandardMaterial color="#f6dfb3" emissive="#e8b16b" emissiveIntensity={.35} side={THREE.DoubleSide} /></mesh><pointLight position={[0, .4, 0]} color="#ffd8a0" intensity={2} distance={3} /></group>;
}

/** Meuble télé face au canapé ; l'écran s'allume quand on la regarde. */
function Television({ allumee }: { allumee: boolean }) {
  return <group position={[PLAN.tele.x, 0, PLAN.tele.z]}>
    <Bloc p={[0, .25, 0]} s={[PLAN.tele.largeur, .5, PLAN.tele.profondeur]} c="#5f4b39" doux />
    <Bloc p={[0, .96, .05]} s={[1.3, .78, .06]} c="#141a1c" />
    <mesh position={[0, .96, .015]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[1.2, .68]} />
      <meshStandardMaterial color="#0c1316" emissive={allumee ? '#86bcd8' : '#000000'} emissiveIntensity={allumee ? 1.15 : 0} roughness={.25} />
    </mesh>
    {allumee && <pointLight position={[0, 1, -.5]} color="#9fc8e0" intensity={1.4} distance={3.5} />}
  </group>;
}

/** Chaise de la table à manger, où l'on s'installe pour étudier ses plans. */
function Chaise({ p }: { p: V3 }) {
  return <group position={p}>
    <Bloc p={[0, .46, 0]} s={[.46, .06, .46]} c="#8a6a4a" doux />
    <Bloc p={[0, .78, -.21]} s={[.46, .56, .05]} c="#8a6a4a" doux />
    {[-.19, .19].flatMap(x => [-.19, .19].map(z => <Tube key={`${x},${z}`} p={[x, .22, z]} r={.025} h={.44} c="#5a4632" />))}
  </group>;
}

function Appartement({ teleAllumee = false }: { teleAllumee?: boolean }) {
  const veinage = useMemo(() => {
    const largeur = 128, hauteur = 256;
    const pixels = new Uint8Array(largeur * hauteur * 4);
    for (let y = 0; y < hauteur; y++) for (let x = 0; x < largeur; x++) {
      const fibre = Math.sin(x * .85 + Math.sin(y * .025) * 2 + Math.sin(x * .11) * 3);
      const grain = Math.sin(x * 19.17 + y * 71.39) * 5;
      const teinte = Math.round(222 + fibre * 16 + grain);
      const i = (y * largeur + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = teinte; pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, largeur, hauteur);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => veinage.dispose(), [veinage]);
  // Instanced boards: varied oak tones and seams without hundreds of draw calls.
  const parquet = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!parquet.current) return;
    const transform = new THREE.Object3D();
    let n = 0;
    for (let x = 0; x < 24; x++) for (let z = 0; z < 10; z++) {
      transform.position.set(-5.75 + x * .5, -.015, -4.5 + z);
      transform.updateMatrix(); parquet.current.setMatrixAt(n, transform.matrix);
      parquet.current.setColorAt(n++, new THREE.Color(['#a58a69', '#b49977', '#bfa482', '#ad916e'][(x * 7 + z * 3) % 4]));
    }
    parquet.current.instanceMatrix.needsUpdate = true;
    if (parquet.current.instanceColor) parquet.current.instanceColor.needsUpdate = true;
  }, []);
  return <>
    <Bloc p={[0, -.2, 0]} s={[12, .3, 10]} c="#52483d" />
    <instancedMesh ref={parquet} args={[undefined, undefined, 240]} receiveShadow><boxGeometry args={[.492, .08, .988]} /><meshStandardMaterial map={veinage} bumpMap={veinage} bumpScale={.008} roughness={.68} /></instancedMesh>
    <Bloc p={[0, 1.4, -4.8]} s={[12, 2.8, .18]} c="#e4ddd0" />
    <Bloc p={[-5.8, .5, 0]} s={[.18, 1, 9.6]} c="#e4ddd0" /><Bloc p={[5.8, .5, 0]} s={[.18, 1, 9.6]} c="#e4ddd0" />
    <Bloc p={[0, .07, -4.67]} s={[11.5, .14, .04]} c="#f1ece1" />
    {[PLAN.cloisonGauche, PLAN.cloisonDroite, PLAN.separation].map((o, i) => <group key={i}>
      <Bloc p={[o.x, .47, o.z]} s={[o.largeur, .94, o.profondeur]} c="#e1d9c9" />
      <Bloc p={[o.x, .97, o.z]} s={[o.largeur + .02, .06, o.profondeur + .03]} c="#f4eee3" />
    </group>)}
    {/* Windows with frames, sill, glazing and curtains; no remote assets. */}
    {[-3.5, 3].map(x => <group key={x} position={[x, 1.8, -4.67]}>
      <Bloc p={[0, 0, 0]} s={[2.1, 1.45, .1]} c="#6f9ba2" />
      {[-1.05, 0, 1.05].map(v => <Bloc key={v} p={[v, 0, .08]} s={[.06, 1.55, .1]} c="#f5f0e5" />)}
      {[-.75, .75].map(v => <Bloc key={v} p={[0, v, .08]} s={[2.2, .06, .1]} c="#f5f0e5" />)}
      <Bloc p={[0, -.8, .15]} s={[2.35, .09, .4]} c="#d4c9b6" />
      {[-1.3, 1.3].map(side => <group key={side}>{Array.from({ length: 5 }, (_, i) => <Tube key={i} p={[side + (i - 2) * .07, -.1, .2]} r={.055} h={2.15} c={i % 2 ? '#d0c3ac' : '#e1d6bf'} />)}</group>)}
    </group>)}
    {/* Bedroom: bed frame, mattress, duvet, pillows and bedside cabinets. */}
    <group position={[PLAN.lit.x, 0, PLAN.lit.z]}>
      <Bloc p={[0, .22, 0]} s={[2, .35, 2.4]} c="#725b45" doux />
      <Bloc p={[0, .49, 0]} s={[1.94, .22, 2.32]} c="#eee8d8" doux />
      <Bloc p={[0, .65, .35]} s={[1.98, .15, 1.63]} c="#a9b4a0" doux />
      <Bloc p={[0, .75, -1.13]} s={[2.1, 1.2, .13]} c="#8b745c" doux />
      {[-.49, .49].map(x => <Bloc key={x} p={[x, .69, -.77]} s={[.78, .19, .44]} c="#f5f0e4" doux />)}
      <Bloc p={[0, .74, .84]} s={[2, .06, .48]} c="#6c7e77" />
      <Bloc p={[-1.35, .3, -.6]} s={[.55, .6, .5]} c="#8c7154" /><Lampe p={[-1.35, .6, -.6]} />
    </group>
    {/* Living room: upholstered cushions, legs, rug and coffee table. */}
    <Bloc p={[-3.65, .045, 2.8]} s={[3.7, .025, 2.8]} c="#d1c6af" />
    <group position={[PLAN.canape.x, 0, PLAN.canape.z]}>
      <Bloc p={[0, .32, 0]} s={[2.7, .42, 1]} c="#667b70" doux />
      <Bloc p={[0, .78, -.43]} s={[2.7, .66, .22]} c="#71867a" doux />
      {[-1.25, 1.25].map(x => <Bloc key={x} p={[x, .62, 0]} s={[.2, .4, 1]} c="#71867a" doux />)}
      {[-.78, 0, .78].map(x => <Bloc key={x} p={[x, .57, .02]} s={[.72, .16, .75]} c="#83958a" doux />)}
      {[-.9, .9].map(x => <group key={x}><Bloc p={[x, .83, -.2]} s={[.4, .4, .16]} c={x < 0 ? '#c5ad86' : '#ddd4bd'} doux /><Tube p={[x, .09, .25]} r={.045} h={.18} c="#4e4035" /></group>)}
    </group>
    <Bloc p={[PLAN.table.x, .45, PLAN.table.z]} s={[1.5, .09, .65]} c="#795c42" doux />
    {[-4.2, -3.1].map(x => <Tube key={x} p={[x, .22, 3.3]} r={.035} h={.44} c="#3d403c" />)}
    <Bloc p={[-3.8, .52, 3.3]} s={[.35, .04, .25]} c="#c4a267" /><Tube p={[-3.2, .56, 3.25]} r={.07} h={.13} c="#e6d9c0" />
    <Plante p={[-5, 0, .1]} /><Plante p={[1, 0, -4.2]} />
    {/* Fitted kitchen: cabinet seams, worktop, sink, cooker and utensils. */}
    <group position={[PLAN.cuisine.x, 0, PLAN.cuisine.z]}>
      <Bloc p={[0, .43, 0]} s={[1.2, .86, 4]} c="#ded5c2" />
      <Bloc p={[0, .9, 0]} s={[1.24, .08, 4.04]} c="#454b47" />
      {[-1.5, -.5, .5, 1.5].map(z => <group key={z}><Bloc p={[-.61, .44, z]} s={[.03, .78, .96]} c="#b9b4a4" /><Bloc p={[-.64, .73, z]} s={[.025, .035, .3]} c="#484b45" metal={.6} /></group>)}
      <Bloc p={[0, .95, -1]} s={[.75, .015, .65]} c="#161e22" />
      <Bloc p={[0, .97, -1]} s={[.58, .015, .48]} c="#7b8e8e" metal={.8} />
      <Tube p={[.35, 1.1, -1]} r={.025} h={.3} c="#c1c9c7" />
      <Bloc p={[.22, 1.25, -1]} s={[.28, .04, .04]} c="#c1c9c7" metal={.8} />
      <Bloc p={[0, .96, 1]} s={[.8, .025, .8]} c="#23292a" />
      {[-.2, .2].flatMap(x => [-.2, .2].map(z => <Tube key={`${x},${z}`} p={[x, .98, 1 + z]} r={.13} h={.015} c="#676c6c" />))}
      <Tube p={[0, 1.06, 1.2]} r={.17} h={.16} c="#9ba4a3" />
      <Bloc p={[0, 1, 0]} s={[.45, .025, .6]} c="#bfa077" />
    </group>
    <Television allumee={teleAllumee} /><Chaise p={[2.5, 0, 1.55]} />
    <Bloc p={[2.5, .76, 2.6]} s={[1, .08, 1.5]} c="#a58a67" doux />
    {[2.15, 2.85].flatMap(x => [2.05, 3.15].map(z => <Tube key={`${x},${z}`} p={[x, .36, z]} r={.04} h={.72} c="#665544" />))}
    <Tube p={[2.5, .82, 2.6]} r={.23} h={.02} c="#f0ece2" /><Tube p={[2.5, .9, 3]} r={.07} h={.16} c="#bed0d1" />
    {/* Wet room: tile joints, mirror, ceramic basin and glazed shower. */}
    {Array.from({ length: 8 }, (_, x) => Array.from({ length: 7 }, (_, z) => <Bloc key={`${x},${z}`} p={[1.7 + x * .5, .055, -4.35 + z * .5]} s={[.487, .025, .487]} c={(x + z) % 3 ? '#b5beb9' : '#c2c9c3'} />))}
    <Bloc p={[2.7, .48, -4.2]} s={[1.4, .86, .6]} c="#806c55" />
    <Bloc p={[2.7, .96, -4.2]} s={[1.42, .1, .64]} c="#e9e6d9" doux />
    <Bloc p={[2.7, 1.8, -4.66]} s={[1.3, 1.05, .04]} c="#a3bdc1" metal={.7} />
    <Tube p={[2.7, 1.08, -4.4]} r={.025} h={.22} c="#b8c4c2" />
    <Bloc p={[4.65, .12, -3.6]} s={[1.5, .15, 1.5]} c="#e4e7dd" />
    <mesh position={[3.9, 1.15, -3.6]}><boxGeometry args={[.025, 2.1, 1.5]} /><meshPhysicalMaterial color="#d4e8e4" transparent opacity={.22} roughness={.08} depthWrite={false} /></mesh>
    <Tube p={[3.9, 1.15, -2.85]} r={.025} h={2.1} c="#84908c" />
    <Tube p={[4.65, 1.65, -4.45]} r={.025} h={1.15} c="#b9c5c2" />
    <Bloc p={[4.65, 2.23, -4.25]} s={[.25, .035, .45]} c="#adb8b5" metal={.8} />
  </>;
}

/** Le joueur dans un intérieur : visite des pièces, déplacement manuel, et utilisation des meubles
 * (trajet jusqu'à l'accès, pose allongée, assise ou debout le temps de l'action, retour à l'accès). */
export function Habitant({ directions, destination, onArrivee, points = POINTS_RESIDENCE, avancer = avancerResidence, calculerChemin = cheminResidence, usage = null, onAccesAtteint, onAnnule, casque = false }: {
  directions: Set<string>; destination: number | null; onArrivee: (message: string) => void;
  points?: readonly (PointInterieur & { detail: string })[]; avancer?: typeof avancerResidence; calculerChemin?: typeof cheminResidence;
  usage?: UsageObjet | null; onAccesAtteint?: () => void; onAnnule?: () => void; casque?: boolean;
}) {
  const [marche,setMarche]=useState(false);
  const groupe = useRef<THREE.Group>(null), corps = useRef<THREE.Group>(null);
  const chemin = useRef<PointInterieur[]>([]);
  const marcheManuelle = useRef(false);
  const enRoute = useRef(false);
  const surMeuble = useRef<ObjetInterieur | null>(null);
  const notifier = useRef(onArrivee); notifier.current = onArrivee;
  const rappels = useRef({ onAccesAtteint, onAnnule }); rappels.current = { onAccesAtteint, onAnnule };
  useEffect(() => {
    if (destination === null) { chemin.current = []; return; }
    if (groupe.current) {
      enRoute.current = false;
      const cible = points[destination % points.length];
      chemin.current = calculerChemin(groupe.current.position, cible);
      if (!chemin.current.length) notifier.current(Math.hypot(groupe.current.position.x - cible.x, groupe.current.position.z - cible.z) < .2 ? cible.detail : 'Passage inaccessible. Déplacez-vous puis réessayez.');
    }
  }, [destination, points, calculerChemin]);
  const objetVise = usage?.phase === 'trajet' ? usage.objet : null;
  useEffect(() => {
    if (!objetVise || !groupe.current) return;
    const p = groupe.current.position;
    chemin.current = calculerChemin(p, objetVise.acces);
    enRoute.current = chemin.current.length > 0;
    if (enRoute.current) return;
    if (Math.hypot(p.x - objetVise.acces.x, p.z - objetVise.acces.z) < .25) rappels.current.onAccesAtteint?.();
    else { notifier.current('Ce meuble est inaccessible d’ici : rapproche-toi puis réessaie.'); rappels.current.onAnnule?.(); }
  }, [objetVise, calculerChemin]);
  useFrame((_, delta) => {
    if (!groupe.current) return;
    const p = groupe.current.position;
    let dx = Number(directions.has('droite')) - Number(directions.has('gauche'));
    let dz = Number(directions.has('arriere')) - Number(directions.has('avant'));
    const enAction = usage?.phase === 'action';
    // Bouger soi-même interrompt l'action en cours, comme dans un jeu de simulation de vie.
    if ((dx || dz) && (enAction || enRoute.current)) { enRoute.current = false; rappels.current.onAnnule?.(); }
    if (enAction && usage && !(dx || dz)) {
      const pose = usage.objet.usage;
      if (pose) { p.set(pose.x, pose.y, pose.z); groupe.current.rotation.y = pose.rotation; surMeuble.current = usage.objet; }
      else groupe.current.rotation.y = usage.objet.regard;
      if (corps.current) corps.current.rotation.x = usage.action.pose === 'allonge' ? -Math.PI / 2 : 0;
      if (marche) setMarche(false);
      return;
    }
    if (surMeuble.current) { const a = surMeuble.current.acces; p.set(a.x, 0, a.z); surMeuble.current = null; }
    if (corps.current) corps.current.rotation.x = 0;
    if (dx || dz) { if (!marcheManuelle.current) notifier.current('Déplacement manuel · choisissez une destination pour reprendre la visite.'); chemin.current = []; marcheManuelle.current = true; }
    else if (chemin.current.length) {
      const cible = chemin.current[0]; dx = cible.x - p.x; dz = cible.z - p.z;
      if (Math.hypot(dx, dz) < .06) {
        chemin.current.shift(); dx = dz = 0;
        if (!chemin.current.length) {
          if (enRoute.current) { enRoute.current = false; rappels.current.onAccesAtteint?.(); }
          else if (destination !== null) notifier.current(points[destination % points.length].detail);
        }
      }
    }
    const prochain = avancer(p, dx, dz, delta);
    if (!directions.size) marcheManuelle.current = false;
    const bouge = Math.hypot(prochain.x - p.x, prochain.z - p.z) > .001;
    if(bouge!==marche)setMarche(bouge);
    p.set(prochain.x, 0, prochain.z);
    if (bouge) groupe.current.rotation.y = Math.atan2(dx, dz);
  });
  const pose = usage?.phase === 'action' ? usage.action.pose : null;
  // Le joueur garde le personnage qu'il a choisi ; à l'intérieur, il retire son casque (sauf sur un chantier).
  return <group ref={groupe} position={[0, 0, 3.8]}>
    <group ref={corps}><HumainJoueur casque={casque} marche={marche} assis={pose === 'assis'} prof={pose === 'parle'} /></group>
  </group>;
}

export function ResidenceRealiste({ directions, destination, onArrivee, interactions }: { directions: Set<string>; destination: number | null; onArrivee: (message: string) => void; interactions?: InteractionsInterieur }) {
  const { camera, size } = useThree();
  const cible = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  useEffect(() => {
    // Fit the complete apartment on portrait screens instead of clipping its rooms.
    const recul = Math.max(1, 1.2 / (size.width / size.height));
    camera.position.set(0, 12 * recul, 12 * recul); camera.lookAt(cible);
  }, [camera, size.width, size.height, cible]);
  const enCours = interactions?.usage?.phase === 'action' ? interactions.usage.action.id : null;
  return <>
    <color attach="background" args={['#343d3c']} />
    <hemisphereLight args={['#e6f0f4', '#7b6651', 1.3]} /><ambientLight intensity={.45} />
    <directionalLight position={[-3, 8, -3]} intensity={3} color="#fff1d5" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.035} />
    <directionalLight position={[2, 5, 8]} intensity={.7} color="#d4e5ee" />
    <Appartement teleAllumee={enCours === 'tele'} /><VieInterieure type="habitation" />
    {interactions && <ZonesObjets objets={interactions.objets} selection={interactions.selection} usage={interactions.usage} onChoisir={interactions.onChoisir} />}
    {enCours === 'douche' && <JetDouche p={[PLAN.douche.x, .2, PLAN.douche.z]} />}
    {enCours === 'cuisiner' && <Vapeur p={[PLAN.cuisine.x, 1.14, PLAN.cuisine.z + 1.2]} />}
    <Habitant directions={directions} destination={destination} onArrivee={onArrivee} usage={interactions?.usage} onAccesAtteint={interactions?.onAccesAtteint} onAnnule={interactions?.onAnnule} />
  </>;
}
