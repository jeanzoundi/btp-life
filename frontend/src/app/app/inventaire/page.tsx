'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PossessionAvatar {
  id: string;
  obtenuLe: string;
  source: string | null;
  equipe: boolean;
  item: {
    nom: string;
    description: string | null;
    categorie: 'CASQUE' | 'TENUE' | 'LUNETTES' | 'OUTIL' | 'ECUSSON' | 'CADRE';
    rarete: 'COMMUN' | 'PROFESSIONNEL' | 'RARE' | 'EXPERT' | 'LEGENDAIRE';
  };
}

interface UserBadge {
  id: string;
  obtenuLe: string;
  badge: { nom: string; description: string | null; rarete: string };
}

const CATEGORIE_LABEL: Record<PossessionAvatar['item']['categorie'], string> = {
  CASQUE: '⛑️ Casques',
  TENUE: '🦺 Tenues',
  LUNETTES: '🕶️ Lunettes',
  OUTIL: '🔧 Outils',
  ECUSSON: '🎖️ Écussons',
  CADRE: '🖼️ Cadres',
};

const RARETE_STYLE: Record<PossessionAvatar['item']['rarete'], string> = {
  COMMUN: 'bg-pierre text-graphite/70',
  PROFESSIONNEL: 'bg-blue-100 text-blue-700',
  RARE: 'bg-purple-100 text-purple-700',
  EXPERT: 'bg-terracotta/15 text-terracotta',
  LEGENDAIRE: 'bg-cuivre/15 text-cuivre',
};

export default function InventairePage() {
  const { data: possessions, isLoading } = useQuery({
    queryKey: ['avatar', 'inventaire'],
    queryFn: () => api.get<PossessionAvatar[]>('/carriere/avatar/inventaire'),
  });
  const { data: badges } = useQuery({
    queryKey: ['badges', 'mine'],
    queryFn: () => api.get<UserBadge[]>('/users/me/badges'),
  });

  const parCategorie = new Map<PossessionAvatar['item']['categorie'], PossessionAvatar[]>();
  for (const p of possessions ?? []) {
    const liste = parCategorie.get(p.item.categorie) ?? [];
    liste.push(p);
    parCategorie.set(p.item.categorie, liste);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-graphite">🎒 Inventaire</h1>
          <p className="text-sm text-graphite/60">Tout ce que ton avatar a débloqué au fil de sa carrière.</p>
        </div>
        <Link href="/app/dressing" className="rounded-full border border-pierre bg-white px-4 py-2 text-sm font-semibold text-graphite hover:border-graphite/30">
          Aller au dressing →
        </Link>
      </div>

      {isLoading && <p className="text-sm text-graphite/60">Chargement de l&apos;inventaire…</p>}

      {!isLoading && !(possessions ?? []).length && (
        <p className="rounded-2xl border border-dashed border-pierre p-8 text-center text-sm text-graphite/60">
          Rien pour l&apos;instant — progresse en niveau et choisis ton métier pour débloquer tes premiers items.
        </p>
      )}

      <div className="space-y-6">
        {(Object.keys(CATEGORIE_LABEL) as Array<PossessionAvatar['item']['categorie']>).map((cat) => {
          const liste = parCategorie.get(cat);
          if (!liste?.length) return null;
          return (
            <section key={cat}>
              <h2 className="font-display text-lg font-bold text-graphite">{CATEGORIE_LABEL[cat]}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {liste.map((p) => (
                  <div key={p.id} className={`rounded-2xl border bg-white p-4 ${p.equipe ? 'border-olive ring-2 ring-olive/30' : 'border-pierre'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display font-bold text-graphite">{p.item.nom}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${RARETE_STYLE[p.item.rarete]}`}>
                        {p.item.rarete}
                      </span>
                    </div>
                    {p.item.description && <p className="mt-1 text-xs text-graphite/60">{p.item.description}</p>}
                    <p className="mt-2 text-xs text-graphite/40">Obtenu le {new Date(p.obtenuLe).toLocaleDateString('fr-FR')}</p>
                    {p.equipe && <span className="mt-2 inline-block rounded-full bg-olive/10 px-3 py-0.5 text-xs font-bold text-olive">✔ Équipé</span>}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section>
        <h2 className="font-display text-lg font-bold text-graphite">🏅 Badges</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(badges ?? []).map((ub) => (
            <div key={ub.id} className="rounded-2xl border border-pierre bg-white p-4 text-center">
              <p className="text-3xl">🏅</p>
              <p className="mt-1 font-display font-bold text-graphite">{ub.badge.nom}</p>
              <p className="mt-1 text-xs text-graphite/60">{ub.badge.description}</p>
            </div>
          ))}
          {!(badges ?? []).length && <p className="text-sm text-graphite/60">Aucun badge — voir la page Récompenses.</p>}
        </div>
      </section>
    </div>
  );
}
