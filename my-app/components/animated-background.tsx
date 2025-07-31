"use client"

import { useEffect, useState } from "react"

export function AnimatedBackground() {
  const [orbs, setOrbs] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string; duration: number }>
  >([])

  useEffect(() => {
    const colors = ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]
    const newOrbs = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 200 + 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 20 + 15,
    }))
    setOrbs(newOrbs)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full opacity-20 blur-xl animate-pulse"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: `radial-gradient(circle, ${orb.color}40 0%, transparent 70%)`,
            animation: `float ${orb.duration}s ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(30px, -30px) rotate(180deg); }
        }
      `}</style>
    </div>
  )
}
