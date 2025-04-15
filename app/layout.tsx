import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FeedbackProvider } from "@/components/feedback-provider"
import RegisterSW from "@/components/register-sw"
import OfflineIndicator from "@/components/offline-indicator"
import InstallPWA from "@/components/install-pwa"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gerenciador de Saúde - Prevenção de AVC",
  description: "Gerencie sua pressão arterial e diabetes para prevenir AVC",
  manifest: "/manifest.json",
  themeColor: "#0284c7",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gerenciador de Saúde",
  },
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <FeedbackProvider>
            <OfflineIndicator />
            {children}
            <InstallPWA />
            <RegisterSW />
          </FeedbackProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'