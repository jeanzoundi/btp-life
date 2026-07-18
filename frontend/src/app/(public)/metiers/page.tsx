import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCatalog } from '@/lib/api-server';
import { MetiersFilter } from './metiers-filter';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  famille: string;
  niveauDepart?: string | number | null;
  ordre?: number;
}

export const metadata: Metadata = {
  title: 'Les métiers du BTP',
  description:
    'Explore les profils et parcours de carrière du BTP : chantier, bureau d’études, BIM, topographie, géotechnique, métré, qualité/HSE, entrepreneur.',
};

export default async function MetiersPage() {
  const data = await fetchCatalog<{ items: Profil[] }>('/catalog/profils?pageSize=100');
  const profils = (data?.items ?? []).slice().sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  return (
    <div>
      <section className="texture-beton bg-gradient-to-b from-ivoire to-pierre px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-block rounded-full bg-terracotta/10 px-4 py-1 text-sm font-semibold text-terracotta">
            Découvrir les métiers
          </p>
          <h1 className="font-display text-3xl font-bold text-graphite md:text-5xl">
            Un métier du BTP pour chaque talent
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-graphite/70">
            Chantier, bureau d&apos;études, BIM, topographie, géotechnique, métré, qualité/HSE, entrepreneuriat…
            chaque profil a son parcours de carrière complet, du premier stage au poste de responsable.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        {profils.length > 0 ? (
          <MetiersFilter profils={profils} />
        ) : (
          <p className="text-sm text-graphite/60">
            Les métiers apparaîtront ici dès que l&apos;API et la base de données seront démarrées et seedées.
          </p>
        )}
      </section>

      <section className="bg-graphite px-4 py-16 text-center text-ivoire">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Pas encore sûr de ton métier ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-ivoire/70">
          Inscris-toi et laisse l&apos;onboarding t&apos;aider à choisir un profil de départ adapté à ton niveau.
        </p>
        <Link
          href="/inscription"
          className="mt-6 inline-block rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile"
        >
          Créer mon compte gratuitement
        </Link>
      </section>
    </div>
  );
}
