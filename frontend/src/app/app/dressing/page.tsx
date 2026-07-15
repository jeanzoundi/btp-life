'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvatarBtp } from '@/components/app/avatar-btp';

interface ItemDressing {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  categorie: 'CASQUE' | 'TENUE' | 'LUNETTES' | 'OUTIL' | 'ECUSSON' | 'CADRE';
  rarete: 'COMMUN' | 'PROFESSIONNEL' | 'RARE' | 'EXPERT' | 'LEGENDAIRE';
  metierRequis: string | null;
  niveauRequis: number;
  possede: boolean;
  equipe: boolean;
  eligible: boolean;
}

interface CarriereMe {
  niveau: number;
  avatar?: { config?: unknown } | null;
}

const CATEGORIES: Array<{ cle: ItemDressing['categorie']; label: string; icone: string }> = [
  { cle: 'CASQUE', label: 'Casques', icone: '⛑️' },
  { cle: 'TENUE', label: 'Tenues', icone: '🦺' },
  { cle: 'LUNETTES', label: 'Lunettes', icone: '🕶️' },
  { cle: 'OUTIL', label: 'Outils', icone: '🔧' },
  { cle: 'ECUSSON', label: 'Écussons', icone: '🎖️' },
  { cle: 'CADRE', label: 'Cadres de prestige', icone: '🖼️' },
];

const RARETE_STYLE: Record<ItemDressing['rarete'], string> = {
  COMMUN: 'bg-pierre text-graphite/70',
  PROFESSIONNEL: 'bg-blue-100 text-blue-700',
  RARE: 'bg-purple-100 text-purple-700',
  EXPERT: 'bg-terracotta/15 text-terracotta',
  LEGENDAIRE: 'bg-cuivre/15 text-cuivre',
};

const RARETE_LABEL: Record<ItemDressing['rarete'], string> = {
  COMMUN: 'Commun',
  PROFESSIONNEL: 'Professionnel',
  RARE: 'Rare',
  EXPERT: 'Expert',
  LEGENDAIRE: 'Légendaire',
};

function nomLisible(slug: string) {
  return slug
    .split('-')
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(' ');
}

export default function DressingPage() {
  const queryClient = useQueryClient();
  const [categorieActive, setCategorieActive] = useState<ItemDressing['categorie']>('CASQUE');

  const { data: items, isLoading } = useQuery({
    queryKey: ['avatar', 'dressing'],
    queryFn: () => api.get<ItemDressing[]>('/carriere/avatar/dressing'),
  });
  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });

  const equiper = useMutation({
    mutationFn: (itemId: string) => api.post('/carriere/avatar/equiper', { itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar', 'dressing'] });
      queryClient.invalidateQueries({ queryKey: ['carriere', 'me'] });
    },
  });

  const itemsCategorie = (items ?? []).filter((i) => i.categorie === categorieActive);

  // Le personnage réagit à l'outil actuellement équipé, façon jeu de simulation.
  const outilEquipe = (carriere?.avatar?.config as { outil?: string } | undefined)?.outil;
  const animationApercu =
    outilEquipe === 'plan' ? 'lecture-plan' : outilEquipe === 'tablette' ? 'tablette' : 'repos';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-pierre bg-white p-6 sm:flex-row sm:items-start">
        <AvatarBtp config={carriere?.avatar?.config} taille={120} animation={animationApercu} />
        <div>
          <h1 className="font-display text-xl font-bold text-graphite sm:text-2xl">🎽 Dressing</h1>
          <p className="mt-1 text-sm text-graphite/60">
            Débloque des tenues et accessoires en progressant en niveau et dans ton métier. Équipe ce que tu possèdes pour changer ton avatar.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.cle}
            onClick={() => setCategorieActive(cat.cle)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              categorieActive === cat.cle ? 'bg-graphite text-ivoire' : 'border border-pierre bg-white text-graphite/70 hover:border-graphite/30'
            }`}
          >
            {cat.icone} {cat.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-graphite/60">Chargement du dressing…</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {itemsCategorie.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border bg-white p-4 ${item.equipe ? 'border-olive ring-2 ring-olive/30' : 'border-pierre'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-display font-bold text-graphite">{item.nom}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${RARETE_STYLE[item.rarete]}`}>
                {RARETE_LABEL[item.rarete]}
              </span>
            </div>
            {item.description && <p className="mt-1 text-xs text-graphite/60">{item.description}</p>}

            <div className="mt-3 space-y-1 text-xs text-graphite/50">
              <p>Niveau requis : <span className="font-semibold text-graphite/70">{item.niveauRequis}</span></p>
              {item.metierRequis && (
                <p>Métier requis : <span className="font-semibold text-graphite/70">{nomLisible(item.metierRequis)}</span></p>
              )}
            </div>

            <div className="mt-3">
              {item.equipe ? (
                <span className="inline-block rounded-full bg-olive/10 px-3 py-1 text-xs font-bold text-olive">✔ Équipé</span>
              ) : item.possede ? (
                <button
                  onClick={() => equiper.mutate(item.id)}
                  disabled={equiper.isPending}
                  className="rounded-full bg-graphite px-4 py-1.5 text-xs font-semibold text-ivoire transition-transform hover:scale-105 disabled:opacity-50"
                >
                  Équiper
                </button>
              ) : item.eligible ? (
                <span className="inline-block rounded-full bg-terracotta/10 px-3 py-1 text-xs font-semibold text-terracotta">
                  Bientôt débloqué
                </span>
              ) : (
                <span className="inline-block rounded-full bg-pierre px-3 py-1 text-xs font-semibold text-graphite/50">
                  🔒 Verrouillé
                </span>
              )}
            </div>
          </div>
        ))}
        {!isLoading && !itemsCategorie.length && (
          <p className="col-span-full text-sm text-graphite/60">Aucun item dans cette catégorie pour le moment.</p>
        )}
      </div>
    </div>
  );
}
