"use client"

import { useEffect, useState } from "react"

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: SyncManager;
}

export default function RegisterSW() {
  const [registration, setRegistration] = useState<ExtendedServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Função para registrar o service worker
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js") as ExtendedServiceWorkerRegistration;
          console.log("Service Worker registrado com sucesso:", reg.scope);
          setRegistration(reg);

          // Verificar se há uma nova versão do service worker
          reg.addEventListener('updatefound', () => {
            console.log('Novo Service Worker encontrado!');
            const newWorker = reg.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('Service Worker state:', newWorker.state);
                if (newWorker.state === 'activated') {
                  console.log('Novo Service Worker ativado');
                  // Atualizar cache de todas as páginas principais
                  cacheMainRoutes();
                }
              });
            }
          });
        } catch (error) {
          console.error("Falha ao registrar Service Worker:", error);
        }
      }
    };

    // Função para cachear as rotas principais explicitamente
    const cacheMainRoutes = () => {
      const mainRoutes = [
        '/',
        '/perfil',
        '/medicoes',
        '/medicamentos',
        '/educacao'
      ];
      
      if (registration && navigator.serviceWorker.controller) {
        mainRoutes.forEach(route => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CACHE_NEW_ROUTE',
              url: route
            });
          }
        });
      }
    };

    // Registrar o service worker quando a página carrega
    window.addEventListener("load", registerServiceWorker);

    // Eventos de conectividade para melhorar a experiência offline
    const handleOnline = () => {
      console.log('Aplicativo está online');
      if (registration && registration.sync) {
        // Solicitar sincronização quando ficar online
        registration.sync.register('sync-data')
          .then(() => console.log('Sincronização agendada'))
          .catch((err: Error) => console.error('Erro ao agendar sincronização:', err));
      }
    };

    const handleOffline = () => {
      console.log('Aplicativo está offline');
      // Poderia mostrar notificação ou banner informando usuário
    };

    // Adicionar ouvintes de eventos online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Limpar ouvintes quando o componente desmontar
    return () => {
      window.removeEventListener('load', registerServiceWorker);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registration]);

  return null;
}
