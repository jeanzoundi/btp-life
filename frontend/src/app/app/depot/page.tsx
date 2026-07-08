'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/app/ui';

interface Evenement {
  jour: number;
  type: string;
  texte: string;
}
interface UserChantier {
  id: string;
  statut: string;
  stock: Record<string, number> | null;
  evenementsLog: Evenement[] | null;
  chantier: { nom: string; typeProjet: string };
}

const ICONES_MATERIAU: Record<string, string> = {
  'Béton dosé 350kg/m³': '🧱',
  'Ciment CPJ 42,5': '🧱',
  'Agglos 15x20x40': '🧱',
  'Agglos 20x20x40': '🧱',
  'Fer à béton HA8': '🔩',
  'Fer à béton HA10': '🔩',
  'Fer à béton HA12': '🔩',
  'Sable de rivière': '⛱️',
  'Gravier concassé 5/15': '🪨',
  'Tôle bac alu 8/10': '🏠',
};

export default function DepotPage() {
  const { data: chantiers, isLoading } = useQuery({
    queryKey: ['chantiers', 'mine'],
    queryFn: () => api.get<UserChantier[]>('/chantiers/mine'),
  });

  const actifs = (chantiers ?? []).filter((c) => c.statut === 'en_cours');

  // Inventaire agrégé : { matériau: { total, parChantier: [{ nom, quantite }] } }
  const inventaire = new Map<string, { total: number; parChantier: Array<{ nom: string; id: string; quantite: number }> }>();
  for (const uc of actifs) {
    for (const [nom, qte] of Object.entries(uc.stock ?? {})) {
      if (!qte) continue;
      const entree = inventaire.get(nom) ?? { total: 0, parChantier: [] };
      entree.total += qte;
      entree.parChantier.push({ nom: uc.chantier.nom, id: uc.id, quantite: qte });
      inventaire.set(nom, entree);
    }
  }

  // Journal des livraisons récentes, toutes chantiers confondus
  const livraisons = actifs
    .flatMap((uc) => (uc.evenementsLog ?? []).filter((e) => e.type === 'commande').map((e) => ({ ...e, chantier: uc.chantier.nom, id: uc.id })))
    .sort((a, b) => b.jour - a.jour)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-pierre bg-white p-3.5 sm:rounded-3xl sm:p-6">
        <h1 className="font-display text-lg font-bold text-graphite sm:text-2xl">📦 Mon Dépôt</h1>
        <p className="mt-0.5 text-sm text-graphite/60">
          Le stock de matériaux déjà livrés sur tes chantiers en cours — commande depuis chaque chantier, le dépôt centralise tout.
        </p>
      </section>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !actifs.length && (
        <div className="rounded-2xl border border-dashed border-pierre p-8 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-2 text-sm text-graphite/60">Aucun chantier en cours — ton dépôt est vide pour l&apos;instant.</p>
          <Link href="/app/chantiers" className="mt-3 inline-block rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-ivoire">
            Démarrer un chantier
          </Link>
        </div>
      )}

      {inventaire.size > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-graphite sm:text-lg">🧱 Inventaire disponible</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {[...inventaire.entries()].map(([nom, info]) => (
              <div key={nom} className="carte-vivante rounded-xl border border-pierre bg-white p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pierre/60 text-lg">
                    {ICONES_MATERIAU[nom] ?? '📦'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-graphite">{nom}</p>
                    <p className="font-mono text-xs text-cuivre">{Math.round(info.total * 10) / 10} en stock</p>
                  </div>
                </div>
                {info.parChantier.length > 1 && (
                  <ul className="mt-2 space-y-0.5 border-t border-pierre/50 pt-2">
                    {info.parChantier.map((pc) => (
                      <li key={pc.id} className="flex justify-between text-[11px] text-graphite/50">
                        <span className="truncate">{pc.nom}</span>
                        <span className="font-mono">{Math.round(pc.quantite * 10) / 10}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {actifs.length > 0 && !inventaire.size && (
        <p className="rounded-2xl border border-dashed border-pierre p-6 text-center text-sm text-graphite/60">
          Aucun matériau livré pour l&apos;instant — passe commande depuis tes chantiers en cours.
        </p>
      )}

      {livraisons.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-graphite sm:text-lg">🚚 Dernières livraisons</h2>
          <div className="space-y-2">
            {livraisons.map((l, i) => (
              <Link
                key={i}
                href={`/app/chantiers/${l.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-pierre bg-white px-3.5 py-2.5 text-sm transition-colors hover:border-terracotta"
              >
                <span className="min-w-0 truncate text-graphite/80">{l.texte}</span>
                <span className="shrink-0 rounded-full bg-pierre px-2 py-0.5 text-[10px] font-semibold text-graphite/50">{l.chantier}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {actifs.length > 0 && (
        <div className="text-center">
          <Link href="/app/chantiers" className="text-sm font-semibold text-terracotta hover:underline">
            Gérer mes chantiers →
          </Link>
        </div>
      )}
    </div>
  );
}
