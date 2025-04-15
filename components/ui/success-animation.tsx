"use client"

import { useState, useEffect } from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
  size?: "sm" | "md" | "lg"
  className?: string
  message?: string
}

export function SuccessAnimation({ show, onComplete, size = "md", className, message }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  const sizeClasses = {
    sm: "h-16 w-16 text-3xl",
    md: "h-24 w-24 text-4xl",
    lg: "h-32 w-32 text-5xl",
  }

  return (
    <div
      className={cn(
        "fixed inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-300",
        className,
      )}
    >
      <div className="bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
        <CheckCircle2
          className={cn(
            "text-green-500 animate-[scale-in_0.3s_ease-out,fade-out_0.5s_ease-in_1.5s]",
            sizeClasses[size],
          )}
        />
      </div>
      {message && (
        <p className="mt-4 text-white font-medium text-lg animate-[fade-in_0.3s_ease-out,fade-out_0.5s_ease-in_1.5s]">
          {message}
        </p>
      )}
    </div>
  )
}
