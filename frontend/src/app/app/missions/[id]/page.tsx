'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AnneauProgression, Confettis, ICONES_TYPE, Skeleton } from '@/components/app/ui';
import { Compteur } from '@/components/public/compteur';
import { jouerSon } from '@/lib/sons';
import { AvatarBtp } from '@/components/app/avatar-btp';

interface Option {
  id: string;
  label: string;
}
interface Contenu {
  id: string;
  ordre: number;
  typeQuestion: 'QCM' | 'NUMERIQUE' | 'ZONE_IMAGE' | 'ORDONNANCEMENT' | 'CHOIX_CONSEQUENCE' | 'TEXTE';
  enonce: string;
  options: Option[] | null;
}
interface MissionDetail {
  id: string;
  titre: string;
  description: string | null;
  type: string;
  dureeLimiteSec: number | null;
  scoreMax: number;
  conditionReussite: number;
  contenus: Contenu[];
}
interface Resultat {
  score: number;
  scoreMax: number;
  reussie: boolean;
  bonusChrono: number;
  securiteEchec: boolean;
  xpGagne: number;
  facteurBesoins: number;
  reputationDelta: number;
  argentDelta: number;
  niveauAvant: number;
  niveauApres: number;
  badgeObtenu: { badge?: { nom: string } } | null;
  correction: Array<{
    contenuId: string;
    correctionPedagogique: string | null;
    resultat?: { correct: boolean; pointsObtenus: number };
  }>;
}

const AIDE_TYPE: Record<Contenu['typeQuestion'], string> = {
  QCM: 'Sélectionne la ou les bonnes réponses',
  NUMERIQUE: 'Saisis ta réponse numérique',
  ZONE_IMAGE: 'Sélectionne toutes les zones concernées',
  ORDONNANCEMENT: 'Remets les étapes dans le bon ordre avec ↑ ↓',
  CHOIX_CONSEQUENCE: 'Choisis ta décision — elle aura des conséquences',
  TEXTE: 'Rédige ta réponse librement',
};

export default function MissionPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<'briefing' | 'jeu' | 'resultat'>('briefing');
  const [etapeIdx, setEtapeIdx] = useState(0);
  const [reponses, setReponses] = useState<Record<string, unknown>>({});
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [tempsRestant, setTempsRestant] = useState<number | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [popId, setPopId] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const debutRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soumisRef = useRef(false);
  const reponsesRef = useRef<Record<string, unknown>>({});
  reponsesRef.current = reponses;

  const { data: mission } = useQuery({
    queryKey: ['mission', id],
    queryFn: () => api.get<MissionDetail>(`/missions/${id}`),
  });
  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<{ avatar?: { config?: unknown } | null }>('/carriere/me'),
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function demarrer() {
    await api.post(`/missions/${id}/start`);
    debutRef.current = Date.now();
    soumisRef.current = false;
    setEtapeIdx(0);
    setPhase('jeu');
    if (mission?.dureeLimiteSec) {
      setTempsRestant(mission.dureeLimiteSec);
      timerRef.current = setInterval(() => {
        setTempsRestant((t) => {
          if (t === null) return null;
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            void soumettre();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }

  async function soumettre() {
    if (soumisRef.current) return;
    soumisRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setEnvoi(true);
    try {
      const tempsUtiliseSec = Math.round((Date.now() - debutRef.current) / 1000);
      const reponsesEffectives = { ...reponsesRef.current };
      for (const c of mission?.contenus ?? []) {
        if (c.typeQuestion === 'ORDONNANCEMENT' && reponsesEffectives[c.id] === undefined) {
          reponsesEffectives[c.id] = (c.options ?? []).map((o) => o.id);
        }
      }
      const res = await api.post<Resultat>(`/missions/${id}/submit`, { reponses: reponsesEffectives, tempsUtiliseSec });
      setResultat(res);
      setPhase('resultat');
      jouerSon(res.reussie ? 'succes' : 'echec');
      if (res.badgeObtenu) setTimeout(() => jouerSon('badge'), 600);
      if (res.niveauApres > res.niveauAvant) {
        setLevelUp(res.niveauApres);
        setTimeout(() => jouerSon('niveau'), 350);
      }
      queryClient.invalidateQueries({ queryKey: ['carriere'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    } catch {
      soumisRef.current = false;
    } finally {
      setEnvoi(false);
    }
  }

  function setReponse(contenuId: string, valeur: unknown) {
    setPopId(contenuId);
    setReponses((r) => ({ ...r, [contenuId]: valeur }));
  }

  function toggleMulti(contenuId: string, optionId: string) {
    setPopId(contenuId);
    setReponses((r) => {
      const current = Array.isArray(r[contenuId]) ? (r[contenuId] as string[]) : [];
      return {
        ...r,
        [contenuId]: current.includes(optionId) ? current.filter((v) => v !== optionId) : [...current, optionId],
      };
    });
  }

  function deplacerOrdre(contenuId: string, options: Option[], index: number, direction: -1 | 1) {
    setReponses((r) => {
      const current = Array.isArray(r[contenuId]) ? [...(r[contenuId] as string[])] : options.map((o) => o.id);
      const cible = index + direction;
      if (cible < 0 || cible >= current.length) return r;
      [current[index], current[cible]] = [current[cible], current[index]];
      return { ...r, [contenuId]: current };
    });
  }

  function estRepondue(c: Contenu): boolean {
    const r = reponses[c.id];
    if (c.typeQuestion === 'ORDONNANCEMENT') return true; // ordre par défaut accepté
    if (r === undefined || r === '') return false;
    if (Array.isArray(r)) return r.length > 0;
    return true;
  }

  if (!mission) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  /* ── BRIEFING ── */
  if (phase === 'briefing') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-pierre bg-white">
          <div className="fond-anime p-6 text-ivoire">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{ICONES_TYPE[mission.type] ?? '🎯'}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-sable">{mission.type.replaceAll('_', ' ')}</p>
                <h1 className="font-display text-2xl font-bold">{mission.titre}</h1>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-graphite/70">{mission.description}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-pierre/50 p-3">
                <p className="font-display text-xl font-bold text-graphite">{mission.contenus.length}</p>
                <p className="text-xs text-graphite/50">question{mission.contenus.length > 1 ? 's' : ''}</p>
              </div>
              <div className="rounded-xl bg-pierre/50 p-3">
                <p className="font-display text-xl font-bold text-graphite">{mission.conditionReussite}</p>
                <p className="text-xs text-graphite/50">score requis /{mission.scoreMax}</p>
              </div>
              <div className="rounded-xl bg-pierre/50 p-3">
                <p className="font-display text-xl font-bold text-graphite">
                  {mission.dureeLimiteSec ? `${Math.round(mission.dureeLimiteSec / 60)} min` : '∞'}
                </p>
                <p className="text-xs text-graphite/50">temps</p>
              </div>
            </div>
            <button
              onClick={demarrer}
              className="anim-pulse-cta mt-6 w-full rounded-full bg-terracotta py-3.5 font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile"
            >
              🚀 Démarrer la mission
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── RÉSULTAT ── */
  if (phase === 'resultat' && resultat) {
    const pct = Math.round((resultat.score / resultat.scoreMax) * 100);
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {resultat.reussie && <Confettis />}

        {/* Overlay plein écran de passage de niveau */}
        {levelUp !== null && (
          <div className="fond-anime fixed inset-0 z-50 flex flex-col items-center justify-center text-ivoire">
            <Confettis nombre={70} />
            <p className="anim-fade-up text-sm font-bold uppercase tracking-[0.4em] text-sable">Niveau supérieur</p>
            <p className="anim-fade-up delai-1 font-display text-8xl font-bold text-ivoire drop-shadow-lg">{levelUp}</p>
            <p className="anim-fade-up delai-2 mt-2 text-4xl">🏗️</p>
            <p className="anim-fade-up delai-2 mt-3 max-w-sm text-center text-ivoire/80">
              Un étage de plus sur ton immeuble de carrière — de nouvelles missions se débloquent !
            </p>
            <button
              onClick={() => setLevelUp(null)}
              className="anim-fade-up delai-3 anim-pulse-cta mt-8 rounded-full bg-terracotta px-8 py-3.5 font-semibold text-ivoire transition-transform hover:scale-105"
            >
              Continuer →
            </button>
          </div>
        )}

        <div className={`rounded-3xl border-2 p-8 text-center ${resultat.reussie ? 'border-olive bg-olive/5' : 'border-terracotta bg-terracotta/5'}`}>
          {resultat.reussie && (
            <div className="mb-2 flex justify-center">
              <AvatarBtp config={carriere?.avatar?.config} taille={72} animation="celebration" />
            </div>
          )}
          <div className="flex justify-center">
            <AnneauProgression valeur={resultat.score} max={resultat.scoreMax} taille={150} epaisseur={12} couleur={resultat.reussie ? '#6B7A3F' : '#C1502E'}>
              <div>
                <p className="font-display text-4xl font-bold text-graphite">{resultat.score}</p>
                <p className="text-xs text-graphite/50">/{resultat.scoreMax}</p>
              </div>
            </AnneauProgression>
          </div>
          <p className={`mt-4 font-display text-xl font-bold ${resultat.reussie ? 'text-olive' : 'text-terracotta'}`}>
            {resultat.reussie ? 'Mission réussie ! 🎉' : 'Pas encore, mais tu es sur la bonne voie 💪'}
          </p>
          <p className="mt-1 text-sm text-graphite/50">{pct >= 90 ? 'Performance exceptionnelle !' : pct >= 70 ? 'Très solide.' : pct >= 50 ? 'La correction va t\'aider à progresser.' : 'Revois la correction puis retente — l\'échec fait partie du chemin.'}</p>

          {resultat.securiteEchec && (
            <p className="mx-auto mt-3 max-w-md rounded-xl bg-terracotta/10 p-3 text-sm font-semibold text-terracotta">
              ⚠ Erreur de sécurité grave : score plafonné à 50. Sur un chantier, la sécurité prime toujours.
            </p>
          )}

          {resultat.facteurBesoins < 0.9 && (
            <p className="mx-auto mt-3 max-w-md rounded-xl bg-sable/40 p-3 text-sm font-semibold text-graphite/70">
              😴 Tes besoins sont bas (−{Math.round((1 - resultat.facteurBesoins) * 100)} % sur l&apos;XP gagnée) — pense à te reposer, manger ou discuter depuis ton tableau de bord.
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
            <span className="rounded-full bg-white px-4 py-1.5 font-semibold text-graphite shadow-sm">
              ⚡ +<Compteur cible={resultat.xpGagne} duree={900} /> XP
            </span>
            <span className="rounded-full bg-white px-4 py-1.5 font-semibold text-graphite shadow-sm">
              🏅 {resultat.reputationDelta >= 0 ? '+' : ''}{resultat.reputationDelta} réputation
            </span>
            <span className="rounded-full bg-white px-4 py-1.5 font-mono font-semibold text-graphite shadow-sm">
              💰 {resultat.argentDelta >= 0 ? '+' : ''}{resultat.argentDelta} F
            </span>
            {resultat.bonusChrono > 0 && (
              <span className="rounded-full bg-cuivre/15 px-4 py-1.5 font-semibold text-cuivre shadow-sm">⏱ Bonus chrono +{resultat.bonusChrono}</span>
            )}
          </div>

          {resultat.badgeObtenu && (
            <p className="anim-float mx-auto mt-4 inline-block rounded-full bg-cuivre/15 px-5 py-2 font-display font-bold text-cuivre">
              🏅 Nouveau badge débloqué !
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-pierre bg-white p-5">
          <h2 className="font-display font-bold text-graphite">📖 Correction pédagogique</h2>
          <div className="mt-3 space-y-3">
            {mission.contenus.map((c, i) => {
              const corr = resultat.correction.find((x) => x.contenuId === c.id);
              const ok = corr?.resultat?.correct;
              return (
                <div key={c.id} className={`rounded-xl border-l-4 p-3 ${ok ? 'border-olive bg-olive/5' : 'border-terracotta bg-terracotta/5'}`}>
                  <p className="text-sm font-medium text-graphite">
                    <span className="font-mono text-xs text-graphite/40">Q{i + 1}</span> {c.enonce}
                  </p>
                  <p className={`mt-1 text-xs font-bold ${ok ? 'text-olive' : 'text-terracotta'}`}>{ok ? '✔ Correct' : '✘ À revoir'}</p>
                  {corr?.correctionPedagogique && <p className="mt-1 text-sm text-graphite/70">{corr.correctionPedagogique}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/app/missions" className="flex-1 rounded-full bg-terracotta py-3 text-center font-semibold text-ivoire transition-transform hover:scale-[1.02] hover:bg-argile">
            Mission suivante →
          </Link>
          <button
            onClick={() => {
              setPhase('briefing');
              setReponses({});
              setResultat(null);
              setEtapeIdx(0);
            }}
            className="flex-1 rounded-full border border-graphite/20 py-3 font-semibold text-graphite transition-colors hover:border-terracotta hover:text-terracotta"
          >
            ↻ Améliorer mon score
          </button>
        </div>
      </div>
    );
  }

  /* ── JEU (une question à la fois) ── */
  const contenu = mission.contenus[etapeIdx];
  const derniere = etapeIdx === mission.contenus.length - 1;
  const progression = ((etapeIdx + 1) / mission.contenus.length) * 100;
  const nbRepondues = mission.contenus.filter(estRepondue).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Barre de statut */}
      <div className="sticky top-16 z-20 rounded-2xl border border-pierre bg-white/95 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-display text-sm font-bold text-graphite">
            {ICONES_TYPE[mission.type]} {mission.titre}
          </p>
          {tempsRestant !== null && (
            <span className={`shrink-0 rounded-full px-3 py-1 font-mono text-sm font-bold ${tempsRestant < 60 ? 'animate-pulse bg-terracotta text-ivoire' : 'bg-cuivre/10 text-cuivre'}`}>
              ⏱ {Math.floor(tempsRestant / 60)}:{String(tempsRestant % 60).padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-pierre">
          <div className="barre-progression h-full bg-terracotta" style={{ width: `${progression}%` }} />
        </div>
        <p className="mt-1 text-right font-mono text-[11px] text-graphite/50">
          Question {etapeIdx + 1}/{mission.contenus.length} · {nbRepondues} répondue{nbRepondues > 1 ? 's' : ''}
        </p>
      </div>

      {/* Question courante */}
      <div key={contenu.id} className="anim-fade-up rounded-2xl border border-pierre bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-olive">{AIDE_TYPE[contenu.typeQuestion]}</p>
        <p className="mt-2 font-display text-lg font-bold text-graphite">{contenu.enonce}</p>

        <div className={`mt-4 ${popId === contenu.id ? 'selection-pop' : ''}`} onAnimationEnd={() => setPopId(null)}>
          {(contenu.typeQuestion === 'QCM' || contenu.typeQuestion === 'ZONE_IMAGE') && (
            <div className="space-y-2">
              {(contenu.options ?? []).map((o) => {
                const selected = Array.isArray(reponses[contenu.id]) && (reponses[contenu.id] as string[]).includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleMulti(contenu.id, o.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                      selected
                        ? 'border-terracotta bg-terracotta/10 font-semibold text-terracotta shadow-sm'
                        : 'border-pierre text-graphite/80 hover:border-sable hover:bg-pierre/30'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs ${selected ? 'border-terracotta bg-terracotta text-ivoire' : 'border-mineral/40'}`}>
                      {selected ? '✓' : ''}
                    </span>
                    {contenu.typeQuestion === 'ZONE_IMAGE' ? `📍 ${o.label}` : o.label}
                  </button>
                );
              })}
            </div>
          )}

          {contenu.typeQuestion === 'CHOIX_CONSEQUENCE' && (
            <div className="space-y-2">
              {(contenu.options ?? []).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setReponse(contenu.id, o.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                    reponses[contenu.id] === o.id
                      ? 'border-terracotta bg-terracotta/10 font-semibold text-terracotta shadow-sm'
                      : 'border-pierre text-graphite/80 hover:border-sable hover:bg-pierre/30'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${reponses[contenu.id] === o.id ? 'border-terracotta bg-terracotta' : 'border-mineral/40'}`}>
                    {reponses[contenu.id] === o.id && <span className="h-2 w-2 rounded-full bg-ivoire" />}
                  </span>
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {contenu.typeQuestion === 'NUMERIQUE' && (
            <input
              type="number"
              step="any"
              autoFocus
              value={(reponses[contenu.id] as string) ?? ''}
              onChange={(e) => setReponse(contenu.id, e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border-2 border-pierre px-4 py-3 font-mono text-lg transition-colors focus:border-terracotta focus:outline-none"
              placeholder="Ta réponse…"
            />
          )}

          {contenu.typeQuestion === 'TEXTE' && (
            <textarea
              autoFocus
              value={(reponses[contenu.id] as string) ?? ''}
              onChange={(e) => setReponse(contenu.id, e.target.value)}
              rows={4}
              className="w-full rounded-xl border-2 border-pierre px-4 py-3 transition-colors focus:border-terracotta focus:outline-none"
              placeholder="Rédige ta réponse…"
            />
          )}

          {contenu.typeQuestion === 'ORDONNANCEMENT' && (
            <div className="space-y-2">
              {((reponses[contenu.id] as string[] | undefined) ?? (contenu.options ?? []).map((o) => o.id)).map((optionId, i, arr) => {
                const option = (contenu.options ?? []).find((o) => o.id === optionId);
                return (
                  <div key={optionId} className="flex items-center justify-between rounded-xl border-2 border-pierre px-4 py-2.5 text-sm transition-all">
                    <span>
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-pierre font-mono text-xs font-bold text-graphite/60">
                        {i + 1}
                      </span>
                      {option?.label ?? optionId}
                    </span>
                    <span className="flex gap-1">
                      <button
                        onClick={() => deplacerOrdre(contenu.id, contenu.options ?? [], i, -1)}
                        disabled={i === 0}
                        className="rounded-lg bg-pierre px-2.5 py-1 text-graphite/70 transition-colors hover:bg-terracotta hover:text-ivoire disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => deplacerOrdre(contenu.id, contenu.options ?? [], i, 1)}
                        disabled={i === arr.length - 1}
                        className="rounded-lg bg-pierre px-2.5 py-1 text-graphite/70 transition-colors hover:bg-terracotta hover:text-ivoire disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEtapeIdx((i) => Math.max(0, i - 1))}
          disabled={etapeIdx === 0}
          className="rounded-full border border-graphite/20 px-5 py-2.5 text-sm font-semibold text-graphite transition-colors hover:border-terracotta disabled:opacity-30"
        >
          ← Précédent
        </button>
        <div className="flex flex-1 justify-center gap-1.5">
          {mission.contenus.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setEtapeIdx(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === etapeIdx ? 'w-6 bg-terracotta' : estRepondue(c) ? 'w-2.5 bg-olive' : 'w-2.5 bg-pierre'
              }`}
              aria-label={`Question ${i + 1}`}
            />
          ))}
        </div>
        {derniere ? (
          <button
            onClick={soumettre}
            disabled={envoi}
            className="anim-pulse-cta rounded-full bg-terracotta px-6 py-2.5 text-sm font-bold text-ivoire transition-transform hover:scale-105 hover:bg-argile disabled:opacity-60"
          >
            {envoi ? 'Correction…' : '✔ Valider'}
          </button>
        ) : (
          <button
            onClick={() => setEtapeIdx((i) => Math.min(mission.contenus.length - 1, i + 1))}
            className="rounded-full bg-graphite px-6 py-2.5 text-sm font-semibold text-ivoire transition-colors hover:bg-brun"
          >
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}
