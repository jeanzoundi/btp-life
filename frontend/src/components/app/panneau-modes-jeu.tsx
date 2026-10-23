'use client';

import { MODES_JEU, type ModeJeuId } from '@/lib/modes-jeu';
import type { ObjectifMoment } from '@/lib/objectif-monde';

/** Ouvert depuis l'objectif du HUD : conseil du moment, choix du mode et suivi de la mission. */
export function PanneauModesJeu({ haut, ouvert, mode, etape, score, secondes, record, decouvertes, totalDecouvertes, conseil, onAller, onToggle, onMode }: {
  haut: string; ouvert: boolean; mode: ModeJeuId; etape: number; score: number; secondes: number | null; record: number; decouvertes: number; totalDecouvertes: number;
  conseil?: ObjectifMoment; onAller?: (lieu: string) => void; onToggle: () => void; onMode: (mode: ModeJeuId) => void;
}) {
  const actif = MODES_JEU.find(m => m.id === mode)!;
  const objectif = actif.etapes[etape];
  const fini = actif.etapes.length > 0 && etape >= actif.etapes.length;
  return <div className={`absolute left-3 z-30 w-[min(320px,calc(100%-24px))] ${haut}`}>
    {ouvert && <section aria-label="Modes de jeu" className="hud-verre max-h-[calc(100dvh-140px)] overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-2"><h2 className="hud-titre text-[17px]">Planning du jour</h2><button type="button" aria-label="Fermer les modes de jeu" onClick={onToggle} className="hud-bouton hud-bouton-verre h-8 w-8 rounded-full text-xs">✕</button></div>
      <div className="hud-separateur mt-2" />
      {conseil && <div className="mt-3 rounded-xl border border-jeu-or/25 bg-jeu-or/[.08] p-3">
        <p className="hud-legende text-jeu-or">À faire maintenant</p>
        <strong className="mt-1 block text-sm">{conseil.texte}{conseil.etiquette && <span className="hud-chiffre ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{conseil.etiquette}</span>}</strong>
        {conseil.lieu && onAller && <button type="button" onClick={() => onAller(conseil.lieu!)} className="hud-bouton hud-bouton-principal mt-2.5 w-full px-3 py-2 text-sm">Y aller</button>}
      </div>}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10.5px] font-semibold text-jeu-ivoire/60"><div className="rounded-xl bg-white/[.05] p-2.5"><strong className="hud-chiffre block text-lg text-jeu-or">{decouvertes}/{totalDecouvertes}</strong>lieux secrets</div><div className="rounded-xl bg-white/[.05] p-2.5"><strong className="hud-chiffre block text-lg text-jeu-or">{record}</strong>meilleur score</div></div>
      <p className="hud-legende mt-4 px-1">Choisir une expérience</p>
      <div className="mt-2 space-y-2">{MODES_JEU.map(m => <button key={m.id} type="button" onClick={() => onMode(m.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${m.id === mode ? 'border-jeu-or/60 bg-jeu-or/[.1]' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}><strong className="block text-sm">{m.icone} {m.nom}</strong><span className="mt-1 block text-[11.5px] text-jeu-ivoire/65">{m.description}</span></button>)}</div>
    </section>}
    {!ouvert && mode !== 'libre' && <section className={`hud-verre p-4 ${fini ? 'border-jeu-lagune/50' : secondes === 0 ? 'border-jeu-terre/60' : ''}`}>
      {fini ? <><strong className="text-jeu-lagune">Mission accomplie</strong><p className="mt-1 text-xs text-jeu-ivoire/75">Score : {score} points · record : {Math.max(record, score)} · {secondes ?? 0}s restantes</p></> : secondes === 0 ? <><strong className="text-jeu-terre">Temps écoulé</strong><p className="mt-1 text-xs text-jeu-ivoire/75">Relance le mode pour battre ton record de {record} points.</p></> : <><p className="hud-legende text-jeu-or">Objectif {etape + 1}/{actif.etapes.length}</p><strong className="mt-1 block text-sm">{objectif?.titre}</strong><p className="mt-1 text-xs text-jeu-ivoire/65">{objectif?.instruction}</p><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[linear-gradient(90deg,#D89A2C,#F3C66A)]" style={{ width: `${etape / actif.etapes.length * 100}%` }} /></div></>}
    </section>}
  </div>;
}
