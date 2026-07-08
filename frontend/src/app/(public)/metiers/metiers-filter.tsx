'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  famille: string;
  niveauDepart?: string | number | null;
}

const FAMILLES_LABELS: Record<string, string> = {
  CHANTIER: 'Chantier',
  BE: 'Bureau d’études',
  BIM: 'BIM',
  TOPO: 'Topographie',
  GEOTECH: 'Géotechnique',
  METRE: 'Métré / Devis',
  QUALITE: 'Qualité / HSE',
  ENTREPRENEUR: 'Entrepreneur',
};

export function MetiersFilter({ profils }: { profils: Profil[] }) {
  const [famille, setFamille] = useState<string>('TOUS');

  const famillesDisponibles = useMemo(() => {
    const set = new Set(profils.map((p) => p.famille));
    return Array.from(set);
  }, [profils]);

  const filtres = useMemo(
    () => (famille === 'TOUS' ? profils : profils.filter((p) => p.famille === famille)),
    [profils, famille]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFamille('TOUS')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            famille === 'TOUS'
              ? 'bg-terracotta text-ivoire'
              : 'border border-pierre bg-white text-graphite/70 hover:border-terracotta'
          }`}
        >
          Tous les domaines
        </button>
        {famillesDisponibles.map((f) => (
          <button
            key={f}
            onClick={() => setFamille(f)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              famille === f
                ? 'bg-terracotta text-ivoire'
                : 'border border-pierre bg-white text-graphite/70 hover:border-terracotta'
            }`}
          >
            {FAMILLES_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filtres.map((p) => (
          <Link
            key={p.id}
            href={`/metiers/${p.slug}`}
            className="rounded-2xl border border-pierre bg-white p-6 transition hover:border-terracotta hover:shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-olive">
              {FAMILLES_LABELS[p.famille] ?? p.famille}
            </p>
            <p className="mt-2 font-display text-lg font-bold text-graphite">{p.nom}</p>
            {p.description && <p className="mt-2 text-sm text-graphite/60">{p.description}</p>}
            <p className="mt-4 text-sm font-semibold text-terracotta">Découvrir ce métier →</p>
          </Link>
        ))}
        {!filtres.length && (
          <p className="text-sm text-graphite/60">Aucun métier ne correspond à ce filtre pour le moment.</p>
        )}
      </div>
    </div>
  );
}
