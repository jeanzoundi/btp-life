'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { TAUX_EPARGNE_JOUR } from '@/lib/lieux-programme/banque';

// Services des lieux, branchés sur les vrais systèmes du jeu : épargne, offres d'emploi, compétences, chantiers, marchés.
// Connecté, tout passe par le serveur ; en démonstration, l'épargne se joue sur le solde affiché, le reste invite à se connecter.

const CLASSE_PANNEAU = 'hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[80%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[410px]';
const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} F`;

function EnTete({ surtitre, titre, onFermer }: { surtitre: string; titre: string; onFermer: () => void }) {
  return <div className="flex items-start justify-between gap-3">
    <div><p className="hud-legende text-jeu-or">{surtitre}</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{titre}</h2></div>
    <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
  </div>;
}

/** Ce que la démonstration fournit à l'épargne : le solde affiché, une épargne locale, et l'opération elle-même. */
export interface EpargneDemo { solde: number; epargne: number; operer: (sens: 'deposer' | 'retirer', montant: number) => string | null }

/** Le guichet d'épargne : déposer ou retirer pour de bon (POST /carriere/epargne/deposer et /retirer). */
export function PanneauEpargne({ demo, epargneDemo, onFermer }: { demo: boolean; epargneDemo: EpargneDemo; onFermer: () => void }) {
  const client = useQueryClient();
  const { data: carriere } = useQuery({ queryKey: ['carriere', 'me'], queryFn: () => api.get<{ argentVirtuel: number; epargne: number }>('/carriere/me'), enabled: !demo });
  const [montant, setMontant] = useState('');
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const operation = useMutation({
    mutationFn: ({ sens, valeur }: { sens: 'deposer' | 'retirer'; valeur: number }) => api.post<{ argentVirtuel: number; epargne: number }>(`/carriere/epargne/${sens}`, { montant: valeur }),
    onSuccess: (maj, { sens, valeur }) => {
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ({ ...ancienne, ...maj }));
      setMessage({ texte: `${sens === 'deposer' ? 'Dépôt' : 'Retrait'} de ${fcfa(valeur)} enregistré.`, erreur: false }); setMontant('');
    },
    onError: (e: Error) => setMessage({ texte: e.message || 'Opération impossible.', erreur: true }),
  });
  const solde = demo ? epargneDemo.solde : carriere?.argentVirtuel ?? 0, epargne = demo ? epargneDemo.epargne : carriere?.epargne ?? 0;
  const valeur = Math.floor(Number(montant.replace(/[\s  ]/g, '')));
  const valide = Number.isFinite(valeur) && valeur > 0;
  const operer = (sens: 'deposer' | 'retirer') => {
    if (!valide) return;
    if (!demo) { operation.mutate({ sens, valeur }); return; }
    const erreur = epargneDemo.operer(sens, valeur);
    setMessage(erreur ? { texte: erreur, erreur: true } : { texte: `${sens === 'deposer' ? 'Dépôt' : 'Retrait'} de ${fcfa(valeur)} (démonstration).`, erreur: false });
    if (!erreur) setMontant('');
  };
  const dans = (jours: number) => epargne * Math.pow(1 + TAUX_EPARGNE_JOUR, jours);
  return <section role="dialog" aria-label="Guichet épargne" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Banque BTL" titre="Guichet épargne" onFermer={onFermer} />
    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
      <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-or">{fcfa(solde)}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">sur ton compte</span></div>
      <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-lagune">{fcfa(epargne)}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">en épargne</span></div>
    </div>
    <p className="mt-2 text-[11.5px] leading-snug text-jeu-ivoire/70">L’épargne rapporte {(TAUX_EPARGNE_JOUR * 100).toLocaleString('fr-FR')} % par jour plein, intérêts composés.{epargne > 0 ? ` Sans y toucher : ${fcfa(dans(7))} dans 7 jours, ${fcfa(dans(30))} dans 30 jours.` : ''}</p>
    <label className="mt-3 block text-[12px] font-semibold text-jeu-ivoire/80">Montant
      <input inputMode="numeric" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex. 25 000" className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-jeu-ivoire outline-none focus:border-jeu-or/60" />
    </label>
    <div className="mt-2 flex flex-wrap gap-1.5">{[5000, 25_000, 100_000].map(v => <button key={v} onClick={() => setMontant(String(v))} className="hud-bouton hud-bouton-verre px-2.5 py-1 text-[11.5px]">{fcfa(v)}</button>)}</div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button disabled={!valide || operation.isPending} onClick={() => operer('deposer')} className="hud-bouton hud-bouton-principal p-3 text-sm">Déposer</button>
      <button disabled={!valide || operation.isPending} onClick={() => operer('retirer')} className="hud-bouton hud-bouton-verre p-3 text-sm">Retirer</button>
    </div>
    {message && <p role={message.erreur ? 'alert' : 'status'} className={`mt-2 text-[12.5px] font-semibold ${message.erreur ? 'text-[#F08A4B]' : 'text-jeu-lagune'}`}>{message.texte}</p>}
    <p className="mt-2 text-center text-[10.5px] text-jeu-ivoire/50">{demo ? 'Démonstration : rien n’est sauvegardé.' : 'Opérations enregistrées sur ton compte.'}</p>
  </section>;
}

interface OffreEmploi { id: string; titre: string; description: string | null; niveauMin: number; reputationMin: number; chantiersRequis: number; entrepriseFictive: string | null }
interface Candidature { id: string; statut: string; feedback: { manquants?: string[]; planAction?: string | null } | null; createdAt: string; offre: { titre: string } }

/** Le mur des offres : les vraies offres du jeu, et la candidature pour de bon (POST /offres/:id/candidater). */
export function PanneauOffres({ demo, niveau, onFermer }: { demo: boolean; niveau: number; onFermer: () => void }) {
  const client = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['catalog', 'offres'], queryFn: () => api.get<{ items: OffreEmploi[] }>('/catalog/offres-emploi?pageSize=50'), staleTime: 300_000 });
  const { data: candidatures } = useQuery({ queryKey: ['candidatures', 'mine'], queryFn: () => api.get<Candidature[]>('/offres/candidatures/mine'), enabled: !demo });
  const [reponse, setReponse] = useState<{ offre: string; candidature?: Candidature; erreur?: string } | null>(null);
  const candidater = useMutation({
    mutationFn: (offre: OffreEmploi) => api.post<Candidature>(`/offres/${offre.id}/candidater`),
    onSuccess: (candidature, offre) => {
      setReponse({ offre: offre.titre, candidature });
      client.invalidateQueries({ queryKey: ['candidatures', 'mine'] });
      if (candidature.statut === 'ACCEPTEE') client.invalidateQueries({ queryKey: ['carriere', 'me'] });
    },
    onError: (e: Error, offre) => setReponse({ offre: offre.titre, erreur: e.message || 'Candidature impossible.' }),
  });
  const derniere = (titre: string) => (candidatures ?? []).filter(c => c.offre?.titre === titre).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const offres = [...(data?.items ?? [])].sort((a, b) => Number(b.niveauMin <= niveau) - Number(a.niveauMin <= niveau) || a.niveauMin - b.niveauMin);
  return <section role="dialog" aria-label="Mur des offres" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Agence des talents" titre="Le mur des offres" onFermer={onFermer} />
    <p className="mt-2 text-[12px] leading-relaxed text-jeu-ivoire/70">Une candidature est examinée tout de suite : niveau, réputation, chantiers réalisés et compétences. Acceptée, elle te donne le poste.</p>
    {reponse && <div role={reponse.erreur || reponse.candidature?.statut !== 'ACCEPTEE' ? 'alert' : 'status'} className={`mt-3 rounded-xl border p-3 text-[12.5px] leading-relaxed ${reponse.candidature?.statut === 'ACCEPTEE' ? 'border-jeu-lagune/50 bg-jeu-lagune/10' : 'border-jeu-terre/50 bg-jeu-terre/10'}`}>
      <p className="font-bold">{reponse.erreur ? `Candidature impossible : ${reponse.offre}` : reponse.candidature?.statut === 'ACCEPTEE' ? `Embauché(e) : ${reponse.offre} !` : `Pas encore : ${reponse.offre}`}</p>
      {reponse.erreur && <p className="mt-1 text-jeu-ivoire/80">{reponse.erreur}</p>}
      {!!reponse.candidature?.feedback?.manquants?.length && <ul className="mt-1 list-disc pl-4 text-jeu-ivoire/80">{reponse.candidature.feedback.manquants.map(m => <li key={m}>{m}</li>)}</ul>}
      {reponse.candidature?.feedback?.planAction && <p className="mt-1 text-jeu-ivoire/70">{reponse.candidature.feedback.planAction} Les séances des lieux font progresser tes compétences.</p>}
    </div>}
    {isLoading ? <p className="mt-3 text-sm text-jeu-ivoire/70">Les offres se chargent…</p>
      : isError || !offres.length ? <p className="mt-3 text-sm text-jeu-ivoire/70">Aucune offre affichée pour l’instant. Repasse plus tard.</p>
      : <ul className="mt-3 space-y-2">{offres.map(o => {
        const c = derniere(o.titre), aPortee = o.niveauMin <= niveau;
        return <li key={o.id} className="rounded-xl bg-white/[.04] p-3">
          <div className="flex items-baseline justify-between gap-2"><p className="text-[13.5px] font-bold">{o.titre}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${aPortee ? 'bg-jeu-lagune/20 text-jeu-lagune' : 'bg-white/10 text-jeu-ivoire/60'}`}>{aPortee ? 'À ta portée' : `Niveau ${o.niveauMin}`}</span></div>
          <p className="text-[11.5px] text-jeu-ivoire/60">{o.entrepriseFictive ?? 'Entreprise du quartier'}{o.reputationMin ? ` · réputation ${o.reputationMin}` : ''}{o.chantiersRequis ? ` · ${o.chantiersRequis} chantier(s) réalisé(s)` : ''}</p>
          {c && <p className={`mt-1 text-[11.5px] font-semibold ${c.statut === 'ACCEPTEE' ? 'text-jeu-lagune' : 'text-jeu-or'}`}>Dernière candidature : {c.statut === 'ACCEPTEE' ? 'acceptée' : 'refusée'}</p>}
          {demo ? <Link href="/connexion" className="hud-bouton hud-bouton-verre mt-2 flex w-full justify-center px-3 py-2 text-[12.5px]">Se connecter pour candidater</Link>
            : <button disabled={candidater.isPending} onClick={() => candidater.mutate(o)} className="hud-bouton hud-bouton-principal mt-2 w-full px-3 py-2 text-[12.5px]">{candidater.isPending && candidater.variables?.id === o.id ? 'Examen de ta candidature…' : 'Candidater'}</button>}
        </li>;
      })}</ul>}
  </section>;
}

interface Competence { id: string; nom: string; domaine: string }
interface UserCompetence { id: string; niveauActuel: number; xp: number; competence: { nom: string; domaine: string } }
/** Paliers des compétences : cinq niveaux de 150 XP (prisma/seed.ts). */
const PALIER_COMPETENCE = 150;

/** Le tableau des compétences : les vraies compétences du jeu et ton niveau dans chacune (GET /users/me/competences). */
export function PanneauCompetences({ demo, onFermer }: { demo: boolean; onFermer: () => void }) {
  const { data: catalogue } = useQuery({ queryKey: ['catalog', 'competences'], queryFn: () => api.get<{ items: Competence[] }>('/catalog/competences?pageSize=100'), staleTime: 300_000 });
  const { data: miennes } = useQuery({ queryKey: ['users', 'me', 'competences'], queryFn: () => api.get<UserCompetence[]>('/users/me/competences'), enabled: !demo });
  const parNom = new Map((miennes ?? []).map(c => [c.competence.nom, c]));
  const liste = [...(catalogue?.items ?? [])].sort((a, b) => (parNom.get(b.nom)?.xp ?? 0) - (parNom.get(a.nom)?.xp ?? 0) || a.nom.localeCompare(b.nom));
  return <section role="dialog" aria-label="Tableau des compétences" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Maison des ingénieurs" titre="Tableau des compétences" onFermer={onFermer} />
    <p className="mt-2 text-[12px] leading-relaxed text-jeu-ivoire/70">Chaque séance payée d’un lieu fait progresser la compétence de son étape. Les offres d’emploi en demandent certaines, à un niveau précis.</p>
    {!liste.length ? <p className="mt-3 text-sm text-jeu-ivoire/70">Les compétences se chargent…</p> : <ul className="mt-3 space-y-1.5">{liste.map(c => {
      const mienne = parNom.get(c.nom), xp = mienne?.xp ?? 0, niveau = mienne?.niveauActuel ?? 0, dansPalier = niveau >= 5 ? PALIER_COMPETENCE : xp - niveau * PALIER_COMPETENCE;
      return <li key={c.id} className="rounded-xl bg-white/[.04] p-2.5">
        <div className="flex items-baseline justify-between gap-2"><p className="text-[13px] font-bold">{c.nom}</p><span className="hud-chiffre text-[11.5px] text-jeu-or">{demo ? '—' : `niveau ${niveau}/5`}</span></div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`${xp} XP`}><div className="h-full rounded-full bg-jeu-lagune" style={{ width: `${demo ? 0 : Math.max(0, Math.min(100, dansPalier / PALIER_COMPETENCE * 100))}%` }} /></div>
      </li>;
    })}</ul>}
    <Link href={demo ? '/connexion' : '/app/competences'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter pour suivre ses compétences' : 'Toutes mes compétences →'}</Link>
  </section>;
}

interface Logiciel { id: string; slug: string; nom: string; categorie: string | null }
interface UserLogiciel { logiciel: { slug: string }; niveauMaitrise: number }

/** Le rayon des logiciels : les logiciels du jeu, et ta maîtrise de chacun (GET /users/me/logiciels). */
export function PanneauLogiciels({ demo, onFermer }: { demo: boolean; onFermer: () => void }) {
  const { data: catalogue } = useQuery({ queryKey: ['catalog', 'logiciels'], queryFn: () => api.get<{ items: Logiciel[] }>('/catalog/logiciels?pageSize=50'), staleTime: 300_000 });
  const { data: miens } = useQuery({ queryKey: ['users', 'me', 'logiciels'], queryFn: () => api.get<UserLogiciel[]>('/users/me/logiciels'), enabled: !demo });
  const maitrise = new Map((miens ?? []).map(l => [l.logiciel.slug, l.niveauMaitrise]));
  return <section role="dialog" aria-label="Rayon des logiciels" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Atelier de formation" titre="Le rayon des logiciels" onFermer={onFermer} />
    {!catalogue?.items?.length ? <p className="mt-3 text-sm text-jeu-ivoire/70">Le rayon se remplit…</p> : <ul className="mt-3 space-y-1.5">{catalogue.items.map(l => <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[.04] p-2.5">
      <div className="min-w-0"><p className="truncate text-[13px] font-bold">{l.nom}</p><p className="text-[11.5px] text-jeu-ivoire/60">{l.categorie ?? 'Logiciel du chantier'}</p></div>
      <span className="hud-chiffre shrink-0 text-[11.5px] text-jeu-or">{demo ? '—' : `maîtrise ${maitrise.get(l.slug) ?? 0}`}</span>
    </li>)}</ul>}
    <Link href={demo ? '/connexion' : '/app/logiciels'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter pour s’exercer' : 'S’exercer sur les logiciels →'}</Link>
  </section>;
}

interface UserChantier { id: string; statut: string; avancementPct: number; budgetRestant: number; joursRestants: number; stock: Record<string, number> | null; chantier: { nom: string } }

/** Le suivi des chantiers : tes vrais chantiers, leur avancement et leur stock (GET /chantiers/mine). */
export function PanneauChantiers({ demo, onFermer }: { demo: boolean; onFermer: () => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['chantiers', 'mine'], queryFn: () => api.get<UserChantier[]>('/chantiers/mine'), enabled: !demo, staleTime: 60_000 });
  return <section role="dialog" aria-label="Suivi des chantiers" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Plateforme logistique" titre="Suivi des chantiers" onFermer={onFermer} />
    {demo ? <p className="mt-3 text-sm leading-relaxed text-jeu-ivoire/75">Le dispatch suit les chantiers de ton entreprise. Connecte-toi et démarre un chantier pour le voir ici.</p>
      : isLoading ? <p className="mt-3 text-sm text-jeu-ivoire/70">Le dispatch consulte les chantiers…</p>
      : !data?.length ? <p className="mt-3 text-sm text-jeu-ivoire/75">Aucun chantier en cours pour l’instant.</p>
      : <ul className="mt-3 space-y-2">{data.map(c => <li key={c.id} className="rounded-xl bg-white/[.04] p-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-[13.5px] font-bold">{c.chantier.nom}</p><span className="hud-chiffre text-[12px] text-jeu-or">{Math.round(c.avancementPct)} %</span></div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-jeu-lagune" style={{ width: `${Math.max(0, Math.min(100, c.avancementPct))}%` }} /></div>
        <p className="mt-1.5 text-[11.5px] text-jeu-ivoire/65">{c.statut === 'en_cours' ? `${c.joursRestants} jours restants · budget ${fcfa(c.budgetRestant)}` : c.statut === 'termine' ? 'Chantier livré' : c.statut}</p>
        {c.stock && Object.keys(c.stock).length > 0 && <p className="mt-1 text-[11.5px] text-jeu-ivoire/60">Stock : {Object.entries(c.stock).map(([m, q]) => `${m} ${q}`).join(' · ')}</p>}
      </li>)}</ul>}
    <Link href={demo ? '/connexion' : '/app/chantiers'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter' : 'Gérer mes chantiers →'}</Link>
  </section>;
}

interface Marche { id: string; nom: string; budget: number; devise: string; delaiJours: number; typeMarche: 'PRIVE' | 'PUBLIC'; niveauRequis: number; reputationRequise: number; verrouille: boolean; entrepreneurRequis: boolean; dejaObtenu: boolean }

/** L'écran des marchés : les vrais appels d'offres du jeu (GET /chantiers/marches), réservés aux entrepreneurs. */
export function PanneauMarches({ demo, onFermer }: { demo: boolean; onFermer: () => void }) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['chantiers', 'marches'], queryFn: () => api.get<Marche[]>('/chantiers/marches'), enabled: !demo, staleTime: 60_000 });
  return <section role="dialog" aria-label="Écran des marchés" className={CLASSE_PANNEAU}>
    <EnTete surtitre="Tour BTP Life" titre="Appels d’offres" onFermer={onFermer} />
    <p className="mt-2 text-[12px] leading-relaxed text-jeu-ivoire/70">Les marchés publics et privés s’ouvrent aux entrepreneurs, selon le niveau et la réputation. On y répond depuis l’espace entreprise.</p>
    {demo ? <p className="mt-3 text-sm text-jeu-ivoire/75">Connecte-toi pour voir les marchés ouverts à ton entreprise.</p>
      : isLoading ? <p className="mt-3 text-sm text-jeu-ivoire/70">Chargement des marchés…</p>
      : isError || !data?.length ? <p className="mt-3 text-sm text-jeu-ivoire/75">Aucun marché affiché pour l’instant.</p>
      : <ul className="mt-3 space-y-2">{data.map(m => <li key={m.id} className="rounded-xl bg-white/[.04] p-3">
        <div className="flex items-baseline justify-between gap-2"><p className="text-[13.5px] font-bold">{m.nom}</p><span className="shrink-0 text-[10.5px] font-bold text-jeu-or">{m.typeMarche === 'PUBLIC' ? 'Public' : 'Privé'}</span></div>
        <p className="text-[11.5px] text-jeu-ivoire/65">{m.budget.toLocaleString('fr-FR')} {m.devise} · {m.delaiJours} jours · niveau {m.niveauRequis} · réputation {m.reputationRequise}</p>
        <p className={`mt-1 text-[11.5px] font-semibold ${m.dejaObtenu ? 'text-jeu-lagune' : m.verrouille ? 'text-jeu-ivoire/50' : 'text-jeu-or'}`}>{m.dejaObtenu ? 'Marché obtenu' : m.verrouille ? (m.entrepreneurRequis ? 'Réservé aux entrepreneurs' : 'Conditions pas encore remplies') : 'Ouvert à ton entreprise'}</p>
      </li>)}</ul>}
    <Link href={demo ? '/connexion' : '/app/entreprise'} className="hud-bouton hud-bouton-or mt-3 flex w-full p-3 text-center text-sm">{demo ? 'Se connecter' : 'Espace entreprise →'}</Link>
  </section>;
}
