"use client"

import { useEffect, useState } from "react"

export function AuthAnimatedBackground() {
  const [orbs, setOrbs] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string; duration: number }>
  >([])
  const [particles, setParticles] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const colors = ["#ef4444", "#ec4899", "#f97316", "#ffffff"]
    const newOrbs = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 150,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 25 + 20,
    }))
    setOrbs(newOrbs)

    const newParticles = Array.from({ length: 30 }).map((_, i) => (
      <div
        key={`particle-${i}`}
        className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 3}s`,
        }}
      />
    ))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full opacity-10 blur-3xl animate-pulse"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: `radial-gradient(circle, ${orb.color}30 0%, transparent 70%)`,
            animation: `float ${orb.duration}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {particles}

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          50% {
            transform: translate(20px, -20px) rotate(90deg) scale(1.1);
          }
          100% {
            transform: translate(40px, -40px) rotate(180deg) scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}
