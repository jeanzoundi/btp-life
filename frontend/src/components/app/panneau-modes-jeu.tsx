'use client';

import { MODES_JEU, type ModeJeuId } from '@/lib/modes-jeu';

export function PanneauModesJeu({ ouvert, mode, etape, score, secondes, record, decouvertes, totalDecouvertes, onToggle, onMode }: {
  ouvert: boolean; mode: ModeJeuId; etape: number; score: number; secondes: number | null; record: number; decouvertes: number; totalDecouvertes: number;
  onToggle: () => void; onMode: (mode: ModeJeuId) => void;
}) {
  const actif = MODES_JEU.find(m => m.id === mode)!;
  const objectif = actif.etapes[etape];
  const fini = actif.etapes.length > 0 && etape >= actif.etapes.length;
  return <div className="absolute left-3 top-36 z-10 w-[min(290px,calc(100%-24px))] text-white">
    <button onClick={onToggle} aria-expanded={ouvert} className="rounded-xl border border-white/20 bg-[#152b30]/95 px-4 py-3 text-left text-sm shadow-xl backdrop-blur">
      <span className="mr-2">{actif.icone}</span><strong>{actif.nom}</strong>{secondes !== null && <span className="ml-3 font-mono text-amber-200">{Math.floor(secondes / 60)}:{String(secondes % 60).padStart(2, '0')}</span>}
    </button>
    {ouvert && <section aria-label="Modes de jeu" className="mt-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#152b30]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="px-2 text-[10px] uppercase tracking-[.22em] text-amber-200">Choisir une expérience</p>
      <div className="mx-2 mt-2 grid grid-cols-2 gap-2 text-center text-[10px]"><div className="rounded-lg bg-white/10 p-2"><strong className="block text-sm text-amber-200">{decouvertes}/{totalDecouvertes}</strong>lieux secrets</div><div className="rounded-lg bg-white/10 p-2"><strong className="block text-sm text-amber-200">{record}</strong>meilleur score</div></div>
      <div className="mt-2 space-y-2">{MODES_JEU.map(m => <button key={m.id} onClick={() => onMode(m.id)} className={`w-full rounded-xl border p-3 text-left ${m.id === mode ? 'border-amber-300 bg-amber-100/15' : 'border-white/10 hover:bg-white/10'}`}><strong className="block text-sm">{m.icone} {m.nom}</strong><span className="mt-1 block text-[11px] text-white/65">{m.description}</span></button>)}</div>
    </section>}
    {!ouvert && mode !== 'libre' && <section className={`mt-2 rounded-xl border p-3 shadow-xl backdrop-blur ${fini ? 'border-emerald-300/40 bg-emerald-950/90' : secondes === 0 ? 'border-red-300/40 bg-red-950/90' : 'border-amber-200/30 bg-[#152b30]/95'}`}>
      {fini ? <><strong className="text-emerald-200">Mission accomplie</strong><p className="mt-1 text-xs">Score : {score} points · record : {Math.max(record, score)} · {secondes ?? 0}s restantes</p></> : secondes === 0 ? <><strong className="text-red-200">Temps écoulé</strong><p className="mt-1 text-xs">Relance le mode pour battre ton record de {record} points.</p></> : <><p className="text-[10px] uppercase tracking-wider text-amber-200">Objectif {etape + 1}/{actif.etapes.length}</p><strong className="mt-1 block text-sm">{objectif?.titre}</strong><p className="mt-1 text-xs text-white/70">{objectif?.instruction}</p><div className="mt-2 h-1.5 overflow-hidden rounded bg-white/15"><div className="h-full bg-amber-300" style={{ width: `${etape / actif.etapes.length * 100}%` }} /></div></>}
    </section>}
  </div>;
}
