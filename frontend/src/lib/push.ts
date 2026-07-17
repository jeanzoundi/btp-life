// Abonnement aux notifications push (Web Push API) — façon Duolingo : reçues même app fermée.
// Échec silencieux si non supporté (navigateur trop ancien, iOS Safari hors PWA installée, etc.).
import { api } from './api';

export function pushSupporte(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const brut = window.atob(base64Safe);
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)));
}

export async function abonnementActuel(): Promise<PushSubscription | null> {
  if (!pushSupporte()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function activerNotifications(): Promise<'ok' | 'refuse' | 'non-supporte'> {
  if (!pushSupporte()) return 'non-supporte';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'refuse';

  const { publicKey } = await api.get<{ publicKey: string | null }>('/notifications/vapid-public-key');
  if (!publicKey) return 'non-supporte';

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const json = subscription.toJSON();
  await api.post('/notifications/subscribe', {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
  });
  return 'ok';
}

export async function desactiverNotifications(): Promise<void> {
  const subscription = await abonnementActuel();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await api.post('/notifications/unsubscribe', { endpoint });
}
