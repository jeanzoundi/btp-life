'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface Pays {
  id: string;
  nom: string;
}

export default function InscriptionPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [pays, setPays] = useState<Pays[]>([]);
  const [form, setForm] = useState({
    nom: '',
    pseudo: '',
    email: '',
    password: '',
    paysId: '',
    ville: '',
    niveauEtude: '',
    domaineBtp: '',
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ items: Pays[] }>('/catalog/pays')
      .then((data) => setPays(data.items))
      .catch(() => setPays([]));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: never }>('/auth/register', form);
      setSession(data as never);
      router.push('/onboarding');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-graphite">Créer mon compte</h1>
      <p className="mt-2 text-sm text-graphite/60">Ta première mission t&apos;attend dans moins de 3 minutes.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Nom</label>
            <input required value={form.nom} onChange={(e) => update('nom', e.target.value)} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Pseudo</label>
            <input value={form.pseudo} onChange={(e) => update('pseudo', e.target.value)} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-graphite">Email</label>
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-graphite">Mot de passe</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Pays</label>
            <select value={form.paysId} onChange={(e) => update('paysId', e.target.value)} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none">
              <option value="">—</option>
              {pays.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Ville</label>
            <input value={form.ville} onChange={(e) => update('ville', e.target.value)} className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Niveau d&apos;étude</label>
            <input value={form.niveauEtude} onChange={(e) => update('niveauEtude', e.target.value)} placeholder="BTS, Licence…" className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-graphite">Domaine BTP</label>
            <input value={form.domaineBtp} onChange={(e) => update('domaineBtp', e.target.value)} placeholder="Gros œuvre…" className="w-full rounded-lg border border-pierre px-4 py-2 focus:border-terracotta focus:outline-none" />
          </div>
        </div>

        {erreur && <p className="text-sm text-terracotta">{erreur}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-full bg-terracotta py-3 font-semibold text-ivoire hover:bg-argile disabled:opacity-60">
          {loading ? 'Création du compte…' : 'Créer mon compte gratuitement'}
        </button>

        <p className="text-center text-xs text-graphite/50">
          En t&apos;inscrivant, tu acceptes nos{' '}
          <Link href="/legal/cgu" className="underline">CGU</Link> et notre{' '}
          <Link href="/legal/avertissement" className="underline">avertissement pédagogique</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-graphite/60">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="font-semibold text-terracotta">Connecte-toi</Link>
      </p>
    </div>
  );
}
