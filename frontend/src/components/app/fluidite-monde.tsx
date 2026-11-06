'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ajusterResolution, plafondResolution, type QualiteMonde } from '@/lib/fluidite-monde';
import { ajusterEffets, niveauInitial, type NiveauEffets } from '@/lib/rendu-monde';
import { RenduAvance } from './rendu-avance';

type Mesure = { fps: number; appels: number; triangles: number; dpr: number; effets: NiveauEffets };
const EVENEMENT = 'btp-mesure-rendu';
const LIBELLES_EFFETS: Record<NiveauEffets, string> = {
  0: 'sans effets',
  1: 'halo + lissage',
  2: 'occlusion ½ + halo + lissage',
  3: 'occlusion + halo + lissage',
};

export function FluiditeMonde({ qualite, actif, nuit = false, rayonOcclusion = 1 }: { qualite: QualiteMonde; actif: boolean; nuit?: boolean; rayonOcclusion?: number }) {
  const { setDpr, setFrameloop, gl } = useThree();
  const resolution = useRef(1);
  const plafond = useRef(1.5);
  const echantillon = useRef({ duree: 0, images: 0, chauffe: 0 });
  const [niveau, setNiveau] = useState<NiveauEffets>(0);
  const niveauRef = useRef<NiveauEffets>(0);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    plafond.current = plafondResolution(window.devicePixelRatio, window.innerWidth < 768);
    resolution.current = qualite === 'fluide' ? 1 : plafond.current;
    setDpr(resolution.current);
    const estMobile = window.innerWidth < 768 || Boolean(window.matchMedia?.('(pointer: coarse)').matches);
    setMobile(estMobile);
    niveauRef.current = niveauInitial(qualite, estMobile);
    setNiveau(niveauRef.current);
    echantillon.current = { duree: 0, images: 0, chauffe: 0 };
  }, [qualite, setDpr]);
  // Sur téléphone, sans chaîne d'effets, les ombres ne se recalculent qu'une image sur trois (RenduAvance le fait sinon).
  const image = useRef(0);
  useEffect(() => {
    if (!mobile || niveau > 0) return;
    const avant = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    return () => { gl.shadowMap.autoUpdate = avant; gl.shadowMap.needsUpdate = true; };
  }, [gl, mobile, niveau]);
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
    if (mobile && niveauRef.current === 0) gl.shadowMap.needsUpdate = image.current++ % 3 === 0;
    if (!actif || document.hidden || delta > 1) return;
    const m = echantillon.current;
    m.chauffe += delta;
    if (m.chauffe < 3) return;
    m.duree += delta; m.images++;
    if (m.duree < 4) return;
    const fps = m.images / m.duree;
    window.dispatchEvent(new CustomEvent<Mesure>(EVENEMENT, { detail: {
      fps: Math.round(fps), appels: gl.info.render.calls, triangles: gl.info.render.triangles, dpr: resolution.current, effets: niveauRef.current,
    } }));
    if (qualite === 'auto') {
      // Quand l'image ralentit : d'abord la résolution jusqu'à 1, puis les effets un à un, et seulement ensuite sous 1.
      const net = Math.min(1, plafond.current);
      const prochain = ajusterResolution(resolution.current, fps, plafond.current, niveauRef.current > 0 ? net : .8);
      if (prochain !== resolution.current) { resolution.current = prochain; setDpr(prochain); }
      const effets = ajusterEffets(niveauRef.current, fps, resolution.current, net);
      if (effets !== niveauRef.current) { niveauRef.current = effets; setNiveau(effets); m.chauffe = 0; }
    }
    m.duree = 0; m.images = 0;
  });
  return niveau > 0 ? <RenduAvance niveau={niveau} nuit={nuit} rayonOcclusion={rayonOcclusion} nettete={mobile ? .75 : .5} cadenceOmbres={mobile ? 3 : 1} /> : null;
}

/** Isolated state: measuring FPS must not rerender the entire city. */
export function StatistiquesRendu() {
  const [mesure, setMesure] = useState<Mesure>();
  useEffect(() => {
    const mesurer = (e: Event) => setMesure((e as CustomEvent<Mesure>).detail);
    window.addEventListener(EVENEMENT, mesurer);
    return () => window.removeEventListener(EVENEMENT, mesurer);
  }, []);
  return <p data-testid="performance-monde" className="px-1 text-[10.5px] leading-relaxed text-jeu-ivoire/55">
    {mesure ? `${mesure.fps} images/s · ${mesure.appels} appels de dessin · résolution ×${mesure.dpr.toFixed(2)} · ${LIBELLES_EFFETS[mesure.effets]}` : 'Mesure de fluidité en cours…'}
  </p>;
}
