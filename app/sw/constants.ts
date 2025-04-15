// Versão do cache para controle de atualizações
export const CACHE_VERSION = '1.0.0';

// Nomes dos caches
export const STATIC_CACHE = `static-cache-v${CACHE_VERSION}`;
export const DYNAMIC_CACHE = `dynamic-cache-v${CACHE_VERSION}`;
export const PAGES_CACHE = `pages-cache-v${CACHE_VERSION}`;

// Lista de URLs para cachear inicialmente
export const URLS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/apple-icon.png',
  '/icon.png',
  '/favicon.ico',
];

// Arquivos essenciais que serão cacheados durante a instalação
export const ESSENTIAL_ASSET_PATTERN = /\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|ico)$/i;

// Lista das rotas principais da aplicação
export const MAIN_ROUTES = [
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