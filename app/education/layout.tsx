import React from 'react';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Educational Resources - Health Manager',
  description: 'Learn important information about hypertension, diabetes, and stroke prevention',
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 