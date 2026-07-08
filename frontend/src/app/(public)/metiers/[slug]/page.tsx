import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchCatalog } from '@/lib/api-server';

interface Profil {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  famille: string;
  niveauDepart?: string | number | null;
  ordre?: number;
}

const FAMILLES_LABELS: Record<string, string> = {
  CHANTIER: 'Chantier',
  BE: 'Bureau d’études',
  BIM: 'BIM',
  TOPO: 'Topographie',
  GEOTECH: 'Géotechnique',
  METRE: 'Métré / Devis',
  QUALITE: 'Qualité / HSE',
  ENTREPRENEUR: 'Entrepreneur',
};

const PARCOURS_TYPES: Record<string, string> = {
  CHANTIER: 'Étudiant → Stagiaire → Chef d’équipe → Chef chantier → Conducteur de travaux',
  BE: 'Étudiant → Dessinateur junior → Projeteur → Ingénieur structure → Chef de projet technique',
  BIM: 'Étudiant → Dessinateur → AutoCAD → Revit → BIM modeleur → BIM coordinateur',
  TOPO: 'Étudiant → Aide topographe → Topographe junior → confirmé → Responsable topographie',
  GEOTECH: 'Étudiant → Stagiaire géotech → Technicien labo sol → Ingénieur géotechnique → Expert',
  METRE: 'Étudiant → Aide métreur → Métreur junior → Économiste → Chargé d’études de prix',
  QUALITE: 'Stagiaire → Assistant HSE → Contrôleur qualité → Responsable qualité/HSE',
  ENTREPRENEUR: 'Ouvrier/technicien/chef chantier → Entrepreneur débutant → Gérant → Multi-chantiers',
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profil = await fetchCatalog<Profil>(`/catalog/profils/slug/${slug}`);
  if (!profil) return { title: 'Métier | BTP Life' };
  return {
    title: `${profil.nom} | Métiers BTP Life`,
    description: profil.description ?? `Découvre le métier de ${profil.nom} et son parcours de carrière dans le BTP.`,
  };
}

export default async function MetierDetailPage({ params }: Props) {
  const { slug } = await params;
  const profil = await fetchCatalog<Profil>(`/catalog/profils/slug/${slug}`);

  if (!profil) {
    notFound();
  }

  const familleLabel = FAMILLES_LABELS[profil.famille] ?? profil.famille;
  const parcours = PARCOURS_TYPES[profil.famille];

  return (
    <div>
      <section className="texture-beton bg-gradient-to-b from-ivoire to-pierre px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/metiers" className="text-sm font-semibold text-terracotta hover:underline">
            ← Tous les métiers
          </Link>
          <p className="mt-4 inline-block rounded-full bg-terracotta/10 px-4 py-1 text-sm font-semibold text-terracotta">
            {familleLabel}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold text-graphite md:text-5xl">{profil.nom}</h1>
          {profil.description && <p className="mt-4 max-w-2xl text-lg text-graphite/70">{profil.description}</p>}
          {profil.niveauDepart != null && (
            <p className="mt-4 text-sm font-medium text-graphite/60">
              Niveau de départ indicatif : <span className="font-semibold text-graphite">{profil.niveauDepart}</span>
            </p>
          )}
        </div>
      </section>

      {parcours && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold text-graphite md:text-3xl">Parcours de carrière type</h2>
          <div className="mt-6 rounded-2xl border border-pierre bg-white p-6">
            <p className="font-mono text-sm leading-relaxed text-graphite/80 md:text-base">{parcours}</p>
          </div>
          <p className="mt-4 text-sm text-graphite/60">
            Ce parcours reste entièrement flexible : à chaque étape majeure, tu choisis de continuer ta formation,
            postuler à une offre, te spécialiser ou même créer ton entreprise. Rien n&apos;est figé.
          </p>
        </section>
      )}

      <section className="bg-pierre px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-graphite md:text-3xl">Comment progresser sur ce profil ?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-sable bg-ivoire p-4">
              <p className="font-display font-bold text-graphite">Académie</p>
              <p className="mt-1 text-sm text-graphite/60">
                Modules de cours et logiciels simulés adaptés à ce domaine.
              </p>
            </div>
            <div className="rounded-xl border border-sable bg-ivoire p-4">
              <p className="font-display font-bold text-graphite">Missions & chantiers</p>
              <p className="mt-1 text-sm text-graphite/60">
                Mets en pratique sur des missions courtes et des chantiers virtuels du BTP Simulator.
              </p>
            </div>
            <div className="rounded-xl border border-sable bg-ivoire p-4">
              <p className="font-display font-bold text-graphite">Évaluation</p>
              <p className="mt-1 text-sm text-graphite/60">
                Score détaillé sur 12 axes, badges et certificats vérifiables à chaque étape.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-graphite px-4 py-16 text-center text-ivoire">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Prêt à devenir {profil.nom.toLowerCase()} ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-ivoire/70">
          Crée ton compte, choisis ce profil de départ et joue ta première mission en moins de 3 minutes.
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
