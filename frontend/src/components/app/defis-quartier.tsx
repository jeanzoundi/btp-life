'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { aReclamer, cleJour, defisDemo, etatDemo, imprevuDemo, reussi, type DecisionImprevu, type Defi, type EtatDefisDemo, type ImprevuDuJour, type TotauxDemo } from '@/lib/defis';

interface ReponseDefis { jour: Defi[]; semaine: Defi[] }
interface ReponseImprevu { imprevu: ImprevuDuJour | null; decision: DecisionImprevu | null }

/** Défis et imprévu du jour. Connecté : le serveur mesure, verse et retient. En démonstration : le navigateur, à partir des
 * totaux du jeu (séances, chapitres, trajets) et d'un petit jeu de défis. */
export function useDefisQuartier({ demo, totauxDemo, recompenserDemo }: {
  demo: boolean; totauxDemo: TotauxDemo;
  /** Gains et pertes de démonstration, appliqués au solde affiché. */
  recompenserDemo: (effets: { xp: number; argent: number }) => void;
}) {
  const client = useQueryClient();
  const { data: serveur } = useQuery({ queryKey: ['monde', 'defis'], queryFn: () => api.get<ReponseDefis>('/monde/defis'), enabled: !demo, staleTime: 60_000, refetchInterval: 120_000 });
  const { data: imprevuServeur } = useQuery({ queryKey: ['monde', 'imprevu'], queryFn: () => api.get<ReponseImprevu>('/monde/imprevu'), enabled: !demo, staleTime: 300_000 });
  const rafraichir = () => { client.invalidateQueries({ queryKey: ['monde'] }); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); };
  const reclamerServeur = useMutation({ mutationFn: (slug: string) => api.post<{ recompense: Defi['recompense'] }>(`/monde/defis/${slug}/reclamer`), onSuccess: rafraichir });
  const deciderServeur = useMutation({ mutationFn: (option: number) => api.post<DecisionImprevu>('/monde/imprevu', { option }), onSuccess: rafraichir });

  // Démonstration : l'état du jour est gardé dans le navigateur.
  const cle = 'btp-life-defis:demo';
  const [local, setLocal] = useState<EtatDefisDemo | null>(null);
  useEffect(() => {
    if (!demo) return;
    let brut: unknown = null;
    try { brut = JSON.parse(localStorage.getItem(cle) ?? 'null'); } catch { /* Stockage facultatif. */ }
    setLocal(etatDemo(brut, new Date(), totauxDemo));
  }, [demo]); // eslint-disable-line react-hooks/exhaustive-deps
  const enregistrer = useCallback((e: EtatDefisDemo) => { setLocal(e); try { localStorage.setItem(cle, JSON.stringify(e)); } catch { /* Stockage facultatif. */ } }, []);
  const etatLocal = local && local.jour === cleJour(new Date()) ? local : null;

  const defis: Defi[] = demo ? (etatLocal ? defisDemo(etatLocal, totauxDemo) : []) : [...(serveur?.jour ?? []), ...(serveur?.semaine ?? [])];
  const imprevuLocal = etatLocal ? imprevuDemo(etatLocal.jour) : null;
  const imprevu = demo ? (imprevuLocal ? { slug: imprevuLocal.slug, titre: imprevuLocal.titre, description: imprevuLocal.description, options: imprevuLocal.options } : null) : imprevuServeur?.imprevu ?? null;
  const decision = demo ? (imprevuLocal && etatLocal?.imprevu !== null && etatLocal?.imprevu !== undefined ? imprevuLocal.decisions[etatLocal.imprevu] ?? null : null) : imprevuServeur?.decision ?? null;

  /** Réclame un défi réussi ; renvoie l'erreur à afficher, ou rien. */
  const reclamer = async (slug: string): Promise<string | null> => {
    const d = defis.find(x => x.slug === slug);
    if (!d || !reussi(d) || d.reclame) return 'Ce défi n’est pas encore réussi.';
    if (demo) {
      if (!etatLocal) return null;
      enregistrer({ ...etatLocal, reclames: [...etatLocal.reclames, slug] });
      recompenserDemo({ xp: d.recompense.xp, argent: d.recompense.argent });
      return null;
    }
    try { await reclamerServeur.mutateAsync(slug); return null; } catch (e) { return (e as Error).message || 'Récompense indisponible pour l’instant.'; }
  };
  /** Décide face à l'imprévu du jour ; renvoie l'erreur à afficher, ou rien. */
  const decider = async (option: number): Promise<string | null> => {
    if (demo) {
      if (!etatLocal || !imprevuLocal) return null;
      const d = imprevuLocal.decisions[option];
      if (!d) return 'Option inconnue.';
      enregistrer({ ...etatLocal, imprevu: option });
      recompenserDemo({ xp: d.effets.xp, argent: d.effets.argent });
      return null;
    }
    try { await deciderServeur.mutateAsync(option); return null; } catch (e) { return (e as Error).message || 'Décision non enregistrée.'; }
  };
  return { defis, imprevu, decision, aReclamer: aReclamer(defis), reclamer, decider, enCours: reclamerServeur.isPending || deciderServeur.isPending };
}

export type EtatDefisQuartier = ReturnType<typeof useDefisQuartier>;

const effetsLisibles = (e: DecisionImprevu['effets']) => [e.xp ? `+${e.xp} XP` : '', e.argent ? `${e.argent > 0 ? '+' : ''}${e.argent.toLocaleString('fr-FR')} F` : '', e.reputation ? `${e.reputation > 0 ? '+' : ''}${e.reputation} de réputation` : ''].filter(Boolean).join(' · ') || 'Sans conséquence';

/** L'écran « Défis » du téléphone : les défis du jour et de la semaine, et l'imprévu du jour au Grand chantier. */
export function EcranDefis({ etat, onChantier }: { etat: EtatDefisQuartier; onChantier: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const liste = (periode: Defi['periode']) => etat.defis.filter(d => d.periode === periode);
  const ligne = (d: Defi) => <li key={d.slug} className="rounded-xl bg-white/[.06] p-2.5">
    <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{d.titre}</b><span className="hud-chiffre shrink-0 text-[11px] text-jeu-or">{d.progres}/{d.objectif.cible}</span></div>
    <p className="mt-0.5 text-[11px] leading-snug text-jeu-ivoire/65">{d.description}</p>
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${reussi(d) ? 'bg-jeu-lagune' : 'bg-jeu-or'}`} style={{ width: `${Math.round(d.progres / d.objectif.cible * 100)}%` }} /></div>
    <div className="mt-1.5 flex items-center justify-between gap-2">
      <span className="text-[10.5px] text-jeu-ivoire/60">+{d.recompense.argent.toLocaleString('fr-FR')} F · +{d.recompense.xp} XP{d.recompense.reputation ? ` · +${d.recompense.reputation} réputation` : ''}</span>
      {d.reclame ? <span className="text-[11px] font-bold text-jeu-lagune">✓ Versé</span>
        : <button type="button" disabled={!reussi(d) || etat.enCours} onClick={async () => setMessage(await etat.reclamer(d.slug) ?? `Récompense versée : ${d.titre}.`)} className="rounded-lg bg-jeu-or/20 px-2.5 py-1 text-[11px] font-bold text-jeu-or enabled:hover:bg-jeu-or/30 disabled:opacity-40">Réclamer</button>}
    </div>
  </li>;
  return <div className="space-y-3 p-3">
    <section><p className="hud-legende mb-1.5 text-jeu-or">Défis du jour</p>{liste('jour').length ? <ul className="space-y-2">{liste('jour').map(ligne)}</ul> : <p className="text-[11.5px] text-jeu-ivoire/60">Chargement des défis…</p>}</section>
    {liste('semaine').length > 0 && <section><p className="hud-legende mb-1.5 text-jeu-or">Défi de la semaine</p><ul className="space-y-2">{liste('semaine').map(ligne)}</ul></section>}
    {etat.imprevu && <section className="rounded-xl bg-[#E2653C]/12 p-2.5 ring-1 ring-[#E2653C]/30">
      <p className="hud-legende text-[#F08A4B]">Imprévu du jour · Grand chantier</p>
      <p className="mt-1 text-[12.5px] font-bold">{etat.imprevu.titre}</p>
      {etat.decision ? <p className="mt-1 text-[11.5px] text-jeu-ivoire/75">Réglé : {etat.decision.retour}</p>
        : <button type="button" onClick={onChantier} className="mt-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold hover:bg-white/20">Aller le régler au chantier →</button>}
    </section>}
    {message && <p role="status" className="text-center text-[11.5px] text-jeu-ivoire/75">{message}</p>}
  </div>;
}

/** L'imprévu du jour, présenté au Grand chantier : la situation, trois décisions, et leurs conséquences une fois prise. */
export function PanneauImprevu({ etat, onFermer }: { etat: EtatDefisQuartier; onFermer: () => void }) {
  const [erreur, setErreur] = useState<string | null>(null);
  if (!etat.imprevu) return null;
  const { imprevu, decision } = etat;
  return <section role="dialog" aria-label={`Imprévu : ${imprevu.titre}`} className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-w-md p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[400px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-[#F08A4B]">Imprévu du jour · Grand chantier</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{imprevu.titre}</h2></div>
      <button type="button" aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-relaxed">{imprevu.description}</p>
    {decision ? <div className="mt-3 space-y-2">
      <p className="rounded-xl bg-white/[.06] p-3 text-[13px]"><b>Ta décision :</b> {imprevu.options[decision.option]}</p>
      <p role="status" className={`rounded-xl p-3 text-[13px] leading-relaxed ${decision.effets.reputation >= 0 && decision.effets.argent >= 0 ? 'bg-jeu-lagune/12 text-jeu-ivoire' : 'bg-[#E2653C]/12 text-jeu-ivoire'}`}>{decision.retour}<span className="mt-1 block text-[12px] font-bold">{effetsLisibles(decision.effets)}</span></p>
      <button type="button" onClick={onFermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Retour au chantier</button>
    </div> : <ul className="mt-3 space-y-2">{imprevu.options.map((o, i) => <li key={o}>
      <button type="button" disabled={etat.enCours} onClick={async () => setErreur(await etat.decider(i))} className="w-full rounded-xl border border-white/15 bg-white/[.05] p-3 text-left text-[13px] font-semibold hover:border-jeu-or/50 hover:bg-white/10">{o}</button>
    </li>)}</ul>}
    {erreur && <p role="alert" className="mt-2 text-[12px] text-[#F08A4B]">{erreur}</p>}
  </section>;
}
