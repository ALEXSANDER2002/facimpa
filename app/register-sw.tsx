"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function RegisterSW() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [registrationOk, setRegistrationOk] = useState(false)
  const [initialCaching, setInitialCaching] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  // Rotas principais para cache inicial
  const mainRoutes = [
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
  ]

  // Função para pré-cachear rotas principais quando um novo service worker é ativado
  const cacheMainRoutes = async (swRegistration: ServiceWorkerRegistration) => {
    // Verificar se o service worker está ativo
    if (swRegistration.active) {
      try {
        // Enviar mensagem para cachear cada rota principal
        mainRoutes.forEach(route => {
          swRegistration.active?.postMessage({
            type: 'CACHE_NEW_ROUTE',
            url: route
          })
        })
      } catch (error) {
        console.error('Erro ao cachear rotas principais:', error)
      }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.serviceWorker) {
      return // Sair se não estiver no navegador ou sem suporte a service worker
    }

    const registerSW = async () => {
      try {
        // Registrar service worker
        const sw = '/sw.js'
        const registration = await navigator.serviceWorker.register(sw, {
          scope: '/'
        })

        // Verificar e cachear se já estiver registrado e ativo
        if (registration.active) {
          setRegistrationOk(true)
          setInitialCaching(false)
          
          // Cachear rotas principais somente se for a primeira visita
          if (!localStorage.getItem('swInitialCacheDone')) {
            await cacheMainRoutes(registration)
            localStorage.setItem('swInitialCacheDone', 'true')
          }
        }

        // Manipulador para quando o service worker termina de instalar
        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          
          if (!installingWorker) return
          
          installingWorker.onstatechange = () => {
            // Service worker terminou de instalar
            if (installingWorker.state === 'installed') {
              setRegistrationOk(true)
              setInitialCaching(false)
              
              if (navigator.serviceWorker.controller) {
                // Novo service worker disponível - atualização
                setUpdateAvailable(true)
                setWaitingWorker(installingWorker)
                
                toast.info(
                  "Nova versão disponível",
                  {
                    description: "Recarregue a página para atualizar.",
                    action: {
                      label: "Atualizar",
                      onClick: () => {
                        if (waitingWorker) {
                          waitingWorker.postMessage({ type: 'SKIP_WAITING' })
                          window.location.reload()
                        }
                      }
                    },
                    duration: 10000
                  }
                )
              } else {
                // Primeira instalação
                cacheMainRoutes(registration)
              }
            } else if (installingWorker.state === 'redundant') {
              console.error('O service worker se tornou redundante')
            }
          }
        }

        // Listeneres para eventos de conexão
        const handleOnline = () => {
          setIsOnline(true)
          if (registrationOk) {
            toast.success("Voltou a ficar online", { 
              description: "Sincronizando dados...",
              duration: 3000
            })
          }
        }

        const handleOffline = () => {
          setIsOnline(false)
          if (registrationOk) {
            toast.warning("Você está offline", { 
              description: "O app continua funcionando com recursos limitados",
              duration: 5000
            })
          }
        }

        // Verificar estado inicial
        setIsOnline(navigator.onLine)
        
        // Adicionar event listeners
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Listener para mensagens do service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            console.log('Novo Service Worker ativado:', event.data.version)
            cacheMainRoutes(registration)
          }
          
          if (event.data && event.data.type === 'CACHE_PROGRESS') {
            console.log('Progresso do cache:', event.data.progress)
          }
        })

        return () => {
          window.removeEventListener('online', handleOnline)
          window.removeEventListener('offline', handleOffline)
        }
      } catch (error) {
        console.error('Erro ao registrar service worker:', error)
        setRegistrationOk(false)
        setInitialCaching(false)
      }
    }

    registerSW()
  }, [])

  return null
}
