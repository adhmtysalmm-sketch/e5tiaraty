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

  // 🎯 الشرط الوحيد للاختفاء الدائم: لو اشترك بالفعل
  if (localStorage.getItem('e5push_token')) return;

  function saveToken(token) {
    if (!token) return;
    fetch(DB + '/push_tokens/' + encodeURIComponent(token) + '.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, t: Date.now() })
    }).then(function (r) {
      if (r.ok) {
        localStorage.setItem('e5push_token', token);
        hideBanner();
      }
    }).catch(function () {});
  }

  function hideBanner() {
    var b = document.getElementById('e5push-banner');
    if (!b) return;
    b.classList.remove('show');
    setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 400);
  }

  function showBanner() {
    if (document.getElementById('e5push-banner')) return;
    if (localStorage.getItem('e5push_token')) return;

    var style = document.createElement('style');
    style.id = 'e5push-style';
    style.textContent =
      '#e5push-banner{position:fixed;top:16px;left:50%;transform:translateX(-50%) translateY(-150%);width:calc(100% - 32px);max-width:520px;background:var(--contentB,#ffffff);border:1px solid var(--contentL,#e5e7eb);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.12);padding:16px 20px;font-family:var(--fontB,system-ui,sans-serif);box-sizing:border-box;z-index:2147483647;transition:transform .4s cubic-bezier(.4,0,.2,1);direction:rtl}' +
      '#e5push-banner.show{transform:translateX(-50%) translateY(0)}' +
      '#e5push-banner .inner{display:flex;align-items:center;gap:14px;padding-right:28px}' +
      '#e5push-banner .icon{width:38px;height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center}' +
      '#e5push-banner .icon svg{width:32px;height:32px}' +
      '#e5push-banner .text{flex:1;min-width:0}' +
      '#e5push-banner .title{font-family:var(--fontH,system-ui,sans-serif);font-size:var(--postF,16px);font-weight:600;color:var(--headC,#111827);line-height:1.4}' +
      '#e5push-banner .sub{font-size:12px;color:var(--bodyCa,#6b7280);line-height:1.4;margin-top:2px}' +
      '#e5push-banner .yes{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 22px;background:#000;color:#fff;border:none;font-size:13px;font-weight:700;border-radius:999px;cursor:pointer;font-family:inherit;flex-shrink:0;white-space:nowrap;transition:opacity .2s ease}' +
      '#e5push-banner .yes:hover{opacity:.85}' +
      '#e5push-banner .x{position:absolute;top:8px;right:8px;width:24px;height:24px;background:transparent;border:none;cursor:pointer;color:var(--bodyCa,#6b7280);font-size:20px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background .2s;font-family:inherit}' +
      '#e5push-banner .x:hover{background:var(--contentL,#e5e7eb)}' +
      '@media (max-width:500px){#e5push-banner{padding:14px 16px;width:calc(100% - 24px);top:12px}#e5push-banner .inner{gap:10px;padding-right:24px}#e5push-banner .yes{padding:0 16px;height:34px;font-size:12px}#e5push-banner .icon svg{width:28px;height:28px}#e5push-banner .title{font-size:15px}}';
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id = 'e5push-banner';
    banner.innerHTML =
      '<button class="x" type="button" aria-label="إغلاق">×</button>' +
      '<div class="inner">' +
        '<div class="icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>' +
            '<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>' +
          '</svg>' +
        '</div>' +
        '<div class="text">' +
          '<div class="title">فعّل الإشعارات</div>' +
          '<div class="sub">عشان توصلك أحدث المقالات والعروض أول ما تنزل من اختيارتي</div>' +
        '</div>' +
        '<button class="yes" type="button">فعّل الآن</button>' +
      '</div>';
    document.body.appendChild(banner);

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        banner.classList.add('show');
      });
    });

    banner.querySelector('.yes').onclick = function (e) {
      e.preventDefault();
      doRequest();
    };
    banner.querySelector('.x').onclick = function (e) {
      e.preventDefault();
      hideBanner();
      // اختفى للزيارة الحالية بس، يرجع في الزيارة الجاية
      sessionStorage.setItem('e5push_dismissed', '1');
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
        // الزائر رفض: أظهر البانر تاني بعد نص ثانية
        setTimeout(showBanner, 500);
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

    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(function (reg) {
      swReg = reg;

      if (Notification.permission === 'granted') {
        registerAndToken();
        return;
      }

      // ⏱️ بعد ثانيتين بالظبط: أظهر البانر (لو مش مخبي للزيارة دي)
      setTimeout(function () {
        if (localStorage.getItem('e5push_token')) return;
        if (sessionStorage.getItem('e5push_dismissed')) return;
        showBanner();
      }, 2000);
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
