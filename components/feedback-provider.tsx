"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

type FeedbackType = "success" | "error" | "warning" | "info"

interface FeedbackContextType {
  showFeedback: (message: string, type?: FeedbackType, description?: string, duration?: number) => void
  showSuccess: (message: string, description?: string) => void
  showError: (message: string, description?: string) => void
  showWarning: (message: string, description?: string) => void
  showInfo: (message: string, description?: string) => void
  vibrate: (pattern?: number | number[]) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()

  const showFeedback = (message: string, type: FeedbackType = "info", description?: string, duration?: number) => {
    // Mostrar toast
    toast({
      title: message,
      description: description,
      variant: type === "error" ? "destructive" : "default",
      duration: duration,
    })

    // Vibrar para feedback tátil em dispositivos móveis
    if (type === "success") {
      vibrate(200)
    } else if (type === "error") {
      vibrate([100, 50, 100])
    } else if (type === "warning") {
      vibrate([50, 50, 50])
    }
  }

  const showSuccess = (message: string, description?: string) => {
    showFeedback(message, "success", description)
  }

  const showError = (message: string, description?: string) => {
    showFeedback(message, "error", description)
  }

  const showWarning = (message: string, description?: string) => {
    showFeedback(message, "warning", description)
  }

  const showInfo = (message: string, description?: string) => {
    showFeedback(message, "info", description)
  }

  const vibrate = (pattern?: number | number[]) => {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
        console.error("Erro ao vibrar:", error)
      }
    }
  }

  return (
    <FeedbackContext.Provider
      value={{
        showFeedback,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        vibrate,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}
