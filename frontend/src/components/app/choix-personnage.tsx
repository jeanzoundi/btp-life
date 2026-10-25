'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { api } from '@/lib/api';
import { estPersonnage, PERSONNAGES, type IdPersonnage } from '@/lib/personnages-joueur';
import { POLICES_JEU } from '@/lib/polices-jeu';
import { gabaritDepuis, echelleGabarit, STATURES, SILHOUETTES, type GabaritPersonnage } from '@/lib/gabarit-personnage';
import { AvatarBtp } from './avatar-btp';
import { HumainMonde } from './humain-monde';

// Choisir son personnage : au premier pas dans le monde vivant, puis à tout moment (options du monde, accueil classique).

const CLE_DEMO = 'btp-life-personnage-demo';
export interface ChoixPersonnageJoueur extends Partial<GabaritPersonnage> { personnage: IdPersonnage; nom: string }

/** Le choix fait en démonstration, gardé dans ce navigateur. */
export function lireChoixDemo(): ChoixPersonnageJoueur | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_DEMO) ?? 'null') as { personnage?: unknown; nom?: unknown } | null;
    return v && estPersonnage(v.personnage) ? { personnage: v.personnage, nom: typeof v.nom === 'string' ? v.nom : '', ...gabaritDepuis(v) } : null;
  } catch { return null; }
}

/** Enregistre le choix : dans le compte (PATCH /carriere/avatar/personnage), ou dans ce navigateur en démonstration. */
export function useEnregistrerPersonnage(demo: boolean, onDemo?: (choix: ChoixPersonnageJoueur) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ personnage, nom, ...gabarit }: ChoixPersonnageJoueur) => {
      if (demo) {
        try { localStorage.setItem(CLE_DEMO, JSON.stringify({ personnage, nom, ...gabaritDepuis(gabarit) })); } catch { throw new Error('Le navigateur ne peut pas sauvegarder ce personnage. Autorise le stockage puis réessaie.'); }
        return null;
      }
      return api.patch<{ nomPersonnage: string; config: unknown }>('/carriere/avatar/personnage', { personnage, ...gabaritDepuis(gabarit), ...(nom.length >= 2 ? { nomPersonnage: nom } : {}) });
    },
    onSuccess: (avatar, choix) => {
      if (demo) { onDemo?.(choix); return; }
      client.setQueryData(['carriere', 'me'], (ancienne: Record<string, unknown> | undefined) => ancienne ? { ...ancienne, avatar } : ancienne);
      client.invalidateQueries({ queryKey: ['carriere'] });
    },
  });
}

/** Cadrage en pied, recalé à chaque changement de taille : le personnage occupe toute la hauteur du plateau. */
function CameraPlateau() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const vue = camera as THREE.PerspectiveCamera;
    vue.fov = 32; vue.position.set(0, 1.15, 3.7); vue.lookAt(0, .93, 0); vue.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/** Le personnage sur son plateau tournant, éclairé comme dans une cabine d'essayage. */
function Plateau({ id, gabarit }: { id: IdPersonnage; gabarit: GabaritPersonnage }) {
  const groupe = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (groupe.current) groupe.current.rotation.y += Math.min(delta, .05) * .45; });
  const p = PERSONNAGES.find(x => x.id === id)!;
  return <>
    <CameraPlateau />
    <hemisphereLight args={['#fff4e2', '#3a2e24', 1.15]} />
    <directionalLight position={[2.5, 4, 3]} intensity={2.3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <directionalLight position={[-3, 2, -2]} intensity={.8} color="#9fd0e0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[1.1, 48]} /><meshStandardMaterial color="#2a3b3d" roughness={.85} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .005, 0]}><ringGeometry args={[1.04, 1.12, 64]} /><meshBasicMaterial color="#e8bd72" /></mesh>
    <group ref={groupe} rotation={[0, -.5, 0]} scale={echelleGabarit(gabarit)}><HumainMonde key={id} modele={p.modele} design={p.design} casque={p.casque} /></group>
  </>;
}

export function ChoixPersonnage({ initial, nomInitial, avatarConfig, premierChoix, demo, enCours, erreur, onValider, onAnnuler, brouillon = false }: {
  initial: IdPersonnage; nomInitial: string;
  /** Configuration de l'avatar 2D (dressing compris) : chaque carte montre l'avatar classique avec ce personnage. */
  avatarConfig?: unknown;
  /** Premier pas dans le monde : pas d'annulation, on entre dans le quartier en validant. */
  premierChoix: boolean; demo: boolean; enCours: boolean; erreur: string | null;
  /** L'accueil valide plus tard ; l'aperçu ne sauvegarde jamais. */
  brouillon?: boolean;
  onValider: (personnage: IdPersonnage, nom: string, gabarit: GabaritPersonnage) => void; onAnnuler?: () => void;
}) {
  const [id, setId] = useState<IdPersonnage>(initial);
  const [nom, setNom] = useState(nomInitial);
  const [gabarit, setGabarit] = useState(() => gabaritDepuis(avatarConfig));
  const dialogue = useRef<HTMLElement>(null);
  const index = PERSONNAGES.findIndex(p => p.id === id);
  const choisi = PERSONNAGES[index];
  const decaler = (pas: number) => setId(PERSONNAGES[(index + pas + PERSONNAGES.length) % PERSONNAGES.length].id);
  const rappels = useRef({ decaler, onAnnuler });
  rappels.current = { decaler, onAnnuler };
  useEffect(() => {
    const avant = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogue.current?.focus();
    const retenirFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogue.current) return;
      const elements = Array.from(dialogue.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)'));
      const premier = elements[0], dernier = elements[elements.length - 1];
      if (!premier) return;
      if (e.shiftKey && (document.activeElement === premier || document.activeElement === dialogue.current)) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    };
    document.addEventListener('keydown', retenirFocus);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', retenirFocus); avant?.focus(); };
  }, []);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select')) return;
      if (e.key === 'ArrowLeft') rappels.current.decaler(-1);
      else if (e.key === 'ArrowRight') rappels.current.decaler(1);
      else if (e.key === 'Escape') rappels.current.onAnnuler?.();
      else return;
      e.stopPropagation();
    };
    window.addEventListener('keydown', touche, true);
    return () => window.removeEventListener('keydown', touche, true);
  }, []);
  const propre = nom.trim(), nomValide = propre.length >= 2 && propre.length <= 24;
  const base = avatarConfig && typeof avatarConfig === 'object' ? avatarConfig : {};
  return <section ref={dialogue} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choisis ton personnage" className={`fixed inset-0 z-[140] overflow-y-auto bg-[#12282a]/95 text-jeu-ivoire backdrop-blur-sm ${POLICES_JEU} hud-texte`}>
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-stretch">
      <div className="flex min-h-[340px] flex-1 flex-col lg:min-h-[420px]">
        <p className="hud-legende text-jeu-or">{premierChoix ? 'Bienvenue aux Palmiers' : 'Ton personnage'}</p>
        <h1 className="hud-titre text-2xl leading-tight sm:text-3xl">Choisis ton personnage</h1>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-jeu-ivoire/70">C’est lui qui marche dans le monde vivant. En mode classique, ton avatar prend son teint et ses cheveux ; ta tenue, ton casque et tes accessoires restent ceux du dressing.</p>
        <div className="relative mt-3 min-h-[250px] flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_35%,#2f4a4c,#162a2c_70%)] lg:min-h-[320px]">
          <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.3, 3.5], fov: 34, near: .1, far: 50 }} onCreated={({ camera }) => camera.lookAt(0, .92, 0)} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
            <Plateau id={id} gabarit={gabarit} />
          </Canvas>
          <button type="button" aria-label="Personnage précédent" onClick={() => decaler(-1)} className="hud-bouton hud-bouton-verre absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full text-xl">‹</button>
          <button type="button" aria-label="Personnage suivant" onClick={() => decaler(1)} className="hud-bouton hud-bouton-verre absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full text-xl">›</button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
            <p className="hud-titre text-xl">{choisi.titre}</p>
            <p className="text-[12.5px] text-jeu-ivoire/75">{choisi.detail}</p>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 lg:w-[400px] lg:pt-14">
        <div role="radiogroup" aria-label="Personnages" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {PERSONNAGES.map(p => <button key={p.id} type="button" role="radio" aria-checked={p.id === id} onClick={() => setId(p.id)}
            className={`flex items-center gap-2 rounded-xl p-2 text-left transition-colors ${p.id === id ? 'bg-jeu-or/[.16] ring-2 ring-jeu-or' : 'bg-white/[.06] hover:bg-white/10'}`}>
            <AvatarBtp config={{ ...base, personnage: p.id }} taille={44} className="!rounded-full" />
            <span className="min-w-0">
              <span className="block text-[12.5px] font-bold leading-tight">{p.titre}</span>
              <span className="text-[10.5px] text-jeu-ivoire/55">{p.casque ? 'Casque compris' : p.design.feminin ? 'Femme' : 'Homme'}</span>
            </span>
          </button>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">Taille
            <select aria-label="Taille" value={gabarit.stature} disabled={enCours} onChange={e => setGabarit(g => ({ ...g, stature: e.target.value as GabaritPersonnage['stature'] }))} className="mt-1 w-full rounded-xl border border-white/15 bg-[#12282a] p-2.5 text-jeu-ivoire">
              {Object.entries(STATURES).map(([id, v]) => <option key={id} value={id}>{v.nom}</option>)}
            </select>
          </label>
          <label className="text-xs">Morphologie
            <select aria-label="Morphologie" value={gabarit.silhouette} disabled={enCours} onChange={e => setGabarit(g => ({ ...g, silhouette: e.target.value as GabaritPersonnage['silhouette'] }))} className="mt-1 w-full rounded-xl border border-white/15 bg-[#12282a] p-2.5 text-jeu-ivoire">
              {Object.entries(SILHOUETTES).map(([id, v]) => <option key={id} value={id}>{v.nom}</option>)}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-jeu-ivoire/60">Ton apparence ne détermine pas ton métier. Ces proportions s’appliquent au personnage dans le monde vivant.</p>
        <div className="sticky bottom-0 -mx-4 mt-auto space-y-2 border-t border-white/10 bg-[#12282a] px-4 pb-4 pt-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
        <label className="block">
          <span className="hud-legende">Nom de ton personnage</span>
          <input value={nom} onChange={e => setNom(e.target.value)} maxLength={24} placeholder="Ex. Kouassi" className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-jeu-ivoire outline-none focus:border-jeu-or" />
        </label>
        {erreur && <p role="alert" className="text-[12.5px] font-semibold text-[#F08A4B]">{erreur}</p>}
        <button type="button" disabled={!nomValide || enCours} onClick={() => onValider(id, propre, gabarit)} className="hud-bouton hud-bouton-principal w-full p-3 text-sm disabled:opacity-50">
          {enCours ? 'Enregistrement…' : brouillon ? 'Utiliser ce personnage' : premierChoix ? 'Entrer dans le quartier' : 'Garder ce personnage'}
        </button>
        {onAnnuler && <button type="button" onClick={onAnnuler} className="hud-bouton hud-bouton-verre w-full p-2.5 text-[12.5px]">Annuler</button>}
        <p className="text-center text-[11px] text-jeu-ivoire/50">{brouillon ? 'Aperçu du choix : aucun enregistrement depuis cet atelier.' : demo ? 'Démonstration : le choix reste dans ce navigateur.' : 'Enregistré dans ton compte : le même personnage dans les deux modes.'}</p>
        </div>
      </div>
    </div>
  </section>;
}
