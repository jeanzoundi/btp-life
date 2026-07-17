'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  type: string;
  titre: string;
  contenu: string | null;
  lien: string | null;
  lue: boolean;
  createdAt: string;
}

const ICONES_TYPE: Record<string, string> = {
  BADGE: '🏅',
  NIVEAU: '⭐',
  PROMOTION: '📈',
  RAPPEL_SERIE: '🔥',
  DEFI: '🎯',
  MESSAGE_PNJ: '💬',
  CANDIDATURE: '📄',
  SYSTEME: '🔔',
};

function ilYA(dateIso: string): string {
  const secondes = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
  if (secondes < 60) return "à l'instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;
  return `il y a ${Math.floor(secondes / 86400)} j`;
}

export function NotificationsBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'mine'],
    queryFn: () => api.get<NotificationItem[]>('/users/me/notifications'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const nonLues = (notifications ?? []).filter((n) => !n.lue).length;

  async function ouvrir(n: NotificationItem) {
    setOuvert(false);
    if (!n.lue) {
      await api.patch(`/users/me/notifications/${n.id}/lue`);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'mine'] });
    }
    if (n.lien) router.push(n.lien);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert((o) => !o)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pierre text-graphite/70 transition-colors hover:bg-pierre/50"
        aria-label="Notifications"
      >
        🔔
        {!!nonLues && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cuivre px-1 text-[10px] font-bold text-ivoire">
            {nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <>
          <button aria-label="Fermer" className="fixed inset-0 z-40" onClick={() => setOuvert(false)} />
          <div className="anim-fade-up absolute right-0 top-11 z-50 max-h-96 w-80 overflow-y-auto rounded-2xl border border-pierre bg-white shadow-xl">
            <div className="sticky top-0 border-b border-pierre bg-white px-4 py-3">
              <p className="font-display text-sm font-bold text-graphite">Notifications</p>
            </div>
            {!notifications?.length && (
              <p className="p-6 text-center text-sm text-graphite/50">Rien pour l&apos;instant — reviens plus tard !</p>
            )}
            {notifications?.map((n) => (
              <button
                key={n.id}
                onClick={() => ouvrir(n)}
                className={`flex w-full gap-3 border-b border-pierre/60 px-4 py-3 text-left transition-colors hover:bg-pierre/30 ${
                  n.lue ? '' : 'bg-terracotta/5'
                }`}
              >
                <span className="mt-0.5 shrink-0 text-lg">{ICONES_TYPE[n.type] ?? '🔔'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-graphite">{n.titre}</span>
                  {n.contenu && <span className="mt-0.5 block text-xs leading-snug text-graphite/60">{n.contenu}</span>}
                  <span className="mt-1 block text-[10px] text-graphite/40">{ilYA(n.createdAt)}</span>
                </span>
                {!n.lue && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-terracotta" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
