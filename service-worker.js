self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('akram-writer-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/app.js',
        '/recorder.js',
        '/transcription.js',
        '/whisper.js',
        '/summary.js',
        '/export.js',
        '/history.js',
        '/firebase.js',
        '/notifications.js',
        '/storage.js',
        '/autosave.js',
        '/visualizer.js'
      ]).catch(err => console.log('Cache addAll error:', err));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== 'akram-writer-v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open('akram-writer-v1').then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});