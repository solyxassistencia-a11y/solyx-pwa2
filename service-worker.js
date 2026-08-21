/* ============================================================
   SOLYX LOJISTA - SERVICE WORKER V3
   PWA OFFLINE ROBUSTO
   ============================================================

   COMPORTAMENTO:

   ONLINE:
       index.html funciona normalmente.

   OFFLINE:
       qualquer navegação de documento
       -> offline.html

   OFFLINE:
       offline.html
       -> jogos disponíveis

   ARQUIVOS OFFLINE:
       offline.html
       fid_game1.html
       fid_game2.html
       fid_game3.html
       fid_game4.html
       fid_game5.html
       fid_game6.html

   ============================================================ */


/* ============================================================
   1. CONFIGURAÇÃO
   ============================================================ */

/*
 * IMPORTANTE:
 *
 * Toda vez que alterarmos arquivos essenciais do
 * aplicativo, podemos aumentar esta versão.
 */

const CACHE_NAME = "SolyxLojista-v32";


/*
 * Caminho da página oficial offline.
 */

const OFFLINE_PAGE = "./offline.html";


/*
 * Arquivos essenciais que precisam existir
 * mesmo sem conexão com a Internet.
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
        "[Solyx SW V3] Instalando:",
        CACHE_NAME
    );


    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(async cache => {

                console.log(
                    "[Solyx SW V3] Armazenando arquivos offline..."
                );


                /*
                 * Em vez de cache.addAll(), adicionamos
                 * os arquivos individualmente.
                 *
                 * Isso facilita identificar exatamente
                 * qual arquivo eventualmente falhou.
                 */

                for (const arquivo of PRECACHE_FILES) {

                    try {

                        const resposta =
                            await fetch(
                                arquivo,
                                {
                                    cache: "no-cache"
                                }
                            );


                        if (!resposta.ok) {

                            throw new Error(
                                `HTTP ${resposta.status}`
                            );

                        }


                        await cache.put(
                            arquivo,
                            resposta
                        );


                        console.log(
                            "[Solyx SW V3] OK:",
                            arquivo
                        );

                    }

                    catch (erro) {

                        console.error(
                            "[Solyx SW V3] FALHA:",
                            arquivo,
                            erro
                        );

                        /*
                         * Um arquivo essencial com problema
                         * não deve impedir que os outros sejam
                         * armazenados.
                         */

                    }

                }

            })

            .then(() => {

                console.log(
                    "[Solyx SW V3] Instalação concluída."
                );


                /*
                 * Ativa imediatamente a nova versão.
                 */

                return self.skipWaiting();

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

                        /*
                         * Remove somente caches antigos
                         * deste aplicativo.
                         */

                        if (

                            cacheName.startsWith(
                                "SolyxLojista-"
                            )

                            &&

                            cacheName !== CACHE_NAME

                        ) {

                            console.log(
                                "[Solyx SW V3] Removendo cache antigo:",
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
                    "[Solyx SW V3] Cache antigo limpo."
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
   4. OBTÉM OFFLINE.HTML
   ============================================================ */

async function obterPaginaOffline() {

    const cache =
        await caches.open(CACHE_NAME);


    /*
     * Caminho absoluto da página offline.
     */

    const urlOffline =
        new URL(
            OFFLINE_PAGE,
            self.registration.scope
        ).href;


    console.log(
        "[Solyx SW V3] Procurando offline.html:",
        urlOffline
    );


    /*
     * Primeira tentativa:
     * URL absoluta.
     */

    let resposta =
        await cache.match(urlOffline);


    if (resposta) {

        console.log(
            "[Solyx SW V3] offline.html encontrado no cache."
        );


        return resposta;

    }


    /*
     * Segunda tentativa:
     * caminho relativo.
     */

    resposta =
        await cache.match(OFFLINE_PAGE);


    if (resposta) {

        console.log(
            "[Solyx SW V3] offline.html encontrado por caminho relativo."
        );


        return resposta;

    }


    /*
     * Terceira tentativa:
     * procura especificamente entre todas
     * as entradas do cache.
     */

    const chaves =
        await cache.keys();


    for (const request of chaves) {

        const url =
            new URL(
                request.url
            );


        if (
            url.pathname.endsWith(
                "/offline.html"
            )
        ) {

            console.log(
                "[Solyx SW V3] offline.html encontrado por inspeção do cache:",
                request.url
            );


            const respostaEncontrada =
                await cache.match(request);


            if (respostaEncontrada) {

                return respostaEncontrada;

            }

        }

    }


    /*
     * Se chegamos aqui, o offline.html realmente
     * não está disponível no cache.
     *
     * NÃO vamos mais retornar aquela mensagem
     * genérica "Os Jogos offline estão disponíveis".
     *
     * Vamos informar claramente o problema.
     */

    console.error(
        "[Solyx SW V3] ERRO CRÍTICO: offline.html não encontrado no cache."
    );


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

            <meta
                name="theme-color"
                content="#B51217"
            >

            <title>Solyx - Offline</title>

            <style>

                * {
                    box-sizing: border-box;
                }

                body {

                    margin: 0;

                    min-height: 100vh;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    padding: 24px;

                    background: #080808;

                    color: #ffffff;

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    text-align: center;

                }

                main {

                    width: 100%;

                    max-width: 500px;

                    padding: 35px 25px;

                    border-radius: 20px;

                    background: #151515;

                    border:
                        1px solid
                        rgba(255,255,255,.1);

                }

                h1 {

                    margin:
                        0 0 15px;

                    color: #B51217;

                }

                p {

                    line-height: 1.6;

                    opacity: .75;

                }

                button {

                    margin-top: 20px;

                    padding:
                        13px 24px;

                    border: none;

                    border-radius: 10px;

                    background: #B51217;

                    color: #ffffff;

                    font-weight: bold;

                    cursor: pointer;

                }

            </style>

        </head>

        <body>

            <main>

                <h1>Modo Offline</h1>

                <p>
                    A página offline ainda não foi armazenada
                    neste dispositivo.
                </p>

                <button
                    onclick="location.reload()"
                >
                    Tentar novamente
                </button>

            </main>

        </body>

        </html>
        `,

        {
            status: 503,

            headers: {
                "Content-Type":
                    "text/html; charset=UTF-8"
            }

        }

    );

}


/* ============================================================
   5. FETCH
   ============================================================ */

self.addEventListener("fetch", event => {

    const request =
        event.request;


    /*
     * Só interceptamos GET.
     */

    if (
        request.method !== "GET"
    ) {

        return;

    }


    /* ========================================================
       5.1 NAVEGAÇÃO
       ======================================================== */

    if (
        request.mode === "navigate"
    ) {

        event.respondWith(

            (async () => {

                /*
                 * PRIMEIRO:
                 *
                 * tenta acessar a Internet.
                 *
                 * Se funcionar, mantém exatamente
                 * o comportamento normal do aplicativo.
                 */

                try {

                    const respostaRede =
                        await fetch(
                            request
                        );


                    console.log(
                        "[Solyx SW V3] Navegação ONLINE:",
                        request.url
                    );


                    return respostaRede;

                }

                catch (erro) {

                    /*
                     * INTERNET INDISPONÍVEL.
                     *
                     * NÃO fazemos:
                     *
                     * caches.match(request)
                     *
                     * Portanto:
                     *
                     * index.html
                     * páginas antigas
                     * documentos anteriormente visitados
                     *
                     * não serão usados como fallback.
                     */

                    console.log(
                        "[Solyx SW V3] Navegação OFFLINE:",
                        request.url
                    );


                    return obterPaginaOffline();

                }

            })()

        );


        return;

    }


    /* ========================================================
       5.2 RECURSOS NÃO-NAVEGAÇÃO
       ========================================================

       Estratégia:

           CACHE FIRST

       Se já estiver no cache:
           -> usa o cache

       Caso contrário:
           -> tenta Internet
           -> salva no cache
    */


    event.respondWith(

        (async () => {

            /*
             * Procura primeiro no cache.
             */

            const respostaCache =
                await caches.match(
                    request
                );


            if (respostaCache) {

                return respostaCache;

            }


            /*
             * Não encontrou.
             *
             * Tenta a Internet.
             */

            try {

                const respostaRede =
                    await fetch(
                        request
                    );


                /*
                 * Somente respostas normais
                 * do próprio domínio são armazenadas.
                 */

                if (

                    respostaRede &&
                    respostaRede.ok &&
                    respostaRede.type === "basic"

                ) {

                    const cache =
                        await caches.open(
                            CACHE_NAME
                        );


                    await cache.put(
                        request,
                        respostaRede.clone()
                    );

                }


                return respostaRede;

            }

            catch (erro) {

                /*
                 * Não encontramos no cache
                 * e também não existe Internet.
                 *
                 * Deixamos o navegador lidar
                 * normalmente com o erro.
                 */

                console.warn(
                    "[Solyx SW V3] Recurso indisponível:",
                    request.url
                );


                throw erro;

            }

        })()

    );

});


/* ============================================================
   6. MENSAGENS
   ============================================================ */

self.addEventListener(
    "message",
    event => {

        if (
            !event.data
        ) {

            return;

        }


        if (
            event.data.action ===
            "SKIP_WAITING"
        ) {

            console.log(
                "[Solyx SW V3] Atualização solicitada."
            );


            self.skipWaiting();

        }

    }
);


/* ============================================================
   7. DIAGNÓSTICO
   ============================================================ */

console.log(
    "[Solyx SW V3] Carregado:",
    CACHE_NAME
);
