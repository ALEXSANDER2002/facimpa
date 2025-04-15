/// <reference lib="webworker" />

import { ExtendedNotificationOptions, NotificationAction } from './notification-types';

declare const self: ServiceWorkerGlobalScope;

/**
 * Manipula eventos push e exibe notificações ao usuário
 */
export function handlePushNotification(event: PushEvent): void {
  if (!event.data) return;
  
  let payload: any;
  
  try {
    payload = event.data.json();
  } catch (e) {
    // Se não for JSON, tenta como texto
    payload = {
      title: 'Notificação',
      body: event.data.text(),
      data: { url: '/' }
    };
  }
  
  const title = payload.title || 'Gerenciador de Saúde';
  const options: ExtendedNotificationOptions = {
    body: payload.body || 'Nova notificação importante',
    icon: '/icon.png',
    badge: '/apple-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/',
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    // Exibir a notificação mesmo se o app estiver em foreground
    requireInteraction: payload.requireInteraction !== false,
    // Silenciar se for durante a noite (21h às 8h)
    silent: isSilentTime()
  };
  
  // Para notificações de medicamento, adicionar ação para registrar a dose
  if (payload.type === 'medication') {
    options.actions = [
      {
        action: 'taken',
        title: 'Tomei'
      },
      {
        action: 'skip',
        title: 'Pular'
      }
    ];
    
    options.tag = `med-${payload.medicationId || Date.now()}`;
  }
  
  // Para notificações de medições, adicionar ação para registrar
  if (payload.type === 'measurement') {
    options.actions = [
      {
        action: 'measure',
        title: 'Registrar'
      },
      {
        action: 'later',
        title: 'Depois'
      }
    ];
    
    options.tag = `measure-${payload.type || 'generic'}`;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
}

/**
 * Manipula cliques em notificações
 */
export function handleNotificationClick(event: NotificationEvent): Promise<any> {
  // Fechar a notificação
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || '/';
  
  // Verificar a ação específica
  if (event.action === 'taken' || event.action === 'skip') {
    // Registrar medicamento tomado ou pulado
    const medicationId = event.notification.tag?.replace('med-', '') || '';
    const action = event.action;
    
    // Redirecionar para a página de medicamentos com parâmetro de ação
    targetUrl = `/medicamentos?action=${action}&id=${medicationId}`;
  }
  
  if (event.action === 'measure') {
    // Redirecionar para a página de medições
    const measurementType = event.notification.tag?.replace('measure-', '') || 'pressure';
    targetUrl = `/medicoes?action=new&type=${measurementType}`;
  }
  
  // Focar ou abrir uma janela com a URL de destino
  return self.clients.matchAll({ type: 'window' })
    .then(clientList => {
      // Verificar se já existe uma janela aberta e focar nela
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não houver janela com a URL correta, abrir uma nova
      return self.clients.openWindow(targetUrl);
    });
}

/**
 * Verifica se é horário de silenciar notificações (21h às 8h)
 */
function isSilentTime(): boolean {
  const now = new Date();
  const hours = now.getHours();
  
  // Silenciar entre 21h e 8h, a menos que o usuário tenha configurado diferente
  return (hours >= 21 || hours < 8);
} 