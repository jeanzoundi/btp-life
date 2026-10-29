'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface MessageSignale {
  messageId: string;
  texte: string;
  envoyeLe: string;
  retire: boolean;
  auteur: { id: string; email: string; pseudo: string | null; banni: boolean };
  signalements: number;
  motifs: Record<string, number>;
  dernierLe: string;
  decision: string | null;
  traiteLe: string | null;
}
type Decision = 'retirer' | 'bannir' | 'ecarter';

const MOTIFS: Record<string, string> = { insulte: 'Insulte', harcelement: 'Harcèlement', spam: 'Spam', 'donnees-perso': 'Infos perso', autre: 'Autre' };
const DECISIONS: Record<string, string> = { retire: 'Message retiré', banni: 'Auteur banni', ecarte: 'Signalements écartés' };
const date = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export default function AdminModerationPage() {
  const client = useQueryClient();
  const [traites, setTraites] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'moderation', traites],
    queryFn: () => api.get<MessageSignale[]>(`/admin/moderation/signalements${traites ? '?traites=1' : ''}`),
  });
  const decider = useMutation({
    mutationFn: ({ messageId, decision }: { messageId: string; decision: Decision }) => api.post(`/admin/moderation/signalements/${messageId}`, { decision }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });
  const confirmerBannissement = (m: MessageSignale) =>
    window.confirm(`Bannir ${m.auteur.pseudo ?? m.auteur.email} ? Son compte ne pourra plus écrire ni apparaître dans le quartier.`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite">Modération du chat</h1>
          <p className="mt-1 text-sm text-graphite/60">Les messages signalés par les joueurs. Au troisième signalement, un message quitte le chat en attendant ta décision.</p>
        </div>
        <div className="flex rounded-full border border-pierre bg-white p-1 text-sm">
          {[false, true].map((t) => (
            <button key={String(t)} onClick={() => setTraites(t)} className={`rounded-full px-4 py-1.5 font-semibold ${traites === t ? 'bg-terracotta text-white' : 'text-graphite/60'}`}>
              {t ? 'Historique' : 'À traiter'}
            </button>
          ))}
        </div>
      </div>

      {decider.isError && <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">{decider.error.message}</p>}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-graphite/50">Chargement…</p>}
        {!isLoading && !data?.length && (
          <p className="rounded-2xl border border-pierre bg-white px-5 py-8 text-center text-sm text-graphite/50">{traites ? 'Aucune décision pour l’instant.' : 'Rien à traiter : le quartier se tient bien.'}</p>
        )}
        {data?.map((m) => (
          <article key={m.messageId} className="rounded-2xl border border-pierre bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-graphite">« {m.texte} »</p>
                <p className="mt-1 text-xs text-graphite/50">
                  {m.auteur.pseudo ?? 'Sans pseudo'} · <span className="font-mono">{m.auteur.email}</span>{m.auteur.banni && ' · banni'} · envoyé le {date(m.envoyeLe)}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${m.retire ? 'bg-terracotta/10 text-terracotta' : 'bg-pierre text-graphite/60'}`}>
                {m.retire ? 'Retiré du chat' : 'Visible'}
              </span>
            </div>
            <p className="mt-3 text-sm text-graphite/70">
              {m.signalements} signalement{m.signalements > 1 ? 's' : ''} : {Object.entries(m.motifs).map(([motif, n]) => `${MOTIFS[motif] ?? motif}${n > 1 ? ` ×${n}` : ''}`).join(', ')} · dernier le {date(m.dernierLe)}
            </p>
            {m.traiteLe ? (
              <p className="mt-3 text-sm font-semibold text-olive">{DECISIONS[m.decision ?? ''] ?? m.decision} le {date(m.traiteLe)}</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={decider.isPending} onClick={() => decider.mutate({ messageId: m.messageId, decision: 'retirer' })} className="rounded-full bg-terracotta/10 px-4 py-1.5 text-xs font-semibold text-terracotta disabled:opacity-50">Retirer le message</button>
                <button disabled={decider.isPending || m.auteur.banni} onClick={() => confirmerBannissement(m) && decider.mutate({ messageId: m.messageId, decision: 'bannir' })} className="rounded-full bg-graphite px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Bannir l’auteur</button>
                <button disabled={decider.isPending} onClick={() => decider.mutate({ messageId: m.messageId, decision: 'ecarter' })} className="rounded-full bg-olive/10 px-4 py-1.5 text-xs font-semibold text-olive disabled:opacity-50">Écarter (le message revient)</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
