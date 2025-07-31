"use client"

import { useEffect, useState } from "react"
import { Video, Sparkles } from "lucide-react"

interface AuthLoadingAnimationProps {
  onComplete: () => void
}

export function AuthLoadingAnimation({ onComplete }: AuthLoadingAnimationProps) {
  const [stage, setStage] = useState(0)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      delay: Math.random() * 1000,
    }))
    setParticles(newParticles)

    // Animation sequence
    const timer1 = setTimeout(() => setStage(1), 500)
    const timer2 = setTimeout(() => setStage(2), 1500)
    const timer3 = setTimeout(() => setStage(3), 2500)
    const timer4 = setTimeout(() => onComplete(), 3500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-2 h-2 bg-gradient-to-r from-red-400 to-pink-400 rounded-full transition-all duration-2000 ease-out ${
            stage >= 1 ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: particle.x,
            top: particle.y,
            transform: stage >= 2 ? "translate(-50vw, -50vh) scale(0.5)" : "translate(0, 0) scale(1)",
            transitionDelay: `${particle.delay}ms`,
          }}
        />
      ))}

      {/* Central loading icon */}
      <div
        className={`relative transition-all duration-1000 ease-out ${
          stage >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      >
        <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl flex items-center justify-center relative">
          <Video className="w-12 h-12 text-white" />

          {/* Rotating rings */}
          <div className="absolute inset-0 rounded-3xl border-4 border-red-400/30 animate-spin" />
          <div
            className="absolute inset-2 rounded-2xl border-2 border-pink-400/50 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "3s" }}
          />

          {/* Pulsing glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500/20 to-pink-500/20 animate-ping" />
        </div>

        {/* Floating sparkles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Sparkles
            key={i}
            className="absolute w-4 h-4 text-red-400 animate-bounce"
            style={{
              top: `${-20 + Math.sin((i * 60 * Math.PI) / 180) * 40}px`,
              left: `${-20 + Math.cos((i * 60 * Math.PI) / 180) * 40}px`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <div
        className={`absolute bottom-1/3 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
          stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
            TikTok Insights
          </h2>
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <span className="text-sm">Loading your experience...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
