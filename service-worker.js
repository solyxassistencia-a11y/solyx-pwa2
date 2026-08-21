/* ============================================================
   SOLYX LOJISTA - SERVICE WORKER V4
   PWA OFFLINE + JOGOS OFFLINE
   ============================================================

   COMPORTAMENTO:

   ONLINE:
       index.html funciona normalmente.

   OFFLINE:
       abertura principal do aplicativo
           ↓
       offline.html

   OFFLINE:
       offline.html → jogo
           ↓
       jogo armazenado no cache
           ↓
       jogo abre normalmente

   IMPORTANTE:
       Os jogos NÃO devem ser redirecionados para
       offline.html quando já estiverem armazenados
       no cache.
   ============================================================ */


/* ============================================================
   1. CONFIGURAÇÃO
   ============================================================ */

const CACHE_NAME = "SolyxLojista-v40";

const OFFLINE_PAGE = "./offline.html";


/*
 * Arquivos que obrigatoriamente devem estar disponíveis
 * quando não houver internet.
 *
 * Incluímos TODOS os jogos existentes no offline.html.
 */

const PRECACHE_FILES = [

    "./offline.html",

    "./fid_game1.html",
    "./fid_game2.html",
    "./fid_game3.html",
    "./fid_game4.html",
    "./fid_game5.html",
    "./fid_game6.html"

];


/* ============================================================
   2. INSTALAÇÃO
   ============================================================ */

self.addEventListener("install", event => {

    console.log(
        "[Solyx SW V4] Instalando:",
        CACHE_NAME
    );


    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => {

                console.log(
                    "[Solyx SW V4] Armazenando arquivos offline..."
                );


                return cache.addAll(PRECACHE_FILES);

            })

            .then(() => {

                console.log(
                    "[Solyx SW V4] Arquivos offline armazenados."
                );


                /*
                 * Ativa imediatamente a nova versão.
                 */

                return self.skipWaiting();

            })

            .catch(error => {

                console.error(
                    "[Solyx SW V4] ERRO ao criar cache:",
                    error
                );

                throw error;

            })

    );

});


/* ============================================================
   3. ATIVAÇÃO
   ============================================================ */

self.addEventListener("activate", event => {

    console.log(
        "[Solyx SW V4] Ativando:",
        CACHE_NAME
    );


    event.waitUntil(

        caches.keys()

            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(cacheName => {

                        if (

                            cacheName.startsWith(
                                "SolyxLojista-"
                            )

                            &&

                            cacheName !== CACHE_NAME

                        ) {

                            console.log(
                                "[Solyx SW V4] Apagando cache antigo:",
                                cacheName
                            );


                            return caches.delete(
                                cacheName
                            );

                        }


                        return Promise.resolve();

                    })

                );

            })

            .then(() => {

                console.log(
                    "[Solyx SW V4] Service Worker ativo."
                );


                /*
                 * Assume imediatamente o controle
                 * das páginas abertas.
                 */

                return self.clients.claim();

            })

    );

});


/* ============================================================
   4. FUNÇÃO — OBTER OFFLINE.HTML
   ============================================================ */

async function obterPaginaOffline() {

    const cache =
        await caches.open(CACHE_NAME);


    /*
     * Primeiro tenta encontrar pelo caminho relativo.
     */

    let resposta =
        await cache.match(OFFLINE_PAGE);


    if (resposta) {

        return resposta;

    }


    /*
     * Depois tenta pelo URL absoluto.
     */

    const urlOffline =
        new URL(
            OFFLINE_PAGE,
            self.location
        ).href;


    resposta =
        await cache.match(urlOffline);


    if (resposta) {

        return resposta;

    }


    /*
     * Fallback extremo.
     */

    return new Response(

        `
        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>Solyx - Offline</title>

            <style>

                body {
                    margin: 0;
                    min-height: 100vh;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    background: #080808;
                    color: #fff;

                    font-family: Arial, sans-serif;

                    text-align: center;
                }

                main {
                    padding: 30px;
                }

            </style>

        </head>

        <body>

            <main>

                <h1>Modo Offline</h1>

                <p>
                    Os jogos offline estão disponíveis.
                </p>

            </main>

        </body>

        </html>
        `,

        {
            status: 200,

            headers: {
                "Content-Type":
                    "text/html; charset=UTF-8"
            }

        }

    );

}


/* ============================================================
   5. FUNÇÃO — IDENTIFICAR JOGOS OFFLINE
   ============================================================ */

function ehJogoOffline(url) {

    const nomeArquivo =
        url.pathname
            .split("/")
            .pop()
            .toLowerCase();


    return /^fid_game[1-6]\.html$/.test(
        nomeArquivo
    );

}


/* ============================================================
   6. FUNÇÃO — JOGO PELO CACHE
   ============================================================ */

async function obterJogoDoCache(request) {

    /*
     * Primeiro procura exatamente a requisição.
     */

    let resposta =
        await caches.match(request);


    if (resposta) {

        console.log(
            "[Solyx SW V4] Jogo encontrado no cache:",
            request.url
        );

        return resposta;

    }


    /*
     * Segurança adicional:
     *
     * procura pelo URL absoluto.
     */

    const url =
        new URL(request.url);


    resposta =
        await caches.match(url.href);


    if (resposta) {

        console.log(
            "[Solyx SW V4] Jogo encontrado pelo URL absoluto:",
            url.href
        );

        return resposta;

    }


    return null;

}


/* ============================================================
   7. FETCH
   ============================================================ */

self.addEventListener("fetch", event => {

    /*
     * Trabalhamos somente com GET.
     */

    if (event.request.method !== "GET") {

        return;

    }


    const request =
        event.request;


    const url =
        new URL(request.url);


    /* ========================================================
       7.1 JOGOS OFFLINE
       ========================================================

       ESTA PARTE É MUITO IMPORTANTE.

       Se o usuário clicar em um jogo enquanto estiver
       offline, NÃO devemos enviar offline.html.

       Devemos entregar o jogo diretamente do cache.
    */

    if (

        request.mode === "navigate"

        &&

        ehJogoOffline(url)

    ) {

        event.respondWith(

            (async () => {

                /*
                 * PRIMEIRO tenta o cache.
                 */

                const jogo =
                    await obterJogoDoCache(request);


                if (jogo) {

                    return jogo;

                }


                /*
                 * Se não estiver no cache, tenta internet.
                 */

                try {

                    return await fetch(request);

                }

                catch (error) {

                    /*
                     * O jogo não está disponível.
                     */

                    return obterPaginaOffline();

                }

            })()

        );


        return;

    }


    /* ========================================================
       7.2 NAVEGAÇÃO NORMAL
       ========================================================

       Para qualquer outra página:

       ONLINE
           ↓
       rede

       OFFLINE
           ↓
       offline.html
    */

    if (request.mode === "navigate") {

        event.respondWith(

            (async () => {

                try {

                    /*
                     * Primeiro tenta a internet.
                     */

                    const networkResponse =
                        await fetch(request);


                    return networkResponse;

                }

                catch (error) {

                    console.log(
                        "[Solyx SW V4] Navegação offline:",
                        request.url
                    );


                    /*
                     * IMPORTANTE:
                     *
                     * NÃO usamos caches.match(request)
                     * aqui.
                     *
                     * Assim evitamos que index.html ou
                     * alguma página externa anteriormente
                     * visitada seja aberta offline.
                     */

                    return obterPaginaOffline();

                }

            })()

        );


        return;

    }


    /* ========================================================
       7.3 RECURSOS INTERNOS DO APLICATIVO
       ========================================================

       CSS
       JS
       imagens
       fontes
       etc.

       Estratégia:
           CACHE FIRST
    */

    event.respondWith(

        (async () => {

            /*
             * Primeiro procura no cache.
             */

            const cachedResponse =
                await caches.match(request);


            if (cachedResponse) {

                return cachedResponse;

            }


            /*
             * Não está no cache.
             *
             * Tenta a internet.
             */

            try {

                const networkResponse =
                    await fetch(request);


                /*
                 * Guarda somente respostas válidas
                 * do próprio domínio.
                 */

                if (

                    networkResponse

                    &&

                    networkResponse.status === 200

                    &&

                    networkResponse.type === "basic"

                ) {

                    const cache =
                        await caches.open(
                            CACHE_NAME
                        );


                    await cache.put(
                        request,
                        networkResponse.clone()
                    );

                }


                return networkResponse;

            }

            catch (error) {

                console.warn(
                    "[Solyx SW V4] Recurso não disponível:",
                    request.url
                );


                /*
                 * Não transformar recursos como
                 * imagens/scripts em offline.html.
                 */

                throw error;

            }

        })()

    );

});


/* ============================================================
   8. MENSAGENS
   ============================================================ */

self.addEventListener("message", event => {

    if (!event.data) {

        return;

    }


    if (
        event.data.action ===
        "SKIP_WAITING"
    ) {

        console.log(
            "[Solyx SW V4] Atualização solicitada."
        );


        self.skipWaiting();

    }

});


/* ============================================================
   9. FINAL
   ============================================================ */

console.log(
    "[Solyx SW V4] Carregado:",
    CACHE_NAME
);
