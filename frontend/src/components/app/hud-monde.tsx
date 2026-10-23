'use client';

import { useEffect, useRef, type MutableRefObject, type ReactNode } from 'react';
import type * as THREE from 'three';
import { angleEcran, distance, distanceLisible, type Point2 } from '@/lib/minicarte';

/** Icônes du HUD : un seul trait, couleur héritée du texte. */
function Svg({ children, taille = 18 }: { children: ReactNode; taille?: number }) {
  return <svg viewBox="0 0 24 24" width={taille} height={taille} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export const ICONES = {
  faim: <Svg taille={16}><path d="M3 12h18a9 9 0 0 1-18 0Z" /><path d="M8 3.5c0 1.5 1.5 1.5 1.5 3M12.5 3.5c0 1.5 1.5 1.5 1.5 3" /></Svg>,
  energie: <Svg taille={16}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></Svg>,
  moral: <Svg taille={16}><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 10h.01M15 10h.01" /></Svg>,
  social: <Svg taille={16}><path d="M14 9a5 5 0 0 1-7.1 4.5L4 15l.8-2.6A5 5 0 1 1 14 9Z" /><path d="M10.5 16.5A5 5 0 0 0 17 18.5l3 1.5-.8-2.7A5 5 0 0 0 17 10" /></Svg>,
  piece: <Svg taille={15}><circle cx="12" cy="12" r="9" /><path d="M14.8 9.2A3 3 0 0 0 12 8c-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 0 1-2.8-1.2M12 6v2M12 16v2" /></Svg>,
  medaille: <Svg taille={15}><circle cx="12" cy="14" r="5" /><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5" /></Svg>,
  cible: <Svg taille={17}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></Svg>,
  fleche: <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 2.5 19.5 21 12 16.8 4.5 21 12 2.5Z" fill="currentColor" /></svg>,
  carte: <Svg><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Z" /><path d="M9 4v13.5M15 6.5V20" /></Svg>,
  reglages: <Svg><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Svg>,
  planning: <Svg><path d="M10 6h10M10 12h10M10 18h10" /><path d="m3.5 6 1.3 1.3L7.5 4.5M3.5 12l1.3 1.3 2.7-2.8M3.5 18l1.3 1.3 2.7-2.8" /></Svg>,
  pause: <Svg taille={13}><path d="M8 5v14M16 5v14" /></Svg>,
  alerte: <Svg taille={17}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></Svg>,
  etoile: <Svg taille={17}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></Svg>,
  info: <Svg taille={17}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>,
} as const;

const COULEURS_HUMEUR = { bien: '#4CC3A5', moyen: '#E8B04A', mal: '#E2653C' } as const;

/** Médaillon du bâtisseur : initiale, anneau d'expérience vers le niveau suivant, niveau, humeur et ressources. */
export function CarteJoueur({ nom, poste, niveau, progression, argent, reputation, humeur, etatSauvegarde, compacte = false }: {
  nom: string; poste: string; niveau: number; progression: number; argent?: number; reputation?: number;
  humeur: keyof typeof COULEURS_HUMEUR; etatSauvegarde: { libelle: string; couleur: string }; compacte?: boolean;
}) {
  const rayon = 25, tour = 2 * Math.PI * rayon;
  return <div className={`hud-verre pointer-events-auto flex min-w-0 max-w-full items-center ${compacte ? 'gap-2.5 p-1.5 pr-3' : 'gap-3 p-2 pr-4'}`}>
    <div className={`relative shrink-0 ${compacte ? 'h-[46px] w-[46px]' : 'h-[58px] w-[58px]'}`}>
      <svg viewBox="0 0 58 58" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs><linearGradient id="hud-or-xp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6CF7A" /><stop offset="1" stopColor="#D2902A" /></linearGradient></defs>
        <circle cx="29" cy="29" r={rayon} fill="none" stroke="rgb(251 245 234 / .12)" strokeWidth="4" />
        <circle cx="29" cy="29" r={rayon} fill="none" stroke="url(#hud-or-xp)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${tour * progression / 100} ${tour}`} className="transition-[stroke-dasharray] duration-700" />
      </svg>
      <span className={`hud-titre absolute flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_25%,#F29467,#B4452A_72%)] text-white shadow-[inset_0_-3px_8px_rgb(0_0_0/.25)] ${compacte ? 'inset-[6px] text-[16px]' : 'inset-[7px] text-[20px]'}`}>{(nom.trim()[0] ?? 'B').toUpperCase()}</span>
      <span className={`hud-chiffre absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-jeu-nuit bg-[linear-gradient(180deg,#F3C66A,#D89A2C)] px-1 text-[#2A1C0E] ${compacte ? 'h-5 min-w-5 text-[10px]' : 'h-[22px] min-w-[22px] text-[11px]'}`}>{niveau}</span>
      <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-jeu-nuit" style={{ backgroundColor: COULEURS_HUMEUR[humeur] }} title="Humeur" />
      <span className="sr-only">Niveau {niveau}, {progression} % vers le niveau {niveau + 1}</span>
    </div>
    <div className="min-w-0">
      <p className={`hud-titre flex items-center gap-1.5 leading-tight ${compacte ? 'text-[14px]' : 'text-[15px]'}`}>
        <span className="truncate">{nom}</span>
        <span aria-hidden="true" title={etatSauvegarde.libelle} className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: etatSauvegarde.couleur }} />
      </p>
      <p className="truncate text-[11px] font-semibold text-jeu-ivoire/65">{poste}</p>
      <div className={`mt-0.5 flex flex-wrap items-center gap-x-3 ${compacte ? 'text-[12px]' : 'text-[13px]'}`}>
        <span className="flex items-center gap-1 text-jeu-or" title="Argent virtuel">{ICONES.piece}<b className="hud-chiffre">{argent === undefined ? '—' : argent.toLocaleString('fr-FR')}</b><span className="text-[10px] font-bold opacity-80">FCFA</span></span>
        {reputation !== undefined && !compacte && <span className="flex items-center gap-1 text-jeu-ivoire/70" title="Réputation, sur 1 000">{ICONES.medaille}<b className="hud-chiffre">{reputation}</b></span>}
      </div>
    </div>
  </div>;
}

/** Objectif en cours, avec la distance et une flèche qui le pointe à l'écran. Mises à jour hors rendu React, dix fois par seconde. */
export function CapObjectif({ texte, etiquette, cible, joueur, vue, ouvert, onClick, compacte = false }: {
  texte: string; etiquette?: string; cible: Point2 | null; joueur: MutableRefObject<THREE.Vector3>; vue: MutableRefObject<{ azimut: number }>;
  ouvert: boolean; onClick: () => void; compacte?: boolean;
}) {
  const fleche = useRef<HTMLSpanElement>(null), metres = useRef<HTMLSpanElement>(null);
  const [cx, cz] = cible ?? [NaN, NaN];
  useEffect(() => {
    if (Number.isNaN(cx)) return;
    let image = 0, dernier = -Infinity;
    const suivre = (instant: number) => {
      image = requestAnimationFrame(suivre);
      if (instant - dernier < 100) return;
      dernier = instant;
      const position: Point2 = [joueur.current.x, joueur.current.z];
      if (fleche.current) fleche.current.style.transform = `rotate(${angleEcran(position, [cx, cz], vue.current.azimut)}rad)`;
      if (metres.current) metres.current.textContent = distanceLisible(distance(position, [cx, cz]));
    };
    image = requestAnimationFrame(suivre);
    return () => cancelAnimationFrame(image);
  }, [cx, cz, joueur, vue]);
  // Sur téléphone, la distance prime sur le compteur, déjà visible dans le planning.
  const afficherEtiquette = etiquette && !(compacte && cible);
  return <button type="button" aria-expanded={ouvert} aria-label={`Objectif : ${texte}`} onClick={onClick} className={`hud-verre pointer-events-auto flex min-w-0 max-w-full items-center text-left transition-colors hover:border-jeu-or/50 ${compacte ? 'gap-2 rounded-2xl py-1.5 pl-1.5 pr-2.5' : 'gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5'}`}>
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#EE7A4E,#CF532D)] text-white ${compacte ? 'h-7 w-7' : 'h-8 w-8'}`}>{ICONES.cible}</span>
    <span className="min-w-0">
      <span className="hud-legende block text-[9px]">Objectif</span>
      <span className={`block font-bold leading-tight ${compacte ? 'line-clamp-2 text-[12.5px]' : 'truncate text-[13.5px]'}`}>{texte}</span>
    </span>
    {afficherEtiquette && <span className="hud-chiffre shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[12px]">{etiquette}</span>}
    {cible && <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-bold text-jeu-or">
      <span ref={fleche} className="inline-flex transition-transform duration-150">{ICONES.fleche}</span>
      <span ref={metres} className="hud-chiffre">…</span>
    </span>}
  </button>;
}

/** Heure, météo et vitesse du temps ; sur deux lignes en version compacte. */
export function HorlogeMonde({ heure, meteo, pause, vitesse, vitesses, onPause, onVitesse, compacte = false }: {
  heure: string; meteo: { icone: string; nom: string }; pause: boolean; vitesse: number; vitesses: readonly number[];
  onPause: () => void; onVitesse: (v: number) => void; compacte?: boolean;
}) {
  const reglage = <div role="group" aria-label="Vitesse du temps" className={`flex rounded-full bg-black/30 p-0.5 ${compacte ? 'justify-between' : ''}`}>
    <button type="button" onClick={onPause} aria-pressed={pause} aria-label={pause ? 'Reprendre le temps' : 'Mettre le temps en pause'} className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${pause ? 'bg-jeu-terre text-white' : 'text-jeu-ivoire/70 hover:text-jeu-ivoire'}`}>{ICONES.pause}</button>
    {vitesses.map(v => <button key={v} type="button" onClick={() => onVitesse(v)} aria-pressed={!pause && vitesse === v} aria-label={`Vitesse ${v}x`} className={`hud-chiffre h-7 min-w-7 rounded-full px-1.5 text-[11px] transition-colors ${!pause && vitesse === v ? 'bg-jeu-ivoire text-[#2A1C0E]' : 'text-jeu-ivoire/70 hover:text-jeu-ivoire'}`}>{v}×</button>)}
  </div>;
  const cadran = <>
    <span data-testid="meteo-monde" title={meteo.nom} className="text-[17px] leading-none">{meteo.icone}<span className="sr-only"> {meteo.nom}</span></span>
    <b className="hud-chiffre text-[17px] leading-none">{heure}</b>
  </>;
  if (compacte) return <div className="hud-verre pointer-events-auto flex w-[130px] flex-col gap-1.5 rounded-2xl p-1.5">
    <div className="flex items-center justify-center gap-2 pt-0.5">{cadran}</div>
    {reglage}
  </div>;
  return <div className="hud-verre pointer-events-auto flex items-center gap-2 rounded-full py-1 pl-3 pr-1">{cadran}{reglage}</div>;
}

const BESOINS = [
  { cle: 'faim', label: 'Faim', couleur: '#F08A4B' },
  { cle: 'energie', label: 'Énergie', couleur: '#F2C14E' },
  { cle: 'moral', label: 'Moral', couleur: '#4CC3A5' },
  { cle: 'social', label: 'Social', couleur: '#F07A9A' },
] as const;

/** Les quatre besoins : icône, valeur et barre qui s'illumine quand le besoin devient critique. Sans libellés en version compacte. */
export function JaugesBesoins({ besoins, compacte = false }: { besoins: Record<(typeof BESOINS)[number]['cle'], number>; compacte?: boolean }) {
  return <div role="group" aria-label="Besoins" className={`hud-verre pointer-events-auto grid grid-cols-2 ${compacte ? 'w-[196px] gap-x-2.5 gap-y-2 p-2.5' : 'w-[252px] gap-x-3 gap-y-2.5 p-3'}`}>
    {BESOINS.map(b => {
      const valeur = Math.max(0, Math.min(100, besoins[b.cle]));
      const bas = valeur < 25;
      return <div key={b.cle} role="meter" aria-label={b.label} title={b.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valeur)} className="flex min-w-0 items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] ${bas ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${b.couleur}26`, color: b.couleur }}>{ICONES[b.cle]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-1">
            {!compacte && <span className="truncate text-[10.5px] font-bold text-jeu-ivoire/75">{b.label}</span>}
            <b className="hud-chiffre text-[12px]" style={bas ? { color: b.couleur } : undefined}>{Math.round(valeur)}</b>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${valeur}%`, background: `linear-gradient(90deg, ${b.couleur}99, ${b.couleur})`, boxShadow: bas ? `0 0 8px ${b.couleur}` : undefined }} />
          </div>
        </div>
      </div>;
    })}
  </div>;
}

export type TypeNotification = 'info' | 'succes' | 'alerte' | 'trajet';
export interface NotificationMonde { id: number; texte: string; type: TypeNotification; action?: { label: string; executer: () => void } }

const STYLES_NOTIFICATION: Record<TypeNotification, { couleur: string; icone: ReactNode }> = {
  info: { couleur: '#E8B04A', icone: ICONES.info },
  succes: { couleur: '#4CC3A5', icone: ICONES.etoile },
  alerte: { couleur: '#F08A4B', icone: ICONES.alerte },
  trajet: { couleur: '#E8B04A', icone: ICONES.cible },
};

/** Fil d'événements : découvertes, trajets, missions et besoins urgents, avec une action directe quand c'est utile. */
export function PileNotifications({ notifications, onFermer }: { notifications: NotificationMonde[]; onFermer: (id: number) => void }) {
  return <div aria-live="polite" className="pointer-events-none flex w-full flex-col gap-2">
    {notifications.map(n => {
      const style = STYLES_NOTIFICATION[n.type];
      return <div key={n.id} role={n.type === 'alerte' ? 'alert' : 'status'} className="hud-verre hud-entree pointer-events-auto flex items-start gap-2.5 p-2.5 pr-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${style.couleur}26`, color: style.couleur }}>{style.icone}</span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[12.5px] font-semibold leading-snug">{n.texte}</p>
          {n.action && <button type="button" onClick={() => { n.action!.executer(); onFermer(n.id); }} className="hud-bouton hud-bouton-principal mt-2 px-3 py-1.5 text-[12px]">{n.action.label}</button>}
        </div>
        <button type="button" aria-label="Fermer la notification" onClick={() => onFermer(n.id)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] text-jeu-ivoire/45 hover:bg-white/10 hover:text-jeu-ivoire">✕</button>
      </div>;
    })}
  </div>;
}

/** Bouton rond du HUD (planning, plan, réglages), avec son raccourci clavier dans l'infobulle. */
export function BoutonHud({ libelle, raccourci, actif, onClick, children }: { libelle: string; raccourci?: string; actif?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-label={libelle} aria-expanded={actif} title={raccourci ? `${libelle} (${raccourci})` : libelle} onClick={onClick} className={`hud-verre hud-bouton pointer-events-auto h-10 w-10 rounded-full ${actif ? 'border-jeu-or/70 text-jeu-or' : 'hover:border-jeu-or/50'}`}>{children}</button>;
}
