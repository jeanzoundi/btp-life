'use client';

import { Component, Suspense, useLayoutEffect, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import { PersonnageRealiste } from './personnage-realiste';
import { PersonnageStylise } from './personnage-stylise';

type Version = 'stylise' | 'jeu' | 'studio';
type Cadrage = 'portrait' | 'silhouette';
const VERSIONS: { id: Version; nom: string }[] = [
  { id: 'stylise', nom: 'Ancien stylisé' }, { id: 'jeu', nom: 'Modèle actuel' }, { id: 'studio', nom: 'Essai détaillé' },
];

class ErreurModele extends Component<{ children: ReactNode }, { erreur: boolean }> {
  state = { erreur: false };
  static getDerivedStateFromError() { return { erreur: true }; }
  render() {
    return this.state.erreur ? <Html center><p role="alert" className="w-64 rounded-xl bg-white p-4 text-sm text-red-900">Le modèle n’a pas pu être chargé. Recharge la page ou choisis une autre version.</p></Html> : this.props.children;
  }
}

/** Recadre au changement de vue ou de largeur, jamais lors d'une comparaison de version. */
function CameraStudio({ cadrage }: { cadrage: Cadrage }) {
  const { camera, size, controls } = useThree();
  useLayoutEffect(() => {
    const portrait = cadrage === 'portrait', aspect = Math.max(.35, size.width / size.height);
    const recul = portrait ? Math.max(1.35, .85 / aspect) : Math.max(4.15, 2.4 / aspect);
    camera.position.set(portrait ? .16 : .55, portrait ? 1.68 : 1.35, recul);
    const cible = new THREE.Vector3(0, portrait ? 1.58 : .94, 0);
    camera.lookAt(cible);
    const orbit = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    orbit?.target.copy(cible); orbit?.update();
    camera.updateProjectionMatrix();
  }, [camera, controls, size.width, size.height, cadrage]);
  return null;
}

export default function StudioPersonnage() {
  const [version, setVersion] = useState<Version>('studio');
  const [cadrage, setCadrage] = useState<Cadrage>('portrait');
  const [anime, setAnime] = useState(false);
  const [casque, setCasque] = useState(true);
  return <main className="min-h-screen bg-[#12282a] text-[#f4eee2]">
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
      <div><p className="text-xs uppercase tracking-[.24em] text-[#d6b06b]">BTP LIFE · Personnage témoin</p><h1 className="mt-1 text-2xl font-semibold">Jean — étude de réalisme</h1></div>
      <Link href="/direction-artistique" className="text-sm underline underline-offset-4">Voir le quartier et les personnages</Link>
    </header>
    <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pb-4" role="group" aria-label="Version du personnage">
      {VERSIONS.map(v => <button key={v.id} aria-pressed={version === v.id} onClick={() => setVersion(v.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${version === v.id ? 'bg-[#e8bd72] text-[#142c2c]' : 'bg-white/10'}`}>{v.nom}</button>)}
    </div>
    <section className="relative mx-3 overflow-hidden rounded-2xl bg-[#263b3c]" style={{ height: 'min(65vh, 760px)', minHeight: 360 }} aria-label="Comparateur 3D du personnage">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [.16, 1.68, 1.35], fov: 32, near: .05, far: 100 }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1; }}>
        <color attach="background" args={['#263b3c']} />
        <hemisphereLight args={['#dbe6ee', '#6c5e4e', .55]} />
        <directionalLight position={[-3, 5, 5]} color="#fff2dd" intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} shadow-normalBias={.018} />
        <directionalLight position={[3, 2.5, 2]} color="#c9e6f2" intensity={.7} />
        <directionalLight position={[1.5, 4, -3]} color="#f9d598" intensity={1.8} />
        <ErreurModele key={version}>
          <Suspense fallback={<Html center><p role="status" className="rounded-lg bg-[#12282a] px-4 py-3 text-sm text-white">Chargement du personnage…</p></Html>}>
            <group rotation={[0, -.12, 0]}>
              {version === 'stylise' ? <PersonnageStylise identite="batisseur" marche={anime} /> : <PersonnageRealiste key={`${version}-${anime}`} modele="ouvrier-casque" niveauDetail={version === 'studio' ? 'studio' : 'jeu'} marche={anime} pauseAnimation={!anime} sansCasque={!casque} />}
            </group>
          </Suspense>
        </ErreurModele>
        <Suspense fallback={null}><Environment files="/materials/ciel-kloofendal-1k.hdr" environmentIntensity={.35} /></Suspense>
        <ContactShadows position={[0, -.015, 0]} opacity={.5} scale={6} blur={2.3} far={3} resolution={512} frames={Infinity} />
        <mesh position={[0, -.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#263b3c" roughness={.95} /></mesh>
        <OrbitControls makeDefault target={[0, 1.58, 0]} enablePan={false} minDistance={.65} maxDistance={12} maxPolarAngle={Math.PI * .61} />
        <CameraStudio cadrage={cadrage} />
      </Canvas>
      <span className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-[#12282a]/90 px-3 py-2 text-xs">Glisser pour tourner · Pincer ou molette pour zoomer</span>
    </section>
    <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 py-4" role="group" aria-label="Cadrage et animation">
      {(['portrait', 'silhouette'] as const).map(c => <button key={c} aria-pressed={cadrage === c} onClick={() => setCadrage(c)} className={`rounded-lg border px-4 py-2 text-sm ${cadrage === c ? 'border-[#e8bd72] bg-white/10' : 'border-white/20'}`}>{c === 'portrait' ? 'Visage' : 'Corps entier'}</button>)}
      <button aria-pressed={anime} onClick={() => setAnime(v => !v)} className="rounded-lg border border-white/20 px-4 py-2 text-sm">{anime ? 'Figer la pose' : 'Voir la marche'}</button>
      <button disabled={version === 'stylise'} aria-pressed={!casque} onClick={() => setCasque(v => !v)} className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-40">{casque ? 'Masquer le casque' : 'Remettre le casque'}</button>
    </div>
    <p className="mx-auto max-w-6xl px-5 pb-6 text-sm leading-relaxed text-[#c2ceca]">Essai détaillé : textures d’origine 2K du visage et des vêtements, relief conservé, finitions peau / tissu / casque différenciées. Même caméra et même éclairage pour comparer. Prototype de revue, pas encore appliqué au jeu. Base <a href="https://github.com/microsoft/Microsoft-Rocketbox" className="underline">Microsoft Rocketbox (MIT)</a>.</p>
  </main>;
}
