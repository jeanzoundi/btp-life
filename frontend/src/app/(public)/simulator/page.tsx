import Link from 'next/link';
import { fetchCatalog } from '@/lib/api-server';

interface Chantier {
  id: string;
  nom: string;
  typeProjet: string;
  description: string | null;
  budget: number;
  devise: string;
  delaiJours: number;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BTP Simulator',
  description: 'Teste ton parcours et découvre les métiers du bâtiment avec le simulateur de carrière BTP Life.',
};

export default async function SimulatorPage() {
  const chantiers = await fetchCatalog<{ items: Chantier[] }>('/catalog/chantiers?pageSize=6');

  return (
    <div>
      <section className="texture-beton bg-gradient-to-b from-ivoire to-pierre px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold text-graphite">BTP Simulator</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-graphite/70">
          Des chantiers virtuels multi-phases avec budget, planning, équipe et imprévus. Chaque chantier livré
          reçoit une note A–D qui alimente ton CV virtuel.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-graphite">Comment se joue un chantier</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {[
            ['Phases', 'Implantation, terrassement, fondations, élévation… chaque phase exige des missions réussies.'],
            ['Budget & délais', 'Chaque décision consomme du budget et des jours — livrer à temps rapporte gros.'],
            ['Équipe', 'Ouvriers virtuels avec moral, fatigue et rendement à surveiller.'],
            ['Imprévus', 'Pluie, retards de livraison, conflits… à toi de trancher.'],
          ].map(([titre, texte]) => (
            <div key={titre} className="rounded-2xl border border-pierre bg-white p-5">
              <p className="font-display font-bold text-terracotta">{titre}</p>
              <p className="mt-2 text-sm text-graphite/70">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-pierre px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-bold text-graphite">Exemples de chantiers</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(chantiers?.items ?? []).map((c) => (
              <div key={c.id} className="rounded-2xl border border-sable bg-ivoire p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-olive">{c.typeProjet}</p>
                <p className="mt-1 font-display font-bold text-graphite">{c.nom}</p>
                <p className="mt-1 text-sm text-graphite/60">{c.description}</p>
                <p className="mt-2 font-mono text-xs text-graphite/50">
                  {c.budget.toLocaleString('fr-FR')} {c.devise} · {c.delaiJours} jours
                </p>
              </div>
            ))}
            {!chantiers?.items?.length && (
              <p className="text-sm text-graphite/60">Les chantiers apparaîtront ici une fois l&apos;API démarrée.</p>
            )}
          </div>
          <div className="mt-8 text-center">
            <Link href="/inscription" className="rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile">
              Jouer mon premier chantier
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
