'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import {
  ASSISE_AMPHI, ASSISE_BIBLIOTHEQUE, avancementSemestre, MODULES_HORS_LIGNE, ordonnerModules, PLAN_UNIVERSITE, prochainCours, UNIVERSITE,
  type CoursAcademie, type ModuleAcademie,
} from '@/lib/universite';
import { DecorUniversite } from './decors-lieux-vie';
import type { TypeNotification } from './hud-monde';
import { InterieurLieuVie, type CommandesLieu } from './interieur-lieu-vie';
import { LecteurSlides } from './lecteur-slides';
import { PanneauBibliotheque, PanneauDoyen } from './panneaux-lieux-vie';
import { celebrer } from './celebration';

const LIEU = { ...UNIVERSITE, plan: PLAN_UNIVERSITE };
const HOTE = { prof: true, variante: 1, nom: UNIVERSITE.hote.nom };

/** L'université : le doyen projette en amphi les vrais cours de l'Académie ; un cours suivi jusqu'au bout y est validé. */
export function LieuUniversite({ demo, heure, cleLocale, notifier, passerA, onSortir, children }: {
  demo: boolean; heure: number;
  /** Clé des cours suivis en démonstration, gardés dans ce navigateur. */
  cleLocale: string;
  notifier: (texte: string, type?: TypeNotification) => void;
  passerA: (heure: number) => void; onSortir: () => void; children?: ReactNode;
}) {
  const client = useQueryClient();
  const commandes = useRef<CommandesLieu | null>(null);
  const { data: catalogue } = useQuery({
    queryKey: ['catalog', 'modules-academie'], queryFn: () => api.get<{ items: ModuleAcademie[] }>('/catalog/modules-academie?pageSize=50'), staleTime: 300_000, retry: 1,
  });
  const modules = useMemo(() => { const ordre = ordonnerModules(catalogue?.items ?? []); return ordre.length ? ordre : MODULES_HORS_LIGNE; }, [catalogue]);
  const horsLigne = modules === MODULES_HORS_LIGNE;
  // Cours suivis : ceux du serveur une fois connecté, ceux de ce navigateur en démonstration.
  const { data: terminesServeur } = useQuery({ queryKey: ['carriere', 'cours-termines'], queryFn: () => api.get<string[]>('/carriere/cours-termines'), enabled: !demo });
  const [terminesLocaux, setTerminesLocaux] = useState<string[]>([]);
  useEffect(() => { try { setTerminesLocaux(JSON.parse(localStorage.getItem(cleLocale) ?? '[]')); } catch { /* Stockage facultatif. */ } }, [cleLocale]);
  const termines = useMemo(() => new Set(demo || horsLigne ? terminesLocaux : terminesServeur ?? []), [demo, horsLigne, terminesLocaux, terminesServeur]);
  // Même mutation que la page de l'Académie (clé « cours-termine ») : optimiste, rejouée au retour du réseau.
  const marquer = useMutation({
    mutationKey: ['cours-termine'],
    mutationFn: (coursId: string) => api.post<{ certificats?: string[] }>(`/carriere/cours/${coursId}/termine`),
    onMutate: async (coursId: string) => {
      await client.cancelQueries({ queryKey: ['carriere', 'cours-termines'] });
      const avant = client.getQueryData<string[]>(['carriere', 'cours-termines']);
      client.setQueryData<string[]>(['carriere', 'cours-termines'], ancien => ancien?.includes(coursId) ? ancien : [...(ancien ?? []), coursId]);
      return { avant };
    },
    onError: (_e, _id, ctx) => { if (ctx?.avant) client.setQueryData(['carriere', 'cours-termines'], ctx.avant); },
    onSettled: () => client.invalidateQueries({ queryKey: ['carriere', 'cours-termines'] }),
    // Le dernier cours d'un module : son attestation vient d'être délivrée.
    onSuccess: r => { if (r?.certificats?.length) celebrer({ icone: '📜', titre: 'Certificat obtenu !', sousTitre: r.certificats.join(' · '), partage: `J’ai obtenu « ${r.certificats[0]} » sur BTP Life 🏗️`, son: 'badge' }); },
  });

  const [panneau, setPanneau] = useState<'doyen' | 'bibliotheque' | null>(null);
  const [lecture, setLecture] = useState<{ module: ModuleAcademie; cours: CoursAcademie; ou: 'amphi' | 'bibliotheque' } | null>(null);
  const prochain = prochainCours(modules, termines);
  const avancement = avancementSemestre(modules, termines);

  const valider = (cours: CoursAcademie, module: ModuleAcademie) => {
    if (termines.has(cours.id)) return;
    if (demo || horsLigne) {
      const suivants = [...terminesLocaux, cours.id];
      setTerminesLocaux(suivants);
      try { localStorage.setItem(cleLocale, JSON.stringify(suivants)); } catch { /* Stockage facultatif. */ }
    } else marquer.mutate(cours.id);
    const apres = prochainCours(modules, new Set([...termines, cours.id]));
    notifier(`Cours validé : ${cours.titre}.${module.cours.every(c => c.id === cours.id || termines.has(c.id)) ? ` Module « ${module.titre} » terminé !` : ''}${apres ? ` Prochain : ${apres.cours.titre}.` : ' Semestre complet !'}`, 'succes');
  };
  const surPoste = (station: string) => {
    if (station === 'mentor') { setPanneau('doyen'); return; }
    if (station === 'bibliotheque') { setPanneau('bibliotheque'); return; }
    if (station === 'tableau') { setPanneau('doyen'); return; }
    if (station === 'place') {
      if (prochain) { setPanneau(null); setLecture({ ...prochain, ou: 'amphi' }); }
      else notifier('Tous les cours du semestre sont suivis : la bibliothèque reste ouverte pour réviser.', 'info');
    }
  };
  const decor = useMemo(() => <DecorUniversite
    titreEcran={lecture ? lecture.cours.titre : prochain ? prochain.cours.titre : 'Semestre validé'}
    sousTitreEcran={lecture ? `Cours en cours · ${lecture.module.titre}` : prochain ? `Prochain cours · ${prochain.module.titre}` : 'Félicitations à toute la promotion'}
    lignesTableau={avancement.parModule.map(m => `${m.module.titre} · ${m.faits === m.total ? 'validé' : `${m.faits}/${m.total}`}`)} />,
  [lecture?.cours.id, prochain?.cours.id, avancement.faits]); // eslint-disable-line react-hooks/exhaustive-deps
  const postes = lecture ? [] : ['mentor', ...(prochain ? ['place'] : []), 'bibliotheque'];
  const assise = lecture ? (lecture.ou === 'amphi' ? ASSISE_AMPHI : ASSISE_BIBLIOTHEQUE) : null;
  const echap = () => {
    if (lecture) { setLecture(null); return true; }
    if (panneau) { setPanneau(null); return true; }
    return false;
  };
  const coursSuivant = lecture && prochainCours(modules, new Set([...termines, lecture.cours.id]));
  return <InterieurLieuVie lieu={LIEU} heure={heure} decor={decor} hote={HOTE} postes={postes} assise={assise} commandes={commandes} libelleHote={`🎓 Voir le doyen · ${UNIVERSITE.hote.nom}`}
    statut={horsLigne ? 'Catalogue injoignable : deux cours de démonstration.' : `📚 ${avancement.faits}/${avancement.total} cours suivis · ${avancement.valides}/${modules.length} modules validés`}
    onPoste={surPoste} onSortir={onSortir} onEchap={echap} onAttendre={() => passerA(UNIVERSITE.horaires.ouverture)}>
    {panneau === 'doyen' && <PanneauDoyen prochain={prochain} avancement={avancement} horsLigne={horsLigne}
      onEnCours={() => { setPanneau(null); commandes.current?.aller('place'); }} onBibliotheque={() => setPanneau('bibliotheque')} onFermer={() => setPanneau(null)} />}
    {panneau === 'bibliotheque' && <PanneauBibliotheque modules={modules} termines={termines} onLire={(module, cours) => { setPanneau(null); setLecture({ module, cours, ou: 'bibliotheque' }); }} onFermer={() => setPanneau(null)} />}
    {lecture && <LecteurSlides key={lecture.cours.id} titre={lecture.cours.titre} sousTitre={`${lecture.module.titre} · ${lecture.ou === 'amphi' ? 'cours magistral' : 'bibliothèque'}`} dureeMin={lecture.cours.dureeMin}
      blocs={lecture.cours.contenu?.blocs ?? []} missionPratiqueId={demo || horsLigne ? null : lecture.cours.missionPratiqueId} domaine={lecture.module.domaine}
      coursSuivant={coursSuivant ? { titre: coursSuivant.cours.titre } : null}
      onTermine={() => valider(lecture.cours, lecture.module)}
      onCoursSuivant={coursSuivant ? () => setLecture({ ...coursSuivant, ou: lecture.ou }) : undefined}
      onClose={() => setLecture(null)} />}
    {children}
  </InterieurLieuVie>;
}
