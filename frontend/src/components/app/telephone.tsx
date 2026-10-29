'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { RendezVous } from '@/lib/journee-joueur';
import { LIBELLES_MODES, minutesLisibles, trajet, trajetMotorise, type ModeTransport, type Point } from '@/lib/transports';
import { heureLisible } from './panneau-programme-lieu';
import { TEASER_CAMPAGNE } from './fin-campagne';
import { useEcranTactile } from '@/lib/ecran-tactile';

// Le téléphone du joueur, comme dans un GTA : les messages des personnages, les appels des mentors, le GPS, le taxi et le
// gbaka, la banque, les offres d'emploi, le fil rouge et l'agenda du jour. Les pages du mode classique y sont à un geste.

export type AppTelephone = 'accueil' | 'messages' | 'appels' | 'gps' | 'transport' | 'banque' | 'offres' | 'filrouge' | 'agenda' | 'defis' | 'patrimoine';
export interface DestinationTelephone { slug: string; nom: string; quartier: string; porte: Point }
export interface AppelTelephone { id: string; de: string; role: string; message: string; lieu?: string; nomLieu?: string }
export interface FilRougeTelephone { chapitre: number; total: number; titre: string; resume: string; lieu: string; nomLieu: string; interlocuteur: string }
interface Message { id: string; contenu: string; lu: boolean; createdAt: string; pnj: { nom: string; role: string } }

const MESSAGES_DEMO: Message[] = [
  { id: 'demo-toure', contenu: 'Bonjour ! J’ai une parcelle au Plateau Nord et un projet d’immeuble. Joseph Amani m’a parlé de toi : passe à la Tour BTP Life.', lu: false, createdAt: new Date().toISOString(), pnj: { nom: 'Mme Touré', role: 'CLIENT' } },
  { id: 'demo-yao', contenu: 'Le chantier ouvre à 6 h. Casque, chaussures, et on attaque la journée ensemble.', lu: true, createdAt: new Date(Date.now() - 3_600_000).toISOString(), pnj: { nom: 'Yao — Chef chantier', role: 'CHEF_CHANTIER' } },
];
const OFFRES_DEMO = [
  { id: 'o1', titre: 'Chef de chantier adjoint', entrepriseFictive: 'Bâti-Lagune', niveauMin: 6 },
  { id: 'o2', titre: 'Technicien de laboratoire', entrepriseFictive: 'Géo-Sols CI', niveauMin: 3 },
  { id: 'o3', titre: 'Métreur', entrepriseFictive: 'Cabinet Kouamé', niveauMin: 4 },
];

const APPLIS: { id: Exclude<AppTelephone, 'accueil'>; nom: string; icone: string; fond: string }[] = [
  { id: 'messages', nom: 'Messages', icone: '💬', fond: 'from-[#4CC3A5] to-[#2E8C75]' },
  { id: 'appels', nom: 'Appels', icone: '📞', fond: 'from-[#5DBB63] to-[#2F7D3A]' },
  { id: 'gps', nom: 'GPS', icone: '🧭', fond: 'from-[#5FA5D8] to-[#2F6FB3]' },
  { id: 'transport', nom: 'Taxi · Gbaka', icone: '🚕', fond: 'from-[#F2A33A] to-[#D4682B]' },
  { id: 'banque', nom: 'Banque', icone: '🏦', fond: 'from-[#D8BD75] to-[#A88A3E]' },
  { id: 'offres', nom: 'Offres', icone: '💼', fond: 'from-[#8E7CC3] to-[#5C4C9A]' },
  { id: 'filrouge', nom: 'Fil rouge', icone: '🏗️', fond: 'from-[#E2653C] to-[#A8402A]' },
  { id: 'agenda', nom: 'Agenda', icone: '📅', fond: 'from-[#6C8B99] to-[#3F5B68]' },
  { id: 'defis', nom: 'Défis', icone: '🎯', fond: 'from-[#E8B04A] to-[#B9822A]' },
  { id: 'patrimoine', nom: 'Patrimoine', icone: '🏠', fond: 'from-[#A88C66] to-[#6E5638]' },
];

function EnTeteAppli({ titre, onRetour }: { titre: string; onRetour: () => void }) {
  return <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
    <button type="button" aria-label="Retour à l’accueil du téléphone" onClick={onRetour} className="rounded-full px-2 py-1 text-[13px] font-bold text-jeu-or hover:bg-white/10">‹</button>
    <h3 className="hud-titre flex-1 text-[15px]">{titre}</h3>
  </div>;
}
const Vide = ({ children }: { children: ReactNode }) => <p className="px-4 py-6 text-center text-[12.5px] leading-relaxed text-jeu-ivoire/60">{children}</p>;

export function Telephone({ demo, heure, meteo, pluie, position, destinations, argent, epargne, niveau, appels, rendezVous, filRouge, defis, defisAReclamer = 0, patrimoine, appInitiale = 'accueil', onAller, onVoyager, onEpargneDemo, onFermer }: {
  demo: boolean; heure: string; meteo: string; pluie: boolean; position: Point;
  destinations: DestinationTelephone[]; argent: number; epargne: number;
  /** Niveau du joueur : les offres à sa portée passent en premier. */
  niveau?: number;
  appels: AppelTelephone[]; rendezVous: RendezVous[]; filRouge: FilRougeTelephone | null;
  /** Écran des défis, fourni par la ville (défis du jour et de la semaine), et le nombre de récompenses à réclamer. */
  defis?: ReactNode; defisAReclamer?: number;
  /** Écran du patrimoine (logement, outillage, entreprise), fourni par la ville. */
  patrimoine?: ReactNode;
  appInitiale?: AppTelephone;
  /** Itinéraire à pied vers un lieu (le téléphone se ferme). */
  onAller: (slug: string) => void;
  /** Commande un trajet : renvoie l'erreur à afficher, ou rien quand le trajet part. */
  onVoyager: (mode: Exclude<ModeTransport, 'pied'>, slug: string) => Promise<string | null>;
  /** Épargne de démonstration ; connecté, le téléphone passe par le serveur. */
  onEpargneDemo: (sens: 'deposer' | 'retirer', montant: number) => string | null;
  onFermer: () => void;
}) {
  const tactile = useEcranTactile();
  const [app, setApp] = useState<AppTelephone>(appInitiale);
  const client = useQueryClient();
  const { data: messagesServeur } = useQuery({ queryKey: ['messages', 'mine'], queryFn: () => api.get<Message[]>('/users/me/messages'), enabled: !demo, staleTime: 30_000 });
  const messages = demo ? MESSAGES_DEMO : messagesServeur ?? [];
  const nonLus = messages.filter(m => !m.lu).length;
  const lire = useMutation({ mutationFn: () => api.patch('/users/me/messages/lues'), onSuccess: () => client.invalidateQueries({ queryKey: ['messages', 'mine'] }) });
  const ouvrir = (id: AppTelephone) => { setApp(id); if (id === 'messages' && !demo && nonLus) lire.mutate(); };
  const badges: Partial<Record<AppTelephone, number>> = { messages: nonLus, appels: appels.length, filrouge: filRouge ? 1 : 0, defis: defisAReclamer };

  return <section role="dialog" aria-label="Téléphone" className="absolute bottom-3 right-3 z-40 w-[300px] max-w-[calc(100%-24px)]">
    <div className="overflow-hidden rounded-[28px] border-[6px] border-[#141a1d] bg-[#101618] shadow-[0_24px_60px_-20px_rgba(0,0,0,.8)] ring-1 ring-white/10">
      <div className="flex items-center justify-between bg-black/40 px-4 pb-1 pt-2 text-[11px] font-bold text-jeu-ivoire/85">
        <span className="hud-chiffre">{heure}</span>
        <span className="h-4 w-16 rounded-full bg-[#141a1d]" aria-hidden="true" />
        <span className="flex items-center gap-1.5"><span>{meteo}</span><span aria-label="Réseau">📶</span><span aria-label="Batterie">🔋</span></span>
      </div>
      <div className="h-[460px] overflow-y-auto bg-gradient-to-b from-[#173c43] via-[#13262b] to-[#101618] text-jeu-ivoire">
        {app === 'accueil' && <div className="p-4">
          <p className="hud-chiffre text-center text-[40px] font-bold leading-none">{heure}</p>
          <p className="mt-1 text-center text-[11.5px] text-jeu-ivoire/70">Les Palmiers · {meteo}{pluie ? ' · taxis majorés' : ''}</p>
          <div className="mt-5 grid grid-cols-3 gap-x-2 gap-y-4">
            {APPLIS.map(a => <button key={a.id} type="button" onClick={() => ouvrir(a.id)} aria-label={`${a.nom}${badges[a.id] ? ` (${badges[a.id]})` : ''}`} className="group relative flex flex-col items-center gap-1">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-md ring-1 ring-white/15 transition-transform group-hover:scale-105 ${a.fond}`}>{a.icone}</span>
              {Boolean(badges[a.id]) && <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E2653C] px-1 text-[9.5px] font-bold text-white">{badges[a.id]}</span>}
              <span className="text-[10.5px] font-semibold text-jeu-ivoire/85">{a.nom}</span>
            </button>)}
          </div>
          {!demo && <Link href="/app" className="mt-5 block rounded-xl bg-white/[.06] p-2.5 text-center text-[11.5px] font-semibold text-jeu-ivoire/80 hover:bg-white/10">Ouvrir le mode classique →</Link>}
        </div>}

        {app === 'messages' && <><EnTeteAppli titre="Messages" onRetour={() => setApp('accueil')} />
          {messages.length ? <ul className="divide-y divide-white/[.06]">{messages.map(m => <li key={m.id} className="px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{m.pnj.nom}</b><span className="shrink-0 text-[10px] text-jeu-ivoire/50">{new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <p className={`mt-0.5 text-[12px] leading-snug ${m.lu ? 'text-jeu-ivoire/65' : 'text-jeu-ivoire'}`}>{!m.lu && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#4CC3A5]" aria-label="non lu" />}{m.contenu}</p>
          </li>)}</ul> : <Vide>Aucun message pour l’instant. Tes mentors et tes clients t’écrivent ici.</Vide>}
          {!demo && <Link href="/app/messages" className="m-3 block text-center text-[11.5px] font-bold text-jeu-or">Tous les messages →</Link>}
        </>}

        {app === 'appels' && <><EnTeteAppli titre="Appels" onRetour={() => setApp('accueil')} />
          {appels.length ? <ul className="space-y-2 p-3">{appels.map(a => <li key={a.id} className="rounded-xl bg-white/[.06] p-3">
            <p className="text-[12.5px] font-bold">📞 {a.de}<span className="ml-1 text-[10.5px] font-semibold text-jeu-ivoire/55">{a.role}</span></p>
            <p className="mt-1 text-[12px] leading-snug text-jeu-ivoire/85">« {a.message} »</p>
            {a.lieu && <button type="button" onClick={() => onAller(a.lieu!)} className="mt-2 rounded-lg bg-jeu-or/20 px-2.5 py-1 text-[11.5px] font-bold text-jeu-or hover:bg-jeu-or/30">Y aller · {a.nomLieu}</button>}
          </li>)}</ul> : <Vide>Pas d’appel en attente.</Vide>}
        </>}

        {app === 'gps' && <><EnTeteAppli titre="GPS · itinéraire à pied" onRetour={() => setApp('accueil')} />
          <ListeDestinations destinations={destinations} position={position} action="Itinéraire" onChoisir={onAller} />
        </>}

        {app === 'transport' && <><EnTeteAppli titre="Taxi · Gbaka" onRetour={() => setApp('accueil')} />
          <AppliTransport destinations={destinations} position={position} pluie={pluie} argent={argent} onVoyager={onVoyager} />
        </>}

        {app === 'banque' && <><EnTeteAppli titre="Banque BTL" onRetour={() => setApp('accueil')} />
          <AppliBanque demo={demo} argent={argent} epargne={epargne} onEpargneDemo={onEpargneDemo} onAller={onAller} />
        </>}

        {app === 'offres' && <><EnTeteAppli titre="Offres d’emploi" onRetour={() => setApp('accueil')} />
          <AppliOffres demo={demo} niveau={niveau} onAller={onAller} />
        </>}

        {app === 'filrouge' && <><EnTeteAppli titre="Fil rouge · Résidence Akwaba" onRetour={() => setApp('accueil')} />
          {filRouge ? <div className="p-3">
            <div className="rounded-xl bg-white/[.06] p-3">
              <p className="hud-legende text-jeu-or">Chapitre {filRouge.chapitre}/{filRouge.total}</p>
              <p className="mt-1 text-[14px] font-bold">{filRouge.titre}</p>
              <p className="mt-1 text-[12px] leading-snug text-jeu-ivoire/75">{filRouge.resume}</p>
              <p className="mt-2 text-[12px]">Rendez-vous : <b>{filRouge.nomLieu}</b>, avec {filRouge.interlocuteur}.</p>
            </div>
            <button type="button" onClick={() => onAller(filRouge.lieu)} className="hud-bouton hud-bouton-principal mt-3 w-full p-2.5 text-[13px]">Y aller</button>
          </div> : <Vide>La Résidence Akwaba est livrée. Mme Touré te recommande à tout le Plateau.<br />{TEASER_CAMPAGNE}</Vide>}
        </>}

        {app === 'agenda' && <><EnTeteAppli titre="Agenda du jour" onRetour={() => setApp('accueil')} />
          <ul className="space-y-1.5 p-3">{rendezVous.map(r => <li key={`${r.slug}:${r.titre}`} className="flex items-center gap-2 rounded-xl bg-white/[.06] p-2.5">
            <span className="hud-chiffre w-[70px] shrink-0 text-[11px] text-jeu-or">{heureLisible(r.ouverture)} – {heureLisible(r.fermeture)}</span>
            <span className="min-w-0 flex-1"><b className="block truncate text-[12px]">{r.nom}</b><span className="block truncate text-[10.5px] text-jeu-ivoire/60">{r.titre}</span></span>
            <button type="button" onClick={() => onAller(r.slug)} aria-label={`Y aller : ${r.nom}`} className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold hover:bg-white/20">→</button>
          </li>)}</ul>
        </>}

        {app === 'defis' && <><EnTeteAppli titre="Défis" onRetour={() => setApp('accueil')} />{defis ?? <Vide>Les défis du jour arrivent bientôt.</Vide>}</>}
        {app === 'patrimoine' && <><EnTeteAppli titre="Patrimoine" onRetour={() => setApp('accueil')} />{patrimoine ?? <Vide>Ton patrimoine se charge…</Vide>}</>}
      </div>
      <div className="flex items-center justify-between bg-black/40 px-4 py-2">
        <button type="button" onClick={() => setApp('accueil')} className="text-[11.5px] font-bold text-jeu-ivoire/70 hover:text-jeu-ivoire">⌂ Accueil</button>
        <button type="button" onClick={onFermer} className="text-[11.5px] font-bold text-jeu-ivoire/70 hover:text-jeu-ivoire">{tactile ? 'Ranger' : 'Ranger (T)'}</button>
      </div>
    </div>
  </section>;
}

/** Pendant un trajet en taxi ou en gbaka : l'écran attend l'arrivée, le temps du monde passe à l'arrivée. */
export function TrajetEnCours({ mode, nom, minutes, prix }: { mode: 'gbaka' | 'taxi'; nom: string; minutes: number; prix: number }) {
  return <div role="status" aria-live="polite" className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c1214]/85 backdrop-blur-sm">
    <style>{'@keyframes btp-trajet { from { width: 0 } to { width: 100% } }'}</style>
    <div className="w-[320px] max-w-[calc(100%-32px)] rounded-2xl bg-white/[.06] p-5 text-center ring-1 ring-white/10">
      <p className="text-4xl" aria-hidden="true">{mode === 'taxi' ? '🚕' : '🚐'}</p>
      <p className="hud-titre mt-2 text-lg">{mode === 'taxi' ? 'En taxi' : 'En gbaka'} vers {nom}</p>
      <p className="mt-1 text-[12.5px] text-jeu-ivoire/70">{minutesLisibles(minutes)} de trajet · {prix.toLocaleString('fr-FR')} F</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-jeu-or" style={{ animation: 'btp-trajet 2.4s linear forwards' }} /></div>
    </div>
  </div>;
}

function ListeDestinations({ destinations, position, action, onChoisir }: { destinations: DestinationTelephone[]; position: Point; action: string; onChoisir: (slug: string) => void }) {
  const tries = useMemo(() => [...destinations].sort((a, b) => trajet('pied', position, a.porte).distance - trajet('pied', position, b.porte).distance), [destinations, position]);
  return <ul className="divide-y divide-white/[.06]">{tries.map(d => <li key={d.slug}><button type="button" onClick={() => onChoisir(d.slug)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/[.06]">
    <span className="min-w-0 flex-1"><b className="block truncate text-[12.5px]">{d.nom}</b><span className="text-[10.5px] text-jeu-ivoire/55">{d.quartier} · {Math.round(trajet('pied', position, d.porte).distance)} m</span></span>
    <span className="shrink-0 text-[11px] font-bold text-jeu-or">{action} →</span>
  </button></li>)}</ul>;
}

function AppliTransport({ destinations, position, pluie, argent, onVoyager }: { destinations: DestinationTelephone[]; position: Point; pluie: boolean; argent: number; onVoyager: (mode: 'gbaka' | 'taxi', slug: string) => Promise<string | null> }) {
  const [cible, setCible] = useState<DestinationTelephone | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  if (!cible) return <><p className="px-3 pt-2.5 text-[11.5px] text-jeu-ivoire/65">Où vas-tu ?</p><ListeDestinations destinations={destinations} position={position} action="Choisir" onChoisir={slug => { setCible(destinations.find(d => d.slug === slug) ?? null); setErreur(null); }} /></>;
  const proche = !trajetMotorise(position, cible.porte);
  const choix = (['taxi', 'gbaka', 'pied'] as const).map(mode => ({ mode, t: trajet(mode, position, cible.porte, pluie) }));
  const commander = async (mode: 'gbaka' | 'taxi') => {
    setEnCours(true); setErreur(null);
    const e = await onVoyager(mode, cible.slug);
    setEnCours(false); if (e) setErreur(e);
  };
  return <div className="p-3">
    <button type="button" onClick={() => setCible(null)} className="text-[11.5px] font-bold text-jeu-or">‹ Autre destination</button>
    <p className="mt-1.5 text-[14px] font-bold">{cible.nom}</p>
    <p className="text-[11px] text-jeu-ivoire/60">{cible.quartier} · solde {argent.toLocaleString('fr-FR')} F{pluie ? ' · il pleut, les taxis sont majorés' : ''}</p>
    {proche ? <p className="mt-3 rounded-xl bg-white/[.06] p-3 text-[12px]">C’est à deux pas : vas-y à pied.</p> : <ul className="mt-3 space-y-2">{choix.map(({ mode, t }) => <li key={mode} className="rounded-xl bg-white/[.06] p-2.5">
      <div className="flex items-baseline justify-between gap-2"><b className="text-[12.5px]">{mode === 'taxi' ? '🚕' : mode === 'gbaka' ? '🚐' : '🚶'} {LIBELLES_MODES[mode]}</b><b className="hud-chiffre text-[12.5px] text-jeu-or">{t.prix ? `${t.prix.toLocaleString('fr-FR')} F` : 'Gratuit'}</b></div>
      <p className="mt-0.5 text-[11px] text-jeu-ivoire/65">{minutesLisibles(t.minutes)}{mode === 'gbaka' ? ` · dont ${Math.round(t.marche)} m à pied jusqu’aux arrêts` : mode === 'taxi' ? ' · il vient te chercher' : ''}</p>
      {mode !== 'pied' && <button type="button" disabled={enCours || argent < t.prix} onClick={() => commander(mode)} className="hud-bouton hud-bouton-principal mt-2 w-full p-2 text-[12px]">{argent < t.prix ? 'Solde insuffisant' : enCours ? 'Réservation…' : mode === 'taxi' ? 'Commander le taxi' : 'Prendre le gbaka'}</button>}
    </li>)}</ul>}
    {erreur && <p role="alert" className="mt-2 rounded-lg bg-[#E2653C]/15 p-2 text-[11.5px] text-[#F08A4B]">{erreur}</p>}
  </div>;
}

function AppliBanque({ demo, argent: argentDemo, epargne: epargneDemo, onEpargneDemo, onAller }: { demo: boolean; argent: number; epargne: number; onEpargneDemo: (sens: 'deposer' | 'retirer', montant: number) => string | null; onAller: (slug: string) => void }) {
  const client = useQueryClient();
  const { data: carriere } = useQuery({ queryKey: ['carriere', 'me'], queryFn: () => api.get<{ argentVirtuel: number; epargne: number }>('/carriere/me'), enabled: !demo });
  const argent = demo ? argentDemo : carriere?.argentVirtuel ?? argentDemo, epargne = demo ? epargneDemo : carriere?.epargne ?? 0;
  const [message, setMessage] = useState<string | null>(null);
  const operer = useMutation({
    mutationFn: ({ sens, montant }: { sens: 'deposer' | 'retirer'; montant: number }) => api.post(`/carriere/epargne/${sens}`, { montant }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['carriere', 'me'] }); setMessage('Opération enregistrée.'); },
    onError: (e: Error) => setMessage(e.message || 'Opération refusée.'),
  });
  const agir = (sens: 'deposer' | 'retirer', montant: number) => {
    if (demo) { setMessage(onEpargneDemo(sens, montant) ?? 'Opération faite (démonstration).'); return; }
    operer.mutate({ sens, montant });
  };
  return <div className="space-y-3 p-3">
    <div className="grid grid-cols-2 gap-2 text-center">
      <div className="rounded-xl bg-white/[.06] p-2.5"><b className="hud-chiffre block text-[16px] text-jeu-or">{argent.toLocaleString('fr-FR')}</b><span className="text-[10.5px] text-jeu-ivoire/60">F sur le compte</span></div>
      <div className="rounded-xl bg-white/[.06] p-2.5"><b className="hud-chiffre block text-[16px] text-jeu-lagune">{epargne.toLocaleString('fr-FR')}</b><span className="text-[10.5px] text-jeu-ivoire/60">F d’épargne</span></div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" disabled={operer.isPending || argent < 5000} onClick={() => agir('deposer', 5000)} className="hud-bouton hud-bouton-verre p-2 text-[11.5px]">Épargner 5 000 F</button>
      <button type="button" disabled={operer.isPending || epargne < 5000} onClick={() => agir('retirer', 5000)} className="hud-bouton hud-bouton-verre p-2 text-[11.5px]">Retirer 5 000 F</button>
    </div>
    {message && <p role="status" className="text-center text-[11.5px] text-jeu-ivoire/75">{message}</p>}
    <button type="button" onClick={() => onAller('banque')} className="w-full text-center text-[11.5px] font-bold text-jeu-or">Prêt, conseiller : aller à la Banque BTL →</button>
  </div>;
}

/**
 * Les offres à montrer dans le téléphone, parmi la trentaine publiée : d'abord celles à la portée du joueur (les plus
 * hautes en tête, cinq au plus), puis les plus proches de son niveau, pour qu'il sache vers quoi progresser.
 */
export function offresAuPlusPres<T extends { niveauMin: number }>(offres: readonly T[], niveau: number | undefined, nombre = 8): T[] {
  if (niveau === undefined) return offres.slice(0, nombre);
  const aSaPortee = offres.filter(o => o.niveauMin <= niveau).sort((a, b) => b.niveauMin - a.niveauMin).slice(0, 5);
  const ensuite = offres.filter(o => o.niveauMin > niveau).sort((a, b) => a.niveauMin - b.niveauMin);
  return [...aSaPortee, ...ensuite].slice(0, nombre);
}

function AppliOffres({ demo, niveau, onAller }: { demo: boolean; niveau?: number; onAller: (slug: string) => void }) {
  const { data } = useQuery({ queryKey: ['catalog', 'offres'], queryFn: () => api.get<{ items: { id: string; titre: string; entrepriseFictive?: string | null; niveauMin: number }[] }>('/catalog/offres-emploi?pageSize=50'), enabled: !demo, staleTime: 300_000 });
  const offres = offresAuPlusPres(demo ? OFFRES_DEMO : data?.items ?? [], niveau);
  return <div className="p-3">
    {offres.length ? <ul className="space-y-2">{offres.map(o => <li key={o.id} className="rounded-xl bg-white/[.06] p-2.5">
      <b className="block text-[12.5px]">{o.titre}</b>
      <span className="text-[10.5px] text-jeu-ivoire/60">{o.entrepriseFictive ?? 'Entreprise du quartier'} · {niveau !== undefined && o.niveauMin <= niveau ? <span className="font-bold text-jeu-lagune">à ta portée</span> : <>niveau {o.niveauMin} minimum</>}</span>
    </li>)}</ul> : <Vide>Les offres se chargent…</Vide>}
    <button type="button" onClick={() => onAller('agence')} className="hud-bouton hud-bouton-principal mt-3 w-full p-2.5 text-[12.5px]">Postuler à l’Agence des talents</button>
  </div>;
}
