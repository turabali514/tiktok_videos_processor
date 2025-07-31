"use client"

import { useEffect, useState } from "react"

export function AnimatedTitle() {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const titles = [
    "TikTok Insights Dashboard",
    "AI-Powered Analytics",
    "Video Performance Tracker",
    "Content Intelligence Hub",
  ]

  useEffect(() => {
    // Initialize with first title to prevent height jumping
    if (!isInitialized) {
      setDisplayText(titles[0])
      setIsInitialized(true)
      return
    }

    const currentTitle = titles[currentIndex]

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (displayText.length < currentTitle.length) {
            setDisplayText(currentTitle.slice(0, displayText.length + 1))
          } else {
            setTimeout(() => setIsDeleting(true), 2000)
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText(displayText.slice(0, -1))
          } else {
            setIsDeleting(false)
            setCurrentIndex((prev) => (prev + 1) % titles.length)
          }
        }
      },
      isDeleting ? 50 : 100,
    )

    return () => clearTimeout(timeout)
  }, [displayText, currentIndex, isDeleting, titles, isInitialized])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="relative h-24 md:h-32 flex items-center justify-center">
      <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
        <span className="relative bg-gradient-to-r from-red-400 via-pink-400 to-white bg-clip-text text-transparent">
          {displayText}
          <span
            className={`inline-block w-1 h-12 md:h-16 bg-gradient-to-b from-red-400 to-pink-500 ml-1 ${
              showCursor ? "opacity-100" : "opacity-0"
            } transition-opacity duration-100`}
          />
        </span>
      </h1>

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-500/10 to-pink-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-red-600/10 rounded-full blur-3xl animate-ping"
          style={{ animationDuration: "3s" }}
        />
      </div>
    </div>
  )
}
