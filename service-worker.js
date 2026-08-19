const CACHE_NAME = "AdminFidelidade-v2"; // Alterado para v2 para forçar a atualização!
const OFFLINE_URL = "./offline.html";

// Agora incluímos todos os arquivos essenciais e os minigames na lista de Cache!
const urlsToCache = [
    "./",
    "./offline.html",
    "./EduQuiz_Offline.html",
    "./Brick_Game_4_em_1.html"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

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

self.addEventListener("fetch", event => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
