'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/app/ui';
import { LecteurSlides, type BlocCours } from '@/components/app/lecteur-slides';

interface Exercice {
  id: string;
  titre: string;
  niveau: number;
  typeSimulation: string;
  config: { blocs?: BlocCours[] } | null;
}
interface Logiciel {
  id: string;
  slug: string;
  nom: string;
  categorie: string | null;
  exercices: Exercice[];
}
interface UserLogiciel {
  logiciel: { slug: string };
  niveauMaitrise: number;
}

const ICONES_CATEGORIE: Record<string, string> = {
  bureautique: '📄',
  cao: '📐',
  bim: '🏢',
  planning: '📅',
  calcul: '🧮',
  'vrd-topo': '🗺️',
};

export default function LogicielsPage() {
  const [lecon, setLecon] = useState<{ titre: string; logiciel: string; blocs: BlocCours[] } | null>(null);

  const { data: logiciels, isLoading } = useQuery({
    queryKey: ['catalog', 'logiciels'],
    queryFn: () => api.get<{ items: Logiciel[] }>('/catalog/logiciels?pageSize=50'),
  });
  const { data: miens } = useQuery({
    queryKey: ['logiciels', 'mine'],
    queryFn: () => api.get<UserLogiciel[]>('/users/me/logiciels'),
  });

  const maitriseParSlug = new Map((miens ?? []).map((ul) => [ul.logiciel.slug, ul.niveauMaitrise]));
  const items = logiciels?.items ?? [];
  const totalLecons = items.reduce((s, l) => s + l.exercices.filter((e) => (e.config?.blocs ?? []).length > 0).length, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-3 sm:space-y-6">
      {/* Lecteur de leçon en diapositives */}
      {lecon && (
        <LecteurSlides
          titre={lecon.titre}
          sousTitre={`Académie Logiciels · ${lecon.logiciel}`}
          dureeMin={8}
          blocs={lecon.blocs}
          onClose={() => setLecon(null)}
        />
      )}

      <section className="rounded-2xl border border-pierre bg-white p-3.5 sm:rounded-3xl sm:p-6">
        <h1 className="font-display text-lg font-bold text-graphite sm:text-2xl">💻 Académie Logiciels</h1>
        <p className="mt-0.5 hidden text-sm text-graphite/60 sm:block">
          {items.length} logiciels du BTP · {totalLecons} leçons pas-à-pas en diapositives — pratique sans licence ni installation.
        </p>
        <p className="mt-0.5 text-xs text-graphite/50 sm:hidden">
          {items.length} logiciels · {totalLecons} leçons
        </p>
      </section>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full sm:h-44" />
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {items.map((l) => {
          const niveau = maitriseParSlug.get(l.slug) ?? 0;
          return (
            <div key={l.id} className="carte-vivante flex flex-col rounded-xl border border-pierre bg-white p-3.5 sm:rounded-2xl sm:p-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pierre/60 text-lg sm:h-11 sm:w-11 sm:text-xl">
                  {ICONES_CATEGORIE[l.categorie ?? ''] ?? '💻'}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-graphite sm:text-lg">{l.nom}</p>
                  <p className="truncate text-xs uppercase tracking-wide text-olive">{l.categorie}</p>
                </div>
              </div>

              <div className="mt-2.5 sm:mt-3">
                <div className="flex justify-between text-xs text-graphite/50">
                  <span>Maîtrise</span>
                  <span className="font-mono font-semibold text-cuivre">{niveau}/5</span>
                </div>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className={`h-2 flex-1 rounded-full ${n <= niveau ? 'bg-cuivre' : 'bg-pierre'}`} />
                  ))}
                </div>
              </div>

              <div className="mt-2.5 flex-1 space-y-1 sm:mt-3 sm:space-y-1.5">
                {l.exercices
                  .slice()
                  .sort((a, b) => a.niveau - b.niveau)
                  .map((e) => {
                    const aLecon = (e.config?.blocs ?? []).length > 0;
                    return (
                      <button
                        key={e.id}
                        disabled={!aLecon}
                        onClick={() => aLecon && setLecon({ titre: e.titre, logiciel: l.nom, blocs: e.config!.blocs! })}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all sm:px-3 sm:py-2 ${
                          aLecon ? 'bg-ivoire hover:-translate-y-0.5 hover:bg-sable/40 hover:shadow-sm' : 'bg-ivoire opacity-60'
                        }`}
                      >
                        <span className="truncate text-graphite/80">
                          {aLecon ? '▶ ' : ''}
                          {e.titre}
                        </span>
                        <span className="shrink-0 rounded-full bg-pierre px-2 py-0.5 font-mono font-semibold text-graphite/60">
                          niv. {e.niveau}
                        </span>
                      </button>
                    );
                  })}
                {!l.exercices.length && <p className="text-xs text-graphite/50">Leçons en préparation.</p>}
              </div>

              <p className="mt-2.5 hidden text-[11px] text-graphite/40 sm:mt-3 sm:block">
                Clique une leçon pour la suivre en diapositives. La maîtrise monte via les missions « Simulation logiciel ».
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
