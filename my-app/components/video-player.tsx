"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Maximize2, Volume2, VolumeX } from "lucide-react"

// Global state for active video player
let activePlayer: HTMLVideoElement | null = null;
const MAX_CONCURRENT_PLAYERS = 1;

interface VideoPlayerProps {
  src: string
  className?: string
  videoId?: string
  priority?: "high" | "medium" | "low"
}

export function VideoPlayer({ src, className, videoId = "", priority = "medium" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [connectionType, setConnectionType] = useState<"slow-2g" | "2g" | "3g" | "4g" | null>(null)

  // Detect connection type
  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      const updateConnectionType = () => {
        setConnectionType(connection.effectiveType)
      }
      updateConnectionType()
      connection.addEventListener('change', updateConnectionType)
      return () => connection.removeEventListener('change', updateConnectionType)
    }
  }, [])

  // Intersection Observer for lazy loading and visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        // Pause when out of viewport
        if (!isIntersecting && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
          manageActivePlayers("remove");
        }
        
        // Load source when visible
        if (isIntersecting && !hasLoaded) {
          setupVideoSource();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 100px 0px" }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [hasLoaded]);

  // Setup video source when needed
  const setupVideoSource = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasLoaded) return;

    try {
      // Set loading attributes based on priority
      video.preload = priority === "high" ? "auto" : "metadata";
      video.setAttribute('fetchpriority', 
        (priority === "high" || connectionType === "4g") ? 'high' : 'low'
      );

      video.src = src;
      setHasLoaded(true);
    } catch (err) {
      console.error(`[VideoPlayer] Error loading source:`, err);
    }
  }, [src, priority, connectionType, hasLoaded]);

  // Manage active players
  const manageActivePlayers = useCallback((action: "add" | "remove") => {
    const video = videoRef.current;
    if (!video || !videoId) return;

    if (action === "add") {
      // Pause existing active player if needed
      if (activePlayer && activePlayer !== video) {
        activePlayer.pause();
      }
      activePlayer = video;
    } else {
      if (activePlayer === video) {
        activePlayer = null;
      }
    }
  }, [videoId]);

  // Toggle play/pause with active player management
  const togglePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        // Only allow playback if we have capacity or it's the active player
        if (activePlayer && activePlayer !== video) {
          return;
        }

        await video.play();
        setIsPlaying(true);
        manageActivePlayers("add");
      } else {
        video.pause();
        setIsPlaying(false);
        manageActivePlayers("remove");
      }
    } catch (err) {
      console.error(`[VideoPlayer] Playback error:`, err);
    }
  }, [manageActivePlayers]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
        manageActivePlayers("remove");
      }
    };
  }, [manageActivePlayers]);

  // Handle mute toggle
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  // Handle fullscreen
  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = containerRef.current || videoRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          const video = videoRef.current;
          if (video) video.style.objectFit = 'contain';
        });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative group ${className}`}
      style={{
        aspectRatio: '3/4',
        width: '100%',
        height: 'auto',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setShowControls(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted={isMuted}
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        onClick={togglePlayPause}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      />

      {/* Play/Pause button */}
      {(!isPlaying || showControls) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <Button
            onClick={togglePlayPause}
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
        <div className="absolute top-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 z-20 flex justify-between items-center">
          <Button
            onClick={handleMuteToggle}
            variant="ghost"
            size="icon"
            className="w-8 h-8 p-0 text-white hover:bg-white/20"
          > 
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

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