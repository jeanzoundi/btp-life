import Link from 'next/link';
import { fetchCatalog } from '@/lib/api-server';

interface ModuleAcademie {
  id: string;
  titre: string;
  domaine: string;
}
interface Logiciel {
  id: string;
  nom: string;
  categorie: string | null;
}

export default async function AcademiePublicPage() {
  const [modules, logiciels] = await Promise.all([
    fetchCatalog<{ items: ModuleAcademie[] }>('/catalog/modules-academie?pageSize=30'),
    fetchCatalog<{ items: Logiciel[] }>('/catalog/logiciels?pageSize=30'),
  ]);

  return (
    <div>
      <section className="texture-beton bg-gradient-to-b from-ivoire to-pierre px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold text-graphite">L&apos;Académie BTP Life</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-graphite/70">
          Des mini-cours de 10 minutes, des quiz éclair et des missions pratiques — plus une académie logiciels
          pour maîtriser Word, Excel BTP, AutoCAD et Revit en simulation.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-graphite">Modules Académie BTP</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(modules?.items ?? []).map((m) => (
            <div key={m.id} className="rounded-2xl border border-pierre bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-olive">{m.domaine}</p>
              <p className="mt-1 font-display font-bold text-graphite">{m.titre}</p>
            </div>
          ))}
          {!modules?.items?.length && (
            <p className="text-sm text-graphite/60">Les modules apparaîtront ici une fois l&apos;API démarrée.</p>
          )}
        </div>
      </section>

      <section className="bg-pierre px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-graphite">Académie Logiciels</h2>
          <p className="mt-2 text-graphite/70">Des interfaces simulées pour pratiquer sans licence ni installation.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {(logiciels?.items ?? []).map((l) => (
              <span key={l.id} className="rounded-full border border-sable bg-ivoire px-4 py-2 text-sm font-medium text-graphite">
                {l.nom}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/inscription" className="rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile">
              Commencer à apprendre
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
