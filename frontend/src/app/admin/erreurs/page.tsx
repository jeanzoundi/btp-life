'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ErreurClient {
  id: string;
  message: string;
  pile: string | null;
  chemin: string | null;
  navigateur: string | null;
  version: string | null;
  occurrences: number;
  premiereLe: string;
  derniereLe: string;
  resolueLe: string | null;
}

const date = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
/** Le navigateur en quelques mots, lu dans l'en-tête complet. */
function appareil(ua: string | null) {
  if (!ua) return 'Navigateur inconnu';
  const systeme = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Autre';
  const nav = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Autre';
  return `${nav} · ${systeme}`;
}

export default function AdminErreursPage() {
  const client = useQueryClient();
  const [resolues, setResolues] = useState(false);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'erreurs', resolues],
    queryFn: () => api.get<ErreurClient[]>(`/admin/erreurs${resolues ? '?resolues=1' : ''}`),
  });
  const resoudre = useMutation({
    mutationFn: (id: string) => api.post(`/admin/erreurs/${id}/resolue`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'erreurs'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite">Erreurs du jeu</h1>
          <p className="mt-1 text-sm text-graphite/60">Remontées par le navigateur des joueurs, regroupées quand elles se répètent. Aucune n’est reliée à un compte.</p>
        </div>
        <div className="flex rounded-full border border-pierre bg-white p-1 text-sm">
          {[false, true].map((r) => (
            <button key={String(r)} onClick={() => setResolues(r)} className={`rounded-full px-4 py-1.5 font-semibold ${resolues === r ? 'bg-terracotta text-white' : 'text-graphite/60'}`}>
              {r ? 'Résolues' : 'À regarder'}
            </button>
          ))}
        </div>
      </div>

      {resoudre.isError && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">{resoudre.error.message}</p>}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-graphite/50">Chargement…</p>}
        {!isLoading && !data?.length && (
          <p className="rounded-2xl border border-pierre bg-white px-5 py-8 text-center text-sm text-graphite/50">{resolues ? 'Aucune erreur résolue.' : 'Aucune erreur remontée : tout tourne.'}</p>
        )}
        {data?.map((e) => (
          <article key={e.id} className="rounded-2xl border border-pierre bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="break-words font-mono text-sm text-graphite">{e.message}</p>
                <p className="mt-1 text-xs text-graphite/50">
                  {e.chemin ?? 'Page inconnue'} · {appareil(e.navigateur)}{e.version && ` · version ${e.version}`} · vue {e.occurrences} fois, du {date(e.premiereLe)} au {date(e.derniereLe)}
                </p>
              </div>
              {!e.resolueLe ? (
                <button disabled={resoudre.isPending} onClick={() => resoudre.mutate(e.id)} className="rounded-full bg-olive/10 px-4 py-1.5 text-xs font-semibold text-olive disabled:opacity-50">
                  Marquer résolue
                </button>
              ) : (
                <span className="text-xs font-semibold text-olive">Résolue le {date(e.resolueLe)}</span>
              )}
            </div>
            {e.pile && (
              <button onClick={() => setOuverte((o) => (o === e.id ? null : e.id))} className="mt-3 text-xs font-semibold text-terracotta">
                {ouverte === e.id ? 'Masquer la pile' : 'Voir la pile'}
              </button>
            )}
            {ouverte === e.id && e.pile && <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-graphite/5 p-3 text-[11px] leading-relaxed text-graphite/80">{e.pile}</pre>}
          </article>
        ))}
      </div>
    </div>
  );
}
