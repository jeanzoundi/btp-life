import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivoire px-4 text-center">
      <p className="text-6xl">🚧</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-graphite">Zone en travaux</h1>
      <p className="mt-3 max-w-md text-graphite/70">
        Cette page n&apos;existe pas (encore). Nos équipes virtuelles sont sur le coup — en attendant, retourne au
        chantier principal.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-terracotta px-6 py-3 font-semibold text-ivoire hover:bg-argile">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
