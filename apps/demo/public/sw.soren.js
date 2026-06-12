/* Soren demo Service Worker: notification display + click handling. */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
      return undefined;
    })(),
  );
});

/* Future: Web Push delivery while the app is closed (requires a VAPID server). */
self.addEventListener('push', (event) => {
  const body = event.data ? event.data.text() : 'Time to file your daily log. Tap to open Soren.';
  event.waitUntil(self.registration.showNotification('Soren', { body, tag: 'soren-daily-log' }));
});
