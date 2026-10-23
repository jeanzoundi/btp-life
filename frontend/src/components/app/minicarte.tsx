'use client';

import { useEffect, useRef, type MouseEvent, type MutableRefObject } from 'react';
import type * as THREE from 'three';
import { batimentSous, mondeDepuisCarte, RAYON_MINICARTE, transformationCarte, type Point2 } from '@/lib/minicarte';

export interface BatimentCarte { slug: string; nom: string; position: readonly [number, number, number]; taille: readonly [number, number, number]; type: string }

const TEINTES: Record<string, string> = { commerce: '#E0A25A', maison: '#D9875C', campus: '#CDB98F', tour: '#A9BCC6', chantier: '#E2653C' };

/** Minicarte vivante : la ville autour du joueur, tournée comme la caméra. Toucher un lieu y envoie le joueur. */
export function Minicarte({ taille, batiments, reperes, cible, lieuCible, nomsPnj, destination, joueur, vue, pnj, nomQuartier, onBatiment, onPoint }: {
  taille: number; batiments: readonly BatimentCarte[]; reperes: readonly { id: string; position: Point2; trouve: boolean }[];
  cible: Point2 | null; lieuCible?: string; nomsPnj: readonly string[]; destination: MutableRefObject<Point2 | null>;
  joueur: MutableRefObject<THREE.Vector3>; vue: MutableRefObject<{ azimut: number }>; pnj: MutableRefObject<Map<string, THREE.Vector3>>;
  nomQuartier: string; onBatiment: (slug: string) => void; onPoint: (point: Point2) => void;
}) {
  const monde = useRef<SVGGElement>(null), fleche = useRef<SVGGElement>(null), marque = useRef<SVGGElement>(null);
  const nord = useRef<SVGGElement>(null), habitants = useRef<SVGGElement>(null);
  const echelle = taille / 2 / RAYON_MINICARTE, centre = taille / 2;
  const cap = useRef({ angle: -Math.PI / 2, precedent: null as Point2 | null });
  useEffect(() => {
    let image = 0, dernier = -Infinity;
    const dessiner = (instant: number) => {
      image = requestAnimationFrame(dessiner);
      if (instant - dernier < 33) return;
      dernier = instant;
      const p: Point2 = [joueur.current.x, joueur.current.z], azimut = vue.current.azimut;
      monde.current?.setAttribute('transform', transformationCarte(p, azimut, echelle, centre));
      // Le cap suit le déplacement réel, lissé par le seuil : la flèche ne tremble pas à l'arrêt.
      const precedent = cap.current.precedent;
      if (precedent && Math.hypot(p[0] - precedent[0], p[1] - precedent[1]) > .04) cap.current.angle = Math.atan2(p[1] - precedent[1], p[0] - precedent[0]);
      cap.current.precedent = p;
      fleche.current?.setAttribute('transform', `translate(${p[0]} ${p[1]}) rotate(${cap.current.angle * 180 / Math.PI + 90}) scale(${1 / echelle})`);
      const d = destination.current;
      if (marque.current) {
        marque.current.style.display = d ? '' : 'none';
        if (d) marque.current.setAttribute('transform', `translate(${d[0]} ${d[1]}) scale(${1 / echelle})`);
      }
      // Le nord reste lisible : on déplace la pastille sans la faire tourner.
      const rayon = centre - 11;
      nord.current?.setAttribute('transform', `translate(${centre + rayon * Math.sin(azimut)} ${centre - rayon * Math.cos(azimut)})`);
      if (habitants.current) for (const point of Array.from(habitants.current.children) as SVGCircleElement[]) {
        const position = pnj.current.get(point.dataset.nom ?? '');
        if (position) { point.setAttribute('cx', position.x.toFixed(1)); point.setAttribute('cy', position.z.toFixed(1)); }
      }
    };
    image = requestAnimationFrame(dessiner);
    return () => cancelAnimationFrame(image);
  }, [joueur, vue, destination, pnj, echelle, centre]);
  const toucher = (e: MouseEvent<SVGSVGElement>) => {
    const cadre = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - cadre.left) * taille / cadre.width - centre, y = (e.clientY - cadre.top) * taille / cadre.height - centre;
    const point = mondeDepuisCarte(x, y, [joueur.current.x, joueur.current.z], vue.current.azimut, echelle);
    const batiment = batimentSous(point, batiments);
    if (batiment) onBatiment(batiment.slug); else onPoint(point);
  };
  return <div className="hud-verre pointer-events-auto p-1.5" style={{ width: taille + 14 }}>
    <svg viewBox={`0 0 ${taille} ${taille}`} width={taille} height={taille} role="img" aria-label={`Minicarte, ${nomQuartier}. Touche un lieu pour t’y rendre.`} onClick={toucher} className="block cursor-crosshair rounded-[12px]">
      <defs>
        <clipPath id="hud-clip-carte"><rect width={taille} height={taille} rx="12" /></clipPath>
        <radialGradient id="hud-vignette-carte"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".5" /></radialGradient>
      </defs>
      <g clipPath="url(#hud-clip-carte)">
        <rect width={taille} height={taille} fill="#26301F" />
        <g ref={monde}>
          {/* Sol, ville pavée, chaussées, promenade, plage et lagune, aux cotes du décor 3D. */}
          <rect x="-150" y="-170" width="300" height="260" fill="#33402B" />
          <rect x="-120" y="-128" width="240" height="176" fill="#5A4F42" />
          {[-66, -10, 10].map(z => <rect key={z} x="-120" y={z - 3} width="240" height="6" fill="#8E8577" />)}
          {[-54, 54].map(x => <rect key={x} x={x - 3} y="-128" width="6" height="176" fill="#8E8577" />)}
          <rect x="-120" y="44.5" width="240" height="5" fill="#8C7559" />
          <rect x="-120" y="48" width="240" height="20" fill="#C9A86A" opacity=".8" />
          <rect x="-150" y="67" width="300" height="40" fill="#2C7C7E" />
          <circle r="6" fill="#A28F70" />
          {batiments.map(b => <rect key={b.slug} x={b.position[0] - b.taille[0] / 2} y={b.position[2] - b.taille[2] / 2} width={b.taille[0]} height={b.taille[2]} rx="1.2"
            fill={TEINTES[b.type] ?? '#C7B79A'} stroke={b.slug === lieuCible ? '#F6CF7A' : '#1C1511'} strokeWidth={b.slug === lieuCible ? 1.8 : .6} opacity=".92" />)}
          {reperes.map(r => <path key={r.id} d="M0 -3.2 3.2 0 0 3.2 -3.2 0Z" transform={`translate(${r.position[0]} ${r.position[1]})`} fill={r.trouve ? '#7A6F5E' : '#F2C14E'} stroke="#1C1511" strokeWidth=".5" />)}
          {cible && <g transform={`translate(${cible[0]} ${cible[1]}) scale(${1 / echelle})`}>
            <circle r="7" fill="none" stroke="#F6CF7A" strokeWidth="2" className="hud-onde" />
            <circle r="4" fill="#E8B04A" stroke="#1C1511" strokeWidth="1.2" />
          </g>}
          <g ref={habitants}>{nomsPnj.map(nom => <circle key={nom} data-nom={nom} r="1.7" fill="#F6E7C8" stroke="#1C1511" strokeWidth=".5" />)}</g>
          <g ref={marque} style={{ display: 'none' }}><circle r="6" fill="none" stroke="#FBF5EA" strokeWidth="1.6" strokeDasharray="2.5 2" /></g>
          <g ref={fleche}><circle r="10" fill="#E2653C" opacity=".22" /><path d="M0 -8 6 6 0 2.6 -6 6Z" fill="#FBF5EA" stroke="#E2653C" strokeWidth="1.6" strokeLinejoin="round" /></g>
        </g>
        <rect width={taille} height={taille} fill="url(#hud-vignette-carte)" pointerEvents="none" />
        <g ref={nord} pointerEvents="none"><circle r="7.5" fill="#1C1511" stroke="#E8B04A" strokeWidth="1" /><text y="3" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#E8B04A">N</text></g>
      </g>
    </svg>
    <p className="hud-legende mt-1 truncate px-1 text-center text-[9.5px] text-jeu-ivoire/75">{nomQuartier}</p>
  </div>;
}
