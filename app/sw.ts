/// <reference lib="webworker" />

// Importações dos módulos
import { 
  CACHE_VERSION, 
  STATIC_CACHE, 
  DYNAMIC_CACHE, 
  PAGES_CACHE, 
  URLS_TO_CACHE, 
  MAIN_ROUTES 
} from './sw/constants';

import { 
  sendCacheProgressUpdate, 
  cacheUrl, 
  cacheUrls 
} from './sw/cache-utils';

import { 
  cacheFirst, 
  networkFirst 
} from './sw/strategies';

import { 
  handlePushNotification, 
  handleNotificationClick 
} from './sw/notifications';

import {
  openDatabase,
  storeOfflineData,
  getPendingOfflineData,
  markOfflineDataSynced,
  saveConfig,
  getConfig
} from './sw/indexeddb-utils';

// Registrar o escopo global do service worker
declare const self: ServiceWorkerGlobalScope;

// Event Listeners

// Instalação - pre-cache de recursos essenciais
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    cacheUrls(STATIC_CACHE, URLS_TO_CACHE)
      .then(() => {
        console.log('[Service Worker] Recursos iniciais em cache');
        sendCacheProgressUpdate(30);
        
        // Inicializar IndexedDB
        return openDatabase().then(() => {
          return saveConfig('lastInstall', Date.now());
        });
      })
      .then(() => {
        console.log('[Service Worker] IndexedDB inicializado');
        // Uso de skipWaiting para assumir o controle imediatamente
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Erro na instalação:', error);
      })
  );
});

// Ativação - limpeza de recursos antigos
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    Promise.all([
      // Limpeza de caches antigos
      caches.keys()
        .then(keys => {
          return Promise.all(
            keys.filter(key => {
              return key.startsWith('health-pwa-') && 
                     !key.includes(CACHE_VERSION);
            }).map(key => {
              console.log('[Service Worker] Removendo cache antigo:', key);
              return caches.delete(key);
            })
          );
        }),
        
      // Salvando configuração de versão no IndexedDB
      saveConfig('version', CACHE_VERSION)
    ])
    .then(() => {
      console.log('[Service Worker] Agora usado como o worker ativo!');
      sendCacheProgressUpdate(50);
      
      // Assumir o controle de todos os clientes não controlados
      return self.clients.claim();
    })
    .then(() => {
      // Notificar todos os clientes sobre a ativação
      return self.clients.matchAll()
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              version: CACHE_VERSION
            });
          });
        });
    })
    .catch(error => {
      console.error('[Service Worker] Erro na ativação:', error);
    })
  );
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições para o painel do Chrome e ferramentas de desenvolvimento
  if (url.host === 'chrome-devtools-frontend.appspot.com' ||
      url.pathname.startsWith('/devtools/') ||
      url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Ignorar requisições de API que não podem ser cacheadas facilmente
  if (url.pathname.startsWith('/api/')) {
    // Para requisições POST em modo offline, armazenar para sincronização posterior
    if (request.method === 'POST' && !navigator.onLine) {
      event.respondWith(
        request.clone().text()
          .then(body => {
            // Armazenar a requisição para sincronização posterior
            storeOfflineData(url.pathname, {
              method: request.method,
              url: request.url,
              headers: Array.from(request.headers.entries()),
              body: body
            });
            
            // Retornar uma resposta "queued for sync"
            return new Response(JSON.stringify({
              success: true,
              offline: true,
              message: 'Dados armazenados para sincronização'
            }), {
              status: 202,
              headers: { 'Content-Type': 'application/json' }
            });
          })
      );
      return;
    }
    
    // Para outras requisições de API, deixar passar para a rede
    return;
  }
  
  // Navegação para páginas HTML
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Para recursos estáticos (imagens, CSS, JS, fontes)
  if (request.method === 'GET' && (
      request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2|woff|ttf)$/) ||
      url.host === 'fonts.googleapis.com' ||
      url.host === 'fonts.gstatic.com'
    )) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Para outras requisições GET, tenta network first
  if (request.method === 'GET') {
    event.respondWith(networkFirst(request));
    return;
  }
});

// Manipulador de mensagens do cliente
self.addEventListener('message', (event) => {
  // Skipwait - atualização imediata
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Cachear uma rota específica sob demanda
  if (event.data && event.data.type === 'CACHE_NEW_ROUTE') {
    const url = event.data.url;
    console.log('[Service Worker] Cacheando rota:', url);
    
    cacheUrl(PAGES_CACHE, url)
      .then(success => {
        if (event.source) {
          event.source.postMessage({
            type: 'ROUTE_CACHING_REQUESTED',
            url: url,
            success: success
          });
        }
      });
    return;
  }
  
  // Cache completo para uso offline
  if (event.data && event.data.type === 'CACHE_ALL_ROUTES') {
    // Notificar que iniciou o processo
    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_STARTED',
        message: 'Iniciando cache completo do aplicativo'
      });
    }
    
    // Lista completa de rotas para cachear
    const routesToCache = event.data.routes || MAIN_ROUTES;
    
    // Cachear cada rota com um pequeno atraso para não sobrecarregar
    let progress = 0;
    const totalRoutes = routesToCache.length;
    
    Promise.all(
      routesToCache.map((route, index) => {
        return new Promise<void>(resolve => {
          // Adicionar um atraso progressivo para não sobrecarregar
          setTimeout(() => {
            cacheUrl(PAGES_CACHE, route)
              .then(() => {
                progress += (90 / totalRoutes);
                sendCacheProgressUpdate(Math.min(Math.round(progress), 95));
                resolve();
              })
              .catch(() => {
                progress += (90 / totalRoutes);
                sendCacheProgressUpdate(Math.min(Math.round(progress), 95));
                resolve();
              });
          }, index * 300);
        });
      })
    ).then(() => {
      // Salvar a configuração no IndexedDB
      return saveConfig('offlineModeEnabled', true);
    }).then(() => {
      // Notificar conclusão
      sendCacheProgressUpdate(100);
      
      if (event.source) {
        event.source.postMessage({
          type: 'CACHE_COMPLETE',
          message: 'Cache completo finalizado'
        });
      }
    });
    
    return;
  }
});

// Manipular eventos de sincronização em segundo plano
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Função para sincronizar requisições pendentes quando estiver online
async function syncPendingRequests() {
  const pendingItems = await getPendingOfflineData();
  
  console.log('[Service Worker] Sincronizando', pendingItems.length, 'itens pendentes');
  
  const syncPromises = pendingItems.map(async (item) => {
    try {
      // Recriar a requisição a partir dos dados armazenados
      const request = new Request(item.data.url, {
        method: item.data.method,
        headers: new Headers(item.data.headers),
        body: item.data.method !== 'GET' ? item.data.body : undefined
      });
      
      // Tentar enviar a requisição
      const response = await fetch(request);
      
      if (response.ok) {
        // Marcar como sincronizado se for bem-sucedido
        await markOfflineDataSynced(item.id);
        console.log('[Service Worker] Item sincronizado com sucesso:', item.id);
        return true;
      } else {
        console.error('[Service Worker] Falha ao sincronizar item:', item.id, response.status);
        return false;
      }
    } catch (error) {
      console.error('[Service Worker] Erro ao sincronizar item:', item.id, error);
      return false;
    }
  });
  
  return Promise.all(syncPromises);
}

// Manipulador de notificações push
self.addEventListener('push', (event: PushEvent) => {
  console.log('[Service Worker] Push recebido');
  handlePushNotification(event);
});

// Manipulador de cliques em notificações
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[Service Worker] Clique em notificação');
  event.waitUntil(handleNotificationClick(event));
});

// Expor escopo do service worker
export {};

