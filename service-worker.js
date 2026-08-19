const CACHE_NAME = 'AdminFidelidade-v5'; // Mudamos a versão para forçar o celular a atualizar!
const ARQUIVOS_PARA_CACHEAR = [
  './offline.html',
  './EduQuiz_Offline.html',
  './Brick_Game_5_em_1.html',
  './Brick-Game_intro.wav' //  Música intro do Brick-Game
  // Quando quiser adicionar novos jogos no futuro, basta colocar o nome do arquivo aqui!
];

// 1. INSTALAÇÃO: Baixa e salva os arquivos no celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Salvando a galeria e os joguinhos no cache...');
      return cache.addAll(ARQUIVOS_PARA_CACHEAR);
    })
  );
  self.skipWaiting();
});

// 2. ATIVAÇÃO: Limpa o cache antigo que estava travando o app
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Apagando o cache antigo...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: A Mágica de abrir os jogos offline sem travar
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Sem internet! Vamos procurar o que o usuário clicou lá no nosso "baú" (cache)
      return caches.match(event.request, { ignoreSearch: true }).then(response => {
        // Se o arquivo clicado (ex: o jogo) estiver no baú, abra o jogo!
        if (response) {
          return response;
        } 
        // Se não achou (ex: tentou abrir o painel de transações do app), abre a galeria offline
        else if (event.request.mode === 'navigate') {
          return caches.match('./offline.html');
        }
      });
    })
  );
});
