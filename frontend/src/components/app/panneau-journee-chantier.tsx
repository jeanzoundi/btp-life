'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { phaseJournee, type BilanJournee, type Journee, type SituationTerrain } from '@/lib/journee-chantier';
import { METIERS, PROGRAMME, candidats, evaluerEquipe, type EtatVisuel, type EvaluationEquipe, type Metier, type Ouvrier } from '@/lib/programme-chantier';

export type StatutJournee = 'disponible' | 'en_cours' | 'bilan' | 'resultat' | 'repos' | 'ferme';
export type Recompenses = 'demo' | 'simulateur' | 'apprentissage';
export interface ResultatJournee {
  bilan: BilanJournee; avant: number; apres: number; recompenses: Recompenses;
  /** Étape du jour joué et étape de la prochaine journée. */
  etapeAvant?: string; etapeApres?: string;
  evenements?: { type: string; texte: string }[]; erreur?: string; idChantier?: string;
}

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} F`;

function BarreAvancement({ valeur, precedente }: { valeur: number; precedente?: number }) {
  return <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
    {precedente !== undefined && <div className="absolute inset-y-0 left-0 rounded-full bg-jeu-or/35" style={{ width: `${valeur}%` }} />}
    <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#D89A2C,#F3C66A)] transition-[width] duration-1000" style={{ width: `${precedente ?? valeur}%` }} />
  </div>;
}

/** Frise du programme : chaque étape a la largeur de sa durée, faite, en cours ou à venir. */
export function FriseEtapes({ etat }: { etat: EtatVisuel }) {
  const courante = etat.etape === 'livre' ? PROGRAMME.length : PROGRAMME.findIndex(e => e.id === etat.etape);
  return <div className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`Étape ${Math.min(courante + 1, PROGRAMME.length)} sur ${PROGRAMME.length} : ${etat.nom}`}>
    {PROGRAMME.map((e, i) => <span key={e.id} title={e.nom} className={i < courante ? 'bg-jeu-lagune' : i === courante ? 'bg-jeu-or' : 'bg-white/10'} style={{ flexGrow: e.jours }} />)}
  </div>;
}

function TachesDuJour({ journee }: { journee: Journee }) {
  const phase = phaseJournee(journee);
  return <ol className="mt-3 space-y-1.5">
    {journee.taches.map(t => {
      const faite = journee.reponses[t.id] !== undefined;
      const courante = !faite && (phase === 'travaux' ? t.type !== 'epi' && t.type !== 'recrutement' : t.type === phase);
      return <li key={t.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold ${courante ? 'bg-jeu-or/[.12] text-jeu-ivoire ring-1 ring-jeu-or/40' : faite ? 'text-jeu-ivoire/55' : 'text-jeu-ivoire/45'}`}>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${faite ? 'bg-jeu-lagune text-[#14261F]' : courante ? 'bg-jeu-or text-[#2A1C0E]' : 'bg-white/10'}`}>{faite ? '✓' : ''}</span>
        <span className="flex-1">{t.titre}</span>
      </li>;
    })}
    <li className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold ${phase === 'bilan' ? 'bg-jeu-or/[.12] text-jeu-ivoire ring-1 ring-jeu-or/40' : 'text-jeu-ivoire/45'}`}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px]" /><span className="flex-1">Bilan avec Yao</span>
    </li>
  </ol>;
}

/** Consigne du matin selon l'étape du programme. */
function consigne(etat: EtatVisuel, nomJoueur: string, nomChantier: string) {
  const etape = PROGRAMME.find(e => e.id === etat.etape);
  if (!etape) return `Bonjour ${nomJoueur} ! ${nomChantier} est livré : un nouvel ouvrage démarre bientôt.`;
  if (etape.id === 'recrutement') return `Bonjour ${nomJoueur} ! Jour ${etat.jour} sur ${etat.total} : on démarre ${nomChantier}. D’abord l’équipe : équipe-toi au vestiaire, puis recrute au bureau un chef d’équipe, un maçon, un manœuvre, un ferrailleur et un coffreur.`;
  return `Bonjour ${nomJoueur} ! Jour ${etat.jour} sur ${etat.total} : ${etape.nom.toLowerCase()}. ${etape.resume} Équipe-toi au vestiaire, puis au travail.`;
}

/** Yao, chef de chantier : consigne du matin, suivi de la journée, bilan et récompenses. */
export function PanneauJourneeChantier({ statut, nomJoueur, nomChantier, etat, simulateur, demo, journee, resultat, enCours, onCommencer, onBilan, onTerminer, onAbandonner, onDiscuter, onPlanning, onFermer }: {
  statut: StatutJournee; nomJoueur: string; nomChantier: string; etat: EtatVisuel; simulateur: boolean; demo: boolean;
  journee: Journee | null; resultat: ResultatJournee | null; enCours: boolean;
  onCommencer: () => void; onBilan: () => void; onTerminer: () => void; onAbandonner: () => void; onDiscuter: () => void; onPlanning?: () => void; onFermer: () => void;
}) {
  const replique = statut === 'disponible' ? consigne(etat, nomJoueur, nomChantier)
    : statut === 'en_cours' ? 'On avance bien. Continue, je garde un œil sur l’équipe.'
    : statut === 'bilan' ? 'Te voilà ! Alors, cette journée ? On fait le point ensemble.'
    : statut === 'resultat' ? (resultat && !resultat.bilan.compte ? 'Ce travail est à reprendre : on refera cette journée demain. Relis bien mes remarques.' : resultat && resultat.bilan.note >= 60 ? 'Du bon travail. Le chantier avance grâce à toi.' : 'C’est passable. On apprend de chaque journée.')
    : statut === 'repos' ? 'Belle journée ! Va te reposer : on reprend demain, à partir de 6 h.'
    : 'Le chantier est fermé pour aujourd’hui. Reviens entre 6 h et 18 h.';
  return <section role="dialog" aria-label="Journée de travail avec Yao" className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[78%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[390px]">
    <div className="flex items-center gap-3">
      <span className="hud-titre flex h-12 w-12 items-center justify-center rounded-full bg-[#4f76a1] text-lg text-white ring-2 ring-jeu-or/60">Y</span>
      <div className="flex-1"><h2 className="hud-titre text-lg leading-tight">Yao</h2><p className="text-[12px] font-semibold text-jeu-ivoire/65">Chef de chantier · {nomChantier}</p></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{replique}</p>

    {statut !== 'resultat' && <div className="rounded-xl bg-black/20 p-3">
      <div className="flex items-baseline justify-between gap-2"><span className="hud-legende">{simulateur ? 'Chantier' : `Jour ${etat.jour} / ${etat.total}`} · {etat.nom}</span><b className="hud-chiffre text-sm text-jeu-or">{Math.round(etat.avancement)} %</b></div>
      {simulateur ? <BarreAvancement valeur={etat.avancement} /> : <FriseEtapes etat={etat} />}
    </div>}

    {(statut === 'en_cours' || statut === 'bilan') && journee && <TachesDuJour journee={journee} />}

    {statut === 'resultat' && resultat && <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3">
        <div className="text-center"><b className="hud-chiffre block text-[34px] leading-none text-jeu-or">{resultat.bilan.note}</b><span className="text-[10px] font-bold text-jeu-ivoire/55">/ 100</span></div>
        <div><p className="hud-titre text-[15px]">{resultat.bilan.mention}</p><p className="text-[12px] text-jeu-ivoire/65">{resultat.bilan.bonnes} bonnes décisions sur {resultat.bilan.total}</p></div>
      </div>
      <div className="rounded-xl bg-black/20 p-3">
        <div className="flex items-baseline justify-between gap-2"><span className="hud-legende">Avancement du chantier</span><b className="hud-chiffre text-sm text-jeu-or">{Math.round(resultat.avant)} → {Math.round(resultat.apres)} %</b></div>
        <BarreAvancement valeur={resultat.avant} precedente={resultat.apres} />
        {resultat.etapeApres && <p className="mt-2 text-[12px] leading-snug text-jeu-ivoire/75">{!resultat.bilan.compte ? `Journée à refaire : ${resultat.etapeAvant?.toLowerCase()} reprend demain.` : resultat.etapeApres === resultat.etapeAvant ? `Demain : ${resultat.etapeApres.toLowerCase()}, suite.` : `Étape suivante : ${resultat.etapeApres.toLowerCase()}.`}</p>}
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
      {statut !== 'resultat' && !simulateur && onPlanning && <button onClick={onPlanning} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">📋 Planning et équipe</button>}
      {statut !== 'resultat' && <button onClick={onDiscuter} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">Discuter avec Yao</button>}
      {(statut === 'en_cours' || statut === 'bilan') && <button onClick={onAbandonner} className="w-full p-1.5 text-[12px] font-semibold text-jeu-ivoire/45 hover:text-jeu-ivoire/80">Interrompre la journée</button>}
    </div>
  </section>;
}

/** Situation de terrain à un poste : trois réponses, un retour expliqué, puis on continue. */
export function TacheChantier({ etape, situation, onRepondre, onFermer }: { etape: string; situation: SituationTerrain; onRepondre: (choix: number) => void; onFermer: () => void }) {
  const [choix, setChoix] = useState<number | null>(null);
  const reponse = choix === null ? null : situation.choix[choix];
  return <section role="dialog" aria-label={`Tâche : ${situation.titre}`} className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-w-md p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[390px]">
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

/** Recrutement au bureau de chantier : un candidat par métier, dans le budget journalier, en évitant les profils à risque. */
export function PanneauRecrutement({ graine, metiers, budget, onValider, onFermer }: {
  graine: number; metiers: Metier[]; budget: number;
  onValider: (choisis: Ouvrier[], evaluation: EvaluationEquipe) => void; onFermer: () => void;
}) {
  const liste = useMemo(() => candidats(graine, metiers), [graine, metiers]);
  const [choix, setChoix] = useState<Partial<Record<Metier, string>>>({});
  const [evaluation, setEvaluation] = useState<EvaluationEquipe | null>(null);
  const choisis = liste.filter(o => choix[o.metier] === o.id);
  const masse = choisis.reduce((n, o) => n + o.salaire, 0);
  const complet = metiers.every(m => choix[m]);
  const valider = () => { const e = evaluerEquipe(choisis, metiers, budget); setEvaluation(e); onValider(choisis, e); };
  return <section role="dialog" aria-label="Recrutement de l’équipe" className="hud-verre absolute inset-x-3 bottom-3 top-24 z-40 mx-auto flex max-w-xl flex-col p-4 sm:left-auto sm:right-3 sm:top-5 sm:mx-0 sm:w-[460px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">Bureau de chantier · recrutement</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">Constituer l’équipe</h2></div>
      {!evaluation && <button aria-label="Plus tard" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>}
    </div>
    <div className="mt-2 rounded-xl bg-black/20 p-3">
      <div className="flex items-baseline justify-between gap-2 text-[12.5px]"><span className="font-semibold text-jeu-ivoire/75">Masse salariale du jour</span><b className={`hud-chiffre ${masse > budget ? 'text-[#F08A4B]' : 'text-jeu-or'}`}>{fcfa(masse)} / {fcfa(budget)}</b></div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${masse > budget ? 'bg-jeu-terre' : 'bg-[linear-gradient(90deg,#D89A2C,#F3C66A)]'}`} style={{ width: `${Math.min(100, masse / budget * 100)}%` }} /></div>
    </div>
    {!evaluation ? <>
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {metiers.map(metier => <fieldset key={metier}>
          <legend className="hud-legende mb-1.5">{METIERS[metier].icone} {metier} · {fcfa(METIERS[metier].salaire)} / jour en moyenne</legend>
          <div className="space-y-1.5">{liste.filter(o => o.metier === metier).map(o => {
            const pris = choix[metier] === o.id;
            return <label key={o.id} className={`relative block cursor-pointer rounded-xl border p-2.5 text-[12.5px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-jeu-or ${pris ? 'border-jeu-or/70 bg-jeu-or/[.12]' : 'border-white/15 bg-white/[.04] hover:border-jeu-or/40'}`}>
              <input type="radio" name={metier} className="sr-only" checked={pris} onChange={() => setChoix(c => ({ ...c, [metier]: o.id }))} />
              <span className="flex items-baseline justify-between gap-2"><b className="text-[13.5px]">{o.nom}</b><span className="hud-chiffre text-jeu-or">{fcfa(o.salaire)}</span></span>
              <span className="mt-0.5 block text-jeu-ivoire/65">{o.experience ? `${o.experience} an${o.experience > 1 ? 's' : ''} d’expérience` : 'Premier chantier'} · compétence {o.competence}/100</span>
              <span className="mt-1 block text-jeu-lagune">+ {o.atout}</span>
              {o.defaut && <span className="block text-[#F08A4B]">− {o.defaut}</span>}
            </label>;
          })}</div>
        </fieldset>)}
      </div>
      <button disabled={!complet} onClick={valider} className="hud-bouton hud-bouton-principal mt-3 w-full p-3 text-sm">{complet ? 'Embaucher cette équipe' : `Choisis un candidat par métier (${Object.keys(choix).length}/${metiers.length})`}</button>
    </> : <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div role="status" className={`min-h-0 flex-1 overflow-y-auto rounded-xl border p-3 text-sm leading-relaxed ${evaluation.note >= .8 ? 'border-jeu-lagune/50 bg-jeu-lagune/10' : 'border-jeu-terre/50 bg-jeu-terre/10'}`}>
        <p className={`font-bold ${evaluation.note >= .8 ? 'text-jeu-lagune' : 'text-[#F08A4B]'}`}>{evaluation.note >= .8 ? '✓ Bonne équipe' : '✗ Équipe à revoir'} · {Math.round(evaluation.note * 100)}/100</p>
        <ul className="mt-1.5 space-y-1 text-jeu-ivoire/85">{evaluation.remarques.map(r => <li key={r}>• {r}</li>)}</ul>
      </div>
      <button onClick={onFermer} className="hud-bouton hud-bouton-principal mt-3 w-full p-3 text-sm">Continuer</button>
    </div>}
  </section>;
}

/** Planning complet du chantier et équipe : chaque étape avec sa durée et ses métiers, faite, en cours ou à venir. */
export function PanneauPlanning({ etat, equipe, onFermer }: { etat: EtatVisuel; equipe: readonly Ouvrier[]; onFermer: () => void }) {
  const courante = etat.etape === 'livre' ? PROGRAMME.length : PROGRAMME.findIndex(e => e.id === etat.etape);
  let debut = 1;
  return <section role="dialog" aria-label="Planning du chantier" className="hud-verre absolute inset-x-3 bottom-3 top-24 z-40 mx-auto flex max-w-xl flex-col p-4 sm:left-auto sm:right-3 sm:top-5 sm:mx-0 sm:w-[430px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">Planning du chantier</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{etat.etape === 'livre' ? 'Ouvrage livré' : `Jour ${etat.jour} sur ${etat.total}`}</h2></div>
      <button aria-label="Fermer le planning" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <FriseEtapes etat={etat} />
    <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      <ol className="space-y-1.5">{PROGRAMME.map((e, i) => {
        const jours = `J${debut}${e.jours > 1 ? `–${debut + e.jours - 1}` : ''}`;
        debut += e.jours;
        const statut = i < courante ? 'fait' : i === courante ? 'courant' : 'avenir';
        return <li key={e.id} className={`rounded-xl px-3 py-2 ${statut === 'courant' ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'bg-white/[.03]'}`}>
          <div className="flex items-baseline gap-2 text-[13px] font-bold"><span className={`hud-chiffre w-12 shrink-0 text-[11px] ${statut === 'fait' ? 'text-jeu-lagune' : statut === 'courant' ? 'text-jeu-or' : 'text-jeu-ivoire/45'}`}>{jours}</span><span className={`flex-1 ${statut === 'avenir' ? 'text-jeu-ivoire/60' : ''}`}>{e.nom}</span><span className="text-[11px]">{statut === 'fait' ? '✓' : statut === 'courant' ? 'en cours' : `${e.jours} j`}</span></div>
          {statut === 'courant' && <p className="ml-14 mt-1 text-[11.5px] leading-snug text-jeu-ivoire/70">{e.resume}</p>}
          {e.metiers.length > 0 && <p className="ml-14 mt-0.5 text-[10.5px] text-jeu-ivoire/45">{e.metiers.join(' · ')}</p>}
        </li>;
      })}</ol>
      <section aria-label="Équipe">
        <p className="hud-legende mb-1.5">Équipe · {equipe.length} ouvrier{equipe.length > 1 ? 's' : ''}</p>
        {equipe.length ? <ul className="space-y-1">{equipe.map(o => <li key={o.id} className="flex items-baseline justify-between gap-2 rounded-lg bg-white/[.04] px-3 py-1.5 text-[12.5px]"><span><b>{o.nom}</b> · {o.metier}{!o.fiable && <span className="text-[#F08A4B]"> · à surveiller</span>}</span><span className="hud-chiffre text-jeu-ivoire/70">{fcfa(o.salaire)}</span></li>)}
          <li className="flex justify-between px-3 pt-1 text-[12px] font-bold"><span>Masse salariale du jour</span><span className="hud-chiffre text-jeu-or">{fcfa(equipe.reduce((n, o) => n + o.salaire, 0))}</span></li>
        </ul> : <p className="text-[12.5px] text-jeu-ivoire/65">Personne pour l’instant : le premier jour sert à recruter l’équipe.</p>}
      </section>
    </div>
  </section>;
}
