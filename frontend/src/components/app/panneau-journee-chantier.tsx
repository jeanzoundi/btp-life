'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TITRES_ETAPES, postesRestants, type BilanJournee, type EtatVisuel, type Journee, type SituationTerrain } from '@/lib/journee-chantier';

export type StatutJournee = 'disponible' | 'en_cours' | 'bilan' | 'resultat' | 'repos' | 'ferme';
export type Recompenses = 'demo' | 'simulateur' | 'apprentissage';
export interface ResultatJournee {
  bilan: BilanJournee; avant: number; apres: number; recompenses: Recompenses;
  evenements?: { type: string; texte: string }[]; erreur?: string; idChantier?: string;
}

function BarreAvancement({ valeur, precedente }: { valeur: number; precedente?: number }) {
  return <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
    {precedente !== undefined && <div className="absolute inset-y-0 left-0 rounded-full bg-jeu-or/35" style={{ width: `${valeur}%` }} />}
    <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#D89A2C,#F3C66A)] transition-[width] duration-1000" style={{ width: `${precedente ?? valeur}%` }} />
  </div>;
}

function Etapes({ journee }: { journee: Journee }) {
  const ordre = ['epi', 'securite', 'livraison', 'bilan'] as const;
  const position = ordre.indexOf(journee.etape);
  const restants = journee.etape === 'securite' ? postesRestants(journee).length : 0;
  return <ol className="mt-3 space-y-1.5">
    {ordre.map((etape, i) => {
      const fait = i < position, courant = i === position;
      return <li key={etape} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold ${courant ? 'bg-jeu-or/[.12] text-jeu-ivoire ring-1 ring-jeu-or/40' : fait ? 'text-jeu-ivoire/55' : 'text-jeu-ivoire/45'}`}>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${fait ? 'bg-jeu-lagune text-[#14261F]' : courant ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/10'}`}>{fait ? '✓' : i + 1}</span>
        <span className="flex-1">{TITRES_ETAPES[etape]}</span>
        {courant && etape === 'securite' && <span className="hud-chiffre text-[12px] text-jeu-or">{3 - restants}/3</span>}
      </li>;
    })}
  </ol>;
}

/** Yao, chef de chantier : consigne du matin, suivi de la journée, bilan et récompenses. */
export function PanneauJourneeChantier({ statut, nomJoueur, nomChantier, etat, simulateur, demo, journee, resultat, enCours, onCommencer, onBilan, onTerminer, onAbandonner, onDiscuter, onFermer }: {
  statut: StatutJournee; nomJoueur: string; nomChantier: string; etat: EtatVisuel; simulateur: boolean; demo: boolean;
  journee: Journee | null; resultat: ResultatJournee | null; enCours: boolean;
  onCommencer: () => void; onBilan: () => void; onTerminer: () => void; onAbandonner: () => void; onDiscuter: () => void; onFermer: () => void;
}) {
  const replique = statut === 'disponible' ? `Bonjour ${nomJoueur} ! Aujourd’hui, ${etat.nom.toLowerCase()} sur ${nomChantier}. Équipe-toi au bungalow, fais le tour de sécurité, puis réceptionne la livraison. Je compte sur toi.`
    : statut === 'en_cours' ? 'On avance bien. Continue, je garde un œil sur l’équipe.'
    : statut === 'bilan' ? 'Te voilà ! Alors, cette journée ? On fait le point ensemble.'
    : statut === 'resultat' ? (resultat && resultat.bilan.note >= 60 ? 'Du bon travail. Le chantier avance grâce à toi.' : 'On apprend de chaque journée. Relis bien mes remarques.')
    : statut === 'repos' ? 'Belle journée ! Va te reposer : on reprend demain, à partir de 6 h.'
    : 'Le chantier est fermé pour aujourd’hui. Reviens entre 6 h et 18 h.';
  return <section role="dialog" aria-label="Journée de travail avec Yao" className="hud-verre absolute inset-x-3 bottom-3 z-20 mx-auto max-h-[75%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[380px]">
    <div className="flex items-center gap-3">
      <span className="hud-titre flex h-12 w-12 items-center justify-center rounded-full bg-[#4f76a1] text-lg text-white ring-2 ring-jeu-or/60">Y</span>
      <div className="flex-1"><h2 className="hud-titre text-lg leading-tight">Yao</h2><p className="text-[12px] font-semibold text-jeu-ivoire/65">Chef de chantier · {nomChantier}</p></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{replique}</p>

    {statut !== 'resultat' && <div className="rounded-xl bg-black/20 p-3">
      <div className="flex items-baseline justify-between gap-2"><span className="hud-legende">Chantier · {etat.nom}</span><b className="hud-chiffre text-sm text-jeu-or">{Math.round(etat.avancement)} %</b></div>
      <BarreAvancement valeur={etat.avancement} />
    </div>}

    {(statut === 'en_cours' || statut === 'bilan') && journee && <Etapes journee={journee} />}

    {statut === 'resultat' && resultat && <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3">
        <div className="text-center"><b className="hud-chiffre block text-[34px] leading-none text-jeu-or">{resultat.bilan.note}</b><span className="text-[10px] font-bold text-jeu-ivoire/55">/ 100</span></div>
        <div><p className="hud-titre text-[15px]">{resultat.bilan.mention}</p><p className="text-[12px] text-jeu-ivoire/65">{resultat.bilan.bonnes} bonnes décisions sur {resultat.bilan.total}</p></div>
      </div>
      <div className="rounded-xl bg-black/20 p-3">
        <div className="flex items-baseline justify-between gap-2"><span className="hud-legende">Avancement du chantier</span><b className="hud-chiffre text-sm text-jeu-or">{Math.round(resultat.avant)} → {Math.round(resultat.apres)} %</b></div>
        <BarreAvancement valeur={resultat.avant} precedente={resultat.apres} />
      </div>
      {resultat.erreur ? <div role="alert" className="rounded-xl border border-jeu-terre/50 bg-jeu-terre/10 p-3 text-[12.5px] leading-relaxed">
        <p className="font-bold text-[#F08A4B]">Le chantier n’a pas pu avancer</p><p className="mt-1 text-jeu-ivoire/80">{resultat.erreur}</p>
        {resultat.idChantier && <Link href={`/app/chantiers/${resultat.idChantier}`} className="mt-2 inline-block font-bold text-jeu-or underline">Gérer le chantier</Link>}
      </div> : resultat.recompenses === 'demo' ? <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-or">+{resultat.bilan.paie.toLocaleString('fr-FR')}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">FCFA de salaire</span></div>
        <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-lagune">+{resultat.bilan.xp}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">points d’expérience</span></div>
        <p className="col-span-2 text-[10.5px] text-jeu-ivoire/50">Démonstration : rien n’est sauvegardé.</p>
      </div> : resultat.recompenses === 'simulateur' ? <div className="rounded-xl bg-black/20 p-3">
        <p className="hud-legende mb-1.5">Journal du chantier</p>
        <ul className="space-y-1 text-[12.5px] leading-snug text-jeu-ivoire/85">{(resultat.evenements ?? []).map((e, i) => <li key={i}>• {e.texte}</li>)}</ul>
        <p className="mt-2 text-[10.5px] text-jeu-ivoire/50">Salaires et matériaux sont décomptés du budget du chantier ; la prime arrive à la livraison.</p>
      </div> : <div className="rounded-xl bg-black/20 p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/80">
        Journée d’apprentissage : le chantier du quartier avance, mais seul ton propre chantier te rapporte un salaire.
        <Link href="/app/chantiers" className="mt-1.5 block font-bold text-jeu-or underline">Démarrer mon chantier</Link>
      </div>}
    </div>}

    <div className="mt-3 space-y-2">
      {statut === 'disponible' && <button onClick={onCommencer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Commencer la journée</button>}
      {statut === 'disponible' && <p className="text-center text-[10.5px] text-jeu-ivoire/50">{simulateur ? `Ta journée fera avancer ton chantier « ${nomChantier} ».` : demo ? 'Démonstration : salaire et expérience non sauvegardés.' : 'Journée d’apprentissage sur le chantier du quartier.'}</p>}
      {statut === 'en_cours' && <button onClick={onFermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Continuer</button>}
      {statut === 'bilan' && <button onClick={onBilan} disabled={enCours} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">{enCours ? 'Calcul de la journée…' : 'Faire le point'}</button>}
      {statut === 'resultat' && <button onClick={onTerminer} className="hud-bouton hud-bouton-or w-full p-3 text-sm">Terminer la journée</button>}
      {statut !== 'resultat' && <button onClick={onDiscuter} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">Discuter avec Yao</button>}
      {(statut === 'en_cours' || statut === 'bilan') && <button onClick={onAbandonner} className="w-full p-1.5 text-[12px] font-semibold text-jeu-ivoire/45 hover:text-jeu-ivoire/80">Interrompre la journée</button>}
    </div>
  </section>;
}

/** Situation de terrain à un poste : trois réponses, un retour expliqué, puis on continue. */
export function TacheChantier({ etape, situation, onRepondre, onFermer }: { etape: string; situation: SituationTerrain; onRepondre: (choix: number) => void; onFermer: () => void }) {
  const [choix, setChoix] = useState<number | null>(null);
  const reponse = choix === null ? null : situation.choix[choix];
  return <section role="dialog" aria-label={`Tâche : ${situation.titre}`} className="hud-verre absolute inset-x-3 bottom-3 z-30 mx-auto max-w-md p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[380px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">{etape}</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{situation.titre}</h2></div>
      {choix === null && <button aria-label="Plus tard" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>}
    </div>
    <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-relaxed">{situation.situation}</p>
    {!reponse ? <div className="mt-3 space-y-2">
      <p className="hud-legende">Que fais-tu ?</p>
      {situation.choix.map((c, i) => <button key={c.texte} onClick={() => { setChoix(i); onRepondre(i); }} className="block w-full rounded-xl border border-white/15 bg-white/[.06] p-3 text-left text-sm font-semibold transition-colors hover:border-jeu-or/50">{c.texte}</button>)}
    </div> : <div className="mt-3 space-y-3">
      <div role="status" className={`rounded-xl border p-3 text-sm leading-relaxed ${reponse.correct ? 'border-jeu-lagune/50 bg-jeu-lagune/10' : 'border-jeu-terre/50 bg-jeu-terre/10'}`}>
        <p className={`font-bold ${reponse.correct ? 'text-jeu-lagune' : 'text-[#F08A4B]'}`}>{reponse.correct ? '✓ Bonne décision' : '✗ Pas la bonne décision'}</p>
        <p className="mt-1 text-jeu-ivoire/85">{reponse.retour}</p>
      </div>
      <button onClick={onFermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Continuer</button>
    </div>}
  </section>;
}
