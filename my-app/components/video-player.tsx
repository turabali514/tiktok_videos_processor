"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Maximize2, Volume2, VolumeX } from "lucide-react"

interface VideoPlayerProps {
  src: string
}

export function VideoPlayer({ src}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  // Toggle play/pause on video click
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (video) {
      if (video.paused) {
        video.play()
        setIsPlaying(true)
      } else {
        video.pause()
        setIsPlaying(false)
      }
    }
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
    const video = videoRef.current
    if (video?.requestFullscreen) {
      video.requestFullscreen()
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen()
    }
  }

  // When video ends, allow replay
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener("ended", handleEnded)
    return () => {
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover cursor-pointer"
        muted={isMuted}
        controls={isPlaying}
        playsInline
        onClick={handleVideoClick}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <Button
            onClick={handleVideoClick}
            variant="ghost"
            size="icon"
            className="w-14 h-14 bg-white/20 border border-white/30 rounded-full hover:bg-white/30 transition-all"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </Button>
        </div>
      )}

      {isPlaying && (
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <Button
            onClick={handleMuteToggle}
            variant="ghost"
            size="icon"
            className="w-8 h-8 p-0 bg-gray-800/70 text-white hover:bg-gray-700/90"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleFullscreen}
            variant="ghost"
            size="icon"
            className="w-8 h-8 p-0 bg-gray-800/70 text-white hover:bg-gray-700/90"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
