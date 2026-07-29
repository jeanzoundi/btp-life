// Notification LOCALE (pas push serveur) affichée quand une action mise en file d'attente hors
// ligne vient d'être synchronisée. Utilise le service worker déjà enregistré ; silencieux si la
// permission n'est pas accordée.
export async function notifierSync(titre: string, corps: string) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(titre, {
        body: corps,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'btp-sync',
      });
    } else {
      new Notification(titre, { body: corps, icon: '/icon-192.png' });
    }
  } catch {
    /* silencieux */
  }
}
