'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

interface Eligible {
  regle: { id: string; profilCible: { nom: string } };
  manquants: string[];
  eligible: boolean;
}
interface Demande {
  id: string;
  statut: string;
  createdAt: string;
  evaluation: { manquants?: string[] } | null;
  regle: { profilSource: { nom: string }; profilCible: { nom: string } };
}

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const { data: eligibles } = useQuery({
    queryKey: ['promotions', 'eligibles'],
    queryFn: () => api.get<Eligible[]>('/promotions/eligibles'),
  });
  const { data: demandes } = useQuery({
    queryKey: ['promotions', 'mine'],
    queryFn: () => api.get<Demande[]>('/promotions/mine'),
  });

  async function demander(regleId: string) {
    setErreur(null);
    setEnCours(regleId);
    try {
      await api.post(`/promotions/${regleId}/demander`);
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Promotions</h1>
        <p className="text-sm text-graphite/60">
          La progression est conditionnelle, pas automatique — toutes les conditions doivent être réunies.
        </p>
      </div>

      {erreur && <p className="text-sm text-terracotta">{erreur}</p>}

      <section className="space-y-4">
        {(eligibles ?? []).map((e) => (
          <div key={e.regle.id} className={`rounded-2xl border p-5 ${e.eligible ? 'border-olive bg-olive/5' : 'border-pierre bg-white'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-graphite">→ {e.regle.profilCible.nom}</p>
                {e.eligible ? (
                  <p className="text-sm font-semibold text-olive">Toutes les conditions sont réunies !</p>
                ) : (
                  <ul className="mt-1 space-y-0.5 text-sm text-graphite/70">
                    {e.manquants.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => demander(e.regle.id)}
                disabled={enCours === e.regle.id || !e.eligible}
                className="rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-ivoire hover:bg-argile disabled:opacity-40"
              >
                {enCours === e.regle.id ? 'Entretien en cours…' : 'Demander ma promotion'}
              </button>
            </div>
          </div>
        ))}
        {!(eligibles ?? []).length && (
          <p className="text-sm text-graphite/60">
            Aucune règle de promotion pour ton profil actuel — termine ton onboarding ou continue à progresser.
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">Historique de mes demandes</h2>
        <div className="mt-3 space-y-2">
          {(demandes ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-pierre bg-white p-3 text-sm">
              <span className="text-graphite">
                {d.regle.profilSource.nom} → <span className="font-semibold">{d.regle.profilCible.nom}</span>
              </span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${d.statut === 'ACCEPTEE' ? 'bg-olive/10 text-olive' : 'bg-terracotta/10 text-terracotta'}`}>
                {d.statut === 'ACCEPTEE' ? 'Acceptée 🎉' : 'Refusée'}
              </span>
            </div>
          ))}
          {!(demandes ?? []).length && <p className="text-sm text-graphite/60">Aucune demande pour l&apos;instant.</p>}
        </div>
      </section>
    </div>
  );
}
