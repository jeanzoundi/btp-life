'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

const SECTIONS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs' },
  { href: '/admin/contenus/missions', label: 'Missions' },
  { href: '/admin/contenus/chantiers', label: 'Chantiers' },
  { href: '/admin/contenus/modules-academie', label: 'Académie' },
  { href: '/admin/contenus/badges', label: 'Badges' },
  { href: '/admin/contenus/offres-emploi', label: 'Offres' },
  { href: '/admin/contenus/regles-promotion', label: 'Promotions' },
  { href: '/admin/contenus/pays', label: 'Pays' },
  { href: '/admin/contenus/pnj', label: 'PNJ' },
  { href: '/admin/contenus/pages-cms', label: 'Pages CMS' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace('/connexion');
    else if (user && user.role !== 'ADMIN') router.replace('/app');
  }, [accessToken, user, router]);

  if (!accessToken || (user && user.role !== 'ADMIN')) return null;

  return (
    <div className="flex min-h-screen flex-col bg-graphite md:flex-row">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-ivoire/10 md:block">
        <Link href="/admin" className="block border-b border-ivoire/10 px-5 py-4 font-display text-lg font-bold text-ivoire">
          BTP Life <span className="text-terracotta">Admin</span>
        </Link>
        <nav className="space-y-0.5 px-2 py-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                pathname === s.href ? 'bg-terracotta/20 text-terracotta' : 'text-ivoire/70 hover:bg-ivoire/5'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <Link href="/app" className="block px-5 py-4 text-xs text-ivoire/40 hover:text-ivoire/70">
          ← Retour à l&apos;app
        </Link>
      </aside>

      {/* Barre de navigation mobile — défilement horizontal, toutes les sections accessibles */}
      <div className="sticky top-0 z-30 border-b border-ivoire/10 bg-graphite md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-display text-base font-bold text-ivoire">
            BTP Life <span className="text-terracotta">Admin</span>
          </Link>
          <Link href="/app" className="text-xs text-ivoire/50">
            ← App
          </Link>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                pathname === s.href ? 'bg-terracotta text-ivoire' : 'bg-ivoire/10 text-ivoire/70'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 overflow-x-hidden bg-ivoire p-4 md:p-6">{children}</main>
    </div>
  );
}
