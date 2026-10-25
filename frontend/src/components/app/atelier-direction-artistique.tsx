'use client';

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import Link from 'next/link';
import { HumainMonde, HumainReference } from './humain-monde';
import { Architecture, ApercuPlaceCentrale } from './ville-lagune';

const PERSONNAGES = [
  { nom: 'Jean', role: 'Le bâtisseur', couleur: '#ef9e24', variante: 0, casque: true },
  { nom: 'Awa', role: 'L’architecte', couleur: '#f5ede0', variante: 1 },
  { nom: 'Yao', role: 'Le chef de chantier', couleur: '#e5682d', variante: 2, casque: true },
  { nom: 'Mariam', role: 'L’entrepreneuse', couleur: '#0e796f', variante: 3 },
  { nom: 'Fatou', role: 'La commerçante', couleur: '#cb4a52', variante: 4 },
];

/** Atelier de revue : cadrages et lumière fixes pour comparer les modèles, sans sauvegarde de jeu. */
export default function AtelierDirectionArtistique() {
  const [vue, setVue] = useState<'personnages' | 'rue'>('personnages');
  const [index, setIndex] = useState<number | null>(null);
  const [marche, setMarche] = useState(false);
  const [avant, setAvant] = useState(false);
  const Modele = avant ? HumainReference : HumainMonde;
  return <main className="min-h-screen bg-[#f4edde] text-[#163d38]">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#173e38]/15 px-6 py-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[.3em]">BTP LIFE · Atelier visuel</p><h1 className="mt-1 text-2xl font-bold">Les visages et les rues d’Abidjan</h1></div>
      <div className="flex flex-wrap gap-2"><Link href="/personnage-studio" className="rounded-full bg-[#e89e33] px-5 py-3 text-sm font-bold">Étude de réalisme →</Link><Link href="/simulation-preview" className="rounded-full bg-[#173e38] px-5 py-3 text-sm font-bold text-[#fff8e8]">Explorer le jeu →</Link></div>
    </header>
    <div className="flex flex-wrap items-center gap-2 px-6 py-4">
      {(['personnages', 'rue'] as const).map(v => <button key={v} aria-pressed={vue === v} onClick={() => { setVue(v); setIndex(null); }} className={`rounded-full px-5 py-2 text-sm font-bold ${vue === v ? 'bg-[#e89e33] text-[#1a342c]' : 'bg-white'}`}>{v === 'personnages' ? 'Les personnages' : 'La place des Palmiers'}</button>)}
      {vue === 'personnages' && <button onClick={() => setMarche(v => !v)} aria-pressed={marche} className="ml-auto rounded-full border border-[#173e38]/25 px-4 py-2 text-sm">{marche ? 'Arrêter la marche' : 'Voir la marche'}</button>}
      <div className="flex rounded-full bg-[#daceba] p-1" role="group" aria-label="Comparaison visuelle">
        <button aria-pressed={avant} onClick={() => setAvant(true)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${avant ? 'bg-white' : ''}`}>Avant</button>
        <button aria-pressed={!avant} onClick={() => setAvant(false)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${!avant ? 'bg-[#173e38] text-white' : ''}`}>Après</button>
      </div>
    </div>
    <section aria-label={vue === 'personnages' ? 'Modèles 3D des personnages' : 'Place commerçante en 3D'} className="relative mx-4 overflow-hidden rounded-3xl bg-[#e7d9c0]" style={{ height: 'min(68vh, 720px)', minHeight: 380 }}>
      <Canvas key={`${vue}-${index}`} shadows dpr={[1, 1.5]} camera={{ position: vue === 'rue' ? [17, 22, 33] : index === null ? [0, 2.5, 9] : [1.65, 1.8, 3.3], fov: vue === 'rue' ? 48 : 32 }} gl={{ antialias: true }}>
        <color attach="background" args={['#e7d9c0']} />
        <hemisphereLight args={['#fff6dc', '#80624d', 1.65]} />
        <directionalLight position={[-8, 14, 10]} intensity={2.7} color="#fff0d1" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-normalBias={.03} />
        <directionalLight position={[8, 6, -5]} intensity={1.5} color="#b4d8e2" />
        <Suspense fallback={null}>
          {vue === 'personnages' ? <>
            {PERSONNAGES.filter((_, i) => index === null || i === index).map((p, i) => <group key={p.nom} position={[index === null ? (i - 2) * 1.3 : 0, .04, 0]} rotation={[0, -.16, 0]}><Modele {...p} marche={marche} /><mesh position={[0, -.04, 0]} receiveShadow><cylinderGeometry args={[.52, .56, .08, 48]} /><meshStandardMaterial color="#cfb995" roughness={.9} /></mesh></group>)}
            <ContactShadows position={[0, -.015, 0]} opacity={.45} scale={18} blur={2.5} far={3} resolution={512} frames={1} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.06, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#e7d9c0" /></mesh>
          </> : <>
            <ApercuPlaceCentrale artistique={!avant} />
            <group position={[-29, 0, -23]}><Architecture width={17} height={8} depth={12} kind="campus" color="#d8c092" slug="universite" /></group>
            <group position={[29, 0, -24]}><Architecture width={13} height={18} depth={11} kind="tour" color="#53677a" slug="entreprise" /></group>
            <Modele couleur="#ef9e24" casque variante={0} />
          </>}
        </Suspense>
        <OrbitControls makeDefault target={vue === 'rue' ? [0, 1, -2] : [0, 1, 0]} minDistance={2} maxDistance={vue === 'rue' ? 70 : 14} maxPolarAngle={Math.PI / 2 - .03} />
      </Canvas>
      <span className="pointer-events-none absolute bottom-4 left-5 rounded-full bg-[#fff7e5]/90 px-3 py-2 text-xs">Glisser pour tourner · Molette pour approcher</span>
      <span className="pointer-events-none absolute top-4 left-5 rounded-full bg-[#173e38] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">{avant ? 'Modèles précédents' : 'Nouvelle direction artistique'}</span>
    </section>
    {vue === 'personnages' ? <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 px-4 py-5">
      <button onClick={() => setIndex(null)} className={`rounded-xl border px-4 py-2 text-sm ${index === null ? 'border-[#176557] bg-[#dbe8dc]' : 'border-transparent bg-white'}`}>Ensemble</button>
      {PERSONNAGES.map((p, i) => <button key={p.nom} onClick={() => setIndex(i)} aria-pressed={index === i} className={`rounded-xl border px-4 py-2 text-left ${index === i ? 'border-[#176557] bg-[#dbe8dc]' : 'border-transparent bg-white'}`}><b className="block text-sm">{p.nom}</b><span className="text-xs opacity-70">{p.role}</span></button>)}
    </div> : <p className="px-6 py-5 text-sm">Place des Palmiers · Comptoirs de quartier, terrasses ombragées et ateliers ouverts sur la rue.</p>}
  </main>;
}
