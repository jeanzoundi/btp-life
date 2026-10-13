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
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: never }>('/auth/login', { email, password });
      setSession(data as never);
      router.push('/app');
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-[calc(100vh-65px)] overflow-hidden bg-[#17181c] px-4 py-8 sm:px-6 lg:py-12">
      <div className="auth-grille pointer-events-none absolute inset-0 opacity-30" />
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-olive/20 blur-3xl" />
      <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-terracotta/20 blur-3xl" />

      <div className="anim-fade-up relative mx-auto grid min-h-[680px] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden bg-graphite p-10 text-ivoire lg:flex lg:flex-col lg:justify-between">
          <div className="auth-grille pointer-events-none absolute inset-0 opacity-35" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-terracotta/30 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-ivoire/15 bg-ivoire/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sable">
              <span className="pulse-point h-2 w-2 rounded-full bg-terracotta" /> Monde vivant
            </span>
            <h1 className="mt-8 max-w-lg font-display text-5xl font-bold leading-[1.05] tracking-tight">
              Construis ta carrière. <span className="text-sable">Transforme la ville.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-ivoire/65">Retrouve tes chantiers, ton équipe et ta progression dans une simulation BTP pensée pour l&apos;Afrique.</p>
          </div>

          <div className="relative mt-10">
            <div className="grid grid-cols-3 gap-3">
              {[['🏗️', 'Chantiers', 'Pilote tes projets'], ['🎯', 'Missions', 'Gagne en expertise'], ['🌍', 'Ville', 'Explore et interagis']].map(([icone, titre, texte]) => (
                <div key={titre} className="rounded-2xl border border-ivoire/10 bg-ivoire/[0.06] p-4 backdrop-blur">
                  <span className="text-2xl" aria-hidden="true">{icone}</span>
                  <p className="mt-3 text-sm font-bold">{titre}</p>
                  <p className="mt-1 text-xs leading-5 text-ivoire/50">{texte}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 flex items-center gap-2 text-xs text-ivoire/45"><span className="h-px w-8 bg-sable/50" /> Une expérience de carrière, pas seulement un tableau de bord.</p>
          </div>
        </section>

        <section className="flex flex-col justify-center bg-[#fffdf8] px-6 py-10 sm:px-12 lg:px-14">
          <div className="lg:hidden"><span className="inline-flex rounded-full bg-terracotta/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-terracotta">BTP Life</span></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-terracotta lg:mt-0">Espace joueur</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-graphite">Bon retour parmi nous.</h2>
          <p className="mt-3 text-sm leading-6 text-graphite/60">Reprends ta carrière exactement là où tu l&apos;as laissée.</p>

          <form onSubmit={onSubmit} className="mt-9 space-y-5" aria-busy={loading}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-graphite">Email</label>
              <input id="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joueur@exemple.com" className="auth-input" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-semibold text-graphite">Mot de passe</label>
                <span className="text-xs text-graphite/40">8 caractères minimum</span>
              </div>
              <div className="relative">
                <input id="password" type={motDePasseVisible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input pr-20" />
                <button type="button" onClick={() => setMotDePasseVisible((visible) => !visible)} className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-graphite/55 transition-colors hover:text-terracotta" aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={motDePasseVisible}>
                  {motDePasseVisible ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>
            {erreur && <p role="alert" className="rounded-xl border border-terracotta/20 bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">{erreur}</p>}
            <button type="submit" disabled={loading} aria-label={loading ? 'Connexion…' : 'Se connecter'} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3.5 font-bold text-ivoire shadow-lg shadow-terracotta/20 transition-all hover:-translate-y-0.5 hover:bg-argile hover:shadow-xl disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
              {loading ? 'Connexion…' : 'Entrer dans ma carrière'}
              {!loading && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 text-xs text-graphite/35" aria-hidden="true"><span className="h-px flex-1 bg-pierre" /> NOUVEAU SUR BTP LIFE ? <span className="h-px flex-1 bg-pierre" /></div>
          <Link href="/inscription" className="mt-5 block rounded-xl border border-pierre bg-white px-5 py-3 text-center text-sm font-bold text-graphite transition-colors hover:border-terracotta hover:text-terracotta">Créer mon compte gratuitement</Link>
          <p className="mt-5 text-center text-xs leading-5 text-graphite/40">Progression sauvegardée · Synchronisation sécurisée · Compatible mobile</p>
        </section>
      </div>
    </main>
  );
}
