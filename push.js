(function () {
  'use strict';

  var CONFIG = {
    apiKey: "AIzaSyDfubs4-3j4cN0w0OyHq99pMIKpnFXw1BQ",
    authDomain: "e5tiaraty-e09b2.firebaseapp.com",
    databaseURL: "https://e5tiaraty-e09b2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "e5tiaraty-e09b2",
    storageBucket: "e5tiaraty-e09b2.firebasestorage.app",
    messagingSenderId: "309666700278",
    appId: "1:309666700278:web:9f585b9771db49378605d7"
  };
  var VAPID = 'BMg23HLA3vir_7PB7N2SpG1sUUdtkroqogZdP3hMpzS69e2ZCXBXjJ3uDl1oMZvGVNXDId_MJPqKA2x5YP1jFtg';
  var DB = CONFIG.databaseURL;

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
  if (location.protocol !== 'https:') return;

  if (localStorage.getItem('e5push_token')) return;

  var messaging, swReg;

  function saveToken(token) {
    if (!token) return;
    fetch(DB + '/push_tokens/' + encodeURIComponent(token) + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, t: Date.now() })
    }).then(function (r) {
      if (r.ok) {
        localStorage.setItem('e5push_token', token);
        window.dispatchEvent(new CustomEvent('e5push:subscribed'));
      }
    }).catch(function () {});
  }

  function registerAndToken() {
    if (!swReg || !messaging) return;
    messaging.getToken({ vapidKey: VAPID, serviceWorkerRegistration: swReg })
      .then(saveToken)
      .catch(function () {});
  }

  // الدالة العامة اللي الويدجت بينادي عليها
  window.e5push_request = function () {
    if (Notification.permission === 'granted') {
      registerAndToken();
      return;
    }
    Notification.requestPermission().then(function (p) {
      if (p === 'granted') {
        registerAndToken();
      }
    });
  };

  /* ========== الإصلاح: التعايش مع عداد المشاهدات ========== */
  function getFirebaseApp() {
    // 1) لو الـ default app موجود استخدمه
    try {
      var def = firebase.app();
      if (def) return def;
    } catch (e) {}
    // 2) لو تطبيقنا الخاص اتعمل قبل كده استخدمه
    try {
      var own = firebase.app('e5push');
      if (own) return own;
    } catch (e) {}
    // 3) غير كده أنشئ تطبيق باسم خاص بينا — ما يتخانقش مع plus-ui-view-counter
    return firebase.initializeApp(CONFIG, 'e5push');
  }
  /* ========== نهاية الإصلاح ========== */

  function startMessaging(app) {
    messaging = firebase.messaging(app);

    messaging.onMessage(function (payload) {
      var n = payload.notification || {};
      if (Notification.permission === 'granted') {
        new Notification(n.title || 'اختياراتي', {
          body: n.body || '',
          icon: 'https://www.e5tiaraty.com/favicon.ico',
          data: { url: (payload.data && payload.data.url) || 'https://www.e5tiaraty.com/' }
        });
      }
    });

    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function (reg) {
      swReg = reg;
      if (Notification.permission === 'granted') {
        registerAndToken();
      }
    }).catch(function () {});
  }

  function initMessaging() {
    var app = getFirebaseApp();
    // حماية: لو القالب محمّل Firebase بدون موديول messaging حمّله إحنا
    if (typeof firebase.messaging !== 'function') {
      load('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js', function () {
        startMessaging(app);
      });
      return;
    }
    startMessaging(app);
  }

  function load(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb; s.async = true;
    document.head.appendChild(s);
  }

  if (window.firebase) { initMessaging(); return; }
  load('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js', function () {
    load('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js', initMessaging);
  });
})();
