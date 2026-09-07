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

  // لو الزائر رفض قبل كده، متتعبش نفسك
  if (localStorage.getItem('e5push_denied') === '1') return;

  function saveToken(token) {
    if (!token || localStorage.getItem('e5push_token') === token) return;
    fetch(DB + '/push_tokens/' + encodeURIComponent(token) + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, t: Date.now() })
    }).then(function (r) {
      if (r.ok) localStorage.setItem('e5push_token', token);
    }).catch(function () {});
  }

  // Modal يظهر فوري لو المتصفح رفض الطلب التلقائي
  function showModal() {
    if (document.getElementById('e5push-modal')) return;
    var style = document.createElement('style');
    style.textContent =
      '#e5push-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:999999;padding:20px;animation:fadeIn .3s}' +
      '#e5push-modal .box{background:#fff;border-radius:16px;padding:28px 24px;max-width:380px;width:100%;text-align:center;font-family:system-ui,sans-serif;direction:rtl;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
      '#e5push-modal h3{margin:0 0 12px;font-size:20px;color:#1a1a1a}' +
      '#e5push-modal p{margin:0 0 20px;color:#555;font-size:15px;line-height:1.6}' +
      '#e5push-modal .btns{display:flex;gap:10px;justify-content:center}' +
      '#e5push-modal button{flex:1;padding:12px 16px;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}' +
      '#e5push-modal .yes{background:#2563eb;color:#fff}' +
      '#e5push-modal .no{background:#f3f4f6;color:#374151}' +
      '@keyframes fadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = 'e5push-modal';
    modal.innerHTML =
      '<div class="box">' +
        '<h3>🔔 فعّل الإشعارات</h3>' +
        '<p>عشان توصلك أحدث المقالات والعروض أول ما تنزل من اختيارتي</p>' +
        '<div class="btns">' +
          '<button class="yes">نعم، فعّل</button>' +
          '<button class="no">لاحقاً</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.querySelector('.yes').onclick = function () {
      modal.remove();
      doRequest();
    };
    modal.querySelector('.no').onclick = function () {
      modal.remove();
      localStorage.setItem('e5push_denied', '1');
    };
  }

  var messaging, swReg;

  function registerAndToken() {
    messaging.getToken({ vapidKey: VAPID, serviceWorkerRegistration: swReg })
      .then(saveToken)
      .catch(function () {});
  }

  function doRequest() {
    Notification.requestPermission().then(function (p) {
      if (p === 'granted') {
        registerAndToken();
      } else {
        // المستخدم رفض صراحة
        localStorage.setItem('e5push_denied', '1');
      }
    });
  }

  function initMessaging() {
    var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(CONFIG);
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

    // سجّل الـ Service Worker أول حاجة
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function (reg) {
      swReg = reg;

      // لو الزائر موافق بالفعل، خذ توكن فوراً
      if (Notification.permission === 'granted') {
        registerAndToken();
        return;
      }

      // حاول تطلب الإذن فوراً (بعض المتصفحات هتسمح)
      Notification.requestPermission().then(function (p) {
        if (p === 'granted') {
          registerAndToken();
        } else if (p === 'denied') {
          // المتصفح رفض الطلب التلقائي → أظهر modal
          showModal();
        }
        // لو 'default' يعني الزائر لسه ما ردش (نادر)
      }).catch(function () {
        showModal();
      });
    }).catch(function () {});
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
