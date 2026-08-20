/* ============================================================
   SOLYX LOJISTA - SERVICE WORKER
   Versão robusta para funcionamento offline
   ============================================================ */

/* ============================================================
   CONFIGURAÇÃO
   ============================================================ */

const CACHE_NAME = "SolyxLojista-v19";

/*
 * Arquivos essenciais que devem existir offline.
 *
 * IMPORTANTE:
 * Todos estes arquivos precisam estar no mesmo diretório
 * do service-worker.js.
 */
const ARQUIVOS_PARA_CACHEAR = [
    "./index.html",
    "./offline.html",
    "./fid_game1.html",
    "./fid_game2.html",
    "./fid_game3.html",
    "./fid_game4.html"
];


/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener("install", event => {

    console.log(
        "[Solyx SW] Instalando versão:",
        CACHE_NAME
    );

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                console.log(
                    "[Solyx SW] Armazenando arquivos essenciais..."
                );

                return cache.addAll(ARQUIVOS_PARA_CACHEAR);

            })
            .then(() => {

                console.log(
                    "[Solyx SW] Cache inicial concluído."
                );

                /*
                 * Faz o novo Service Worker assumir
                 * o controle imediatamente.
                 */
                return self.skipWaiting();

            })
            .catch(error => {

                console.error(
                    "[Solyx SW] ERRO ao criar cache:",
                    error
                );

                /*
                 * Se algum arquivo obrigatório não puder
                 * ser armazenado, a instalação falha.
                 *
                 * Isso é proposital:
                 * não queremos considerar o SW instalado
                 * se os arquivos essenciais não estiverem
                 * disponíveis offline.
                 */

                throw error;

            })

    );

});


/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener("activate", event => {

    console.log(
        "[Solyx SW] Ativando:",
        CACHE_NAME
    );

    event.waitUntil(

        caches.keys()

            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(cacheName => {

                        /*
                         * Remove somente caches antigos
                         * pertencentes ao Solyx.
                         */
                        if (
                            cacheName.startsWith("SolyxLojista-") &&
                            cacheName !== CACHE_NAME
                        ) {

                            console.log(
                                "[Solyx SW] Removendo cache antigo:",
                                cacheName
                            );

                            return caches.delete(cacheName);
                        }

                        return Promise.resolve(false);

                    })

                );

            })

            .then(() => {

                /*
                 * Faz o SW assumir imediatamente o controle
                 * das páginas abertas dentro do escopo.
                 */
                return self.clients.claim();

            })

    );

});


/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener("fetch", event => {

    /*
     * Trabalhamos somente com requisições GET.
     *
     * POST, PUT, DELETE etc. não devem ser tratados
     * pelo cache.
     */
    if (event.request.method !== "GET") {
        return;
    }


    const request = event.request;


    /*
     * ========================================================
     * NAVEGAÇÃO DE PÁGINAS
     * ========================================================
     *
     * Exemplo:
     *
     * /solyx-pwa2/index.html
     * /solyx-pwa2/offline.html
     * /solyx-pwa2/fid_game1.html
     *
     * Estratégia:
     *
     * 1. tenta buscar na internet;
     * 2. se conseguir, devolve a página;
     * 3. se falhar, procura no cache;
     * 4. se não encontrar, abre offline.html.
     */

    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)

                .then(networkResponse => {

                    /*
                     * Se a internet respondeu corretamente,
                     * usamos a resposta da rede.
                     */

                    return networkResponse;

                })

                .catch(() => {

                    console.log(
                        "[Solyx SW] Navegação offline:",
                        request.url
                    );

                    /*
                     * Primeiro tenta exatamente a página
                     * que o usuário solicitou.
                     */

                    return caches.match(request)

                        .then(cachedPage => {

                            if (cachedPage) {

                                console.log(
                                    "[Solyx SW] Página encontrada no cache:",
                                    request.url
                                );

                                return cachedPage;
                            }


                            /*
                             * Se a página específica não estiver
                             * no cache, abre a central offline.
                             */

                            console.log(
                                "[Solyx SW] Usando offline.html"
                            );

                            return caches.match("./offline.html");

                        });

                })

        );

        return;
    }


    /*
     * ========================================================
     * OUTROS RECURSOS
     * ========================================================
     *
     * Imagens, CSS, JS, fontes etc.
     *
     * Estratégia:
     *
     * CACHE FIRST
     *
     * 1. procura no cache;
     * 2. se existir, usa cache;
     * 3. caso contrário, tenta internet;
     * 4. se baixar corretamente, salva no cache.
     */

    event.respondWith(

        caches.match(request)

            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }


                /*
                 * Não está no cache.
                 * Tentamos buscar na internet.
                 */

                return fetch(request)

                    .then(networkResponse => {

                        /*
                         * Só armazenamos respostas válidas.
                         */

                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === "basic"
                        ) {

                            const responseToCache =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        request,
                                        responseToCache
                                    );

                                });

                        }

                        return networkResponse;

                    })

                    .catch(error => {

                        console.warn(
                            "[Solyx SW] Recurso indisponível offline:",
                            request.url
                        );

                        /*
                         * Não existe fallback genérico para
                         * imagens, CSS ou JS.
                         *
                         * Retornamos erro para o navegador.
                         */

                        throw error;

                    });

            })

    );

});


/* ============================================================
   MENSAGENS
   ============================================================ */

self.addEventListener("message", event => {

    if (!event.data) {
        return;
    }


    /*
     * Permite que a página solicite que o Service Worker
     * seja ativado imediatamente.
     */

    if (event.data.action === "SKIP_WAITING") {

        console.log(
            "[Solyx SW] Recebido comando SKIP_WAITING."
        );

        self.skipWaiting();

    }

});


/* ============================================================
   DEBUG
   ============================================================ */

console.log(
    "[Solyx SW] Service Worker carregado.",
    CACHE_NAME
);
