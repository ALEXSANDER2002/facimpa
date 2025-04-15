"use client"

import { useState, useEffect } from "react"
import { WifiOff, X } from "lucide-react"

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)
  
  useEffect(() => {
    // Inicializa o estado com o status atual da conexão
    const online = navigator.onLine
    setIsOnline(online)
    
    // Se iniciar offline, mostrar o indicador brevemente
    if (!online) {
      setShowIndicator(true)
      // Esconder após 5 segundos se continuar offline
      const timer = setTimeout(() => {
        setShowIndicator(false)
      }, 5000)
      return () => clearTimeout(timer)
    }

    // Adiciona event listeners para mudanças no status da conexão
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(false) // Esconde imediatamente quando ficar online
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true) // Mostra quando ficar offline
      
      // Esconde após 5 segundos
      const timer = setTimeout(() => {
        setShowIndicator(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Função para fechar manualmente o indicador
  const handleClose = () => {
    setShowIndicator(false)
  }

  // Se estiver online ou o indicador não deve ser mostrado, não renderiza nada
  if (isOnline || !showIndicator) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 px-4 text-center text-sm z-50 flex items-center justify-between">
      <div className="flex items-center">
        <WifiOff className="h-3 w-3 mr-1.5" />
        <span>Você está offline. O app continua funcionando normalmente.</span>
      </div>
      <button 
        onClick={handleClose} 
        className="ml-2 p-1 hover:bg-amber-600 rounded-full"
        aria-label="Fechar"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
