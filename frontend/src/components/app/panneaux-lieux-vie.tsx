'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { articleTropFatigant, articleUtile, effetsArticle, LIBELLES_JAUGES, type ArticleCarte, type Besoins, type JaugeBesoin, type LieuVie } from '@/lib/lieux-vie';
import { conseilsObtenus, niveauRelation, type Professionnel } from '@/lib/lieux-vie/cafe';
import type { Nouvelle } from '@/lib/lieux-vie/maquis';
import type { avancementSemestre, CoursAcademie, ModuleAcademie } from '@/lib/universite';

const CLASSE_PANNEAU = 'hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[80%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[400px]';
const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} F`;

function EnTeteHote({ nom, role, onFermer }: { nom: string; role: string; onFermer: () => void }) {
  return <div className="flex items-center gap-3">
    <span className="hud-titre flex h-12 w-12 items-center justify-center rounded-full bg-[#B8742E] text-lg text-white ring-2 ring-jeu-or/60">{nom.replace('Tantie ', '')[0]}</span>
    <div className="flex-1"><h2 className="hud-titre text-lg leading-tight">{nom}</h2><p className="text-[12px] font-semibold text-jeu-ivoire/65">{role}</p></div>
    <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
  </div>;
}

export function Effets({ effets }: { effets: Partial<Record<JaugeBesoin, number>> }) {
  return <span className="flex flex-wrap gap-1">{(Object.entries(effets) as [JaugeBesoin, number][]).map(([j, n]) => <span key={j} className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold ${n < 0 ? 'bg-jeu-terre/20 text-[#F08A4B]' : 'bg-white/[.08] text-jeu-ivoire/80'}`}>{LIBELLES_JAUGES[j].icone} {n > 0 ? '+' : '−'}{Math.abs(n)} {LIBELLES_JAUGES[j].nom}</span>)}</span>;
}

/** La carte du lieu : chaque article avec son prix et ce qu'il apporte ; au maquis, on choisit aussi où manger. */
export function PanneauCarte({ lieu, besoins, argent, demo, salutation, tablee, onTablee, enCours, erreur, libelleAction = 'Commander', onCommander, onFermer }: {
  lieu: LieuVie; besoins: Besoins; argent: number; demo: boolean; salutation: string;
  /** Verbe du bouton : commander, choisir, réserver… (selon l'article, quand la carte mêle plats et activités). */
  libelleAction?: string | ((article: ArticleCarte) => string);
  /** Au maquis : manger avec les collègues (null quand ils ne sont pas là, absent au café). */
  tablee?: { choisie: boolean; presents: boolean };
  onTablee?: (avec: boolean) => void;
  enCours: boolean; erreur: string | null;
  onCommander: (article: ArticleCarte) => void; onFermer: () => void;
}) {
  const avecCollegues = Boolean(tablee?.choisie && tablee.presents);
  const groupes = ([['Activités', 'activite'], ['Services', 'service'], ['Plats', 'plat'], ['Boissons', 'boisson']] as const)
    .map(([titre, categorie]): [string, ArticleCarte[]] => [titre, lieu.carte.filter(a => a.categorie === categorie)]);
  return <section role="dialog" aria-label={`Carte : ${lieu.nom}`} className={CLASSE_PANNEAU}>
    <EnTeteHote nom={lieu.hote.nom} role={lieu.hote.role} onFermer={onFermer} />
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{salutation}</p>
    <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-[12px]">
      <span className="font-semibold text-jeu-ivoire/70">Ton solde</span><b className="hud-chiffre text-jeu-or">{fcfa(argent)}</b>
      <span className="text-jeu-ivoire/60">🍽 {Math.round(besoins.faim)} · ⚡ {Math.round(besoins.energie)} · 💬 {Math.round(besoins.social)}</span>
    </div>
    {tablee && onTablee && <div role="radiogroup" aria-label="Où manger" className="mb-3 grid grid-cols-2 gap-1.5">
      <button role="radio" aria-checked={!avecCollegues} onClick={() => onTablee(false)} className={`rounded-xl p-2 text-[12px] font-semibold ${!avecCollegues ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/[.06] text-jeu-ivoire/80'}`}>À ma table</button>
      <button role="radio" aria-checked={avecCollegues} disabled={!tablee.presents} onClick={() => onTablee(true)} className={`rounded-xl p-2 text-[12px] font-semibold disabled:opacity-45 ${avecCollegues ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/[.06] text-jeu-ivoire/80'}`}>Avec les collègues{tablee.presents ? ' · 💬 +20' : ''}</button>
      {!tablee.presents && <p className="col-span-2 text-[10.5px] text-jeu-ivoire/55">Les collègues du chantier mangent ici à midi et après 17 h.</p>}
    </div>}
    {groupes.filter(([, articles]) => articles.length).map(([titre, articles]) => <div key={titre} className="mb-2">
      <p className="hud-legende mb-1.5">{titre}</p>
      <ul className="space-y-1.5">{articles.map(a => {
        const options = { tablee: avecCollegues }, utile = articleUtile(besoins, a, options), assez = argent >= a.prix, fatigue = articleTropFatigant(besoins, a);
        return <li key={a.id} className="flex items-center gap-3 rounded-xl bg-white/[.04] p-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold">{a.nom}</p>
            <p className="text-[11.5px] leading-snug text-jeu-ivoire/60">{a.detail}</p>
            <div className="mt-1"><Effets effets={effetsArticle(a, options)} /></div>
          </div>
          <button disabled={enCours || !utile || !assez || fatigue} onClick={() => onCommander(a)} className="hud-bouton hud-bouton-principal shrink-0 flex-col px-3 py-2 text-[12px] disabled:opacity-50">
            <span className="hud-chiffre">{fcfa(a.prix)}</span><span className="text-[10.5px] font-semibold">{fatigue ? 'Trop fatigué(e)' : !utile ? 'Pas besoin' : !assez ? 'Trop cher' : typeof libelleAction === 'function' ? libelleAction(a) : libelleAction}</span>
          </button>
        </li>;
      })}</ul>
    </div>)}
    {erreur && <p role="alert" className="mt-2 rounded-xl border border-jeu-terre/50 bg-jeu-terre/10 p-2.5 text-[12.5px] font-semibold text-[#F08A4B]">{erreur}</p>}
    <p className="mt-2 text-center text-[10.5px] text-jeu-ivoire/50">{demo ? 'Démonstration : le solde affiché baisse, rien n’est sauvegardé.' : 'Payé sur ton solde. Bien nourri et entouré, tu gagnes plus d’XP en séance.'}</p>
  </section>;
}

/** Bandeau du service en cours : préparation, plat servi, repas. */
export function BandeauService({ texte, progression }: { texte: string; progression: number | null }) {
  return <div role="status" className="hud-verre absolute bottom-20 left-1/2 z-30 w-[min(360px,calc(100%-24px))] -translate-x-1/2 px-4 py-2.5 sm:bottom-5">
    <p className="text-[13px] font-semibold">{texte}</p>
    {progression !== null && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-jeu-or transition-[width] duration-200" style={{ width: `${Math.round(progression * 100)}%` }} /></div>}
  </div>;
}

/** Un collègue raconte la nouvelle du jour ; on peut s'y rendre aussitôt. */
export function PanneauNouvelle({ nouvelle, onAller, onFermer }: { nouvelle: Nouvelle; onAller: () => void; onFermer: () => void }) {
  return <section role="dialog" aria-label={`Nouvelle de ${nouvelle.qui}`} className={CLASSE_PANNEAU}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">À la table des collègues</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{nouvelle.qui}</h2></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">« {nouvelle.texte} »</p>
    <div className="grid grid-cols-2 gap-2">
      <button onClick={onAller} className="hud-bouton hud-bouton-principal p-3 text-sm">{nouvelle.aller}</button>
      <button onClick={onFermer} className="hud-bouton hud-bouton-verre p-3 text-sm">Merci, à plus tard</button>
    </div>
  </section>;
}

/** La table du réseau : trois professionnels, la relation avec chacun, les conseils qu'elle a débloqués. */
export function PanneauReseau({ professionnels, relations, dejaVus, onParler, onFermer }: {
  professionnels: Professionnel[]; relations: Record<string, number>; dejaVus: string[];
  onParler: (pro: Professionnel) => void; onFermer: () => void;
}) {
  return <section role="dialog" aria-label="Table du réseau" className={CLASSE_PANNEAU}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">Café des Bâtisseurs</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">La table du réseau</h2></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="mt-2 text-[12.5px] leading-relaxed text-jeu-ivoire/70">Une bonne approche fait grandir la relation ; chaque palier débloque un conseil. Une conversation par personne et par visite.</p>
    <ul className="mt-3 space-y-2">{professionnels.map(pro => {
      const relation = relations[pro.nom] ?? 0, conseils = conseilsObtenus(pro, relation), vu = dejaVus.includes(pro.nom);
      return <li key={pro.nom} className="rounded-xl bg-white/[.04] p-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-[14px] font-bold">{pro.nom}</p><span className="text-[11px] font-semibold text-jeu-or">{niveauRelation(relation)}</span></div>
        <p className="text-[11.5px] font-semibold text-jeu-ivoire/60">{pro.metier}</p>
        <p className="mt-1 text-[12px] leading-snug text-jeu-ivoire/75">{pro.presentation}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Relation ${relation} sur 100`}><div className="h-full rounded-full bg-jeu-lagune" style={{ width: `${Math.min(100, relation)}%` }} /></div>
        {conseils.length > 0 && <p className="mt-2 rounded-lg bg-black/20 p-2 text-[11.5px] italic leading-snug text-jeu-ivoire/80">« {conseils[conseils.length - 1].texte} »</p>}
        <button disabled={vu} onClick={() => onParler(pro)} className="hud-bouton hud-bouton-verre mt-2 w-full px-3 py-2 text-[12.5px] disabled:opacity-50">{vu ? 'Déjà discuté aujourd’hui' : `Discuter avec ${pro.nom.split(' ')[0]}`}</button>
      </li>;
    })}</ul>
  </section>;
}

interface OffreEmploi { id: string; titre: string; niveauMin: number; entrepriseFictive: string | null }

/** Le tableau des annonces : les vraies offres d'emploi du jeu, celles à portée de ton niveau en tête. */
export function PanneauAnnonces({ niveau, demo, onFermer }: { niveau: number; demo: boolean; onFermer: () => void }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['catalog', 'offres'], queryFn: () => api.get<{ items: OffreEmploi[] }>('/catalog/offres-emploi?pageSize=50'), staleTime: 300_000 });
  const [toutes, setToutes] = useState(false);
  const offres = [...(data?.items ?? [])].sort((a, b) => Number(b.niveauMin <= niveau) - Number(a.niveauMin <= niveau) || a.niveauMin - b.niveauMin);
  return <section role="dialog" aria-label="Tableau des annonces" className={CLASSE_PANNEAU}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">Tableau des annonces</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">Offres d’emploi du quartier</h2></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    {isLoading ? <p className="mt-3 text-sm text-jeu-ivoire/70">Les annonces se chargent…</p>
      : isError || !offres.length ? <p className="mt-3 text-sm text-jeu-ivoire/70">Le tableau est vide pour l’instant. Repasse plus tard.</p>
      : <ul className="mt-3 space-y-1.5">{(toutes ? offres : offres.slice(0, 5)).map(o => <li key={o.id} className="flex items-center gap-3 rounded-xl bg-white/[.04] p-2.5">
        <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold">{o.titre}</p><p className="text-[11.5px] text-jeu-ivoire/60">{o.entrepriseFictive ?? 'Entreprise du quartier'} · niveau {o.niveauMin}</p></div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${o.niveauMin <= niveau ? 'bg-jeu-lagune/20 text-jeu-lagune' : 'bg-white/10 text-jeu-ivoire/60'}`}>{o.niveauMin <= niveau ? 'À ta portée' : `Niveau ${o.niveauMin}`}</span>
      </li>)}</ul>}
    {offres.length > 5 && <button onClick={() => setToutes(v => !v)} className="mt-2 w-full text-[12px] font-semibold text-jeu-or underline">{toutes ? 'Voir moins' : `Voir les ${offres.length} annonces`}</button>}
    <Link href={demo ? '/connexion' : '/app/offres'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter pour candidater' : 'Candidater à l’agence →'}</Link>
  </section>;
}

/** Le doyen : où en est ton semestre, et le prochain cours projeté en amphi. */
export function PanneauDoyen({ prochain, avancement, horsLigne, onEnCours, onBibliotheque, onFermer }: {
  prochain: { module: ModuleAcademie; cours: CoursAcademie } | null;
  avancement: ReturnType<typeof avancementSemestre>; horsLigne: boolean;
  onEnCours: () => void; onBibliotheque: () => void; onFermer: () => void;
}) {
  const pct = avancement.total ? Math.round(avancement.faits / avancement.total * 100) : 0;
  return <section role="dialog" aria-label="Le doyen de la faculté" className={CLASSE_PANNEAU}>
    <EnTeteHote nom="Pr Kouamé N’Dri" role="Doyen de la Faculté du Bâtiment" onFermer={onFermer} />
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{prochain
      ? `Bienvenue ! Prochain cours : « ${prochain.cours.titre} », module ${prochain.module.titre}. Installe-toi en amphi, je le projette au grand écran.`
      : 'Tu as suivi tous les cours du semestre. Félicitations : la bibliothèque reste ouverte pour réviser.'}</p>
    <div className="rounded-xl bg-black/20 p-3">
      <div className="flex items-baseline justify-between gap-2"><span className="hud-legende">Semestre · {avancement.valides}/{avancement.parModule.length} modules validés</span><b className="hud-chiffre text-sm text-jeu-or">{avancement.faits}/{avancement.total}</b></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${pct} % du semestre`}><div className="h-full rounded-full bg-jeu-lagune" style={{ width: `${pct}%` }} /></div>
    </div>
    {prochain && <div className="mt-3 rounded-xl bg-white/[.04] p-3">
      <p className="hud-legende text-jeu-or">{prochain.module.titre}</p>
      <p className="mt-0.5 text-[14px] font-bold">{prochain.cours.titre}</p>
      <p className="text-[11.5px] text-jeu-ivoire/60">{prochain.cours.dureeMin ? `${prochain.cours.dureeMin} min · ` : ''}{prochain.cours.missionPratiqueId ? 'suivi d’une mission pratique payée' : 'cours magistral'}</p>
    </div>}
    <div className="mt-3 space-y-2">
      {prochain && <button onClick={onEnCours} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Aller à ma place en amphi</button>}
      <button onClick={onBibliotheque} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">📚 Bibliothèque : tous les cours</button>
    </div>
    {horsLigne && <p className="mt-2 text-center text-[10.5px] text-jeu-ivoire/50">Catalogue injoignable : deux cours de démonstration, non enregistrés.</p>}
  </section>;
}

/** La bibliothèque : chaque module et ses cours, suivis ou non ; on peut tout relire. */
export function PanneauBibliotheque({ modules, termines, onLire, onFermer }: {
  modules: ModuleAcademie[]; termines: ReadonlySet<string>;
  onLire: (module: ModuleAcademie, cours: CoursAcademie) => void; onFermer: () => void;
}) {
  return <section role="dialog" aria-label="Bibliothèque" className={CLASSE_PANNEAU}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">Université BTP</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">La bibliothèque</h2></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <ul className="mt-3 space-y-2">{modules.map(m => {
      const faits = m.cours.filter(c => termines.has(c.id)).length;
      return <li key={m.id} className="rounded-xl bg-white/[.04] p-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-[13.5px] font-bold">{m.titre}</p><span className={`hud-chiffre text-[12px] ${faits === m.cours.length ? 'text-jeu-lagune' : 'text-jeu-or'}`}>{faits}/{m.cours.length}</span></div>
        <ul className="mt-1.5 space-y-1">{m.cours.map(c => <li key={c.id}><button onClick={() => onLire(m, c)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-white/[.06]">
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${termines.has(c.id) ? 'bg-jeu-lagune text-[#14261F]' : 'bg-white/10'}`}>{termines.has(c.id) ? '✓' : ''}</span>
          <span className="min-w-0 flex-1">{c.titre}</span><span className="shrink-0 text-[11px] font-semibold text-jeu-or">{termines.has(c.id) ? 'Relire' : 'Lire'}</span>
        </button></li>)}</ul>
      </li>;
    })}</ul>
  </section>;
}
