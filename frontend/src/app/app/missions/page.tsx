'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AnneauProgression, ICONES_TYPE, Skeleton } from '@/components/app/ui';

interface Mission {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  niveauRequis: number;
  userStatut: string;
  meilleurScore: number | null;
  verrouillee: boolean;
  dureeLimiteSec: number | null;
}

const TYPES = Object.keys(ICONES_TYPE);

export default function MissionsPage() {
  const [typeFiltre, setTypeFiltre] = useState('TOUS');
  const [statutFiltre, setStatutFiltre] = useState<'TOUS' | 'A_FAIRE' | 'REUSSIES'>('TOUS');

  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions', 'list'],
    queryFn: () => api.get<Mission[]>('/missions?niveauMax=99'),
  });

  const toutes = missions ?? [];
  const reussies = toutes.filter((m) => m.userStatut === 'REUSSIE').length;
  const typesPresents = TYPES.filter((t) => toutes.some((m) => m.type === t));

  const filtrees = toutes.filter((m) => {
    if (typeFiltre !== 'TOUS' && m.type !== typeFiltre) return false;
    if (statutFiltre === 'A_FAIRE' && (m.userStatut === 'REUSSIE' || m.verrouillee)) return false;
    if (statutFiltre === 'REUSSIES' && m.userStatut !== 'REUSSIE') return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* En-tête avec progression */}
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-pierre bg-white p-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite">🎯 Missions</h1>
          <p className="mt-1 text-sm text-graphite/60">
            14 types de missions pour progresser sur tous les axes — chaque réussite alimente ton CV.
          </p>
          <div className="mt-3 flex gap-2">
            {(
              [
                ['TOUS', 'Toutes'],
                ['A_FAIRE', 'À faire'],
                ['REUSSIES', 'Réussies'],
              ] as const
            ).map(([valeur, label]) => (
              <button
                key={valeur}
                onClick={() => setStatutFiltre(valeur)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  statutFiltre === valeur ? 'bg-graphite text-ivoire' : 'bg-pierre/60 text-graphite/60 hover:bg-pierre'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <AnneauProgression valeur={reussies} max={Math.max(1, toutes.length)} taille={96} couleur="#6B7A3F">
          <div className="text-center">
            <p className="font-display text-xl font-bold text-graphite">{reussies}</p>
            <p className="text-[10px] text-graphite/50">/{toutes.length}</p>
          </div>
        </AnneauProgression>
      </section>

      {/* Filtres par type */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFiltre('TOUS')}
          className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-all ${
            typeFiltre === 'TOUS' ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-pierre text-graphite/60 hover:border-sable'
          }`}
        >
          Tous les types
        </button>
        {typesPresents.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFiltre(t)}
            className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-all ${
              typeFiltre === t ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-pierre text-graphite/60 hover:border-sable'
            }`}
          >
            {ICONES_TYPE[t]} {t.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrees.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-4 ${
              m.verrouillee ? 'border-pierre bg-pierre/30 opacity-70' : 'carte-vivante border-pierre bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-olive">
                <span className="text-lg">{ICONES_TYPE[m.type] ?? '🎯'}</span> {m.type.replaceAll('_', ' ')}
              </span>
              {m.userStatut === 'REUSSIE' && (
                <span className="rounded-full bg-olive/10 px-2 py-0.5 text-xs font-bold text-olive">✔ {m.meilleurScore}/100</span>
              )}
              {m.userStatut === 'ECHOUEE' && (
                <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-bold text-terracotta">↻ À retenter</span>
              )}
            </div>
            <p className="mt-2 font-display font-bold text-graphite">{m.titre}</p>
            <p className="mt-1 line-clamp-2 text-sm text-graphite/60">{m.description}</p>
            <div className="mt-3 flex items-center justify-between border-t border-pierre/60 pt-3 text-xs text-graphite/50">
              <span className="font-mono">
                Niv. {m.niveauRequis}
                {m.dureeLimiteSec ? ` · ⏱ ${Math.round(m.dureeLimiteSec / 60)} min` : ''}
              </span>
              {m.verrouillee ? (
                <span className="font-semibold">🔒 Niveau {m.niveauRequis}</span>
              ) : (
                <Link
                  href={`/app/missions/${m.id}`}
                  className="rounded-full bg-terracotta px-4 py-1.5 font-semibold text-ivoire transition-transform hover:scale-105 hover:bg-argile"
                >
                  {m.userStatut === 'REUSSIE' ? 'Améliorer' : 'Jouer'} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && !filtrees.length && (
        <p className="rounded-2xl border border-dashed border-pierre p-8 text-center text-sm text-graphite/60">
          Aucune mission ne correspond à ces filtres.
        </p>
      )}
    </div>
  );
}
