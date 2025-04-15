// Este arquivo será usado como service worker para o PWA
export default function sw() {
  return `
    // Este é o service worker que permite o funcionamento offline completo
    const CACHE_NAME = 'gerenciador-saude-v7-offline-total';
    
    // Constante para verificar se deve mostrar logs detalhados
    const DEBUG = false;
    
    // Função de log que só exibe no modo debug
    function logDebug(...args) {
      if (DEBUG) {
        console.log(...args);
      }
    }
    
    // Lista completa de arquivos para cache inicial
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
      '/vercel.svg'
    ];
    
    // Padrões de arquivos essenciais a serem cacheados
    const ESSENTIAL_FILE_PATTERNS = [
      /\\.(?:js|css)$/,              // Arquivos JavaScript e CSS
      /\\.(?:png|jpg|jpeg|gif|svg)$/, // Imagens
      /\\.(?:woff|woff2|ttf|otf)$/,   // Fontes
      /\\.(?:json|manifest)$/         // Arquivos JSON e manifestos
    ];
    
    // Páginas críticas que devem ser sempre cacheadas
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
            
            // Cache todas as páginas principais com método GET direto
            const criticalCaching = CRITICAL_PAGES.map(url => 
              fetch(new Request(url, { 
                cache: 'reload',
                mode: 'no-cors' // Permite buscar mesmo que a resposta não seja totalmente acessível
              }))
                .then(response => {
                  return cache.put(url, response);
                })
                .catch(err => {
                  if (DEBUG) console.warn('[ServiceWorker] Não foi possível cachear ' + url, err);
                  // Em caso de erro, criar uma resposta simples para garantir pelo menos algo no cache
                  return cache.put(url, new Response('Página offline', {
                    headers: { 'Content-Type': 'text/html' }
                  }));
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
    
    // Ativação do service worker - preserva caches existentes
    self.addEventListener('activate', (event) => {
      logDebug('[ServiceWorker] Ativando...');
      
      // Agora não vamos excluir caches antigos para manter tudo offline
      // Apenas garantimos que o service worker controle todas as páginas
      event.waitUntil(
        self.clients.claim()
          .then(() => {
            logDebug('[ServiceWorker] Ativado e controlando páginas!');
            return self.clients.matchAll();
          })
          .then(clients => {
            // Informar todas as abas que o novo service worker está ativo
            clients.forEach(client => {
              client.postMessage({
                type: 'SW_ACTIVATED',
                version: CACHE_NAME
              });
            });
            
            // Pré-cachear recursos dinâmicos importantes em segundo plano
            cacheStaticAssets();
          })
      );
    });
    
    // Função para cachear ativos estáticos importantes
    function cacheStaticAssets() {
      caches.open(CACHE_NAME).then(cache => {
        // Caminhos de recursos importantes a serem cacheados
        const staticAssets = [
          '/_next/static/chunks/main.js',
          '/_next/static/chunks/webpack.js',
          '/_next/static/chunks/pages/_app.js',
          '/_next/static/chunks/polyfills.js',
          '/_next/static/css/app.css'
        ];
        
        // Cache cada recurso
        staticAssets.forEach(asset => {
          fetch(asset, { mode: 'no-cors' })
            .then(response => {
              if (response) {
                cache.put(asset, response);
              }
            })
            .catch(() => {
              // Ignorar erros silenciosamente
            });
        });
      });
    }
    
    // Verifica se o dispositivo está online
    function isOnline() {
      return typeof navigator !== 'undefined' && 
             typeof navigator.onLine === 'boolean' ? 
             navigator.onLine : true;
    }
    
    // Função para encontrar melhor resposta de fallback para um recurso
    async function findBestFallback(request) {
      const cache = await caches.open(CACHE_NAME);
      const url = new URL(request.url);
      
      // Para recursos estáticos, tentar encontrar baseado no nome do arquivo
      const fileName = url.pathname.split('/').pop();
      
      // Se é uma navegação para uma página
      if (request.mode === 'navigate') {
        // Tentar encontrar versão alternativa (com/sem trailing slash)
        const alternativeUrl = url.pathname.endsWith('/') 
          ? url.pathname.slice(0, -1) 
          : url.pathname + '/';
          
        // Verificar no cache
        const cachedAlt = await caches.match(alternativeUrl);
        if (cachedAlt) return cachedAlt;
        
        // Se for uma das páginas críticas, enviar versão offline genérica
        if (CRITICAL_PAGES.some(page => url.pathname.includes(page))) {
          const fallback = await caches.match('/offline.html');
          if (fallback) return fallback;
        }
        
        // Última opção: offline.html
        return caches.match('/offline.html');
      }
      
      // Para arquivos estáticos, tentar correspondência de padrão
      for (const pattern of ESSENTIAL_FILE_PATTERNS) {
        if (pattern.test(url.pathname)) {
          // Para JS e CSS, retornar um arquivo vazio do mesmo tipo
          if (/\\.js$/.test(url.pathname)) {
            return new Response('// Arquivo JS offline', {
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
          
          if (/\\.css$/.test(url.pathname)) {
            return new Response('/* Arquivo CSS offline */', {
              headers: { 'Content-Type': 'text/css' }
            });
          }
          
          // Para imagens, tente achar qualquer imagem no cache
          if (/\\.(png|jpg|jpeg|gif|svg)$/.test(url.pathname)) {
            const cachedImages = await cache.keys();
            for (const key of cachedImages) {
              if (/\\.(png|jpg|jpeg|gif|svg)$/.test(key.url)) {
                return cache.match(key);
              }
            }
          }
        }
      }
      
      // Se nada funcionar, retorna uma resposta vazia mas válida
      return new Response('', { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Cache tudo - estratégia de armazenamento persistente
    self.addEventListener('fetch', (event) => {
      // Ignora requisições não GET
      if (event.request.method !== 'GET') return;
      
      // Ignora recursos não importantes para o funcionamento offline
      if (event.request.url.includes('/api/') || 
          event.request.url.includes('chrome-extension') ||
          event.request.url.includes('devtools') ||
          event.request.url.includes('analytics') ||
          event.request.url.includes('tracking') ||
          event.request.url.match(/^https?:\\/\\/[^\\/]+\\/[^\\/]+\\/[^\\/]+\\/\\d+\\/\\w+/)) {
        return;
      }
      
      // Estratégia: Cache First com fallback inteligente
      event.respondWith(
        (async function() {
          try {
            // 1. Primeiro tenta buscar do cache
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // 2. Se não estiver no cache e estivermos online, busca da rede
            if (isOnline()) {
              try {
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.status === 200) {
                  // Clona a resposta
                  const responseToCache = networkResponse.clone();
                  
                  // Armazena em cache para uso futuro
                  const cache = await caches.open(CACHE_NAME);
                  await cache.put(event.request, responseToCache);
                  
                  // Se for HTML, também tenta cachear a versão alternativa
                  if (responseToCache.headers.get('content-type')?.includes('text/html')) {
                    const url = new URL(event.request.url);
                    if (url.pathname.endsWith('/')) {
                      const urlWithoutSlash = new URL(url.toString());
                      urlWithoutSlash.pathname = url.pathname.slice(0, -1);
                      try {
                        const altResponse = await fetch(urlWithoutSlash);
                        if (altResponse.ok) {
                          await cache.put(urlWithoutSlash, altResponse);
                        }
                      } catch (e) {
                        // Ignora erros ao cachear versões alternativas
                      }
                    }
                  }
                  
                  return networkResponse;
                }
                
                // Se a resposta não for 200, trata como offline
                throw new Error('Resposta de rede inválida');
              } catch (error) {
                // Se falhar ao buscar da rede, procurar melhor fallback
                return await findBestFallback(event.request);
              }
            } else {
              // 3. Se estiver offline, busca o melhor fallback
              return await findBestFallback(event.request);
            }
          } catch (error) {
            // Última chance - página offline genérica
            return await caches.match('/offline.html') || 
                   new Response('Aplicativo está offline', { 
                     status: 200,
                     headers: { 'Content-Type': 'text/plain' }
                   });
          }
        })()
      );
    });
    
    // Adiciona evento para lidar com mensagens do app principal
    self.addEventListener('message', (event) => {
      // Mensagem para cachear explicitamente uma rota
      if (event.data && event.data.type === 'CACHE_NEW_ROUTE') {
        const urlToCache = event.data.url;
        logDebug('[ServiceWorker] Cacheando nova rota via mensagem:', urlToCache);
        
        caches.open(CACHE_NAME)
          .then(cache => {
            fetch(urlToCache, { mode: 'no-cors' })
              .then(response => {
                cache.put(urlToCache, response);
                
                // Também cache versões com e sem trailing slash
                const url = new URL(urlToCache);
                const alternativeUrl = url.pathname.endsWith('/') 
                  ? url.pathname.slice(0, -1) 
                  : url.pathname + '/';
                
                fetch(alternativeUrl, { mode: 'no-cors' })
                  .then(altResponse => {
                    cache.put(alternativeUrl, altResponse);
                  })
                  .catch(() => {
                    // Criar resposta para o caminho alternativo mesmo em caso de erro
                    cache.put(alternativeUrl, new Response('Página offline', {
                      headers: { 'Content-Type': 'text/html' }
                    }));
                  });
              })
              .catch(() => {
                // Em caso de erro, criar uma resposta simples para garantir pelo menos algo no cache
                cache.put(urlToCache, new Response('Página offline', {
                  headers: { 'Content-Type': 'text/html' }
                }));
              });
          });
          
        // Sinaliza que recebeu a solicitação, mesmo sem internet
        if (event.source) {
          event.source.postMessage({
            type: 'ROUTE_CACHING_REQUESTED',
            url: urlToCache
          });
        }
      }
      
      // Comando para cachear todas as rotas principais
      if (event.data && event.data.type === 'CACHE_ALL_ROUTES') {
        logDebug('[ServiceWorker] Iniciando cache completo do aplicativo');
        
        const allRoutes = [
          '/',
          '/perfil',
          '/medicoes',
          '/medicamentos',
          '/educacao',
          '/education',
          '/profile',
          '/measurements',
          '/medications',
          '/educativo'
        ];
        
        // Primeiro responde que iniciou
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_STARTED',
            message: 'Iniciado processo de cache completo'
          });
        }
        
        // Cacheia cada rota em ordem
        caches.open(CACHE_NAME)
          .then(cache => {
            allRoutes.forEach((route, index) => {
              // Adiciona um pequeno atraso para não sobrecarregar
              setTimeout(() => {
                // Fetch com e sem trailing slash
                fetch(route, { mode: 'no-cors' })
                  .then(response => {
                    cache.put(route, response.clone());
                    
                    // Notifica progresso
                    if (event.source && index === allRoutes.length - 1) {
                      event.source.postMessage({
                        type: 'CACHE_PROGRESS',
                        progress: 100,
                        message: 'Cache completo'
                      });
                    }
                  })
                  .catch(() => {
                    // Em caso de erro, criar uma resposta simples
                    cache.put(route, new Response('Página offline', {
                      headers: { 'Content-Type': 'text/html' }
                    }));
                  });
                
                // Versão alternativa
                const altRoute = route.endsWith('/') ? route.slice(0, -1) : route + '/';
                fetch(altRoute, { mode: 'no-cors' })
                  .then(response => {
                    cache.put(altRoute, response.clone());
                  })
                  .catch(() => {
                    // Em caso de erro, criar uma resposta simples
                    cache.put(altRoute, new Response('Página offline', {
                      headers: { 'Content-Type': 'text/html' }
                    }));
                  });
                
                // Também cacheia recursos estáticos importantes
                if (index === 0) {
                  cacheStaticAssets();
                }
              }, index * 200); // Pequeno atraso entre requisições
            });
          });
      }
    });
    
    // Sincronização em segundo plano quando a conexão for restaurada
    self.addEventListener('sync', (event) => {
      if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
      }
    });
    
    // Função para sincronizar dados quando online
    function syncData() {
      logDebug('[ServiceWorker] Sincronizando dados locais...');
      // Não faz nada especial por enquanto, apenas resolve a promise
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
    logDebug('[ServiceWorker] Script carregado! Versão 7 - Completamente Offline');
  `
}

