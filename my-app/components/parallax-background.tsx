"use client"

import { useEffect, useState } from "react"

export function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0)
  const [orbs, setOrbs] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      color: string
      duration: number
      parallaxFactor: number
    }>
  >([])
  const [particles, setParticles] = useState<React.ReactElement[]>([])
  const [redParticles, setRedParticles] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const colors = ["#ef4444", "#ec4899", "#f97316", "#ffffff"]

    // Use a single function to handle all randomness
    const generateRandomElements = () => {
      const generatedOrbs = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 200 + 150,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 25 + 20,
        parallaxFactor: Math.random() * 0.3 - 0.15,
      }))
      setOrbs(generatedOrbs)

      const generatedParticles = Array.from({ length: 25 }).map((_, i) => {
        const factor = 0.02 + Math.random() * 0.08
        return (
          <div
            key={`white-${i}`}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translate3d(0, ${scrollY * factor}px, 0)`,
              animationDelay: `${Math.random() * 3}s`,
              willChange: "transform",
            }}
          />
        )
      })

      const generatedRedParticles = Array.from({ length: 15 }).map((_, i) => {
        const factor = 0.03 + Math.random() * 0.1
        return (
          <div
            key={`red-${i}`}
            className="absolute w-0.5 h-0.5 bg-red-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translate3d(0, ${scrollY * factor}px, 0)`,
              animationDelay: `${Math.random() * 4}s`,
              willChange: "transform",
            }}
          />
        )
      })

      setParticles(generatedParticles)
      setRedParticles(generatedRedParticles)
    }

    generateRandomElements()
  }, [scrollY])

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
            transform: `translate3d(0, ${scrollY * orb.parallaxFactor}px, 0)`,
            willChange: "transform",
          }}
        />
      ))}

      {particles}
      {redParticles}
    </div>
  )
}
