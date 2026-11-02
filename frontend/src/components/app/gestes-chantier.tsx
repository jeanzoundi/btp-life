'use client';

import { useRef, useState, type PointerEvent as PointerReact, type ReactNode } from 'react';
import type { GesteChantier } from '@/lib/gestes-chantier';

// Les gestes du chantier à la main : on glisse, on tend, on règle, puis on valide. La valeur relevée part telle quelle au
// serveur, qui la juge à la tolérance près (lib/gestes-chantier.ts). Chaque geste a aussi des boutons de réglage fin, pour
// le doigt sur téléphone.

const fr = (v: number, decimales = 2) => v.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** Position du pointeur dans le repère d'un SVG (sa viewBox), quelle que soit sa taille à l'écran. */
function pointSvg(e: PointerReact<SVGSVGElement>) {
  const svg = e.currentTarget, p = svg.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  const m = svg.getScreenCTM();
  return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}

/** Un SVG qu'on manipule en glissant le doigt ou la souris : `onPoint` reçoit chaque position tant qu'on appuie. */
function Plan({ largeur, hauteur, onPoint, children, libelle }: { largeur: number; hauteur: number; onPoint: (x: number, y: number) => void; children: ReactNode; libelle: string }) {
  const appui = useRef(false);
  const suivre = (e: PointerReact<SVGSVGElement>) => { if (!appui.current) return; const p = pointSvg(e); onPoint(p.x, p.y); };
  return <svg viewBox={`0 0 ${largeur} ${hauteur}`} role="img" aria-label={libelle} className="w-full touch-none select-none rounded-xl bg-[#1d2a2c]"
    onPointerDown={e => { appui.current = true; e.currentTarget.setPointerCapture(e.pointerId); suivre(e); }} onPointerMove={suivre}
    onPointerUp={() => { appui.current = false; }} onPointerCancel={() => { appui.current = false; }}>{children}</svg>;
}

function Reglage({ libelle, onMoins, onPlus }: { libelle: string; onMoins: () => void; onPlus: () => void }) {
  return <div className="flex items-center justify-center gap-2 text-[12px]">
    <button type="button" onClick={onMoins} className="hud-bouton hud-bouton-verre h-8 w-10 rounded-lg" aria-label={`${libelle} : moins`}>−</button>
    <span className="text-jeu-ivoire/60">{libelle}</span>
    <button type="button" onClick={onPlus} className="hud-bouton hud-bouton-verre h-8 w-10 rounded-lg" aria-label={`${libelle} : plus`}>+</button>
  </div>;
}

/** Mesurer : on déroule le mètre ruban depuis le bord gauche jusqu'au bord droit de l'objet, puis on lit la mesure. */
function Mesurer({ geste, valeur, setValeur }: { geste: GesteChantier; valeur: number | null; setValeur: (v: number) => void }) {
  const { longueur, objet } = geste.mesure!;
  const max = longueur < 2 ? 1.6 : 6, x0 = 16, echelle = 268 / max;
  const lu = valeur ?? 0, fin = x0 + lu * echelle;
  const graduations = Array.from({ length: Math.round(max / (max < 2 ? .1 : .5)) + 1 }, (_, i) => i * (max < 2 ? .1 : .5));
  return <>
    <Plan largeur={300} hauteur={130} libelle={`${objet} à mesurer`} onPoint={x => setValeur(Math.round(Math.max(0, Math.min(max, (x - x0) / echelle)) * 100) / 100)}>
      <rect x={x0} y={18} width={longueur * echelle} height={44} fill="#8a6a4a" stroke="#c9a57a" />
      <text x={x0 + 4} y={34} fontSize={10} fill="#f6ead5">{objet}</text>
      <line x1={x0 + longueur * echelle} x2={x0 + longueur * echelle} y1={10} y2={70} stroke="#ffd47a" strokeWidth={1.5} strokeDasharray="3 2" />
      <rect x={x0} y={74} width={Math.max(0, fin - x0)} height={18} fill="#f2c230" />
      {graduations.map(g => <g key={g}><line x1={x0 + g * echelle} x2={x0 + g * echelle} y1={74} y2={g % (max < 2 ? .5 : 1) < 1e-6 ? 92 : 82} stroke="#2b1d0e" strokeWidth={.8} />
        {g % (max < 2 ? .5 : 1) < 1e-6 && <text x={x0 + g * echelle + 2} y={104} fontSize={8} fill="#f6ead5">{fr(g, max < 2 ? 1 : 0)}</text>}</g>)}
      <rect x={fin - 5} y={70} width={10} height={26} rx={2} fill="#e2653c" />
      <text x={150} y={124} fontSize={11} fill="#ffd47a" textAnchor="middle">{`Lecture : ${fr(lu)} m`}</text>
    </Plan>
    <Reglage libelle="1 cm" onMoins={() => setValeur(Math.max(0, Math.round((lu - .01) * 100) / 100))} onPlus={() => setValeur(Math.min(max, Math.round((lu + .01) * 100) / 100))} />
  </>;
}

/** Tracer : le cordeau part de la chaise A ; on le tend jusqu'à la chaise B. La valeur, c'est son angle. */
function Tracer({ geste, valeur, setValeur }: { geste: GesteChantier; valeur: number | null; setValeur: (v: number) => void }) {
  const { a, b } = geste.trace!, m = 24, ox = 10, oy = 250;
  const px = (p: [number, number]) => [ox + p[0] * m, oy - p[1] * m] as const;
  const [ax, ay] = px(a), [bx, by] = px(b);
  const angle = valeur ?? 0, rad = angle * Math.PI / 180, long = 220;
  return <>
    <Plan largeur={260} hauteur={262} libelle="Implantation : chaises A et B" onPoint={(x, y) => setValeur(Math.round(Math.atan2(oy - y - a[1] * m, x - ox - a[0] * m) * 1800 / Math.PI) / 10)}>
      {Array.from({ length: 11 }, (_, i) => <g key={i}><line x1={ox + i * m} x2={ox + i * m} y1={oy - 240} y2={oy} stroke="#2f4446" /><line x1={ox} x2={ox + 240} y1={oy - i * m} y2={oy - i * m} stroke="#2f4446" /></g>)}
      <line x1={ax} y1={ay} x2={ax + Math.cos(rad) * long} y2={ay - Math.sin(rad) * long} stroke="#f2f2ee" strokeWidth={1.5} />
      {[[ax, ay, 'A'], [bx, by, 'B']].map(([x, y, n]) => <g key={n as string}><rect x={(x as number) - 5} y={(y as number) - 5} width={10} height={10} fill="#c9573a" /><text x={(x as number) + 8} y={(y as number) - 6} fontSize={11} fill="#ffd47a">{n}</text></g>)}
      <text x={130} y={14} fontSize={11} fill="#ffd47a" textAnchor="middle">{`Cordeau : ${fr(angle, 1)}°`}</text>
    </Plan>
    <Reglage libelle="0,5°" onMoins={() => setValeur(Math.round((angle - .5) * 10) / 10)} onPlus={() => setValeur(Math.round((angle + .5) * 10) / 10)} />
  </>;
}

/** Contrôler : la cale rattrape l'écart ; la bulle se centre quand la cale vaut l'écart. */
function Controler({ geste, valeur, setValeur }: { geste: GesteChantier; valeur: number | null; setValeur: (v: number) => void }) {
  const cale = valeur ?? 0, reste = geste.attendu - cale, bulle = Math.max(-46, Math.min(46, reste * 3));
  return <>
    <svg viewBox="0 0 300 120" role="img" aria-label={geste.aplomb!.objet} className="w-full rounded-xl bg-[#1d2a2c]">
      <g transform={`rotate(${Math.max(-8, Math.min(8, reste * .3))} 150 70)`}>
        <rect x={60} y={58} width={180} height={22} rx={3} fill="#e8b04a" stroke="#8a6421" />
        <rect x={104} y={62} width={92} height={14} rx={7} fill="#cfe9c8" stroke="#5c7a55" />
        <line x1={140} x2={140} y1={62} y2={76} stroke="#2b1d0e" /><line x1={160} x2={160} y1={62} y2={76} stroke="#2b1d0e" />
        <circle cx={150 + bulle} cy={69} r={5} fill="#f6fff2" stroke="#7aa36f" />
      </g>
      <text x={150} y={22} fontSize={11} fill="#ffd47a" textAnchor="middle">{geste.aplomb!.objet}</text>
      <text x={150} y={108} fontSize={11} fill="#f6ead5" textAnchor="middle">{`Cale : ${cale > 0 ? '+' : ''}${cale} mm`}</text>
    </svg>
    <input type="range" min={-30} max={30} step={1} value={cale} onChange={e => setValeur(Number(e.target.value))} aria-label="Cale, en millimètres" className="w-full accent-[#E8B04A]" />
    <Reglage libelle="1 mm" onMoins={() => setValeur(Math.max(-30, cale - 1))} onPlus={() => setValeur(Math.min(30, cale + 1))} />
  </>;
}

/** Placer : on fait glisser la cage dans le coffrage ; la valeur, c'est l'enrobage obtenu sous la cage. */
function Placer({ geste, valeur, setValeur }: { geste: GesteChantier; valeur: number | null; setValeur: (v: number) => void }) {
  const [aide, setAide] = useState(false);
  const enrobage = valeur ?? 8, echelle = 8, fond = 150;
  return <>
    <Plan largeur={300} hauteur={170} libelle={`${geste.placement!.element} : coffrage et cage`} onPoint={(_, y) => setValeur(Math.max(0, Math.min(12, Math.round((fond - y) / echelle * 2) / 2)))}>
      <rect x={70} y={30} width={160} height={124} fill="none" stroke="#c9a57a" strokeWidth={4} />
      <rect x={70 + 4} y={fond - enrobage * echelle - 70} width={152} height={70} fill="none" stroke="#b9c3c8" strokeWidth={3} />
      {[0, 1, 2, 3].map(i => <circle key={i} cx={84 + i * 44} cy={fond - enrobage * echelle - 4} r={4} fill="#7d878c" />)}
      <line x1={250} x2={250} y1={fond} y2={fond - enrobage * echelle} stroke="#ffd47a" strokeWidth={2} />
      <text x={256} y={fond - enrobage * echelle / 2 + 4} fontSize={11} fill="#ffd47a">{`${fr(enrobage, 1)} cm`}</text>
      <text x={150} y={20} fontSize={10} fill="#f6ead5" textAnchor="middle">Enrobage : du fond du coffrage aux aciers</text>
    </Plan>
    <Reglage libelle="0,5 cm" onMoins={() => setValeur(Math.max(0, enrobage - .5))} onPlus={() => setValeur(Math.min(12, enrobage + .5))} />
    <button type="button" onClick={() => setAide(v => !v)} className="text-[11.5px] text-jeu-ivoire/60 underline">{aide ? 'Masquer l’aide-mémoire' : 'Aide-mémoire des enrobages'}</button>
    {aide && <p className="rounded-lg bg-black/25 p-2 text-[11.5px] leading-snug text-jeu-ivoire/75">Contre le sol : 5 cm · exposé aux pluies : 4 cm · intérieur à l’abri : 3 cm.</p>}
  </>;
}

/** Corriger : un seul point n'est pas conforme ; on le touche pour le faire reprendre. */
function Corriger({ geste, valeur, setValeur }: { geste: GesteChantier; valeur: number | null; setValeur: (v: number) => void }) {
  return <ul className="grid gap-1.5">{geste.defauts!.map((d, i) => <li key={d.libelle}>
    <button type="button" aria-pressed={valeur === i} onClick={() => setValeur(i)} className={`w-full rounded-xl border p-2.5 text-left text-[12.5px] ${valeur === i ? 'border-jeu-or/70 bg-jeu-or/[.14]' : 'border-white/12 bg-white/[.04] hover:border-white/30'}`}>
      <b className="block">{d.libelle}</b><span className="text-jeu-ivoire/70">{d.detail}</span>
    </button>
  </li>)}</ul>;
}

/** Le panneau d'un geste : sa consigne, l'outil à manier, et la validation de la valeur relevée. */
export function PanneauGeste({ etape, geste, onValider, onFermer }: { etape: string; geste: GesteChantier; onValider: (valeur: number) => void; onFermer: () => void }) {
  const [valeur, setValeur] = useState<number | null>(geste.type === 'controler' ? 0 : null);
  const outil = { mesurer: Mesurer, tracer: Tracer, controler: Controler, placer: Placer, corriger: Corriger }[geste.type];
  const Outil = outil;
  return <section role="dialog" aria-label={geste.titre} className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[80%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[380px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">{etape} · geste</p><h2 className="hud-titre mt-0.5 text-lg leading-tight">{geste.titre}</h2></div>
      <button type="button" aria-label="Fermer le geste" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="mt-2 text-[12.5px] leading-snug text-jeu-ivoire/80">{geste.consigne}</p>
    <div className="mt-3 space-y-2"><Outil geste={geste} valeur={valeur} setValeur={setValeur} /></div>
    <button type="button" disabled={valeur === null} onClick={() => valeur !== null && onValider(valeur)} className="hud-bouton hud-bouton-principal mt-3 w-full p-3 text-sm disabled:opacity-50">
      {geste.type === 'corriger' ? 'Faire reprendre ce point' : 'Valider le geste'}
    </button>
  </section>;
}
