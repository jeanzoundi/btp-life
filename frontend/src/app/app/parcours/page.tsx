'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/app/ui';

interface Poste {
  profilId: string;
  slug: string;
  nom: string;
  description: string | null;
  ordre: number;
  statut: 'atteint' | 'actuel' | 'prochain' | 'verrouille';
  estSommet: boolean;
  conditions: string[];
  manquants: string[];
  eligible: boolean;
}
interface Arbre {
  famille: string | null;
  profilActuel?: string;
  postes: Poste[];
}
interface CarriereMe {
  profilActuel?: { nom: string } | null;
  metierCible?: { nom: string } | null;
}
interface PnjActuel {
  nom: string;
  role: string;
}

const ROLE_PNJ: Record<string, { icone: string; label: string }> = {
  MAITRE_STAGE: { icone: '👷', label: 'Maître de stage' },
  SUPERVISEUR: { icone: '🦺', label: 'Superviseur' },
  CHEF_ENTREPRISE: { icone: '💼', label: "Chef d'entreprise" },
  PROFESSEUR: { icone: '🎓', label: 'Mentor' },
};

const FAMILLES: Record<string, { label: string; icone: string }> = {
  CHANTIER: { label: 'Chantier', icone: '🏗️' },
  BE: { label: "Bureau d'études", icone: '📐' },
  BIM: { label: 'BIM', icone: '🏢' },
  METRE: { label: 'Métré / Économie', icone: '🧾' },
  QUALITE: { label: 'Qualité / HSE', icone: '🦺' },
  TOPO: { label: 'Topographie', icone: '🗺️' },
  GEOTECH: { label: 'Géotechnique', icone: '🔬' },
  ENTREPRENEUR: { label: 'Entrepreneuriat', icone: '💼' },
};

const STYLE_STATUT: Record<Poste['statut'], { pastille: string; texte: string; carte: string }> = {
  atteint: { pastille: 'bg-olive text-ivoire', texte: 'text-graphite', carte: 'border-olive/40 bg-olive/5' },
  actuel: { pastille: 'bg-terracotta text-ivoire ring-4 ring-terracotta/20', texte: 'text-terracotta', carte: 'border-terracotta bg-terracotta/5' },
  prochain: { pastille: 'bg-cuivre text-ivoire', texte: 'text-graphite', carte: 'border-cuivre/50 bg-white' },
  verrouille: { pastille: 'bg-pierre text-graphite/40', texte: 'text-graphite/40', carte: 'border-pierre bg-pierre/20' },
};

export default function ParcoursPage() {
  const [detail, setDetail] = useState<string | null>(null);

  const { data: arbre, isLoading } = useQuery({
    queryKey: ['carriere', 'arbre'],
    queryFn: () => api.get<Arbre>('/carriere/arbre'),
  });
  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });
  const { data: pnjActuel } = useQuery({
    queryKey: ['carriere', 'pnj-actuel'],
    queryFn: () => api.get<PnjActuel>('/carriere/pnj-actuel'),
  });

  const famille = arbre?.famille ? FAMILLES[arbre.famille] : null;
  const postes = arbre?.postes ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-graphite sm:text-2xl">🧭 Mon parcours de carrière</h1>
        <p className="text-sm text-graphite/60">
          {carriere?.profilActuel?.nom ?? '—'} → objectif :{' '}
          <span className="font-semibold text-terracotta">{carriere?.metierCible?.nom ?? '—'}</span>
        </p>
      </div>

      {/* Synchronisé sur ta position réelle dans la filière : ce PNJ change à mesure que tu progresses. */}
      {pnjActuel && (
        <Link
          href="/app/messages"
          className="carte-vivante flex items-center gap-3 rounded-2xl border border-cuivre/30 bg-cuivre/5 px-4 py-3"
        >
          <span className="text-2xl">{ROLE_PNJ[pnjActuel.role]?.icone ?? '🧑‍💼'}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-cuivre">
              {ROLE_PNJ[pnjActuel.role]?.label ?? 'Ton interlocuteur'}
            </span>
            <span className="block truncate text-sm font-bold text-graphite">{pnjActuel.nom}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-cuivre">Messages →</span>
        </Link>
      )}

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && !postes.length && (
        <p className="rounded-2xl border border-dashed border-pierre p-8 text-center text-sm text-graphite/60">
          Aucun parcours —{' '}
          <Link href="/onboarding" className="font-semibold text-terracotta">
            termine ton onboarding
          </Link>{' '}
          pour choisir ton profil.
        </p>
      )}

      {famille && postes.length > 0 && (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm">
            <span className="text-lg">{famille.icone}</span>
            <span className="font-semibold text-graphite">Filière {famille.label}</span>
            <span className="ml-auto font-mono text-xs text-graphite/50">
              {postes.filter((p) => p.statut === 'atteint' || p.statut === 'actuel').length}/{postes.length} paliers
            </span>
          </div>

          <div className="rounded-2xl border border-pierre bg-white p-4 sm:p-6">
            {postes.map((p, i) => {
              const style = STYLE_STATUT[p.statut];
              const ouvert = detail === p.profilId;
              const cliquable = p.conditions.length > 0 && p.statut !== 'atteint';
              return (
                <div key={p.profilId} className="flex gap-3 sm:gap-4">
                  {/* Colonne timeline */}
                  <div className="flex flex-col items-center">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.pastille}`}>
                      {p.statut === 'atteint' ? '✔' : p.statut === 'verrouille' ? '🔒' : p.ordre}
                    </span>
                    {i < postes.length - 1 && (
                      <span className={`w-0.5 flex-1 ${p.statut === 'atteint' || p.statut === 'actuel' ? 'bg-olive' : 'bg-pierre'}`} />
                    )}
                  </div>

                  {/* Contenu du palier */}
                  <div className="min-w-0 flex-1 pb-5">
                    <button
                      onClick={() => cliquable && setDetail(ouvert ? null : p.profilId)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${style.carte} ${cliquable ? 'hover:shadow-sm' : 'cursor-default'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-display font-bold ${style.texte}`}>{p.nom}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {p.statut === 'actuel' && <span className="rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-bold text-ivoire">Tu es ici</span>}
                          {p.statut === 'prochain' && p.eligible && <span className="rounded-full bg-olive px-2 py-0.5 text-[10px] font-bold text-ivoire">Débloquable !</span>}
                          {p.statut === 'prochain' && !p.eligible && <span className="rounded-full bg-cuivre/15 px-2 py-0.5 text-[10px] font-bold text-cuivre">Prochaine étape</span>}
                          {p.estSommet && <span title="Sommet de la filière">👑</span>}
                          {cliquable && <span className={`text-graphite/40 transition-transform ${ouvert ? 'rotate-180' : ''}`}>⌄</span>}
                        </div>
                      </div>
                      <p className={`mt-0.5 text-xs ${p.statut === 'verrouille' ? 'text-graphite/35' : 'text-graphite/55'}`}>{p.description}</p>

                      {/* Conditions dépliables */}
                      {ouvert && p.conditions.length > 0 && (
                        <div className="anim-fade-up mt-2 border-t border-graphite/10 pt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-graphite/50">Conditions d&apos;accès</p>
                          <ul className="mt-1 space-y-0.5">
                            {p.conditions.map((c) => {
                              const estManquant = p.manquants.some((m) => m.toLowerCase().includes(c.split(' ')[0].toLowerCase()));
                              return (
                                <li key={c} className={`flex items-center gap-1.5 text-xs ${p.statut === 'prochain' && estManquant ? 'text-terracotta' : 'text-graphite/60'}`}>
                                  <span>{p.statut === 'prochain' ? (estManquant ? '○' : '✔') : '•'}</span> {c}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </button>

                    {p.statut === 'prochain' && (
                      <Link href="/app/promotions" className="mt-1.5 inline-block text-xs font-semibold text-terracotta hover:underline">
                        {p.eligible ? '→ Demander ma promotion' : '→ Voir ce qu\'il me manque'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-graphite/40">
            🔒 Les paliers grisés se débloquent l&apos;un après l&apos;autre. Touche un palier pour voir ses conditions.
          </p>
        </>
      )}
    </div>
  );
}
