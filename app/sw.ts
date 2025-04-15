// Este arquivo será usado como service worker para o PWA
export default function sw() {
  return `
    // Este é o service worker que permite o funcionamento offline completo
    const CACHE_NAME = 'gerenciador-saude-v3';
    
    // Lista expandida de arquivos para cache
    const urlsToCache = [
      '/',
      '/educacao',
      '/perfil',
      '/medicoes',
      '/medicamentos',
      '/manifest.json',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/icon-maskable-192x192.png',
      '/icons/icon-maskable-512x512.png',
      '/offline.html'
    ];
    
    // Páginas críticas que devem ser cacheadas prioritariamente
    const CRITICAL_PAGES = [
      '/perfil',
      '/medicoes',
      '/medicamentos'
    ];
    
    // Instalação do service worker - pré-cache de todos os recursos essenciais
    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then((cache) => {
            console.log('Cache aberto');
            // Primeiro cache as páginas críticas
            return Promise.all([
              ...CRITICAL_PAGES.map(url => 
                fetch(url)
                  .then(response => {
                    if (!response.ok) throw new Error('Falha ao buscar ' + url);
                    return cache.put(url, response);
                  })
                  .catch(err => console.warn('Não foi possível cachear ' + url, err))
              ),
              // Depois cache os outros recursos
              cache.addAll(urlsToCache.filter(url => !CRITICAL_PAGES.includes(url)))
            ]);
          })
          .then(() => {
            // Force o service worker a se tornar ativo imediatamente
            return self.skipWaiting();
          })
      );
    });
    
    // Ativação do service worker - limpa caches antigos
    self.addEventListener('activate', (event) => {
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                console.log('Removendo cache antigo:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          // Garante que o service worker controle todas as páginas imediatamente
          return self.clients.claim();
        })
      );
    });
    
    // Estratégia de cache: Cache First, then Network com fallback para offline
    self.addEventListener('fetch', (event) => {
      // Ignora requisições não GET
      if (event.request.method !== 'GET') return;
      
      // Ignora requisições para APIs externas
      if (event.request.url.includes('/api/') || 
          event.request.url.includes('chrome-extension') ||
          event.request.url.match(/^https?:\\/\\/[^\\/]+\\/[^\\/]+\\/[^\\/]+\\/\\d+\\/\\w+/)) {
        return;
      }
      
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            // Cache hit - retorna a resposta
            if (response) {
              return response;
            }
            
            // Clone da requisição original
            const fetchRequest = event.request.clone();
            
            // Tenta buscar da rede
            return fetch(fetchRequest)
              .then((response) => {
                // Verifica se recebemos uma resposta válida
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                // Clone da resposta
                const responseToCache = response.clone();
                
                // Adiciona a resposta ao cache para uso futuro
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
                  
                return response;
              })
              .catch(() => {
                // Se falhar ao buscar da rede, verifica se é uma página de navegação
                if (event.request.mode === 'navigate') {
                  // Para páginas críticas, tenta retornar a versão cacheada mesmo que seja antiga
                  const url = new URL(event.request.url);
                  if (CRITICAL_PAGES.some(page => url.pathname.endsWith(page))) {
                    return caches.match(url.pathname)
                      .then(cachedPage => {
                        if (cachedPage) return cachedPage;
                        return caches.match('/offline.html');
                      });
                  }
                  
                  // Para outras páginas, retorna a página offline
                  return caches.match('/offline.html');
                }
                
                // Para outros recursos, retorna um placeholder ou erro
                return new Response('Recurso indisponível offline', {
                  status: 503,
                  statusText: 'Serviço Indisponível'
                });
              });
          })
      );
    });
    
    // Sincronização em segundo plano quando a conexão for restaurada
    self.addEventListener('sync', (event) => {
      if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
      }
      
      if (event.tag === 'sync-perfil') {
        event.waitUntil(syncPerfil());
      }
    });
    
    // Função para sincronizar dados quando online
    function syncData() {
      console.log('Sincronizando dados...');
      return Promise.resolve();
    }
    
    // Função específica para sincronizar dados do perfil
    function syncPerfil() {
      console.log('Sincronizando dados do perfil...');
      
      // Aqui você implementaria a lógica para sincronizar com um servidor
      // Por enquanto, apenas notifica o usuário
      self.registration.showNotification('Perfil Atualizado', {
        body: 'Seus dados de perfil foram salvos com sucesso.',
        icon: '/icons/icon-192x192.png'
      });
      
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
        }
      }
      
      event.waitUntil(
        clients.openWindow(url)
      );
    });
  `
}
