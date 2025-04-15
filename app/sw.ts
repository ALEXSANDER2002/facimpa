// Este arquivo será usado como service worker para o PWA
export default function sw() {
  return `
    // Este é o service worker que permite o funcionamento offline completo
    const CACHE_NAME = 'gerenciador-saude-v5';
    
    // Constante para verificar se deve mostrar logs detalhados
    const DEBUG = false;
    
    // Função de log que só exibe no modo debug
    function logDebug(...args) {
      if (DEBUG) {
        console.log(...args);
      }
    }
    
    // Lista expandida de arquivos para cache
    const urlsToCache = [
      '/',
      '/educacao',
      '/perfil',
      '/medicoes',
      '/medicamentos',
      '/education',
      '/profile',
      '/measurements', 
      '/medications',
      '/educativo',
      '/manifest.json',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/icon-maskable-192x192.png',
      '/icons/icon-maskable-512x512.png',
      '/offline.html',
      '/next.svg',
      '/vercel.svg',
      '/_next/static/css/app.css',
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/webpack.js',
      '/_next/static/chunks/pages/_app.js',
      '/_next/static/chunks/pages/index.js',
      '/_next/static/chunks/polyfills.js',
      '/_next/static/media/fonts/inter.css'
    ];
    
    // Páginas críticas que devem ser cacheadas prioritariamente
    const CRITICAL_PAGES = [
      '/',
      '/perfil',
      '/medicoes',
      '/medicamentos',
      '/educacao'
    ];
    
    // Indica se o app já foi visitado antes - usado para reduzir indicadores visuais
    let isAppAlreadyVisited = false;
    
    // Verifica se o app já foi visitado antes ao iniciar o service worker
    self.addEventListener('activate', (event) => {
      caches.has(CACHE_NAME).then(hasCached => {
        isAppAlreadyVisited = hasCached;
      });
    });
    
    // Instalação do service worker - pré-cache de todos os recursos essenciais
    self.addEventListener('install', (event) => {
      logDebug('[ServiceWorker] Instalando...');
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
            logDebug('[ServiceWorker] Cache aberto, pré-cacheando recursos...');
            
            // Primeiro cache as páginas críticas
            const criticalCaching = CRITICAL_PAGES.map(url => 
              fetch(new Request(url, { cache: 'reload' }))
                .then(response => {
                  if (!response.ok) throw new Error('Falha ao buscar ' + url);
                  return cache.put(url, response);
                })
                .catch(err => {
                  if (DEBUG) console.warn('[ServiceWorker] Não foi possível cachear ' + url, err);
                })
            );
            
            // Depois cache os outros recursos
            return Promise.all([
              ...criticalCaching,
              cache.addAll(urlsToCache.filter(url => !CRITICAL_PAGES.includes(url)))
            ]);
          })
          .then(() => {
            logDebug('[ServiceWorker] Todos os recursos foram cacheados');
            // Force o service worker a se tornar ativo imediatamente
            return self.skipWaiting();
          })
      );
    });
    
    // Ativação do service worker - limpa caches antigos
    self.addEventListener('activate', (event) => {
      logDebug('[ServiceWorker] Ativando...');
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                logDebug('[ServiceWorker] Removendo cache antigo:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          logDebug('[ServiceWorker] Ativado e controlando páginas!');
          // Garante que o service worker controle todas as páginas imediatamente
          return self.clients.claim();
        })
      );
    });
    
    // Estratégia de cache aprimorada: Cache First, then Network com fallback para offline
    // E cache dinâmico para novos recursos acessados
    self.addEventListener('fetch', (event) => {
      // Ignora requisições não GET
      if (event.request.method !== 'GET') return;
      
      // Ignora requisições para APIs externas
      if (event.request.url.includes('/api/') || 
          event.request.url.includes('chrome-extension') ||
          event.request.url.match(/^https?:\\/\\/[^\\/]+\\/[^\\/]+\\/[^\\/]+\\/\\d+\\/\\w+/)) {
        return;
      }
      
      // Estratégia de cache completa
      event.respondWith(
        caches.match(event.request)
          .then((cachedResponse) => {
            // Cache hit - retorna a resposta do cache
            if (cachedResponse) {
              // Atualizando cache em background para próximas visitas
              // mas somente se tivermos conexão e não for um reload forçado
              if (navigator.onLine && !event.request.url.includes('reload=true')) {
                fetch(event.request)
                  .then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                      caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, networkResponse.clone()));
                    }
                  })
                  .catch(() => {});
              }
              return cachedResponse;
            }
            
            // Se não estiver no cache, tenta buscar da rede
            const fetchRequest = event.request.clone();
            
            return fetch(fetchRequest)
              .then((networkResponse) => {
                // Verifica se recebemos uma resposta válida da rede
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                  return networkResponse;
                }
                
                // Clone da resposta para poder usar duas vezes
                const responseToCache = networkResponse.clone();
                
                // Adiciona a resposta ao cache para uso futuro - cache dinâmico
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                    logDebug('[ServiceWorker] Novo recurso cacheado:', event.request.url);
                  });
                  
                return networkResponse;
              })
              .catch(() => {
                logDebug('[ServiceWorker] Fetch falhou, tentando fallback para:', event.request.url);
                
                // Se falhar ao buscar da rede, verifica se é uma página de navegação
                if (event.request.mode === 'navigate') {
                  // Para páginas críticas, tenta retornar a versão cacheada pelo pathname
                  const url = new URL(event.request.url);
                  
                  // Verificar se é uma página crítica pelo pathname
                  if (CRITICAL_PAGES.some(page => url.pathname === page)) {
                    return caches.match(url.pathname)
                      .then(cachedPage => {
                        if (cachedPage) return cachedPage;
                        return caches.match('/offline.html');
                      });
                  }
                  
                  // Também verifica se tem um cache exato para a URL completa
                  return caches.match(event.request.url)
                    .then(exactMatch => {
                      if (exactMatch) return exactMatch;
                      return caches.match('/offline.html');
                    });
                }
                
                // Para recursos estáticos (CSS, JS, imagens), tenta encontrar uma versão alternativa
                if (event.request.url.match(/\\.(?:js|css|png|jpg|jpeg|svg|gif)$/)) {
                  return caches.match(event.request.url);
                }
                
                // Para outros recursos, retorna um placeholder ou mensagem de erro
                return new Response('Recurso indisponível offline', {
                  status: 503,
                  statusText: 'Serviço Indisponível'
                });
              });
          })
      );
    });
    
    // Adiciona evento para lidar com mensagens do app principal
    self.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_NEW_ROUTE') {
        // Cacheia uma nova rota explicitamente
        const urlToCache = event.data.url;
        
        logDebug('[ServiceWorker] Cacheando nova rota via mensagem:', urlToCache);
        
        caches.open(CACHE_NAME)
          .then(cache => {
            fetch(urlToCache)
              .then(response => {
                if (!response.ok) throw new Error('Falha ao cachear rota: ' + urlToCache);
                cache.put(urlToCache, response);
              })
              .catch(err => {
                if (DEBUG) console.error('[ServiceWorker] Erro ao cachear rota:', err);
              });
          });
      }
    });
    
    // Sincronização em segundo plano quando a conexão for restaurada
    self.addEventListener('sync', (event) => {
      if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
      }
      
      if (event.tag === 'sync-perfil') {
        event.waitUntil(syncPerfil());
      }
      
      if (event.tag === 'sync-medicoes') {
        event.waitUntil(syncMedicoes());
      }
      
      if (event.tag === 'sync-medicamentos') {
        event.waitUntil(syncMedicamentos());
      }
    });
    
    // Função para sincronizar dados quando online
    function syncData() {
      logDebug('[ServiceWorker] Sincronizando todos os dados...');
      return Promise.all([
        syncPerfil(),
        syncMedicoes(),
        syncMedicamentos()
      ]);
    }
    
    // Função específica para sincronizar dados do perfil
    function syncPerfil() {
      logDebug('[ServiceWorker] Sincronizando dados do perfil...');
      return Promise.resolve();
    }
    
    // Função para sincronizar medições 
    function syncMedicoes() {
      logDebug('[ServiceWorker] Sincronizando medições...');
      return Promise.resolve();
    }
    
    // Função para sincronizar medicamentos
    function syncMedicamentos() {
      logDebug('[ServiceWorker] Sincronizando medicamentos...');
      return Promise.resolve();
    }
    
    // Gerenciamento de notificações push
    self.addEventListener('push', (event) => {
      const title = 'Gerenciador de Saúde';
      const options = {
        body: event.data ? event.data.text() : 'Notificação do Gerenciador de Saúde',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png'
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    });
    
    // Ação ao clicar na notificação
    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      
      // Redireciona para a página apropriada com base no tipo de notificação
      let url = '/';
      
      if (event.notification.tag) {
        if (event.notification.tag.startsWith('med-')) {
          url = '/medicamentos';
        } else if (event.notification.tag === 'perfil') {
          url = '/perfil';
        } else if (event.notification.tag === 'medicao') {
          url = '/medicoes';
        }
      }
      
      event.waitUntil(
        clients.openWindow(url)
      );
    });
    
    // Registra que é a versão mais recente do service worker
    logDebug('[ServiceWorker] Script carregado! Versão 5');
  `
}
