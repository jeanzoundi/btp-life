'use client';

import { useEffect } from 'react';

// Routes de l'app à garder disponibles hors ligne (leur HTML est mis en cache dès la première
// visite en ligne, pour qu'une navigation directe fonctionne sans réseau).
const ROUTES_HORS_LIGNE = [
  '/app',
  '/app/academie',
  '/app/missions',
  '/app/profil',
  '/app/chantiers',
  '/app/competences',
  '/app/parcours',
];

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;

    let annule = false;

    (async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        const registration = await navigator.serviceWorker.ready;
        if (annule) return;

        // Au TOUT PREMIER lancement, le service worker s'installe pendant que la page charge :
        // il ne contrôle pas encore cette page, donc aucun de ses fichiers JS/CSS n'est passé par
        // lui — rien n'est mis en cache et l'app était inutilisable hors ligne tant qu'on ne
        // l'avait pas rouverte une seconde fois. On lui envoie donc explicitement la liste des
        // ressources réellement chargées pour qu'il les mette en cache tout de suite.
        const depuisPerformance = performance.getEntriesByType('resource').map((e) => e.name);
        // Le DOM complète les entrées de performance : le bundle `polyfills` porte l'attribut
        // noModule, donc les navigateurs récents ne le téléchargent jamais et il n'apparaît pas
        // dans performance — alors que les WebViews Android plus anciennes (le cas de l'APK) en
        // ont besoin. Sans lui, l'app resterait blanche hors ligne sur ces appareils.
        const depuisDom = [
          ...document.querySelectorAll<HTMLScriptElement>('script[src]'),
        ]
          .map((s) => s.src)
          .concat([...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) => l.href));

        const ressources = [...depuisPerformance, ...depuisDom].filter((url) => {
          try {
            const u = new URL(url);
            return u.origin === location.origin && (u.pathname.startsWith('/_next/') || /\.(css|js|woff2?|png|svg)$/.test(u.pathname));
          } catch {
            return false;
          }
        });

        registration.active?.postMessage({
          type: 'PRECACHER',
          ressources: [...new Set(ressources)],
          routes: ROUTES_HORS_LIGNE,
        });
      } catch {
        /* l'échec d'enregistrement ne doit jamais casser l'app */
      }
    })();

    return () => {
      annule = true;
    };
  }, []);

  return null;
}
