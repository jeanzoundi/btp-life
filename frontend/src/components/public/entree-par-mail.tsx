'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

type Session = { accessToken: string; refreshToken: string; user: never; nouveau?: boolean };
type Etape = 'email' | 'code' | 'motdepasse';

const DELAI_RENVOI_S = 60;

function message(err: unknown, defaut: string) {
  if (err instanceof ApiError) return err.status === 429 && !/attends|heure/i.test(err.message) ? 'Trop d’essais : attends une minute avant de réessayer.' : err.message;
  return defaut;
}

/** Inscription et connexion sur un seul écran : on donne son mail, on reçoit un code à 6 chiffres, on le tape, on joue.
 * Une adresse inconnue crée le compte (direction la création du personnage), une adresse connue reconnecte. Les comptes
 * plus anciens et l'administration gardent l'entrée par mot de passe, un lien plus bas. */
export function EntreeParMail({ mode }: { mode: 'connexion' | 'inscription' }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [etape, setEtape] = useState<Etape>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [codeDeveloppement, setCodeDeveloppement] = useState<string | null>(null);
  const [renvoiDans, setRenvoiDans] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const champCode = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renvoiDans <= 0) return;
    const minuterie = setTimeout(() => setRenvoiDans((s) => s - 1), 1000);
    return () => clearTimeout(minuterie);
  }, [renvoiDans]);

  useEffect(() => { if (etape === 'code') champCode.current?.focus(); }, [etape]);

  function entrer(data: Session) {
    setSession(data as never);
    router.push(data.nouveau ? '/onboarding' : '/app');
  }

  async function envoyerCode(renvoi = false) {
    setErreur(null); setInfo(null);
    setLoading(true);
    try {
      const data = await api.post<{ envoye: boolean; codeDeveloppement?: string }>('/auth/code', { email: email.trim() });
      setCodeDeveloppement(data.codeDeveloppement ?? null);
      setCode('');
      setEtape('code');
      setRenvoiDans(DELAI_RENVOI_S);
      if (renvoi) setInfo('Nouveau code envoyé.');
    } catch (err) {
      setErreur(message(err, "Le code n'a pas pu partir : vérifie ta connexion et réessaie."));
    } finally {
      setLoading(false);
    }
  }

  async function verifier(valeur = code) {
    if (loading || valeur.length !== 6) return;
    setErreur(null); setInfo(null);
    setLoading(true);
    try {
      entrer(await api.post<Session>('/auth/code/verifier', { email: email.trim(), code: valeur }));
    } catch (err) {
      setErreur(message(err, 'Vérification impossible : vérifie ta connexion et réessaie.'));
      setCode('');
      champCode.current?.focus();
      setLoading(false);
    }
  }

  async function connexionMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      entrer(await api.post<Session>('/auth/login', { email: email.trim(), password }));
    } catch (err) {
      setErreur(message(err, 'Erreur de connexion'));
      setLoading(false);
    }
  }

  function changerEtape(suivante: Etape) {
    setErreur(null); setInfo(null); setEtape(suivante);
  }

  const titre = etape === 'code' ? 'Regarde ta boîte mail.'
    : etape === 'motdepasse' ? 'Bon retour parmi nous.'
    : mode === 'inscription' ? 'Crée ton compte en 30 secondes.' : 'Entre dans ta carrière.';

  return (
    <main className="relative isolate min-h-[calc(100vh-65px)] overflow-hidden bg-[#17181c] px-4 py-8 sm:px-6 lg:py-12">
      <div className="auth-grille pointer-events-none absolute inset-0 opacity-30" />
      <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-olive/20 blur-3xl" />
      <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-terracotta/20 blur-3xl" />

      <div className="anim-fade-up relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:min-h-[640px] lg:grid-cols-[1.08fr_.92fr]">
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
          <ol className="relative mt-10 space-y-3">
            {[['1', 'Ton adresse mail', 'Rien d’autre à remplir.'], ['2', 'Le code reçu', '6 chiffres, valable 10 minutes.'], ['3', 'Tu joues', 'Ton personnage se crée dans le jeu.']].map(([n, titreEtape, texte]) => (
              <li key={n} className="flex items-center gap-4 rounded-2xl border border-ivoire/10 bg-ivoire/[0.06] p-4 backdrop-blur">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-terracotta font-bold">{n}</span>
                <span><span className="block text-sm font-bold">{titreEtape}</span><span className="block text-xs text-ivoire/55">{texte}</span></span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col justify-center bg-[#fffdf8] px-6 py-10 sm:px-12 lg:px-14">
          <div className="lg:hidden"><span className="inline-flex rounded-full bg-terracotta/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-terracotta">BTP Life</span></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-terracotta lg:mt-0">{mode === 'inscription' ? 'Inscription gratuite' : 'Espace joueur'}</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-graphite sm:text-4xl">{titre}</h2>

          {etape === 'email' && (
            <>
              <p className="mt-3 text-sm leading-6 text-graphite/60">Ton adresse mail suffit : on t&apos;envoie un code, pas de mot de passe à retenir. Nouveau ou déjà inscrit, c&apos;est le même écran.</p>
              <form onSubmit={(e) => { e.preventDefault(); envoyerCode(); }} className="mt-8 space-y-5" aria-busy={loading}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-graphite">Email</label>
                  <input id="email" type="email" autoComplete="email" inputMode="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joueur@exemple.com" className="auth-input" />
                </div>
                {erreur && <p role="alert" className="rounded-xl border border-terracotta/20 bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">{erreur}</p>}
                <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3.5 font-bold text-ivoire shadow-lg shadow-terracotta/20 transition-all hover:-translate-y-0.5 hover:bg-argile hover:shadow-xl disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
                  {loading ? 'Envoi du code…' : 'Recevoir mon code'}
                  {!loading && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
                </button>
              </form>
            </>
          )}

          {etape === 'code' && (
            <>
              <p className="mt-3 text-sm leading-6 text-graphite/60">
                On a envoyé un code à 6 chiffres à <strong className="break-all text-graphite">{email.trim()}</strong>. Il vaut 10 minutes. Pas reçu ? Regarde dans les spams.
              </p>
              {codeDeveloppement && (
                <p className="mt-4 rounded-xl border border-olive/30 bg-olive/10 px-4 py-3 text-sm text-graphite">
                  Mode local, aucun mail envoyé : ton code est <strong className="font-mono tracking-widest">{codeDeveloppement}</strong>.
                </p>
              )}
              <form onSubmit={(e) => { e.preventDefault(); verifier(); }} className="mt-8 space-y-5" aria-busy={loading}>
                <div>
                  <label htmlFor="code" className="mb-2 block text-sm font-semibold text-graphite">Code reçu</label>
                  <input
                    id="code" ref={champCode} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required
                    value={code}
                    onChange={(e) => {
                      const chiffres = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(chiffres);
                      if (chiffres.length === 6) verifier(chiffres);
                    }}
                    placeholder="••••••"
                    className="auth-input text-center font-mono text-2xl tracking-[0.5em]"
                  />
                </div>
                {erreur && <p role="alert" className="rounded-xl border border-terracotta/20 bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">{erreur}</p>}
                {info && !erreur && <p role="status" className="text-sm font-medium text-olive">{info}</p>}
                <button type="submit" disabled={loading || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3.5 font-bold text-ivoire shadow-lg shadow-terracotta/20 transition-all hover:bg-argile disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Vérification…' : 'Entrer'}
                </button>
              </form>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <button type="button" onClick={() => envoyerCode(true)} disabled={loading || renvoiDans > 0} className="min-h-[44px] font-semibold text-terracotta disabled:text-graphite/40">
                  {renvoiDans > 0 ? `Renvoyer le code (${renvoiDans} s)` : 'Renvoyer le code'}
                </button>
                <button type="button" onClick={() => { changerEtape('email'); setCode(''); }} className="min-h-[44px] font-semibold text-graphite/60 hover:text-graphite">
                  Changer d&apos;adresse
                </button>
              </div>
            </>
          )}

          {etape === 'motdepasse' && (
            <>
              <p className="mt-3 text-sm leading-6 text-graphite/60">Pour les comptes créés avec un mot de passe. Tu l&apos;as oublié ? Reviens au code par mail : il marche aussi pour ton compte.</p>
              <form onSubmit={connexionMotDePasse} className="mt-8 space-y-5" aria-busy={loading}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-graphite">Email</label>
                  <input id="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joueur@exemple.com" className="auth-input" />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-graphite">Mot de passe</label>
                  <div className="relative">
                    <input id="password" type={motDePasseVisible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input pr-20" />
                    <button type="button" onClick={() => setMotDePasseVisible((visible) => !visible)} className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-graphite/55 transition-colors hover:text-terracotta" aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={motDePasseVisible}>
                      {motDePasseVisible ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                </div>
                {erreur && <p role="alert" className="rounded-xl border border-terracotta/20 bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">{erreur}</p>}
                <button type="submit" disabled={loading} aria-label={loading ? 'Connexion…' : 'Se connecter'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite px-5 py-3.5 font-bold text-ivoire transition-all hover:bg-graphite/90 disabled:cursor-wait disabled:opacity-60">
                  {loading ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 border-t border-pierre pt-5 text-center text-sm">
            {etape === 'motdepasse'
              ? <button type="button" onClick={() => changerEtape('email')} className="min-h-[44px] font-semibold text-terracotta">Recevoir un code par mail à la place</button>
              : <button type="button" onClick={() => changerEtape('motdepasse')} className="min-h-[44px] font-semibold text-graphite/55 hover:text-graphite">J&apos;ai un mot de passe</button>}
          </div>
          <p className="mt-3 text-center text-xs leading-5 text-graphite/45">
            En continuant, tu acceptes nos{' '}
            <Link href="/legal/cgu" className="underline">CGU</Link> et notre{' '}
            <Link href="/legal/avertissement" className="underline">avertissement pédagogique</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
