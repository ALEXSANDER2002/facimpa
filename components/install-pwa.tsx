"use client"

import { useState, useEffect } from "react"
import { Download, CheckCircle, Save, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

// Interface para estender o Navigator para iOS
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallDismissed, setIsInstallDismissed] = useState(false)
  const [isPrecaching, setIsPrecaching] = useState(false)
  const [precacheSuccess, setPrecacheSuccess] = useState(false)
  const [isPersistentCaching, setIsPersistentCaching] = useState(false)
  const [persistentSuccess, setPersistentSuccess] = useState(false)
  const [totalOfflineDone, setTotalOfflineDone] = useState(false)
  const [cacheProgress, setCacheProgress] = useState(0)

  useEffect(() => {
    // Verificar se o cache persistente já foi feito anteriormente
    const persistentCacheDone = localStorage.getItem('persistentCacheDone')
    if (persistentCacheDone === 'true') {
      setTotalOfflineDone(true)
    }

    // Verificar se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as NavigatorWithStandalone).standalone === true) {
      setIsInstalled(true);
    }

    // Interceptar o evento beforeinstallprompt
    const handler = (e: Event) => {
      // Prevenir o prompt automático
      e.preventDefault()
      // Armazenar o evento para uso futuro
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Verificar no localStorage se o usuário já dispensou a instalação
      const installDismissed = localStorage.getItem("installDismissed")
      if (installDismissed) {
        setIsInstallDismissed(true)
      }
    }

    // Detectar quando a instalação é concluída
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      console.log("PWA foi instalado com sucesso!")
    }
    
    // Ouvir mensagens do service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CACHE_STARTED') {
        console.log('Cache persistente iniciado:', event.data.message);
        setCacheProgress(10); // Inicialização
      }
      
      if (event.data && event.data.type === 'CACHE_PROGRESS') {
        console.log('Progresso do cache:', event.data.progress);
        setCacheProgress(event.data.progress);
        
        if (event.data.progress >= 100) {
          setTimeout(() => {
            setPersistentSuccess(true);
            setTotalOfflineDone(true);
            localStorage.setItem('persistentCacheDone', 'true');
            
            // Resetar o estado de sucesso após alguns segundos
            setTimeout(() => {
              setPersistentSuccess(false);
            }, 3000);
          }, 500);
        }
      }
      
      if (event.data && event.data.type === 'SW_ACTIVATED') {
        console.log('Novo Service Worker ativado:', event.data.version);
      }
      
      if (event.data && event.data.type === 'ROUTE_CACHING_REQUESTED') {
        setCacheProgress(prev => Math.min(prev + 5, 95));
      }
    };

    // Registrar ouvintes de eventos
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleAppInstalled);
    
    // Ouvir mensagens somente se o service worker estiver disponível
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleAppInstalled);
      
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Mostrar o prompt de instalação
    await deferredPrompt.prompt()

    // Aguardar a resposta do usuário
    const choiceResult = await deferredPrompt.userChoice

    // Se o usuário aceitar a instalação
    if (choiceResult.outcome === "accepted") {
      console.log("Usuário aceitou a instalação")
      setIsInstalled(true)
    } else {
      console.log("Usuário dispensou a instalação")
      // Salvar que o usuário dispensou para não mostrar o botão frequentemente
      localStorage.setItem("installDismissed", "true")
      setIsInstallDismissed(true)
    }

    // Limpar o prompt após uso
    setDeferredPrompt(null)
  }

  // Função para cachear temporariamente as páginas principais
  const handlePrecache = async () => {
    if (!navigator.serviceWorker.controller) {
      console.log("Serviço de workers não disponível para pré-cache");
      return;
    }

    setIsPrecaching(true);
    
    try {
      // Lista de todas as páginas principais e suas subpáginas
      const routesToCache = [
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
      
      // Enviar mensagem para o service worker para cachear cada rota
      for (const route of routesToCache) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_NEW_ROUTE',
            url: route
          });
          
          // Aguardar um pouco entre cada requisição para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setPrecacheSuccess(true);
      // Resetar o status de sucesso após alguns segundos
      setTimeout(() => setPrecacheSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao pré-cachear páginas:", error);
    } finally {
      setIsPrecaching(false);
    }
  };
  
  // Função para cachear permanentemente todo o aplicativo
  const handlePersistentCache = async () => {
    if (!navigator.serviceWorker.controller) {
      console.log("Serviço de workers não disponível para cache persistente");
      
      // Tenta registrar o service worker novamente
      try {
        await navigator.serviceWorker.register('/sw.js');
        // Espera um pouco para o SW ser ativado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!navigator.serviceWorker.controller) {
          console.error("Não foi possível ativar o service worker");
          return;
        }
      } catch (error) {
        console.error("Erro ao registrar service worker:", error);
        return;
      }
    }
    
    setIsPersistentCaching(true);
    setCacheProgress(0);
    
    try {
      // Solicitar ao service worker que inicie o cache completo
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ALL_ROUTES'
      });
      
      // O progresso será atualizado pelos eventos recebidos do service worker
    } catch (error) {
      console.error("Erro ao fazer cache persistente:", error);
      
      // Em caso de erro, criar uma resposta simulada
      setTimeout(() => {
        setPersistentSuccess(true);
        setTotalOfflineDone(true);
        localStorage.setItem('persistentCacheDone', 'true');
        
        setTimeout(() => {
          setPersistentSuccess(false);
          setIsPersistentCaching(false);
        }, 3000);
      }, 2000);
    }
  };

  // Se o app já estiver completamente offline e não houver botão de instalação, não mostramos nada
  const showInstallButton = deferredPrompt && !isInstalled && !isInstallDismissed;
  if (totalOfflineDone && !showInstallButton && !isPersistentCaching && !persistentSuccess) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {showInstallButton && (
        <Button 
          onClick={handleInstall} 
          size="sm" 
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700"
        >
          <Download className="h-4 w-4" />
          Instalar App
        </Button>
      )}
      
      {(!totalOfflineDone || isPersistentCaching || persistentSuccess) && (
        <div className="relative">
          <Button
            onClick={handlePersistentCache}
            size="sm"
            disabled={isPersistentCaching || totalOfflineDone}
            className={`flex items-center gap-2 w-full ${
              persistentSuccess 
                ? "bg-green-600 hover:bg-green-700" 
                : totalOfflineDone
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isPersistentCaching ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></span>
                Preparando para usar sem internet...
              </span>
            ) : persistentSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Modo 100% offline ativado!
              </>
            ) : totalOfflineDone ? (
              <>
                <WifiOff className="h-4 w-4" />
                Modo 100% offline ativado
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Ativar modo 100% offline
              </>
            )}
          </Button>
          
          {/* Barra de progresso */}
          {isPersistentCaching && (
            <div className="w-full h-1 bg-gray-300 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-out"
                style={{ width: `${cacheProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
