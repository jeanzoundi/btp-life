import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://btp-life-frontend.vercel.app';

// Pages publiques indexables du site vitrine. Les routes privées (/app, /admin, onboarding, compte)
// sont volontairement absentes — voir robots.ts. Le blog n'y revient qu'avec ses premiers articles : une page
// « bientôt disponible » n'a rien à faire dans les résultats de recherche.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['', '/metiers', '/simulator', '/academie', '/ecoles', '/entreprises', '/tarifs', '/contact'];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
