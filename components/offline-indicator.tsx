"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Inicializa o estado com o status atual da conexão
    setIsOnline(navigator.onLine)

    // Adiciona event listeners para mudanças no status da conexão
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1 px-4 text-center text-sm z-50 flex items-center justify-center">
      <WifiOff className="h-3 w-3 mr-1" />
      <span>Você está offline. Os dados serão salvos localmente.</span>
    </div>
  )
}
