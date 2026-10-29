'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AvatarBtp, AVATAR_DEFAUT, OPTIONS_AVATAR, type AvatarConfig } from './avatar-btp';
import { MentorBulle } from './mentor';
import { TRAITS, traitParSlug } from '@/lib/traits';
import { PresentationModes, SelectionProfilDepart } from './presentation-depart';
import { APPARENCE_DEFAUT, apparenceSurMesure, ID_SUR_MESURE, personnageDuChoix, personnageProche } from '@/lib/personnages-joueur';
import { gabaritDepuis, SILHOUETTES, STATURES } from '@/lib/gabarit-personnage';
import { francs } from '@/lib/patrimoine';
import { PROFILS_DEPART, porteDuProfil, primeInstallation, type ProfilCatalogue, type ProfilDepart } from '@/lib/profils-depart';
import { useModeExperienceStore, type ModeExperience } from '@/lib/mode-experience-store';
import { adresseMonde } from '@/lib/liens-modes';
import { CASQUE_DEFAUT, couleurCasque } from '@/lib/casques';
import { POLICES_JEU } from '@/lib/polices-jeu';
import { nomValide, ReglagesPersonnage, type ReglagesJoueur } from './reglages-personnage';
import { useEnregistrerPersonnage } from './enregistrer-personnage';

// « Crée ta vie » : l'écran de création, juste après l'inscription. Le personnage réaliste reste à l'écran d'un bout à
// l'autre, sur son plateau tournant, et chaque choix s'y voit : le mode, le modèle et ses réglages, le caractère, la
// porte d'entrée dans le bâtiment et le métier visé. En aperçu (`demo`), rien ne part au serveur : le personnage reste
// dans ce navigateur, et le monde de démonstration le reprend.

const ScenePersonnage = dynamic(() => import('./scene-personnage').then(m => m.ScenePersonnage), {
  ssr: false, loading: () => <p role="status" className="grid h-full place-items-center text-[13px] text-jeu-ivoire/60">Chargement du personnage…</p>,
});

const ETAPES = ['Mode', 'Personnage', 'Caractère', 'Départ', 'Métier', 'Prêt'] as const;

interface MetierCible { id: string; slug: string; nom: string; famille: string; description: string | null }
interface Parcours { etapes: Array<{ nom: string; ordre: number; complete: boolean }> }
interface CarriereAccueil {
  avatar?: { nomPersonnage: string; config?: Record<string, unknown> | null } | null;
  traits?: string[];
  profilActuel?: ProfilCatalogue | null;
  metierCible?: MetierCible | null;
  parcours?: Parcours | null;
}

// Exemples du catalogue pour l'aperçu, qui n'appelle jamais l'API.
const EXEMPLES_PROFILS: ProfilCatalogue[] = [
  ['etudiant-chantier', 'Étudiant BTP', 'CHANTIER'], ['etudiant-be', 'Étudiant Bureau d’études', 'BE'],
  ['ouvrier-qualifie', 'Ouvrier qualifié', 'ENTREPRENEUR'], ['dessinateur-junior', 'Dessinateur junior', 'BE'],
  ['dessinateur-bim', 'Dessinateur BIM', 'BIM'], ['chef-equipe', 'Chef d’équipe', 'CHANTIER'],
  ['ingenieur-structure', 'Ingénieur structure', 'BE'], ['aide-metreur', 'Aide métreur', 'METRE'],
].map(([slug, nom, famille]) => ({ id: slug, slug, nom, famille, description: null }));
const EXEMPLES_METIERS: MetierCible[] = [
  ['conducteur-travaux', 'Conducteur de travaux', 'CHANTIER', 'Piloter les chantiers : planning, équipes et budget.'],
  ['ingenieur-structure', 'Ingénieur structure', 'BE', 'Concevoir et vérifier les structures des ouvrages.'],
  ['bim-coordinateur', 'BIM coordinateur', 'BIM', 'Coordonner la maquette numérique du projet.'],
  ['economiste', 'Économiste de la construction', 'METRE', 'Chiffrer les ouvrages et suivre les coûts.'],
  ['entrepreneur', 'Entrepreneur', 'ENTREPRENEUR', 'Créer et diriger son entreprise de BTP.'],
].map(([slug, nom, famille, description]) => ({ id: slug, slug, nom, famille, description }));

/** La frise des étapes : les étapes passées se rouvrent d'un clic, les suivantes attendent leur tour. */
function Etapes({ etape, onAller, bloque }: { etape: number; onAller: (etape: number) => void; bloque: boolean }) {
  return <ol aria-label="Étapes de la création" className="flex flex-wrap items-center gap-1.5">
    {ETAPES.map((nom, i) => {
      const passee = i < etape, courante = i === etape;
      return <li key={nom}>
        <button type="button" disabled={!passee || bloque || etape === ETAPES.length - 1} onClick={() => onAller(i)} aria-current={courante ? 'step' : undefined}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${courante ? 'bg-jeu-or text-[#2A1C0E]' : passee ? 'bg-white/10 text-jeu-ivoire hover:bg-white/15' : 'bg-white/[.04] text-jeu-ivoire/40'}`}>
          <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${courante ? 'bg-[#2A1C0E]/15' : passee ? 'bg-jeu-lagune/80 text-[#0f2426]' : 'bg-white/10'}`}>{passee ? '✓' : i + 1}</span>
          <span className={courante ? '' : 'hidden sm:inline'}>{nom}</span>
        </button>
      </li>;
    })}
  </ol>;
}

function Titre({ children, sousTitre }: { children: ReactNode; sousTitre?: ReactNode }) {
  return <div><h1 className="hud-titre text-2xl leading-tight sm:text-[28px]">{children}</h1>{sousTitre && <p className="mt-1.5 text-[13px] leading-relaxed text-jeu-ivoire/70">{sousTitre}</p>}</div>;
}

function BoutonSuite({ children, desactive, onClick }: { children: ReactNode; desactive?: boolean; onClick: () => void }) {
  return <button type="button" disabled={desactive} onClick={onClick} className="hud-bouton hud-bouton-principal w-full p-3.5 text-[15px] disabled:opacity-50">{children}</button>;
}

function MiniChoixCouleur({ titre, options, valeur, onChange }: { titre: string; options: string[]; valeur: string; onChange: (v: string) => void }) {
  return <div>
    <p className="hud-legende mb-1.5">{titre}</p>
    <div className="flex flex-wrap gap-1.5">
      {options.map(couleur => <button key={couleur} type="button" onClick={() => onChange(couleur)} aria-label={`${titre} ${couleur}`}
        className={`h-7 w-7 rounded-full border border-black/20 transition-transform hover:scale-110 ${valeur === couleur ? 'ring-2 ring-jeu-or ring-offset-2 ring-offset-[#1b3133]' : ''}`} style={{ backgroundColor: couleur }} />)}
    </div>
  </div>;
}

export function CreationVie({ demo = false }: { demo?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [etape, setEtape] = useState(0);
  const [reglages, setReglages] = useState<ReglagesJoueur>({ personnage: 'combinaison', nom: demo ? 'Kouassi' : '', stature: 'moyenne', silhouette: 'standard', casque: CASQUE_DEFAUT, apparence: APPARENCE_DEFAUT });
  const [config, setConfig] = useState<AvatarConfig>(AVATAR_DEFAUT);
  const [traitsChoisis, setTraitsChoisis] = useState<string[]>([]);
  const [profilId, setProfilId] = useState('');
  const [metierCibleId, setMetierCibleId] = useState('');
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeExperience>('classique');
  const setModeExperience = useModeExperienceStore(s => s.setMode);
  const [porte, setPorte] = useState<ProfilDepart | null>('etudiant');
  const [formation, setFormation] = useState<'BTS' | 'ingenieur'>('BTS');
  const initialise = useRef(false);
  const [profilInitialPresent, setProfilInitialPresent] = useState(false);
  const enregistrerDemo = useEnregistrerPersonnage(true);
  // Chaque étape s'ouvre en haut de l'écran, même si la précédente avait défilé.
  const ecran = useRef<HTMLDivElement>(null);
  useEffect(() => { ecran.current?.scrollTo?.({ top: 0 }); }, [etape]);
  const { data: carriere, isPending, isError: erreurCarriere, refetch: rechargerCarriere } = useQuery({
    queryKey: ['carriere', 'me'], queryFn: () => api.get<CarriereAccueil>('/carriere/me'), retry: 1, enabled: !demo,
  });
  const chargeCarriere = !demo && isPending;
  const dejaInstalle = Boolean(carriere?.profilActuel);
  useEffect(() => {
    if (!carriere || initialise.current) return;
    initialise.current = true;
    setProfilInitialPresent(Boolean(carriere.profilActuel));
    const sauvegarde = carriere.avatar?.config ?? {};
    setReglages({
      personnage: personnageProche(sauvegarde), nom: carriere.avatar?.nomPersonnage ?? '', ...gabaritDepuis(sauvegarde), casque: couleurCasque(sauvegarde) ?? CASQUE_DEFAUT,
      apparence: apparenceSurMesure(sauvegarde),
    });
    setConfig({ ...AVATAR_DEFAUT, ...sauvegarde } as AvatarConfig);
    setTraitsChoisis(Array.isArray(carriere.traits) ? carriere.traits : []);
    setProfilId(carriere.profilActuel?.id ?? '');
    setMetierCibleId(carriere.metierCible?.id ?? '');
    setPorte(carriere.profilActuel ? porteDuProfil(carriere.profilActuel.slug) : 'etudiant');
    setFormation(sauvegarde.formationDepart === 'ingenieur' ? 'ingenieur' : 'BTS');
    setParcours(carriere.parcours ?? null);
  }, [carriere]);

  const { data: profilsCatalogue, isError: erreurProfils, refetch: rechargerProfils } = useQuery({
    queryKey: ['catalog', 'profils'], queryFn: () => api.get<{ items: ProfilCatalogue[] }>('/catalog/profils?pageSize=100'), enabled: !demo,
  });
  const { data: metiersCatalogue, isError: erreurMetiers, refetch: rechargerMetiers } = useQuery({
    queryKey: ['catalog', 'metiers-cibles'], queryFn: () => api.get<{ items: MetierCible[] }>('/catalog/metiers-cibles?pageSize=100'), enabled: !demo,
  });
  const profils = demo ? EXEMPLES_PROFILS : profilsCatalogue?.items ?? [];
  const metiers = demo ? EXEMPLES_METIERS : metiersCatalogue?.items ?? [];

  const profilChoisi = profils.find(p => p.id === profilId) ?? carriere?.profilActuel;
  const metiersFiltres = metiers.filter(m => !profilChoisi || m.famille === profilChoisi.famille);
  const metierChoisi = metiers.find(m => m.id === metierCibleId) ?? carriere?.metierCible;
  // N'envoyer que les champs visuels : un retour à cette étape ne doit pas réécrire une ancienne orientation de
  // formation contenue dans la configuration initiale. Le casque est celui du créateur, dans les deux modes.
  const configComplete = {
    ...Object.fromEntries(Object.keys(AVATAR_DEFAUT).map(k => [k, config[k as keyof AvatarConfig]])),
    casque: reglages.casque, personnage: reglages.personnage, stature: reglages.stature, silhouette: reglages.silhouette,
    ...(reglages.personnage === ID_SUR_MESURE ? { apparence: reglages.apparence } : {}),
  };
  // Le personnage sur mesure envoie aussi son apparence (coiffure, barbe, teint, tenue…).
  const apparenceChoisie = reglages.personnage === ID_SUR_MESURE ? { apparence: reglages.apparence } : {};
  const voie = PROFILS_DEPART.find(p => p.id === (profilChoisi ? porteDuProfil(profilChoisi.slug) : porte));
  const estEtudiant = Boolean(profilChoisi && porteDuProfil(profilChoisi.slug) === 'etudiant');
  const modele = personnageDuChoix(reglages.personnage, reglages.apparence);
  const signalerErreur = (e: unknown) => setErreur(e instanceof Error ? e.message : 'Enregistrement impossible. Réessaie sans quitter cette page.');

  /** Une étape qui enregistre : chargement, erreur affichée sans quitter l'étape, puis l'étape suivante. */
  async function enregistrer(suivante: number, action: () => Promise<void>) {
    setLoading(true);
    setErreur(null);
    try { await action(); setEtape(suivante); } catch (e) { signalerErreur(e); } finally { setLoading(false); }
  }

  const suivantAvatar = () => enregistrer(2, async () => {
    const nom = reglages.nom.trim();
    if (demo) { await enregistrerDemo.mutateAsync({ personnage: reglages.personnage, nom, stature: reglages.stature, silhouette: reglages.silhouette, casque: reglages.casque, ...apparenceChoisie }); return; }
    await api.patch('/carriere/avatar', { nomPersonnage: nom, tenue: config.typeTenue, equipement: 'casque', config: configComplete });
    // La route dédiée valide les proportions et le modèle, également utilisés depuis le monde.
    await api.patch('/carriere/avatar/personnage', { personnage: reglages.personnage, nomPersonnage: nom, stature: reglages.stature, silhouette: reglages.silhouette, ...apparenceChoisie });
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
  });

  function toggleTrait(slug: string) {
    setTraitsChoisis(t => (t.includes(slug) ? t.filter(s => s !== slug) : t.length < 3 ? [...t, slug] : t));
  }

  const suivantTraits = () => enregistrer(3, async () => {
    if (demo) return;
    await api.patch('/carriere/traits', { traits: traitsChoisis });
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
  });

  const suivantProfil = () => enregistrer(4, async () => {
    if (demo) return;
    // Un retour dans l'accueil n'est pas une reconversion et ne réinitialise pas la carrière.
    if (!dejaInstalle) await api.patch('/carriere/profil-actuel', { profilId });
    await api.patch('/carriere/avatar', { nomPersonnage: reglages.nom.trim(), config: {
      voieDepart: voie?.id ?? 'specialite', formationDepart: estEtudiant ? formation : null,
    } });
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
  });

  const suivantMetier = () => enregistrer(5, async () => {
    if (demo) {
      setParcours({ etapes: [profilChoisi?.nom ?? 'Débuts', 'Premières missions', 'Première promotion', metierChoisi?.nom ?? 'Métier visé'].map((nom, i) => ({ nom, ordre: i + 1, complete: i === 0 })) });
      return;
    }
    if (!carriere?.metierCible) await api.patch('/carriere/metier-cible', { metierCibleId });
    // Relire avant de créer évite de dupliquer le parcours lors d'une reprise après erreur.
    const actuel = await api.get<CarriereAccueil>('/carriere/me');
    setParcours(actuel.parcours ?? await api.post<Parcours>('/carriere/generer-parcours'));
    queryClient.invalidateQueries({ queryKey: ['carriere'] });
  });

  function entrer() {
    if (demo) { router.push(mode === 'monde' ? `/simulation-preview?lieu=${voie?.lieu ?? 'universite'}` : '/inscription'); return; }
    setModeExperience(mode);
    router.push(mode === 'monde' ? adresseMonde(profilInitialPresent ? undefined : voie?.lieu) : '/app');
  }

  if (chargeCarriere) return <p role="status" className="p-12 text-center text-graphite/60">Préparation de ton accueil…</p>;
  if (erreurCarriere) return <div className="mx-auto max-w-lg space-y-4 p-8"><p role="alert">Impossible de charger ton compte. Aucun changement n’a été effectué.</p><button onClick={() => rechargerCarriere()} className="rounded-full bg-terracotta px-5 py-3 text-ivoire">Réessayer</button></div>;

  const traits = traitsChoisis.map(traitParSlug).filter(t => t !== undefined);
  // L'écran défile dans son propre conteneur : le corps de page masque le débordement horizontal, ce qui empêcherait
  // le personnage de rester épinglé à côté du panneau.
  return <div ref={ecran} className={`h-[100dvh] overflow-y-auto bg-[radial-gradient(ellipse_at_top,#1d3a3c,#0e2022_60%)] text-jeu-ivoire ${POLICES_JEU} hud-texte`}>
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-5">
      <div>
        <p className="hud-legende text-jeu-or">BTP Life · Crée ta vie</p>
        <p className="text-[12px] text-jeu-ivoire/60">Étape {etape + 1} / {ETAPES.length} · {ETAPES[etape]}{demo ? ' · aperçu, aucun compte modifié' : ''}</p>
      </div>
      <Etapes etape={etape} bloque={loading} onAller={i => { setErreur(null); setEtape(i); }} />
    </header>
    <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_460px]">
      <aside aria-label="Ton personnage" className={`relative overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_35%,#2f4a4c,#162a2c_70%)] ring-1 ring-white/10 lg:sticky lg:top-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[480px] ${etape === 1 ? 'h-[48vh]' : 'h-[32vh]'}`}>
        <ScenePersonnage id={reglages.personnage} apparence={reglages.apparence} gabarit={reglages} couleurCasque={reglages.casque} className="absolute inset-0" />
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1.5 text-[11.5px] font-semibold">{mode === 'monde' ? '🌍 Mode vivant' : '📚 Mode classique'}</span>
        <span className="pointer-events-none absolute right-3 top-3 hidden rounded-full bg-black/30 px-3 py-1.5 text-[11px] text-jeu-ivoire/70 sm:block">Glisse pour le faire tourner</span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-14">
          <p className="hud-titre text-2xl leading-tight">{reglages.nom.trim() || 'Ton personnage'}</p>
          <p className="text-[12.5px] text-jeu-ivoire/75">{modele.titre} · taille {STATURES[reglages.stature].nom.toLowerCase()} · {SILHOUETTES[reglages.silhouette].nom.toLowerCase()}</p>
          {(traits.length > 0 || voie || metierChoisi) && <p className="mt-2 flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
            {traits.map(t => <span key={t.slug} className="rounded-full bg-white/15 px-2 py-0.5">{t.icone} {t.nom}</span>)}
            {etape >= 3 && voie && <span className="rounded-full bg-jeu-or/25 px-2 py-0.5">{voie.icone} {profilChoisi?.nom ?? voie.nom}</span>}
            {etape >= 4 && metierChoisi && <span className="rounded-full bg-jeu-lagune/25 px-2 py-0.5">🎯 {metierChoisi.nom}</span>}
          </p>}
        </div>
      </aside>

      <main className="hud-verre space-y-4 rounded-3xl p-5 sm:p-6">
        {etape > 0 && etape < 5 && <button disabled={loading} type="button" onClick={() => { setErreur(null); setEtape(e => e - 1); }} className="text-[13px] font-semibold text-jeu-or">← Retour</button>}
        {erreur && <p role="alert" className="rounded-xl bg-[#F08A4B]/15 p-3 text-[13px] text-jeu-ivoire ring-1 ring-[#F08A4B]/40">{erreur}</p>}

        {etape === 0 && <>
          <MentorBulle>Bienvenue ! Moi, c’est <strong>Akissi</strong>. Ici, tu apprends un métier, tu pratiques et tu construis ton avenir dans le bâtiment.</MentorBulle>
          <Titre sousTitre="Choisis comment commencer. Tu pourras passer d’un mode à l’autre à tout moment.">Une vie à construire.<br /><span className="text-jeu-or">Deux façons de la jouer.</span></Titre>
          <PresentationModes mode={mode} onMode={setMode} />
          {dejaInstalle && <p className="text-[13px] text-jeu-lagune">Ton profil {carriere?.profilActuel?.nom}, ton argent et ta progression sont conservés.</p>}
          <BoutonSuite onClick={() => setEtape(1)}>{dejaInstalle ? 'Retrouver mon personnage' : 'Créer mon personnage'} →</BoutonSuite>
        </>}

        {etape === 1 && <>
          <Titre sousTitre="Choisis l’un de nos personnages réalistes ou compose le tien sur mesure : coiffure, barbe, teint, tenue. Ton apparence ne détermine pas ton métier.">Ton personnage, dans les deux modes</Titre>
          <ReglagesPersonnage valeur={reglages} onChange={setReglages} avatarConfig={configComplete} desactive={loading} />
          <details className="rounded-2xl bg-white/[.05] p-3">
            <summary className="cursor-pointer text-[13px] font-semibold">Ton portrait en mode classique</summary>
            <div className="mt-3 flex flex-wrap items-start gap-4">
              <AvatarBtp config={configComplete} taille={96} className="shadow-lg" />
              <div className="min-w-0 flex-1 space-y-3">
                <MiniChoixCouleur titre="Tenue" options={OPTIONS_AVATAR.couleurTenue} valeur={config.couleurTenue} onChange={v => setConfig(c => ({ ...c, couleurTenue: v }))} />
                <MiniChoixCouleur titre="Fond" options={OPTIONS_AVATAR.fond} valeur={config.fond} onChange={v => setConfig(c => ({ ...c, fond: v }))} />
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONS_AVATAR.typeTenue.map(t => <button key={t} type="button" onClick={() => setConfig(c => ({ ...c, typeTenue: t }))}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${config.typeTenue === t ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/[.08] text-jeu-ivoire/75'}`}>
                    {t === 'gilet' ? '🦺 Gilet' : t === 'bleu' ? '👔 Bleu de travail' : '👕 Chemise'}
                  </button>)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11.5px] text-jeu-ivoire/55">Le portrait prend le teint, les cheveux et le casque de ton personnage ; tenue et fond se changent aussi au dressing.</p>
          </details>
          <BoutonSuite desactive={!nomValide(reglages.nom) || loading} onClick={suivantAvatar}>Continuer →</BoutonSuite>
        </>}

        {etape === 2 && <>
          <Titre sousTitre="Choisis 1 à 3 traits qui te ressemblent : ils donnent une saveur à ton personnage, visible sur ton profil et ton CV.">Ta personnalité</Titre>
          <div className="grid gap-2 sm:grid-cols-2">
            {TRAITS.map(t => {
              const choisi = traitsChoisis.includes(t.slug);
              return <button key={t.slug} type="button" onClick={() => toggleTrait(t.slug)} aria-pressed={choisi}
                className={`flex items-start gap-3 rounded-2xl p-3 text-left transition-colors ${choisi ? 'bg-jeu-or/[.16] ring-2 ring-jeu-or' : 'bg-white/[.05] hover:bg-white/10'}`}>
                <span className="text-2xl" aria-hidden="true">{t.icone}</span>
                <span className="min-w-0"><span className="block font-bold">{t.nom}</span><span className="mt-0.5 block text-[12px] leading-snug text-jeu-ivoire/65">{t.description}</span></span>
              </button>;
            })}
          </div>
          <p className="text-center text-[12px] text-jeu-ivoire/50">{traitsChoisis.length}/3 sélectionné{traitsChoisis.length > 1 ? 's' : ''}</p>
          <BoutonSuite desactive={!traitsChoisis.length || loading} onClick={suivantTraits}>Continuer</BoutonSuite>
        </>}

        {etape === 3 && <>
          <Titre sousTitre="Cinq portes d’entrée, toutes les filières du bâtiment. Choisis ta situation actuelle, puis ton objectif.">D’où commence ton histoire ?</Titre>
          {dejaInstalle ? <p className="rounded-xl bg-white/[.06] p-4 text-[13px]">Tu poursuis comme <strong>{carriere?.profilActuel?.nom}</strong>. Les changements de carrière se font depuis ton parcours, pas en recréant ton personnage.</p>
            : <SelectionProfilDepart profils={profils} porte={porte} profilId={profilId} onPorte={p => { setPorte(p); setProfilId(''); setMetierCibleId(''); }} onProfil={id => { setProfilId(id); setMetierCibleId(''); }} />}
          {erreurProfils && <button type="button" onClick={() => rechargerProfils()} className="text-[13px] text-jeu-or">Catalogue indisponible · Réessayer</button>}
          {estEtudiant && <label className="block text-[13px] font-semibold">Ton objectif de formation
            <select value={formation} onChange={e => setFormation(e.target.value as 'BTS' | 'ingenieur')} className="mt-2 w-full rounded-xl border border-white/15 bg-[#12282a] p-3 font-normal text-jeu-ivoire">
              <option value="BTS">BTS</option><option value="ingenieur">Ingénieur</option>
            </select>
            <span className="mt-1 block text-[11.5px] font-normal text-jeu-ivoire/55">Orientation sauvegardée. Ce choix ne délivre pas de diplôme et ne remplace pas les étapes de ton parcours.</span>
          </label>}
          <BoutonSuite desactive={!profilId || loading} onClick={suivantProfil}>Continuer</BoutonSuite>
        </>}

        {etape === 4 && <>
          <Titre sousTitre="Vers quel métier veux-tu construire ta carrière ?">Ton métier cible</Titre>
          {carriere?.metierCible && <p className="rounded-xl bg-white/[.06] p-3 text-[13px]">Ton objectif actuel est conservé : <strong>{carriere.metierCible.nom}</strong>.</p>}
          {erreurMetiers && <button type="button" onClick={() => rechargerMetiers()} className="text-[13px] text-jeu-or">Métiers indisponibles · Réessayer</button>}
          <div className="grid gap-2 sm:grid-cols-2">
            {metiersFiltres.map(m => <button key={m.id} type="button" disabled={Boolean(carriere?.metierCible)} onClick={() => setMetierCibleId(m.id)}
              className={`rounded-2xl p-3 text-left transition-colors ${metierCibleId === m.id ? 'bg-jeu-or/[.16] ring-2 ring-jeu-or' : 'bg-white/[.05] hover:bg-white/10'}`}>
              <p className="font-bold">{m.nom}</p>
              <p className="text-[12.5px] text-jeu-ivoire/65">{m.description}</p>
            </button>)}
          </div>
          <BoutonSuite desactive={!metierCibleId || loading} onClick={suivantMetier}>{loading ? 'Génération de ton parcours…' : 'Générer mon parcours'}</BoutonSuite>
        </>}

        {etape === 5 && <>
          <Titre>Ton parcours est prêt !</Titre>
          <MentorBulle role="ta mentor" taille={64}>
            <p>Bienvenue dans l&apos;aventure ! Voici comment ça marche, en quatre mots :</p>
            <ul className="mt-2 space-y-1">
              <li>📚 <strong>Apprends</strong> à l&apos;Académie (cours en diapositives + logiciels)</li>
              <li>🎯 <strong>Pratique</strong> avec des missions (quiz, calculs, décisions...)</li>
              <li>🏗️ <strong>Construis</strong> tes propres chantiers (budget, équipe, matériaux)</li>
              <li>📈 <strong>Progresse</strong> : XP, compétences, promotions, CV automatique</li>
            </ul>
            <p className="mt-2">À chaque nouvel onglet que tu ouvres, je serai là pour t&apos;expliquer ce que tu peux y faire — la première fois seulement, promis !</p>
          </MentorBulle>
          <div className="rounded-2xl bg-white/[.05] p-4">
            <p className="hud-legende mb-2">Ton parcours de carrière</p>
            {parcours?.etapes.map((e, i) => <div key={e.nom} className="flex items-center gap-3 py-1">
              <span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-jeu-or' : 'bg-white/20'}`} />
              <span className={i === 0 ? 'font-semibold' : 'text-jeu-ivoire/55'}>{e.nom}</span>
            </div>)}
          </div>
          {voie && <div className="rounded-2xl bg-white/[.05] p-4">
            <h2 className="font-bold">Tes premiers repères · {voie.nom}</h2>
            <ol className="mt-2 list-inside list-decimal space-y-1.5 text-[13px] text-jeu-ivoire/75">{voie.premiersPas.map(p => <li key={p}>{p}</li>)}</ol>
            <p className="mt-3 text-[11.5px] text-jeu-ivoire/55">Ce sont des repères pour explorer les activités existantes. À ton premier choix de poste, une prime d’installation de {francs(primeInstallation(profilChoisi ?? { slug: '' }))} arrive sur ton compte, pour tes premiers loyers et trajets{estEtudiant ? ', et une chambre en cité universitaire t’attend (5 000 F la semaine)' : ''}.</p>
          </div>}
          <BoutonSuite onClick={entrer}>{mode === 'monde' ? 'Entrer dans le monde vivant' : demo ? 'Créer mon compte pour jouer' : 'Ouvrir le mode classique'} →</BoutonSuite>
        </>}
      </main>
    </div>
  </div>;
}
