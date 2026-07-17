// Service worker BTP Life — shell offline minimal (stratégies avancées : voir CONCEPTION.md §15).
const CACHE = 'btp-life-v1';
const SHELL = ['/', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
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
  // L'API reste network-only (données de jeu à jour) ; le shell est network-first avec repli cache.
  if (url.pathname.startsWith('/api')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
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
      icon: '/icon.svg',
      badge: '/icon.svg',
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
