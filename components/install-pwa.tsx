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
            <WifiOff className="mr-2 h-4 w-4" /> Habilitar uso 100% offline
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
  const [showInstallOptions, setShowInstallOptions] = useState(false)

  useEffect(() => {
    // Verificar se o cache persistente já foi feito anteriormente
    const persistentCacheDone = localStorage.getItem('persistentCacheDone')
    if (persistentCacheDone === 'true') {
      setPersistentSuccess(true)
      setTotalOfflineDone(true)
    }

    // Verificar se o app já está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as NavigatorWithStandalone).standalone === true;
      
      setIsInstalled(isStandalone);
      // Se estiver instalado, não precisamos do prompt
      if (isStandalone) {
        setDeferredPrompt(null);
      }
    };
    
    // Verificar na inicialização
    checkIfInstalled();
    
    // Verificar sempre que o app voltar ao foco
    window.addEventListener('focus', checkIfInstalled);

    // Verificar se precacheing já foi concluído
    const precacheDone = localStorage.getItem('precacheDone')
    if (precacheDone === 'true') {
      setPrecacheSuccess(true)
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
      
      // Mostrar opções de instalação mesmo se o usuário dispensou anteriormente
      setShowInstallOptions(true)
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
            
            // Resetar o estado de carregamento após alguns segundos
            setTimeout(() => {
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
      window.removeEventListener('focus', checkIfInstalled);
      
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
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
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
        '/medications'
      ];
      
      // Enviar mensagem para o service worker para cachear rotas
      for (const route of routesToCache) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_NEW_ROUTE',
            url: route
          });
          
          // Pequeno atraso para não sobrecarregar o service worker
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Marcar como concluído após um tempo
      setTimeout(() => {
        setPrecacheSuccess(true);
        setIsPrecaching(false);
        localStorage.setItem('precacheDone', 'true');
      }, 1500);
      
    } catch (error) {
      console.error("Erro ao pré-cachear páginas:", error);
      setIsPrecaching(false);
    }
  };

  // Função para cache persistente para uso 100% offline
  const handlePersistentCache = async () => {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      console.log("Serviço de workers não disponível para cache persistente");
      return;
    }

    setIsPersistentCaching(true);
    setCacheProgress(0);
    
    try {
      // Lista de todas as páginas e recursos a cachear permanentemente
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
        '/offline.html',
        '/manifest.json',
        '/manifest.webmanifest',
        '/icon.png',
        '/apple-icon.png',
        '/favicon.ico',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        '/icons/icon-maskable-192x192.png',
        '/icons/icon-maskable-512x512.png'
      ];
      
      // Enviar mensagem para o service worker fazer cache offline completo
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_ALL_ROUTES',
          routes: routesToCache
        });
      }
      
      // Se não receber resposta em 10 segundos, assumir sucesso (fallback)
      setTimeout(() => {
        if (isPersistentCaching) {
          setPersistentSuccess(true);
          setIsPersistentCaching(false);
          setTotalOfflineDone(true);
          localStorage.setItem('persistentCacheDone', 'true');
          console.log("Cache offline concluído (timeout)");
          setCacheProgress(100);
        }
      }, 10000);
      
    } catch (error) {
      console.error("Erro ao criar cache persistente:", error);
      setIsPersistentCaching(false);
    }
  };

  // Renderiza os botões de instalação e configuração
  return (
    <>
      {(!isInstalled || showInstallOptions) && (
        <Card className="fixed bottom-0 left-0 right-0 p-4 z-50 mx-2 mb-2 rounded-lg shadow-lg">
          <div className="space-y-2">
            {deferredPrompt && !isInstalled && (
              <InstallButton 
                deferredPrompt={deferredPrompt} 
                onInstallClick={handleInstall} 
              />
            )}
            
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
          </div>
        </Card>
      )}
    </>
  )
}
