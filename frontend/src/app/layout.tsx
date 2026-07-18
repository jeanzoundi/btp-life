import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { PwaRegister } from '@/components/pwa-register';

// URL de base pour les liens absolus (OpenGraph, sitemap, canoniques). Surchargée par
// NEXT_PUBLIC_SITE_URL en prod si besoin.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://btp-life-frontend.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `template` : chaque page qui définit son propre `title` devient « Titre — BTP Life ». Sans ça,
  // toutes les pages publiques partageaient le même titre (mauvais pour le référencement).
  title: {
    default: 'BTP Life — Le simulateur de carrière BTP',
    template: '%s — BTP Life',
  },
  description: 'Choisis ton métier. Apprends. Travaille. Évolue. Construis ta carrière dans le BTP.',
  manifest: '/manifest.json',
  applicationName: 'BTP Life',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'BTP Life',
    locale: 'fr_FR',
    title: 'BTP Life — Le simulateur de carrière BTP',
    description: 'Choisis ton métier. Apprends. Travaille. Évolue. Construis ta carrière dans le BTP.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BTP Life — Le simulateur de carrière BTP',
    description: 'Choisis ton métier. Apprends. Travaille. Évolue. Construis ta carrière dans le BTP.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2B2B2E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
