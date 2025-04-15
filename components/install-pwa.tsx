"use client"

import { useState, useEffect } from "react"
import { Download, CheckCircle, Save } from "lucide-react"
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
  const [showPrecacheButton, setShowPrecacheButton] = useState(false)
  const [isPrecaching, setIsPrecaching] = useState(false)
  const [precacheSuccess, setPrecacheSuccess] = useState(false)
  const [showPersistentCache, setShowPersistentCache] = useState(false)
  const [isPersistentCaching, setIsPersistentCaching] = useState(false)
  const [persistentSuccess, setPersistentSuccess] = useState(false)

  useEffect(() => {
    // Verificar se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as NavigatorWithStandalone).standalone === true) {
      setIsInstalled(true);
      // Se estiver instalado, mostrar opção de pré-cache
      setShowPrecacheButton(true);
      
      // Também mostrar opção de cache persistente
      setShowPersistentCache(true);
    } else {
      // Se não estiver instalado, mostrar opção de cache persistente após 2 segundos
      const timer = setTimeout(() => {
        setShowPersistentCache(true);
      }, 2000);
      return () => clearTimeout(timer);
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
      // Mostrar opção de pré-cache quando instalado
      setShowPrecacheButton(true)
      setShowPersistentCache(true)
      console.log("PWA foi instalado com sucesso!")
    }
    
    // Ouvir mensagens do service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CACHE_STARTED') {
        console.log('Cache persistente iniciado:', event.data.message);
      }
      
      if (event.data && event.data.type === 'SW_ACTIVATED') {
        console.log('Novo Service Worker ativado:', event.data.version);
        // Pode-se mostrar uma notificação de atualização aqui se necessário
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleAppInstalled);
    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleAppInstalled);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
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
      setShowPrecacheButton(true)
      setShowPersistentCache(true)
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
      return;
    }
    
    setIsPersistentCaching(true);
    
    try {
      // Solicitar ao service worker que inicie o cache completo
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ALL_ROUTES'
      });
      
      // Esperamos um tempo para simular o processo completo
      // Na realidade, o service worker fará isso em segundo plano
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Armazenar no localStorage que o cache persistente foi feito
      localStorage.setItem('persistentCacheDone', 'true');
      
      setPersistentSuccess(true);
      // Resetar o status de sucesso após alguns segundos
      setTimeout(() => setPersistentSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao fazer cache persistente:", error);
    } finally {
      setIsPersistentCaching(false);
    }
  };

  // Se o app já estiver instalado ou o usuário tiver dispensado, não mostramos o botão de instalação
  const showInstallButton = deferredPrompt && !isInstalled && !isInstallDismissed;
  
  // Se nenhum botão estiver visível, não mostramos nada
  if (!showInstallButton && !showPrecacheButton && !showPersistentCache) {
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
      
      {showPrecacheButton && (
        <Button
          onClick={handlePrecache}
          size="sm"
          disabled={isPrecaching}
          className={`flex items-center gap-2 ${
            precacheSuccess 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {isPrecaching ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></span>
              Cacheando...
            </span>
          ) : precacheSuccess ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Cacheado!
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Usar Offline
            </>
          )}
        </Button>
      )}
      
      {showPersistentCache && (
        <Button
          onClick={handlePersistentCache}
          size="sm"
          disabled={isPersistentCaching}
          className={`flex items-center gap-2 ${
            persistentSuccess 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isPersistentCaching ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></span>
              Salvando...
            </span>
          ) : persistentSuccess ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Permanente
            </>
          )}
        </Button>
      )}
    </div>
  )
}
