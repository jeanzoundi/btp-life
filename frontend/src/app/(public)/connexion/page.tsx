'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function ConnexionPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: never }>('/auth/login', {
        email,
        password,
      });
      setSession(data as never);
      router.push('/app');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-graphite">Connexion</h1>
      <p className="mt-2 text-sm text-graphite/60">Reprends ta carrière là où tu l&apos;as laissée.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-graphite">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-graphite">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none"
          />
        </div>
        {erreur && <p className="text-sm text-terracotta">{erreur}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite/60">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-semibold text-terracotta">
          Inscris-toi gratuitement
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-graphite/40">
        Démo : demo@btplife.com / Demo1234! — Admin : admin@btplife.com / Admin1234!
      </p>
    </div>
  );
}
