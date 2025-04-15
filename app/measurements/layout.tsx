import React from 'react';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Health Measurements - Health Manager',
  description: 'Track and record your blood pressure, glucose levels and other health measurements',
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MeasurementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 