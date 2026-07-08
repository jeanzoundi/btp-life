'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvatarBtp } from '@/components/app/avatar-btp';
import { Skeleton } from '@/components/app/ui';

interface Entree {
  rang: number;
  estMoi: boolean;
  nom: string;
  avatarConfig: unknown;
  profil: string | null;
  niveau: number;
  xp: number;
  reputation: number;
}
interface Classement {
  top: Entree[];
  monRang: number;
}

const MEDAILLES = ['🥇', '🥈', '🥉'];

export default function ClassementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['carriere', 'classement'],
    queryFn: () => api.get<Classement>('/carriere/classement'),
  });

  const podium = (data?.top ?? []).slice(0, 3);
  const reste = (data?.top ?? []).slice(3);
  // Ordre d'affichage du podium : 2e, 1er, 3e (le champion au centre, plus haut)
  const ordrePodium = [podium[1], podium[0], podium[2]].filter(Boolean) as Entree[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-pierre bg-white p-6 text-center">
        <h1 className="font-display text-2xl font-bold text-graphite">🏆 Classement des bâtisseurs</h1>
        <p className="mt-1 text-sm text-graphite/60">
          Le top 20 par XP — ta place actuelle : <span className="font-display font-bold text-terracotta">#{data?.monRang ?? '—'}</span>
        </p>
      </section>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {/* Podium */}
      {podium.length > 0 && (
        <section className="flex items-end justify-center gap-4">
          {ordrePodium.map((e) => {
            const premier = e.rang === 1;
            return (
              <div key={e.rang} className={`flex flex-col items-center ${premier ? '-translate-y-3' : ''}`}>
                <span className="text-3xl">{MEDAILLES[e.rang - 1]}</span>
                <div className={premier ? 'anim-float' : ''}>
                  <AvatarBtp
                    config={e.avatarConfig}
                    taille={premier ? 108 : 84}
                    className={`shadow-xl ${e.estMoi ? 'ring-4 ring-terracotta' : ''}`}
                  />
                </div>
                <p className={`mt-2 max-w-28 truncate font-display font-bold text-graphite ${premier ? 'text-lg' : 'text-sm'}`}>
                  {e.nom} {e.estMoi && <span className="text-terracotta">(toi)</span>}
                </p>
                <p className="text-xs text-graphite/50">{e.profil ?? '—'}</p>
                <p className="mt-1 rounded-full bg-cuivre/10 px-3 py-0.5 font-mono text-xs font-bold text-cuivre">
                  {e.xp.toLocaleString('fr-FR')} XP
                </p>
                <div
                  className={`mt-2 w-24 rounded-t-xl bg-gradient-to-t text-center font-display font-bold text-ivoire ${
                    premier ? 'h-20 from-terracotta to-argile pt-2 text-2xl' : e.rang === 2 ? 'h-14 from-mineral to-pierre pt-2 text-xl' : 'h-10 from-cuivre to-sable pt-1 text-lg'
                  }`}
                >
                  {e.rang}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Reste du top 20 */}
      <section className="space-y-2">
        {reste.map((e) => (
          <div
            key={e.rang}
            className={`flex items-center gap-4 rounded-2xl border p-3 transition-transform hover:-translate-y-0.5 ${
              e.estMoi ? 'border-terracotta bg-terracotta/5' : 'border-pierre bg-white'
            }`}
          >
            <span className="w-8 text-center font-display text-lg font-bold text-graphite/40">#{e.rang}</span>
            <AvatarBtp config={e.avatarConfig} taille={44} className="!rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-graphite">
                {e.nom} {e.estMoi && <span className="text-xs font-bold text-terracotta">(toi)</span>}
              </p>
              <p className="truncate text-xs text-graphite/50">{e.profil ?? '—'} · Niv. {e.niveau}</p>
            </div>
            <p className="font-mono text-sm font-bold text-cuivre">{e.xp.toLocaleString('fr-FR')} XP</p>
          </div>
        ))}
        {!isLoading && !(data?.top ?? []).length && (
          <p className="rounded-2xl border border-dashed border-pierre p-8 text-center text-sm text-graphite/60">
            Le classement se remplit dès que les joueurs gagnent leurs premiers XP.
          </p>
        )}
      </section>

      <p className="text-center text-xs text-graphite/40">
        Le classement compare les joueurs (les comptes administrateurs n&apos;y figurent pas).
      </p>
    </div>
  );
}
