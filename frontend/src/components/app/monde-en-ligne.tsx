'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as THREE from 'three';
import { api } from '@/lib/api';
import { ECHELLE_PERSONNAGES } from '@/lib/echelle-monde';
import {
  DUREE_EMOTE_MS, EMOTES, LONGUEUR_MESSAGE, PERIODE_CHAT_MS, PERIODE_PRESENCE_MS, emoteParId, messagePret, messagesDemo, voisinsDemo,
  type Emote, type MessageQuartier, type VoisinEnLigne,
} from '@/lib/en-ligne';
import { echelleGabarit } from '@/lib/gabarit-personnage';
import { personnageDe } from '@/lib/personnages-joueur';
import { HumainMonde } from './humain-monde';
import { BullePensee } from './humeur-monde';

// Le quartier partagé : les autres joueurs connectés marchent dans la ville avec leur personnage, lancent des émotes,
// et tout le monde se parle dans le chat du quartier. Les relevés passent par le serveur toutes les quelques secondes.

/**
 * Signale la position du joueur et tient la liste des voisins présents. Le relevé s'arrête quand l'onglet est caché ;
 * en démonstration, trois voisins simulés se promènent sur la place.
 */
export function useMondeEnLigne({ demo, position, lieu, actif = true }: { demo: boolean; position: React.MutableRefObject<THREE.Vector3>; lieu: string | null; actif?: boolean }) {
  const [voisins, setVoisins] = useState<VoisinEnLigne[]>([]);
  const [monEmote, setMonEmote] = useState<Emote | null>(null);
  const lieuRef = useRef(lieu);
  lieuRef.current = lieu;

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
      const liste = await api.post<VoisinEnLigne[]>('/monde/presence', { x: p.x, z: p.z, ...(lieuRef.current ? { lieu: lieuRef.current } : {}), ...(emote ? { emote } : {}) });
      setVoisins(Array.isArray(liste) ? liste : []);
    } catch { /* réseau coupé : la dernière liste reste affichée */ }
  }, [position]);

  useEffect(() => {
    if (demo || !actif) return;
    void signaler();
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void signaler(); }, PERIODE_PRESENCE_MS);
    return () => window.clearInterval(id);
  }, [demo, actif, signaler]);

  useEffect(() => {
    if (!monEmote) return;
    const id = window.setTimeout(() => setMonEmote(null), DUREE_EMOTE_MS);
    return () => window.clearTimeout(id);
  }, [monEmote]);

  const emote = useCallback((id: Emote) => {
    setMonEmote(id);
    if (!demo) void signaler(id);
  }, [demo, signaler]);

  return { voisins, monEmote, emote };
}

const bulleEmote = (id: string | null | undefined) => { const e = emoteParId(id); return e ? { icone: e.icone, texte: e.texte } : null; };

/** Un voisin connecté : il rejoint sa dernière position à son pas (ou y saute s'il vient de prendre un taxi). */
function VoisinMonde({ voisin }: { voisin: VoisinEnLigne }) {
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
  return <group ref={ref} position={[voisin.x, 0, voisin.z]}>
    <group scale={echelleGabarit(personnage.gabarit)}>
      <HumainMonde modele={personnage.modele} design={design} casque nom={`${voisin.nom} · en ligne`} marche={marche} allure={1.6} scale={ECHELLE_PERSONNAGES} teinteCasque={personnage.couleurCasque} />
    </group>
    <BullePensee pensee={bulleEmote(voisin.emote)} hauteur={3.2} />
  </group>;
}

/** Les voisins dans la rue (ceux qui sont dans un intérieur n'y apparaissent pas). */
export function VoisinsEnLigne3D({ voisins }: { voisins: VoisinEnLigne[] }) {
  return <>{voisins.filter(v => !v.lieu).map(v => <VoisinMonde key={v.userId} voisin={v} />)}</>;
}

/** L'émote du joueur, au-dessus de sa tête (au-dessus de ses pensées). */
export function EmoteJoueur3D({ position, emote }: { position: React.MutableRefObject<THREE.Vector3>; emote: Emote | null }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (ref.current) ref.current.position.copy(position.current); });
  return <group ref={ref}><BullePensee pensee={bulleEmote(emote)} hauteur={4.1} /></group>;
}

const heureCourte = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Le chat du quartier et les émotes, ouverts depuis le HUD. */
export function ChatQuartier({ demo, moi, voisins, onEmote, onFermer }: {
  demo: boolean; moi: string; voisins: VoisinEnLigne[]; onEmote: (emote: Emote) => void; onFermer: () => void;
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
    onSuccess: message => { client.setQueryData<MessageQuartier[]>(['monde', 'chat'], liste => [...(liste ?? []).filter(m => m.id !== message.id), message]); setBrouillon(''); setErreur(null); },
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
