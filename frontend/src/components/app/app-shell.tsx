'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { JaugeImmeuble } from './ui';
import { AvatarBtp } from './avatar-btp';
import { GuideMentor } from './guide-mentor';
import { BesoinsMini } from './besoins';
import { NotificationsBell } from './notifications-bell';
import { Icone } from './icones';

interface CarriereMe {
  niveau: number;
  xp: number;
  reputation: number;
  argentVirtuel: number;
  energie: number;
  moral: number;
  faim: number;
  social: number;
  profilActuel?: { nom: string } | null;
  avatar?: { nomPersonnage: string; config?: unknown } | null;
}

const SECTIONS_NAV = [
  {
    titre: 'Jouer',
    liens: [
      { href: '/app', label: 'Accueil', icon: 'accueil' },
      { href: '/app/missions', label: 'Missions', icon: 'missions' },
      { href: '/app/chantiers', label: 'Chantiers', icon: 'chantiers' },
    ],
  },
  {
    titre: 'Apprendre',
    liens: [
      { href: '/app/academie', label: 'Académie BTP', icon: 'academie' },
      { href: '/app/logiciels', label: 'Logiciels', icon: 'logiciels' },
      { href: '/app/competences', label: 'Compétences', icon: 'competences' },
    ],
  },
  {
    titre: 'Carrière',
    liens: [
      { href: '/app/parcours', label: 'Mon parcours', icon: 'parcours' },
      { href: '/app/entreprise', label: 'Mon entreprise', icon: 'entreprise' },
      { href: '/app/cv', label: 'CV virtuel', icon: 'cv' },
      { href: '/app/offres', label: 'Offres', icon: 'offres' },
      { href: '/app/promotions', label: 'Promotions', icon: 'promotions' },
      { href: '/app/recompenses', label: 'Récompenses', icon: 'recompenses' },
      { href: '/app/classements', label: 'Classement', icon: 'classement' },
    ],
  },
  {
    titre: 'Autres',
    liens: [
      { href: '/app/profil', label: 'Mon profil', icon: 'profil' },
      { href: '/app/dressing', label: 'Dressing', icon: 'dressing' },
      { href: '/app/inventaire', label: 'Inventaire', icon: 'inventaire' },
      { href: '/app/monde', label: 'Monde virtuel', icon: 'monde' },
      { href: '/app/messages', label: 'Messages', icon: 'messages' },
      { href: '/app/parametres', label: 'Paramètres', icon: 'parametres' },
    ],
  },
];

const NAV_MOBILE = [
  { href: '/app', label: 'Accueil', icon: 'accueil' },
  { href: '/app/missions', label: 'Missions', icon: 'missions' },
  { href: '/app/chantiers', label: 'Chantiers', icon: 'chantiers' },
  { href: '/app/messages', label: 'Messages', icon: 'messages' },
];

function progressionNiveau(xp: number, niveau: number) {
  const xpPourNiveau = (niveau * (niveau + 1) * 100) / 2;
  const xpNiveauPrecedent = ((niveau - 1) * niveau * 100) / 2;
  if (xpPourNiveau <= xpNiveauPrecedent) return 0;
  return Math.min(100, Math.max(0, Math.round(((xp - xpNiveauPrecedent) / (xpPourNiveau - xpNiveauPrecedent)) * 100)));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const [menuOuvert, setMenuOuvert] = useState(false);

  const { data: carriere } = useQuery({
    queryKey: ['carriere', 'me'],
    queryFn: () => api.get<CarriereMe>('/carriere/me'),
  });
  const { data: messagesNonLus } = useQuery({
    queryKey: ['messages', 'mine'],
    queryFn: () => api.get<Array<{ lu: boolean }>>('/users/me/messages'),
    select: (msgs) => msgs.filter((m) => !m.lu).length,
    staleTime: 30_000,
  });

  const pct = progressionNiveau(carriere?.xp ?? 0, carriere?.niveau ?? 1);
  const initiale = (carriere?.avatar?.nomPersonnage ?? user?.nom ?? 'A').charAt(0).toUpperCase();

  // Fermer le tiroir automatiquement à chaque changement de page.
  useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  // Bloquer le défilement de fond pendant que le tiroir est ouvert.
  useEffect(() => {
    if (!menuOuvert) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOuvert]);

  function deconnexion() {
    clear();
    router.push('/');
  }

  return (
    <div className="flex min-h-screen flex-col bg-ivoire md:flex-row">
      {/* Sidebar desktop — sticky avec défilement interne du menu */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-pierre bg-white md:sticky md:top-0 md:flex md:h-screen">
        <Link href="/app" className="border-b border-pierre px-6 py-5 font-display text-xl font-bold text-graphite">
          BTP <span className="text-terracotta">Life</span>
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SECTIONS_NAV.map((section) => (
            <div key={section.titre} className="mb-4">
              <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-widest text-graphite/35">
                {section.titre}
              </p>
              {section.liens.map((l) => {
                const actif = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      actif
                        ? 'bg-terracotta text-ivoire shadow-sm'
                        : 'text-graphite/70 hover:translate-x-1 hover:bg-pierre/60 hover:text-graphite'
                    }`}
                  >
                    <Icone nom={l.icon} taille={19} className="shrink-0" />
                    {l.label}
                    {l.href === '/app/messages' && !!messagesNonLus && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-cuivre px-1 text-[10px] font-bold text-ivoire">
                        {messagesNonLus}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <button
          onClick={deconnexion}
          className="flex items-center gap-2 border-t border-pierre px-6 py-4 text-left text-sm text-graphite/60 transition-colors hover:text-terracotta"
        >
          <Icone nom="deconnexion" taille={17} /> Se déconnecter
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar carrière */}
        <header className="sticky top-0 z-30 border-b border-pierre bg-white/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <Link href="/app/profil" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">
              {carriere?.avatar?.config ? (
                <AvatarBtp config={carriere.avatar.config} taille={40} className="shrink-0 !rounded-full" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta font-display text-lg font-bold text-ivoire">
                  {initiale}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-graphite">
                  {carriere?.avatar?.nomPersonnage ?? user?.nom ?? 'Aventurier BTP'}
                </p>
                <p className="truncate text-xs text-graphite/50">{carriere?.profilActuel?.nom ?? 'Aucun profil choisi'}</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {carriere && (
                <BesoinsMini besoins={{ energie: carriere.energie, moral: carriere.moral, faim: carriere.faim, social: carriere.social }} />
              )}
              <div className="flex items-center gap-2 rounded-full border border-pierre px-3 py-1.5">
                <JaugeImmeuble progressionPct={pct} />
                <div className="text-right">
                  <p className="font-display text-sm font-bold leading-none text-graphite">Niv. {carriere?.niveau ?? 1}</p>
                  <p className="mt-0.5 font-mono text-[10px] leading-none text-graphite/50">{pct}% → suivant</p>
                </div>
              </div>
              <span className="rounded-full bg-olive/10 px-2.5 py-1.5 text-xs font-semibold text-olive sm:px-3">
                🏅 {carriere?.reputation ?? 500}
              </span>
              <span className="hidden rounded-full bg-cuivre/10 px-3 py-1.5 font-mono text-xs font-semibold text-cuivre sm:block">
                {(carriere?.argentVirtuel ?? 0).toLocaleString('fr-FR', { notation: 'compact' })} F
              </span>
              <NotificationsBell />
            </div>
          </div>
        </header>

        {/* key={pathname} rejoue l'animation d'entrée à chaque navigation */}
        <main key={pathname} className="anim-fade-up flex-1 px-3 py-3 pb-20 sm:px-4 sm:py-6 md:px-6 md:pb-8">
          <GuideMentor />
          {children}
        </main>
      </div>

      {/* Bottom nav mobile — accès rapides + Menu complet (§15.3) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-pierre bg-white/95 backdrop-blur md:hidden">
        {NAV_MOBILE.map((l) => {
          const actif = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-transform ${
                actif ? 'scale-110 font-semibold text-terracotta' : 'text-graphite/60'
              }`}
            >
              <Icone nom={l.icon} taille={22} />
              {l.label}
              {l.href === '/app/messages' && !!messagesNonLus && (
                <span className="absolute right-[22%] top-1 h-2.5 w-2.5 rounded-full bg-cuivre" aria-label="Messages non lus" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOuvert(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-transform ${
            menuOuvert ? 'scale-110 font-semibold text-terracotta' : 'text-graphite/60'
          }`}
        >
          <Icone nom="menu" taille={22} />
          Menu
        </button>
      </nav>

      {/* Tiroir mobile — toutes les sections, y compris celles absentes de la barre du bas */}
      {menuOuvert && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fermer le menu"
            onClick={() => setMenuOuvert(false)}
            className="absolute inset-0 bg-graphite/50 backdrop-blur-sm"
          />
          <div className="anim-fade-up absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-6 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-pierre bg-white px-5 py-4">
              <p className="font-display text-lg font-bold text-graphite">Menu</p>
              <button
                onClick={() => setMenuOuvert(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pierre text-graphite/60"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Résumé carrière — les stats masquées de la topbar sont ici, toujours visibles */}
            <Link
              href="/app/profil"
              onClick={() => setMenuOuvert(false)}
              className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-pierre/50 p-4"
            >
              {carriere?.avatar?.config ? (
                <AvatarBtp config={carriere.avatar.config} taille={48} className="shrink-0 !rounded-full" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta font-display text-lg font-bold text-ivoire">
                  {initiale}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-graphite">{carriere?.avatar?.nomPersonnage ?? user?.nom ?? 'Aventurier BTP'}</p>
                <p className="truncate text-xs text-graphite/50">{carriere?.profilActuel?.nom ?? 'Aucun profil choisi'}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                <span className="font-display font-bold text-graphite">Niv. {carriere?.niveau ?? 1}</span>
                <span className="rounded-full bg-olive/10 px-2 py-0.5 font-semibold text-olive">🏅 {carriere?.reputation ?? 500}</span>
                <span className="rounded-full bg-cuivre/10 px-2 py-0.5 font-mono font-semibold text-cuivre">
                  {(carriere?.argentVirtuel ?? 0).toLocaleString('fr-FR')} F
                </span>
              </div>
            </Link>

            <nav className="px-3 py-4">
              {SECTIONS_NAV.map((section) => (
                <div key={section.titre} className="mb-4">
                  <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-graphite/35">{section.titre}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.liens.map((l) => {
                      const actif = pathname === l.href;
                      return (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setMenuOuvert(false)}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                            actif ? 'bg-terracotta text-ivoire' : 'bg-pierre/50 text-graphite/80'
                          }`}
                        >
                          <Icone nom={l.icon} taille={19} className="shrink-0" />
                          <span className="truncate">{l.label}</span>
                          {l.href === '/app/messages' && !!messagesNonLus && (
                            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-cuivre" aria-label="Messages non lus" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <button
              onClick={deconnexion}
              className="mx-5 mt-2 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-xl border border-pierre py-3 text-sm font-semibold text-graphite/60"
            >
              <Icone nom="deconnexion" taille={17} /> Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
