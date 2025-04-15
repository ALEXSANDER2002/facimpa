"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Download, Check, AlertCircle } from "lucide-react"

export default function InstallOfflinePage() {
  // Estados da instalação
  const [status, setStatus] = useState<'waiting' | 'downloading' | 'complete' | 'error'>('waiting')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    // Verificar se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true)
    }

    // Lidar com mensagens do service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'CACHE_STARTED') {
          setStatus('downloading')
          setMessage(event.data.message || 'Iniciando download de recursos')
        } else if (event.data.type === 'CACHE_PROGRESS') {
          setStatus('downloading')
          setProgress(event.data.progress || 0)
          setMessage(event.data.message || 'Baixando recursos')
        } else if (event.data.type === 'CACHE_COMPLETE') {
          setStatus('complete')
          setProgress(100)
          setMessage('Download completo! Seu app está pronto para uso offline.')
        } else if (event.data.type === 'CACHE_ERROR') {
          setStatus('error')
          setMessage(event.data.message || 'Erro ao baixar recursos')
        }
      }
    }

    // Adicionar listener para mensagens do service worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage)
    }

    // Limpar listener ao desmontar o componente
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [])

  // Iniciar o download completo
  const startFullDownload = async () => {
    try {
      setStatus('downloading')
      setProgress(0)
      setMessage('Iniciando download completo do aplicativo...')

      // Verificar se o service worker está registrado
      const registration = await navigator.serviceWorker.ready
      
      if (!registration?.active) {
        throw new Error('Service worker não está ativo. Por favor recarregue a página.')
      }

      // Lista de rotas a serem cacheadas
      const routesToCache = [
        '/',
        '/perfil',
        '/medicoes',
        '/medicamentos',
        '/educacao',
        '/instalar',
        '/education',
        '/profile',
        '/measurements',
        '/medications',
        '/educativo'
      ]

      // Enviar comando para o service worker iniciar o download completo
      registration.active.postMessage({
        type: 'CACHE_ALL_ROUTES',
        routes: routesToCache
      })

      // O progresso será atualizado via eventos do service worker
    } catch (error) {
      console.error('Erro ao iniciar download:', error)
      setStatus('error')
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`)
    }
  }

  return (
    <div className="container max-w-md mx-auto py-8 px-4">
      <Card className="p-6 shadow-md">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Instalação para Uso Offline</h1>
            <p className="text-muted-foreground">
              Este processo vai preparar o aplicativo para funcionar completamente sem internet.
            </p>
          </div>

          {isAppInstalled && (
            <Alert className="mb-4">
              <AlertTitle>Você já está usando o app instalado!</AlertTitle>
              <AlertDescription>
                Para garantir o acesso offline completo, conclua o processo de download abaixo.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {status === 'waiting' && (
              <Button 
                onClick={startFullDownload} 
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Iniciar Download Completo
              </Button>
            )}

            {status === 'downloading' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
              </div>
            )}

            {status === 'complete' && (
              <div className="text-center space-y-4">
                <div className="mx-auto rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Download Concluído!</h3>
                  <p className="text-muted-foreground">
                    Seu aplicativo está pronto para ser usado offline. Você pode fechar esta página.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Voltar ao Início
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="mx-auto rounded-full bg-red-100 p-3 w-16 h-16 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Erro na Instalação</h3>
                  <p className="text-red-600 text-sm">
                    {message}
                  </p>
                </div>
                <Button onClick={startFullDownload}>
                  Tentar Novamente
                </Button>
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
            <p>
              Certifique-se de estar conectado a uma rede WiFi estável durante este processo. 
              Este download salvará os arquivos necessários no seu dispositivo para que o app 
              funcione sem conexão com a internet.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
} 