/**
 * Tipos adicionais para notificações
 */

/**
 * Interface para ações de notificação
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Opções estendidas para notificações
 */
export interface ExtendedNotificationOptions extends NotificationOptions {
  /**
   * Propriedade para definir vibração
   */
  vibrate?: number[];
  
  /**
   * Ações disponíveis na notificação
   */
  actions?: NotificationAction[];
  
  /**
   * Silencia a notificação
   */
  silent?: boolean;
} 