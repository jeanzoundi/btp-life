'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ChantierIso } from '@/components/app/chantier-iso';

interface Chantier {
  id: string;
  nom: string;
  typeProjet: string;
  description: string | null;
  budget: number;
  devise: string;
  delaiJours: number;
  statut: string;
  niveauRequis: number;
  verrouille: boolean;
}
interface UserChantier {
  id: string;
  statut: string;
  avancementPct: number;
  noteFinale: string | null;
  budgetRestant: number;
  joursRestants: number;
  chantier: Chantier;
}

export default function ChantiersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [demarrageId, setDemarrageId] = useState<string | null>(null);

  const { data: catalogue } = useQuery({
    queryKey: ['chantiers', 'disponibles'],
    queryFn: () => api.get<Chantier[]>('/chantiers/disponibles'),
  });
  const { data: miens } = useQuery({
    queryKey: ['chantiers', 'mine'],
    queryFn: () => api.get<UserChantier[]>('/chantiers/mine'),
  });

  const enCoursOuTermines = new Set((miens ?? []).map((uc) => uc.chantier.id));
  const disponibles = (catalogue ?? []).filter((c) => !enCoursOuTermines.has(c.id));

  async function demarrer(chantierId: string) {
    setDemarrageId(chantierId);
    try {
      const uc = await api.post<UserChantier>(`/chantiers/${chantierId}/demarrer`);
      queryClient.invalidateQueries({ queryKey: ['chantiers', 'mine'] });
      router.push(`/app/chantiers/${uc.id}`);
    } finally {
      setDemarrageId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Chantiers virtuels</h1>
        <p className="text-sm text-graphite/60">BTP Simulator — phases, budget, délais et imprévus.</p>
      </div>

      {(miens ?? []).length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold text-graphite">Mes chantiers</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(miens ?? []).map((uc) => (
              <Link key={uc.id} href={`/app/chantiers/${uc.id}`} className="carte-vivante rounded-2xl border border-pierre bg-white p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-olive">{uc.chantier.typeProjet}</p>
                  {uc.noteFinale && <span className="rounded-full bg-cuivre/10 px-2 py-0.5 text-xs font-bold text-cuivre">Note {uc.noteFinale}</span>}
                </div>
                <div className="mt-2 flex justify-center">
                  <ChantierIso avancement={uc.avancementPct} taille={190} />
                </div>
                <p className="mt-1 font-display font-bold text-graphite">{uc.chantier.nom}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-pierre">
                  <div className="h-full bg-olive" style={{ width: `${uc.avancementPct}%` }} />
                </div>
                <p className="mt-2 text-xs text-graphite/50">
                  {uc.statut === 'termine' ? 'Terminé' : `${uc.avancementPct}% — ${uc.joursRestants} j restants`}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">Chantiers disponibles</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disponibles.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 ${c.verrouille ? 'border-pierre/60 bg-pierre/10' : 'border-pierre bg-white'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-olive">{c.typeProjet}</p>
                {c.verrouille && (
                  <span className="rounded-full bg-graphite/80 px-2 py-0.5 text-[10px] font-bold text-ivoire">
                    🔒 Niveau {c.niveauRequis}
                  </span>
                )}
              </div>
              <p className={`mt-1 font-display font-bold ${c.verrouille ? 'text-graphite/50' : 'text-graphite'}`}>{c.nom}</p>
              <p className={`mt-1 line-clamp-2 text-sm ${c.verrouille ? 'text-graphite/40' : 'text-graphite/60'}`}>{c.description}</p>
              <p className="mt-2 font-mono text-xs text-graphite/50">
                Budget {c.budget.toLocaleString('fr-FR')} {c.devise} · {c.delaiJours} jours
              </p>
              <button
                onClick={() => demarrer(c.id)}
                disabled={demarrageId === c.id || c.verrouille}
                title={c.verrouille ? `Se débloque au niveau ${c.niveauRequis}` : undefined}
                className="mt-3 w-full rounded-full bg-terracotta py-2 text-sm font-semibold text-ivoire hover:bg-argile disabled:opacity-40"
              >
                {c.verrouille ? `🔒 Débloqué au niveau ${c.niveauRequis}` : demarrageId === c.id ? 'Ouverture…' : 'Démarrer ce chantier'}
              </button>
            </div>
          ))}
          {!disponibles.length && <p className="text-sm text-graphite/60">Aucun nouveau chantier disponible.</p>}
        </div>
      </section>
    </div>
  );
}
