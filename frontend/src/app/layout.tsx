import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'BTP Life — Le simulateur de carrière BTP',
  description: 'Choisis ton métier. Apprends. Travaille. Évolue. Construis ta carrière dans le BTP.',
  manifest: '/manifest.json',
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
