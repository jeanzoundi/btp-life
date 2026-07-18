import type { NextConfig } from 'next';

// En-têtes de sécurité appliqués à toutes les réponses du frontend. Pas de CSP stricte ici : l'app
// charge des ressources inline (styles Tailwind, scripts Next) et appelle l'API sur un autre domaine
// Vercel — une CSP mal calibrée casserait le rendu ; à ajouter séparément avec un test dédié.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ne pas divulguer la techno serveur (retire l'en-tête X-Powered-By: Next.js).
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
