import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://btp-life-frontend.vercel.app';

// Pages publiques indexables du site vitrine. Les routes privées (/app, /admin, onboarding, compte)
// sont volontairement absentes — voir robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ['', '/metiers', '/simulator', '/academie', '/ecoles', '/entreprises', '/tarifs', '/blog', '/contact'];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
