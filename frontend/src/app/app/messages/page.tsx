'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UserMessage {
  id: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
  pnj: { nom: string; role: string };
}

const ICONE_ROLE: Record<string, string> = {
  PROFESSEUR: '🎓',
  MAITRE_STAGE: '👷',
  SUPERVISEUR: '🦺',
  CHEF_CHANTIER: '🏗️',
  CHEF_ENTREPRISE: '💼',
  CONDUCTEUR: '📋',
  INGENIEUR: '📐',
  CLIENT: '🤝',
  FOURNISSEUR: '🚚',
  OUVRIER: '🔨',
  CONTROLEUR: '✅',
  HSE: '🦺',
  RECRUTEUR: '📇',
  BANQUIER: '🏦',
  CONCURRENT: '⚔️',
  ARCHITECTE: '🏛️',
  GEOTECHNICIEN: '🔬',
  TOPOGRAPHE: '🗺️',
};

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const { data: messages } = useQuery({
    queryKey: ['messages', 'mine'],
    queryFn: () => api.get<UserMessage[]>('/users/me/messages'),
  });
  const marquerLues = useMutation({
    mutationFn: () => api.patch('/users/me/messages/lues'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', 'mine'] }),
  });

  // On marque tout comme lu après un court instant, le temps que le joueur voie le badge non-lu.
  useEffect(() => {
    if (!messages?.some((m) => !m.lu)) return;
    const t = setTimeout(() => marquerLues.mutate(), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Messagerie</h1>
        <p className="text-sm text-graphite/60">
          Ton maître de stage, ton superviseur, ton chef d&apos;entreprise et les autres personnages t&apos;écrivent ici au fil de ta progression.
        </p>
      </div>

      <div className="space-y-3">
        {(messages ?? []).map((m) => (
          <div key={m.id} className={`flex gap-3 rounded-2xl border p-4 ${m.lu ? 'border-pierre bg-white' : 'border-terracotta/40 bg-terracotta/5'}`}>
            <span className="mt-0.5 text-2xl">{ICONE_ROLE[m.pnj.role] ?? '🧑‍💼'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-graphite">{m.pnj.nom}</p>
                <p className="shrink-0 text-xs text-graphite/40">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <p className="mt-1 text-sm text-graphite/70">{m.contenu}</p>
            </div>
            {!m.lu && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-label="Non lu" />}
          </div>
        ))}
        {!(messages ?? []).length && (
          <p className="text-sm text-graphite/60">
            Pas encore de message — les personnages t&apos;écriront au fil de ta progression : réussis une mission, termine un chantier, décroche une promotion…
          </p>
        )}
      </div>
    </div>
  );
}
