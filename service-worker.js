/* ============================================================
   SOLYX LOJISTA - SERVICE WORKER V3
   PWA OFFLINE
   ============================================================
   OBJETIVO
   ONLINE:
       A abertura do aplicativo utiliza a index.html normalmente.
   OFFLINE:
       A abertura do aplicativo NÃO utiliza index.html.
       É entregue diretamente a offline.html.
   JOGOS:
       offline.html e os jogos permanecem disponíveis pelo cache.
   ============================================================ */

/* ============================================================
   1. CONFIGURAÇÃO
   ============================================================ */
const CACHE_NAME = "SolyxLojista-v30";
const OFFLINE_PAGE = "./offline.html";

/*
 * Arquivos que devem existir obrigatoriamente
 * no repositório.
 */

const PRECACHE_FILES = [
    "./offline.html",
    "./fid_game1.html",
    "./fid_game2.html",
    "./fid_game3.html",
    "./fid_game4.html"
];


/* ============================================================
   2. INSTALAÇÃO
   ============================================================ */

self.addEventListener("install", event => {
    console.log(
        "[Solyx SW V3] Instalando:",
        CACHE_NAME
    );
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log(
                    "[Solyx SW V3] Criando cache offline..."
                );
                return cache.addAll(PRECACHE_FILES);
            })
            .then(() => {
                console.log(
                    "[Solyx SW V3] Arquivos offline armazenados."
                );
                /*
                 * Ativa imediatamente a nova versão.
                 */
                return self.skipWaiting();
            })
            .catch(error => {
                console.error(
                    "[Solyx SW V3] ERRO NA INSTALAÇÃO:",
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
        "[Solyx SW V3] Ativando:",
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
                                "[Solyx SW V3] Apagando cache antigo:",
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
                    "[Solyx SW V3] Service Worker ativo."
                );
                /*
                 * Assume imediatamente o controle
                 * das páginas dentro do escopo.
                 */
                return self.clients.claim();
            })
    );
});

/* ============================================================
   4. OBTÉM OFFLINE.HTML DO CACHE
   ============================================================ */
async function obterPaginaOffline() {
    const cache =
        await caches.open(CACHE_NAME);
    /*
     * Primeiro procura usando a URL relativa.
     */
    let resposta =
        await cache.match(OFFLINE_PAGE);
    if (resposta) {
        return resposta;
    }
    /*
     * Segurança adicional:
     * procura usando a URL absoluta.
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
     *
     * Isso só deverá aparecer se o offline.html
     * não tiver sido armazenado corretamente.
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
                    color: #ffffff;

                    font-family:
                        Arial,
                        sans-serif;

                    text-align: center;
                }

                main {
                    padding: 30px;
                }

                h1 {
                    margin-bottom: 10px;
                }

                p {
                    opacity: .7;
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
   5. IDENTIFICA A ABERTURA PRINCIPAL DO APLICATIVO
   ============================================================ */

/*
 * IMPORTANTE:
 *
 * Não queremos tratar todos os HTMLs como a index.
 *
 * Estes são os caminhos considerados como entrada
 * principal do aplicativo.
 */

function ehPaginaInicial(url) {

    const pathname =
        url.pathname;


    /*
     * /solyx-pwa2/
     */

    if (
        pathname.endsWith("/")
    ) {

        return true;

    }


    /*
     * /solyx-pwa2/index.html
     */

    if (
        pathname.endsWith("/index.html")
    ) {

        return true;

    }


    return false;

}


/* ============================================================
   6. FETCH
   ============================================================ */

self.addEventListener("fetch", event => {

    const request =
        event.request;


    /*
     * Trabalhamos somente com GET.
     */

    if (
        request.method !== "GET"
    ) {

        return;

    }


    const url =
        new URL(request.url);


    /* ========================================================
       6.1 ABERTURA PRINCIPAL DO APLICATIVO
       ======================================================== */

    if (
        request.mode === "navigate"
        &&
        ehPaginaInicial(url)
    ) {

        event.respondWith(

            (async () => {

                console.log(
                    "[Solyx SW V3] Entrada do aplicativo:",
                    request.url
                );


                /*
                 * PRIMEIRO:
                 *
                 * Tentamos a rede.
                 *
                 * Se houver internet, a index funciona
                 * normalmente.
                 */

                try {

                    const networkResponse =
                        await fetch(request);


                    /*
                     * Se a rede respondeu corretamente,
                     * usamos a página online.
                     */

                    if (
                        networkResponse
                        &&
                        networkResponse.ok
                    ) {

                        console.log(
                            "[Solyx SW V3] Online → index.html"
                        );


                        return networkResponse;

                    }

                }

                catch (error) {

                    console.log(
                        "[Solyx SW V3] Internet indisponível."
                    );

                }


                /*
                 * CHEGAMOS AQUI:
                 *
                 * A abertura da index não conseguiu
                 * obter a página pela rede.
                 *
                 * Portanto:
                 *
                 * NÃO usamos index.html do cache.
                 *
                 * NÃO usamos páginas anteriormente
                 * navegadas.
                 *
                 * Entregamos diretamente offline.html.
                 */

                console.log(
                    "[Solyx SW V3] Offline → offline.html"
                );


                return obterPaginaOffline();

            })()

        );


        /*
         * Muito importante:
         *
         * Não permitir que esta requisição
         * continue para o restante do handler.
         */

        return;

    }


    /* ========================================================
       6.2 OFFLINE.HTML E JOGOS
       ========================================================

       Para os demais documentos e recursos usamos
       CACHE FIRST.

       Isso é especialmente importante para os jogos.

       Exemplo:

           fid_game1.html
                  ↓
             cache existe
                  ↓
             abre imediatamente

       Mesmo sem internet.
    */


    event.respondWith(

        (async () => {


            /*
             * PRIMEIRO:
             *
             * Procura no cache.
             */

            const cachedResponse =
                await caches.match(request);


            if (cachedResponse) {

                console.log(
                    "[Solyx SW V3] CACHE:",
                    request.url
                );


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
                 * Guarda recursos locais válidos.
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
                    "[Solyx SW V3] Recurso indisponível:",
                    request.url
                );


                /*
                 * Não devolvemos offline.html para recursos
                 * que não sejam navegação principal.
                 *
                 * Isso evita, por exemplo:
                 *
                 * <img> receber HTML
                 * <script> receber HTML
                 * CSS receber HTML
                 */

                throw error;

            }

        })()

    );

});


/* ============================================================
   7. MENSAGENS
   ============================================================ */

self.addEventListener("message", event => {

    if (
        !event.data
    ) {

        return;

    }


    if (
        event.data.action === "SKIP_WAITING"
    ) {

        console.log(
            "[Solyx SW V3] SKIP_WAITING solicitado."
        );


        self.skipWaiting();

    }

});


/* ============================================================
   8. FINAL
   ============================================================ */

console.log(
    "[Solyx SW V3] Carregado:",
    CACHE_NAME
);
