// HOW COME? — Firebase Cloud Messaging background service worker.
// Handles push notifications that arrive while the app is closed or in the
// background. Firebase's JS SDK auto-registers this file (at /firebase-messaging-sw.js)
// the first time a device asks for a token — no manual registration needed
// in main.jsx.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDUVOg7Gjr7wHGD6dhYmaovUgLwcMTbvGY",
  authDomain: "how-come-80e31.firebaseapp.com",
  projectId: "how-come-80e31",
  storageBucket: "how-come-80e31.firebasestorage.app",
  messagingSenderId: "651167370939",
  appId: "1:651167370939:web:7ec4ffd4e9949119a5639e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'HOW COME?';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

// Tapping a notification focuses an existing tab (or opens one) and
// navigates to whatever URL was set as `data.url` when the message was sent.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
