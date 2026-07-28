'use client';

// Bannière cinématique réutilisable façon hub de jeu — palette BTP chaude, couches décoratives
// (grille de plan, halos, balayage de lumière). Utilisée en en-tête des grands écrans.
export function BanniereHub({
  emoji,
  titre,
  soustitre,
  children,
}: {
  emoji: string;
  titre: string;
  soustitre?: React.ReactNode;
  children?: React.ReactNode; // contenu optionnel à droite (ex. solde, anneau de progression)
}) {
  return (
    <section className="fond-anime relative overflow-hidden rounded-3xl p-6 text-ivoire shadow-2xl">
      <div className="grille-plan pointer-events-none absolute inset-0 opacity-40" />
      <div className="halo-hero" />
      <div className="reflet-heros" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="anim-float inline-block text-4xl">{emoji}</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">{titre}</h1>
          {soustitre && <p className="mt-1.5 text-sm text-ivoire/75">{soustitre}</p>}
        </div>
        {children && <div className="relative shrink-0">{children}</div>}
      </div>
    </section>
  );
}
