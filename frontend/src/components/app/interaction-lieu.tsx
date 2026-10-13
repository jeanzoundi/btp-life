'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { lieuParSlug, type ActionLieu } from '@/lib/lieux';
import type { BesoinsJoueur } from './quartier-3d';

type ActionBesoin = Extract<ActionLieu, { type: 'besoin' }>;
export function InteractionLieu({ slug, nom, href, demo, onDemo, onClose }: {
  slug: string; nom: string; href: string; demo: boolean;
  onDemo: (action: ActionBesoin) => void; onClose: () => void;
}) {
  const client = useQueryClient();
  const alias: Record<string, string> = { 'jardins-residence': 'residence', marche: 'maquis' };
  const lieu = lieuParSlug(alias[slug] ?? slug);
  const agir = useMutation({
    mutationFn: (action: ActionBesoin) => api.post<{ message: string; carriere: BesoinsJoueur; coutPaye: number }>(`/carriere/besoins/${action.besoin}`),
    onSuccess: (res) => {
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ({ ...ancienne, ...res.carriere }));
      client.invalidateQueries({ queryKey: ['carriere', 'me'] });
    },
  });
  const roles: Record<string, string> = { universite: 'Formation et compétences', entreprise: 'Votre entreprise et vos équipes', chantier: 'Missions et gestion de chantier', fournisseur: 'Matériaux et approvisionnement', 'bureau-etudes': 'Ingénierie et compétences', atelier: 'Formation aux logiciels du métier', logistique: 'Stocks et approvisionnement', agence: 'Offres et opportunités de carrière', 'construction-nord': 'Projets de construction du Plateau', 'centre-azur': 'Boutiques, équipement et restauration', 'galerie-palmiers': 'Commerces et services du quartier', marina: 'Promenade, café et activités nautiques', sports: 'Sport, détente et récompenses' };
  return <section aria-label={`Interactions : ${nom}`} className="absolute bottom-24 right-3 z-10 max-h-[55%] w-[min(330px,calc(100%-24px))] overflow-y-auto rounded-2xl border border-amber-200/30 bg-[#152b30]/95 p-5 text-white shadow-2xl backdrop-blur-xl">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[.2em] text-amber-200">Lieu sélectionné</p><h2 className="mt-1 text-xl font-bold">{nom}</h2></div><button aria-label="Fermer les interactions" onClick={onClose} className="rounded-lg bg-white/10 px-3 py-2">✕</button></div>
    <p className="mt-2 text-sm text-white/70">{lieu?.role ?? roles[slug]}</p>
    <p className="mt-3 text-xs leading-relaxed text-white/60">{lieu?.intro ?? 'Ouvrez cet établissement pour retrouver les activités de votre carrière.'}</p>
    <div className="mt-4 space-y-2">{lieu?.actions.filter((a): a is ActionBesoin => a.type === 'besoin').map(action => <button key={action.besoin} disabled={agir.isPending} onClick={() => demo ? onDemo(action) : agir.mutate(action)} className="w-full rounded-xl bg-[#e7c17b] p-3 text-left text-sm font-bold text-[#182e32] transition hover:bg-amber-100 disabled:opacity-50">
      {action.icone} {agir.isPending ? 'Action en cours…' : action.label}<span className="mt-1 block text-xs font-normal">{demo ? 'Essai gratuit · non sauvegardé' : action.cout ? `${action.cout.toLocaleString('fr-FR')} FCFA virtuels` : 'Gratuit'}</span>
    </button>)}</div>
    {agir.isSuccess && <p role="status" className="mt-3 text-sm text-emerald-300">{agir.data.message}{agir.data.coutPaye > 0 && ` (−${agir.data.coutPaye} F)`}</p>}
    {agir.isError && <p role="alert" className="mt-3 text-sm text-red-300">{agir.error.message || 'Action impossible. Réessayez.'}</p>}
    <Link href={demo ? '/connexion' : href} className="mt-4 block rounded-xl border border-white/20 p-3 text-center text-sm hover:bg-white/10">{demo ? 'Se connecter pour jouer et sauvegarder' : 'Entrer dans l’établissement →'}</Link>
    <p className="mt-3 text-[10px] text-white/50">{demo ? 'Démonstration : aucun compte modifié.' : 'Les actions validées sont enregistrées dans votre carrière.'}</p>
  </section>;
}
