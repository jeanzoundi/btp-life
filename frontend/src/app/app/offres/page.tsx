'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

interface Offre {
  id: string;
  titre: string;
  description: string | null;
  niveauMin: number;
  reputationMin: number;
  chantiersRequis: number;
  entrepriseFictive: string | null;
  testEntreeMissionId: string | null;
}
interface Candidature {
  id: string;
  statut: string;
  feedback: { manquants?: string[]; planAction?: string | null } | null;
  createdAt: string;
  offre: { titre: string };
}

export default function OffresPage() {
  const queryClient = useQueryClient();
  const [candidatureEnCours, setCandidatureEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const { data: offres } = useQuery({
    queryKey: ['catalog', 'offres'],
    queryFn: () => api.get<{ items: Offre[] }>('/catalog/offres-emploi?pageSize=50'),
  });
  const { data: candidatures } = useQuery({
    queryKey: ['candidatures', 'mine'],
    queryFn: () => api.get<Candidature[]>('/offres/candidatures/mine'),
  });

  async function candidater(offreId: string) {
    setErreur(null);
    setCandidatureEnCours(offreId);
    try {
      await api.post(`/offres/${offreId}/candidater`);
      queryClient.invalidateQueries({ queryKey: ['candidatures', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur lors de la candidature');
    } finally {
      setCandidatureEnCours(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Offres d&apos;emploi virtuelles</h1>
        <p className="text-sm text-graphite/60">Ton CV virtuel est envoyé automatiquement. Un refus donne toujours un plan d&apos;action.</p>
      </div>

      {erreur && <p className="text-sm text-terracotta">{erreur}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(offres?.items ?? []).map((o) => (
          <div key={o.id} className="rounded-2xl border border-pierre bg-white p-4">
            <p className="text-xs font-semibold text-graphite/50">{o.entrepriseFictive}</p>
            <p className="mt-1 font-display font-bold text-graphite">{o.titre}</p>
            <p className="mt-1 line-clamp-2 text-sm text-graphite/60">{o.description}</p>
            <ul className="mt-2 space-y-0.5 text-xs text-graphite/50">
              <li>• Niveau min : {o.niveauMin}</li>
              <li>• Réputation min : {o.reputationMin}</li>
              {o.chantiersRequis > 0 && <li>• {o.chantiersRequis} chantier(s) réalisé(s)</li>}
              {o.testEntreeMissionId && (
                <li>
                  • Test d&apos;entrée :{' '}
                  <Link href={`/app/missions/${o.testEntreeMissionId}`} className="font-semibold text-terracotta hover:underline">
                    passer le test
                  </Link>
                </li>
              )}
            </ul>
            <button
              onClick={() => candidater(o.id)}
              disabled={candidatureEnCours === o.id}
              className="mt-3 w-full rounded-full bg-terracotta py-2 text-sm font-semibold text-ivoire hover:bg-argile disabled:opacity-60"
            >
              {candidatureEnCours === o.id ? 'Envoi du CV…' : 'Candidater'}
            </button>
          </div>
        ))}
        {!(offres?.items ?? []).length && <p className="text-sm text-graphite/60">Aucune offre publiée pour l&apos;instant.</p>}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">Mes candidatures</h2>
        <div className="mt-3 space-y-3">
          {(candidatures ?? []).map((c) => (
            <div key={c.id} className="rounded-2xl border border-pierre bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-graphite">{c.offre.titre}</p>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    c.statut === 'ACCEPTEE' ? 'bg-olive/10 text-olive' : c.statut === 'REFUSEE' ? 'bg-terracotta/10 text-terracotta' : 'bg-pierre text-graphite/60'
                  }`}
                >
                  {c.statut === 'ACCEPTEE' ? 'Acceptée 🎉' : c.statut === 'REFUSEE' ? 'Refusée' : c.statut}
                </span>
              </div>
              {c.statut === 'REFUSEE' && c.feedback?.manquants?.length ? (
                <div className="mt-2 rounded-xl bg-pierre/40 p-3 text-sm">
                  <p className="font-semibold text-graphite">Il te manque :</p>
                  <ul className="mt-1 space-y-0.5 text-graphite/70">
                    {c.feedback.manquants.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-graphite/50">Complète ces conditions puis repostule — jamais de cul-de-sac.</p>
                </div>
              ) : null}
            </div>
          ))}
          {!(candidatures ?? []).length && <p className="text-sm text-graphite/60">Aucune candidature envoyée.</p>}
        </div>
      </section>
    </div>
  );
}
