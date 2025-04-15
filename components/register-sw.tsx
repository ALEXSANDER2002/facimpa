"use client"

import { useEffect } from "react"

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js")
          console.log("Service Worker registrado com sucesso:", registration.scope)

          // Registra para sincronização em segundo plano quando online
          if ("sync" in registration) {
            // Registra uma tarefa de sincronização
            navigator.serviceWorker.ready.then((registration) => {
              registration.sync.register("sync-data").catch((error) => {
                console.error("Falha ao registrar sincronização em segundo plano:", error)
              })
            })
          }

          // Solicita permissão para notificações se ainda não concedida
          if (
            "Notification" in window &&
            Notification.permission !== "granted" &&
            Notification.permission !== "denied"
          ) {
            await Notification.requestPermission()
          }
        } catch (err) {
          console.error("Falha ao registrar Service Worker:", err)
        }
      })

      // Detecta mudanças no status da conexão
      window.addEventListener("online", () => {
        console.log("Aplicativo está online")
        // Tenta sincronizar dados quando voltar a ficar online
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register("sync-data")
          })
        }
      })

      window.addEventListener("offline", () => {
        console.log("Aplicativo está offline")
      })
    }
  }, [])

  return null
}
