'use client';

import { useState } from 'react';
import { ordreChoix } from '@/lib/programme-chantier';
import { TacheChantier } from './panneau-journee-chantier';
import {
  lireNombre, scoreMesure, scoreSelection, scoreSituation, tachesRestantes,
  type BilanSeance, type ContenuTache, type GainsSeance, type ProgrammeLieu, type ProgresLieu, type SeanceLieu, type TacheMesure, type TacheSelection,
} from '@/lib/programme-lieu';

export type StatutSeance = 'disponible' | 'en_cours' | 'bilan' | 'resultat' | 'repos' | 'ferme';
export interface ResultatSeance {
  bilan: BilanSeance; etapeAvant: string; etapeApres: string; cycleBoucle: boolean;
  /** Démonstration (rien n'est versé), apprentissage (connecté mais serveur injoignable), ou gains versés par le serveur. */
  recompenses: 'demo' | 'apprentissage' | 'serveur';
  gains?: GainsSeance; erreur?: string;
}

const heureReelle = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Ce que la séance a rapporté : montants de démonstration, gains réels du serveur, ou la raison d'un échec d'enregistrement. */
function GainsResultat({ resultat }: { resultat: ResultatSeance }) {
  const { bilan, gains, erreur } = resultat;
  if (erreur) return <div role="alert" className="rounded-xl border border-jeu-terre/50 bg-jeu-terre/10 p-3 text-[12.5px] leading-relaxed">
    <p className="font-bold text-[#F08A4B]">Séance non enregistrée</p><p className="mt-1 text-jeu-ivoire/80">{erreur}</p>
  </div>;
  if (resultat.recompenses === 'apprentissage') return <p className="rounded-xl bg-black/20 p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/75">Serveur injoignable : séance gardée dans ce navigateur, sans gains pour l’instant.</p>;
  const argent = gains ? gains.argent : bilan.paie, xp = gains ? gains.xp : bilan.xp;
  return <div className="grid grid-cols-2 gap-2 text-center">
    <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-or">+{argent.toLocaleString('fr-FR')}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">FCFA</span></div>
    <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-lagune">+{xp}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">points d’expérience</span></div>
    {gains && gains.reputation > 0 && <p className="col-span-2 text-[12px] font-semibold text-jeu-or">+{gains.reputation} de réputation{resultat.cycleBoucle ? ' : cycle bouclé' : ''}</p>}
    {gains?.competence && <p className="col-span-2 rounded-lg bg-jeu-lagune/10 px-2 py-1.5 text-[12px] font-semibold text-jeu-lagune">Compétence « {gains.competence.nom} » : +{gains.competence.xp} XP</p>}
    {gains?.equipe && <p className="col-span-2 rounded-lg bg-jeu-or/10 px-2 py-1.5 text-[12px] font-semibold text-jeu-or">🤝 Travail d’équipe avec {gains.equipe.coequipiers.join(', ')} : +{Math.round(gains.equipe.bonus * 100)} % d’XP</p>}
    {gains?.entrainement && <p className="col-span-2 text-[11px] leading-snug text-jeu-ivoire/65">Entraînement : la progression avance, mais une seule séance est payée ici toutes les 20 minutes. Prochaine séance payée vers {heureReelle(gains.prochaineRecompenseLe)}.</p>}
    {gains && gains.facteurBesoins < .99 && <p className="col-span-2 text-[11px] leading-snug text-jeu-ivoire/65">Forme du moment : {Math.round(gains.facteurBesoins * 100)} % de l’XP. Mange, dors et vois du monde pour tout gagner.</p>}
    {!gains && <p className="col-span-2 text-[10.5px] text-jeu-ivoire/50">Démonstration : salaire et expérience non sauvegardés.</p>}
  </div>;
}

/** Heure lisible : 7,5 → « 7 h 30 ». */
export const heureLisible = (h: number) => `${Math.floor(h)} h${h % 1 ? ` ${String(Math.round(h % 1 * 60)).padStart(2, '0')}` : ''}`;

/** Pastille d'une tâche de la séance : à faire, réussie (80 et plus, comme au bilan), à moitié, ou manquée. */
export function PastilleTache({ score, petite = false }: { score?: number; petite?: boolean }) {
  const etat = score === undefined ? null : score >= 80 ? 'reussie' : score >= 40 ? 'partielle' : 'manquee';
  return <span role="img" aria-label={etat === null ? 'à faire' : etat === 'reussie' ? 'réussie' : etat === 'partielle' ? 'à moitié réussie' : 'manquée'}
    className={`flex shrink-0 items-center justify-center rounded-full ${petite ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-[11px]'} ${etat === null ? 'bg-jeu-or text-[#2A1C0E]' : etat === 'reussie' ? 'bg-jeu-lagune text-[#14261F]' : etat === 'partielle' ? 'bg-jeu-or/60 text-[#2A1C0E]' : 'bg-[#E2653C] text-white'}`}>
    {etat === null ? '' : etat === 'reussie' ? '✓' : etat === 'partielle' ? '≈' : '✗'}
  </span>;
}

/** Frise du programme : une case par étape, faite, en cours ou à venir. */
export function FriseLieu({ programme, etape }: { programme: ProgrammeLieu; etape: number }) {
  return <div className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`Étape ${Math.min(etape + 1, programme.etapes.length)} sur ${programme.etapes.length}`}>
    {programme.etapes.map((e, i) => <span key={e.id} title={e.nom} className={`flex-1 ${i < etape ? 'bg-jeu-lagune' : i === etape ? 'bg-jeu-or' : 'bg-white/10'}`} />)}
  </div>;
}

function consigne(p: ProgrammeLieu, nomJoueur: string, etape: number, cycle: number) {
  const e = p.etapes[etape];
  const nouveau = etape === 0 && cycle > 0 ? `Nouvelle ${p.cycle}, nouveaux chiffres. ` : '';
  return `Bonjour ${nomJoueur} ! ${nouveau}${p.titre}, étape ${etape + 1} sur ${p.etapes.length} : ${e.nom.toLowerCase()}. ${e.resume}`;
}

/** Le mentor du lieu : consigne de l'étape, suivi de la séance, bilan. */
export function PanneauMentor({ programme, statut, nomJoueur, etape, cycle, seance, resultat, demo, enregistrement = false, filRouge = null, onCommencer, onBilan, onTerminer, onAbandonner, onProgramme, onAttendre, onFermer }: {
  programme: ProgrammeLieu; statut: StatutSeance; nomJoueur: string; etape: number; cycle: number; seance: SeanceLieu | null; resultat: ResultatSeance | null; demo: boolean;
  /** Bilan envoyé au serveur, réponse attendue. */
  enregistrement?: boolean;
  /** Un chapitre du fil rouge attend chez ce mentor : il le rappelle en tête du panneau. */
  filRouge?: { libelle: string; onOuvrir: () => void } | null;
  onCommencer: () => void; onBilan: () => void; onTerminer: () => void; onAbandonner: () => void; onProgramme: () => void; onAttendre?: () => void; onFermer: () => void;
}) {
  const { mentor, horaires } = programme;
  const replique = statut === 'disponible' ? consigne(programme, nomJoueur, etape, cycle)
    : statut === 'en_cours' ? 'Prends ton temps : chaque poste est signalé par une balise. Reviens me voir quand tout est fait.'
    : statut === 'bilan' ? 'C’est fait ? Voyons ce que ça donne.'
    : statut === 'resultat' ? (resultat?.erreur ? 'Ton travail est fait, mais je n’ai pas pu l’inscrire au registre. On le refera ensemble.' : !resultat?.bilan.compte ? 'Il faudra reprendre cette étape demain : relis bien les explications.' : resultat.bilan.note === 100 ? 'Sans faute. Travail rigoureux, on continue demain.' : resultat.bilan.note >= 60 ? 'Bon travail. Relis l’explication de ce qui a coincé ; on continue demain.' : 'C’est juste suffisant. On continue, mais reste attentif.')
    : statut === 'repos' ? `C’est tout pour aujourd’hui. Reviens demain, à partir de ${heureLisible(horaires.ouverture)}.`
    : `Nous sommes fermés. Reviens entre ${heureLisible(horaires.ouverture)} et ${heureLisible(horaires.fermeture)}.`;
  return <section role="dialog" aria-label={`${mentor.nom}, ${mentor.role}`} className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[78%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[390px]">
    <div className="flex items-center gap-3">
      <span className="hud-titre flex h-12 w-12 items-center justify-center rounded-full bg-[#4f8a7f] text-lg text-white ring-2 ring-jeu-or/60">{mentor.nom[0]}</span>
      <div className="flex-1"><h2 className="hud-titre text-lg leading-tight">{mentor.nom}</h2><p className="text-[12px] font-semibold text-jeu-ivoire/65">{mentor.role}</p></div>
      <button aria-label="Fermer" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    {filRouge && statut !== 'resultat' && <button onClick={filRouge.onOuvrir} className="mt-3 flex w-full items-center gap-2.5 rounded-xl bg-jeu-or/[.14] px-3 py-2.5 text-left ring-1 ring-jeu-or/50 hover:bg-jeu-or/25">
      <span aria-hidden="true" className="text-lg">📜</span>
      <span className="min-w-0 flex-1"><span className="hud-legende block text-jeu-or">Fil rouge · Résidence Akwaba</span><span className="block truncate text-[13px] font-bold">{filRouge.libelle}</span></span>
      <span className="text-[12px] font-bold text-jeu-or">Ouvrir →</span>
    </button>}
    <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{replique}</p>
    {statut !== 'resultat' && <div className="rounded-xl bg-black/20 p-3">
      <div className="flex items-baseline justify-between gap-2"><span className="hud-legende">{programme.titre} · {programme.cycle} {cycle + 1}</span><b className="hud-chiffre text-sm text-jeu-or">{Math.min(etape + 1, programme.etapes.length)}/{programme.etapes.length}</b></div>
      <FriseLieu programme={programme} etape={etape} />
    </div>}
    {(statut === 'en_cours' || statut === 'bilan') && seance && <ol className="mt-3 space-y-1.5">
      {seance.taches.map(t => {
        const faite = seance.scores[t.id] !== undefined;
        return <li key={t.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold ${faite ? 'text-jeu-ivoire/55' : 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40'}`}>
          <PastilleTache score={seance.scores[t.id]} /><span className="flex-1">{t.titre}</span>
        </li>;
      })}
    </ol>}
    {statut === 'resultat' && resultat && <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3">
        <div className="text-center"><b className="hud-chiffre block text-[34px] leading-none text-jeu-or">{resultat.bilan.note}</b><span className="text-[10px] font-bold text-jeu-ivoire/55">/ 100</span></div>
        <div><p className="hud-titre text-[15px]">{resultat.bilan.mention}</p><p className="text-[12px] text-jeu-ivoire/65">{resultat.bilan.reussies} tâche{resultat.bilan.reussies > 1 ? 's' : ''} réussie{resultat.bilan.reussies > 1 ? 's' : ''} sur {resultat.bilan.total}</p></div>
      </div>
      {!resultat.erreur && <p className="rounded-xl bg-black/20 p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/80">{!resultat.bilan.compte ? `${resultat.etapeAvant} : à reprendre demain.` : resultat.cycleBoucle ? `${programme.titre} : ${programme.cycle} bouclée ! La prochaine reprendra du début, avec d’autres chiffres.` : `Étape validée. Demain : ${resultat.etapeApres.toLowerCase()}.`}</p>}
      <GainsResultat resultat={resultat} />
    </div>}
    <div className="mt-3 space-y-2">
      {statut === 'disponible' && <button onClick={onCommencer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Commencer la séance</button>}
      {statut === 'disponible' && <p className="text-center text-[10.5px] text-jeu-ivoire/50">{demo ? 'Démonstration : progression gardée dans ce navigateur.' : 'Séance payée selon ta note et ta forme : jusqu’à 2 000 F et 50 XP.'}</p>}
      {statut === 'en_cours' && <button onClick={onFermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Continuer</button>}
      {statut === 'bilan' && <button onClick={onBilan} disabled={enregistrement} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">{enregistrement ? 'Enregistrement de la séance…' : 'Faire le bilan'}</button>}
      {statut === 'resultat' && <button onClick={onTerminer} className="hud-bouton hud-bouton-or w-full p-3 text-sm">Terminer la séance</button>}
      {(statut === 'repos' || statut === 'ferme') && onAttendre && <button onClick={onAttendre} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">⏭ {statut === 'repos' ? 'Revenir demain' : 'Attendre l’ouverture'} · {heureLisible(horaires.ouverture)}</button>}
      {statut !== 'resultat' && <button onClick={onProgramme} className="hud-bouton hud-bouton-verre w-full justify-start p-3 text-left text-sm">📋 Programme complet</button>}
      {(statut === 'en_cours' || statut === 'bilan') && <button onClick={onAbandonner} className="w-full p-1.5 text-[12px] font-semibold text-jeu-ivoire/45 hover:text-jeu-ivoire/80">Interrompre la séance</button>}
    </div>
  </section>;
}

/** Une tâche du lieu, quel que soit son type : situation, mesure à calculer ou pièces à choisir. */
export function TacheLieu({ etape, contenu, onScore, onFermer, onReponse }: { etape: string; contenu: ContenuTache; onScore: (score: number) => void; onFermer: () => void; onReponse?: (reponse: number | number[]) => void }) {
  if (contenu.type === 'situation') return <TacheChantier etape={etape} situation={contenu.situation} onRepondre={choix => { onReponse?.(choix); onScore(scoreSituation(contenu.situation, choix)); }} onFermer={onFermer} />;
  if (contenu.type === 'mesure') return <TacheMesureLieu etape={etape} mesure={contenu.mesure} onScore={onScore} onReponse={onReponse} onFermer={onFermer} />;
  return <TacheSelectionLieu etape={etape} selection={contenu.selection} onScore={onScore} onReponse={onReponse} onFermer={onFermer} />;
}

const nombre = (n: number, unite: string) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unite}`;

export function TacheMesureLieu({ etape, mesure, onScore, onFermer, onReponse }: { etape: string; mesure: TacheMesure; onScore: (score: number) => void; onFermer: () => void; onReponse?: (reponse: number) => void }) {
  const [saisie, setSaisie] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const valeur = lireNombre(saisie.replace('−', '-'));
  const valider = () => { if (!Number.isFinite(valeur) || saisie.trim() === '') return; const s = scoreMesure(mesure, valeur); setScore(s); onReponse?.(valeur); onScore(s); };
  return <section role="dialog" aria-label={`Mesure : ${mesure.titre}`} className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-w-md p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[390px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">{etape} · mesure</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{mesure.titre}</h2></div>
      {score === null && <button aria-label="Plus tard" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>}
    </div>
    <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-relaxed">{mesure.enonce}</p>
    <dl className="mt-2 divide-y divide-white/10 rounded-xl bg-black/15 px-3 text-[13px]">{mesure.donnees.map(d => <div key={d.libelle} className="flex justify-between gap-3 py-1.5"><dt className="text-jeu-ivoire/65">{d.libelle}</dt><dd className="hud-chiffre text-right">{d.valeur}</dd></div>)}</dl>
    {score === null ? <form className="mt-3" onSubmit={e => { e.preventDefault(); valider(); }}>
      <label className="hud-legende block" htmlFor="reponse-mesure">{mesure.question}</label>
      <div className="mt-1.5 flex gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-white/15 bg-white/[.06] pr-3 focus-within:border-jeu-or/60">
          <input id="reponse-mesure" inputMode="decimal" autoComplete="off" value={saisie} onChange={e => setSaisie(e.target.value)} className="hud-chiffre w-full bg-transparent p-3 text-base outline-none" placeholder="Ta réponse" />
          <span className="whitespace-nowrap text-sm text-jeu-ivoire/60">{mesure.unite}</span>
        </div>
        <button type="submit" disabled={!saisie.trim() || !Number.isFinite(valeur)} className="hud-bouton hud-bouton-principal px-4 text-sm">Valider</button>
      </div>
    </form> : <div className="mt-3 space-y-3">
      <div role="status" className={`rounded-xl border p-3 text-sm leading-relaxed ${score === 100 ? 'border-jeu-lagune/50 bg-jeu-lagune/10' : score ? 'border-jeu-or/50 bg-jeu-or/10' : 'border-jeu-terre/50 bg-jeu-terre/10'}`}>
        <p className={`font-bold ${score === 100 ? 'text-jeu-lagune' : score ? 'text-jeu-or' : 'text-[#F08A4B]'}`}>{score === 100 ? '✓ Juste' : score ? '≈ Presque : vérifie l’arrondi ou l’unité' : '✗ Pas tout à fait'}</p>
        <p className="mt-1 text-jeu-ivoire/85">Ta réponse : {nombre(valeur, mesure.unite)} · attendu : {nombre(mesure.reponse, mesure.unite)}</p>
        <p className="mt-1 text-jeu-ivoire/85">{mesure.explication}</p>
      </div>
      <button onClick={onFermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Continuer</button>
    </div>}
  </section>;
}

export function TacheSelectionLieu({ etape, selection, onScore, onFermer, onReponse }: { etape: string; selection: TacheSelection; onScore: (score: number) => void; onFermer: () => void; onReponse?: (reponse: number[]) => void }) {
  const [coches, setCoches] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const basculer = (i: number) => setCoches(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
  const valider = () => { const s = scoreSelection(selection, coches); setScore(s); onReponse?.([...coches]); onScore(s); };
  return <section role="dialog" aria-label={`Sélection : ${selection.titre}`} className="hud-verre absolute inset-x-3 bottom-3 top-24 z-40 mx-auto flex max-w-md flex-col p-4 sm:left-auto sm:right-3 sm:top-5 sm:mx-0 sm:w-[410px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">{etape}</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{selection.titre}</h2></div>
      {score === null && <button aria-label="Plus tard" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>}
    </div>
    <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm leading-relaxed">{selection.enonce}</p>
    <p className="hud-legende mt-3">{selection.consigne}</p>
    <ul className="mt-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{ordreChoix({ id: selection.titre, choix: selection.options }).map(i => {
      const o = selection.options[i], coche = coches.includes(i);
      const etat = score === null ? null : o.attendu && coche ? 'juste' : !o.attendu && coche ? 'intrus' : o.attendu ? 'oubli' : 'ecarte';
      return <li key={o.texte}><label className={`relative flex cursor-pointer gap-2.5 rounded-xl border p-2.5 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-jeu-or ${etat === 'juste' ? 'border-jeu-lagune/60 bg-jeu-lagune/10' : etat === 'intrus' ? 'border-jeu-terre/60 bg-jeu-terre/10' : etat === 'oubli' ? 'border-jeu-or/60 bg-jeu-or/10' : coche ? 'border-jeu-or/70 bg-jeu-or/[.12]' : 'border-white/15 bg-white/[.04] hover:border-jeu-or/40'}`}>
        <input type="checkbox" className="sr-only" checked={coche} disabled={score !== null} onChange={() => basculer(i)} />
        <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${coche ? 'border-jeu-or bg-jeu-or text-[#2A1C0E]' : 'border-white/30'}`}>{coche ? '✓' : ''}</span>
        <span className="flex-1"><span className="font-semibold">{o.texte}</span>
          {etat && <span className={`mt-0.5 block text-[12px] ${etat === 'juste' ? 'text-jeu-lagune' : etat === 'intrus' ? 'text-[#F08A4B]' : etat === 'oubli' ? 'text-jeu-or' : 'text-jeu-ivoire/55'}`}>{etat === 'juste' ? '✓ ' : etat === 'intrus' ? '✗ ' : etat === 'oubli' ? 'Oublié : ' : ''}{o.explication}</span>}
        </span>
      </label></li>;
    })}</ul>
    {score === null ? <button disabled={!coches.length} onClick={valider} className="hud-bouton hud-bouton-principal mt-3 w-full p-3 text-sm">Valider ({coches.length} coché{coches.length > 1 ? 's' : ''})</button>
      : <div className="mt-3 space-y-2">
        <p role="status" className={`text-center text-sm font-bold ${score === 100 ? 'text-jeu-lagune' : score >= 50 ? 'text-jeu-or' : 'text-[#F08A4B]'}`}>{score === 100 ? '✓ Sélection parfaite' : `Sélection à ${score} %`}</p>
        <button onClick={onFermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Continuer</button>
      </div>}
  </section>;
}

/** Programme complet du lieu : les étapes faites, en cours, à venir, et les cycles déjà bouclés. */
export function PanneauProgrammeLieu({ programme, progres, seance, onFermer }: { programme: ProgrammeLieu; progres: ProgresLieu; seance: SeanceLieu | null; onFermer: () => void }) {
  const courante = seance?.slug === programme.slug ? seance.etape : progres.etapes >= programme.etapes.length ? 0 : progres.etapes;
  const restantes = seance?.slug === programme.slug ? tachesRestantes(seance).length : null;
  return <section role="dialog" aria-label={`Programme : ${programme.titre}`} className="hud-verre absolute inset-x-3 bottom-3 top-24 z-40 mx-auto flex max-w-md flex-col p-4 sm:left-auto sm:right-3 sm:top-5 sm:mx-0 sm:w-[410px]">
    <div className="flex items-start justify-between gap-3">
      <div><p className="hud-legende text-jeu-or">Programme · {programme.mentor.nom}</p><h2 className="hud-titre mt-0.5 text-xl leading-tight">{programme.titre}</h2></div>
      <button aria-label="Fermer le programme" onClick={onFermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    <p className="mt-1 text-[12px] text-jeu-ivoire/65">{progres.cycles ? `${progres.cycles} ${programme.cycle}${progres.cycles > 1 ? 's' : ''} bouclée${progres.cycles > 1 ? 's' : ''} · ` : ''}une séance par jour, de {heureLisible(programme.horaires.ouverture)} à {heureLisible(programme.horaires.fermeture)}</p>
    <FriseLieu programme={programme} etape={courante} />
    <ol className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">{programme.etapes.map((e, i) => {
      const statut = i < courante ? 'fait' : i === courante ? 'courant' : 'avenir';
      return <li key={e.id} className={`rounded-xl px-3 py-2 ${statut === 'courant' ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : 'bg-white/[.03]'}`}>
        <div className="flex items-baseline gap-2 text-[13px] font-bold"><span className={`hud-chiffre w-6 shrink-0 text-[11px] ${statut === 'fait' ? 'text-jeu-lagune' : statut === 'courant' ? 'text-jeu-or' : 'text-jeu-ivoire/45'}`}>{i + 1}</span><span className={`flex-1 ${statut === 'avenir' ? 'text-jeu-ivoire/60' : ''}`}>{e.nom}</span><span className="text-[11px]">{statut === 'fait' ? '✓' : statut === 'courant' ? (restantes === null ? 'à faire' : `${restantes} tâche${restantes > 1 ? 's' : ''}`) : `${e.taches.length} tâches`}</span></div>
        {statut === 'courant' && <p className="ml-8 mt-1 text-[11.5px] leading-snug text-jeu-ivoire/70">{e.resume}</p>}
      </li>;
    })}</ol>
  </section>;
}
