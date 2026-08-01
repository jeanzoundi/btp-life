'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { journaliserErreur } from '@/lib/journal-erreurs';

// Limite d'erreur React : évite l'écran blanc quand un écran plante, et consigne l'erreur pour
// pouvoir diagnostiquer ce que le joueur a vu.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    journaliserErreur(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-pierre bg-white text-center shadow-xl">
        <div className="fond-anime p-8 text-ivoire">
          <p className="anim-float text-5xl">🚧</p>
          <h1 className="mt-3 font-display text-2xl font-bold">Chantier interrompu</h1>
        </div>
        <div className="space-y-4 p-6">
          <p className="text-graphite/70">
            Un imprévu technique est survenu sur cet écran. Ta progression est en sécurité — rien
            n&apos;est perdu.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={reset}
              className="flex-1 rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile"
            >
              ↻ Réessayer
            </button>
            <Link
              href="/app"
              className="flex-1 rounded-full border border-graphite/20 py-3 font-semibold text-graphite transition-colors hover:border-terracotta hover:text-terracotta"
            >
              Tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
