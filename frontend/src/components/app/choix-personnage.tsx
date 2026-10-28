'use client';

import { useEffect, useRef, useState } from 'react';
import { apparenceSurMesure, ID_SUR_MESURE, IDS_PERSONNAGES, personnageDuChoix, type IdPersonnage } from '@/lib/personnages-joueur';
import { POLICES_JEU } from '@/lib/polices-jeu';
import { gabaritDepuis } from '@/lib/gabarit-personnage';
import { CASQUE_DEFAUT, couleurCasque } from '@/lib/casques';
import { nomValide, ReglagesPersonnage, type ReglagesJoueur } from './reglages-personnage';
import { ScenePersonnage } from './scene-personnage';
import type { FinitionsPersonnage } from './enregistrer-personnage';

// Choisir son personnage : au premier pas dans le monde vivant, puis à tout moment (options du monde, accueil classique).

export { lireChoixDemo, useEnregistrerPersonnage, type ChoixPersonnageJoueur, type FinitionsPersonnage } from './enregistrer-personnage';

export function ChoixPersonnage({ initial, nomInitial, avatarConfig, premierChoix, demo, enCours, erreur, onValider, onAnnuler, brouillon = false }: {
  initial: IdPersonnage; nomInitial: string;
  /** Configuration de l'avatar 2D (dressing compris) : chaque carte montre l'avatar classique avec ce personnage. */
  avatarConfig?: unknown;
  /** Premier pas dans le monde : pas d'annulation, on entre dans le quartier en validant. */
  premierChoix: boolean; demo: boolean; enCours: boolean; erreur: string | null;
  /** L'aperçu valide plus tard et ne sauvegarde jamais. */
  brouillon?: boolean;
  onValider: (personnage: IdPersonnage, nom: string, finitions: FinitionsPersonnage) => void; onAnnuler?: () => void;
}) {
  const [reglages, setReglages] = useState<ReglagesJoueur>(() => ({
    personnage: initial, nom: nomInitial, ...gabaritDepuis(avatarConfig), casque: couleurCasque(avatarConfig) ?? CASQUE_DEFAUT, apparence: apparenceSurMesure(avatarConfig),
  }));
  const dialogue = useRef<HTMLElement>(null);
  const choisi = personnageDuChoix(reglages.personnage, reglages.apparence);
  // Les flèches parcourent les modèles réalistes puis le personnage sur mesure.
  const decaler = (pas: number) => setReglages(r => ({ ...r, personnage: IDS_PERSONNAGES[(IDS_PERSONNAGES.indexOf(r.personnage) + pas + IDS_PERSONNAGES.length) % IDS_PERSONNAGES.length] }));
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
  const valider = () => onValider(reglages.personnage, reglages.nom.trim(), {
    stature: reglages.stature, silhouette: reglages.silhouette, casque: reglages.casque, ...(reglages.personnage === ID_SUR_MESURE ? { apparence: reglages.apparence } : {}),
  });
  return <section ref={dialogue} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choisis ton personnage" className={`fixed inset-0 z-[140] overflow-y-auto bg-[#12282a]/95 text-jeu-ivoire backdrop-blur-sm ${POLICES_JEU} hud-texte`}>
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-start">
      {/* Sur grand écran, le plateau reste en vue et garde sa taille pendant qu'on fait défiler les réglages. */}
      <div className="flex min-h-[340px] flex-1 flex-col lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:min-h-[420px]">
        <p className="hud-legende text-jeu-or">{premierChoix ? 'Bienvenue aux Palmiers' : 'Ton personnage'}</p>
        <h1 className="hud-titre text-2xl leading-tight sm:text-3xl">Choisis ton personnage</h1>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-jeu-ivoire/70">C’est lui qui marche dans le monde vivant : choisis un modèle, ou compose le tien sur mesure. En mode classique, ton avatar prend son teint, ses cheveux, sa barbe et la couleur de son casque ; ta tenue et tes accessoires restent ceux du dressing.</p>
        <div className="relative mt-3 min-h-[250px] flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_35%,#2f4a4c,#162a2c_70%)] lg:min-h-[320px]">
          <ScenePersonnage id={reglages.personnage} apparence={reglages.apparence} gabarit={reglages} couleurCasque={reglages.casque} className="absolute inset-0" />
          <button type="button" aria-label="Personnage précédent" onClick={() => decaler(-1)} className="hud-bouton hud-bouton-verre absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full text-xl">‹</button>
          <button type="button" aria-label="Personnage suivant" onClick={() => decaler(1)} className="hud-bouton hud-bouton-verre absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full text-xl">›</button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
            <p className="hud-titre text-xl">{choisi.titre}</p>
            <p className="text-[12.5px] text-jeu-ivoire/75">{choisi.detail}</p>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 lg:w-[400px] lg:pt-14">
        <ReglagesPersonnage valeur={reglages} onChange={setReglages} avatarConfig={avatarConfig} desactive={enCours} libelleNom="Nom de ton personnage" />
        <p className="text-[11px] text-jeu-ivoire/60">Ton apparence ne détermine pas ton métier. Ces réglages valent dans le monde vivant comme en mode classique.</p>
        <div className="sticky bottom-0 -mx-4 mt-auto space-y-2 border-t border-white/10 bg-[#12282a] px-4 pb-4 pt-3 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          {erreur && <p role="alert" className="text-[12.5px] font-semibold text-[#F08A4B]">{erreur}</p>}
          <button type="button" disabled={!nomValide(reglages.nom) || enCours} onClick={valider} className="hud-bouton hud-bouton-principal w-full p-3 text-sm disabled:opacity-50">
            {enCours ? 'Enregistrement…' : brouillon ? 'Utiliser ce personnage' : premierChoix ? 'Entrer dans le quartier' : 'Garder ce personnage'}
          </button>
          {onAnnuler && <button type="button" onClick={onAnnuler} className="hud-bouton hud-bouton-verre w-full p-2.5 text-[12.5px]">Annuler</button>}
          <p className="text-center text-[11px] text-jeu-ivoire/50">{brouillon ? 'Aperçu du choix : aucun enregistrement depuis cet atelier.' : demo ? 'Démonstration : le choix reste dans ce navigateur.' : 'Enregistré dans ton compte : le même personnage dans les deux modes.'}</p>
        </div>
      </div>
    </div>
  </section>;
}
