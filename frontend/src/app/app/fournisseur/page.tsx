'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/app/ui';

interface Prix {
  id: string;
  paysId: string;
  categorie: string;
  designation: string;
  unite: string;
  prixIndicatif: number;
  devise: string;
}
interface Materiau {
  id: string;
  paysId: string;
  materiau: string;
  disponibilite: string | null;
  prixIndicatif: number | null;
  notes: string | null;
}
interface CarriereMe {
  referentielPays?: { id: string; nom: string } | null;
}

const ICONES_CATEGORIE: Record<string, string> = {
  terrassement: '🚜',
  beton: '🧱',
  maconnerie: '🧱',
  acier: '🔩',
  coffrage: '🪵',
  couverture: '🏠',
  plomberie: '🚿',
  electricite: '⚡',
  peinture: '🎨',
  vrd: '🛣️',
  'main-oeuvre': '👷',
};

const LIBELLES_CATEGORIE: Record<string, string> = {
  terrassement: 'Terrassement',
  beton: 'Béton & granulats',
  maconnerie: 'Maçonnerie',
  acier: 'Acier',
  coffrage: 'Coffrage',
  couverture: 'Couverture',
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  peinture: 'Peinture & finitions',
  vrd: 'VRD',
  'main-oeuvre': "Main-d'œuvre",
};

const DISPO_STYLE: Record<string, string> = {
  Abondant: 'bg-olive/10 text-olive',
  Bon: 'bg-cuivre/10 text-cuivre',
  Limité: 'bg-terracotta/10 text-terracotta',
};

export default function FournisseurPage() {
  const [categorie, setCategorie] = useState('TOUS');

  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });
  const paysId = carriere?.referentielPays?.id;

  const { data: prixData, isLoading } = useQuery({
    queryKey: ['catalog', 'bibliotheques-prix'],
    queryFn: () => api.get<{ items: Prix[] }>('/catalog/bibliotheques-prix?pageSize=100'),
  });
  const { data: matData } = useQuery({
    queryKey: ['catalog', 'materiaux-pays'],
    queryFn: () => api.get<{ items: Materiau[] }>('/catalog/materiaux-pays?pageSize=100'),
  });

  const tousPrixBruts = prixData?.items ?? [];
  const tousPrix = paysId ? tousPrixBruts.filter((p) => p.paysId === paysId) : tousPrixBruts;
  const categories = [...new Set(tousPrix.map((p) => p.categorie))];
  const filtres = categorie === 'TOUS' ? tousPrix : tousPrix.filter((p) => p.categorie === categorie);
  const materiauxBruts = matData?.items ?? [];
  const materiaux = paysId ? materiauxBruts.filter((m) => m.paysId === paysId) : materiauxBruts;

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-pierre bg-white p-3.5 sm:rounded-3xl sm:p-6">
        <h1 className="font-display text-lg font-bold text-graphite sm:text-2xl">🚚 Le Fournisseur</h1>
        <p className="mt-0.5 text-sm text-graphite/60">
          Le catalogue de prix {carriere?.referentielPays?.nom ? `— référentiel ${carriere.referentielPays.nom}` : ''} : de quoi chiffrer
          juste tes devis et commandes de chantier.
        </p>
      </section>

      {/* Disponibilité des matériaux — vitrine du magasin */}
      {materiaux.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-graphite sm:text-lg">📦 Stock du fournisseur</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {materiaux.map((m) => (
              <div key={m.id} className="carte-vivante rounded-xl border border-pierre bg-white p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-graphite">{m.materiau}</p>
                  {m.disponibilite && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${DISPO_STYLE[m.disponibilite] ?? 'bg-pierre text-graphite/60'}`}>
                      {m.disponibilite}
                    </span>
                  )}
                </div>
                {m.prixIndicatif && (
                  <p className="mt-1 font-mono text-sm font-bold text-cuivre">{m.prixIndicatif.toLocaleString('fr-FR')} FCFA</p>
                )}
                {m.notes && <p className="mt-1 text-xs text-graphite/50">{m.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bibliothèque de prix — le vrai outil de devis */}
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-graphite sm:text-lg">🧾 Bibliothèque de prix</h2>
          <p className="text-xs text-graphite/50">{filtres.length} article{filtres.length > 1 ? 's' : ''}</p>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategorie('TOUS')}
            className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition-all ${
              categorie === 'TOUS' ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-pierre text-graphite/60'
            }`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategorie(c)}
              className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition-all ${
                categorie === c ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-pierre text-graphite/60'
              }`}
            >
              {ICONES_CATEGORIE[c] ?? '📦'} {LIBELLES_CATEGORIE[c] ?? c}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-pierre bg-white">
          {filtres.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i !== filtres.length - 1 ? 'border-b border-pierre/60' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="text-lg">{ICONES_CATEGORIE[p.categorie] ?? '📦'}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-graphite">{p.designation}</p>
                  <p className="text-[11px] text-graphite/45">{LIBELLES_CATEGORIE[p.categorie] ?? p.categorie}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-bold text-cuivre">{p.prixIndicatif.toLocaleString('fr-FR')} {p.devise}</p>
                <p className="text-[11px] text-graphite/45">/ {p.unite}</p>
              </div>
            </div>
          ))}
          {!isLoading && !filtres.length && (
            <p className="p-6 text-center text-sm text-graphite/50">Aucun article dans cette catégorie.</p>
          )}
        </div>
      </section>

      <p className="text-center text-xs text-graphite/40">
        Ces prix indicatifs alimentent tes devis (missions type Devis) et tes commandes de chantier.
      </p>
    </div>
  );
}
