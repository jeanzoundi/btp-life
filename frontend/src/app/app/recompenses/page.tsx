'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UserBadge {
  id: string;
  obtenuLe: string;
  badge: { nom: string; description: string | null; rarete: string };
}
interface UserCertificat {
  id: string;
  numeroUnique: string;
  delivreLe: string;
  certificat: { nom: string };
}

const RARETE_STYLE: Record<string, string> = {
  BRONZE: 'bg-argile/10 text-argile',
  ARGENT: 'bg-mineral/20 text-graphite',
  OR: 'bg-cuivre/15 text-cuivre',
};

export default function RecompensesPage() {
  const { data: badges } = useQuery({
    queryKey: ['badges', 'mine'],
    queryFn: () => api.get<UserBadge[]>('/users/me/badges'),
  });
  const { data: certificats } = useQuery({
    queryKey: ['certificats', 'mine'],
    queryFn: () => api.get<UserCertificat[]>('/users/me/certificats'),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">Badges & certificats</h1>
        <p className="text-sm text-graphite/60">Chaque réussite laisse une trace — y compris la persévérance après un échec.</p>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">Mes badges</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(badges ?? []).map((ub) => (
            <div key={ub.id} className="rounded-2xl border border-pierre bg-white p-4 text-center">
              <p className="text-3xl">🏅</p>
              <p className="mt-1 font-display font-bold text-graphite">{ub.badge.nom}</p>
              <p className="mt-1 text-xs text-graphite/60">{ub.badge.description}</p>
              <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${RARETE_STYLE[ub.badge.rarete] ?? ''}`}>
                {ub.badge.rarete}
              </span>
            </div>
          ))}
          {!(badges ?? []).length && <p className="text-sm text-graphite/60">Aucun badge — joue ta première mission !</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">Mes certificats</h2>
        <div className="mt-3 space-y-2">
          {(certificats ?? []).map((uc) => (
            <div key={uc.id} className="flex items-center justify-between rounded-xl border border-pierre bg-white p-4">
              <div>
                <p className="font-medium text-graphite">📜 {uc.certificat.nom}</p>
                <p className="font-mono text-xs text-graphite/50">N° {uc.numeroUnique}</p>
              </div>
              <p className="text-xs text-graphite/50">{new Date(uc.delivreLe).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
          {!(certificats ?? []).length && (
            <p className="text-sm text-graphite/60">
              Aucun certificat pour l&apos;instant — ils se débloquent en complétant des parcours et examens.
            </p>
          )}
        </div>
        <p className="mt-4 text-xs text-graphite/40">
          Certificat pédagogique délivré par le simulateur BTP Life — ne constitue pas une habilitation officielle.
        </p>
      </section>
    </div>
  );
}
