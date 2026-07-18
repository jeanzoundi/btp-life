import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://btp-life-frontend.vercel.app';

// Autorise l'indexation du site vitrine, mais garde l'application de jeu, l'admin, l'onboarding et
// les pages de compte hors des moteurs de recherche (contenu privé / sans intérêt SEO).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/admin/', '/onboarding', '/connexion', '/inscription'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
