// Este arquivo será usado como service worker para o PWA
export default function sw() {
  return `
    // Este é o service worker que permite o funcionamento offline completo
    const CACHE_NAME = 'gerenciador-saude-v6-persistente';
    
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
      '/vercel.svg'
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
          })
      );
    });
    
    // Cache tudo - estratégia de armazenamento persistente
    self.addEventListener('fetch', (event) => {
      // Ignora requisições não GET
      if (event.request.method !== 'GET') return;
      
      // Ignora requisições para APIs externas
      if (event.request.url.includes('/api/') || 
          event.request.url.includes('chrome-extension') ||
          event.request.url.includes('devtools') ||
          event.request.url.match(/^https?:\\/\\/[^\\/]+\\/[^\\/]+\\/[^\\/]+\\/\\d+\\/\\w+/)) {
        return;
      }
      
      // Estratégia: Cache First, depois Network, mas sempre cacheia
      event.respondWith(
        caches.match(event.request)
          .then(cachedResponse => {
            // Se temos uma resposta em cache e não é um reload forçado, usamos ela
            if (cachedResponse && !event.request.url.includes('reload=true')) {
              return cachedResponse;
            }
            
            // Caso contrário, buscamos da rede
            return fetch(event.request)
              .then(networkResponse => {
                // Se a resposta da rede for válida
                if (!networkResponse || networkResponse.status !== 200) {
                  return networkResponse;
                }
                
                // Clonamos a resposta para poder usar em vários lugares
                const clonedResponse = networkResponse.clone();
                
                // Armazena a resposta no cache de forma assíncrona
                caches.open(CACHE_NAME)
                  .then(cache => {
                    // Verificamos se é um recurso HTML
                    if (clonedResponse.headers.get('content-type')?.includes('text/html')) {
                      // Para HTML, também cache recursos relacionados
                      logDebug('[ServiceWorker] Cacheando página HTML:', event.request.url);
                      
                      // Também cache a versão sem trailing slash
                      const url = new URL(event.request.url);
                      if (url.pathname.endsWith('/')) {
                        const pathWithoutSlash = url.pathname.slice(0, -1);
                        const urlWithoutSlash = new URL(url.toString());
                        urlWithoutSlash.pathname = pathWithoutSlash;
                        
                        // Tenta carregar e cachear essa URL também
                        fetch(urlWithoutSlash.toString())
                          .then(altResponse => {
                            if (altResponse.ok) {
                              cache.put(urlWithoutSlash, altResponse);
                            }
                          })
                          .catch(() => {});
                      }
                    }
                    
                    // Sempre armazena a resposta original no cache
                    cache.put(event.request, clonedResponse);
                  });
                
                return networkResponse;
              })
              .catch(error => {
                logDebug('[ServiceWorker] Erro de fetch, usando fallback:', error);
                
                // Se a solicitação era para uma página de navegação
                if (event.request.mode === 'navigate') {
                  // Para lidar com mudanças de URL com e sem trailing slash
                  const url = new URL(event.request.url);
                  
                  // Tenta encontrar uma versão com/sem trailing slash
                  const alternativeUrl = url.pathname.endsWith('/') 
                    ? url.pathname.slice(0, -1) 
                    : url.pathname + '/';
                  
                  // Tenta encontrar no cache com caminho alternativo
                  return caches.match(alternativeUrl)
                    .then(altMatch => {
                      if (altMatch) return altMatch;
                      
                      // Se falhar, retorna a página offline
                      return caches.match('/offline.html');
                    });
                }
                
                // Para recursos estáticos, tenta encontrar alternativas
                return caches.match('/offline.html');
              });
          })
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
            fetch(urlToCache)
              .then(response => {
                if (!response.ok) throw new Error('Falha ao cachear rota: ' + urlToCache);
                cache.put(urlToCache, response);
                
                // Também cache versões com e sem trailing slash
                const url = new URL(urlToCache);
                const alternativeUrl = url.pathname.endsWith('/') 
                  ? url.pathname.slice(0, -1) 
                  : url.pathname + '/';
                
                fetch(alternativeUrl)
                  .then(altResponse => {
                    if (altResponse.ok) cache.put(alternativeUrl, altResponse);
                  })
                  .catch(() => {});
              })
              .catch(err => {
                if (DEBUG) console.error('[ServiceWorker] Erro ao cachear rota:', err);
              });
          });
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
        
        caches.open(CACHE_NAME)
          .then(cache => {
            allRoutes.forEach(route => {
              // Fetch com e sem trailing slash
              fetch(route)
                .then(response => {
                  if (response.ok) cache.put(route, response.clone());
                })
                .catch(() => {});
              
              // Versão alternativa
              const altRoute = route.endsWith('/') ? route.slice(0, -1) : route + '/';
              fetch(altRoute)
                .then(response => {
                  if (response.ok) cache.put(altRoute, response.clone());
                })
                .catch(() => {});
            });
          });
        
        // Responder que começou o processo
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_STARTED',
            message: 'Iniciado processo de cache completo'
          });
        }
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
    logDebug('[ServiceWorker] Script carregado! Versão 6 - Persistente');
  `
}
