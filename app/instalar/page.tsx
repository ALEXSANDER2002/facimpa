"use client"

import React from 'react';
import { Button, Card, CircularProgress, Container, Typography, Box, Alert, Stack } from '@mui/material';
import DownloadingIcon from '@mui/icons-material/Downloading';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ErrorIcon from '@mui/icons-material/Error';

export default function InstalacaoPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
        <InstallationManager />
      </Card>
    </Container>
  );
}

function InstallationManager() {
  // Define estados possíveis da instalação
  const [status, setStatus] = React.useState<'waiting' | 'downloading' | 'complete' | 'error'>('waiting');
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [isAppInstalled, setIsAppInstalled] = React.useState(false);

  React.useEffect(() => {
    // Verifica se o app já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    // Escuta por mensagens do service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'CACHE_STARTED') {
          setStatus('downloading');
          setMessage(event.data.message || 'Iniciando download de recursos');
        } else if (event.data.type === 'CACHE_PROGRESS') {
          setStatus('downloading');
          setProgress(event.data.progress || 0);
          setMessage(event.data.message || 'Baixando recursos');
        } else if (event.data.type === 'CACHE_COMPLETE') {
          setStatus('complete');
          setProgress(100);
          setMessage('Download completo! Seu app está pronto para uso offline.');
        } else if (event.data.type === 'CACHE_ERROR') {
          setStatus('error');
          setMessage(event.data.message || 'Erro ao baixar recursos');
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Inicia o download completo
  const startFullDownload = async () => {
    try {
      setStatus('downloading');
      setProgress(0);
      setMessage('Iniciando download completo do aplicativo...');

      // Verifica se o service worker está registrado
      const registration = await navigator.serviceWorker.ready;
      
      if (!registration?.active) {
        throw new Error('Service worker não está ativo. Por favor recarregue a página.');
      }

      // Lista de rotas a serem cacheadas
      const routesToCache = [
        '/',
        '/perfil',
        '/medicoes',
        '/medicamentos',
        '/educacao',
        '/instalar',
        '/offline.html'
      ];

      // Envia comando para o service worker iniciar o download completo
      registration.active.postMessage({
        type: 'CACHE_COMPLETE_APP',
        routes: routesToCache
      });

      // O progresso será atualizado via eventos do service worker
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
      setStatus('error');
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  };

  return (
    <Stack spacing={3} alignItems="center">
      <Typography variant="h5" align="center" gutterBottom>
        Instalação Completa para Uso Offline
      </Typography>

      {isAppInstalled && (
        <Alert severity="info" sx={{ width: '100%' }}>
          Você já está utilizando o aplicativo no modo instalado! Para garantir o acesso offline, conclua o processo de download abaixo.
        </Alert>
      )}

      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="body1" paragraph>
          Este processo vai fazer o download de todos os recursos necessários para que o aplicativo funcione 100% offline.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Certifique-se de estar conectado a uma rede WiFi estável durante este processo.
        </Typography>
      </Box>

      {status === 'waiting' && (
        <Button 
          variant="contained" 
          size="large" 
          color="primary" 
          startIcon={<DownloadingIcon />}
          onClick={startFullDownload}
          sx={{ py: 1.5 }}
        >
          Iniciar Download Completo
        </Button>
      )}

      {status === 'downloading' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress variant="determinate" value={progress} size={80} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            {message}
          </Typography>
        </Box>
      )}

      {status === 'complete' && (
        <Box sx={{ textAlign: 'center' }}>
          <DoneAllIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Download Concluído!
          </Typography>
          <Typography variant="body1">
            Seu aplicativo está pronto para ser usado offline. Você pode fechar esta página.
          </Typography>
        </Box>
      )}

      {status === 'error' && (
        <Box sx={{ textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Erro na instalação
          </Typography>
          <Typography variant="body2" color="error" paragraph>
            {message}
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={startFullDownload}
          >
            Tentar novamente
          </Button>
        </Box>
      )}
    </Stack>
  );
} 