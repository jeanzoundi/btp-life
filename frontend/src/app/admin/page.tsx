'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Kpis {
  totalUsers: number;
  inscritsSemaine: number;
  totalMissionsPubliees: number;
  missionsJouees: number;
  tauxReussiteGlobal: number;
  tauxCompletionOnboarding: number;
  totalChantiersTermines: number;
  tauxConversionPremium: number;
  tauxParMission: Array<{ missionId: string; titre: string; total: number; tauxReussite: number | null }>;
}

export default function AdminDashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: () => api.get<Kpis>('/admin/dashboard/kpis'),
  });

  const cartes = [
    ['Inscrits', kpis?.totalUsers],
    ['Inscrits / 7 jours', kpis?.inscritsSemaine],
    ['Missions publiées', kpis?.totalMissionsPubliees],
    ['Missions jouées', kpis?.missionsJouees],
    ['Taux de réussite', kpis ? `${kpis.tauxReussiteGlobal}%` : undefined],
    ['Onboarding complété', kpis ? `${kpis.tauxCompletionOnboarding}%` : undefined],
    ['Chantiers livrés', kpis?.totalChantiersTermines],
    ['Conversion premium', kpis ? `${kpis.tauxConversionPremium}%` : undefined],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-graphite">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartes.map(([label, valeur]) => (
          <div key={label} className="rounded-2xl border border-pierre bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite/50">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-graphite">{valeur ?? '—'}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-pierre bg-white p-5">
        <h2 className="font-display font-bold text-graphite">Équilibrage des missions</h2>
        <p className="text-xs text-graphite/50">Cible 60–85 % de réussite — détecte les missions trop dures ou trop faciles.</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-pierre text-left text-xs uppercase tracking-wide text-graphite/50">
              <th className="py-2">Mission</th>
              <th className="py-2 text-right">Jouées</th>
              <th className="py-2 text-right">Réussite</th>
            </tr>
          </thead>
          <tbody>
            {(kpis?.tauxParMission ?? []).map((m) => (
              <tr key={m.missionId} className="border-b border-pierre/50">
                <td className="py-2 text-graphite">{m.titre}</td>
                <td className="py-2 text-right font-mono text-graphite/70">{m.total}</td>
                <td className="py-2 text-right">
                  {m.tauxReussite === null ? (
                    <span className="text-graphite/40">—</span>
                  ) : (
                    <span
                      className={`font-mono font-semibold ${
                        m.tauxReussite < 60 ? 'text-terracotta' : m.tauxReussite > 85 ? 'text-cuivre' : 'text-olive'
                      }`}
                    >
                      {m.tauxReussite}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
