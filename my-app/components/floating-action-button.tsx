"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Plus } from "lucide-react"

interface FloatingActionButtonProps {
  onImportClick: () => void
}

export function FloatingActionButton({ onImportClick }: FloatingActionButtonProps) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
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
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
      {/* Import Video Button */}
      <Button
        onClick={scrollToImport}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-in slide-in-from-bottom-2"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </Button>
      )}
    </div>
  )
}
