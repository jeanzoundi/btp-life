'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { lieuParSlug, type ActionLieu } from '@/lib/lieux';
import { jouerSon } from '@/lib/sons';
import { PanneauBesoins } from '@/components/app/besoins';

interface CarriereMe {
  argentVirtuel: number;
  epargne: number;
  energie: number;
  moral: number;
  faim: number;
  social: number;
}

export default function LieuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const lieu = lieuParSlug(slug);

  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });

  if (!lieu) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-pierre p-8 text-center">
        <p className="text-4xl">🚧</p>
        <p className="mt-2 text-sm text-graphite/60">Ce lieu n&apos;existe pas encore.</p>
        <Link href="/app/monde" className="mt-3 inline-block rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-ivoire">
          Retour au quartier
        </Link>
      </div>
    );
  }

  const aBesoin = lieu.actions.some((a) => a.type === 'besoin');

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <Link href="/app/monde" className="inline-flex items-center gap-1 text-sm font-semibold text-graphite/60 hover:text-terracotta">
        ← Le quartier
      </Link>

      {/* En-tête immersif */}
      <section className="overflow-hidden rounded-3xl border border-pierre bg-white">
        <div className="flex items-center gap-4 p-5 text-ivoire sm:p-6" style={{ backgroundColor: lieu.couleur }}>
          <span className="text-4xl sm:text-5xl">{lieu.icone}</span>
          <div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">{lieu.nom}</h1>
            <p className="text-sm text-ivoire/80">{lieu.role}</p>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-graphite/80">{lieu.intro}</p>
          <ul className="mt-3 space-y-1">
            {lieu.ambiance.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-graphite/50">
                <span className="mt-0.5">·</span> {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Actions du lieu */}
      <div className="grid gap-3 sm:grid-cols-2">
        {lieu.actions.map((action, i) => (
          <ActionCarte key={i} action={action} argent={carriere?.argentVirtuel ?? 0} epargne={carriere?.epargne ?? 0} />
        ))}
      </div>

      {/* Les lieux de vie montrent l'état des besoins pour voir l'effet de l'action */}
      {aBesoin && carriere && (
        <PanneauBesoins besoins={{ energie: carriere.energie, moral: carriere.moral, faim: carriere.faim, social: carriere.social }} compact />
      )}
    </div>
  );
}

function ActionCarte({ action, argent, epargne }: { action: ActionLieu; argent: number; epargne: number }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const agir = useMutation({
    mutationFn: (besoin: string) => api.post<{ message: string; change: boolean; coutPaye: number }>(`/carriere/besoins/${besoin}`),
    onSuccess: (res) => {
      jouerSon(res.change ? 'succes' : 'clic');
      setErreur(null);
      setMessage(res.change && res.coutPaye > 0 ? `${res.message} (−${res.coutPaye.toLocaleString('fr-FR')} F)` : res.message);
      queryClient.invalidateQueries({ queryKey: ['carriere', 'me'] });
      setTimeout(() => setMessage(null), 3500);
    },
    onError: (err) => {
      jouerSon('echec');
      setErreur(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
      setTimeout(() => setErreur(null), 3500);
    },
  });

  if (action.type === 'besoin') {
    const abordable = action.cout === 0 || argent >= action.cout;
    return (
      <div className="rounded-2xl border-2 border-terracotta/40 bg-white p-4">
        <p className="flex items-center gap-2 font-display font-bold text-graphite">
          <span className="text-xl">{action.icone}</span> {action.label}
        </p>
        <p className="mt-1 text-sm text-graphite/60">{action.description}</p>
        {action.cout > 0 && (
          <p className={`mt-1 text-xs font-semibold ${abordable ? 'text-cuivre' : 'text-terracotta'}`}>
            Coût : {action.cout.toLocaleString('fr-FR')} F {!abordable && '— solde insuffisant'}
          </p>
        )}
        {message && <p className="anim-fade-up mt-2 rounded-lg bg-olive/10 px-3 py-1.5 text-xs font-semibold text-olive">{message}</p>}
        {erreur && <p className="anim-fade-up mt-2 rounded-lg bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta">{erreur}</p>}
        <button
          onClick={() => agir.mutate(action.besoin)}
          disabled={agir.isPending}
          className="anim-pulse-cta mt-3 w-full rounded-full bg-terracotta py-2.5 text-sm font-semibold text-ivoire transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {action.icone} {action.label}
        </button>
      </div>
    );
  }

  if (action.type === 'lien') {
    return (
      <Link href={action.href} className="carte-vivante flex flex-col rounded-2xl border border-pierre bg-white p-4">
        <p className="flex items-center gap-2 font-display font-bold text-graphite">
          <span className="text-xl">{action.icone}</span> {action.label}
        </p>
        <p className="mt-1 flex-1 text-sm text-graphite/60">{action.description}</p>
        <p className="mt-2 text-sm font-semibold text-terracotta">Y aller →</p>
      </Link>
    );
  }

  if (action.type === 'epargne') {
    return <CarteEpargne action={action} argent={argent} epargne={epargne} />;
  }

  // info — cas spécial "Mon solde" à la banque
  const estSolde = action.label === 'Mon solde';
  return (
    <div className="rounded-2xl border border-pierre bg-pierre/20 p-4">
      <p className="flex items-center gap-2 font-display font-bold text-graphite">
        <span className="text-xl">{action.icone}</span> {action.label}
      </p>
      {estSolde ? (
        <p className="mt-2 font-mono text-2xl font-bold text-cuivre">{argent.toLocaleString('fr-FR')} FCFA</p>
      ) : (
        <p className="mt-1 text-sm text-graphite/60">{action.description}</p>
      )}
    </div>
  );
}

function CarteEpargne({ action, argent, epargne }: { action: Extract<ActionLieu, { type: 'epargne' }>; argent: number; epargne: number }) {
  const queryClient = useQueryClient();
  const [montant, setMontant] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  function surReussite(msg: string) {
    jouerSon('succes');
    setErreur(null);
    setMessage(msg);
    setMontant('');
    queryClient.invalidateQueries({ queryKey: ['carriere', 'me'] });
    setTimeout(() => setMessage(null), 3500);
  }
  function surErreur(err: unknown) {
    jouerSon('echec');
    setErreur(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    setTimeout(() => setErreur(null), 3500);
  }

  const deposer = useMutation({
    mutationFn: (m: number) => api.post('/carriere/epargne/deposer', { montant: m }),
    onSuccess: () => surReussite('Déposé en épargne !'),
    onError: surErreur,
  });
  const retirer = useMutation({
    mutationFn: (m: number) => api.post('/carriere/epargne/retirer', { montant: m }),
    onSuccess: () => surReussite('Retiré de l’épargne !'),
    onError: surErreur,
  });

  const montantValide = Math.floor(Number(montant));
  const enCours = deposer.isPending || retirer.isPending;

  return (
    <div className="rounded-2xl border-2 border-[#2E5FA3]/30 bg-white p-4 sm:col-span-2">
      <p className="flex items-center gap-2 font-display font-bold text-graphite">
        <span className="text-xl">{action.icone}</span> {action.label}
      </p>
      <p className="mt-1 text-sm text-graphite/60">{action.description}</p>
      <p className="mt-2 font-mono text-xl font-bold text-[#2E5FA3]">{epargne.toLocaleString('fr-FR')} FCFA en épargne</p>

      {message && <p className="anim-fade-up mt-2 rounded-lg bg-olive/10 px-3 py-1.5 text-xs font-semibold text-olive">{message}</p>}
      {erreur && <p className="anim-fade-up mt-2 rounded-lg bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta">{erreur}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          placeholder="Montant"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="w-32 rounded-full border border-pierre px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
        />
        <button
          onClick={() => montantValide > 0 && deposer.mutate(montantValide)}
          disabled={enCours || !(montantValide > 0)}
          className="rounded-full bg-[#2E5FA3] px-4 py-2 text-sm font-semibold text-ivoire transition-transform hover:scale-105 disabled:opacity-40"
        >
          Déposer
        </button>
        <button
          onClick={() => montantValide > 0 && retirer.mutate(montantValide)}
          disabled={enCours || !(montantValide > 0)}
          className="rounded-full border border-[#2E5FA3] px-4 py-2 text-sm font-semibold text-[#2E5FA3] transition-transform hover:scale-105 disabled:opacity-40"
        >
          Retirer
        </button>
      </div>
      <p className="mt-2 text-xs text-graphite/40">Solde disponible : {argent.toLocaleString('fr-FR')} F</p>
    </div>
  );
}
