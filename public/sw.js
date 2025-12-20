// $ongChainn Push Notification Service Worker
const CACHE_NAME = 'songchainn-v1';
const AUDIO_CACHE = 'songchainn-audio-v1';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  clients.claim();
});

// Handle messages from the main thread for caching audio
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    const { url, songId } = event.data;
    caches.open(AUDIO_CACHE).then((cache) => {
      fetch(url).then((response) => {
        if (response.ok) {
          cache.put(`audio-${songId}`, response.clone());
          // Notify the client that caching is complete
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: 'AUDIO_CACHED', songId });
            });
          });
        }
      });
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHED_AUDIO') {
    const { songId } = event.data;
    caches.open(AUDIO_CACHE).then((cache) => {
      cache.match(`audio-${songId}`).then((response) => {
        if (response) {
          response.blob().then((blob) => {
            const url = URL.createObjectURL(blob);
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({ type: 'CACHED_AUDIO_URL', songId, url });
              });
            });
          });
        }
      });
    });
  }
});

// Fetch handler with offline support
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle audio files from cache first
  if (url.pathname.includes('.wav') || url.pathname.includes('.mp3')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
    return;
  }
  
  // Network first for API calls
  if (url.pathname.includes('/rest/') || url.pathname.includes('/functions/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Stale-while-revalidate for other requests
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '$ongChainn', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Track notification dismissals if needed
  console.log('Notification closed:', event.notification.tag);
});