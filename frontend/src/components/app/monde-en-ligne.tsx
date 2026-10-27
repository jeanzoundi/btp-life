'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as THREE from 'three';
import { api } from '@/lib/api';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import {
  DUREE_EMOTE_MS, EMOTES, ETAT_EQUIPE_VIDE, LONGUEUR_MESSAGE, PERIODE_CHAT_MS, PERIODE_PRESENCE_MS, REGLES_EQUIPE, emoteParId, equipeAvec, invitables,
  messagePret, messagesDemo, promeneurs, voisinsDemo, type Emote, type EtatEquipe, type InvitationEquipe, type JoueurRecent, type MessageQuartier, type VoisinEnLigne,
} from '@/lib/en-ligne';
import { echelleGabarit } from '@/lib/gabarit-personnage';
import { personnageDe } from '@/lib/personnages-joueur';
import { HumainMonde } from './humain-monde';
import { BullePensee } from './humeur-monde';

// Le quartier partagé : les autres joueurs connectés marchent dans la ville avec leur personnage, lancent des émotes,
// tout le monde se parle dans le chat du quartier, et l'on fait équipe à quatre au plus. Les relevés passent par le
// serveur toutes les quelques secondes.

/**
 * Signale la position du joueur et tient la liste des voisins présents, son équipe et ses invitations. Le relevé s'arrête
 * quand l'onglet est caché ; en démonstration, trois voisins simulés se promènent sur la place et font équipe.
 */
export function useMondeEnLigne({ demo, position, lieu, nom = 'Moi', actif = true }: {
  demo: boolean; position: React.MutableRefObject<THREE.Vector3>; lieu: string | null; nom?: string; actif?: boolean;
}) {
  const [voisins, setVoisins] = useState<VoisinEnLigne[]>([]);
  const [monEmote, setMonEmote] = useState<Emote | null>(null);
  const [equipe, setEquipe] = useState<EtatEquipe>(ETAT_EQUIPE_VIDE);
  // L'équipe est connue après le premier relevé (tout de suite en démonstration).
  const [equipePrete, setEquipePrete] = useState(demo);
  const lieuRef = useRef(lieu);
  lieuRef.current = lieu;
  const moi = useMemo(() => ({ userId: 'moi', nom }), [nom]);

  // Démonstration : Kader propose de faire équipe au bout de quarante secondes, si le joueur n'en a pas encore.
  useEffect(() => {
    if (!demo || !actif) return;
    const id = window.setTimeout(() => setEquipe(e => e.equipe || e.invitations.length ? e : { ...e, invitations: [{ id: 'demo-kader', de: 'Kader' }] }), 40_000);
    return () => window.clearTimeout(id);
  }, [demo, actif]);

  useEffect(() => {
    if (!demo || !actif) return;
    const debut = Date.now();
    const maj = () => setVoisins(voisinsDemo((Date.now() - debut) / 1000));
    maj();
    const id = window.setInterval(maj, 1000);
    return () => window.clearInterval(id);
  }, [demo, actif]);

  const signaler = useCallback(async (emote?: Emote) => {
    const p = position.current;
    try {
      const r = await api.post<{ voisins?: VoisinEnLigne[] } & Partial<EtatEquipe>>('/monde/presence?equipe=1', { x: p.x, z: p.z, ...(lieuRef.current ? { lieu: lieuRef.current } : {}), ...(emote ? { emote } : {}) });
      setVoisins(Array.isArray(r?.voisins) ? r.voisins : []);
      setEquipe({ equipe: r?.equipe ?? null, invitations: Array.isArray(r?.invitations) ? r.invitations : [] });
      setEquipePrete(true);
    } catch { /* réseau coupé : la dernière liste reste affichée */ }
  }, [position]);

  useEffect(() => {
    if (demo || !actif) return;
    void signaler();
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void signaler(); }, PERIODE_PRESENCE_MS);
    return () => window.clearInterval(id);
  }, [demo, actif, signaler]);

  // En entrant dans un lieu (ou en en sortant), le relevé part tout de suite : les coéquipiers le voient sans attendre.
  const lieuSignale = useRef(lieu);
  useEffect(() => {
    if (demo || !actif || lieuSignale.current === lieu) return;
    lieuSignale.current = lieu;
    void signaler();
  }, [demo, actif, lieu, signaler]);

  useEffect(() => {
    if (!monEmote) return;
    const id = window.setTimeout(() => setMonEmote(null), DUREE_EMOTE_MS);
    return () => window.clearTimeout(id);
  }, [monEmote]);

  const emote = useCallback((id: Emote) => {
    setMonEmote(id);
    if (!demo) void signaler(id);
  }, [demo, signaler]);

  /** Une action d'équipe au serveur : renvoie le message d'erreur à afficher, ou rien. */
  const agirEquipe = useCallback(async (chemin: string, corps?: unknown): Promise<string | null> => {
    try {
      const etat = await api.post<EtatEquipe>(chemin, corps);
      setEquipe({ equipe: etat?.equipe ?? null, invitations: Array.isArray(etat?.invitations) ? etat.invitations : [] });
      return null;
    } catch (e) { return e instanceof Error ? e.message : 'Action refusée.'; }
  }, []);
  const inviter = useCallback(async (voisin: VoisinEnLigne): Promise<string | null> => {
    if (!demo) return agirEquipe('/monde/equipe/inviter', { userId: voisin.userId });
    // Le voisin simulé accepte après un instant.
    window.setTimeout(() => setEquipe(e => ({ ...e, equipe: equipeAvec(e.equipe, moi, voisin) })), 1500);
    return null;
  }, [demo, agirEquipe, moi]);
  const repondre = useCallback(async (invitation: InvitationEquipe, accepter: boolean): Promise<string | null> => {
    if (!demo) return agirEquipe('/monde/equipe/repondre', { invitationId: invitation.id, accepter });
    setEquipe(e => ({
      invitations: e.invitations.filter(i => i.id !== invitation.id),
      equipe: !accepter ? e.equipe : { id: `equipe-${invitation.id}`, chefId: invitation.id, membres: [
        { userId: invitation.id, nom: invitation.de, enLigne: true, lieu: null }, { ...moi, enLigne: true, lieu: null },
      ] },
    }));
    return null;
  }, [demo, agirEquipe, moi]);
  const quitter = useCallback(async (): Promise<string | null> => {
    if (!demo) return agirEquipe('/monde/equipe/quitter');
    setEquipe(e => ({ ...e, equipe: null }));
    return null;
  }, [demo, agirEquipe]);

  return { voisins, monEmote, emote, equipe, equipePrete, inviter, repondre, quitter };
}
export type MondeEnLigne = ReturnType<typeof useMondeEnLigne>;

/** Les promeneurs de la place, recalculés chaque seconde tant que presque personne n'est connecté. */
export function usePromeneurs({ actif, recents, connectes }: { actif: boolean; recents: readonly JoueurRecent[]; connectes: readonly VoisinEnLigne[] }) {
  const [liste, setListe] = useState<VoisinEnLigne[]>([]);
  const [debut] = useState(() => Date.now());
  const vides = !actif || !recents.length || connectes.length >= 2;
  useEffect(() => {
    // Liste déjà vide : rien à changer (évite un rendu de plus à chaque nouvelle liste vide reçue).
    if (vides) { setListe(l => (l.length ? [] : l)); return; }
    const maj = () => setListe(promeneurs(recents, connectes, (Date.now() - debut) / 1000));
    maj();
    const id = window.setInterval(maj, 1000);
    return () => window.clearInterval(id);
  }, [vides, recents, connectes, debut]);
  return liste;
}

const bulleEmote = (id: string | null | undefined) => { const e = emoteParId(id); return e ? { icone: e.icone, texte: e.texte } : null; };

/** Un voisin connecté : il rejoint sa dernière position à son pas (ou y saute s'il vient de prendre un taxi). Un coéquipier
 * porte un anneau doré ; un clic ouvre le chat, d'où l'on peut l'inviter. */
function VoisinMonde({ voisin, coequipier, onSelect }: { voisin: VoisinEnLigne; coequipier: boolean; onSelect?: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const cible = useMemo(() => new THREE.Vector3(), []);
  const ecart = useMemo(() => new THREE.Vector3(), []);
  const marcheRef = useRef(false);
  const [marche, setMarche] = useState(false);
  const personnage = useMemo(() => personnageDe(voisin.avatarConfig), [voisin.avatarConfig]);
  const design = useMemo(() => ({ ...personnage.design, casque: personnage.couleurCasque ?? personnage.design.casque ?? '#f4c430' }), [personnage]);
  cible.set(voisin.x, 0, voisin.z);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    ecart.subVectors(cible, g.position);
    const distance = ecart.length();
    if (distance > 30) g.position.copy(cible);
    else if (distance > .05) {
      // Le prochain relevé arrive dans dix secondes : le voisin couvre l'écart dans ce temps-là, entre la marche et la course.
      const vitesse = THREE.MathUtils.clamp(distance / (PERIODE_PRESENCE_MS / 1000) * 1.25, 1.3, 6);
      g.position.addScaledVector(ecart.normalize(), Math.min(distance, vitesse * Math.min(delta, .05)));
      g.rotation.y = Math.atan2(ecart.x, ecart.z);
    }
    const bouge = distance > .15;
    if (bouge !== marcheRef.current) { marcheRef.current = bouge; setMarche(bouge); }
  });
  return <group ref={ref} position={[voisin.x, 0, voisin.z]} onClick={e => { e.stopPropagation(); if (e.delta < 5 && !voisin.promeneur) onSelect?.(); }}>
    <group scale={echelleGabarit(personnage.gabarit)}>
      <HumainMonde modele={personnage.modele} design={design} casque nom={voisin.promeneur ? `${voisin.nom} · niv. ${voisin.promeneur.niveau}` : `${voisin.nom} · ${coequipier ? 'équipe' : 'en ligne'}`} marche={marche} allure={1.6} scale={ECHELLE_PERSONNAGES} teinteCasque={personnage.couleurCasque} />
    </group>
    {coequipier && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .04, 0]}><ringGeometry args={[.6, .78, 40]} /><meshBasicMaterial color="#E8B84A" transparent opacity={.85} /></mesh>}
    <BullePensee pensee={bulleEmote(voisin.emote)} hauteur={3.2} />
  </group>;
}

/** Les voisins dans la rue (ceux qui sont dans un intérieur n'y apparaissent pas). */
export function VoisinsEnLigne3D({ voisins, coequipiers = [], onSelect }: { voisins: VoisinEnLigne[]; coequipiers?: readonly string[]; onSelect?: () => void }) {
  return <>{voisins.filter(v => !v.lieu).map(v => <VoisinMonde key={v.userId} voisin={v} coequipier={coequipiers.includes(v.userId)} onSelect={onSelect} />)}</>;
}

/** L'émote du joueur, au-dessus de sa tête (au-dessus de ses pensées). */
export function EmoteJoueur3D({ position, emote }: { position: React.MutableRefObject<THREE.Vector3>; emote: Emote | null }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (ref.current) ref.current.position.copy(position.current); });
  return <group ref={ref}><BullePensee pensee={bulleEmote(emote)} hauteur={4.1} /></group>;
}

const heureCourte = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** L'équipe du joueur, les invitations reçues et les voisins à inviter, en tête du chat. */
function SectionEquipe({ moi, voisins, etat, onInviter, onRepondre, onQuitter, onErreur }: {
  moi: string; voisins: VoisinEnLigne[]; etat: EtatEquipe;
  onInviter: (voisin: VoisinEnLigne) => Promise<string | null>; onRepondre: (invitation: InvitationEquipe, accepter: boolean) => Promise<string | null>;
  onQuitter: () => Promise<string | null>; onErreur: (message: string | null) => void;
}) {
  const [invites, setInvites] = useState<string[]>([]);
  const { equipe, invitations } = etat;
  const aInviter = invitables(voisins, equipe);
  const agir = async (action: Promise<string | null>) => onErreur(await action);
  return <div className="space-y-1.5 border-b border-white/10 px-3 py-2 text-[12px]">
    {invitations.map(i => <div key={i.id} className="flex items-center gap-1.5 rounded-lg bg-jeu-or/[.12] px-2 py-1.5 ring-1 ring-jeu-or/40">
      <span className="flex-1">🤝 <b>{i.de}</b> t’invite dans son équipe</span>
      <button type="button" onClick={() => void agir(onRepondre(i, true))} className="rounded-md bg-jeu-or/25 px-2 py-0.5 text-[11px] font-bold text-jeu-or hover:bg-jeu-or/35">Accepter</button>
      <button type="button" onClick={() => void agir(onRepondre(i, false))} className="rounded-md px-1.5 py-0.5 text-[11px] text-jeu-ivoire/60 hover:bg-white/10">Refuser</button>
    </div>)}
    {equipe ? <div className="flex flex-wrap items-center gap-1" aria-label="Ton équipe">
      <span className="mr-1 text-[11px] font-bold text-jeu-or">Ton équipe ({equipe.membres.length}/{REGLES_EQUIPE.membresMax})</span>
      {equipe.membres.map(m => <span key={m.userId} className="rounded-full bg-white/[.08] px-2 py-0.5 text-[11px]">
        <span aria-hidden className={m.enLigne ? 'text-jeu-lagune' : 'text-jeu-ivoire/35'}>●</span> {m.nom === moi ? 'toi' : m.nom}
      </span>)}
      <button type="button" onClick={() => { setInvites([]); void agir(onQuitter()); }} className="ml-auto text-[10.5px] text-jeu-ivoire/50 hover:underline">Quitter l’équipe</button>
    </div> : <p className="text-[11px] leading-snug text-jeu-ivoire/60">Fais équipe avec un voisin : à deux dans le même lieu, chaque séance rapporte +{Math.round(REGLES_EQUIPE.bonusXp * 100)} % d’XP.</p>}
    {!voisins.length && <p className="text-[11px] leading-snug text-jeu-ivoire/50">Personne d’autre n’est connecté. Les promeneurs de la place sont des joueurs passés récemment : reviens plus tard pour faire équipe.</p>}
    {aInviter.length > 0 && <div className="flex flex-wrap gap-1" aria-label="Voisins à inviter">
      {aInviter.map(v => invites.includes(v.userId)
        ? <span key={v.userId} className="rounded-full px-2 py-0.5 text-[11px] text-jeu-ivoire/50">{v.nom} : invité</span>
        : <button key={v.userId} type="button" aria-label={`Inviter ${v.nom} dans ton équipe`} onClick={() => { setInvites(l => [...l, v.userId]); void agir(onInviter(v)); }}
            className="rounded-full border border-jeu-or/40 px-2 py-0.5 text-[11px] text-jeu-or hover:bg-jeu-or/10">+ {v.nom}</button>)}
    </div>}
  </div>;
}

/** Le chat du quartier, les émotes et l'équipe, ouverts depuis le HUD. */
export function ChatQuartier({ demo, moi, voisins, onEmote, onFermer, equipe = ETAT_EQUIPE_VIDE, onInviter, onRepondre, onQuitter, onEnvoi }: {
  demo: boolean; moi: string; voisins: VoisinEnLigne[]; onEmote: (emote: Emote) => void; onFermer: () => void;
  /** Un message est parti (sert au guide des premiers pas). */
  onEnvoi?: () => void;
  equipe?: EtatEquipe;
  onInviter?: (voisin: VoisinEnLigne) => Promise<string | null>;
  onRepondre?: (invitation: InvitationEquipe, accepter: boolean) => Promise<string | null>;
  onQuitter?: () => Promise<string | null>;
}) {
  const client = useQueryClient();
  const [brouillon, setBrouillon] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoyesDemo, setEnvoyesDemo] = useState<MessageQuartier[]>([]);
  const [debutDemo] = useState(() => Date.now());
  const [, setTic] = useState(0);
  const fil = useRef<HTMLOListElement>(null);
  const { data } = useQuery({
    queryKey: ['monde', 'chat'], queryFn: () => api.get<MessageQuartier[]>('/monde/chat'), enabled: !demo, refetchInterval: PERIODE_CHAT_MS, staleTime: 2_000,
  });
  // En démonstration, les messages des voisins arrivent un à un ; un tic par seconde suffit à les faire paraître.
  useEffect(() => { if (!demo) return; const id = window.setInterval(() => setTic(t => t + 1), 1000); return () => window.clearInterval(id); }, [demo]);
  const messages = demo ? [...messagesDemo(15 + (Date.now() - debutDemo) / 1000), ...envoyesDemo].sort((a, b) => a.envoyeLe.localeCompare(b.envoyeLe)) : data ?? [];
  const envoyer = useMutation({
    mutationFn: (texte: string) => api.post<MessageQuartier>('/monde/chat', { texte }),
    onSuccess: message => { client.setQueryData<MessageQuartier[]>(['monde', 'chat'], liste => [...(liste ?? []).filter(m => m.id !== message.id), message]); setBrouillon(''); setErreur(null); onEnvoi?.(); },
    onError: e => setErreur(e instanceof Error ? e.message : 'Le message n’est pas parti.'),
  });
  useEffect(() => { if (fil.current) fil.current.scrollTop = fil.current.scrollHeight; }, [messages.length]);

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    const texte = messagePret(brouillon);
    if (!texte || envoyer.isPending) return;
    if (demo) {
      setEnvoyesDemo(l => [...l, { id: `moi-${l.length}`, userId: 'moi', nom: moi, texte, envoyeLe: new Date(Date.UTC(2026, 9, 26, 8) + (15 + (Date.now() - debutDemo) / 1000) * 1000).toISOString() }]);
      setBrouillon('');
      onEnvoi?.();
      return;
    }
    envoyer.mutate(texte);
  };

  return <section role="dialog" aria-label="Chat du quartier" className="hud-verre pointer-events-auto absolute left-3 top-[168px] z-30 flex max-h-[min(440px,calc(100%-380px))] min-h-[220px] w-[330px] max-w-[calc(100%-24px)] flex-col rounded-2xl text-jeu-ivoire">
    <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
      <h3 className="hud-titre flex-1 text-[14px]">Quartier en ligne</h3>
      <span className="text-[11px] text-jeu-ivoire/70">{voisins.length ? `${voisins.length} voisin${voisins.length > 1 ? 's' : ''} connecté${voisins.length > 1 ? 's' : ''}` : 'Personne d’autre pour l’instant'}</span>
      <button type="button" aria-label="Fermer le chat" onClick={onFermer} className="rounded-full px-2 py-0.5 text-[15px] leading-none hover:bg-white/10">×</button>
    </header>
    {onInviter && onRepondre && onQuitter && <SectionEquipe moi={moi} voisins={voisins} etat={equipe} onInviter={onInviter} onRepondre={onRepondre} onQuitter={onQuitter} onErreur={setErreur} />}
    <ol ref={fil} aria-live="polite" className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
      {messages.length ? messages.map(m => <li key={m.id} className="text-[12.5px] leading-snug">
        <span className="mr-1 text-[10.5px] text-jeu-ivoire/45">{heureCourte(m.envoyeLe)}</span>
        <b className={m.nom === moi ? 'text-jeu-or' : 'text-jeu-lagune'}>{m.nom}</b> <span className="break-words">{m.texte}</span>
      </li>) : <li className="py-4 text-center text-[12px] text-jeu-ivoire/55">Pas encore de message aujourd’hui. Lance la conversation !</li>}
    </ol>
    <div className="flex justify-between gap-1 border-t border-white/10 px-3 py-1.5" role="group" aria-label="Émotes">
      {EMOTES.map(e => <button key={e.id} type="button" title={e.texte} aria-label={`Émote : ${e.texte}`} onClick={() => onEmote(e.id)} className="rounded-lg px-1.5 py-1 text-[18px] leading-none hover:bg-white/10">{e.icone}</button>)}
    </div>
    <form onSubmit={soumettre} className="flex gap-1.5 px-3 pb-3 pt-1">
      <label className="sr-only" htmlFor="message-quartier">Message au quartier</label>
      <input id="message-quartier" value={brouillon} onChange={e => setBrouillon(e.target.value)} maxLength={LONGUEUR_MESSAGE} autoComplete="off" placeholder="Écrire au quartier…"
        onKeyDown={e => e.stopPropagation()} className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-2.5 py-1.5 text-[12.5px] text-jeu-ivoire placeholder:text-jeu-ivoire/40 focus:border-jeu-or/60 focus:outline-none" />
      <button type="submit" disabled={!brouillon.trim() || envoyer.isPending} className="hud-bouton hud-bouton-principal px-3 py-1.5 text-[12.5px] disabled:opacity-50">Envoyer</button>
    </form>
    {erreur && <p role="alert" className="px-3 pb-2 text-[11.5px] text-[#F2A07B]">{erreur}</p>}
  </section>;
}
