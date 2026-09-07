importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDfubs4-3j4cN0w0OyHq99pMIKpnFXw1BQ",
  authDomain: "e5tiaraty-e09b2.firebaseapp.com",
  databaseURL: "https://e5tiaraty-e09b2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "e5tiaraty-e09b2",
  storageBucket: "e5tiaraty-e09b2.firebasestorage.app",
  messagingSenderId: "309666700278",
  appId: "1:309666700278:web:9f585b9771db49378605d7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://www.e5tiaraty.com/favicon.ico',
    badge: 'https://www.e5tiaraty.com/favicon.ico',
    data: { url: payload.data?.url || 'https://www.e5tiaraty.com/' }
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});
