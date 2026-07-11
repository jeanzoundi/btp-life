'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

interface CarriereMe {
  niveau: number;
  profilActuel?: { nom: string; famille: string } | null;
  nomEntreprise?: string | null;
}
interface ProchaineEtape {
  entreprise: { dejaEntrepreneur: boolean; eligible: boolean; niveauRequis: number };
}
interface Marche {
  id: string;
  nom: string;
  description: string | null;
  budget: number;
  devise: string;
  delaiJours: number;
  typeMarche: 'PRIVE' | 'PUBLIC';
  niveauRequis: number;
  reputationRequise: number;
  verrouille: boolean;
  entrepreneurRequis: boolean;
  dejaObtenu: boolean;
  prixMin: number;
  prixMax: number;
}
interface ResultatOffre {
  gagne: boolean;
  message?: string;
  userChantier?: { id: string };
}

const LABEL_TYPE_MARCHE: Record<'PRIVE' | 'PUBLIC', { label: string; icone: string; description: string }> = {
  PRIVE: { label: 'Marché privé', icone: '🏠', description: 'Le prix pèse lourd dans la sélection.' },
  PUBLIC: { label: 'Marché public', icone: '🏛️', description: "Appel d'offres — la réputation compte presque autant que le prix." },
};

export default function EntreprisePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [nomEdite, setNomEdite] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [offres, setOffres] = useState<Record<string, string>>({});
  const [resultats, setResultats] = useState<Record<string, ResultatOffre>>({});

  const { data: carriere, isLoading: chargementCarriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });
  const { data: prochaineEtape } = useQuery({
    queryKey: ['carriere', 'prochaine-etape'],
    queryFn: () => api.get<ProchaineEtape>('/carriere/prochaine-etape'),
  });
  const estEntrepreneur = carriere?.profilActuel?.famille === 'ENTREPRENEUR';

  const { data: marches, isLoading: chargementMarches } = useQuery({
    queryKey: ['chantiers', 'marches'],
    queryFn: () => api.get<Marche[]>('/chantiers/marches'),
    enabled: estEntrepreneur,
  });

  const devenirEntrepreneur = useMutation({
    mutationFn: (nom: string) => api.post('/carriere/devenir-entrepreneur', nom ? { nomEntreprise: nom } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setNomEdite(null);
    },
    onError: (err) => setErreur(err instanceof ApiError ? err.message : 'Erreur lors de la création'),
  });

  const renommer = useMutation({
    mutationFn: (nom: string) => api.patch('/carriere/nom-entreprise', { nom }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setNomEdite(null);
    },
    onError: (err) => setErreur(err instanceof ApiError ? err.message : 'Erreur lors du renommage'),
  });

  const soumettre = useMutation({
    mutationFn: ({ marcheId, prix }: { marcheId: string; prix: number }) =>
      api.post<ResultatOffre>(`/chantiers/marches/${marcheId}/soumettre-offre`, { prixPropose: prix }),
    onSuccess: (data, variables) => {
      setResultats((r) => ({ ...r, [variables.marcheId]: data }));
      queryClient.invalidateQueries({ queryKey: ['chantiers'] });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      if (data.gagne && data.userChantier) {
        setTimeout(() => router.push(`/app/chantiers/${data.userChantier!.id}`), 1400);
      }
    },
    onError: (err, variables) => {
      const message = err instanceof ApiError ? err.message : "Erreur lors de la soumission de l'offre";
      setResultats((r) => ({ ...r, [variables.marcheId]: { gagne: false, message } }));
    },
  });

  if (chargementCarriere) return <p className="text-sm text-graphite/60">Chargement…</p>;

  if (!estEntrepreneur) {
    const eligible = prochaineEtape?.entreprise.eligible ?? false;
    const niveauRequis = prochaineEtape?.entreprise.niveauRequis ?? 30;

    if (!eligible) {
      return (
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="font-display text-2xl font-bold text-graphite">Pas encore prêt(e) à te lancer</h1>
          <p className="text-sm text-graphite/60">
            Créer ton entreprise demande d&apos;avoir fait tes preuves : niveau {niveauRequis} minimum et avoir
            progressé au-delà des tout premiers postes de ta filière actuelle.
            {typeof carriere?.niveau === 'number' && <> Niveau actuel : {carriere.niveau}.</>}
          </p>
          <Link href="/app" className="block text-xs text-graphite/40 hover:underline">
            ← Retour au tableau de bord
          </Link>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p className="text-4xl">🏢</p>
        <h1 className="font-display text-2xl font-bold text-graphite">Tu n&apos;as pas encore d&apos;entreprise</h1>
        <p className="text-sm text-graphite/60">
          Crée ton entreprise pour candidater aux marchés privés et publics — une vraie filière indépendante,
          sans perdre ton niveau ni ton XP.
        </p>
        <input
          value={nomEdite ?? ''}
          onChange={(e) => setNomEdite(e.target.value)}
          placeholder="Nom de ton entreprise (optionnel)"
          className="w-full rounded-full border-2 border-pierre px-5 py-2.5 text-center font-display font-bold text-graphite focus:border-terracotta focus:outline-none"
        />
        {erreur && <p className="text-sm font-semibold text-terracotta">{erreur}</p>}
        <button
          onClick={() => devenirEntrepreneur.mutate(nomEdite ?? '')}
          disabled={devenirEntrepreneur.isPending}
          className="anim-pulse-cta w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile disabled:opacity-50"
        >
          {devenirEntrepreneur.isPending ? 'Création…' : 'Créer mon entreprise'}
        </button>
        <Link href="/app" className="block text-xs text-graphite/40 hover:underline">
          ← Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-graphite">🏢 {carriere?.nomEntreprise || 'Mon entreprise'}</h1>
        {nomEdite === null ? (
          <button onClick={() => setNomEdite(carriere?.nomEntreprise ?? '')} className="mt-1 text-xs font-semibold text-terracotta hover:underline">
            {carriere?.nomEntreprise ? 'Renommer' : "Donner un nom à l'entreprise"}
          </button>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={nomEdite}
              onChange={(e) => setNomEdite(e.target.value)}
              placeholder="Nom de l'entreprise"
              className="rounded-full border-2 border-pierre px-4 py-1.5 text-sm font-semibold text-graphite focus:border-terracotta focus:outline-none"
            />
            <button
              onClick={() => renommer.mutate(nomEdite)}
              disabled={renommer.isPending || !nomEdite.trim()}
              className="rounded-full bg-terracotta px-4 py-1.5 text-xs font-bold text-ivoire disabled:opacity-50"
            >
              Valider
            </button>
            <button onClick={() => setNomEdite(null)} className="text-xs text-graphite/50 hover:underline">
              Annuler
            </button>
          </div>
        )}
        {erreur && <p className="mt-1.5 text-sm font-semibold text-terracotta">{erreur}</p>}
        <p className="mt-2 text-sm text-graphite/60">Candidate aux marchés ci-dessous pour décrocher tes propres chantiers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {chargementMarches && <p className="text-sm text-graphite/60">Chargement des marchés…</p>}
        {(marches ?? []).map((m) => {
          const info = LABEL_TYPE_MARCHE[m.typeMarche];
          const resultat = resultats[m.id];
          return (
            <div key={m.id} className={`rounded-2xl border p-4 ${m.verrouille ? 'border-pierre/60 bg-pierre/10' : 'border-pierre bg-white'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-olive">{info.icone} {info.label}</p>
                {m.verrouille && (
                  <span className="rounded-full bg-graphite/80 px-2 py-0.5 text-[10px] font-bold text-ivoire">
                    🔒 Niveau {m.niveauRequis} · Rép. {m.reputationRequise}
                  </span>
                )}
              </div>
              <p className={`mt-1 font-display font-bold ${m.verrouille ? 'text-graphite/50' : 'text-graphite'}`}>{m.nom}</p>
              <p className={`mt-1 line-clamp-2 text-sm ${m.verrouille ? 'text-graphite/40' : 'text-graphite/60'}`}>{m.description}</p>
              <p className="mt-1 text-xs text-graphite/40">{info.description}</p>
              <p className="mt-2 font-mono text-xs text-graphite/50">
                Budget indicatif {m.budget.toLocaleString('fr-FR')} {m.devise} · {m.delaiJours} jours
              </p>

              {m.dejaObtenu ? (
                <p className="mt-3 rounded-full bg-olive/10 py-2 text-center text-xs font-bold text-olive">✓ Marché déjà remporté</p>
              ) : m.verrouille ? (
                <button disabled className="mt-3 w-full rounded-full bg-terracotta py-2 text-sm font-semibold text-ivoire opacity-40">
                  {m.entrepreneurRequis ? 'Réservé aux entrepreneurs' : `Débloqué au niveau ${m.niveauRequis}`}
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    min={m.prixMin}
                    max={m.prixMax}
                    value={offres[m.id] ?? ''}
                    onChange={(e) => setOffres((o) => ({ ...o, [m.id]: e.target.value }))}
                    placeholder={`Ton offre (${m.prixMin.toLocaleString('fr-FR')} – ${m.prixMax.toLocaleString('fr-FR')})`}
                    className="w-full rounded-full border border-pierre px-3 py-1.5 text-center text-sm text-graphite"
                  />
                  <button
                    onClick={() => soumettre.mutate({ marcheId: m.id, prix: Number(offres[m.id]) })}
                    disabled={soumettre.isPending || !offres[m.id]}
                    className="w-full rounded-full bg-terracotta py-2 text-sm font-semibold text-ivoire hover:bg-argile disabled:opacity-40"
                  >
                    {soumettre.isPending ? 'Envoi…' : "Soumettre l'offre"}
                  </button>
                </div>
              )}

              {resultat && (
                <p className={`mt-2 text-center text-xs font-semibold ${resultat.gagne ? 'text-olive' : 'text-terracotta'}`}>
                  {resultat.gagne ? '🎉 Marché remporté ! Redirection…' : resultat.message}
                </p>
              )}
            </div>
          );
        })}
        {!chargementMarches && !marches?.length && <p className="text-sm text-graphite/60">Aucun marché disponible pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
