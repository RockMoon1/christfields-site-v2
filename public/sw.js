/* Christ Fields service worker.
 *
 * Push only. No offline cache, no fetch handler: the app is small and always
 * online, and a stale cache is a worse failure than a spinner. Three jobs:
 *   1. show a push notification and tell the server this device is alive,
 *   2. open the event when the notification is tapped,
 *   3. re-subscribe if the push service rotates the subscription.
 */

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function ack() {
  return self.registration.pushManager
    .getSubscription()
    .then(function (sub) {
      if (!sub) return;
      return fetch('/api/push/ack', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
        keepalive: true,
      });
    })
    .catch(function () {});
}

self.addEventListener('push', function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Christ Fields', body: event.data ? event.data.text() : '' };
  }
  var title = data.title || 'Christ Fields';
  var options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/dashboard' },
  };
  event.waitUntil(Promise.all([self.registration.showNotification(title, options), ack()]));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/dashboard';
  var url = new URL(target, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
          if ('navigate' in c) c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener('pushsubscriptionchange', function (event) {
  var key = event.oldSubscription && event.oldSubscription.options ? event.oldSubscription.options.applicationServerKey : null;
  if (!key) return;
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey: key })
      .then(function (sub) {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), userAgent: 'sw-resubscribe' }),
        });
      })
      .catch(function () {}),
  );
});
