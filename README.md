# 🔔 نظام الإشعارات الويب الخاص — E5tiaraty

نظام Web Push Notifications كامل ومملوك ذاتياً لموقع `www.e5tiaraty.com` (بلوجر)،
مبني على Firebase Cloud Messaging + Cloudflare Worker + Realtime Database.
بدون أي خدمة خارجية مدفوعة، بدون حدود على المشتركين أو الرسائل.

---

## 📋 بطاقة المشروع

| البند | القيمة |
|-------|--------|
| الموقع | https://www.e5tiaraty.com |
| مشروع Firebase | `e5tiaraty-e09b2` (خطة Spark مجانية) |
| قاعدة البيانات | Realtime Database — منطقة `europe-west1` |
| مستودع الكود | https://github.com/adhmtysalmm-sketch/e5tiaraty (Public) |
| الـ Worker | `fcm-sw` على Cloudflare (خطة Free) |
| نطاق Cloudflare | `e5tiaraty.com` (Zone Active + Proxy على www) |
| email المالك | adhmtysalmm@gmail.com |
| تكلفة التشغيل | 0 جنيه / مدى الحياة (في حدود الحصص المجانية) |

---

## 🏗️ المعمارية الكاملة

```
[الزائر يفتح الموقع]
        │
        │ (1) سطر التحميل في قالب بلوجر (بعد 1 ثانية من load)
        ↓
[push.js يُحمّل من www.e5tiaraty.com/push.js]
        │
        │ (2) يسجّل الـ Service Worker من الجذر
        ↓
[firebase-messaging-sw.js من www.e5tiaraty.com/firebase-messaging-sw.js]
        │   ↑ الملفين بيقدّمهم Cloudflare Worker من GitHub
        │   (بلوجر مش بيسمح بملفات في الجذر — الـ Worker بيحل ده)
        ↓
[الويدجت في الصفحة → الزائر يدوس "فعّل الآن"]
        │
        │ (3) طلب إذن المتصفح (User Gesture = قبول مضمون)
        ↓
[messaging.getToken(vapidKey) → توكن FCM]
        │
        │ (4) حفظ عبر REST PUT (بدون SDK = صفر اتصالات websocket)
        ↓
[Realtime Database → push_tokens/<token>]
        │
        │ (5) الإرسال: Firebase Console → Messaging → Campaign
        ↓
[FCM → Push Service للمتصفح → الإشعار يطن والموقع مقفول] 🔔
```

### جدول المكوّنات

| # | المكوّن | مكانه الفعلي | وظيفته |
|---|---------|--------------|--------|
| 1 | `firebase-messaging-sw.js` | GitHub → يُقدّم عبر Worker | استلام الإشعار والموقع مقفول + تصميم الإشعار + معالجة الضغط |
| 2 | `push.js` | GitHub → يُقدّم عبر Worker | تسجيل الـ SW + التوكن + حفظه + ربط الويدجت |
| 3 | ويدجت الاشتراك | بلوجر → التخطيط → Gadget | واجهة الاشتراك الجذابة + رسائل التوست |
| 4 | سطر التحميل | بلوجر → المظهر → قبل `</body>` | تحميل push.js بدون تأخير الصفحة |
| 5 | Worker `fcm-sw` | Cloudflare Workers | تقديم الملفين من جذر الموقع + كاش Edge |
| 6 | Routes | Cloudflare → Workers Routes | ربط المسارين بالـ Worker |
| 7 | قواعد الأمان | Firebase → RTDB → Rules | عزل push_tokens عن عداد المشاهدات |

---

## 🔑 بيانات الاعتماد (Credentials)

> ملاحظة أمنية: الـ firebaseConfig والـ VAPID العام **بيانات عامة بطبيعتها**
> (تظهر في كود أي موقع Firebase). السر الحقيقي هو:
> - قواعد الأمان (RTDB Rules)
> - حساب المالك (adhmtysalmm@gmail.com)
> - أي Service Account Key (غير مستخدم في هذا المشروع — لا تنشئه ولا تشاركه)

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDfubs4-3j4cN0w0OyHq99pMIKpnFXw1BQ",
  authDomain: "e5tiaraty-e09b2.firebaseapp.com",
  databaseURL: "https://e5tiaraty-e09b2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "e5tiaraty-e09b2",
  storageBucket: "e5tiaraty-e09b2.firebasestorage.app",
  messagingSenderId: "309666700278",
  appId: "1:309666700278:web:9f585b9771db49378605d7",
  measurementId: "G-18RCC0M00Y"
};
```

```
VAPID Public Key:
BMg23HLA3vir_7PB7N2SpG1sUUdtkroqogZdP3hMpzS69e2ZCXBXjJ3uDl1oMZvGVNXDId_MJPqKA2x5YP1jFtg
```

### روابط مهمة

| الرابط | الغرض |
|--------|-------|
| `https://raw.githubusercontent.com/adhmtysalmm-sketch/e5tiaraty/main/firebase-messaging-sw.js` | مصدر الـ SW |
| `https://raw.githubusercontent.com/adhmtysalmm-sketch/e5tiaraty/main/push.js` | مصدر push.js |
| `https://www.e5tiaraty.com/firebase-messaging-sw.js` | الـ SW من جذر الموقع (عبر Worker) |
| `https://www.e5tiaraty.com/push.js` | push.js من الموقع (عبر Worker) |
| `https://fcm-sw.adhmtysalmm.workers.dev` | معاينة الـ Worker المباشرة |
| `https://console.firebase.google.com/project/e5tiaraty-e09b2/messaging` | لوحة إرسال الإشعارات |

---

## 📄 المكوّن 1: firebase-messaging-sw.js

**المسار في الـ Repo:** `/firebase-messaging-sw.js`
**الدور:** ده الـ Service Worker — المتصفح بيصحّيه لما يوصل إشعار والموقع مقفول،
وبيعرضه، وبيفتح الرابط لما المستخدم يضغط.

```javascript
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

/* ========== قسم التصميم — عدّل من هنا براحتك ========== */
const DESIGN = {
  icon: 'https://www.e5tiaraty.com/favicon.ico',  // الأيقونة الكبيرة جنب العنوان
  badge: 'https://www.e5tiaraty.com/favicon.ico', // أيقونة شريط الحالة (أندرويد)
  defaultUrl: 'https://www.e5tiaraty.com/',       // الرابط لو الرسالة مالهاش رابط
  requireInteraction: false,  // true = الإشعار يفضل موجود لحد ما المستخدم يقفله بنفسه
  silent: false,              // true = بدون صوت ولا اهتزاز
  vibrate: [200, 100, 200],   // نمط الاهتزاز (أندرويد فقط)
  tag: 'e5tiaraty-push'       // نفس التاج = الإشعار الجديد بيستبدل القديم مش بيكدّسه
};
/* ========== نهاية قسم التصميم ========== */

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const notificationOptions = {
    body: n.body || '',
    icon: n.icon || DESIGN.icon,
    badge: DESIGN.badge,
    tag: DESIGN.tag,
    silent: DESIGN.silent,
    vibrate: DESIGN.vibrate,
    requireInteraction: DESIGN.requireInteraction,
    data: { url: (payload.data && payload.data.url) || n.click_action || DESIGN.defaultUrl }
  };
  self.registration.showNotification(n.title || 'اختياراتي', notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  const url = event.notification.data && event.notification.data.url;
  if (!url) return; // رسائل Composer المباشرة: سيب الـ SDK يفتح رابطها لوحده
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        list[0].focus();
        return list[0].navigate(url);
      }
      return clients.openWindow(url);
    })
  );
});
```

### شرح الأسطر المهمة

| السطر | الوظيفة |
|-------|---------|
| `importScripts` ×2 | تحميل Firebase SDK داخل الـ Worker (بيئة منفصلة عن الصفحة) |
| `onBackgroundMessage` | بيشتغل لما الإشعار يوصل والموقع **مقفول** |
| `data.url` | الرابط اللي هيتفتح لما المستخدم يدوس على الإشعار |
| `notificationclick` | لو فيه تاب مفتوح → ركّز عليه ونقّله للرابط؛ لو مفيش → افتح تاب جديد |
| `if (!url) return;` | حماية: رسائل الـ Composer اللي مالهاش data.url يتولاها الـ SDK |

### ملاحظة تصميم صادقة
شكل إطار الإشعار (خط/ألوان/خلفية) بيرسمه نظام التشغيل — الموقع يتحكم فقط في:
الأيقونة، الصورة، العنوان، النص، الاهتزاز، السلوك (كلهم في قسم DESIGN).

---

## 📄 المكوّن 2: push.js

**المسار في الـ Repo:** `/push.js`
**الدور:** العقل في الصفحة: يسجّل الـ SW، ياخد التوكن، يحفظه في الداتابيز عبر REST،
ويوفر دالة `window.e5push_request` اللي الويدجت بينادي عليها.
**مهم:** مفيش SDK ريال تايم هنا — الحفظ عبر `fetch PUT` = صفر اتصالات websocket = صفر تأثير على عداد المشاهدات.

```javascript
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
      }
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
```

### قرارات هندسية في الملف ده

| القرار | السبب |
|--------|-------|
| حفظ التوكن بـ REST PUT | بدون SDK ريال تايم → بدون websocket → لا يلمس حصة الـ 100 اتصال بتاعة العداد |
| `localStorage.e5push_token` | كتابة واحدة في عمر الزائر + التحكم في ظهور الويدجت |
| `window.e5push_request` | فصل الواجهة (الويدجت) عن المنطق (push.js) |
| `onMessage` | إشعار فوري داخل الصفحة لو الزائر فاتح الموقع لحظة الإرسال |
| فحص `https:` و دعم المتصفح | عدم تشغيل أي سطر في بيئات مش مدعومة |

---

## 📄 المكوّن 3: ويدجت الاشتراك (Gadget في بلوجر)

**المكان:** بلوجر → التخطيط → Add a Gadget → HTML/JavaScript
**الدور:** واجهة الاشتراك الجذابة + رسائل التوست + الاختفاء الذكي.
**السلوك:** يظهر لكل زائر غير مشترك، ويختفي نهائياً بعد الاشتراك.

```html
<div id="e5push-widget" dir="rtl">
  <div class="widget-inner">
    <div class="bell-wrap">
      <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="bell-ring"></span>
    </div>
    <div class="widget-text">
      <div class="widget-title">🔔 ما تفوتش حاجة!</div>
      <div class="widget-sub">وصّل أحدث المقالات والعروض على موبايلك مباشرة</div>
    </div>
    <button class="widget-btn" type="button" id="e5push-widget-btn">فعّل الآن</button>
  </div>
</div>

<style>
#e5push-widget{
  width:100%;
  max-width:100%;
  margin:16px 0;
  background:linear-gradient(135deg,var(--contentB,#fff) 0%,var(--contentB,#f9fafb) 100%);
  border:1px solid var(--contentL,#e5e7eb);
  border-radius:14px;
  box-shadow:0 4px 20px rgba(0,0,0,.06);
  padding:18px 20px;
  font-family:var(--fontB,system-ui,sans-serif);
  box-sizing:border-box;
  position:relative;
  overflow:hidden;
  transition:all .4s ease;
}
#e5push-widget:hover{
  box-shadow:0 8px 30px rgba(0,0,0,.1);
  transform:translateY(-2px);
}
#e5push-widget::before{
  content:'';
  position:absolute;
  top:0;left:-100%;
  width:100%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(59,130,246,.08),transparent);
  animation:widget-shine 4s infinite;
}
@keyframes widget-shine{
  0%{left:-100%}
  50%,100%{left:100%}
}
#e5push-widget .widget-inner{
  display:flex;
  align-items:center;
  gap:14px;
  position:relative;
  z-index:2;
}
#e5push-widget .bell-wrap{
  position:relative;
  width:48px;height:48px;
  flex-shrink:0;
  background:linear-gradient(135deg,#3b82f6,#1e40af);
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 4px 12px rgba(59,130,246,.3);
}
#e5push-widget .bell-icon{
  width:26px;height:26px;
  color:#fff;
  animation:bell-swing 3s ease-in-out infinite;
  transform-origin:top center;
}
#e5push-widget .bell-ring{
  position:absolute;
  top:8px;right:8px;
  width:10px;height:10px;
  background:#ef4444;
  border-radius:50%;
  border:2px solid var(--contentB,#fff);
  animation:bell-pulse 1.5s ease-in-out infinite;
}
@keyframes bell-swing{
  0%,100%{transform:rotate(0)}
  15%{transform:rotate(-15deg)}
  30%{transform:rotate(12deg)}
  45%{transform:rotate(-8deg)}
  60%{transform:rotate(5deg)}
  75%{transform:rotate(0)}
}
@keyframes bell-pulse{
  0%,100%{transform:scale(1);opacity:1}
  50%{transform:scale(1.3);opacity:.7}
}
#e5push-widget .widget-text{
  flex:1;
  min-width:0;
}
#e5push-widget .widget-title{
  font-family:var(--fontH,system-ui,sans-serif);
  font-size:var(--postF,16px);
  font-weight:700;
  color:var(--headC,#111827);
  line-height:1.3;
  margin-bottom:3px;
}
#e5push-widget .widget-sub{
  font-size:13px;
  color:var(--bodyCa,#6b7280);
  line-height:1.4;
}
#e5push-widget .widget-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  height:40px;
  padding:0 22px;
  background:#000;
  color:#fff;
  border:none;
  font-size:13px;
  font-weight:700;
  border-radius:999px;
  cursor:pointer;
  font-family:inherit;
  flex-shrink:0;
  white-space:nowrap;
  transition:all .25s ease;
  box-shadow:0 2px 8px rgba(0,0,0,.15);
}
#e5push-widget .widget-btn:hover{
  background:#1f2937;
  transform:scale(1.05);
  box-shadow:0 4px 12px rgba(0,0,0,.25);
}
#e5push-widget .widget-btn:active{
  transform:scale(.98);
}
#e5push-widget.hide{
  opacity:0;
  transform:translateY(-20px);
  pointer-events:none;
  max-height:0;
  margin:0;
  padding:0;
  border:none;
  overflow:hidden;
}

/* ===== توست الرسائل ===== */
#e5push-toast{
  position:fixed;
  top:16px;
  left:50%;
  transform:translateX(-50%) translateY(-150%);
  max-width:calc(100% - 32px);
  background:var(--contentB,#ffffff);
  border:1px solid var(--contentL,#e5e7eb);
  border-right:4px solid #22c55e;
  border-radius:12px;
  box-shadow:0 10px 40px rgba(0,0,0,.15);
  padding:14px 20px;
  font-family:var(--fontB,system-ui,sans-serif);
  font-size:14px;
  font-weight:600;
  color:var(--headC,#111827);
  direction:rtl;
  z-index:2147483647;
  transition:transform .4s cubic-bezier(.4,0,.2,1);
  box-sizing:border-box;
}
#e5push-toast.show{
  transform:translateX(-50%) translateY(0);
}
#e5push-toast.warn{
  border-right-color:#f59e0b;
}
@media (max-width:500px){
  #e5push-widget{padding:14px 16px;margin:12px 0}
  #e5push-widget .widget-inner{gap:10px;flex-wrap:wrap}
  #e5push-widget .bell-wrap{width:42px;height:42px}
  #e5push-widget .bell-icon{width:22px;height:22px}
  #e5push-widget .widget-title{font-size:15px}
  #e5push-widget .widget-sub{font-size:12px}
  #e5push-widget .widget-btn{width:100%;height:38px;margin-top:4px;font-size:13px}
  #e5push-toast{font-size:13px;padding:12px 16px;top:12px}
}
</style>

<script>
(function(){
  var widget = document.getElementById('e5push-widget');
  var btn = document.getElementById('e5push-widget-btn');
  if (!widget || !btn) return;

  function hideWidget(){
    widget.classList.add('hide');
    setTimeout(function(){ if(widget.parentNode) widget.parentNode.removeChild(widget); }, 500);
  }

  function showToast(msg, type){
    var old = document.getElementById('e5push-toast');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var t = document.createElement('div');
    t.id = 'e5push-toast';
    if (type === 'warn') t.className = 'warn';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ t.classList.add('show'); });
    });
    setTimeout(function(){
      t.classList.remove('show');
      setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 3200);
  }

  function checkSubscription(){
    if (localStorage.getItem('e5push_token') || !('Notification' in window)){
      hideWidget();
    }
  }

  function onRequest(){
    if (!('Notification' in window)){
      showToast('⚠️ متصفحك لا يدعم الإشعارات', 'warn');
      return;
    }

    // الحالة 1: الإشعارات مفعلة بالفعل
    if (Notification.permission === 'granted'){
      showToast('✅ الإشعارات مفعلة بالفعل عندك — هتوصلك كل جديد أول بأول');
      if (window.e5push_request) window.e5push_request();
      hideWidget();
      return;
    }

    // الحالة 3: محظورة من المتصفح
    if (Notification.permission === 'denied'){
      showToast('⚠️ الإشعارات محظورة من المتصفح — افتح إعدادات الموقع من أيقونة القفل في شريط العنوان وفعّلها', 'warn');
      return;
    }

    // الحالة 2: أول مرة — اطلب الإذن
    Notification.requestPermission().then(function(p){
      if (p === 'granted'){
        showToast('🎉 تم تفعيل الإشعارات بنجاح!');
        if (window.e5push_request) window.e5push_request();
        hideWidget();
      } else if (p === 'denied'){
        showToast('⚠️ تم حظر الإشعارات — تقدر تفعّلها لاحقاً من إعدادات الموقع', 'warn');
      }
    });
  }

  btn.addEventListener('click', onRequest);
  checkSubscription();
  setInterval(checkSubscription, 2000);
})();
</script>
```

### جدول سلوك الويدجت

| حالة الزائر | السلوك |
|-------------|--------|
| غير مشترك | الويدجت ظاهر ومتحرك |
| داس "فعّل الآن" ووافق | توست نجاح + اختفاء نهائي |
| داس "فعّل الآن" وهو مفعّل بالفعل | توست تأكيد + اختفاء نهائي |
| الإشعارات محظورة عنده | توست تحذيري بإرشادات التفعيل + الويدجت يفضل ظاهر |
| مشترك قديم (token موجود) | الويدجت مش بيت رسم أصلاً |

### متغيرات CSS المستخدمة (من قالب الموقع)
`--contentB` خلفية، `--contentL` حدود، `--headC` عناوين، `--bodyCa` نص ثانوي،
`--fontB`/`--fontH` خطوط، `--postF` حجم خط — مع fallback لو مش موجودة.

---

## 📄 المكوّن 4: سطر التحميل في قالب بلوجر

**المكان:** بلوجر → المظهر → تعديل HTML → قبل `</body>` مباشرة

```html
<script type="text/javascript">
window.addEventListener('load',function(){setTimeout(function(){var g=document.createElement('script');g.src='https://www.e5tiaraty.com/push.js';g.async=true;document.head.appendChild(g);},1000);});
</script>
```

**لماذا بهذا الشكل؟**
- `load` + تأخير 1 ثانية = لا يؤثر على سرعة فتح الصفحة ولا على Core Web Vitals
- تحميل async = لا يحجب أي محتوى
- نفس نمط تكويد خدمات الدفع التجارية لكن الملف ملكنا

---

## 📄 المكوّن 5: Cloudflare Worker (fcm-sw)

**المكان:** Cloudflare → Workers & Pages → fcm-sw → Edit code
**الدور:** بلوجر لا يسمح بملفات في جذر الموقع. الـ Worker بيقدّم الملفين
من `www.e5tiaraty.com` مباشرة مع كاش Edge لمدة يوم.

```javascript
const BASE = 'https://raw.githubusercontent.com/adhmtysalmm-sketch/e5tiaraty/main';

const FILES = {
  '/firebase-messaging-sw.js': BASE + '/firebase-messaging-sw.js',
  '/push.js': BASE + '/push.js'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = FILES[url.pathname];

    if (!target) {
      return new Response('Not found', { status: 404 });
    }

    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let response = await cache.match(cacheKey);

    if (!response) {
      const upstream = await fetch(target);
      if (!upstream.ok) {
        return new Response('Source unavailable', { status: 502 });
      }

      const headers = new Headers();
      headers.set('Content-Type', 'application/javascript; charset=utf-8');
      headers.set('Cache-Control', 'public, max-age=86400');
      if (url.pathname === '/firebase-messaging-sw.js') {
        headers.set('Service-Worker-Allowed', '/');
      }

      response = new Response(await upstream.text(), { status: 200, headers });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};
```

### الـ Routes المرتبطة (Cloudflare → Zone e5tiaraty.com → Workers Routes)

| Route | Worker |
|-------|--------|
| `www.e5tiaraty.com/firebase-messaging-sw.js*` | fcm-sw |
| `www.e5tiaraty.com/push.js*` | fcm-sw |

### ملاحظات التشغيل
- `Content-Type: application/javascript` إجباري — المتصفح يرفض تسجيل SW بنوع خاطئ
- `max-age=86400` = تحديث التعديلات يوصل خلال 24 ساعة كحد أقصى
- بعد أي تعديل في GitHub: Cloudflare → Caching → Purge Everything للتطبيق الفوري
- استهلاك حصة الـ Worker شبه معدوم بسبب كاش Edge

---

## 📄 المكوّن 6: قواعد الأمان (Realtime Database Rules)

**المكان:** Firebase → Realtime Database → Rules
**المبدأ:** الجذر مقفول تماماً، وبلوك `blogs` (عداد المشاهدات) معزول ولم يُلمس،
وبلوك `push_tokens` جديد بصلاحيات دقيقة.

```json
{
  "rules": {
    ".write": false,
    ".read": false,
    "blogs": {
      "$blog_id": {
        ".validate": "$blog_id.matches(/^\\d{18,22}$/) && ($blog_id === '5409807792241297864')",
        "posts": {
          "$post_id": {
            ".validate": "$post_id.matches(/^\\d{18,22}$/)",
            "views": {
              ".read": true,
              ".write": "newData.exists()",
              ".validate": "newData.isNumber() && newData.val() % 1 === 0 && newData.val() === (data.exists() ? data.val() + 1 : 1)"
            }
          }
        }
      }
    },
    "push_tokens": {
      ".read": "auth != null && auth.token.email == 'adhmtysalmm@gmail.com'",
      "$token": {
        ".write": "newData.exists() || (auth != null && auth.token.email == 'adhmtysalmm@gmail.com')",
        ".validate": "$token.length > 100 && $token.length < 300 && newData.hasChildren(['token', 't']) && newData.child('token').val() === $token && newData.child('t').isNumber()"
      }
    }
  }
}
```

### شرح صلاحيات push_tokens

| القاعدة | المعنى |
|---------|--------|
| `.read` بإيميل المالك | قائمة المشتركين سرية — تقرأها فقط من حسابك |
| `.write: newData.exists()` | الزائر ينشئ/يحدّث توكنه — لا حذف عشوائي |
| استثناء المالك في `.write` | تقدر تحذف التوكنات الميتة يدوياً |
| طول المفتاح 100-300 | رفض أي سبام بشكل تلقائي |
| `token === $token` | المفتاح = القيمة → استحالة انتحال توكن غيرك |
| `t` رقم | طابع زمني سليم لكل تسجيل |

---

## 🔄 دورة حياة الاشتراك (End-to-End)

1. الزائر يفتح أي صفحة → سطر التحميل يجيب push.js بعد 1 ثانية
2. push.js يسجّل `/firebase-messaging-sw.js` (من الجذر عبر الـ Worker)
3. الويدجت يظهر (جرس متحرك + لمعة + نقطة نابضة)
4. الزائر يدوس "فعّل الآن" → إذن المتصفح (User Gesture)
5. `getToken(vapidKey)` → توكن FCM
6. `PUT /push_tokens/<token>.json` عبر REST → حفظ + `localStorage.e5push_token`
7. الويدجت يختفي نهائياً (مراقبة كل 2 ثانية)
8. عند الإرسال: FCM → الـ SW → إشعار على الشاشة والموقع مقفول
9. الضغط على الإشعار → تركيز تاب موجود وت导航 للرابط، أو فتح تاب جديد

---

## 📤 الإرسال: الطرق المتاحة

### الطريقة 1: Firebase Composer (إرسال جماعي)
1. https://console.firebase.google.com/project/e5tiaraty-e09b2/messaging
2. New campaign → Notifications message
3. عنوان + نص + (اختياري صورة)
4. Targeting: User segment → App = `e5tiaraty`
5. (اختياري احترافي) Additional options → Custom data → Key: `url` / Value: رابط المقال
6. Review → Publish

> ⚠️ معروف: القوائم الجماعية بتاعت فايربيس بتتزامن خلال ساعات (توصل 24 ساعة)
> للمشتركين الجدد. مشترك سجّل دلوقتي ممكن ما يستقبلش حملة اليوم — يستقبل من بكرة.

### الطريقة 2: رسالة اختبار (لحظية بتوكن محدد)
نفس الشاشة → Send test message → لصق التوكن من `push_tokens` → Test
(توصيل فوري — مثالية للاختبار والتحقق)

---

## 🛠️ الصيانة

### تعديل أي كود
```
GitHub → Edit → Commit
Cloudflare → Caching → Purge Everything
انتظار دقيقة → اختبار في تاب متخفي
```

### تنظيف التوكنات الميتة (شهرياً)
Firebase → Realtime Database → Data → push_tokens
→ حذف أي توكن قديم/ميت (مسموح لحساب المالك فقط بالقواعد)

### حقائق تشغيلية طبيعية
| الظاهرة | السبب |
|---------|-------|
| حملة جماعية Sends=0 لأول مشتركين | مزامنة قوائم فايربيس (توصل 24 ساعة) |
| تعديل الـ SW يتأخر عند المشتركين | كاش المتصفح للـ SW (24 ساعة) |
| اشتراك Incognito يموت | التابات المتخفية بت مسح الـ SW عند الإغلاق |
| رسالة اختبار توصل فوراً | إرسال مباشر بالتوكن بدون قوائم |

---

## 🚫 لا تلمس أبداً

- ❌ مفتاح VAPID (أي Rotate = موت كل الاشتراكات الحالية)
- ❌ بلوك `blogs` في القواعد (عداد المشاهدات المضمون)
- ❌ مفتاح `e5push_token` في localStorage (تحكم ظهور الويدجت)
- ❌ Proxy البرتقالي على سجل www في Cloudflare DNS (الـ Worker يعتمد عليه)
- ❌ إنشاء Service Account Key أو مشاركته (غير مستخدم — لا تنشئه أصلاً)

---

## 🚑 استكشاف الأخطاء

| العرض | التشخيص | الحل |
|-------|---------|------|
| `/firebase-messaging-sw.js` يطلع صفحة بلوجر | الـ Proxy رمادي أو الـ Route محذوف | برتقالي السحابة + تأكد من الـ Routes |
| خطأ 502 من الـ Worker | الـ Repo بقى Private | رجّعه Public |
| الويدجت مش ظاهر | الكاش أو السطر مش في القالب | Purge + تأكد من السطر قبل `</body>` |
| إشعار ما وصلش (حملة) | مشترك جديد ضمن فترة المزامنة | استخدم رسالة اختبار أو انتظر 24 ساعة |
| إشعار ما وصلش (اختبار) | توكن ميت (Incognito قديم) | اشترك من تاب عادي وخذ توكن جديد |
| الإذن مرفوض نهائياً | الزائر حظره من المتصفح | إرشادات التوست: إعدادات الموقع من أيقونة القفل |

---

## 🗺️ خارطة التطوير المستقبلي (كلها مجانية)

| المرحلة | الميزة | الفكرة |
|---------|--------|--------|
| A | لوحة تحكم خاصة | صفحة ثابتة + Google Login + REST → إرسال لحظي بدون مزامنة |
| B | إرسال تلقائي لكل مقال | Worker Cron يقرأ فيد بلوجر ويبعت لوحده |
| C | إحصائيات فتح/ضغط | رابط تتبع + عدّادات في RTDB |
| D | تقسيم المشتركين Tags | حقل إضافي عند التسجيل + فلاتر إرسال |
| E | اختبار A/B للعناوين | منطق عينة في لوحة التحكم |
| F | إشعارات غنية | أزرار أكشن + صور كبيرة عبر قسم DESIGN |

---

## 📜 سجل المراحل (ما تم تنفيذه)

1. ✅ إنشاء/اعتماد مشروع Firebase `e5tiaraty-e09b2` + تطبيق ويب + VAPID
2. ✅ قواعد الأمان المدموجة (عداد معزول + push_tokens مؤمن)
3. ✅ رفع `firebase-messaging-sw.js` على GitHub (Public)
4. ✅ Worker `fcm-sw` + Routes على جذر الموقع (حل معضلة بلوجر)
5. ✅ `push.js` بتسجيل REST بدون SDK
6. ✅ سطر التحميل في قالب بلوجر
7. ✅ ويدجت الاشتراك المتحرك + التوست
8. ✅ أول اشتراك حقيقي + أول إشعار واصّل بنجاح

---

> **ملخص الفلسفة:** نواة مملوكة 100% (SW + VAPID + FCM + DB)،
> توصيل مجاني غير محدود من جوجل، صفر خدمات خارجية،
> وكل طبقة فوقية (لوحة/أتمتة/إحصائيات) قابلة للإضافة لاحقاً بدون إعادة بناء.
