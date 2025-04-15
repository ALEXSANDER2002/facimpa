/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

/**
 * Função auxiliar para enviar progresso de cache para a aplicação
 */
export const sendCacheProgressUpdate = (progress: number) => {
  self.clients.matchAll()
    .then((clients: readonly Client[]) => {
      clients.forEach((client: Client) => {
        client.postMessage({
          type: 'CACHE_PROGRESS',
          progress
        });
      });
    });
};

/**
 * Notifica os clientes que o service worker foi ativado
 */
export const notifyActivation = (version: string) => {
  self.clients.matchAll()
    .then((clients: readonly Client[]) => {
      clients.forEach((client: Client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version
        });
      });
    });
};

/**
 * Faz o cache de uma URL específica
 */
export const cacheUrl = async (cacheStore: string, url: string): Promise<boolean> => {
  try {
    const cache = await caches.open(cacheStore);
    const response = await fetch(url, { mode: 'no-cors' });
    
    if (response.ok || response.type === 'opaque') {
      await cache.put(url, response);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[Service Worker] Erro ao cachear ${url}:`, error);
    return false;
  }
};

/**
 * Faz o cache de uma lista de URLs
 */
export const cacheUrls = async (cacheName: string, urls: string[]): Promise<void> => {
  const cache = await caches.open(cacheName);
  
  // Pré-cachear individualmente cada URL para melhor tratamento de erros
  const cachePromises = urls.map(async (url) => {
    try {
      console.log(`[Service Worker] Cacheando ${url}`);
      return fetch(url, { mode: 'no-cors' })
        .then(response => {
          if (response.ok || response.type === 'opaque') {
            return cache.put(url, response);
          }
          console.warn(`[Service Worker] Resposta não foi OK para ${url}`);
        })
        .catch(error => {
          console.error(`[Service Worker] Falha ao cachear ${url}:`, error);
        });
    } catch (error) {
      console.error(`[Service Worker] Erro ao processar ${url}:`, error);
    }
  });
  
  await Promise.all(cachePromises);
  console.log('[Service Worker] Todos os recursos foram cacheados');
  
  // Enviar progresso de 100% após concluir
  sendCacheProgressUpdate(100);
}; 