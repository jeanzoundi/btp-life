'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LIEUX_PROGRAMME } from '@/lib/lieux-programme';
import {
  appliquerSeance, bilanSeance, contenuTache, enReposLieu, fusionnerProgres, lieuOuvert, lireProgresLieu, nouvelleSeance, noter, PROGRES_INITIAL, prochainCycle, prochaineEtape,
  seanceFaite, tacheALaZoneLieu, tachesRestantes, type BilanSeance, type ContenuTache, type GainsSeance, type ProgresLieu, type ProgresLieuServeur, type SeanceLieu,
} from '@/lib/programme-lieu';
import type { TypeNotification } from './hud-monde';
import { heureLisible, PanneauMentor, PanneauProgrammeLieu, TacheLieu, type ResultatSeance, type StatutSeance } from './panneau-programme-lieu';

interface ReponseSeance { progres: ProgresLieuServeur; gains: GainsSeance }

/** État des lieux à programme : progression de chacun, la séance en cours (une à la fois), la tâche ouverte, le bilan.
 * Connecté, la progression et les gains passent par le serveur ; en démonstration (ou serveur injoignable), tout reste dans le navigateur. */
export function useProgrammesLieux({ cle, demo, heure, notifier, recompenser, passerA }: {
  cle: string; demo: boolean; heure: number;
  notifier: (texte: string, type?: TypeNotification) => void;
  /** Gains de démonstration, appliqués aux jauges et au solde affichés. */
  recompenser: (bilan: BilanSeance) => void;
  /** Avance l'horloge du monde jusqu'à cette heure (le lendemain si elle est passée). */
  passerA: (heure: number) => void;
}) {
  const client = useQueryClient();
  const { data: progresServeur, isError: serveurEnPanne } = useQuery({
    queryKey: ['carriere', 'lieux'], queryFn: () => api.get<Record<string, ProgresLieuServeur>>('/carriere/lieux'), enabled: !demo, staleTime: 60_000, retry: 1,
  });
  const serveur = !demo && !serveurEnPanne && progresServeur !== undefined;
  const envoyer = useMutation({ mutationFn: ({ slug, etape, note }: { slug: string; etape: number; note: number }) => api.post<ReponseSeance>(`/carriere/lieux/${slug}/seance`, { etape, note }) });

  // Le navigateur garde le repos du jour (horloge du monde) et, hors connexion, toute la progression.
  const [locaux, setLocaux] = useState<Record<string, ProgresLieu>>({});
  useEffect(() => {
    const lu: Record<string, ProgresLieu> = {};
    for (const [slug, { programme }] of Object.entries(LIEUX_PROGRAMME)) {
      try { lu[slug] = lireProgresLieu(programme, JSON.parse(localStorage.getItem(`${cle}:${slug}`) ?? 'null')); } catch { lu[slug] = PROGRES_INITIAL; }
    }
    setLocaux(lu);
  }, [cle]);
  const enregistrer = useCallback((slug: string, valeur: ProgresLieu) => {
    setLocaux(p => ({ ...p, [slug]: valeur }));
    try { localStorage.setItem(`${cle}:${slug}`, JSON.stringify(valeur)); } catch { /* Stockage facultatif. */ }
  }, [cle]);
  const [seance, setSeance] = useState<SeanceLieu | null>(null);
  const [tache, setTache] = useState<{ id: string; contenu: ContenuTache; etape: string } | null>(null);
  const [mentor, setMentor] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatSeance | null>(null);
  const [programmeOuvert, setProgrammeOuvert] = useState(false);

  const progresDe = (slug: string) => {
    const local = locaux[slug] ?? PROGRES_INITIAL;
    return serveur ? fusionnerProgres(LIEUX_PROGRAMME[slug].programme, local, progresServeur[slug]) : local;
  };
  const statut = (slug: string): StatutSeance => {
    const { programme } = LIEUX_PROGRAMME[slug];
    if (resultat && mentor === slug) return 'resultat';
    if (seance?.slug === slug) return seanceFaite(seance) ? 'bilan' : 'en_cours';
    if (!lieuOuvert(programme, heure)) return 'ferme';
    return enReposLieu(progresDe(slug), heure, Date.now()) ? 'repos' : 'disponible';
  };
  /** Étapes validées à montrer dans le décor : celles d'avant la séance en cours, sinon toute la progression. */
  const faites = (slug: string) => seance?.slug === slug ? seance.etape : progresDe(slug).etapes;
  /** Cycle à montrer : celui de la séance, celui en cours, ou celui qui vient d'être bouclé. */
  const cycleAffiche = (slug: string) => {
    if (seance?.slug === slug) return seance.cycle;
    const p = progresDe(slug);
    return Math.max(0, p.etapes >= LIEUX_PROGRAMME[slug].programme.etapes.length ? p.cycles - 1 : p.cycles);
  };
  const postes = (slug: string): string[] => {
    if (seance?.slug === slug) return seanceFaite(seance) ? ['mentor'] : [...new Set(tachesRestantes(seance).map(t => t.zone))];
    return statut(slug) === 'disponible' ? ['mentor'] : [];
  };

  const commencer = (slug: string) => {
    const { programme } = LIEUX_PROGRAMME[slug];
    if (seance && seance.slug !== slug) { notifier('Une séance est déjà en cours dans un autre lieu : termine-la d’abord.', 'alerte'); return; }
    const nouvelle = nouvelleSeance(programme, progresDe(slug));
    setSeance(nouvelle); setMentor(null); setResultat(null);
    notifier(`Séance commencée : ${programme.etapes[nouvelle.etape].nom.toLowerCase()}. Les balises dorées montrent les postes.`, 'trajet');
  };
  const surStation = (slug: string, zone: string) => {
    const { programme, plan } = LIEUX_PROGRAMME[slug];
    if (zone === 'mentor') { setMentor(slug); return; }
    if (seance?.slug !== slug) { notifier(`${plan.libelles[zone] ?? zone} : parle d’abord à ${programme.mentor.nom} pour commencer la séance.`, 'info'); return; }
    const t = tacheALaZoneLieu(seance, zone);
    if (!t) { notifier(seanceFaite(seance) ? `Tout est fait : va voir ${programme.mentor.nom} pour le bilan.` : `${plan.libelles[zone] ?? zone} : rien à faire ici aujourd’hui.`, 'info'); return; }
    setTache({ id: t.id, contenu: contenuTache(programme, seance, t.id)!, etape: programme.etapes[seance.etape].nom });
  };
  const noterTache = (score: number) => {
    if (!seance || !tache) return;
    const suivante = noter(seance, tache.id, score);
    setSeance(suivante);
    if (!seanceFaite(seance) && seanceFaite(suivante)) notifier(`Tout est fait : retourne voir ${LIEUX_PROGRAMME[seance.slug].programme.mentor.nom} pour le bilan.`, 'succes');
  };
  const faireLeBilan = () => {
    if (!seance || envoyer.isPending) return;
    const s = seance, { programme } = LIEUX_PROGRAMME[s.slug];
    const bilan = bilanSeance(s), avant = progresDe(s.slug), local = appliquerSeance(programme, avant, s, bilan, heure, Date.now());
    const etapeAvant = programme.etapes[s.etape].nom;
    if (!serveur) {
      enregistrer(s.slug, local); recompenser(bilan);
      setResultat({ bilan, etapeAvant, etapeApres: programme.etapes[prochaineEtape(programme, local)].nom, cycleBoucle: local.cycles > s.cycle, recompenses: demo ? 'demo' : 'apprentissage' });
      return;
    }
    // Connecté : le serveur valide l'étape, verse les gains et fatigue le personnage ; la séance n'est comptée qu'après sa réponse.
    envoyer.mutate({ slug: s.slug, etape: s.etape, note: bilan.note }, {
      onSuccess: ({ progres, gains }) => {
        client.setQueryData<Record<string, ProgresLieuServeur>>(['carriere', 'lieux'], ancien => ({ ...ancien, [s.slug]: progres }));
        client.invalidateQueries({ queryKey: ['carriere', 'me'] });
        const apres = fusionnerProgres(programme, local, progres);
        enregistrer(s.slug, apres);
        setResultat({ bilan, etapeAvant, etapeApres: programme.etapes[prochaineEtape(programme, apres)].nom, cycleBoucle: apres.cycles > s.cycle, recompenses: 'serveur', gains });
      },
      onError: (erreur: Error) => {
        client.invalidateQueries({ queryKey: ['carriere', 'lieux'] });
        setResultat({ bilan, etapeAvant, etapeApres: etapeAvant, cycleBoucle: false, recompenses: 'serveur', erreur: erreur.message || 'Le serveur ne répond pas.' });
      },
    });
  };
  const terminer = () => {
    const r = resultat, slug = seance?.slug;
    setResultat(null); setSeance(null); setMentor(null);
    if (!r || !slug) return;
    const { programme } = LIEUX_PROGRAMME[slug];
    if (r.erreur) { notifier(`${r.etapeAvant} : séance non enregistrée, à refaire.`, 'alerte'); return; }
    notifier(!r.bilan.compte ? `${r.etapeAvant} : à reprendre demain.` : r.cycleBoucle ? `${programme.titre} : ${programme.cycle} bouclée !` : `Étape validée. Demain : ${r.etapeApres.toLowerCase()}.`, r.bilan.compte ? 'succes' : 'alerte');
  };
  const abandonner = () => { setSeance(null); setMentor(null); setTache(null); notifier('Séance interrompue : l’étape reste à faire.', 'info'); };
  /** Fermé, ou séance du jour déjà faite : on laisse passer le temps jusqu'à la prochaine ouverture (le panneau du mentor reste ouvert). */
  const attendreOuverture = (slug: string) => {
    const { programme } = LIEUX_PROGRAMME[slug], { ouverture } = programme.horaires;
    passerA(ouverture);
    notifier(`${heure >= ouverture ? 'Le lendemain à' : 'Il est'} ${heureLisible(ouverture)} : ${programme.mentor.nom} t’attend.`, 'info');
  };
  /** Échap : ferme d'abord le panneau ouvert ; renvoie faux s'il n'y en avait pas. */
  const fermerPanneau = () => {
    if (tache) { setTache(null); return true; }
    if (programmeOuvert) { setProgrammeOuvert(false); return true; }
    if (mentor) { if (resultat) terminer(); else setMentor(null); return true; }
    return false;
  };
  /** Sortie du lieu : un bilan affiché est clos (la progression est déjà enregistrée), une séance inachevée attend le retour du joueur. */
  const sortir = () => { if (resultat) terminer(); setTache(null); setProgrammeOuvert(false); setMentor(null); };
  return {
    progresDe, statut, faites, cycleAffiche, postes, seance, tache, setTache, mentor, setMentor, resultat, programmeOuvert, setProgrammeOuvert,
    enregistrement: envoyer.isPending, commencer, surStation, noterTache, faireLeBilan, terminer, abandonner, attendreOuverture, fermerPanneau, sortir,
  };
}

export type EtatProgrammesLieux = ReturnType<typeof useProgrammesLieux>;

/** Panneaux du lieu, posés par-dessus son intérieur : mentor, tâche ouverte, programme complet. */
export function PanneauxLieu({ slug, lieux, nomJoueur, demo }: { slug: string; lieux: EtatProgrammesLieux; nomJoueur: string; demo: boolean }) {
  const { programme } = LIEUX_PROGRAMME[slug];
  const progres = lieux.progresDe(slug), enCours = lieux.seance?.slug === slug;
  return <>
    {lieux.mentor === slug && <PanneauMentor programme={programme} statut={lieux.statut(slug)} nomJoueur={nomJoueur} etape={enCours ? lieux.seance!.etape : prochaineEtape(programme, progres)} cycle={enCours ? lieux.seance!.cycle : prochainCycle(progres)}
      seance={enCours ? lieux.seance : null} resultat={lieux.resultat} demo={demo} enregistrement={lieux.enregistrement} onCommencer={() => lieux.commencer(slug)} onBilan={lieux.faireLeBilan} onTerminer={lieux.terminer}
      onAbandonner={lieux.abandonner} onProgramme={() => lieux.setProgrammeOuvert(true)} onAttendre={() => lieux.attendreOuverture(slug)} onFermer={() => { if (lieux.resultat) lieux.terminer(); else lieux.setMentor(null); }} />}
    {lieux.tache && <TacheLieu key={lieux.tache.id} etape={lieux.tache.etape} contenu={lieux.tache.contenu} onScore={lieux.noterTache} onFermer={() => lieux.setTache(null)} />}
    {lieux.programmeOuvert && <PanneauProgrammeLieu programme={programme} progres={progres} seance={lieux.seance} onFermer={() => lieux.setProgrammeOuvert(false)} />}
  </>;
}
