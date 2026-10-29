'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { francs, LOGEMENTS, OUTILS, POSTES_ENTREPRISE, previsionJournee, REGLES_ENTREPRISE, type NiveauLogement, type PosteEntreprise } from '@/lib/patrimoine';

interface VuePatrimoine {
  argent: number; preleve: number; impaye: number;
  logement: { niveau: NiveauLogement; nom: string; loyerSemaine: number; payeJusquau: string; arrieres: number };
  outils: { slug: string; possede: boolean }[];
}
interface Employe { poste: PosteEntreprise; nom: string }
interface VueEntreprise {
  eligible: boolean;
  entreprise: { nom: string; capital: number; reputation: number; equipe: Employe[]; prevision: { chiffre: number; charges: number; resultat: number }; journal: { jour: string; resultat: number }[] } | null;
}

const Carte = ({ children, accent = false }: { children: ReactNode; accent?: boolean }) => <div className={`rounded-xl p-2.5 ${accent ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'bg-white/[.06]'}`}>{children}</div>;
const Bouton = ({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) =>
  <button type="button" disabled={disabled} onClick={onClick} className="rounded-lg bg-jeu-or/20 px-2.5 py-1 text-[11px] font-bold text-jeu-or enabled:hover:bg-jeu-or/30 disabled:opacity-40">{children}</button>;

/** L'application « Patrimoine » du téléphone : le logement (et son loyer), les travaux chez soi, l'outillage, et l'entreprise du joueur. */
export function EcranPatrimoine({ demo, argent, depenserDemo, travaux, onLogementDemo }: {
  demo: boolean; argent: number;
  /** Dépense de démonstration (négative : un crédit) : vrai si le solde affiché suffisait et a été débité, faux sinon. */
  depenserDemo: (montant: number) => boolean;
  /** L'écran des travaux chez soi, fourni par la ville (il partage son chantier avec le panneau « Chez toi »). */
  travaux?: ReactNode;
  /** Démonstration : le logement choisi, pour que les travaux proposés suivent. */
  onLogementDemo?: (niveau: NiveauLogement) => void;
}) {
  const [onglet, setOnglet] = useState<'logement' | 'travaux' | 'outils' | 'entreprise'>('logement');
  const [message, setMessage] = useState<string | null>(null);
  const client = useQueryClient();
  const { data: patrimoine } = useQuery({ queryKey: ['monde', 'patrimoine'], queryFn: () => api.get<VuePatrimoine>('/monde/patrimoine'), enabled: !demo });
  const { data: entreprise } = useQuery({ queryKey: ['monde', 'entreprise'], queryFn: () => api.get<VueEntreprise>('/monde/entreprise'), enabled: !demo });
  const action = useMutation({
    mutationFn: ({ chemin, corps }: { chemin: string; corps?: unknown }) => api.post(chemin, corps),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['monde'] }); client.invalidateQueries({ queryKey: ['carriere', 'me'] }); setMessage('C’est fait.'); },
    onError: (e: Error) => setMessage(e.message || 'Opération refusée.'),
  });

  // Démonstration : le même catalogue, dans le navigateur, payé sur le solde affiché.
  const [logementDemo, setLogementDemo] = useState<NiveauLogement>('studio');
  const [outilsDemo, setOutilsDemo] = useState<string[]>([]);
  const [entrepriseDemo, setEntrepriseDemo] = useState<{ nom: string; capital: number; equipe: PosteEntreprise[] } | null>(null);
  const demoAchat = (montant: number, effet: () => void) => { if (depenserDemo(montant)) { effet(); setMessage('C’est fait (démonstration).'); } else setMessage(`Pas assez d’argent : ${francs(montant)}.`); };

  const niveauLogement = demo ? logementDemo : patrimoine?.logement.niveau ?? 'studio';
  const possede = (slug: string) => demo ? outilsDemo.includes(slug) : patrimoine?.outils.find(o => o.slug === slug)?.possede ?? false;
  const ent = demo ? (entrepriseDemo ? { nom: entrepriseDemo.nom, capital: entrepriseDemo.capital, reputation: 50, equipe: entrepriseDemo.equipe.map((poste, i) => ({ poste, nom: `Recrue ${i + 1}` })), prevision: previsionJournee(50, entrepriseDemo.equipe), journal: [] } : null) : entreprise?.entreprise ?? null;
  // En démonstration, la création est ouverte à tous pour découvrir le système ; connecté, le serveur vérifie le niveau.
  const eligible = demo ? true : entreprise?.eligible ?? false;
  const [nomEntreprise, setNomEntreprise] = useState('');

  return <div className="p-3">
    <div className={`mb-3 grid ${travaux ? 'grid-cols-4' : 'grid-cols-3'} gap-1 rounded-xl bg-black/25 p-1 text-[11px] font-bold`}>
      {([['logement', '🏠 Logement'], ...(travaux ? [['travaux', '🛠️ Travaux'] as const] : []), ['outils', '🧰 Outils'], ['entreprise', '🏢 Entreprise']] as const).map(([id, nom]) =>
        <button key={id} type="button" onClick={() => { setOnglet(id); setMessage(null); }} className={`rounded-lg py-1.5 ${onglet === id ? 'bg-jeu-or/25 text-jeu-or' : 'text-jeu-ivoire/70'}`}>{nom}</button>)}
    </div>

    {onglet === 'logement' && <div className="space-y-2">
      {!demo && patrimoine && <Carte accent>
        <p className="text-[12.5px] font-bold">{patrimoine.logement.nom}</p>
        <p className="text-[11px] text-jeu-ivoire/70">Loyer : {francs(patrimoine.logement.loyerSemaine)} par semaine · payé jusqu’au {new Date(patrimoine.logement.payeJusquau).toLocaleDateString('fr-FR')}</p>
        {patrimoine.preleve > 0 && <p className="mt-1 text-[11px] text-jeu-lagune">Loyer prélevé : {francs(patrimoine.preleve)}.</p>}
        {patrimoine.logement.arrieres > 0 && <div className="mt-1.5 flex items-center justify-between gap-2"><p className="text-[11px] font-bold text-[#F08A4B]">Arriérés : {francs(patrimoine.logement.arrieres)} (un nouveau loyer impayé pèserait sur le moral)</p><Bouton disabled={action.isPending} onClick={() => action.mutate({ chemin: '/monde/patrimoine/arrieres' })}>Régler</Bouton></div>}
      </Carte>}
      {/* La chambre en cité universitaire ne se loue pas : elle n’apparaît que pour l’étudiant qui y habite. */}
      {LOGEMENTS.filter(l => !l.etudiants || l.niveau === niveauLogement).map(l => <Carte key={l.niveau} accent={demo && l.niveau === niveauLogement}>
        <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{l.nom}</b><span className="hud-chiffre shrink-0 text-[11px] text-jeu-or">{francs(l.loyerSemaine)}/sem.</span></div>
        <p className="mt-0.5 text-[11px] leading-snug text-jeu-ivoire/65">{l.description}</p>
        <div className="mt-1.5 text-right">{l.niveau === niveauLogement ? <span className="text-[11px] font-bold text-jeu-lagune">✓ Ton logement</span>
          : <Bouton disabled={action.isPending} onClick={() => demo ? demoAchat(2 * l.loyerSemaine, () => { setLogementDemo(l.niveau); onLogementDemo?.(l.niveau); }) : action.mutate({ chemin: '/monde/patrimoine/logement', corps: { niveau: l.niveau } })}>Emménager · {francs(2 * l.loyerSemaine)}</Bouton>}</div>
      </Carte>)}
      <p className="text-[10.5px] leading-snug text-jeu-ivoire/55">Déménager coûte des frais d’agence (une semaine) et la première semaine. Le loyer est ensuite prélevé chaque semaine ; sans solde suffisant, il s’ajoute aux arriérés.</p>
    </div>}

    {onglet === 'travaux' && travaux}

    {onglet === 'outils' && <ul className="space-y-2">{OUTILS.map(o => <li key={o.slug}><Carte>
      <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{o.nom}</b><span className="hud-chiffre shrink-0 text-[11px] text-jeu-or">{francs(o.prix)}</span></div>
      <p className="mt-0.5 text-[11px] leading-snug text-jeu-ivoire/65">{o.description}</p>
      <div className="mt-1.5 text-right">{possede(o.slug) ? <span className="text-[11px] font-bold text-jeu-lagune">✓ Acheté</span>
        : <Bouton disabled={action.isPending || argent < o.prix} onClick={() => demo ? demoAchat(o.prix, () => setOutilsDemo(x => [...x, o.slug])) : action.mutate({ chemin: '/monde/patrimoine/outils', corps: { outil: o.slug } })}>{argent < o.prix ? 'Trop cher' : 'Acheter'}</Bouton>}</div>
    </Carte></li>)}</ul>}

    {onglet === 'entreprise' && (ent ? <div className="space-y-2">
      <Carte accent>
        <p className="text-[13px] font-bold">{ent.nom}</p>
        <p className="text-[11px] text-jeu-ivoire/70">Capital : <b className="text-jeu-or">{francs(ent.capital)}</b> · réputation {ent.reputation}/100</p>
        <p className="mt-1 text-[11px] text-jeu-ivoire/70">Journée prévue : {francs(ent.prevision.chiffre)} de chiffre, {francs(ent.prevision.charges)} de charges → <b className={ent.prevision.resultat >= 0 ? 'text-jeu-lagune' : 'text-[#F08A4B]'}>{ent.prevision.resultat >= 0 ? '+' : ''}{francs(ent.prevision.resultat)}</b></p>
      </Carte>
      <div className="grid grid-cols-2 gap-2">
        <Bouton disabled={action.isPending || argent < 50_000} onClick={() => demo ? demoAchat(50_000, () => setEntrepriseDemo(e => e && { ...e, capital: e.capital + 50_000 })) : action.mutate({ chemin: '/monde/entreprise/mouvement', corps: { montant: 50_000 } })}>Apporter 50 000 F</Bouton>
        <Bouton disabled={action.isPending || ent.capital < 50_000} onClick={() => { if (!demo) { action.mutate({ chemin: '/monde/entreprise/mouvement', corps: { montant: -50_000 } }); return; } depenserDemo(-50_000); setEntrepriseDemo(e => e && { ...e, capital: e.capital - 50_000 }); }}>Dividende 50 000 F</Bouton>
      </div>
      <p className="hud-legende text-jeu-or">Équipe ({ent.equipe.length}/{REGLES_ENTREPRISE.equipeMax})</p>
      {ent.equipe.length ? <ul className="space-y-1">{ent.equipe.map((e, i) => <li key={`${e.nom}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-white/[.05] px-2.5 py-1.5 text-[11.5px]">
        <span><b>{e.nom}</b> · {POSTES_ENTREPRISE[e.poste].nom}</span>
        <button type="button" disabled={action.isPending} onClick={() => demo ? setEntrepriseDemo(x => x && { ...x, equipe: x.equipe.filter((_, k) => k !== i) }) : action.mutate({ chemin: '/monde/entreprise/licencier', corps: { rang: i } })} className="text-[10.5px] font-bold text-jeu-ivoire/55 hover:text-[#F08A4B]">Licencier</button>
      </li>)}</ul> : <p className="text-[11px] text-jeu-ivoire/60">Personne pour l’instant : les frais fixes courent sans chiffre d’affaires.</p>}
      <p className="hud-legende text-jeu-or">Embaucher</p>
      <ul className="space-y-1">{(Object.keys(POSTES_ENTREPRISE) as PosteEntreprise[]).map(p => <li key={p} className="flex items-center justify-between gap-2 rounded-lg bg-white/[.05] px-2.5 py-1.5 text-[11.5px]">
        <span><b>{POSTES_ENTREPRISE[p].nom}</b> · {francs(POSTES_ENTREPRISE[p].salaireMensuel)}/mois</span>
        <Bouton disabled={action.isPending || ent.capital < POSTES_ENTREPRISE[p].salaireMensuel || ent.equipe.length >= REGLES_ENTREPRISE.equipeMax} onClick={() => demo ? setEntrepriseDemo(x => x && { ...x, equipe: [...x.equipe, p] }) : action.mutate({ chemin: '/monde/entreprise/embaucher', corps: { poste: p } })}>Embaucher</Bouton>
      </li>)}</ul>
      {demo && <p className="text-[10.5px] text-jeu-ivoire/55">Démonstration : en partie connectée, les journées de l’entreprise se comptent chaque jour (chiffre, salaires, réputation).</p>}
    </div> : <div className="space-y-2">
      <Carte><p className="text-[12px] leading-snug">Crée ton entreprise de travaux : un capital de départ (au moins {francs(REGLES_ENTREPRISE.apportMin)}), puis une équipe salariée. Chaque jour, elle facture selon sa capacité et sa réputation, et paie salaires et frais.</p></Carte>
      {eligible ? <>
        <label className="block text-[11px] font-bold">Nom de l’entreprise<input value={nomEntreprise} onChange={e => setNomEntreprise(e.target.value)} maxLength={60} className="mt-1 w-full rounded-lg border border-white/15 bg-white/[.06] p-2 text-[12px]" placeholder="Bâti-Lagune" /></label>
        <Bouton disabled={action.isPending || !nomEntreprise.trim() || argent < REGLES_ENTREPRISE.apportMin} onClick={() => demo ? demoAchat(REGLES_ENTREPRISE.apportMin, () => setEntrepriseDemo({ nom: nomEntreprise.trim(), capital: REGLES_ENTREPRISE.apportMin, equipe: [] })) : action.mutate({ chemin: '/monde/entreprise', corps: { nom: nomEntreprise.trim(), apport: REGLES_ENTREPRISE.apportMin } })}>Créer avec {francs(REGLES_ENTREPRISE.apportMin)}</Bouton>
      </> : <p className="text-[11px] text-jeu-ivoire/65">Il faut le niveau {REGLES_ENTREPRISE.niveauMin}, ou la filière entrepreneur, pour te lancer.</p>}
    </div>)}

    {message && <p role="status" className="mt-2 text-center text-[11.5px] text-jeu-ivoire/75">{message}</p>}
  </div>;
}
