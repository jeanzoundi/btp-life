'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { jouerSon } from '@/lib/sons';

export interface BesoinsData {
  energie: number;
  moral: number;
  faim: number;
  social: number;
}

const JAUGES: Array<{ cle: keyof BesoinsData; label: string; icone: string; couleur: string }> = [
  { cle: 'energie', label: 'Énergie', icone: '⚡', couleur: '#C1502E' },
  { cle: 'faim', label: 'Faim', icone: '🍲', couleur: '#B87333' },
  { cle: 'moral', label: 'Moral', icone: '🙂', couleur: '#6B7A3F' },
  { cle: 'social', label: 'Social', icone: '💬', couleur: '#2E5FA3' },
];

const ACTIONS: Array<{ action: 'repos' | 'repas' | 'social'; label: string; icone: string; cible: keyof BesoinsData }> = [
  { action: 'repos', label: 'Se reposer', icone: '😴', cible: 'energie' },
  { action: 'repas', label: 'Manger', icone: '🍲', cible: 'faim' },
  { action: 'social', label: 'Discuter', icone: '💬', cible: 'social' },
];

function couleurBarre(valeur: number) {
  if (valeur < 25) return '#C1502E';
  if (valeur < 55) return '#B87333';
  return '#6B7A3F';
}

/** Barres de besoins façon jeu de simulation de vie, avec actions pour les restaurer. */
export function PanneauBesoins({ besoins, compact = false }: { besoins: BesoinsData; compact?: boolean }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const agir = useMutation({
    mutationFn: (action: 'repos' | 'repas' | 'social') => api.post<{ message: string; change: boolean }>(`/carriere/besoins/${action}`),
    onSuccess: (res) => {
      jouerSon(res.change ? 'succes' : 'clic');
      setMessage(res.message);
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setTimeout(() => setMessage(null), 3500);
    },
    onError: (err) => setMessage(err instanceof ApiError ? err.message : 'Action impossible'),
  });

  const moyenne = Math.round((besoins.energie + besoins.moral + besoins.faim + besoins.social) / 4);
  const critique = moyenne < 40;

  return (
    <section className={`rounded-2xl border bg-white p-3.5 sm:rounded-3xl sm:p-5 ${critique ? 'border-terracotta/50' : 'border-pierre'}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-graphite sm:text-base">🧍 État du personnage</h2>
        {critique && <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 text-[10px] font-bold text-terracotta">À surveiller</span>}
      </div>

      <div className={`mt-3 grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {JAUGES.map((j) => {
          const v = besoins[j.cle];
          return (
            <div key={j.cle}>
              <div className="flex items-center justify-between text-[11px] text-graphite/60">
                <span>{j.icone} {j.label}</span>
                <span className="font-mono font-semibold" style={{ color: couleurBarre(v) }}>{v}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-pierre">
                <div
                  className="barre-progression h-full"
                  style={{ width: `${v}%`, backgroundColor: couleurBarre(v) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <p className="anim-fade-up mt-3 rounded-xl bg-olive/10 px-3 py-2 text-xs font-semibold text-olive">{message}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.action}
            onClick={() => agir.mutate(a.action)}
            disabled={agir.isPending || besoins[a.cible] >= 98}
            className="flex items-center gap-1.5 rounded-full border-2 border-pierre px-3 py-1.5 text-xs font-semibold text-graphite/80 transition-all hover:border-terracotta hover:text-terracotta disabled:opacity-40"
          >
            <span>{a.icone}</span> {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Version miniature (4 icônes + mini-barres) pour la topbar. */
export function BesoinsMini({ besoins }: { besoins: BesoinsData }) {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {JAUGES.map((j) => (
        <div key={j.cle} title={`${j.label} : ${besoins[j.cle]}`} className="flex items-center gap-1">
          <span className="text-xs">{j.icone}</span>
          <div className="h-1.5 w-8 overflow-hidden rounded-full bg-pierre">
            <div className="h-full" style={{ width: `${besoins[j.cle]}%`, backgroundColor: couleurBarre(besoins[j.cle]) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export type Humeur = 'bien' | 'moyen' | 'mal';

/** Humeur globale façon plumbob : vert quand tout va bien, orange puis rouge quand ça se dégrade. */
export function humeurDepuisBesoins(b: BesoinsData): Humeur {
  const moyenne = (b.energie + b.moral + b.faim + b.social) / 4;
  if (moyenne >= 60) return 'bien';
  if (moyenne >= 35) return 'moyen';
  return 'mal';
}

/** Le besoin le plus critique (sous 45), pour la bulle de pensée du personnage. */
export function besoinCritique(b: BesoinsData): { icone: string; label: string } | null {
  const entrees: Array<{ cle: keyof BesoinsData; icone: string; label: string }> = [
    { cle: 'energie', icone: '💤', label: 'Fatigué(e)' },
    { cle: 'faim', icone: '🍲', label: 'Faim !' },
    { cle: 'social', icone: '💬', label: 'Envie de parler' },
    { cle: 'moral', icone: '🌧️', label: 'Moral bas' },
  ];
  const critiques = entrees.filter((e) => b[e.cle] < 45).sort((x, y) => b[x.cle] - b[y.cle]);
  return critiques[0] ?? null;
}

export function useBesoins() {
  return useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<{ energie: number; moral: number; faim: number; social: number }>('/carriere/me'),
    select: (d) => ({ energie: d.energie, moral: d.moral, faim: d.faim, social: d.social }) as BesoinsData,
  });
}
