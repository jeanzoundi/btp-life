'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Confettis, Skeleton } from '@/components/app/ui';
import { ChantierIso } from '@/components/app/chantier-iso';
import { AssistantChantier } from '@/components/app/assistant-chantier';
import { jouerSon } from '@/lib/sons';

interface Mission {
  id: string;
  titre: string;
}
interface Besoins {
  joursEstimes?: number;
  equipeMin?: number;
  materiaux?: Record<string, number>;
}
interface Phase {
  id: string;
  ordre: number;
  nom: string;
  besoins: Besoins | null;
  missions: Mission[];
}
interface Ressource {
  id: string;
  ref: { nom?: string; unite?: string };
  coutUnitaire: number;
}
interface Ouvrier {
  id: string;
  nom: string;
  poste: string;
  competence: number;
  motivation: number;
  fatigue: number;
  rendement: number;
  salaireJournalier: number;
  statut: string;
}
interface Evenement {
  jour: number;
  type: string;
  texte: string;
}
interface UserChantierDetail {
  id: string;
  statut: string;
  phaseCourante: number;
  budgetRestant: number;
  joursRestants: number;
  qualite: number;
  securite: number;
  moralEquipe: number;
  avancementPct: number;
  noteFinale: string | null;
  stock: Record<string, number> | null;
  avancementPhases: Record<string, number> | null;
  evenementsLog: Evenement[] | null;
  chantier: {
    nom: string;
    typeProjet: string;
    description: string | null;
    budget: number;
    devise: string;
    phases: Phase[];
    ressources: Ressource[];
  };
  ouvriers: Ouvrier[];
  postesDisponibles?: Record<string, { salaire: number; competenceBase: number }>;
  tailleEquipeMax?: number;
}

const ICONE_EVENEMENT: Record<string, string> = {
  info: 'ℹ️', commande: '📦', rh: '👷', travail: '🔨', phase: '🎉', meteo: '🌧️',
  panne: '⚙️', visite: '🤝', securite: '🦺', rupture: '🚨', delai: '⏰', livraison: '🏁',
};

export default function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  const [posteChoisi, setPosteChoisi] = useState('Maçon');
  const [livraison, setLivraison] = useState(false);

  const { data: uc, isLoading } = useQuery({
    queryKey: ['chantier', id],
    queryFn: () => api.get<UserChantierDetail>(`/chantiers/mine/${id}`),
  });

  function rafraichir() {
    queryClient.invalidateQueries({ queryKey: ['chantier', id] });
    queryClient.invalidateQueries({ queryKey: ['chantiers', 'mine'] });
  }

  async function action(fn: () => Promise<unknown>, sonOk: Parameters<typeof jouerSon>[0] = 'clic') {
    setMessage(null);
    setEnCours(true);
    try {
      await fn();
      jouerSon(sonOk);
      rafraichir();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Erreur');
      jouerSon('echec');
    } finally {
      setEnCours(false);
    }
  }

  async function lancerJournee() {
    setMessage(null);
    setEnCours(true);
    try {
      const res = await api.post<UserChantierDetail>(`/chantiers/mine/${id}/journee`);
      if (res.statut === 'termine') {
        setLivraison(true);
        jouerSon('niveau');
        queryClient.invalidateQueries({ queryKey: ['carriere'] });
      } else {
        jouerSon('succes');
      }
      rafraichir();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Erreur');
      jouerSon('echec');
    } finally {
      setEnCours(false);
    }
  }

  if (isLoading || !uc) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const stock = uc.stock ?? {};
  const avancements = uc.avancementPhases ?? {};
  const enChantier = uc.statut === 'en_cours';
  const phaseActuelle = uc.chantier.phases[uc.phaseCourante];
  const besoinsActuels = phaseActuelle?.besoins ?? {};
  const actifs = uc.ouvriers.filter((o) => o.statut === 'actif');
  const salairesJour =
    actifs.reduce((s, o) => s + o.salaireJournalier, 0) +
    Math.round(uc.ouvriers.filter((o) => o.statut === 'repos').reduce((s, o) => s + o.salaireJournalier, 0) / 2);
  const journal = [...(uc.evenementsLog ?? [])].reverse();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {(livraison || uc.statut === 'termine') && uc.noteFinale && livraison && <Confettis nombre={70} />}

      {/* ── Assistante mentor ── */}
      <AssistantChantier uc={uc} />

      {/* ── En-tête pilotage ── */}
      <section className="rounded-3xl border border-pierre bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-olive">{uc.chantier.typeProjet} · BTP Simulator</p>
            <h1 className="font-display text-2xl font-bold text-graphite">{uc.chantier.nom}</h1>
            <p className="mt-1 max-w-xl text-sm text-graphite/60">{uc.chantier.description}</p>
          </div>
          {uc.noteFinale ? (
            <div className="rounded-2xl bg-cuivre/10 px-6 py-3 text-center">
              <p className="font-display text-4xl font-bold text-cuivre">{uc.noteFinale}</p>
              <p className="text-xs font-semibold text-cuivre">Chantier livré</p>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={lancerJournee}
                disabled={enCours}
                className="anim-pulse-cta rounded-full bg-terracotta px-7 py-3.5 font-bold text-ivoire transition-transform hover:scale-105 hover:bg-argile disabled:opacity-60"
              >
                {enCours ? 'Journée en cours…' : '▶ Lancer la journée de travail'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Abandonner ce chantier ? Il sera noté D et ta réputation baissera (−5) — mais tu pourras en démarrer un autre.')) {
                    void action(() => api.post(`/chantiers/mine/${id}/abandonner`), 'echec');
                  }
                }}
                disabled={enCours}
                className="text-xs font-semibold text-graphite/40 underline-offset-2 hover:text-terracotta hover:underline disabled:opacity-50"
              >
                🏳 Abandonner le chantier
              </button>
            </div>
          )}
        </div>

        {message && <p className="mt-3 rounded-xl bg-terracotta/10 px-4 py-2 text-sm font-semibold text-terracotta">{message}</p>}

        {/* Vue du chantier qui s'élève avec l'avancement */}
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <ChantierIso avancement={uc.avancementPct} taille={300} />
          <div className="min-w-52 flex-1">
            <div className="flex justify-between text-xs text-graphite/50">
              <span>Avancement global</span>
              <span className="font-mono font-bold text-graphite">{uc.avancementPct}%</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-pierre">
              <div className="barre-progression h-full bg-olive" style={{ width: `${uc.avancementPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-graphite/50">
              {uc.avancementPct >= 100 ? '🏁 Ouvrage livré !' : uc.avancementPct >= 70 ? 'La toiture se profile — dernière ligne droite.' : uc.avancementPct >= 35 ? 'Les murs montent, le chantier prend forme.' : uc.avancementPct >= 10 ? 'Fondations en cours — la base de tout.' : "Terrain implanté, prêt à attaquer les travaux."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
          {(
            [
              ['💰 Budget', `${uc.budgetRestant.toLocaleString('fr-FR')} F`],
              ['📅 Jours', uc.joursRestants >= 0 ? `${uc.joursRestants} restants` : `${-uc.joursRestants} j de retard ⚠`],
              ['⭐ Qualité', uc.qualite],
              ['🦺 Sécurité', uc.securite],
              ['❤️ Moral', uc.moralEquipe],
              ['💸 Salaires/jour', `${salairesJour.toLocaleString('fr-FR')} F`],
            ] as const
          ).map(([label, valeur]) => (
            <div key={label} className="rounded-xl bg-pierre/50 p-3 text-center">
              <p className="font-mono text-sm font-bold text-graphite">{valeur}</p>
              <p className="text-xs text-graphite/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Phases & avancement des travaux ── */}
        <section className="rounded-3xl border border-pierre bg-white p-5">
          <h2 className="font-display font-bold text-graphite">🏗️ Avancement des travaux</h2>
          <div className="mt-3 space-y-3">
            {uc.chantier.phases.map((phase, i) => {
              const passee = i < uc.phaseCourante;
              const active = i === uc.phaseCourante && enChantier;
              const pct = passee ? 100 : Math.round(avancements[String(i)] ?? 0);
              const b = phase.besoins ?? {};
              return (
                <div key={phase.id} className={`rounded-xl border p-4 ${active ? 'border-terracotta bg-terracotta/5' : passee ? 'border-olive/40 bg-olive/5' : 'border-pierre'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-graphite">
                      {passee ? '✔' : active ? '▶' : '○'} {phase.nom}
                    </p>
                    <span className="font-mono text-xs font-bold text-graphite/60">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-pierre">
                    <div className={`barre-progression h-full ${passee ? 'bg-olive' : 'bg-terracotta'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-graphite/50">
                    ≈ {b.joursEstimes ?? '?'} jours · équipe conseillée : {b.equipeMin ?? '?'}
                    {Object.keys(b.materiaux ?? {}).length > 0 && (
                      <> · matériaux : {Object.entries(b.materiaux ?? {}).map(([n, q]) => `${n} ×${q}`).join(', ')}</>
                    )}
                  </p>
                  {(active || passee) && phase.missions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {phase.missions.map((m) => (
                        <Link key={m.id} href={`/app/missions/${m.id}`} className="rounded-full bg-pierre px-3 py-1 text-xs font-semibold text-graphite hover:bg-sable">
                          🎯 Mission bonus : {m.titre}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Journal de chantier ── */}
        <section className="rounded-3xl border border-pierre bg-white p-5">
          <h2 className="font-display font-bold text-graphite">📓 Journal de chantier</h2>
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
            {journal.map((e, i) => (
              <div key={i} className={`rounded-xl px-3 py-2 text-sm ${e.type === 'rupture' || e.type === 'delai' ? 'bg-terracotta/10 text-graphite' : e.type === 'phase' || e.type === 'livraison' ? 'bg-olive/10 text-graphite' : 'bg-pierre/40 text-graphite/80'}`}>
                <span className="mr-1">{ICONE_EVENEMENT[e.type] ?? '•'}</span>
                <span className="font-mono text-xs text-graphite/40">J{e.jour}</span> {e.texte}
              </div>
            ))}
            {!journal.length && <p className="text-sm text-graphite/50">Le journal se remplit à chaque journée de travail.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Équipe / personnel ── */}
        <section className="rounded-3xl border border-pierre bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-graphite">👷 Personnel ({uc.ouvriers.length}/{uc.tailleEquipeMax ?? 8})</h2>
            {enChantier && (
              <div className="flex items-center gap-2">
                <select
                  value={posteChoisi}
                  onChange={(e) => setPosteChoisi(e.target.value)}
                  className="rounded-full border border-pierre px-3 py-1.5 text-xs font-semibold text-graphite focus:border-terracotta focus:outline-none"
                >
                  {Object.entries(uc.postesDisponibles ?? {}).map(([poste, infos]) => (
                    <option key={poste} value={poste}>
                      {poste} — {infos.salaire.toLocaleString('fr-FR')} F/j
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => action(() => api.post(`/chantiers/mine/${id}/embaucher`, { poste: posteChoisi }))}
                  disabled={enCours}
                  className="rounded-full bg-terracotta px-4 py-1.5 text-xs font-bold text-ivoire hover:bg-argile disabled:opacity-50"
                >
                  + Embaucher
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {uc.ouvriers.map((o) => (
              <div key={o.id} className={`rounded-xl border p-3 ${o.statut === 'repos' ? 'border-pierre bg-pierre/30' : 'border-pierre bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-graphite">{o.nom}</p>
                    <p className="text-xs text-graphite/50">{o.poste} · {o.salaireJournalier.toLocaleString('fr-FR')} F/j</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${o.statut === 'actif' ? 'bg-olive/10 text-olive' : 'bg-cuivre/10 text-cuivre'}`}>
                    {o.statut === 'actif' ? 'AU TRAVAIL' : 'REPOS'}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <Jauge label="Compétence" valeur={o.competence} couleur="bg-graphite" />
                  <Jauge label="Motivation" valeur={o.motivation} couleur="bg-olive" />
                  <Jauge label="Fatigue" valeur={o.fatigue} couleur={o.fatigue > 70 ? 'bg-terracotta' : 'bg-cuivre'} />
                </div>
                {enChantier && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => action(() => api.post(`/chantiers/mine/${id}/ouvriers/${o.id}/repos`))}
                      disabled={enCours}
                      className="flex-1 rounded-full border border-pierre py-1 text-xs font-semibold text-graphite hover:border-terracotta disabled:opacity-50"
                    >
                      {o.statut === 'actif' ? '😴 Mettre au repos' : '💪 Remettre au travail'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Licencier ${o.nom} ? L'équipe en prendra un coup (moral −5).`)) {
                          void action(() => api.post(`/chantiers/mine/${id}/ouvriers/${o.id}/licencier`));
                        }
                      }}
                      disabled={enCours}
                      className="rounded-full border border-terracotta/40 px-3 py-1 text-xs font-semibold text-terracotta hover:bg-terracotta/5 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!uc.ouvriers.length && <p className="text-sm text-graphite/60">Aucun ouvrier — embauche ton équipe !</p>}
          </div>
          <p className="mt-3 text-[11px] text-graphite/40">
            Le repos est payé à moitié et fait retomber la fatigue. Un ouvrier épuisé travaille mal et provoque des presque-accidents.
          </p>
        </section>

        {/* ── Stock & commandes ── */}
        <section className="rounded-3xl border border-pierre bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-bold text-graphite">📦 Stock & commandes</h2>
            <div className="flex gap-3 text-xs font-semibold">
              <Link href="/app/fournisseur" className="text-terracotta hover:underline">
                🚚 Voir tous les prix
              </Link>
              <Link href="/app/depot" className="text-graphite/60 hover:underline">
                Mon dépôt →
              </Link>
            </div>
          </div>

          {Object.keys(besoinsActuels.materiaux ?? {}).length > 0 && (
            <p className="mt-2 rounded-xl bg-pierre/40 px-3 py-2 text-xs text-graphite/70">
              Besoins de la phase en cours ({phaseActuelle?.nom}) :{' '}
              {Object.entries(besoinsActuels.materiaux ?? {}).map(([n, q]) => `${n} ×${q}`).join(' · ')}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {uc.chantier.ressources.map((r) => {
              const nom = r.ref.nom ?? '—';
              const enStock = stock[nom] ?? 0;
              const besoin = (besoinsActuels.materiaux ?? {})[nom] ?? 0;
              const manque = enChantier && besoin > 0 && enStock < besoin;
              return (
                <div key={r.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${manque ? 'border-terracotta/50 bg-terracotta/5' : 'border-pierre'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-graphite">{nom}</p>
                    <p className="text-xs text-graphite/50">
                      {r.coutUnitaire.toLocaleString('fr-FR')} F / {r.ref.unite} · en stock :{' '}
                      <span className={`font-mono font-bold ${manque ? 'text-terracotta' : 'text-graphite'}`}>{enStock}</span>
                      {besoin > 0 && <span className="text-graphite/40"> (phase : {besoin})</span>}
                    </p>
                  </div>
                  {enChantier && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={quantites[r.id] ?? ''}
                        onChange={(e) => setQuantites((q) => ({ ...q, [r.id]: Number(e.target.value) }))}
                        placeholder="Qté"
                        className="w-20 rounded-lg border border-pierre px-2 py-1.5 text-sm focus:border-terracotta focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          action(() => api.post(`/chantiers/mine/${id}/commander`, { ressourceId: r.id, quantite: quantites[r.id] ?? 0 }), 'succes')
                        }
                        disabled={enCours || !(quantites[r.id] > 0)}
                        className="rounded-full bg-graphite px-4 py-1.5 text-xs font-bold text-ivoire hover:bg-brun disabled:opacity-40"
                      >
                        Commander
                        {quantites[r.id] > 0 && ` (${(quantites[r.id] * r.coutUnitaire).toLocaleString('fr-FR')} F)`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-graphite/40">
            Sans matériaux en stock, la journée tourne au ralenti (−75 % d&apos;avancement) et le moral chute. Anticipe la phase suivante !
          </p>
        </section>
      </div>

      {/* ── Livraison ── */}
      {uc.statut === 'termine' && uc.noteFinale && (
        <section className={`rounded-3xl border-2 p-8 text-center ${['A', 'B'].includes(uc.noteFinale) ? 'border-olive bg-olive/5' : 'border-cuivre bg-cuivre/5'}`}>
          <p className="font-display text-6xl font-bold text-graphite">{uc.noteFinale}</p>
          <p className="mt-2 font-display text-xl font-bold text-graphite">
            {uc.noteFinale === 'A' ? 'Chantier exemplaire ! 🏆' : uc.noteFinale === 'B' ? 'Beau travail de gestion ! 🎉' : uc.noteFinale === 'C' ? 'Chantier livré — il y a des leçons à tirer.' : 'Livré dans la douleur — analyse le journal pour comprendre.'}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-graphite/60">
            La note pèse qualité (30 %), sécurité (25 %), délai (20 %), budget (15 %) et moral (10 %). Elle alimente ton CV et tes conditions de promotion.
          </p>
          <Link href="/app/chantiers" className="mt-5 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile">
            Voir les autres chantiers
          </Link>
        </section>
      )}
    </div>
  );
}

function Jauge({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  return (
    <div>
      <div className="flex justify-between text-graphite/60">
        <span>{label}</span>
        <span className="font-mono">{valeur}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-pierre">
        <div className={`h-full ${couleur}`} style={{ width: `${Math.min(100, valeur)}%` }} />
      </div>
    </div>
  );
}
