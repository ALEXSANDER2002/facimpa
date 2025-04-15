"use client"

import { useState, useEffect } from "react"
import { Download, CheckCircle } from "lucide-react"
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

  useEffect(() => {
    // Verificar se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as NavigatorWithStandalone).standalone === true) {
      setIsInstalled(true);
      // Se estiver instalado, mostrar opção de pré-cache
      setShowPrecacheButton(true);
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
      console.log("PWA foi instalado com sucesso!")
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", handleAppInstalled)
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

  // Se o app já estiver instalado ou o usuário tiver dispensado, não mostramos nada
  if ((isInstalled && !showPrecacheButton) || (isInstallDismissed && !deferredPrompt)) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {deferredPrompt && !isInstalled && (
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
    </div>
  )
}
