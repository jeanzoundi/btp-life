// Service worker BTP Life — offline-first.
// Le SHELL (HTML + JS/CSS de l'app) est mis en cache pour que l'app démarre sans réseau ;
// les DONNÉES de jeu sont, elles, gérées hors ligne par la persistance TanStack Query (IndexedDB),
// pas ici — l'API backend (autre origine) n'est donc jamais interceptée.
const CACHE = 'btp-life-v2';
const SHELL = ['/', '/app', '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  // On ne fait pas échouer l'install si un fichier manque (addAll est atomique) : on met en cache
  // au mieux, fichier par fichier.
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(SHELL.map((u) => cache.add(u).catch(() => {})))),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ne pas intercepter les autres origines (API backend, polices, etc.) : elles passent au réseau
  // normalement. Les données offline viennent du cache TanStack Query, pas du service worker.
  if (url.origin !== self.location.origin) return;

  // Assets immuables de Next (hashés) + icônes → cache-first (rapide, dispo hors ligne).
  const cacheFirst = url.pathname.startsWith('/_next/static/') || /\.(png|svg|jpg|jpeg|webp|woff2?|ico)$/.test(url.pathname);
  if (cacheFirst) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations (chargement d'une page) → network-first, repli sur le shell en cache si hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((c) => c ?? caches.match('/app').then((a) => a ?? caches.match('/')))),
    );
    return;
  }

  // Autres GET same-origin → network-first avec repli cache.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match('/'))),
  );
});

// Notifications push façon Duolingo : reçues même app/onglet fermé (voir notifications.service.ts
// côté backend pour ce qui déclenche l'envoi — badge, niveau, promotion, rappels quotidiens).
self.addEventListener('push', (event) => {
  let data = { titre: 'BTP Life', contenu: 'Une nouvelle notification t\'attend.', lien: '/app' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Payload non-JSON (ne devrait pas arriver, mais on garde le titre par défaut plutôt que planter).
  }

  event.waitUntil(
    self.registration.showNotification(data.titre, {
      body: data.contenu,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { lien: data.lien ?? '/app' },
      tag: data.id ?? undefined,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const lien = event.notification.data?.lien ?? '/app';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin && 'focus' in client) {
          client.navigate(lien);
          return client.focus();
        }
      }
      return self.clients.openWindow(lien);
    }),
  );
});
