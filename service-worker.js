/* ============================================================
   SOLYX LOJISTA - SERVICE WORKER V2
   PWA OFFLINE
   ============================================================

   OBJETIVO PRINCIPAL:

   ONLINE:
       index.html funciona normalmente.

   OFFLINE:
       qualquer navegação de documento que falhar
       será direcionada para offline.html.

   offline.html e os jogos continuam disponíveis
   através do cache.

   ============================================================ */


/* ============================================================
   1. CONFIGURAÇÃO
   ============================================================ */

/*
 * IMPORTANTE:
 *
 * Aumentamos a versão do cache.
 *
 * Isso faz o navegador reconhecer esta como uma nova
 * versão do Service Worker.
 */

const CACHE_NAME = "SolyxLojista-v20";


/*
 * Página oficial de fallback offline.
 */

const OFFLINE_PAGE = "./offline.html";


/*
 * Arquivos que precisam estar disponíveis sem internet.
 *
 * ATENÇÃO:
 *
 * Os nomes abaixo precisam corresponder exatamente aos
 * arquivos existentes no seu repositório.
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
        "[Solyx SW V2] Instalando:",
        CACHE_NAME
    );


    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => {

                console.log(
                    "[Solyx SW V2] Criando cache offline..."
                );


                /*
                 * Armazena os arquivos essenciais.
                 */

                return cache.addAll(PRECACHE_FILES);

            })

            .then(() => {

                console.log(
                    "[Solyx SW V2] Cache offline criado com sucesso."
                );


                /*
                 * Não esperamos o navegador encerrar o
                 * Service Worker antigo.
                 *
                 * A nova versão assume imediatamente.
                 */

                return self.skipWaiting();

            })

            .catch(error => {

                console.error(
                    "[Solyx SW V2] ERRO durante instalação:",
                    error
                );


                /*
                 * Se algum arquivo essencial não puder
                 * ser armazenado, a instalação falha.
                 */

                throw error;

            })

    );

});


/* ============================================================
   3. ATIVAÇÃO
   ============================================================ */

self.addEventListener("activate", event => {

    console.log(
        "[Solyx SW V2] Ativando:",
        CACHE_NAME
    );


    event.waitUntil(

        caches.keys()

            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(cacheName => {


                        /*
                         * Só apagamos caches pertencentes
                         * ao nosso aplicativo.
                         */

                        if (

                            cacheName.startsWith(
                                "SolyxLojista-"
                            )

                            &&

                            cacheName !== CACHE_NAME

                        ) {

                            console.log(
                                "[Solyx SW V2] Removendo cache antigo:",
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
                    "[Solyx SW V2] Service Worker ativo."
                );


                /*
                 * Assume imediatamente o controle das
                 * páginas abertas dentro do escopo.
                 */

                return self.clients.claim();

            })

    );

});


/* ============================================================
   4. FUNÇÃO — PÁGINA OFFLINE
   ============================================================ */

async function obterPaginaOffline() {

    /*
     * Primeiro procura a página offline dentro
     * do cache atual.
     */

    const cache = await caches.open(
        CACHE_NAME
    );


    const resposta = await cache.match(
        OFFLINE_PAGE
    );


    if (resposta) {

        return resposta;

    }


    /*
     * Segurança adicional:
     *
     * caso a chave relativa não seja encontrada,
     * procuramos pelo caminho absoluto.
     */

    const urlOffline = new URL(
        OFFLINE_PAGE,
        self.location
    ).href;


    const respostaAbsoluta =
        await cache.match(urlOffline);


    if (respostaAbsoluta) {

        return respostaAbsoluta;

    }


    /*
     * Se por algum motivo extremo o offline.html
     * não existir no cache, devolvemos uma resposta
     * mínima para evitar uma tela totalmente vazia.
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
                    color: white;

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
   5. FETCH
   ============================================================ */

self.addEventListener("fetch", event => {


    /*
     * Trabalhamos somente com GET.
     *
     * POST, PUT, DELETE etc. seguem normalmente.
     */

    if (event.request.method !== "GET") {

        return;

    }


    const request = event.request;


    /* ========================================================
       5.1 NAVEGAÇÃO DE DOCUMENTOS
       ========================================================

       ESTA É A PARTE MAIS IMPORTANTE DA V2.

       Quando o usuário abre o aplicativo:

           ONLINE
               ↓
           tenta a internet
               ↓
           sucesso → página normal


           OFFLINE
               ↓
           internet falhou
               ↓
           NÃO procura index.html
               ↓
           OFFLINE.HTML


       Portanto, não teremos mais o comportamento:

           offline → index → F5 → offline.html

       O objetivo agora é:

           offline → offline.html
    */


    if (request.mode === "navigate") {


        event.respondWith(

            (async () => {


                /*
                 * Primeiro tentamos a rede.
                 *
                 * Isso mantém o comportamento normal
                 * quando o usuário possui internet.
                 */

                try {

                    const networkResponse =
                        await fetch(request);


                    /*
                     * A rede respondeu.
                     *
                     * Devolvemos a página normalmente.
                     */

                    return networkResponse;

                }


                catch (error) {


                    /*
                     * A requisição de navegação falhou.
                     *
                     * Isso normalmente significa:
                     *
                     * - sem Wi-Fi
                     * - sem dados móveis
                     * - modo avião
                     * - servidor indisponível
                     * - falha de conexão
                     */


                    console.log(
                        "[Solyx SW V2] Navegação offline:",
                        request.url
                    );


                    /*
                     * NÃO fazemos:
                     *
                     * caches.match(request)
                     *
                     * porque NÃO queremos abrir a index
                     * ou uma página anteriormente navegada.
                     */


                    return obterPaginaOffline();

                }

            })()

        );


        /*
         * IMPORTANTE:
         *
         * Não deixar o restante do código tratar
         * novamente esta requisição.
         */

        return;

    }


    /* ========================================================
       5.2 RECURSOS DO APLICATIVO
       ========================================================

       Aqui entram:

       - HTML dos jogos
       - JS
       - CSS
       - imagens
       * etc.

       Estratégia:

           CACHE FIRST

           cache
             ↓
           encontrou → usa

           não encontrou
             ↓
           internet
             ↓
           baixa
             ↓
           salva no cache
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
                 * Só armazenamos respostas válidas.
                 *
                 * "basic" evita armazenar respostas
                 * cross-origin opacas de forma indiscriminada.
                 */

                if (

                    networkResponse &&
                    networkResponse.status === 200 &&
                    networkResponse.type === "basic"

                ) {


                    const cache =
                        await caches.open(
                            CACHE_NAME
                        );


                    /*
                     * Precisamos clonar porque uma resposta
                     * só pode ser consumida uma vez.
                     */

                    await cache.put(
                        request,
                        networkResponse.clone()
                    );

                }


                return networkResponse;

            }


            catch (error) {


                console.warn(
                    "[Solyx SW V2] Recurso indisponível offline:",
                    request.url
                );


                /*
                 * Para recursos como:
                 *
                 * imagens externas
                 * APIs
                 * scripts externos
                 * fontes
                 *
                 * não vamos transformar tudo em
                 * offline.html.
                 *
                 * Isso é importante porque um <img>,
                 * por exemplo, espera uma imagem e não
                 * uma página HTML.
                 */


                throw error;

            }

        })()

    );

});


/* ============================================================
   6. MENSAGENS
   ============================================================ */

self.addEventListener("message", event => {


    if (!event.data) {

        return;

    }


    /*
     * Permite que a página solicite atualização
     * imediata do Service Worker.
     */

    if (

        event.data.action ===
        "SKIP_WAITING"

    ) {

        console.log(
            "[Solyx SW V2] SKIP_WAITING solicitado."
        );


        self.skipWaiting();

    }

});


/* ============================================================
   7. FINAL
   ============================================================ */

console.log(
    "[Solyx SW V2] Carregado:",
    CACHE_NAME
);
