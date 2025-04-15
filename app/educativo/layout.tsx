import React from 'react';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Recursos Educativos - Gerenciador de Saúde',
  description: 'Aprenda informações importantes sobre hipertensão, diabetes e prevenção de AVC',
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function EducativoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 