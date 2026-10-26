'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  appliquerChapitre, bilanChapitre, CAMPAGNE, chapitreCourant, CHAPITRES, CLIENTE_AKWABA, contenuTacheChapitre, lireProgresCampagne, nouvelleSeanceChapitre,
  PARCELLE_AKWABA, PROGRES_CAMPAGNE_INITIAL, stadeAkwaba, type BilanChapitre, type ChapitreCampagne, type ProgresCampagne,
} from '@/lib/campagne';
import { LIEUX_MONDE } from '@/lib/liens-modes';
import { LIEUX_PROGRAMME } from '@/lib/lieux-programme';
import { noter, seanceFaite, tacheALaZoneLieu, tachesRestantes, type ContenuTache, type SeanceLieu } from '@/lib/programme-lieu';
import type { TypeNotification } from './hud-monde';
import { heureLisible, PastilleTache, TacheLieu } from './panneau-programme-lieu';

/** Ce que le serveur a versé pour un chapitre (POST /carriere/campagne/chapitre). */
export interface GainsChapitre { reussi: boolean; xp: number; argent: number; reputation: number; facteurBesoins: number }
interface ReponseChapitre { progres: ProgresCampagne; gains: GainsChapitre; note: number }
export interface ResultatChapitre {
  index: number; bilan: BilanChapitre;
  /** Démonstration (gains affichés, rien n'est versé) ou gains réels du serveur. */
  recompenses: 'demo' | 'serveur';
  gains?: GainsChapitre; erreur?: string;
}
/** Où en est le chapitre, vu depuis un lieu : à jouer ici, en cours, à faire ailleurs, fermé pour l'heure… */
export type StatutChapitre = 'disponible' | 'en_cours' | 'bilan' | 'resultat' | 'ferme' | 'occupe' | 'ailleurs' | 'termine';

/** Qui reçoit le joueur pour un chapitre : le mentor du lieu, ou Mme Touré sur sa parcelle. */
export function interlocuteur(c: ChapitreCampagne) {
  const p = LIEUX_PROGRAMME[c.lieu]?.programme;
  return p ? { nom: p.mentor.nom, role: p.mentor.role, horaires: p.horaires } : CLIENTE_AKWABA;
}
export const nomLieu = (slug: string) => slug === PARCELLE_AKWABA.slug ? 'Parcelle Akwaba' : LIEUX_MONDE[slug]?.nom ?? slug;
const ouvertA = (h: { ouverture: number; fermeture: number }, heure: number) => heure >= h.ouverture && heure < h.fermeture;

/** Le fil rouge : progression de la Résidence Akwaba, la séance du chapitre en cours (une à la fois), sa tâche ouverte, son bilan.
 * Connecté, le serveur valide et paie chaque chapitre ; en démonstration, tout reste dans le navigateur. */
export function useCampagne({ cle, demo, heure, notifier, recompenser, occupe }: {
  cle: string; demo: boolean; heure: number;
  notifier: (texte: string, type?: TypeNotification) => void;
  /** Gains de démonstration, appliqués au solde et aux jauges affichés. */
  recompenser: (bilan: BilanChapitre) => void;
  /** Une séance de lieu est en cours : son lieu, le temps qu'elle se termine (on mène une chose à la fois). */
  occupe: string | null;
}) {
  const client = useQueryClient();
  const { data: brut, isError } = useQuery({
    queryKey: ['carriere', 'campagne'], queryFn: () => api.get<ProgresCampagne>('/carriere/campagne'), enabled: !demo, staleTime: 60_000, retry: 1,
  });
  const serveur = !demo && !isError && brut !== undefined;
  const envoyer = useMutation({ mutationFn: (corps: { chapitre: number; reponses: Record<string, number | number[]> }) => api.post<ReponseChapitre>('/carriere/campagne/chapitre', corps) });
  const [reponses, setReponses] = useState<Record<string, number | number[]>>({});

  // En démonstration, la progression vit dans le navigateur ; connecté, c'est la dernière copie reçue du serveur.
  const [local, setLocal] = useState<ProgresCampagne>(PROGRES_CAMPAGNE_INITIAL);
  const [localLu, setLocalLu] = useState(false);
  useEffect(() => {
    try { setLocal(lireProgresCampagne(JSON.parse(localStorage.getItem(cle) ?? 'null'))); } catch { setLocal(PROGRES_CAMPAGNE_INITIAL); }
    setLocalLu(true);
  }, [cle]);
  const enregistrer = useCallback((p: ProgresCampagne) => {
    setLocal(p);
    try { localStorage.setItem(cle, JSON.stringify(p)); } catch { /* Stockage facultatif. */ }
  }, [cle]);
  useEffect(() => { if (serveur) enregistrer(lireProgresCampagne(brut)); }, [serveur, brut, enregistrer]);
  const progres = serveur ? lireProgresCampagne(brut) : local;
  /** La vraie progression est arrivée (serveur, ou navigateur en démonstration) : avant, elle vaut zéro et un saut ne veut rien dire. */
  const pret = serveur || (localLu && (demo || isError));
  const chapitre = chapitreCourant(progres);

  const [seance, setSeance] = useState<SeanceLieu | null>(null);
  const [tache, setTache] = useState<{ id: string; contenu: ContenuTache; etape: string } | null>(null);
  /** Lieu où le panneau du fil rouge est ouvert (un intérieur, ou la parcelle dans la ville). */
  const [panneau, setPanneau] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatChapitre | null>(null);

  const statut = (ici: string): StatutChapitre => {
    if (resultat) return 'resultat';
    if (seance) return seance.slug === ici ? (seanceFaite(seance) ? 'bilan' : 'en_cours') : 'ailleurs';
    if (!chapitre) return 'termine';
    if (chapitre.lieu !== ici) return 'ailleurs';
    if (occupe) return 'occupe';
    return ouvertA(interlocuteur(chapitre).horaires, heure) ? 'disponible' : 'ferme';
  };
  /** Le fil rouge passe par ce lieu : le chapitre à jouer y est, ou sa séance y est en cours. */
  const concerne = (slug: string) => seance ? seance.slug === slug : chapitre?.lieu === slug;
  /** Postes à signaler pendant une séance de chapitre dans ce lieu ; rien sinon (le lieu garde les siens). */
  const postes = (slug: string): string[] | null => seance?.slug !== slug ? null : seanceFaite(seance) ? ['mentor'] : [...new Set(tachesRestantes(seance).map(t => t.zone))];

  const commencer = () => {
    if (!chapitre || seance) return;
    if (occupe) { notifier(`Termine d’abord ta séance en cours (${occupe}).`, 'alerte'); return; }
    const nouvelle = nouvelleSeanceChapitre(progres.chapitres);
    setSeance(nouvelle); setResultat(null); setReponses({});
    // À la réception, les vérifications se font depuis le panneau, avec Mme Touré ; ailleurs, aux postes du lieu.
    if (chapitre.lieu === PARCELLE_AKWABA.slug) { notifier('Visite de réception commencée avec Mme Touré.', 'trajet'); return; }
    setPanneau(null);
    notifier(`Fil rouge, chapitre ${progres.chapitres + 1} : ${chapitre.titre.toLowerCase()}. Les balises dorées montrent les postes.`, 'trajet');
  };
  const ouvrirTache = (id: string) => {
    if (!seance || seance.scores[id] !== undefined) return;
    const contenu = contenuTacheChapitre(seance.etape, id);
    if (contenu) setTache({ id, contenu, etape: `Fil rouge · ${CHAPITRES[seance.etape].titre}` });
  };
  /** Poste atteint dans un lieu : vrai si le fil rouge s'en charge (tâche du chapitre, ou bilan chez le mentor). */
  const surStation = (slug: string, zone: string) => {
    if (seance?.slug !== slug) return false;
    if (zone === 'mentor') { setPanneau(slug); return true; }
    const t = tacheALaZoneLieu(seance, zone);
    if (!t) return false;
    ouvrirTache(t.id);
    return true;
  };
  const repondreTache = (reponse: number | number[]) => {
    if (tache && seance?.scores[tache.id] === undefined) setReponses(r => ({ ...r, [tache.id]: reponse }));
  };
  const noterTache = (score: number) => {
    if (!seance || !tache) return;
    const suivante = noter(seance, tache.id, score);
    setSeance(suivante);
    if (!seanceFaite(seance) && seanceFaite(suivante)) notifier(`Tout est fait : retourne voir ${interlocuteur(CHAPITRES[seance.etape]).nom} pour le bilan.`, 'succes');
  };
  const faireLeBilan = () => {
    if (!seance || !seanceFaite(seance) || envoyer.isPending) return;
    const s = seance, bilan = bilanChapitre(s);
    if (demo) {
      enregistrer(appliquerChapitre(local, bilan.reussi, new Date()));
      if (bilan.reussi) recompenser(bilan);
      setResultat({ index: s.etape, bilan, recompenses: 'demo' });
      return;
    }
    // Connecté : le chapitre n'est validé (et payé) qu'à la réponse du serveur.
    envoyer.mutate({ chapitre: s.etape, reponses }, {
      onSuccess: ({ progres: apres, gains, note }) => {
        client.setQueryData(['carriere', 'campagne'], apres);
        client.invalidateQueries({ queryKey: ['carriere', 'me'] });
        setResultat({ index: s.etape, bilan: { ...bilan, note, reussi: gains.reussi,
          mention: note === 100 ? 'Chapitre sans faute' : note >= 70 ? 'Chapitre réussi' : gains.reussi ? 'Chapitre validé' : 'Chapitre à reprendre' }, recompenses: 'serveur', gains });
      },
      onError: (erreur: Error) => {
        client.invalidateQueries({ queryKey: ['carriere', 'campagne'] });
        setResultat({ index: s.etape, bilan, recompenses: 'serveur', erreur: erreur.message || 'Le serveur ne répond pas.' });
      },
    });
  };
  const terminer = () => {
    const r = resultat;
    setResultat(null); setSeance(null); setTache(null); setPanneau(null);
    if (!r) return;
    const c = CHAPITRES[r.index];
    if (r.erreur) { notifier(`${c.titre} : chapitre non enregistré, à refaire.`, 'alerte'); return; }
    if (!r.bilan.reussi) { notifier(`${c.titre} : chapitre à reprendre. Relis les explications, puis recommence quand tu veux.`, 'alerte'); return; }
    const suivant = CHAPITRES[r.index + 1];
    notifier(suivant ? `${c.avancee} Prochain rendez-vous : ${nomLieu(suivant.lieu)}, avec ${interlocuteur(suivant).nom}.` : `${CAMPAGNE.nom} livrée ! Mme Touré a ses clés, et toi une belle référence.`, 'succes');
  };
  const abandonner = () => { setSeance(null); setTache(null); setPanneau(null); notifier('Chapitre interrompu : il reste à faire.', 'info'); };
  const ouvrir = useCallback((ici: string) => setPanneau(ici), []);
  const fermer = () => { if (resultat) terminer(); else setPanneau(null); };
  /** Échap : ferme d'abord la tâche, puis le panneau ; renvoie faux s'il n'y avait rien d'ouvert. */
  const fermerPanneau = () => {
    if (tache) { setTache(null); return true; }
    if (panneau) { fermer(); return true; }
    return false;
  };
  /** Sortie d'un lieu : un bilan affiché est clos (déjà enregistré), une séance inachevée attend le retour du joueur. */
  const sortir = () => { if (resultat) terminer(); setTache(null); setPanneau(null); };
  return {
    progres, pret, chapitre, seance, tache, setTache, panneau, resultat, enregistrement: envoyer.isPending,
    statut, concerne, postes, commencer, ouvrirTache, surStation, noterTache, repondreTache, faireLeBilan, terminer, abandonner, ouvrir, fermer, fermerPanneau, sortir,
  };
}

export type EtatCampagne = ReturnType<typeof useCampagne>;

/** Frise du fil rouge : un segment par chapitre, validé, en cours ou à venir. */
export function FriseCampagne({ faits }: { faits: number }) {
  return <div className="mt-2 flex h-2 gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`${faits} chapitre${faits > 1 ? 's' : ''} validé${faits > 1 ? 's' : ''} sur ${CHAPITRES.length}`}>
    {CHAPITRES.map((c, i) => <span key={c.id} title={c.titre} className={`flex-1 ${i < faits ? 'bg-jeu-lagune' : i === faits ? 'bg-jeu-or' : 'bg-white/10'}`} />)}
  </div>;
}

/** Les neuf chapitres, faits, en cours ou à venir, avec leur lieu. */
function ListeChapitres({ faits }: { faits: number }) {
  return <ol className="mt-2 space-y-1">{CHAPITRES.map((c, i) => {
    const etat = i < faits ? 'fait' : i === faits ? 'courant' : 'avenir';
    return <li key={c.id} className={`flex items-baseline gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] ${etat === 'courant' ? 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40' : ''}`}>
      <span className={`hud-chiffre w-5 shrink-0 text-[11px] ${etat === 'fait' ? 'text-jeu-lagune' : etat === 'courant' ? 'text-jeu-or' : 'text-jeu-ivoire/45'}`}>{etat === 'fait' ? '✓' : i + 1}</span>
      <span className={`min-w-0 flex-1 font-semibold ${etat === 'avenir' ? 'text-jeu-ivoire/55' : ''}`}>{c.titre}</span>
      <span className="shrink-0 text-[10.5px] text-jeu-ivoire/50">{nomLieu(c.lieu)}</span>
    </li>;
  })}</ol>;
}

/** Ce que le chapitre a rapporté : montants de démonstration, gains réels du serveur, ou la raison d'un échec d'enregistrement. */
function GainsChapitreResultat({ resultat }: { resultat: ResultatChapitre }) {
  const { bilan, gains, erreur } = resultat;
  if (erreur) return <div role="alert" className="rounded-xl border border-jeu-terre/50 bg-jeu-terre/10 p-3 text-[12.5px] leading-relaxed">
    <p className="font-bold text-[#F08A4B]">Chapitre non enregistré</p><p className="mt-1 text-jeu-ivoire/80">{erreur}</p>
  </div>;
  if (!bilan.reussi) return <p className="rounded-xl bg-black/20 p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/75">Pas de gain cette fois : le chapitre se rejoue aussitôt, il sera payé une fois validé.</p>;
  const argent = gains ? gains.argent : bilan.argent, xp = gains ? gains.xp : bilan.xp, reputation = gains ? gains.reputation : bilan.reputation;
  return <div className="grid grid-cols-2 gap-2 text-center">
    <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-or">+{argent.toLocaleString('fr-FR')}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">FCFA</span></div>
    <div className="rounded-xl bg-white/[.05] p-2.5"><b className="hud-chiffre block text-lg text-jeu-lagune">+{xp}</b><span className="text-[10.5px] font-semibold text-jeu-ivoire/60">points d’expérience</span></div>
    {reputation > 0 && <p className="col-span-2 text-[12px] font-semibold text-jeu-or">+{reputation} de réputation</p>}
    {gains && gains.facteurBesoins < .99 && <p className="col-span-2 text-[11px] leading-snug text-jeu-ivoire/65">Forme du moment : {Math.round(gains.facteurBesoins * 100)} % de l’XP. Mange, dors et vois du monde pour tout gagner.</p>}
    {!gains && <p className="col-span-2 text-[10.5px] text-jeu-ivoire/50">Démonstration : gains non sauvegardés.</p>}
  </div>;
}

/** Le panneau du fil rouge : l'interlocuteur du chapitre (mentor du lieu ou cliente), sa consigne, la séance, le bilan.
 * Sur la parcelle, hors réception, c'est la fiche du projet : où en est l'immeuble et où aller ensuite. */
export function PanneauFilRouge({ ici, campagne, nomJoueur, demo, onAller, onAttendre }: {
  ici: string; campagne: EtatCampagne; nomJoueur: string; demo: boolean;
  /** Rejoindre le lieu du chapitre en cours. */
  onAller: (lieu: string) => void;
  /** Fermé pour l'heure : laisser passer le temps jusqu'à l'ouverture. */
  onAttendre: (heure: number) => void;
}) {
  const statut = campagne.statut(ici);
  const { progres, resultat, seance } = campagne;
  const index = Math.min(resultat?.index ?? seance?.etape ?? progres.chapitres, CHAPITRES.length - 1);
  const chapitre = CHAPITRES[index], qui = interlocuteur(chapitre);
  const surParcelle = chapitre.lieu === PARCELLE_AKWABA.slug;
  const fiche = statut === 'ailleurs' || statut === 'termine';
  const replique = statut === 'disponible' ? `Bonjour ${nomJoueur} ! ${chapitre.recit}`
    : statut === 'en_cours' ? (surParcelle ? 'Faisons le tour : trois vérifications, puis on parle du procès-verbal.' : 'Les balises dorées montrent les postes. Reviens me voir quand tout est fait.')
    : statut === 'bilan' ? (surParcelle ? 'Tout est vu ? Alors parlons du procès-verbal.' : 'C’est fait ? Voyons ce que ça donne.')
    : statut === 'resultat' ? (resultat?.erreur ? 'Ton travail est fait, mais il n’a pas pu être enregistré. On le refera ensemble.' : !resultat?.bilan.reussi ? 'Pas encore : relis bien les explications, puis on recommence quand tu veux.'
      : surParcelle ? (resultat.bilan.note === 100 ? 'Tout est en ordre : je signe. Merci pour ce bel immeuble !' : 'Je signe, avec les réserves notées au procès-verbal. Merci pour ce bel immeuble !')
      : resultat.bilan.note === 100 ? 'Sans faute. La Résidence Akwaba avance grâce à toi.' : 'Bon travail. On avance : relis ce qui a coincé avant la suite.')
    : statut === 'occupe' ? 'Termine d’abord ta séance en cours ; je t’attends ensuite pour la Résidence Akwaba.'
    : `Je te reçois de ${heureLisible(qui.horaires.ouverture)} à ${heureLisible(qui.horaires.fermeture)}. Reviens à ce moment-là.`;
  const enCoursAilleurs = seance && seance.slug !== ici ? CHAPITRES[seance.etape] : null;
  const prochain = enCoursAilleurs ?? campagne.chapitre;
  return <section role="dialog" aria-label={fiche ? `Fil rouge : ${CAMPAGNE.nom}` : `${qui.nom}, ${qui.role}`} className="hud-verre absolute inset-x-3 bottom-3 z-40 mx-auto max-h-[78%] max-w-md overflow-y-auto p-4 sm:left-auto sm:right-3 sm:mx-0 sm:w-[390px]">
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className={`hud-titre flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg text-white ring-2 ring-jeu-or/60 ${fiche ? 'bg-[#9b6422]' : 'bg-[#4f8a7f]'}`}>{fiche ? '🏗️' : qui.nom.replace('Mme ', '')[0]}</span>
      <div className="min-w-0 flex-1">
        <h2 className="hud-titre text-lg leading-tight">{fiche ? CAMPAGNE.nom : qui.nom}</h2>
        <p className="text-[12px] font-semibold text-jeu-ivoire/65">{fiche ? `${CAMPAGNE.ouvrage} · pour ${CAMPAGNE.cliente}` : qui.role}</p>
      </div>
      <button aria-label="Fermer" onClick={campagne.fermer} className="hud-bouton hud-bouton-verre h-8 w-8 shrink-0 rounded-full text-xs">✕</button>
    </div>
    {!fiche && <p className="my-3 rounded-2xl rounded-tl-sm bg-white/[.08] p-3 text-sm leading-relaxed">{replique}</p>}
    <div className={`rounded-xl bg-black/20 p-3 ${fiche ? 'mt-3' : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="hud-legende text-jeu-or">Fil rouge · {CAMPAGNE.nom}</span>
        <b className="hud-chiffre text-sm text-jeu-or">{Math.min(progres.chapitres, CHAPITRES.length)}/{CHAPITRES.length}</b>
      </div>
      <FriseCampagne faits={progres.chapitres} />
      {fiche ? <p className="mt-2 text-[12.5px] text-jeu-ivoire/80">Sur la parcelle : <b>{stadeAkwaba(progres)}</b>{statut === 'termine' && progres.termineeLe ? `, le ${new Date(progres.termineeLe).toLocaleDateString('fr-FR')}` : ''}.</p>
        : <p className="mt-2 text-[13px] font-bold">Chapitre {index + 1} · {chapitre.titre}</p>}
    </div>
    {fiche && <>
      {statut === 'termine'
        ? <p className="mt-3 rounded-xl bg-jeu-lagune/10 p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/85">Huit familles vivent désormais à la Résidence Akwaba. Mme Touré te recommande à tout le Plateau.</p>
        : prochain && <div className="mt-3 rounded-xl bg-jeu-or/[.1] p-3 text-[12.5px] leading-relaxed ring-1 ring-jeu-or/30">
          <p className="hud-legende text-jeu-or">{enCoursAilleurs ? 'Chapitre en cours' : 'Prochain rendez-vous'}</p>
          <p className="mt-1"><b>{prochain.titre}</b> : {nomLieu(prochain.lieu)}, avec {interlocuteur(prochain).nom}.</p>
          <p className="mt-0.5 text-jeu-ivoire/65">{prochain.resume}</p>
        </div>}
      <ListeChapitres faits={progres.chapitres} />
    </>}
    {(statut === 'en_cours' || statut === 'bilan') && seance && <ol className="mt-3 space-y-1.5">
      {seance.taches.map(t => {
        const faite = seance.scores[t.id] !== undefined;
        const ligne = <><PastilleTache score={seance.scores[t.id]} /><span className="flex-1">{t.titre}</span></>;
        return <li key={t.id}>{surParcelle && !faite
          ? <button onClick={() => campagne.ouvrirTache(t.id)} className="flex w-full items-center gap-2.5 rounded-xl bg-jeu-or/[.12] px-3 py-2 text-left text-[13px] font-semibold ring-1 ring-jeu-or/40 hover:bg-jeu-or/20">{ligne}<span className="text-[11px] text-jeu-or">Vérifier →</span></button>
          : <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold ${faite ? 'text-jeu-ivoire/55' : 'bg-jeu-or/[.12] ring-1 ring-jeu-or/40'}`}>{ligne}</div>}</li>;
      })}
    </ol>}
    {statut === 'resultat' && resultat && <div className="mt-3 space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-black/20 p-3">
        <div className="text-center"><b className="hud-chiffre block text-[34px] leading-none text-jeu-or">{resultat.bilan.note}</b><span className="text-[10px] font-bold text-jeu-ivoire/55">/ 100</span></div>
        <div><p className="hud-titre text-[15px]">{resultat.bilan.mention}</p><p className="text-[12px] text-jeu-ivoire/65">{resultat.bilan.reussies} tâche{resultat.bilan.reussies > 1 ? 's' : ''} réussie{resultat.bilan.reussies > 1 ? 's' : ''} sur {resultat.bilan.total} · validé à 50</p></div>
      </div>
      {!resultat.erreur && resultat.bilan.reussi && <p className="rounded-xl bg-jeu-lagune/10 p-3 text-[12.5px] leading-relaxed text-jeu-ivoire/85">{chapitre.avancee}</p>}
      <GainsChapitreResultat resultat={resultat} />
    </div>}
    <div className="mt-3 space-y-2">
      {statut === 'disponible' && <button onClick={campagne.commencer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">{surParcelle ? 'Commencer la visite de réception' : 'Commencer le chapitre'}</button>}
      {statut === 'disponible' && <p className="text-center text-[10.5px] text-jeu-ivoire/50">{demo ? 'Démonstration : progression gardée dans ce navigateur.' : surParcelle ? 'Réception validée à 50/100 : 25 000 F, jusqu’à 280 XP et 15 de réputation.' : 'Chapitre validé à 50/100 : 2 500 F et jusqu’à 80 XP, une seule fois.'}</p>}
      {statut === 'en_cours' && !surParcelle && <button onClick={campagne.fermer} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Continuer</button>}
      {statut === 'bilan' && <button onClick={campagne.faireLeBilan} disabled={campagne.enregistrement} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">{campagne.enregistrement ? 'Enregistrement du chapitre…' : surParcelle ? 'Signer le procès-verbal' : 'Faire le bilan'}</button>}
      {statut === 'resultat' && <button onClick={campagne.terminer} className="hud-bouton hud-bouton-or w-full p-3 text-sm">{resultat?.bilan.reussi && !resultat.erreur ? 'Continuer l’histoire' : 'Fermer'}</button>}
      {statut === 'ferme' && <button onClick={() => onAttendre(qui.horaires.ouverture)} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">⏭ Attendre l’ouverture · {heureLisible(qui.horaires.ouverture)}</button>}
      {statut === 'ailleurs' && prochain && prochain.lieu !== ici && <button onClick={() => onAller(prochain.lieu)} className="hud-bouton hud-bouton-principal w-full p-3 text-sm">Y aller · {nomLieu(prochain.lieu)}</button>}
      {(statut === 'en_cours' || statut === 'bilan') && <button onClick={campagne.abandonner} className="w-full p-1.5 text-[12px] font-semibold text-jeu-ivoire/45 hover:text-jeu-ivoire/80">Interrompre le chapitre</button>}
    </div>
  </section>;
}

/** Panneaux du fil rouge posés sur un lieu (intérieur ou parcelle) : le panneau du chapitre, et la tâche ouverte par-dessus. */
export function PanneauxFilRouge({ ici, campagne, nomJoueur, demo, onAller, onAttendre }: {
  ici: string; campagne: EtatCampagne; nomJoueur: string; demo: boolean; onAller: (lieu: string) => void; onAttendre: (heure: number) => void;
}) {
  return <>
    {campagne.panneau === ici && !campagne.tache && <PanneauFilRouge ici={ici} campagne={campagne} nomJoueur={nomJoueur} demo={demo} onAller={onAller} onAttendre={onAttendre} />}
    {campagne.tache && campagne.seance?.slug === ici && <TacheLieu key={campagne.tache.id} etape={campagne.tache.etape} contenu={campagne.tache.contenu} onScore={campagne.noterTache} onReponse={campagne.repondreTache} onFermer={() => campagne.setTache(null)} />}
  </>;
}
