const CACHE_NAME = 'AdminFidelidade-v11';

const ARQUIVOS_PARA_CACHEAR = [
  './offline.html',
  './EduQuiz_Offline.html',
  './Brick_Game_5_em_1.html',
  './Vintage_Calculadora.html'
];


// ============================================================
// INSTALAÇÃO
// ============================================================

self.addEventListener('install', event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                console.log(
                    'App Fidelidade: salvando arquivos offline...'
                );

                return cache.addAll(ARQUIVOS_PARA_CACHEAR);

            })

    );

    // Ativa imediatamente a nova versão
    self.skipWaiting();

});


// ============================================================
// ATIVAÇÃO
// ============================================================

self.addEventListener('activate', event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames.map(cacheName => {

                    if (cacheName !== CACHE_NAME) {

                        console.log(
                            'App Fidelidade: removendo cache antigo:',
                            cacheName
                        );

                        return caches.delete(cacheName);

                    }

                })

            );

        })

    );

    // Assume o controle das páginas imediatamente
    self.clients.claim();

});


// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', event => {

    // --------------------------------------------------------
    // SOMENTE NAVEGAÇÃO DE PÁGINAS
    // --------------------------------------------------------

    if (event.request.mode === 'navigate') {

        event.respondWith(

            fetch(event.request)

                .catch(() => {

                    console.log(
                        'App Fidelidade: sem internet. Abrindo offline.html'
                    );

                    return caches.match('./offline.html');

                })

        );

        return;
    }


    // --------------------------------------------------------
    // OUTROS RECURSOS
    // CSS / JS / IMAGENS / JOGOS ETC.
    // --------------------------------------------------------

    event.respondWith(

        fetch(event.request)

            .catch(() => {

                return caches.match(
                    event.request,
                    { ignoreSearch: true }
                );

            })

    );

});
