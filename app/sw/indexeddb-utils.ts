/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Nome do banco de dados
export const DB_NAME = 'health-pwa-db';
export const DB_VERSION = 1;

// Nomes dos stores
export const STORE_CONFIG = 'configuracoes';
export const STORE_OFFLINE_DATA = 'dados-offline';
export const STORE_CACHE_METADATA = 'cache-metadata';

/**
 * Abre uma conexão com o banco de dados IndexedDB
 */
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[IndexedDB] Erro ao abrir banco de dados:', event);
      reject(new Error('Não foi possível abrir o banco de dados'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar os object stores se ainda não existirem
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_OFFLINE_DATA)) {
        const offlineStore = db.createObjectStore(STORE_OFFLINE_DATA, { keyPath: 'id', autoIncrement: true });
        offlineStore.createIndex('route', 'route', { unique: false });
        offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORE_CACHE_METADATA)) {
        const metadataStore = db.createObjectStore(STORE_CACHE_METADATA, { keyPath: 'url' });
        metadataStore.createIndex('cacheName', 'cacheName', { unique: false });
        metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Armazena metadados sobre um item cacheado
 */
export const storeCacheMetadata = async (url: string, cacheName: string): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_CACHE_METADATA, 'readwrite');
    const store = transaction.objectStore(STORE_CACHE_METADATA);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        url,
        cacheName,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Erro ao armazenar metadados para ${url}`));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao armazenar metadados:', error);
  }
};

/**
 * Recupera metadados sobre itens cacheados
 */
export const getCacheMetadata = async (url: string): Promise<any> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_CACHE_METADATA, 'readonly');
    const store = transaction.objectStore(STORE_CACHE_METADATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get(url);
      
      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error(`Erro ao recuperar metadados para ${url}`));
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao recuperar metadados:', error);
    return null;
  }
};

/**
 * Armazena dados offline para sincronizar posteriormente
 */
export const storeOfflineData = async (route: string, data: any): Promise<number> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_OFFLINE_DATA, 'readwrite');
    const store = transaction.objectStore(STORE_OFFLINE_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        route,
        data,
        timestamp: Date.now(),
        synced: false
      });
      
      request.onsuccess = () => {
        resolve(request.result as number);
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error('Erro ao armazenar dados offline'));
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao armazenar dados offline:', error);
    throw error;
  }
};

/**
 * Recupera dados offline que precisam ser sincronizados
 */
export const getPendingOfflineData = async (): Promise<any[]> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_OFFLINE_DATA, 'readonly');
    const store = transaction.objectStore(STORE_OFFLINE_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.index('timestamp').openCursor();
      const items: any[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          if (!cursor.value.synced) {
            items.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(items);
          db.close();
        }
      };
      
      request.onerror = () => {
        reject(new Error('Erro ao recuperar dados offline pendentes'));
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao recuperar dados offline:', error);
    return [];
  }
};

/**
 * Marca um item offline como sincronizado
 */
export const markOfflineDataSynced = async (id: number): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_OFFLINE_DATA, 'readwrite');
    const store = transaction.objectStore(STORE_OFFLINE_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          store.put(data);
          resolve();
        } else {
          reject(new Error(`Item com ID ${id} não encontrado`));
        }
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error(`Erro ao marcar item ${id} como sincronizado`));
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao marcar item como sincronizado:', error);
  }
};

/**
 * Salva uma configuração no IndexedDB
 */
export const saveConfig = async (key: string, value: any): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_CONFIG, 'readwrite');
    const store = transaction.objectStore(STORE_CONFIG);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        id: key,
        value,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => {
        resolve();
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error(`Erro ao salvar configuração ${key}`));
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao salvar configuração:', error);
  }
};

/**
 * Recupera uma configuração do IndexedDB
 */
export const getConfig = async (key: string): Promise<any> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_CONFIG, 'readonly');
    const store = transaction.objectStore(STORE_CONFIG);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error(`Erro ao recuperar configuração ${key}`));
        db.close();
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Erro ao recuperar configuração:', error);
    return null;
  }
}; 