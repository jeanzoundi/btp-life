'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ajusterResolution, type QualiteMonde } from '@/lib/fluidite-monde';

type Mesure = { fps: number; appels: number; triangles: number; dpr: number };
const EVENEMENT = 'btp-mesure-rendu';

export function FluiditeMonde({ qualite, actif }: { qualite: QualiteMonde; actif: boolean }) {
  const { setDpr, setFrameloop, gl } = useThree();
  const resolution = useRef(1);
  const plafond = useRef(1.5);
  const echantillon = useRef({ duree: 0, images: 0, chauffe: 0 });
  useEffect(() => {
    plafond.current = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5);
    resolution.current = qualite === 'fluide' ? 1 : plafond.current;
    setDpr(resolution.current);
    echantillon.current = { duree: 0, images: 0, chauffe: 0 };
  }, [qualite, setDpr]);
  useEffect(() => {
    const visibilite = () => {
      setFrameloop(actif && !document.hidden ? 'always' : 'never');
      echantillon.current = { duree: 0, images: 0, chauffe: 0 };
    };
    visibilite();
    document.addEventListener('visibilitychange', visibilite);
    return () => document.removeEventListener('visibilitychange', visibilite);
  }, [actif, setFrameloop]);
  useFrame((_, delta) => {
    if (!actif || document.hidden || delta > 1) return;
    const m = echantillon.current;
    m.chauffe += delta;
    if (m.chauffe < 3) return;
    m.duree += delta; m.images++;
    if (m.duree < 4) return;
    const fps = m.images / m.duree;
    window.dispatchEvent(new CustomEvent<Mesure>(EVENEMENT, { detail: {
      fps: Math.round(fps), appels: gl.info.render.calls, triangles: gl.info.render.triangles, dpr: resolution.current,
    } }));
    if (qualite === 'auto') {
      const prochain = ajusterResolution(resolution.current, fps, plafond.current);
      if (prochain !== resolution.current) { resolution.current = prochain; setDpr(prochain); }
    }
    m.duree = 0; m.images = 0;
  });
  return null;
}

/** Isolated state: measuring FPS must not rerender the entire city. */
export function StatistiquesRendu() {
  const [mesure, setMesure] = useState<Mesure>();
  useEffect(() => {
    const mesurer = (e: Event) => setMesure((e as CustomEvent<Mesure>).detail);
    window.addEventListener(EVENEMENT, mesurer);
    return () => window.removeEventListener(EVENEMENT, mesurer);
  }, []);
  return <p data-testid="performance-monde" className="px-2 text-[10px] leading-relaxed text-white/55">
    {mesure ? `${mesure.fps} images/s · ${mesure.appels} appels de dessin · résolution ×${mesure.dpr.toFixed(2)}` : 'Mesure de fluidité en cours…'}
  </p>;
}
