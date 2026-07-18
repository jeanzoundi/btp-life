import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Actualités, conseils et coulisses des métiers du bâtiment — le blog de BTP Life.',
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="text-5xl">🚧</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-graphite">Blog — bientôt disponible</h1>
      <p className="mx-auto mt-3 max-w-lg text-graphite/70">
        Conseils carrière BTP, retours de chantier, méthodes et normes expliquées simplement.
        Les premiers articles arrivent avec le lancement public.
      </p>
    </div>
  );
}
