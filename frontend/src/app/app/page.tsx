'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AnneauProgression, ICONES_TYPE, Skeleton } from '@/components/app/ui';
import { AvatarBtp } from '@/components/app/avatar-btp';
import { Plumbob } from '@/components/app/quartier-iso';
import { PanneauBesoins, humeurDepuisBesoins } from '@/components/app/besoins';

interface Mission {
  id: string;
  titre: string;
  type: string;
  niveauRequis: number;
  userStatut: string;
  verrouillee: boolean;
  meilleurScore: number | null;
}
interface ProchaineEtape {
  aUnProfil: boolean;
  regle: { profilCible?: { nom: string } } | null;
  manquants: string[];
  eligible?: boolean;
  formation: { missionsDisponibles: number };
  offres: { eligibles: number; total: number };
  entreprise: { dejaEntrepreneur: boolean; nomEntreprise: string | null; eligible: boolean; niveauRequis: number };
}
interface CarriereMe {
  niveau: number;
  xp: number;
  reputation: number;
  argentVirtuel: number;
  energie: number;
  moral: number;
  faim: number;
  social: number;
  profilActuel?: { nom: string } | null;
  metierCible?: { nom: string } | null;
  avatar?: { nomPersonnage: string; config?: unknown } | null;
}
interface UserChantier {
  id: string;
  statut: string;
  avancementPct: number;
  chantier: { nom: string };
}
interface UserMessage {
  id: string;
  contenu: string;
  lu: boolean;
  pnj: { nom: string };
}

const ACCES_RAPIDES = [
  { href: '/app/academie', label: 'Académie', icon: '📚', desc: 'Cours et quiz' },
  { href: '/app/cv', label: 'CV virtuel', icon: '📄', desc: 'Toujours à jour' },
  { href: '/app/offres', label: 'Offres', icon: '💼', desc: 'Candidate' },
  { href: '/app/recompenses', label: 'Badges', icon: '🏅', desc: 'Ta vitrine' },
];

// Courbe de niveau identique au backend (progression.service.ts) : niveau N = round(100*(N-1)^2.2)
// XP cumulés. Sert à afficher la barre « progression vers le niveau suivant » sur le hub.
function xpRequisPourNiveau(n: number): number {
  return Math.round(100 * Math.pow(Math.max(0, n - 1), 2.2));
}
function progressionVersNiveauSuivant(xp: number, niveau: number) {
  const bas = xpRequisPourNiveau(niveau);
  const haut = xpRequisPourNiveau(niveau + 1);
  const pct = haut > bas ? Math.min(100, Math.max(0, Math.round(((xp - bas) / (haut - bas)) * 100))) : 100;
  return { pct, restant: Math.max(0, haut - xp) };
}

/** Silhouette de chantier (immeubles + grue) posée en bas de la bannière — profondeur « décor de jeu ». */
function SkylineChantier({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 70" preserveAspectRatio="none" className={className} aria-hidden="true">
      <g fill="#2B2B2E">
        <rect x="14" y="34" width="34" height="36" />
        <rect x="58" y="20" width="26" height="50" />
        <rect x="150" y="42" width="40" height="28" />
        <rect x="250" y="28" width="30" height="42" />
        <rect x="300" y="46" width="46" height="24" />
        <rect x="356" y="30" width="30" height="40" />
      </g>
      {/* Grue */}
      <g stroke="#2B2B2E" strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1="112" y1="70" x2="112" y2="8" />
        <line x1="92" y1="16" x2="168" y2="16" />
        <line x1="112" y1="8" x2="112" y2="16" />
        <line x1="150" y1="16" x2="150" y2="30" />
      </g>
      <rect x="108" y="14" width="8" height="8" fill="#2B2B2E" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: carriere, isLoading: carriereLoading } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions', 'dashboard'],
    queryFn: () => api.get<Mission[]>('/missions'),
  });
  const { data: prochaineEtape } = useQuery({
    queryKey: ['carriere', 'prochaine-etape'],
    queryFn: () => api.get<ProchaineEtape>('/carriere/prochaine-etape'),
  });
  const { data: chantiers } = useQuery({
    queryKey: ['chantiers', 'mine'],
    queryFn: () => api.get<UserChantier[]>('/chantiers/mine'),
  });
  const { data: messages } = useQuery({
    queryKey: ['messages', 'mine'],
    queryFn: () => api.get<UserMessage[]>('/users/me/messages'),
  });
  const { data: streak } = useQuery({
    queryKey: ['carriere', 'streak'],
    queryFn: () => api.get<{ jours: number; aJoueAujourdhui: boolean }>('/carriere/streak'),
  });

  const jouables = (missions ?? []).filter((m) => !m.verrouillee && m.userStatut !== 'REUSSIE');
  const reussies = (missions ?? []).filter((m) => m.userStatut === 'REUSSIE').length;
  const total = (missions ?? []).length;
  // Défi du jour : choix déterministe par la date — le même pour toute la journée.
  const graineJour = Number(new Date().toISOString().slice(0, 10).replaceAll('-', ''));
  const missionRecommandee = jouables.length ? jouables[graineJour % jouables.length] : undefined;
  const missionsDuJour = jouables.filter((m) => m.id !== missionRecommandee?.id).slice(0, 4);
  const chantierEnCours = (chantiers ?? []).find((c) => c.statut === 'en_cours');
  const messagesNonLus = (messages ?? []).filter((m) => !m.lu).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Carte carrière héro ── */}
      {carriereLoading ? (
        <Skeleton className="h-44 w-full" />
      ) : (
        <section className="fond-anime relative overflow-hidden rounded-3xl p-6 text-ivoire shadow-2xl md:p-8">
          {/* ── Couches décoratives : grille de plan, halos, balayage de lumière, skyline ── */}
          <div className="grille-plan pointer-events-none absolute inset-0 opacity-50" />
          <div className="halo-hero" />
          <div className="reflet-heros" />
          <SkylineChantier className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full opacity-[0.18] md:h-20" />

          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Link href="/app/profil" className="relative flex shrink-0 flex-col items-center transition-transform hover:scale-105">
                {/* Aura lumineuse pulsée derrière l'avatar */}
                <span className="aura-avatar absolute left-1/2 top-1/2 -z-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sable/50 blur-2xl md:h-28 md:w-28" />
                <Plumbob
                  taille={18}
                  humeur={carriere ? humeurDepuisBesoins({ energie: carriere.energie, moral: carriere.moral, faim: carriere.faim, social: carriere.social }) : 'bien'}
                />
                <span className="anim-float relative">
                  <AvatarBtp config={carriere?.avatar?.config} taille={92} className="shadow-2xl ring-4 ring-ivoire/25" />
                </span>
              </Link>
              <div>
                <p className="text-sm text-ivoire/70">Bonjour 👋</p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">
                  {carriere?.avatar?.nomPersonnage ?? 'Aventurier BTP'}
                </h1>
                <p className="mt-1 text-sm text-ivoire/80">
                  {carriere?.profilActuel?.nom ?? 'Profil à choisir'} → objectif :{' '}
                  <span className="font-semibold text-sable">{carriere?.metierCible?.nom ?? 'à définir'}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-ivoire/15 px-3 py-1.5 font-semibold ring-1 ring-ivoire/10">⚡ {carriere?.xp ?? 0} XP</span>
                  <span className="rounded-full bg-ivoire/15 px-3 py-1.5 font-semibold ring-1 ring-ivoire/10">🏅 {carriere?.reputation ?? 500}/1000</span>
                  <span className="rounded-full bg-ivoire/15 px-3 py-1.5 font-mono font-semibold ring-1 ring-ivoire/10">
                    💰 {(carriere?.argentVirtuel ?? 0).toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <AnneauProgression valeur={reussies} max={Math.max(1, total)} taille={110} couleur="#D9B382">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold">{reussies}</p>
                  <p className="text-[10px] text-ivoire/70">/{total} missions</p>
                </div>
              </AnneauProgression>
              {/* Badge de niveau — écusson lumineux */}
              <div className="relative hidden text-center sm:block">
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-ivoire/10 ring-2 ring-sable/60 backdrop-blur">
                  <p className="font-display text-4xl font-bold text-sable drop-shadow">{carriere?.niveau ?? 1}</p>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-ivoire/70">Niveau</p>
              </div>
            </div>
          </div>

          {/* ── Barre d'XP vers le niveau suivant — pleine largeur, façon jauge de jeu ── */}
          {(() => {
            const niveau = carriere?.niveau ?? 1;
            const { pct, restant } = progressionVersNiveauSuivant(carriere?.xp ?? 0, niveau);
            return (
              <div className="relative mt-6">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-ivoire/75">
                  <span>Niveau {niveau}</span>
                  <span className="text-sable">{restant > 0 ? `${restant.toLocaleString('fr-FR')} XP → Niveau ${niveau + 1}` : 'Niveau max atteint'}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-graphite/40 ring-1 ring-ivoire/10">
                  <div
                    className="barre-progression h-full rounded-full bg-gradient-to-r from-sable via-cuivre to-terracotta shadow-[0_0_10px_rgba(217,179,130,0.6)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ── Besoins façon jeu de simulation ── */}
      {carriere && (
        <PanneauBesoins besoins={{ energie: carriere.energie, moral: carriere.moral, faim: carriere.faim, social: carriere.social }} />
      )}

      {/* ── À faire maintenant ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="carte-vivante rounded-2xl border-2 border-terracotta bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-terracotta">🔥 Défi du jour</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                streak?.aJoueAujourdhui ? 'bg-olive/10 text-olive' : 'bg-terracotta/10 text-terracotta'
              }`}
              title="Jours consécutifs avec au moins une mission jouée"
            >
              🔥 Série : {streak?.jours ?? 0} jour{(streak?.jours ?? 0) > 1 ? 's' : ''}
              {streak?.aJoueAujourdhui ? ' ✔' : ''}
            </span>
          </div>
          {missionsLoading ? (
            <Skeleton className="mt-3 h-20 w-full" />
          ) : missionRecommandee ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl">{ICONES_TYPE[missionRecommandee.type] ?? '🎯'}</span>
                <div>
                  <p className="font-display font-bold text-graphite">{missionRecommandee.titre}</p>
                  <p className="text-xs text-graphite/50">
                    {missionRecommandee.type.replaceAll('_', ' ')} · Niveau {missionRecommandee.niveauRequis}
                  </p>
                </div>
              </div>
              <Link
                href={`/app/missions/${missionRecommandee.id}`}
                className="anim-pulse-cta mt-4 block rounded-full bg-terracotta py-2.5 text-center text-sm font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile"
              >
                {streak?.aJoueAujourdhui ? 'Continuer sur ma lancée' : 'Relever le défi du jour'}
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-graphite/60">
              Toutes les missions de ton niveau sont réussies — améliore tes scores ou monte de niveau ! 🎉
            </p>
          )}
        </div>

        <div className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-olive">🏗️ Chantier en cours</p>
          {chantierEnCours ? (
            <>
              <p className="mt-3 font-display font-bold text-graphite">{chantierEnCours.chantier.nom}</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-pierre">
                <div className="barre-progression h-full bg-olive" style={{ width: `${chantierEnCours.avancementPct}%` }} />
              </div>
              <p className="mt-1 text-right font-mono text-xs text-graphite/50">{chantierEnCours.avancementPct}%</p>
              <Link
                href={`/app/chantiers/${chantierEnCours.id}`}
                className="mt-2 block rounded-full border border-olive py-2.5 text-center text-sm font-semibold text-olive transition-colors hover:bg-olive hover:text-ivoire"
              >
                Continuer le chantier
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-graphite/60">Aucun chantier en cours — lance ton premier projet.</p>
              <Link
                href="/app/chantiers"
                className="mt-4 block rounded-full border border-olive py-2.5 text-center text-sm font-semibold text-olive transition-colors hover:bg-olive hover:text-ivoire"
              >
                Voir les chantiers
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Accès rapides ── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ACCES_RAPIDES.map((a) => (
          <Link key={a.href} href={a.href} className="carte-vivante rounded-2xl border border-pierre bg-white p-4 text-center">
            <p className="text-2xl">{a.icon}</p>
            <p className="mt-1 font-display text-sm font-bold text-graphite">{a.label}</p>
            <p className="text-[11px] text-graphite/50">{a.desc}</p>
          </Link>
        ))}
      </section>

      {/* ── Progression + missions + messages ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="carte-vivante rounded-2xl border border-pierre bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-graphite">🎯 Missions du jour</h2>
            <Link href="/app/missions" className="text-sm font-semibold text-terracotta hover:underline">
              Tout voir →
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {missionsLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            {missionsDuJour.map((m) => (
              <Link
                key={m.id}
                href={`/app/missions/${m.id}`}
                className="group rounded-xl border border-pierre p-3 transition-all hover:-translate-y-0.5 hover:border-terracotta hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl transition-transform group-hover:scale-125">{ICONES_TYPE[m.type] ?? '🎯'}</span>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-olive">{m.type.replaceAll('_', ' ')}</p>
                </div>
                <p className="mt-1 text-sm font-medium text-graphite">{m.titre}</p>
                <p className="mt-0.5 text-xs text-graphite/50">Niveau {m.niveauRequis}</p>
              </Link>
            ))}
            {!missionsLoading && !missionsDuJour.length && (
              <p className="text-sm text-graphite/60">Pas de nouvelle mission disponible pour l&apos;instant.</p>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
            <h2 className="font-display font-bold text-graphite">🧭 Ton carrefour de carrière</h2>
            <p className="mt-0.5 text-xs text-graphite/50">Rien n&apos;est figé — quatre pistes restent ouvertes à chaque étape.</p>
            {prochaineEtape?.aUnProfil ? (
              <div className="mt-3 space-y-2.5">
                {/* Piste 1 : continuer sa formation */}
                <Link href="/app/missions" className="flex items-center justify-between gap-2 rounded-xl border border-pierre/70 px-3 py-2 transition-colors hover:border-terracotta">
                  <span className="text-sm font-medium text-graphite">🎓 Continuer ta formation</span>
                  <span className="whitespace-nowrap text-xs font-semibold text-olive">
                    {prochaineEtape.formation.missionsDisponibles} mission{prochaineEtape.formation.missionsDisponibles !== 1 ? 's' : ''}
                  </span>
                </Link>

                {/* Piste 2 : postuler à une offre */}
                <Link href="/app/offres" className="flex items-center justify-between gap-2 rounded-xl border border-pierre/70 px-3 py-2 transition-colors hover:border-terracotta">
                  <span className="text-sm font-medium text-graphite">💼 Postuler à une offre</span>
                  <span className="whitespace-nowrap text-xs font-semibold text-olive">
                    {prochaineEtape.offres.eligibles}/{prochaineEtape.offres.total} à ta portée
                  </span>
                </Link>

                {/* Piste 3 : se spécialiser (promotion) */}
                {prochaineEtape.regle ? (
                  <div className="rounded-xl border border-pierre/70 px-3 py-2">
                    <p className="text-sm font-medium text-graphite">
                      📈 Te spécialiser → <span className="font-semibold text-terracotta">{prochaineEtape.regle.profilCible?.nom}</span>
                    </p>
                    {prochaineEtape.manquants.length ? (
                      <ul className="mt-1.5 space-y-1">
                        {prochaineEtape.manquants.slice(0, 2).map((m) => (
                          <li key={m} className="flex items-start gap-1.5 text-xs text-graphite/60">
                            <span className="mt-0.5 text-terracotta">○</span> {m}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Link href="/app/promotions" className="mt-1.5 block rounded-full bg-olive py-1.5 text-center text-xs font-bold text-ivoire">
                        Conditions réunies — demande ta promotion !
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-pierre/70 px-3 py-2 text-sm text-graphite/50">📈 Aucune spécialisation en attente</div>
                )}

                {/* Piste 4 : créer son entreprise */}
                <CarteEntrepreneur
                  dejaEntrepreneur={prochaineEtape.entreprise.dejaEntrepreneur}
                  nomEntreprise={prochaineEtape.entreprise.nomEntreprise}
                  eligible={prochaineEtape.entreprise.eligible}
                  niveauRequis={prochaineEtape.entreprise.niveauRequis}
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-graphite/60">
                <Link href="/onboarding" className="font-semibold text-terracotta hover:underline">
                  Termine ton onboarding
                </Link>{' '}
                pour débloquer ton parcours.
              </p>
            )}
          </section>

          <section className="carte-vivante rounded-2xl border border-pierre bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-graphite">💬 Messages</h2>
              <Link href="/app/messages" className="text-xs font-semibold text-terracotta hover:underline">
                Tout voir →
              </Link>
            </div>
            <div className="mt-2 space-y-2">
              {messagesNonLus.map((m) => (
                <div key={m.id} className="rounded-lg bg-pierre/50 p-2 text-xs">
                  <p className="font-semibold text-graphite">{m.pnj.nom}</p>
                  <p className="line-clamp-2 text-graphite/70">{m.contenu}</p>
                </div>
              ))}
              {!messagesNonLus.length && <p className="text-xs text-graphite/50">Pas de nouveau message.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Piste 4 du carrefour de carrière : créer son entreprise — réservée à ceux qui ont fait leurs preuves. */
function CarteEntrepreneur({
  dejaEntrepreneur,
  nomEntreprise,
  eligible,
  niveauRequis,
}: {
  dejaEntrepreneur: boolean;
  nomEntreprise: string | null;
  eligible: boolean;
  niveauRequis: number;
}) {
  if (dejaEntrepreneur) {
    return (
      <Link href="/app/entreprise" className="block rounded-xl border border-pierre/70 px-3 py-2 transition-colors hover:border-terracotta">
        <p className="text-sm font-medium text-graphite">🏢 {nomEntreprise || 'Ton entreprise'}</p>
        <p className="mt-0.5 text-xs text-graphite/50">Voir les marchés disponibles →</p>
      </Link>
    );
  }

  if (!eligible) {
    return (
      <div className="rounded-xl border border-pierre/70 px-3 py-2 opacity-60">
        <p className="text-sm font-medium text-graphite">🔒 Créer ton entreprise</p>
        <p className="mt-0.5 text-xs text-graphite/50">Demande d&apos;avoir fait tes preuves — niveau {niveauRequis} minimum.</p>
      </div>
    );
  }

  return (
    <Link href="/app/entreprise" className="block rounded-xl border border-pierre/70 px-3 py-2 transition-colors hover:border-terracotta">
      <p className="text-sm font-medium text-graphite">🚀 Créer ton entreprise</p>
      <p className="mt-0.5 text-xs text-graphite/50">Change de filière sans perdre ton niveau, ton XP ni ta réputation.</p>
    </Link>
  );
}
