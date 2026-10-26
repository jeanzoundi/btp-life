'use client';

/** Les bandes noires et le titre d'un plan de caméra (chapitre du fil rouge validé) ; « Passer » rend la main tout de suite. */
export function BandeauCinema({ titre, sousTitre, onPasser }: { titre: string; sousTitre: string; onPasser: () => void }) {
  return <div className="pointer-events-none absolute inset-0 z-40" role="status" aria-live="polite">
    <div className="absolute inset-x-0 top-0 h-[9%] min-h-[36px] bg-black/85" />
    <div className="absolute inset-x-0 bottom-0 flex h-[13%] min-h-[68px] items-center justify-center bg-black/85 px-16">
      <div className="text-center">
        <p className="hud-titre text-[15px] text-jeu-or sm:text-[18px]">{titre}</p>
        <p className="mt-0.5 text-[12px] text-jeu-ivoire/80 sm:text-[13px]">{sousTitre}</p>
      </div>
      <button type="button" onClick={onPasser} className="pointer-events-auto absolute right-4 rounded-full border border-white/20 px-3 py-1 text-[11.5px] font-bold text-jeu-ivoire/80 hover:bg-white/10">Passer ›</button>
    </div>
  </div>;
}
