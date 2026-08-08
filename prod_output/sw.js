const CACHE_NAME = 'Zopit-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.jpg'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker & delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch events
self.addEventListener('fetch', (event) => {
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('chrome-extension:') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/ws')
  ) {
    return;
  }

  // Network-First strategy for HTML / Navigation
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Stale-While-Revalidate for assets, but never cache HTML for JS/CSS requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          !networkResponse.headers.get('content-type')?.includes('text/html')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Event Listener (Browser Push)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'سفارش جدید در زوپیت 🛍️', body: event.data.text() };
    }
  }

  const title = data.title || 'سفارش جدید دریافت شد! 🛍️';
  const options = {
    body: data.body || 'یک سفارش جدید در فروشگاه شما ثبت گردید. جهت بررسی کلیک کنید.',
    icon: data.icon || '/icon.jpg',
    badge: '/icon.jpg',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.tag || 'order-notification-' + (data.orderId || Date.now()),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/?tab=orders',
      orderId: data.orderId,
      timestamp: Date.now()
    },
    actions: [
      { action: 'view_order', title: 'مشاهده سفارش' },
      { action: 'close', title: 'بستن' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const orderId = event.notification.data?.orderId;
  const targetUrl = event.notification.data?.url || '/?tab=orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and post a message to open orders tab
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'STORE_MANAGER_NEW_ORDER_CLICK',
            orderId: orderId,
            tab: 'orders'
          });
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
