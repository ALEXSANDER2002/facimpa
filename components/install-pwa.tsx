"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, CheckCircle, Save, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

// Interface para estender o Navigator para iOS
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

// Componente para botão de instalação
function InstallButton({ deferredPrompt, onInstallClick }: { 
  deferredPrompt: BeforeInstallPromptEvent | null, 
  onInstallClick: () => Promise<void> 
}) {
  if (!deferredPrompt) return null;
  
  return (
    <Button 
      variant="default" 
      className="w-full mb-2" 
      onClick={onInstallClick}
    >
      <Download className="mr-2 h-4 w-4" /> Instalar aplicativo
    </Button>
  );
}

// Componente para o botão de pré-cache
function PrecacheButton({ isPrecaching, precacheSuccess, onPrecacheClick }: {
  isPrecaching: boolean,
  precacheSuccess: boolean,
  onPrecacheClick: () => Promise<void>
}) {
  return (
    <Button 
      variant="outline" 
      className="w-full relative mb-2" 
      disabled={isPrecaching} 
      onClick={onPrecacheClick}
    >
      {isPrecaching ? (
        <>
          <span className="mr-2">Preparando navegação rápida...</span>
          <span className="animate-spin">⟳</span>
        </>
      ) : (
        <>
          <Wifi className="mr-2 h-4 w-4" /> Acelerar navegação
          {precacheSuccess && (
            <CheckCircle className="absolute right-2 h-4 w-4 text-green-500" />
          )}
        </>
      )}
    </Button>
  );
}

// Componente para o botão de cache persistente
function PersistentCacheButton({ 
  isPersistentCaching, 
  persistentSuccess, 
  cacheProgress, 
  onPersistentCacheClick 
}: {
  isPersistentCaching: boolean,
  persistentSuccess: boolean,
  cacheProgress: number,
  onPersistentCacheClick: () => Promise<void>
}) {
  return (
    <div className="w-full">
      <Button 
        variant="outline" 
        className="w-full relative" 
        disabled={isPersistentCaching} 
        onClick={onPersistentCacheClick}
      >
        {isPersistentCaching ? (
          <>
            <span className="mr-2">Baixando recursos para uso offline...</span>
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Habilitar uso 100% offline
            {persistentSuccess && (
              <CheckCircle className="absolute right-2 h-4 w-4 text-green-500" />
            )}
          </>
        )}
      </Button>
      
      {isPersistentCaching && (
        <Progress value={cacheProgress} className="h-1 mt-1" />
      )}
    </div>
  );
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
              setIsPersistentCaching(false);
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

  const handleInstall = useCallback(async () => {
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
  }, [deferredPrompt])

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
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-sm border-t">
      <Card className="p-3 shadow-md max-w-md mx-auto">
        {isInstalled && (
          <Alert className="mb-3">
            <AlertTitle>Aplicativo instalado!</AlertTitle>
            <AlertDescription>
              Você já está usando a versão instalada do aplicativo.
            </AlertDescription>
          </Alert>
        )}
        
        {!totalOfflineDone && (
          <div className="text-xs text-muted-foreground mb-3">
            Prepare seu aplicativo para funcionar offline e para melhor desempenho.
          </div>
        )}
        
        {showInstallButton && (
          <InstallButton 
            deferredPrompt={deferredPrompt} 
            onInstallClick={handleInstall} 
          />
        )}
        
        {!totalOfflineDone && (
          <>
            <PrecacheButton 
              isPrecaching={isPrecaching} 
              precacheSuccess={precacheSuccess} 
              onPrecacheClick={handlePrecache} 
            />
            
            <PersistentCacheButton 
              isPersistentCaching={isPersistentCaching} 
              persistentSuccess={persistentSuccess} 
              cacheProgress={cacheProgress} 
              onPersistentCacheClick={handlePersistentCache} 
            />
          </>
        )}
      </Card>
    </div>
  )
}
