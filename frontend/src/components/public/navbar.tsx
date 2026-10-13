'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const LINKS = [
  { href: '/metiers', label: 'Métiers' },
  { href: '/simulator', label: 'BTP Simulator' },
  { href: '/academie', label: 'Académie' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/blog', label: 'Blog' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-pierre bg-ivoire/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-bold text-graphite">
          BTP <span className="text-terracotta">Life</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href || pathname.startsWith(`${l.href}/`) ? 'page' : undefined}
              className={`relative py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-terracotta after:transition-transform ${
                pathname === l.href || pathname.startsWith(`${l.href}/`)
                  ? 'text-terracotta after:scale-x-100'
                  : 'text-graphite/75 after:scale-x-0 hover:text-terracotta hover:after:scale-x-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              href="/app"
              className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-ivoire hover:bg-argile"
            >
              Mon tableau de bord
            </Link>
          ) : (
            <>
              <Link href="/connexion" className="text-sm font-medium text-graphite/80 hover:text-terracotta">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-ivoire hover:bg-argile"
              >
                Commencer l&apos;aventure
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-graphite md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="navigation-mobile"
        >
          <span className="block h-0.5 w-6 bg-graphite" />
          <span className="mt-1 block h-0.5 w-6 bg-graphite" />
          <span className="mt-1 block h-0.5 w-6 bg-graphite" />
        </button>
      </div>

      {open && (
        <div id="navigation-mobile" className="flex flex-col gap-1 border-t border-pierre bg-ivoire px-4 py-4 shadow-xl md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl px-3 py-2.5 text-sm font-medium text-graphite transition-colors hover:bg-pierre/60" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link href="/app" className="text-sm font-semibold text-terracotta">
              Mon tableau de bord
            </Link>
          ) : (
            <>
              <Link href="/connexion" className="text-sm font-medium text-graphite">
                Connexion
              </Link>
              <Link href="/inscription" className="text-sm font-semibold text-terracotta">
                Commencer l&apos;aventure
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
