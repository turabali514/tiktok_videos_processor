"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Plus, Sparkles, Zap } from "lucide-react"

interface FloatingElementsProps {
  onImportClick: () => void
}

export function EnhancedFloatingElements({ onImportClick }: FloatingElementsProps) {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrolled / maxHeight) * 100

      setShowScrollTop(scrolled > 400)
      setScrollProgress(Math.min(progress, 100))
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToImport = () => {
    const importSection = document.getElementById("import-section")
    if (importSection) {
      importSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      {/* Scroll Progress Ring */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Progress Ring */}
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgb(55 65 81)" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - scrollProgress / 100)}`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(239 68 68)" />
                <stop offset="100%" stopColor="rgb(236 72 153)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Import Button */}
          <Button
            onClick={scrollToImport}
            className="absolute inset-2 w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-110 group"
          >
            <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <div className="fixed bottom-24 right-6 z-40">
          <Button
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-in slide-in-from-bottom-2 group relative overflow-hidden"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <ArrowUp className="w-5 h-5 text-white group-hover:-translate-y-1 transition-transform duration-300" />
          </Button>
        </div>
      )}

      {/* Floating Action Hints */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-30 space-y-4">
        {[Sparkles, Zap].map((Icon, index) => (
          <div
            key={index}
            className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-600/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse"
            style={{ animationDelay: `${index * 0.5}s` }}
          >
            <Icon className="w-4 h-4 text-red-400" />
          </div>
        ))}
      </div>
    </>
  )
}
