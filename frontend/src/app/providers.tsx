'use client';

import { useEffect, useState } from 'react';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister } from '@/lib/offline/query-persister';
import { notifierSync } from '@/lib/offline/sync-notify';
import { api, ApiError, CANAL_SYNCHRO } from '@/lib/api';

// Résultat renvoyé par /missions/:id/submit (sous-ensemble utile à la notification de synchro).
type ResultatMission = { reussie: boolean; xpGagne: number; rejeuSansRecompense?: boolean };

// Requêtes temps réel / multijoueur : inutile (voire trompeur) de les servir depuis le cache
// hors ligne — on ne les persiste pas.
const NE_PAS_PERSISTER = new Set(['monde', 'autres-joueurs', 'classement', 'classements']);

// Distingue un refus serveur (4xx : session expirée, ressource disparue…) d'une simple coupure
// réseau. Une coupure sera rejouée toute seule au retour de la connexion : inutile d'alarmer.
// Un 4xx, lui, ne se réparera jamais tout seul — il faut le dire au joueur.
function echecDefinitif(err: unknown): boolean {
  const status = (err as ApiError | undefined)?.status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

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
          // On réessaie les erreurs réseau/serveur, jamais un refus 4xx (il ne se répare pas seul).
          retry: (nbEchecs, err) => !echecDefinitif(err) && nbEchecs < 3,
        },
      },
    });

    // Défauts de mutation : permettent de REJOUER une mutation reprise après un rechargement de
    // l'app (la fonction est retrouvée via la mutationKey persistée). Ces onSuccess ne se déclenchent
    // QUE pour les mutations rejouées sans composant monté (hors ligne → reconnexion, ou après
    // fermeture/réouverture) ; quand l'écran est ouvert, ses propres callbacks priment.
    qc.setMutationDefaults(['cours-termine'], {
      mutationFn: (coursId: string) => api.post(`/carriere/cours/${coursId}/termine`),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['carriere', 'cours-termines'] });
      },
      onError: (err) => {
        // Échec définitif après les tentatives : ne pas mourir en silence, sinon le joueur croit
        // que son cours est validé alors qu'il ne l'est pas.
        if (echecDefinitif(err)) {
          notifierSync('Cours non synchronisé', 'Reconnecte-toi puis rouvre le cours pour le valider.');
          qc.invalidateQueries({ queryKey: ['carriere', 'cours-termines'] });
        }
      },
    });

    qc.setMutationDefaults(['mission-submit'], {
      mutationFn: (vars: { id: string; reponses: Record<string, unknown>; tempsUtiliseSec: number }) =>
        api.post<ResultatMission>(`/missions/${vars.id}/submit`, {
          reponses: vars.reponses,
          tempsUtiliseSec: vars.tempsUtiliseSec,
        }),
      onSuccess: (res) => {
        qc.invalidateQueries({ queryKey: ['carriere'] });
        qc.invalidateQueries({ queryKey: ['missions'] });
        const r = res as ResultatMission;
        if (r && !r.rejeuSansRecompense) {
          notifierSync(
            r.reussie ? 'Mission synchronisée 🎉' : 'Mission synchronisée',
            r.reussie ? `Réussie ! +${r.xpGagne} XP crédités.` : 'Tes réponses ont été corrigées.',
          );
        }
      },
      onError: (err) => {
        // Session expirée pendant le hors-ligne, mission supprimée… : prévenir plutôt que de
        // perdre silencieusement les réponses du joueur.
        if (echecDefinitif(err)) {
          notifierSync(
            'Mission non synchronisée',
            'Ta session a peut-être expiré. Reconnecte-toi et rejoue la mission pour valider tes points.',
          );
        }
      },
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

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const canal = new BroadcastChannel(CANAL_SYNCHRO);
    canal.onmessage = (event: MessageEvent<{ type?: string; path?: string }>) => {
      if (event.data?.type !== 'mutation') return;
      const path = event.data.path ?? '';
      // Présence et chat du monde en ligne : des relevés fréquents qui ne changent rien aux données du joueur.
      if (path.startsWith('/monde/presence') || path.startsWith('/monde/chat')) return;
      if (path.includes('/carriere/monde')) {
        client.invalidateQueries({ queryKey: ['carriere', 'monde'] });
        return;
      }
      client.invalidateQueries({ queryKey: ['carriere'] });
      if (path.includes('/mission')) client.invalidateQueries({ queryKey: ['missions'] });
      if (path.includes('/chantier')) client.invalidateQueries({ queryKey: ['chantiers'] });
      if (path.includes('/avatar')) client.invalidateQueries({ queryKey: ['avatar'] });
      if (path.includes('/message')) client.invalidateQueries({ queryKey: ['messages'] });
    };
    return () => canal.close();
  }, [client]);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
        buster: 'v3-monde-frais', // Élimine aussi les anciennes sauvegardes du monde mises en cache.
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === 'success' && !q.queryKey.some(key => NE_PAS_PERSISTER.has(String(key))),
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
