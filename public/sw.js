// Versão do cache
const CACHE_VERSION = '1.0.0';

// Nomes dos caches
const STATIC_CACHE = `static-cache-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-v${CACHE_VERSION}`;
const PAGES_CACHE = `pages-cache-v${CACHE_VERSION}`;

// Lista de URLs para cachear inicialmente
const URLS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/apple-icon.png',
  '/icon.png',
  '/favicon.ico',
];

// Instalação - pre-cache de recursos essenciais
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Cacheando recursos iniciais');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Ativação - limpeza de recursos antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(
          keyList.filter((key) => {
            return key !== STATIC_CACHE && 
                   key !== DYNAMIC_CACHE && 
                   key !== PAGES_CACHE;
          }).map((key) => {
            console.log('[Service Worker] Removendo cache antigo:', key);
            return caches.delete(key);
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições para o painel do Chrome
  if (url.host === 'chrome-devtools-frontend.appspot.com') {
    return;
  }
  
  // Ignorar requisições para o devTools
  if (url.pathname.startsWith('/devtools/')) {
    return;
  }
  
  // Ignorar navegação de API
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Navegação para páginas HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }
  
  // Para recursos estáticos (imagens, CSS, JS)
  if (
    request.method === 'GET' && 
    (
      request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2|woff)$/) || 
      url.host === 'fonts.googleapis.com' || 
      url.host === 'fonts.gstatic.com'
    )
  ) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              return caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, networkResponse.clone());
                  return networkResponse;
                });
            });
        })
        .catch(() => {
          // Fallback para imagens
          if (request.destination === 'image') {
            return caches.match('/icon.png');
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }
  
  // Para outras requisições
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Manipulador de mensagens
self.addEventListener('message', (event) => {
  // Pular waiting se solicitado (para atualização imediata)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Pulando waiting e atualizando...');
    self.skipWaiting();
  }

  // Cachear uma rota específica sob demanda
  if (event.data && event.data.type === 'CACHE_NEW_ROUTE') {
    const url = event.data.url;
    console.log('[Service Worker] Cacheando rota:', url);
    
    fetch(url)
      .then((response) => {
        if (response.ok) {
          return caches.open(PAGES_CACHE)
            .then((cache) => {
              cache.put(url, response);
              console.log(`[Service Worker] Rota ${url} cacheada com sucesso`);
            });
        } else {
          console.log(`[Service Worker] Rota ${url} não pôde ser cacheada`);
        }
      })
      .catch((error) => {
        console.error(`[Service Worker] Erro ao cachear ${url}:`, error);
      });
  }
  
  // Cache completo para uso offline
  if (event.data && event.data.type === 'CACHE_ALL_ROUTES') {
    const routes = event.data.routes || [];
    
    if (routes.length > 0) {
      console.log('[Service Worker] Iniciando cache completo de', routes.length, 'rotas');
      
      // Notificar início
      self.clients.matchAll()
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHE_STARTED',
              message: 'Iniciando download completo'
            });
          });
        });
      
      let progress = 10;
      const increment = 90 / routes.length;
      
      // Cache sequencial para evitar sobrecarga
      const cacheNext = (index) => {
        if (index >= routes.length) {
          // Notificar conclusão
          self.clients.matchAll()
            .then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'CACHE_PROGRESS',
                  progress: 100
                });
              });
            });
          return;
        }
        
        const url = routes[index];
        fetch(url)
          .then((response) => {
            if (response.ok) {
              return caches.open(PAGES_CACHE)
                .then((cache) => {
                  return cache.put(url, response);
                });
            }
          })
          .catch((error) => {
            console.error(`[Service Worker] Erro ao cachear ${url}:`, error);
          })
          .finally(() => {
            progress += increment;
            
            // Notificar progresso
            self.clients.matchAll()
              .then((clients) => {
                clients.forEach((client) => {
                  client.postMessage({
                    type: 'CACHE_PROGRESS',
                    progress: Math.min(Math.round(progress), 95)
                  });
                });
              });
            
            // Processar próxima URL com um pequeno atraso
            setTimeout(() => cacheNext(index + 1), 300);
          });
      };
      
      // Iniciar o processo de cache
      cacheNext(0);
    } else {
      console.log('[Service Worker] Nenhuma rota especificada para cache offline');
      // Notificar erro
      self.clients.matchAll()
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHE_ERROR',
              message: 'Nenhuma rota especificada'
            });
          });
        });
    }
  }
}); 