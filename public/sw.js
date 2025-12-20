// $ongChainn Service Worker - Push Notifications & Offline Music

const CACHE_NAME = 'songchainn-music-v1';
const AUDIO_CACHE_NAME = 'songchainn-audio-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('songchainn-') && name !== CACHE_NAME && name !== AUDIO_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
    ])
  );
});

// Handle fetch requests - serve cached audio when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept audio file requests
  if (event.request.url.includes('.wav') || event.request.url.includes('.mp3') || event.request.url.includes('.m4a')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached audio
            return cachedResponse;
          }
          // Fetch from network if not cached
          return fetch(event.request);
        });
      }).catch(() => {
        // Return offline fallback or error
        return new Response('Audio not available offline', { status: 503 });
      })
    );
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'CACHE_AUDIO') {
    event.waitUntil(
      cacheAudioFile(payload.url, payload.songId)
        .then(() => {
          // Notify all clients that caching is complete
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'AUDIO_CACHED',
                payload: { songId: payload.songId, success: true }
              });
            });
          });
        })
        .catch((error) => {
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'AUDIO_CACHE_ERROR',
                payload: { songId: payload.songId, error: error.message }
              });
            });
          });
        })
    );
  }

  if (type === 'REMOVE_CACHED_AUDIO') {
    event.waitUntil(
      removeCachedAudio(payload.url)
        .then(() => {
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'AUDIO_REMOVED',
                payload: { songId: payload.songId, success: true }
              });
            });
          });
        })
    );
  }

  if (type === 'GET_CACHED_SONGS') {
    event.waitUntil(
      getCachedSongUrls().then((urls) => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHED_SONGS_LIST',
              payload: { urls }
            });
          });
        });
      })
    );
  }
});

async function cacheAudioFile(url, songId) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  
  // Fetch the audio file
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  // Cache the response
  await cache.put(url, response.clone());
  
  return true;
}

async function removeCachedAudio(url) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  await cache.delete(url);
  return true;
}

async function getCachedSongUrls() {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const keys = await cache.keys();
  return keys.map((request) => request.url);
}

// Push notification handlers
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
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});