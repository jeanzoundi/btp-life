'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/app/ui';
import { QuartierIso } from '@/components/app/quartier-iso';
import { useAuthStore } from '@/lib/auth-store';

interface Lieu {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
}
interface CarriereMe {
  energie: number;
  moral: number;
  faim: number;
  social: number;
  niveau: number;
  avatar?: { nomPersonnage: string; config?: unknown } | null;
}

const ICONES: Record<string, string> = {
  ECOLE: '🏫',
  CENTRE_FORMATION: '📚',
  BUREAU_ETUDES: '📐',
  CHANTIER: '🏗️',
  ENTREPRISE: '🏢',
  FOURNISSEUR: '🚚',
  MAIRIE: '🏛️',
  BANQUE: '🏦',
  LABORATOIRE: '🔬',
  BUREAU_CONTROLE: '🧾',
  DEPOT: '📦',
  CLIENT: '🤝',
};

const DESTINATIONS: Record<string, string> = {
  ECOLE: '/app/academie',
  CENTRE_FORMATION: '/app/logiciels',
  BUREAU_ETUDES: '/app/competences',
  CHANTIER: '/app/chantiers',
  ENTREPRISE: '/app/profil',
  FOURNISSEUR: '/app/fournisseur',
  MAIRIE: '/app/lieu/mairie',
  BANQUE: '/app/lieu/banque',
  LABORATOIRE: '/app/lieu/laboratoire',
  BUREAU_CONTROLE: '/app/recompenses',
  DEPOT: '/app/depot',
  CLIENT: '/app/offres',
};

// Lieux de vie (hors base) : restaurent les besoins façon jeu de simulation.
const LIEUX_DE_VIE = [
  { slug: 'maquis', nom: 'Le Maquis', icone: '🍲', desc: 'Manger — restaure ta faim' },
  { slug: 'cafe', nom: 'Le Café', icone: '☕', desc: 'Discuter — restaure ton social' },
  { slug: 'residence', nom: 'Ma Résidence', icone: '🏠', desc: 'Dormir — restaure ton énergie' },
];

export default function MondePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['catalog', 'lieux'],
    queryFn: () => api.get<{ items: Lieu[] }>('/catalog/lieux?pageSize=20'),
  });
  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-graphite sm:text-2xl">🗺️ Le quartier BTP Life</h1>
        <p className="text-sm text-graphite/60">
          Ton monde à explorer — glisse au doigt ou à la souris, touche un bâtiment pour y entrer.
        </p>
      </div>

      {/* La carte est le vrai cœur de la page : plein cadre, immersive, pas une simple vignette. */}
      {isLoading ? (
        <Skeleton className="h-[58vh] min-h-[400px] w-full sm:h-[68vh]" />
      ) : (
        <div className="-mx-3 sm:-mx-4 md:-mx-6">
          <QuartierIso
            avatarConfig={carriere?.avatar?.config}
            nomJoueur={carriere?.avatar?.nomPersonnage}
            besoins={carriere ? { energie: carriere.energie, moral: carriere.moral, faim: carriere.faim, social: carriere.social } : undefined}
            niveau={carriere?.niveau}
            userId={user?.id}
          />
        </div>
      )}

      {/* Lieux de vie — restaurent les besoins (façon jeu de simulation) */}
      <div>
        <h2 className="mb-2 font-display text-base font-bold text-graphite sm:text-lg">🌇 Lieux de vie</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LIEUX_DE_VIE.map((l) => (
            <Link
              key={l.slug}
              href={`/app/lieu/${l.slug}`}
              className="carte-vivante flex items-center gap-3 rounded-xl border-2 border-terracotta/30 bg-white px-3 py-3"
            >
              <span className="text-2xl">{l.icone}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-graphite">{l.nom}</span>
                <span className="block truncate text-[11px] text-graphite/50">{l.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Accès rapides (liste accessible, même contenu que la carte) */}
      <div>
        <h2 className="mb-2 font-display text-base font-bold text-graphite sm:text-lg">🏙️ Les lieux du métier</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {(data?.items ?? []).map((l) => (
            <Link
              key={l.id}
              href={DESTINATIONS[l.slug] ?? '/app'}
              className="carte-vivante flex items-center gap-2 rounded-xl border border-pierre bg-white px-3 py-2.5"
            >
              <span className="text-xl">{ICONES[l.slug] ?? '📍'}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-graphite">{l.nom}</span>
                <span className="block truncate text-[11px] text-graphite/50">{l.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
