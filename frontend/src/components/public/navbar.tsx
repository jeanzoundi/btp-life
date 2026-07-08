'use client';

import Link from 'next/link';
import { useState } from 'react';
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
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-pierre bg-ivoire/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-bold text-graphite">
          BTP <span className="text-terracotta">Life</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-graphite/80 hover:text-terracotta">
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
          aria-label="Menu"
        >
          <span className="block h-0.5 w-6 bg-graphite" />
          <span className="mt-1 block h-0.5 w-6 bg-graphite" />
          <span className="mt-1 block h-0.5 w-6 bg-graphite" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-pierre bg-ivoire px-4 py-4 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-graphite" onClick={() => setOpen(false)}>
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
