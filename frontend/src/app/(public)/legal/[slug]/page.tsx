import { fetchCatalog } from '@/lib/api-server';

interface PageCms {
  titre: string;
  contenu: { texte?: string };
}

const TITRES_FALLBACK: Record<string, string> = {
  cgu: 'Conditions générales d’utilisation',
  confidentialite: 'Politique de confidentialité',
  'mentions-legales': 'Mentions légales',
  cookies: 'Politique cookies',
  avertissement: 'Avertissement pédagogique',
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchCatalog<PageCms>(`/catalog/pages-cms/slug/${slug}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-graphite">
        {page?.titre ?? TITRES_FALLBACK[slug] ?? 'Page légale'}
      </h1>
      <div className="prose mt-6 text-graphite/80">
        <p>{page?.contenu?.texte ?? 'Contenu en cours de rédaction — disponible dès le démarrage de l’API.'}</p>
      </div>
      {slug === 'avertissement' && (
        <p className="mt-8 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-graphite/80">
          BTP Life est un simulateur pédagogique. Les contenus techniques et normatifs servent à
          l&apos;apprentissage et ne remplacent pas les normes officielles, les bureaux d&apos;études, les
          ingénieurs habilités, les laboratoires agréés ni les obligations réglementaires du pays concerné.
        </p>
      )}
    </div>
  );
}
