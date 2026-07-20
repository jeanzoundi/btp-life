'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/app/ui';
import { IllustrationDomaine } from '@/components/app/illustration-domaine';
import { LecteurSlides } from '@/components/app/lecteur-slides';

// La Grande École (contenu niveau BTS2) reste à part de l'Académie de base : un domaine dédié,
// filtrable via ?ecole=, pour ne pas noyer les modules d'introduction dans du contenu avancé.
const DOMAINE_GRANDE_ECOLE = 'grande-ecole-batiment';

interface Bloc {
  type: string;
  valeur: string;
}
interface Cours {
  id: string;
  titre: string;
  dureeMin: number | null;
  contenu: { blocs?: Bloc[] } | null;
  missionPratiqueId: string | null;
}
interface ModuleAcademie {
  id: string;
  slug: string;
  titre: string;
  domaine: string;
  publie: boolean;
  cours: Cours[];
}

function AcademieContent() {
  const searchParams = useSearchParams();
  const enGrandeEcole = searchParams.get('ecole') === DOMAINE_GRANDE_ECOLE;

  const queryClient = useQueryClient();
  const [moduleOuvert, setModuleOuvert] = useState<string | null>(null);
  const [coursEnLecture, setCoursEnLecture] = useState<(Cours & { module: string }) | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', 'modules-academie'],
    queryFn: () => api.get<{ items: ModuleAcademie[] }>('/catalog/modules-academie?pageSize=50'),
  });
  const { data: missions } = useQuery({
    queryKey: ['missions', 'list'],
    queryFn: () => api.get<Array<{ id: string; userStatut: string }>>('/missions?niveauMax=99'),
  });
  const { data: coursTermines } = useQuery({
    queryKey: ['carriere', 'cours-termines'],
    queryFn: () => api.get<string[]>('/carriere/cours-termines'),
  });

  const statutMission = new Map((missions ?? []).map((m) => [m.id, m.userStatut]));
  const coursLus = new Set(coursTermines ?? []);
  const modulesPublies = (data?.items ?? []).filter((m) => m.publie);
  // La Grande École (BTS2) reste séparée de l'Académie de base, dans les deux sens.
  const modules = enGrandeEcole
    ? modulesPublies.filter((m) => m.domaine === DOMAINE_GRANDE_ECOLE)
    : modulesPublies.filter((m) => m.domaine !== DOMAINE_GRANDE_ECOLE);
  const missionValidee = (id: string | null) => !!id && statutMission.get(id) === 'REUSSIE';

  const totalValidables = modules.flatMap((m) => m.cours).filter((c) => c.missionPratiqueId).length;
  const totalValides = modules.flatMap((m) => m.cours).filter((c) => missionValidee(c.missionPratiqueId)).length;

  // Liste à plat, dans l'ordre d'affichage (module par module), pour enchaîner « cours suivant ».
  const tousLesCours = modules.flatMap((m) => m.cours.map((c) => ({ ...c, module: m.titre })));
  const coursSuivant = (() => {
    if (!coursEnLecture) return null;
    const i = tousLesCours.findIndex((c) => c.id === coursEnLecture.id);
    return i >= 0 && i < tousLesCours.length - 1 ? tousLesCours[i + 1] : null;
  })();

  async function marquerTermine(coursId: string) {
    try {
      await api.post(`/carriere/cours/${coursId}/termine`);
      queryClient.invalidateQueries({ queryKey: ['carriere', 'cours-termines'] });
    } catch {
      /* silencieux — la complétion se re-tentera à la prochaine ouverture */
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3 sm:space-y-6">
      {/* Lecteur de cours en diapositives */}
      {coursEnLecture && (
        <LecteurSlides
          titre={coursEnLecture.titre}
          sousTitre={coursEnLecture.module}
          dureeMin={coursEnLecture.dureeMin}
          blocs={coursEnLecture.contenu?.blocs ?? []}
          missionPratiqueId={coursEnLecture.missionPratiqueId}
          coursSuivant={coursSuivant ? { titre: coursSuivant.titre } : null}
          onTermine={() => marquerTermine(coursEnLecture.id)}
          onCoursSuivant={coursSuivant ? () => setCoursEnLecture(coursSuivant) : undefined}
          onClose={() => setCoursEnLecture(null)}
        />
      )}

      {/* Bascule Académie ↔ Grande École — en haut, toujours visible */}
      <div className="flex gap-2 rounded-full bg-pierre/50 p-1 sm:w-fit">
        <Link
          href="/app/academie"
          className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-5 ${
            !enGrandeEcole ? 'bg-graphite text-ivoire shadow-sm' : 'text-graphite/60 hover:text-graphite'
          }`}
        >
          📚 Académie
        </Link>
        <Link
          href="/app/academie?ecole=grande-ecole-batiment"
          className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-5 ${
            enGrandeEcole ? 'bg-[#8B9DC3] text-ivoire shadow-sm' : 'text-graphite/60 hover:text-graphite'
          }`}
        >
          🎓 Grande École
        </Link>
      </div>

      <section className={`rounded-2xl border p-3.5 sm:rounded-3xl sm:p-6 ${enGrandeEcole ? 'border-[#8B9DC3] bg-[#8B9DC3]/5' : 'border-pierre bg-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-graphite sm:text-2xl">
              {enGrandeEcole ? '🎓 Grande École du Bâtiment' : '📚 Académie BTP'}
            </h1>
            <p className="mt-0.5 hidden text-sm text-graphite/60 sm:block">
              {enGrandeEcole
                ? `Niveau BTS2 — ${modules.length} matières, un vrai programme technique avancé.`
                : `${modules.length} modules — suis le cours en diapositives, puis valide-le par sa mission pratique.`}
            </p>
            <p className="mt-0.5 text-xs text-graphite/50 sm:hidden">
              {enGrandeEcole ? `Niveau BTS2 — ${modules.length} matières` : `${modules.length} modules`}
            </p>
          </div>
          <div className="w-24 shrink-0 sm:min-w-44 sm:w-auto">
            <p className="text-right font-mono text-[10px] text-graphite/50 sm:text-xs">
              {totalValides}/{totalValidables} validés
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-pierre sm:h-2.5">
              <div
                className="barre-progression h-full bg-olive"
                style={{ width: `${totalValidables ? Math.round((totalValides / totalValidables) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full sm:h-16" />
          ))}
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {modules.map((m, index) => {
          const ouvert = moduleOuvert === m.id;
          const nbValidables = m.cours.filter((c) => c.missionPratiqueId).length;
          const nbValides = m.cours.filter((c) => missionValidee(c.missionPratiqueId)).length;
          const moduleComplet = nbValidables > 0 && nbValides === nbValidables;
          return (
            <div
              key={m.id}
              className={`overflow-hidden rounded-xl border transition-all sm:rounded-2xl ${ouvert ? 'border-terracotta bg-white shadow-md' : 'carte-vivante border-pierre bg-white'}`}
            >
              <button onClick={() => setModuleOuvert(ouvert ? null : m.id)} className="flex w-full items-center gap-3 p-3 text-left sm:gap-4 sm:p-5">
                <IllustrationDomaine domaine={m.domaine} taille={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-olive sm:text-xs">
                    Module {index + 1} · {m.domaine}
                  </span>
                  <span className="block truncate font-display text-sm font-bold text-graphite sm:text-lg">{m.titre}</span>
                </span>
                {moduleComplet ? (
                  <span className="shrink-0 rounded-full bg-olive/10 px-2 py-0.5 text-[10px] font-bold text-olive sm:px-3 sm:py-1 sm:text-xs">✔</span>
                ) : nbValidables > 0 ? (
                  <span className="shrink-0 rounded-full bg-pierre px-2 py-0.5 font-mono text-[10px] font-semibold text-graphite/60 sm:px-3 sm:py-1 sm:text-xs">
                    {nbValides}/{nbValidables}
                  </span>
                ) : null}
                <span className={`shrink-0 text-lg text-graphite/40 transition-transform sm:text-xl ${ouvert ? 'rotate-180' : ''}`}>⌄</span>
              </button>

              {ouvert && (
                <div className="anim-fade-up border-t border-pierre/60 px-3 pb-3 sm:px-5 sm:pb-5">
                  {m.cours.map((c) => (
                    <div key={c.id} className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
                      <p className="text-sm font-medium text-graphite sm:text-base">
                        {missionValidee(c.missionPratiqueId) ? '✅' : coursLus.has(c.id) ? '📗' : '📖'} {c.titre}
                        {coursLus.has(c.id) && (
                          <span className="ml-2 rounded-full bg-olive/10 px-2 py-0.5 align-middle text-[10px] font-bold text-olive">✓ lu</span>
                        )}
                        {c.dureeMin && (
                          <span className="ml-2 font-mono text-xs text-graphite/50">
                            {c.dureeMin} min · {(c.contenu?.blocs ?? []).length + 1} slides
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCoursEnLecture({ ...c, module: m.titre })}
                          className="rounded-full bg-graphite px-3 py-1.5 text-xs font-semibold text-ivoire transition-transform hover:scale-105 sm:px-4"
                        >
                          {coursLus.has(c.id) ? '↻ Revoir' : '▶ Suivre le cours'}
                        </button>
                        {c.missionPratiqueId && (
                          <Link
                            href={`/app/missions/${c.missionPratiqueId}`}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105 sm:px-4 ${
                              missionValidee(c.missionPratiqueId)
                                ? 'border border-olive text-olive hover:bg-olive/5'
                                : 'bg-terracotta text-ivoire hover:bg-argile'
                            }`}
                          >
                            {missionValidee(c.missionPratiqueId) ? '↻ Rejouer la mission' : '🎯 Mission pratique'}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {!m.cours.length && <p className="mt-4 text-sm text-graphite/50">Cours en préparation pour ce module.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLoading && !modules.length && (
        <p className="rounded-2xl border border-dashed border-pierre p-8 text-center text-sm text-graphite/60">
          Les modules apparaîtront une fois la base seedée.
        </p>
      )}
    </div>
  );
}

export default function AcademiePage() {
  return (
    <Suspense fallback={null}>
      <AcademieContent />
    </Suspense>
  );
}
