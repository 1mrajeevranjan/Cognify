const CACHE_NAME = 'cognify-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './src/app.js',
  './src/store.js',
  './src/utils.js',
  './src/supabase.js',
  './src/components/views.js',
  './src/components/item.js',
  './src/components/quickentry.js',
  './src/components/pomodoro.js',
  './src/components/habits.js',
  './src/components/kanban.js',
  './src/components/workspaces.js',
  './src/components/workload.js',
  './src/components/analytics.js',
  './src/components/eisenhower.js',
  './src/components/calendar.js',
  './src/components/weeklyreview.js',
  './src/import.js',
  './src/ai.js',
  './lib/chrono.js',
  './lib/supabase.js',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate: return cached response immediately, update cache in background
        fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          })
          .catch(() => { /* ignore background network errors */ });
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      });
    })
  );
});
