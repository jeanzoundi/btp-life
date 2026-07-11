'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/app/auth-guard';
import { api } from '@/lib/api';
import { AvatarBtp, AVATAR_DEFAUT, OPTIONS_AVATAR, type AvatarConfig } from '@/components/app/avatar-btp';
import { MentorBulle } from '@/components/app/mentor';
import { TRAITS } from '@/lib/traits';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  famille: string;
  description: string | null;
}
interface MetierCible {
  id: string;
  slug: string;
  nom: string;
  famille: string;
  description: string | null;
}
interface Parcours {
  etapes: Array<{ nom: string; ordre: number; complete: boolean }>;
}

function OnboardingContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [etape, setEtape] = useState(1);
  const [nomPersonnage, setNomPersonnage] = useState('');
  const [config, setConfig] = useState<AvatarConfig>(AVATAR_DEFAUT);
  const [traitsChoisis, setTraitsChoisis] = useState<string[]>([]);
  const [profilId, setProfilId] = useState('');
  const [metierCibleId, setMetierCibleId] = useState('');
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: profils } = useQuery({
    queryKey: ['catalog', 'profils'],
    queryFn: () => api.get<{ items: Profil[] }>('/catalog/profils?pageSize=100'),
  });
  const { data: metiers } = useQuery({
    queryKey: ['catalog', 'metiers-cibles'],
    queryFn: () => api.get<{ items: MetierCible[] }>('/catalog/metiers-cibles?pageSize=100'),
  });

  const profilChoisi = profils?.items.find((p) => p.id === profilId);
  const metiersFiltres = metiers?.items.filter((m) => !profilChoisi || m.famille === profilChoisi.famille) ?? [];

  useEffect(() => {
    setMetierCibleId('');
  }, [profilId]);

  async function suivantAvatar() {
    setLoading(true);
    try {
      await api.patch('/carriere/avatar', {
        nomPersonnage,
        tenue: config.typeTenue,
        equipement: 'casque',
        config,
      });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(2);
    } finally {
      setLoading(false);
    }
  }

  function toggleTrait(slug: string) {
    setTraitsChoisis((t) => (t.includes(slug) ? t.filter((s) => s !== slug) : t.length < 3 ? [...t, slug] : t));
  }

  async function suivantTraits() {
    setLoading(true);
    try {
      await api.patch('/carriere/traits', { traits: traitsChoisis });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(3);
    } finally {
      setLoading(false);
    }
  }

  async function suivantProfil() {
    setLoading(true);
    try {
      await api.patch('/carriere/profil-actuel', { profilId });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(4);
    } finally {
      setLoading(false);
    }
  }

  async function suivantMetier() {
    setLoading(true);
    try {
      await api.patch('/carriere/metier-cible', { metierCibleId });
      const p = await api.post<Parcours>('/carriere/generer-parcours');
      setParcours(p);
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(5);
    } finally {
      setLoading(false);
    }
  }

  const progression = (etape / 5) * 100;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold text-graphite/60">Étape {etape} / 5</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-pierre">
          <div className="h-full bg-terracotta transition-all" style={{ width: `${progression}%` }} />
        </div>
      </div>

      {etape === 1 && (
        <div className="space-y-5">
          <MentorBulle>
            Salut, moi c&apos;est <strong>Akissi</strong>, ta mentor tout au long de l&apos;aventure ! On va
            construire ton personnage ensemble, puis je t&apos;expliquerai comment tout fonctionne. Prêt(e) ?
          </MentorBulle>
          <h1 className="font-display text-2xl font-bold text-graphite">Crée ton avatar</h1>
          <div className="flex justify-center">
            <div className="anim-float">
              <AvatarBtp config={config} taille={150} className="shadow-xl" />
            </div>
          </div>
          <input
            value={nomPersonnage}
            onChange={(e) => setNomPersonnage(e.target.value)}
            placeholder="Nom du personnage"
            className="w-full rounded-full border-2 border-pierre px-5 py-2.5 text-center font-display font-bold text-graphite focus:border-terracotta focus:outline-none"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniChoixCouleur titre="Teint" options={OPTIONS_AVATAR.peau} valeur={config.peau} onChange={(v) => setConfig((c) => ({ ...c, peau: v }))} />
            <MiniChoixCouleur titre="Casque" options={OPTIONS_AVATAR.casque} valeur={config.casque} onChange={(v) => setConfig((c) => ({ ...c, casque: v }))} />
            <MiniChoixCouleur titre="Tenue" options={OPTIONS_AVATAR.couleurTenue} valeur={config.couleurTenue} onChange={(v) => setConfig((c) => ({ ...c, couleurTenue: v }))} />
            <MiniChoixCouleur titre="Fond" options={OPTIONS_AVATAR.fond} valeur={config.fond} onChange={(v) => setConfig((c) => ({ ...c, fond: v }))} />
          </div>
          <div className="flex gap-2">
            {OPTIONS_AVATAR.typeTenue.map((t) => (
              <button
                key={t}
                onClick={() => setConfig((c) => ({ ...c, typeTenue: t }))}
                className={`flex-1 rounded-full border-2 px-3 py-2 text-xs font-semibold transition-all ${config.typeTenue === t ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-pierre text-graphite/60'}`}
              >
                {t === 'gilet' ? '🦺 Gilet' : t === 'bleu' ? '👔 Bleu de travail' : '👕 Chemise'}
              </button>
            ))}
          </div>
          <button
            disabled={!nomPersonnage || loading}
            onClick={suivantAvatar}
            className="anim-pulse-cta w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile disabled:opacity-50"
          >
            Continuer →
          </button>
        </div>
      )}

      {etape === 2 && (
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-bold text-graphite">Ta personnalité</h1>
          <p className="text-sm text-graphite/60">
            Choisis 1 à 3 traits qui te ressemblent — ils donnent une saveur à ton personnage, visible sur ton profil et ton CV.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TRAITS.map((t) => {
              const choisi = traitsChoisis.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  onClick={() => toggleTrait(t.slug)}
                  className={`rounded-xl border p-3 text-left transition-all ${choisi ? 'border-terracotta bg-terracotta/10' : 'border-pierre hover:border-sable'}`}
                >
                  <p className="font-medium text-graphite">{t.icone} {t.nom}</p>
                  <p className="mt-0.5 text-xs text-graphite/60">{t.description}</p>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-graphite/40">{traitsChoisis.length}/3 sélectionné{traitsChoisis.length > 1 ? 's' : ''}</p>
          <button
            disabled={!traitsChoisis.length || loading}
            onClick={suivantTraits}
            className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {etape === 3 && (
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-bold text-graphite">Ton profil actuel</h1>
          <p className="text-sm text-graphite/60">D&apos;où pars-tu dans ta carrière BTP ?</p>
          <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
            {(profils?.items ?? []).map((p) => (
              <button
                key={p.id}
                onClick={() => setProfilId(p.id)}
                className={`rounded-xl border p-3 text-left ${profilId === p.id ? 'border-terracotta bg-terracotta/10' : 'border-pierre'}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-olive">{p.famille}</p>
                <p className="font-medium text-graphite">{p.nom}</p>
              </button>
            ))}
          </div>
          <button
            disabled={!profilId || loading}
            onClick={suivantProfil}
            className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {etape === 4 && (
        <div className="space-y-4">
          <h1 className="font-display text-2xl font-bold text-graphite">Ton métier cible</h1>
          <p className="text-sm text-graphite/60">Vers quel métier veux-tu construire ta carrière ?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {metiersFiltres.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetierCibleId(m.id)}
                className={`rounded-xl border p-3 text-left ${metierCibleId === m.id ? 'border-terracotta bg-terracotta/10' : 'border-pierre'}`}
              >
                <p className="font-medium text-graphite">{m.nom}</p>
                <p className="text-sm text-graphite/60">{m.description}</p>
              </button>
            ))}
          </div>
          <button
            disabled={!metierCibleId || loading}
            onClick={suivantMetier}
            className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile disabled:opacity-50"
          >
            {loading ? 'Génération de ton parcours…' : 'Générer mon parcours'}
          </button>
        </div>
      )}

      {etape === 5 && (
        <div className="space-y-4">
          <h1 className="text-center font-display text-2xl font-bold text-graphite">Ton parcours est prêt !</h1>

          <MentorBulle role="ta mentor" taille={64}>
            <p>Bienvenue dans l&apos;aventure ! Voici comment ça marche, en quatre mots :</p>
            <ul className="mt-2 space-y-1">
              <li>📚 <strong>Apprends</strong> à l&apos;Académie (cours en diapositives + logiciels)</li>
              <li>🎯 <strong>Pratique</strong> avec des missions (quiz, calculs, décisions...)</li>
              <li>🏗️ <strong>Construis</strong> tes propres chantiers (budget, équipe, matériaux)</li>
              <li>📈 <strong>Progresse</strong> : XP, compétences, promotions, CV automatique</li>
            </ul>
            <p className="mt-2">
              À chaque nouvel onglet que tu ouvres, je serai là pour t&apos;expliquer ce que tu peux y faire —
              la première fois seulement, promis !
            </p>
          </MentorBulle>

          <div className="rounded-2xl border border-pierre bg-white p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/50">Ton parcours de carrière</p>
            {parcours?.etapes.map((e, i) => (
              <div key={e.nom} className="flex items-center gap-3 py-1">
                <span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-terracotta' : 'bg-pierre'}`} />
                <span className={i === 0 ? 'font-semibold text-graphite' : 'text-graphite/50'}>{e.nom}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/app')}
            className="anim-pulse-cta w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile"
          >
            Commencer l&apos;aventure →
          </button>
        </div>
      )}
    </div>
  );
}

function MiniChoixCouleur({
  titre,
  options,
  valeur,
  onChange,
}: {
  titre: string;
  options: string[];
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-graphite">{titre}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((couleur) => (
          <button
            key={couleur}
            onClick={() => onChange(couleur)}
            aria-label={couleur}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${valeur === couleur ? 'border-graphite shadow' : 'border-white'}`}
            style={{ backgroundColor: couleur }}
          />
        ))}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}
