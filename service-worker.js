const CACHE_NAME = "solyx-fidelidade-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json"
];


// INSTALAÇÃO
self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())

    );

});


// ATIVAÇÃO
self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))

            );

        }).then(() => self.clients.claim())

    );

});


// REQUISIÇÕES
self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })

    );

});
