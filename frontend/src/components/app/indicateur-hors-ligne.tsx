'use client';

import { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';

// Bandeau discret quand le réseau est coupé : rassure sur le fait que la progression sera
// synchronisée (façon Duolingo). S'appuie sur onlineManager (déjà utilisé pour rejouer les
// mutations en file d'attente).
export function IndicateurHorsLigne() {
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    setHorsLigne(!onlineManager.isOnline());
    return onlineManager.subscribe((online) => setHorsLigne(!online));
  }, []);

  if (!horsLigne) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-graphite px-4 py-1.5 text-center text-xs font-semibold text-ivoire">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sable" />
      Mode hors ligne — ta progression sera synchronisée dès le retour de la connexion.
    </div>
  );
}
