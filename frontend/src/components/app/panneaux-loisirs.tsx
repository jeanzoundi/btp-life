'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { articleUtile, prixArticle, type ArticleCarte, type Besoins } from '@/lib/lieux-vie';
import { OFFRES_MARCHANDAGE, proposer, seuilVendeuse } from '@/lib/lieux-vie/marche';
import { butMarque, coinAdverse, COINS, issueTirs, type Coin } from '@/lib/lieux-vie/sport';
import { Effets } from './panneaux-lieux-vie';

// Panneaux des lieux de loisirs : l'étal où l'on marchande, les tirs au but, la cabine d'essayage, la vitrine des réussites.

const CLASSE_PANNEAU = 'hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[80%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[410px]';
const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} F`;

function EnTete({ surtitre, titre, onFermer }: { surtitre: string; titre: string; onFermer: () => void }) {
  return <div className="flex items-start justify-between gap-3">
    <div><p className="hud-legende text-jeu-or">{surtitre}</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{titre}</h2></div>
    <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
  </div>;
}

/** Un étal du marché : saluer, choisir, proposer un prix ; la vendeuse accepte, contre-propose ou se fâche. */
export function PanneauEtal({ vendeuse, articles, besoins, argent, heure, demo, salue, fachee, enCours, erreur, onSaluer, onFacher, onAcheter, onFermer }: {
  vendeuse: string; articles: ArticleCarte[]; besoins: Besoins; argent: number; heure: number; demo: boolean; salue: boolean; fachee: boolean; enCours: boolean; erreur: string | null;
  onSaluer: () => void; onFacher: () => void; onAcheter: (article: ArticleCarte, remise: number) => void; onFermer: () => void;
}) {
  const [choisi, setChoisi] = useState<ArticleCarte | null>(articles.length === 1 ? articles[0] : null);
  const [reponse, setReponse] = useState<{ texte: string; remise: number | null } | null>(null);
  const seuil = seuilVendeuse(salue, heure);
  const offrir = (offre: number) => {
    if (!choisi) return;
    if (offre === 0) { onAcheter(choisi, 0); return; }
    const { issue, remise } = proposer(offre, seuil);
    if (issue === 'accepte') { setReponse({ texte: `« D’accord, ${fcfa(prixArticle(choisi, remise))}, c’est bien parce que c’est toi. »`, remise }); return; }
    if (issue === 'contre') { setReponse({ texte: `« Non, ça ne va pas me laisser de bénéfice. Je te le fais à ${fcfa(prixArticle(choisi, remise))}. »`, remise }); return; }
    onFacher(); setReponse({ texte: '« Tu veux me ruiner ? Pour toi, c’est le prix affiché aujourd’hui. »', remise: null });
  };
  return <section role="dialog" aria-label={`Étal de ${vendeuse}`} className={CLASSE_PANNEAU}>
    <EnTete surtitre="Marché des Jardins" titre={vendeuse} onFermer={onFermer} />
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{fachee ? '« Prix affichés, et c’est tout. »' : salue ? '« Ça va bien, et la famille ? Choisis, je te fais un bon prix. »' : '« Oui, qu’est-ce que tu veux ? »'}</p>
    {!salue && !fachee && <button onClick={onSaluer} className="hud-bouton hud-bouton-verre mb-3 w-full p-2.5 text-[12.5px]">👋 Saluer et prendre des nouvelles</button>}
    <ul className="space-y-1.5">{articles.map(a => {
      const utile = articleUtile(besoins, a);
      return <li key={a.id}><button disabled={!utile} onClick={() => { setChoisi(a); setReponse(null); }} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left disabled:opacity-50 ${choisi?.id === a.id ? 'bg-jeu-or/[.14] ring-1 ring-jeu-or/50' : 'bg-white/[.04]'}`}>
        <div className="min-w-0 flex-1"><p className="text-[13.5px] font-bold">{a.nom}</p><p className="text-[11.5px] text-jeu-ivoire/60">{a.detail}</p><div className="mt-1"><Effets effets={a.effets} /></div></div>
        <span className="hud-chiffre shrink-0 text-[13px] text-jeu-or">{utile ? fcfa(a.prix) : 'Pas faim'}</span>
      </button></li>;
    })}</ul>
    {choisi && <div className="mt-3 rounded-xl bg-black/20 p-3">
      <p className="hud-legende mb-2">{fachee ? 'Prix fixe' : 'Ton offre'}</p>
      <div className="grid grid-cols-2 gap-1.5">{(fachee ? [0] : OFFRES_MARCHANDAGE).map(offre => <button key={offre} disabled={enCours || argent < prixArticle(choisi, offre)} onClick={() => offrir(offre)} className={`hud-bouton px-2 py-2 text-[12px] ${offre === 0 ? 'hud-bouton-principal col-span-2' : 'hud-bouton-verre'}`}>
        {offre === 0 ? `Payer ${fcfa(choisi.prix)}` : `Proposer ${fcfa(Math.round(choisi.prix * (1 - offre) / 25) * 25)} (−${Math.round(offre * 100)} %)`}
      </button>)}</div>
      {reponse && <div role="status" className="mt-2 text-[12.5px] leading-relaxed">
        <p className="font-semibold">{reponse.texte}</p>
        {reponse.remise !== null && <button disabled={enCours} onClick={() => onAcheter(choisi, reponse.remise!)} className="hud-bouton hud-bouton-principal mt-2 w-full p-2.5 text-[12.5px]">Marché conclu · {fcfa(prixArticle(choisi, reponse.remise))}</button>}
      </div>}
    </div>}
    {erreur && <p role="alert" className="mt-2 text-[12.5px] font-semibold text-[#F08A4B]">{erreur}</p>}
    <p className="mt-2 text-[10.5px] leading-snug text-jeu-ivoire/50">Au marché, on salue avant de parler prix ; en fin de journée, les vendeuses sont plus arrangeantes.{demo ? ' Démonstration : le solde affiché baisse, rien n’est sauvegardé.' : ''}</p>
  </section>;
}

/** Les tirs au but, après le match nul : tu tires, puis tu gardes ; cinq chacun, puis mort subite. */
export function PanneauTirsAuBut({ graine, onFin }: { graine: number; onFin: (victoire: boolean) => void }) {
  const [nous, setNous] = useState<boolean[]>([]);
  const [eux, setEux] = useState<boolean[]>([]);
  const [dernier, setDernier] = useState<string | null>(null);
  const issue = issueTirs(nous, eux);
  const aNousDeTirer = nous.length === eux.length;
  const jouer = (coin: Coin) => {
    // Chaque manche a son coin : le plongeon du gardien adverse (pair), le tir adverse (impair).
    if (aNousDeTirer) {
      const plongeon = coinAdverse(graine, nous.length * 2), but = butMarque(coin, plongeon);
      setNous(n => [...n, but]); setDernier(but ? `But ! Le gardien a plongé ${plongeon === 'centre' ? 'au centre' : `à ${plongeon}`}.` : `Arrêté ! Le gardien avait lu ton tir ${coin === 'centre' ? 'au centre' : `à ${coin}`}.`);
    } else {
      const tir = coinAdverse(graine, eux.length * 2 + 1), but = butMarque(tir, coin);
      setEux(e => [...e, but]); setDernier(but ? `Leur tireur marque ${tir === 'centre' ? 'au centre' : `à ${tir}`}.` : 'Tu l’arrêtes ! Bien plongé.');
    }
  };
  const ronds = (tirs: boolean[]) => Array.from({ length: Math.max(5, tirs.length) }, (_, i) => <span key={i} className={`h-3 w-3 rounded-full ${i >= tirs.length ? 'bg-white/15' : tirs[i] ? 'bg-jeu-lagune' : 'bg-[#E2653C]'}`} />);
  return <section role="dialog" aria-label="Tirs au but" className={CLASSE_PANNEAU}>
    <p className="hud-legende text-jeu-or">Match nul : tirs au but</p>
    <h2 className="hud-titre mt-0.5 text-xl leading-tight">{issue ? (issue === 'nous' ? 'Victoire !' : 'Défaite, de peu') : aNousDeTirer ? 'À toi de tirer' : 'Tu gardes la cage'}</h2>
    <div className="mt-3 space-y-1.5 rounded-xl bg-black/20 p-3 text-[12.5px] font-semibold">
      <div className="flex items-center justify-between gap-2"><span>Ton équipe</span><span className="flex gap-1">{ronds(nous)}</span></div>
      <div className="flex items-center justify-between gap-2"><span>L’équipe du dépôt</span><span className="flex gap-1">{ronds(eux)}</span></div>
    </div>
    {dernier && <p role="status" className="mt-2 text-[12.5px] text-jeu-ivoire/85">{dernier}</p>}
    {issue ? <button onClick={() => onFin(issue === 'nous')} className="hud-bouton hud-bouton-or mt-3 w-full p-3 text-sm">{issue === 'nous' ? 'Fêter la victoire' : 'Serrer la main des vainqueurs'}</button>
      : <div className="mt-3 grid grid-cols-3 gap-1.5">{COINS.map(coin => <button key={coin} onClick={() => jouer(coin)} className="hud-bouton hud-bouton-principal px-2 py-3 text-[12.5px]">{aNousDeTirer ? `Tirer ${coin === 'centre' ? 'au centre' : `à ${coin}`}` : `Plonger ${coin === 'centre' ? 'au centre' : `à ${coin}`}`}</button>)}</div>}
  </section>;
}

interface ItemDressing { id: string; nom: string; description: string | null; categorie: string; rarete: string; metierRequis: string | null; niveauRequis: number; possede: boolean; equipe: boolean; eligible: boolean }
const NOMS_CATEGORIES: Record<string, string> = { CASQUE: 'Casques', TENUE: 'Tenues', LUNETTES: 'Lunettes', OUTIL: 'Outils', ECUSSON: 'Écussons', CADRE: 'Cadres' };

/** La cabine d'essayage : ta vraie garde-robe ; ce que tu possèdes se porte, le reste se débloque en progressant. */
export function PanneauCabine({ demo, onFermer }: { demo: boolean; onFermer: () => void }) {
  const client = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['avatar', 'dressing'], queryFn: () => api.get<ItemDressing[]>('/carriere/avatar/dressing'), enabled: !demo });
  const equiper = useMutation({
    mutationFn: (itemId: string) => api.post('/carriere/avatar/equiper', { itemId }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['avatar', 'dressing'] }); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); },
  });
  const categories = [...new Set((data ?? []).map(i => i.categorie))];
  return <section role="dialog" aria-label="Cabine d’essayage" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Boutique Lagune · tenues et EPI" titre="Cabine d’essayage" onFermer={onFermer} />
    {demo ? <p className="mt-3 text-sm leading-relaxed text-jeu-ivoire/75">Ta garde-robe se remplit à chaque niveau et selon ton métier : casques, tenues, lunettes, outils. Connecte-toi pour essayer les tiennes.</p>
      : isLoading ? <p className="mt-3 text-sm text-jeu-ivoire/70">Tu entres dans la cabine…</p>
      : !data?.length ? <p className="mt-3 text-sm text-jeu-ivoire/75">Rien en rayon pour l’instant.</p>
      : categories.map(cat => <div key={cat} className="mt-3">
        <p className="hud-legende mb-1.5">{NOMS_CATEGORIES[cat] ?? cat}</p>
        <ul className="space-y-1.5">{data.filter(i => i.categorie === cat).map(i => <li key={i.id} className="flex items-center gap-3 rounded-xl bg-white/[.04] p-2.5">
          <div className="min-w-0 flex-1"><p className="text-[13px] font-bold">{i.nom}</p><p className="text-[11px] text-jeu-ivoire/55">{i.rarete.toLowerCase()}{i.description ? ` · ${i.description}` : ''}</p></div>
          {i.equipe ? <span className="shrink-0 rounded-full bg-jeu-lagune/20 px-2 py-1 text-[11px] font-bold text-jeu-lagune">Porté</span>
            : i.possede ? <button disabled={equiper.isPending} onClick={() => equiper.mutate(i.id)} className="hud-bouton hud-bouton-principal shrink-0 px-3 py-1.5 text-[12px]">Porter</button>
            : <span className="shrink-0 text-[11px] font-semibold text-jeu-ivoire/50">{i.metierRequis && !i.eligible ? 'Autre métier' : `Niveau ${i.niveauRequis}`}</span>}
        </li>)}</ul>
      </div>)}
    <Link href={demo ? '/connexion' : '/app/dressing'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter' : 'Ouvrir le dressing →'}</Link>
  </section>;
}

interface UserBadge { id: string; obtenuLe: string; badge: { nom: string; description: string | null; rarete: string } }
interface UserCertificat { id: string; numeroUnique: string; delivreLe: string; certificat: { nom: string } }

/** La vitrine des réussites : tes vrais badges et certificats, exposés dans la galerie. */
export function PanneauVitrine({ demo, niveau, onFermer }: { demo: boolean; niveau: number; onFermer: () => void }) {
  const { data: badges } = useQuery({ queryKey: ['badges', 'mine'], queryFn: () => api.get<UserBadge[]>('/users/me/badges'), enabled: !demo });
  const { data: certificats } = useQuery({ queryKey: ['certificats', 'mine'], queryFn: () => api.get<UserCertificat[]>('/users/me/certificats'), enabled: !demo });
  const date = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return <section role="dialog" aria-label="Vitrine des réussites" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Galerie des Palmiers" titre="Vitrine des réussites" onFermer={onFermer} />
    <p className="mt-2 text-[12px] text-jeu-ivoire/70">Niveau {niveau}{demo ? ' · démonstration' : ''}. Chaque badge et chaque certificat obtenus sont exposés ici.</p>
    {demo ? <p className="mt-3 text-sm leading-relaxed text-jeu-ivoire/75">Missions réussies, chantiers livrés, formations validées : connecte-toi pour remplir ta vitrine.</p> : <>
      <p className="hud-legende mt-3 mb-1.5">Badges · {badges?.length ?? 0}</p>
      {!badges?.length ? <p className="text-[12.5px] text-jeu-ivoire/65">Pas encore de badge : réussis une mission pour inaugurer la vitrine.</p>
        : <ul className="space-y-1.5">{badges.map(b => <li key={b.id} className="rounded-xl bg-white/[.04] p-2.5"><p className="text-[13px] font-bold">🏅 {b.badge.nom}</p><p className="text-[11px] text-jeu-ivoire/55">{b.badge.rarete.toLowerCase()} · {date(b.obtenuLe)}</p></li>)}</ul>}
      <p className="hud-legende mt-3 mb-1.5">Certificats · {certificats?.length ?? 0}</p>
      {!certificats?.length ? <p className="text-[12.5px] text-jeu-ivoire/65">Pas encore de certificat.</p>
        : <ul className="space-y-1.5">{certificats.map(c => <li key={c.id} className="rounded-xl bg-white/[.04] p-2.5"><p className="text-[13px] font-bold">📜 {c.certificat.nom}</p><p className="text-[11px] text-jeu-ivoire/55">n° {c.numeroUnique} · {date(c.delivreLe)}</p></li>)}</ul>}
    </>}
    <Link href={demo ? '/connexion' : '/app/recompenses'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter' : 'Toutes mes récompenses →'}</Link>
  </section>;
}
