"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detecta se o app já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o comportamento padrão do navegador
      e.preventDefault()
      // Armazena o evento para uso posterior
      setDeferredPrompt(e)
      // Mostra o botão de instalação
      setIsInstallable(true)
    }

    // Detecta quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Mostra o prompt de instalação
    deferredPrompt.prompt()

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice

    // Limpa o prompt armazenado
    setDeferredPrompt(null)

    if (outcome === "accepted") {
      setIsInstalled(true)
      setIsInstallable(false)
    }
  }

  if (!isInstallable || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 mx-auto w-[90%] max-w-md bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-sm">Instale o aplicativo</h3>
          <p className="text-xs text-muted-foreground">Acesse offline e receba notificações</p>
        </div>
        <Button onClick={handleInstallClick} className="ml-4 flex items-center gap-2" size="sm">
          <Download className="h-4 w-4" />
          Instalar
        </Button>
      </div>
    </div>
  )
}
