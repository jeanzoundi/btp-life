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

// Cadre de trophée selon la rareté — bordure, fond du médaillon, et lueur pour l'or.
const RARETE_CONFIG: Record<string, { bordure: string; medaillon: string; pastille: string; lueur: string; emoji: string }> = {
  BRONZE: { bordure: 'border-argile/40', medaillon: 'bg-argile/15', pastille: 'bg-argile/15 text-argile', lueur: '', emoji: '🥉' },
  ARGENT: { bordure: 'border-mineral/50', medaillon: 'bg-mineral/25', pastille: 'bg-mineral/25 text-graphite', lueur: '', emoji: '🥈' },
  OR: { bordure: 'border-cuivre/60', medaillon: 'bg-cuivre/20', pastille: 'bg-cuivre/20 text-cuivre', lueur: 'shadow-[0_0_18px_rgba(184,115,51,0.35)]', emoji: '🥇' },
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
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="fond-anime relative overflow-hidden rounded-3xl p-6 text-center text-ivoire shadow-2xl">
        <div className="grille-plan pointer-events-none absolute inset-0 opacity-40" />
        <div className="halo-hero" />
        <div className="reflet-heros" />
        <div className="relative">
          <p className="anim-float inline-block text-4xl">🏅</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">Ta vitrine de trophées</h1>
          <p className="mt-2 text-sm text-ivoire/75">
            {(badges ?? []).length} badge{(badges ?? []).length !== 1 ? 's' : ''} · {(certificats ?? []).length} certificat{(certificats ?? []).length !== 1 ? 's' : ''} — chaque réussite laisse une trace.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">Mes badges</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(badges ?? []).map((ub) => {
            const r = RARETE_CONFIG[ub.badge.rarete] ?? RARETE_CONFIG.BRONZE;
            return (
              <div key={ub.id} className={`carte-vivante rounded-2xl border-2 bg-white p-4 text-center ${r.bordure} ${r.lueur}`}>
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${r.medaillon}`}>{r.emoji}</div>
                <p className="mt-2 font-display font-bold text-graphite">{ub.badge.nom}</p>
                <p className="mt-1 line-clamp-2 text-xs text-graphite/60">{ub.badge.description}</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${r.pastille}`}>{ub.badge.rarete}</span>
              </div>
            );
          })}
          {!(badges ?? []).length && (
            <p className="rounded-2xl border border-dashed border-pierre p-6 text-sm text-graphite/60 sm:col-span-2 lg:col-span-4">
              Aucun badge — joue ta première mission pour décrocher ton premier trophée !
            </p>
          )}
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
