/// <reference lib="webworker" />

import { STATIC_CACHE, DYNAMIC_CACHE, PAGES_CACHE } from './constants';
import { storeCacheMetadata, getCacheMetadata } from './indexeddb-utils';

declare const self: ServiceWorkerGlobalScope;

/**
 * Estratégia Cache First com fallback para rede
 * Utilizada principalmente para recursos estáticos
 */
export async function cacheFirst(request: Request): Promise<Response> {
  try {
    // Verificar primeiro no cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Verificar metadados no IndexedDB
      const metadata = await getCacheMetadata(request.url);
      
      // Atualizar o cache em segundo plano se estiver desatualizado (mais de 7 dias)
      const isStale = metadata && (Date.now() - metadata.timestamp > 7 * 24 * 60 * 60 * 1000);
      if (isStale && navigator.onLine) {
        refreshCache(request, STATIC_CACHE);
      }
      
      return cachedResponse;
    }

    // Se não estiver em cache, buscar na rede
    const networkResponse = await fetch(request);
    // Clonar a resposta para poder usá-la e armazená-la
    const responseToCache = networkResponse.clone();
    
    // Armazenar no cache e registrar metadados
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, responseToCache);
      await storeCacheMetadata(request.url, DYNAMIC_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Erro na estratégia cacheFirst:', error);
    
    // Tratamento para imagens
    if (request.destination === 'image') {
      return caches.match('/icon.png')
        .then(response => response || new Response('', { 
          status: 404, 
          statusText: 'Imagem não encontrada' 
        }));
    }
    
    // Retorna uma resposta de erro formatada conforme o tipo de conteúdo
    return createErrorResponse(request);
  }
}

/**
 * Estratégia Network First com fallback para cache
 * Utilizada principalmente para conteúdo dinâmico
 */
export async function networkFirst(request: Request): Promise<Response> {
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    // Se tiver sucesso, armazenar no cache
    if (networkResponse.ok) {
      // Clonar a resposta
      const responseToCache = networkResponse.clone();
      
      // Armazenar no cache correto
      const cacheName = request.mode === 'navigate' ? PAGES_CACHE : DYNAMIC_CACHE;
      const cache = await caches.open(cacheName);
      await cache.put(request, responseToCache);
      
      // Registrar metadados na IndexedDB
      await storeCacheMetadata(request.url, cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Falha na rede, tentando cache:', error);
    
    // Tentar retornar do cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Para navegação, retornar a página inicial ou offline
    if (request.mode === 'navigate') {
      return caches.match('/')
        .then(response => response || createOfflinePage());
    }
    
    // Retorna resposta de erro para outros casos
    return createErrorResponse(request);
  }
}

/**
 * Atualiza o cache em segundo plano
 */
async function refreshCache(request: Request, cacheName: string): Promise<void> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
      await storeCacheMetadata(request.url, cacheName);
      console.log('[SW] Cache atualizado em segundo plano:', request.url);
    }
  } catch (error) {
    console.error('[SW] Erro ao atualizar cache em segundo plano:', error);
  }
}

/**
 * Cria uma resposta de erro formatada conforme o tipo de conteúdo
 */
function createErrorResponse(request: Request): Response {
  const contentType = request.headers.get('Accept') || '';
  
  if (contentType.includes('application/json')) {
    return new Response(JSON.stringify({ 
      error: 'Você está offline',
      code: 'OFFLINE' 
    }), { 
      status: 503, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
  
  if (contentType.includes('text/html') || request.mode === 'navigate') {
    return createOfflinePage();
  }
  
  if (contentType.includes('text/css')) {
    return new Response('/* Offline */', { 
      status: 503, 
      headers: { 'Content-Type': 'text/css' } 
    });
  }
  
  if (contentType.includes('application/javascript')) {
    return new Response('console.log("Offline");', { 
      status: 503, 
      headers: { 'Content-Type': 'application/javascript' } 
    });
  }
  
  return new Response('Offline', { 
    status: 503, 
    headers: { 'Content-Type': 'text/plain' } 
  });
}

/**
 * Cria uma página offline para navegação
 */
function createOfflinePage(): Response {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Você está offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
          color: #333;
        }
        h1 { color: #0284c7; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        .btn {
          display: inline-block;
          background: #0284c7;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="icon">📶</div>
      <h1>Você está offline</h1>
      <p>Não foi possível conectar ao servidor. Verifique sua conexão de internet e tente novamente.</p>
      <a href="/" class="btn">Tentar novamente</a>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html' }
  });
} 