'use client';

import { MODES_JEU, type ModeJeuId } from '@/lib/modes-jeu';
import type { ObjectifMoment } from '@/lib/objectif-monde';

/** Ouvert depuis la pastille d'objectif du HUD : conseil du moment, choix du mode et suivi de la mission. */
export function PanneauModesJeu({ haut, ouvert, mode, etape, score, secondes, record, decouvertes, totalDecouvertes, conseil, onAller, onToggle, onMode }: {
  haut: string; ouvert: boolean; mode: ModeJeuId; etape: number; score: number; secondes: number | null; record: number; decouvertes: number; totalDecouvertes: number;
  conseil?: ObjectifMoment; onAller?: (lieu: string) => void; onToggle: () => void; onMode: (mode: ModeJeuId) => void;
}) {
  const actif = MODES_JEU.find(m => m.id === mode)!;
  const objectif = actif.etapes[etape];
  const fini = actif.etapes.length > 0 && etape >= actif.etapes.length;
  return <div className={`absolute left-3 z-20 w-[min(300px,calc(100%-24px))] text-encre ${haut}`}>
    {ouvert && <section aria-label="Modes de jeu" className="hud-carte max-h-[55vh] overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-2"><h2 className="hud-titre text-base font-normal">Ta journée</h2><button type="button" aria-label="Fermer les modes de jeu" onClick={onToggle} className="hud-bouton h-8 w-8 shrink-0 bg-white text-xs">✕</button></div>
      {conseil && <div className="mt-2 rounded-[10px] border-[2.4px] border-encre bg-[#fff3d6] p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-mangue">Conseil du moment</p>
        <strong className="mt-0.5 block text-sm">{conseil.texte}{conseil.etiquette && <span className="ml-2 rounded-full bg-piment px-2 py-0.5 text-[10px] text-white">{conseil.etiquette}</span>}</strong>
        {conseil.lieu && onAller && <button type="button" onClick={() => onAller(conseil.lieu!)} className="hud-bouton mt-2 w-full bg-foret px-3 py-2 text-sm text-creme">Y aller</button>}
      </div>}
      <div className="mt-2 grid grid-cols-2 gap-2 text-center text-[10px] font-bold"><div className="rounded-[10px] border-2 border-encre/20 p-2"><strong className="hud-titre block text-sm font-normal text-mangue">{decouvertes}/{totalDecouvertes}</strong>lieux secrets</div><div className="rounded-[10px] border-2 border-encre/20 p-2"><strong className="hud-titre block text-sm font-normal text-mangue">{record}</strong>meilleur score</div></div>
      <p className="mt-3 px-1 text-[10px] font-extrabold uppercase tracking-wider text-encre/60">Choisir une expérience</p>
      <div className="mt-1 space-y-2">{MODES_JEU.map(m => <button key={m.id} type="button" onClick={() => onMode(m.id)} className={`w-full rounded-[10px] border-[2.4px] p-3 text-left ${m.id === mode ? 'border-encre bg-[#ffe3bd] shadow-[3px_3px_0_0_#0B2E1F]' : 'border-encre/20 hover:border-encre'}`}><strong className="block text-sm">{m.icone} {m.nom}</strong><span className="mt-1 block text-[11px] text-encre/70">{m.description}</span></button>)}</div>
    </section>}
    {!ouvert && mode !== 'libre' && <section className={`hud-carte p-3 ${fini ? 'bg-[#e3f4e8]' : secondes === 0 ? 'bg-[#fde4e1]' : ''}`}>
      {fini ? <><strong className="text-foret">Mission accomplie</strong><p className="mt-1 text-xs">Score : {score} points · record : {Math.max(record, score)} · {secondes ?? 0}s restantes</p></> : secondes === 0 ? <><strong className="text-piment">Temps écoulé</strong><p className="mt-1 text-xs">Relance le mode pour battre ton record de {record} points.</p></> : <><p className="text-[10px] font-extrabold uppercase tracking-wider text-mangue">Objectif {etape + 1}/{actif.etapes.length}</p><strong className="mt-1 block text-sm">{objectif?.titre}</strong><p className="mt-1 text-xs text-encre/70">{objectif?.instruction}</p><div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-encre bg-white"><div className="h-full bg-mangue" style={{ width: `${etape / actif.etapes.length * 100}%` }} /></div></>}
    </section>}
  </div>;
}
