importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase compat inside the service worker
// In production, these should be replaced with actual project credentials.
firebase.initializeApp({
  apiKey: "mock-api-key",
  authDomain: "mock-auth-domain",
  projectId: "mock-project-id",
  storageBucket: "mock-storage-bucket",
  messagingSenderId: "mock-sender-id",
  appId: "mock-app-id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message payload received: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Clinic Update';
  const notificationOptions = {
    body: payload.notification?.body || 'There is a new update regarding your schedule.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to redirect to client portal
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = '/profile';
  if (event.notification.data && event.notification.data.click_action) {
    targetUrl = event.notification.data.click_action;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find and focus existing browser window
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        const clientUrl = new URL(client.url).pathname;
        if (clientUrl === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
