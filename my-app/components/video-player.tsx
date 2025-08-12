"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Maximize2, Volume2, VolumeX } from "lucide-react"

interface VideoPlayerProps {
  src: string
}

export function VideoPlayer({ src, className }: VideoPlayerProps & { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Toggle play/pause
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true)
        setShowControls(true)
      })
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  // Handle video click
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    togglePlayPause()
  }

  // Toggle mute
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (video) {
      video.muted = !video.muted
      setIsMuted(video.muted)
    }
  }

  // Fullscreen
  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    const element = videoRef.current
    if (!element) return

    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
          element.style.objectFit = 'contain'
        })
        .catch(err => {
          console.error("Error attempting to enable fullscreen:", err)
        })
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  // Control visibility logic
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isPlaying && !isHovered) {
      timer = setTimeout(() => {
        setShowControls(false)
      })
    } else {
      setShowControls(true)
    }

    return () => clearTimeout(timer)
  }, [isHovered, isPlaying])

  return (
   <div 
      ref={containerRef}
      className={`relative group ${className}`}
      style={{
        aspectRatio: '3/4', // Enforce aspect ratio
     width: '100%', // Responsive width
    height: 'auto', // Height scales with aspect ratio
    maxWidth: '100%', // Prevent overflow
    overflow: 'hidden' // Contain the video
      }}
      onMouseEnter={() => {
        setIsHovered(true)
        setShowControls(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-contain"
        muted={isMuted} 
        playsInline
        onClick={handleVideoClick}
        style={{
      // Ensures video covers container while maintaining aspect ratio
      minWidth: '100%',
      minHeight: '100%',
      // Centers the video in the container
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)'
    }}
      />

      {/* Play/Pause button - shows when paused or controls visible */}
      {(!isPlaying || showControls) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <Button
            onClick={handleVideoClick}
            variant="ghost"
            size="icon"
            className="w-14 h-14 bg-white/20 border border-white/30 rounded-full hover:bg-white/30 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </Button>
        </div>
      )}

      {/* Bottom controls bar */}
      {showControls && (
        <div className="absolute top-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-20 flex justify-between items-center">
          {/* Mute button */}
          <Button
            onClick={handleMuteToggle}
            variant="ghost"
            size="icon"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          {/* Fullscreen button */}
          <Button
            onClick={handleFullscreen}
            variant="ghost"
            size="icon"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}