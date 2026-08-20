const CACHE_NAME = "AdminFidelidade-v15";
const ARQUIVOS_PARA_CACHEAR = [
  './',
  './index.html',
  './offline.html',
  './fid_game1.html',
  './fid_game2.html',
  './fid_game3.html',
  './fid_game4.html'
];

// 1. INSTALAÇÃO
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Adiciona arquivos um a um para evitar que um erro 404 cancele o cache todo
      for (const arquivo of ARQUIVOS_PARA_CACHEAR) {
        try {
          await cache.add(arquivo);
        } catch (err) {
          console.warn(`Não foi possível cachear: ${arquivo}`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// 2. ATIVAÇÃO
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTAÇÃO DE REDE
self.addEventListener('fetch', event => {
  // Trata navegação de páginas quando estiver offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./offline.html').then(response => {
          return response || caches.match('./');
        });
      })
    );
    return;
  }

  // Trata arquivos estáticos (CSS, imagens, jogos)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
