'use client';

import { useEffect, useState } from 'react';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister } from '@/lib/offline/query-persister';
import { api } from '@/lib/api';

// Requêtes temps réel / multijoueur : inutile (voire trompeur) de les servir depuis le cache
// hors ligne — on ne les persiste pas.
const NE_PAS_PERSISTER = new Set(['monde', 'autres-joueurs', 'classement', 'classements']);

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 30_000,
          gcTime: 1000 * 60 * 60 * 24 * 7, // 7 jours : garder les données en cache pour l'offline
          networkMode: 'offlineFirst', // sert le cache d'abord, tente le réseau ensuite
        },
        mutations: {
          networkMode: 'online', // hors ligne : mise en file d'attente, rejouée au retour du réseau
          retry: 3,
        },
      },
    });

    // Défaut de mutation pour la complétion de cours : permet de REJOUER une mutation reprise
    // après un rechargement de l'app (la fonction est retrouvée via la mutationKey persistée).
    qc.setMutationDefaults(['cours-termine'], {
      mutationFn: (coursId: string) => api.post(`/carriere/cours/${coursId}/termine`),
    });

    return qc;
  });

  useEffect(() => {
    // Dès que la connexion revient : rejouer les actions en attente puis rafraîchir les données.
    const unsub = onlineManager.subscribe((online) => {
      if (online) {
        client.resumePausedMutations().then(() => client.invalidateQueries());
      }
    });
    return unsub;
  }, [client]);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
        buster: 'v1', // changer pour invalider tout le cache persisté après un changement de format
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === 'success' && !NE_PAS_PERSISTER.has(String(q.queryKey?.[0])),
        },
      }}
      onSuccess={() => {
        // Cache restauré : rejouer d'éventuelles mutations mises en file avant fermeture.
        client.resumePausedMutations();
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
