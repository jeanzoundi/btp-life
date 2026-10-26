'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import {
  coutMateriaux, ENERGIE_JOURNEE_TRAVAUX, ESSAIS_METRE, francs, INTERVALLE_JOURNEE_DEMO_MS, INTERVALLE_JOURNEE_TRAVAUX_MS, metreJuste, RENOVATIONS,
  type NiveauLogement, type Renovation,
} from '@/lib/patrimoine';

// Les travaux chez soi, comme le Grand chantier en petit : le métré à partir des cotes, le devis du dépôt, la commande,
// puis une journée de travaux par journée du monde, à la Résidence Lagune. Connecté, le serveur tient le chantier ;
// en démonstration, le navigateur le joue avec les mêmes chiffres.

type Etape = 'metre' | 'materiaux' | 'travaux';
interface VueChantier {
  slug: string; nom: string; etape: Etape; journees: number; journeesTotal: number; confort: number; essaisRestants: number;
  metre: { question: string; cotes: ReadonlyArray<readonly [string, string]>; unite: string; reponse?: number; explication?: string };
  devis: { materiaux: Renovation['materiaux']; total: number } | null;
  prochaineJourneeLe: string | null;
}
interface ProjetMaison { slug: string; nom: string; description: string; confort: number; journees: number; cout: number; faite: boolean }
type VueTravaux = { argent: number; logement: { niveau: NiveauLogement }; renovations?: ProjetMaison[]; chantier?: VueChantier | null; juste?: boolean; termine?: boolean };
interface ChantierDemo { slug: string; etape: Etape; essais: number; journees: number; derniereJourneeLe: number | null }

const renovation = (slug: string) => RENOVATIONS.find(r => r.slug === slug)!;

/** Le chantier de démonstration, au format du serveur (la réponse du métré n'apparaît qu'une fois le métré passé). */
function vueDemo(c: ChantierDemo | null): VueChantier | null {
  if (!c) return null;
  const r = renovation(c.slug), fait = c.etape !== 'metre';
  return {
    slug: c.slug, nom: r.nom, etape: c.etape, journees: c.journees, journeesTotal: r.journees, confort: r.confort, essaisRestants: Math.max(0, ESSAIS_METRE - c.essais),
    metre: { question: r.metre.question, cotes: r.metre.cotes, unite: r.metre.unite, ...(fait ? { reponse: r.metre.reponse, explication: r.metre.explication } : {}) },
    devis: fait ? { materiaux: r.materiaux, total: coutMateriaux(r) } : null,
    prochaineJourneeLe: c.derniereJourneeLe ? new Date(c.derniereJourneeLe + INTERVALLE_JOURNEE_DEMO_MS).toISOString() : null,
  };
}

const messageMetre = (juste: boolean, passe: boolean) => juste ? 'Métré juste : voici le devis du dépôt.'
  : passe ? 'Trois essais : voici la correction, et le devis sur les bonnes quantités.' : 'Pas tout à fait : reprends les cotes.';

/** L'état des travaux et leurs actions, partagés par le téléphone et le panneau « Chez toi ». */
export function useTravauxMaison({ demo, argent, depenserDemo, logementDemo = 'studio', onJourneeDemo }: {
  demo: boolean; argent: number; depenserDemo: (montant: number) => boolean; logementDemo?: NiveauLogement; onJourneeDemo?: () => void;
}) {
  const client = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const { data } = useQuery({ queryKey: ['monde', 'patrimoine'], queryFn: () => api.get<VueTravaux>('/monde/patrimoine'), enabled: !demo });
  const action = useMutation({
    mutationFn: ({ chemin, corps }: { chemin: string; corps?: unknown }) => api.post<VueTravaux>(chemin, corps),
    onSuccess: vue => { client.setQueryData(['monde', 'patrimoine'], vue); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); },
    onError: (e: Error) => setMessage(e.message || 'Opération refusée.'),
  });
  const [chantierDemo, setChantierDemo] = useState<ChantierDemo | null>(null);
  const [faitesDemo, setFaitesDemo] = useState<Array<{ slug: string; logement: NiveauLogement }>>([]);

  const niveau = demo ? logementDemo : data?.logement.niveau ?? 'studio';
  const projets: ProjetMaison[] = demo
    ? RENOVATIONS.filter(r => r.logements.includes(niveau)).map(r => ({ slug: r.slug, nom: r.nom, description: r.description, confort: r.confort, journees: r.journees, cout: coutMateriaux(r), faite: faitesDemo.some(f => f.slug === r.slug && f.logement === niveau) }))
    : data?.renovations ?? [];
  const chantier = demo ? vueDemo(chantierDemo) : data?.chantier ?? null;
  const poster = (chemin: string, corps: unknown, succes: (vue: VueTravaux) => string | null) =>
    action.mutate({ chemin, corps }, { onSuccess: vue => setMessage(succes(vue)) });

  return {
    projets, chantier, argent, demo, enCours: action.isPending, message,
    intervalle: demo ? INTERVALLE_JOURNEE_DEMO_MS : INTERVALLE_JOURNEE_TRAVAUX_MS,
    confortTravaux: projets.filter(p => p.faite).reduce((s, p) => s + p.confort, 0),
    commencer(slug: string) {
      if (!demo) return poster('/monde/patrimoine/renovation', { slug }, () => null);
      if (chantierDemo) return setMessage('Des travaux sont déjà en cours chez toi.');
      setChantierDemo({ slug, etape: 'metre', essais: 0, journees: 0, derniereJourneeLe: null });
      setMessage(null);
    },
    metrer(reponse: number) {
      if (!demo) return poster('/monde/patrimoine/renovation/metre', { reponse }, vue => messageMetre(Boolean(vue.juste), vue.chantier?.etape === 'materiaux'));
      if (!chantierDemo) return;
      const juste = metreJuste(renovation(chantierDemo.slug), reponse), essais = chantierDemo.essais + 1, passe = juste || essais >= ESSAIS_METRE;
      setChantierDemo({ ...chantierDemo, essais, etape: passe ? 'materiaux' : 'metre' });
      setMessage(messageMetre(juste, passe));
    },
    acheter() {
      if (!demo) return poster('/monde/patrimoine/renovation/materiaux', undefined, () => 'Matériaux livrés par le dépôt : place aux travaux, chez toi.');
      if (!chantierDemo) return;
      const cout = coutMateriaux(renovation(chantierDemo.slug));
      if (!depenserDemo(cout)) return setMessage(`Pas assez d’argent : ${francs(cout)}.`);
      setChantierDemo({ ...chantierDemo, etape: 'travaux' });
      setMessage('Matériaux livrés par le dépôt (démonstration) : place aux travaux, chez toi.');
    },
    journee() {
      if (!demo) return poster('/monde/patrimoine/renovation/journee', undefined, vue => vue.termine
        ? 'Travaux finis : ton logement est plus confortable, tu le sentiras à chaque réveil.' : 'Journée de travaux faite. La suite demain.');
      if (!chantierDemo) return;
      if (chantierDemo.derniereJourneeLe && Date.now() - chantierDemo.derniereJourneeLe < INTERVALLE_JOURNEE_DEMO_MS) return setMessage('Une journée de travaux par journée du monde : reviens demain.');
      onJourneeDemo?.();
      const r = renovation(chantierDemo.slug), journees = chantierDemo.journees + 1;
      if (journees >= r.journees) {
        setFaitesDemo(f => [...f, { slug: r.slug, logement: niveau }]);
        setChantierDemo(null);
        setMessage(`Travaux finis : +${r.confort} de moral à chaque réveil chez toi.`);
      } else {
        setChantierDemo({ ...chantierDemo, journees, derniereJourneeLe: Date.now() });
        setMessage('Journée de travaux faite. La suite demain.');
      }
    },
    abandonner() {
      if (!demo) return poster('/monde/patrimoine/renovation/abandon', undefined, () => 'Travaux abandonnés.');
      setChantierDemo(null);
      setMessage('Travaux abandonnés.');
    },
  };
}
export type TravauxMaison = ReturnType<typeof useTravauxMaison>;

const Carte = ({ children, accent = false }: { children: ReactNode; accent?: boolean }) => <div className={`rounded-xl p-2.5 ${accent ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'bg-white/[.06]'}`}>{children}</div>;
const Bouton = ({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) =>
  <button type="button" disabled={disabled} onClick={onClick} className="rounded-lg bg-jeu-or/20 px-2.5 py-1 text-[11px] font-bold text-jeu-or enabled:hover:bg-jeu-or/30 disabled:opacity-40">{children}</button>;
const ETAPES: Array<[Etape, string]> = [['metre', 'Métré'], ['materiaux', 'Devis'], ['travaux', 'Travaux']];

/** Les travaux chez soi : la liste des projets, puis le métré, le devis et les journées du chantier en cours. */
export function EcranTravaux({ travaux, chezToi }: { travaux: TravauxMaison; chezToi: boolean }) {
  const [saisie, setSaisie] = useState('');
  const [, setTic] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setTic(t => t + 1), 5_000); return () => window.clearInterval(id); }, []);
  const c = travaux.chantier;

  if (!c) return <div className="space-y-2">
    <p className="text-[11px] leading-snug text-jeu-ivoire/65">Chaque chantier fini rend ton logement plus agréable : du moral en plus à chaque réveil{travaux.confortTravaux ? ` (déjà +${travaux.confortTravaux})` : ''}.</p>
    {travaux.projets.map(p => <Carte key={p.slug}>
      <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{p.nom}</b><span className="hud-chiffre shrink-0 text-[11px] text-jeu-or">≈ {francs(p.cout)}</span></div>
      <p className="mt-0.5 text-[11px] leading-snug text-jeu-ivoire/65">{p.description}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2"><span className="text-[10.5px] text-jeu-ivoire/55">{p.journees} journées · +{p.confort} de moral au réveil</span>
        {p.faite ? <span className="text-[11px] font-bold text-jeu-lagune">✓ Fait</span> : <Bouton disabled={travaux.enCours} onClick={() => travaux.commencer(p.slug)}>Lancer</Bouton>}</div>
    </Carte>)}
    {travaux.message && <p role="status" className="text-center text-[11.5px] text-jeu-ivoire/75">{travaux.message}</p>}
  </div>;

  const indexEtape = ETAPES.findIndex(([id]) => id === c.etape);
  const attente = c.prochaineJourneeLe ? Math.max(0, Date.parse(c.prochaineJourneeLe) - Date.now()) : 0;
  const valeur = Number(saisie.replace(/\s/g, '').replace(',', '.'));
  return <div className="space-y-2">
    <Carte accent>
      <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{c.nom}</b><span className="text-[10.5px] text-jeu-ivoire/60">+{c.confort} de moral une fois fini</span></div>
      <ol className="mt-1.5 flex gap-1 text-[10.5px] font-bold">{ETAPES.map(([id, nom], i) => <li key={id} className={`flex-1 rounded-md py-0.5 text-center ${i < indexEtape ? 'bg-jeu-lagune/25 text-jeu-lagune' : i === indexEtape ? 'bg-jeu-or/25 text-jeu-or' : 'bg-white/[.05] text-jeu-ivoire/45'}`}>{i < indexEtape ? '✓ ' : ''}{nom}</li>)}</ol>
    </Carte>

    {c.etape === 'metre' && <Carte>
      <p className="text-[11px] font-bold uppercase tracking-wide text-jeu-ivoire/60">Les cotes relevées</p>
      <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-[11.5px]">{c.metre.cotes.map(([nom, cote]) => <div key={nom} className="contents"><dt className="text-jeu-ivoire/70">{nom}</dt><dd className="hud-chiffre text-right">{cote}</dd></div>)}</dl>
      <form className="mt-2 flex items-center gap-1.5" onSubmit={e => { e.preventDefault(); if (saisie.trim() && Number.isFinite(valeur)) { travaux.metrer(valeur); setSaisie(''); } }}>
        <label className="sr-only" htmlFor="metre-travaux">{c.metre.question}</label>
        <input id="metre-travaux" inputMode="decimal" value={saisie} onChange={e => setSaisie(e.target.value)} placeholder={c.metre.question} onKeyDown={e => e.stopPropagation()}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-[12px] text-jeu-ivoire placeholder:text-jeu-ivoire/40 focus:border-jeu-or/60 focus:outline-none" />
        <span className="text-[11px] text-jeu-ivoire/70">{c.metre.unite}</span>
        <button type="submit" disabled={travaux.enCours || !saisie.trim()} className="rounded-lg bg-jeu-or/20 px-2.5 py-1 text-[11px] font-bold text-jeu-or enabled:hover:bg-jeu-or/30 disabled:opacity-40">Valider</button>
      </form>
      <p className="mt-1 text-[10.5px] text-jeu-ivoire/55">{c.metre.question} · {c.essaisRestants} essai{c.essaisRestants > 1 ? 's' : ''} avant la correction</p>
    </Carte>}

    {c.etape !== 'metre' && c.metre.explication && <p className="rounded-lg bg-white/[.04] px-2.5 py-1.5 text-[11px] leading-snug text-jeu-ivoire/70">📐 {c.metre.explication}</p>}

    {c.etape === 'materiaux' && c.devis && <Carte>
      <p className="text-[11px] font-bold uppercase tracking-wide text-jeu-ivoire/60">Devis du dépôt</p>
      <ul className="mt-1 space-y-0.5 text-[11.5px]">{c.devis.materiaux.map(m => <li key={m.nom} className="flex justify-between gap-2"><span className="text-jeu-ivoire/75">{m.quantite.toLocaleString('fr-FR')} {m.unite} · {m.nom}</span><span className="hud-chiffre shrink-0">{francs(Math.round(m.quantite * m.prixUnitaire))}</span></li>)}</ul>
      <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5"><b className="text-[12px]">Total : {francs(c.devis.total)}</b>
        <Bouton disabled={travaux.enCours || travaux.argent < c.devis.total} onClick={travaux.acheter}>{travaux.argent < c.devis.total ? 'Trop cher' : 'Commander'}</Bouton></div>
    </Carte>}

    {c.etape === 'travaux' && <Carte>
      <p className="text-[12px] font-bold">Journée {Math.min(c.journees + 1, c.journeesTotal)} sur {c.journeesTotal}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-jeu-lagune" style={{ width: `${(c.journees / c.journeesTotal) * 100}%` }} /></div>
      {chezToi
        ? <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10.5px] text-jeu-ivoire/60">{attente > 0 ? `Prochaine journée dans ${Math.ceil(attente / 60_000)} min` : `Une journée coûte ${ENERGIE_JOURNEE_TRAVAUX} d’énergie`}</span>
          <Bouton disabled={travaux.enCours || attente > 0} onClick={travaux.journee}>Une journée de travaux</Bouton></div>
        : <p className="mt-1.5 text-[11px] leading-snug text-jeu-ivoire/65">Les journées de travaux se font chez toi, à la Résidence Lagune{attente > 0 ? ` (prochaine dans ${Math.ceil(attente / 60_000)} min)` : ''}.</p>}
    </Carte>}

    {travaux.message && <p role="status" className="text-center text-[11.5px] text-jeu-ivoire/75">{travaux.message}</p>}
    <button type="button" disabled={travaux.enCours} onClick={travaux.abandonner} className="w-full text-center text-[10.5px] text-jeu-ivoire/45 underline-offset-2 hover:underline">Abandonner ces travaux{c.etape === 'travaux' ? ' (matériaux perdus)' : ''}</button>
  </div>;
}
