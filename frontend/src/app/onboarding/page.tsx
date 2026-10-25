'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/app/auth-guard';
import { api } from '@/lib/api';
import { AvatarBtp, AVATAR_DEFAUT, OPTIONS_AVATAR, type AvatarConfig } from '@/components/app/avatar-btp';
import { MentorBulle } from '@/components/app/mentor';
import { TRAITS } from '@/lib/traits';
import { PresentationModes, SelectionProfilDepart } from '@/components/app/presentation-depart';
import { personnageProche, personnageDe, type IdPersonnage } from '@/lib/personnages-joueur';
import { gabaritDepuis, type GabaritPersonnage } from '@/lib/gabarit-personnage';
import { PROFILS_DEPART, porteDuProfil, type ProfilDepart } from '@/lib/profils-depart';
import { useModeExperienceStore, type ModeExperience } from '@/lib/mode-experience-store';
import { adresseMonde } from '@/lib/liens-modes';

const ChoixPersonnage = dynamic(() => import('@/components/app/choix-personnage').then(m => m.ChoixPersonnage), { ssr: false });

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
interface CarriereAccueil {
  avatar?: { nomPersonnage: string; config?: Record<string, unknown> | null } | null;
  traits?: string[];
  profilActuel?: Profil | null;
  metierCible?: MetierCible | null;
  parcours?: Parcours | null;
}

function OnboardingContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [etape, setEtape] = useState(0);
  const [nomPersonnage, setNomPersonnage] = useState('');
  const [config, setConfig] = useState<AvatarConfig>(AVATAR_DEFAUT);
  const [traitsChoisis, setTraitsChoisis] = useState<string[]>([]);
  const [profilId, setProfilId] = useState('');
  const [metierCibleId, setMetierCibleId] = useState('');
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeExperience>('classique');
  const setModeExperience = useModeExperienceStore(s => s.setMode);
  const [personnage, setPersonnage] = useState<IdPersonnage>('combinaison');
  const [gabarit, setGabarit] = useState<GabaritPersonnage>(() => gabaritDepuis(null));
  const [atelier, setAtelier] = useState(false);
  const [porte, setPorte] = useState<ProfilDepart | null>('etudiant');
  const [formation, setFormation] = useState<'BTS' | 'ingenieur'>('BTS');
  const initialise = useRef(false);
  const [profilInitialPresent, setProfilInitialPresent] = useState(false);
  const { data: carriere, isPending: chargeCarriere, isError: erreurCarriere, refetch: rechargerCarriere } = useQuery({
    queryKey: ['carriere', 'me'], queryFn: () => api.get<CarriereAccueil>('/carriere/me'), retry: 1,
  });
  const dejaInstalle = Boolean(carriere?.profilActuel);
  useEffect(() => {
    if (!carriere || initialise.current) return;
    initialise.current = true;
    setProfilInitialPresent(Boolean(carriere.profilActuel));
    const sauvegarde = carriere.avatar?.config ?? {};
    setNomPersonnage(carriere.avatar?.nomPersonnage ?? '');
    setConfig({ ...AVATAR_DEFAUT, ...sauvegarde } as AvatarConfig);
    setPersonnage(personnageProche(sauvegarde));
    setGabarit(gabaritDepuis(sauvegarde));
    setTraitsChoisis(Array.isArray(carriere.traits) ? carriere.traits : []);
    setProfilId(carriere.profilActuel?.id ?? '');
    setMetierCibleId(carriere.metierCible?.id ?? '');
    setPorte(carriere.profilActuel ? porteDuProfil(carriere.profilActuel.slug) : 'etudiant');
    setFormation(sauvegarde.formationDepart === 'ingenieur' ? 'ingenieur' : 'BTS');
    setParcours(carriere.parcours ?? null);
  }, [carriere]);

  const { data: profils, isError: erreurProfils, refetch: rechargerProfils } = useQuery({
    queryKey: ['catalog', 'profils'],
    queryFn: () => api.get<{ items: Profil[] }>('/catalog/profils?pageSize=100'),
  });
  const { data: metiers, isError: erreurMetiers, refetch: rechargerMetiers } = useQuery({
    queryKey: ['catalog', 'metiers-cibles'],
    queryFn: () => api.get<{ items: MetierCible[] }>('/catalog/metiers-cibles?pageSize=100'),
  });

  const profilChoisi = profils?.items.find((p) => p.id === profilId) ?? carriere?.profilActuel;
  const metiersFiltres = metiers?.items.filter((m) => !profilChoisi || m.famille === profilChoisi.famille) ?? [];

  // N'envoyer que les champs visuels : un retour à cette étape ne doit pas réécrire
  // une ancienne orientation de formation contenue dans la configuration initiale.
  const configComplete = { ...Object.fromEntries(Object.keys(AVATAR_DEFAUT).map(k => [k, config[k as keyof AvatarConfig]])), personnage, ...gabarit };
  const voie = PROFILS_DEPART.find(p => p.id === (profilChoisi ? porteDuProfil(profilChoisi.slug) : porte));
  const estEtudiant = Boolean(profilChoisi && porteDuProfil(profilChoisi.slug) === 'etudiant');
  const signalerErreur = (e: unknown) => setErreur(e instanceof Error ? e.message : 'Enregistrement impossible. Réessaie sans quitter cette page.');

  async function suivantAvatar() {
    setLoading(true);
    setErreur(null);
    try {
      await api.patch('/carriere/avatar', {
        nomPersonnage: nomPersonnage.trim(),
        tenue: config.typeTenue,
        equipement: 'casque',
        config: configComplete,
      });
      // La route dédiée valide les proportions et le modèle, également utilisés depuis le monde.
      await api.patch('/carriere/avatar/personnage', { personnage, nomPersonnage: nomPersonnage.trim(), ...gabarit });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(2);
    } catch (e) { signalerErreur(e); } finally {
      setLoading(false);
    }
  }

  function toggleTrait(slug: string) {
    setTraitsChoisis((t) => (t.includes(slug) ? t.filter((s) => s !== slug) : t.length < 3 ? [...t, slug] : t));
  }

  async function suivantTraits() {
    setLoading(true);
    setErreur(null);
    try {
      await api.patch('/carriere/traits', { traits: traitsChoisis });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(3);
    } catch (e) { signalerErreur(e); } finally {
      setLoading(false);
    }
  }

  async function suivantProfil() {
    setLoading(true);
    setErreur(null);
    try {
      // Un retour dans l'accueil n'est pas une reconversion et ne réinitialise pas la carrière.
      if (!dejaInstalle) await api.patch('/carriere/profil-actuel', { profilId });
      await api.patch('/carriere/avatar', { nomPersonnage: nomPersonnage.trim(), config: {
        voieDepart: voie?.id ?? 'specialite', formationDepart: estEtudiant ? formation : null,
      } });
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(4);
    } catch (e) { signalerErreur(e); } finally {
      setLoading(false);
    }
  }

  async function suivantMetier() {
    setLoading(true);
    setErreur(null);
    try {
      if (!carriere?.metierCible) await api.patch('/carriere/metier-cible', { metierCibleId });
      // Relire avant de créer évite de dupliquer le parcours lors d'une reprise après erreur.
      const actuel = await api.get<CarriereAccueil>('/carriere/me');
      const p = actuel.parcours ?? await api.post<Parcours>('/carriere/generer-parcours');
      setParcours(p);
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      setEtape(5);
    } catch (e) { signalerErreur(e); } finally {
      setLoading(false);
    }
  }

  const progression = ((etape + 1) / 6) * 100;

  if (chargeCarriere) return <p role="status" className="p-12 text-center text-graphite/60">Préparation de ton accueil…</p>;
  if (erreurCarriere) return <div className="mx-auto max-w-lg space-y-4 p-8"><p role="alert">Impossible de charger ton compte. Aucun changement n’a été effectué.</p><button onClick={() => rechargerCarriere()} className="rounded-full bg-terracotta px-5 py-3 text-ivoire">Réessayer</button></div>;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold text-graphite/60">Crée ta vie dans le BTP · Étape {etape + 1} / 6</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-pierre">
          <div className="h-full bg-terracotta transition-all" style={{ width: `${progression}%` }} />
        </div>
      </div>
      {etape > 0 && etape < 5 && <button disabled={loading} type="button" onClick={() => { setErreur(null); setEtape(e => e - 1); }} className="mb-4 text-sm font-semibold text-terracotta">← Retour</button>}
      {erreur && <p role="alert" className="mb-4 rounded-xl border border-terracotta/30 bg-terracotta/10 p-3 text-sm text-graphite">{erreur}</p>}
      {etape === 0 && <div className="space-y-5">
        <MentorBulle>Bienvenue ! Moi, c’est <strong>Akissi</strong>. Ici, tu apprends un métier, tu pratiques et tu construis ton avenir dans le bâtiment.</MentorBulle>
        <h1 className="font-display text-3xl font-bold text-graphite">Une vie à construire.<br /><span className="text-terracotta">Deux façons de la jouer.</span></h1>
        <p className="text-sm text-graphite/70">Choisis comment commencer. Tu pourras passer d’un mode à l’autre à tout moment.</p>
        <PresentationModes mode={mode} onMode={setMode} />
        {dejaInstalle && <p className="text-sm text-olive">Ton profil {carriere?.profilActuel?.nom}, ton argent et ta progression sont conservés.</p>}
        <button onClick={() => setEtape(1)} className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile">{dejaInstalle ? 'Retrouver mon personnage' : 'Créer mon personnage'} →</button>
      </div>}

      {etape === 1 && (
        <div className="space-y-5">
          <MentorBulle>
            Salut, moi c&apos;est <strong>Akissi</strong>, ta mentor tout au long de l&apos;aventure ! On va
            construire ton personnage ensemble, puis je t&apos;expliquerai comment tout fonctionne. Prêt(e) ?
          </MentorBulle>
          <h1 className="font-display text-2xl font-bold text-graphite">Ton personnage, dans les deux modes</h1>
          <div className="flex justify-center">
            <div className="anim-float">
              <AvatarBtp config={configComplete} taille={150} className="shadow-xl" />
            </div>
          </div>
          <button onClick={() => setAtelier(true)} className="w-full rounded-2xl border-2 border-terracotta bg-terracotta/10 p-4 text-left text-graphite">
            <span className="block font-display font-bold">🧍 {personnageDe(configComplete).titre} · Personnaliser en 3D</span>
            <span className="mt-1 block text-xs text-graphite/70">Choisis ton modèle, ta taille et ta morphologie. Ton apparence ne détermine pas ton métier.</span>
          </button>
          <input
            aria-label="Nom du personnage"
            maxLength={24}
            value={nomPersonnage}
            onChange={(e) => setNomPersonnage(e.target.value)}
            placeholder="Nom du personnage"
            className="w-full rounded-full border-2 border-pierre px-5 py-2.5 text-center font-display font-bold text-graphite focus:border-terracotta focus:outline-none"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniChoixCouleur titre="Casque" options={OPTIONS_AVATAR.casque} valeur={config.casque} onChange={(v) => setConfig((c) => ({ ...c, casque: v }))} />
            <MiniChoixCouleur titre="Tenue" options={OPTIONS_AVATAR.couleurTenue} valeur={config.couleurTenue} onChange={(v) => setConfig((c) => ({ ...c, couleurTenue: v }))} />
            <MiniChoixCouleur titre="Fond" options={OPTIONS_AVATAR.fond} valeur={config.fond} onChange={(v) => setConfig((c) => ({ ...c, fond: v }))} />
          </div>
          <p className="text-xs text-graphite/60">Ces couleurs habillent ton portrait classique. Le modèle 3D garde ses vêtements d’origine.</p>
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
            disabled={nomPersonnage.trim().length < 2 || nomPersonnage.trim().length > 24 || loading}
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
          <h1 className="font-display text-2xl font-bold text-graphite">D’où commence ton histoire ?</h1>
          <p className="text-sm text-graphite/60">Cinq portes d’entrée, toutes les filières du bâtiment. Choisis ta situation actuelle, puis ton objectif.</p>
          {dejaInstalle ? <p className="rounded-xl bg-olive/10 p-4 text-sm">Tu poursuis comme <strong>{carriere?.profilActuel?.nom}</strong>. Les changements de carrière se font depuis ton parcours, pas en recréant ton personnage.</p>
            : <SelectionProfilDepart profils={profils?.items ?? []} porte={porte} profilId={profilId} onPorte={p => { setPorte(p); setProfilId(''); setMetierCibleId(''); }} onProfil={id => { setProfilId(id); setMetierCibleId(''); }} />}
          {erreurProfils && <button onClick={() => rechargerProfils()} className="text-sm text-terracotta">Catalogue indisponible · Réessayer</button>}
          {estEtudiant && <label className="block text-sm font-semibold text-graphite">Ton objectif de formation
            <select value={formation} onChange={e => setFormation(e.target.value as 'BTS' | 'ingenieur')} className="mt-2 w-full rounded-xl border-2 border-pierre bg-white p-3">
              <option value="BTS">BTS</option><option value="ingenieur">Ingénieur</option>
            </select>
            <span className="mt-1 block text-xs font-normal text-graphite/60">Orientation sauvegardée. Ce choix ne délivre pas de diplôme et ne remplace pas les étapes de ton parcours.</span>
          </label>}
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
          {carriere?.metierCible && <p className="rounded-xl bg-olive/10 p-3 text-sm">Ton objectif actuel est conservé : <strong>{carriere.metierCible.nom}</strong>.</p>}
          {erreurMetiers && <button onClick={() => rechargerMetiers()} className="text-sm text-terracotta">Métiers indisponibles · Réessayer</button>}
          <div className="grid gap-2 sm:grid-cols-2">
            {metiersFiltres.map((m) => (
              <button
                key={m.id}
                disabled={Boolean(carriere?.metierCible)}
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
          {voie && <div className="rounded-2xl border border-pierre bg-white p-4">
            <h2 className="font-display font-bold text-graphite">Tes premiers repères · {voie.nom}</h2>
            <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-graphite/70">{voie.premiersPas.map(p => <li key={p}>{p}</li>)}</ol>
            <p className="mt-3 text-xs text-graphite/60">Ce sont des repères pour explorer les activités existantes. Aucun logement ni argent supplémentaire n’est attribué par cet écran.</p>
          </div>}
          <button
            onClick={() => { setModeExperience(mode); router.push(mode === 'monde' ? adresseMonde(profilInitialPresent ? undefined : voie?.lieu) : '/app'); }}
            className="anim-pulse-cta w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile"
          >
            {mode === 'monde' ? 'Entrer dans le monde vivant' : 'Ouvrir le mode classique'} →
          </button>
        </div>
      )}
      {atelier && <ChoixPersonnage initial={personnage} nomInitial={nomPersonnage} avatarConfig={configComplete} premierChoix={false} demo={false} enCours={false} erreur={null} brouillon
        onAnnuler={() => setAtelier(false)} onValider={(id, nom, proportions) => { setPersonnage(id); setNomPersonnage(nom); setGabarit(proportions); setAtelier(false); }} />}
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
