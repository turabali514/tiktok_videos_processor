"use client"

import { useRef, useState, useEffect } from "react"
import { VideoPlayer } from "./video-player"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Video, Eye, Heart, MessageCircle, Share, Folder } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { VideoChatModal } from "./video-chat-modal"
import { VideoSummaryModal } from "./video-summary-modal"
import { VideoCollectionManager } from "./video-collection-manager"
import type { VideoData, Collection } from "@/types/collection"
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
interface VideoLibraryProps {
  videos: VideoData[]
  isLoading: boolean
  collections: Collection[]
  selectedCollectionId: number | null
  onAddToCollection: (collectionId: number, videoIds: string) => Promise<void>
  onRemoveFromCollection: (collectionId: number, videoIds: string) => Promise<void>
  onCreateCollection: (data: { name: string; color: string; icon: string }) => Promise<Collection>
  onRefetchVideos: () => Promise<void>
  onFetchCollectionVideos?: (collectionId: number) => Promise<VideoData[]> 
  videoStatus?: Record<string, string>;
}

export function EnhancedVideoLibrary({
  videos = [],
  isLoading,
  collections = [],
  selectedCollectionId,
  onAddToCollection,
  onRemoveFromCollection,
  onCreateCollection,
  onRefetchVideos,
  onFetchCollectionVideos,
  videoStatus = {}
}: VideoLibraryProps) {
  const [progress, setProgress] = useState<Record<string, string>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)
  // Only poll if there are videos processing
  const processingVideos = videos.filter(video => {
    const status = videoStatus[video.id] || "";
    return status && !status.includes("Completed") && !status.includes("Failed");
  })

  const getPerformanceLevel = (video: VideoData): "high" | "medium" | "low" => {
    if (!video) return "low"
    const engagementScore = (video.likes || 0) * 0.5 + (video.comments || 0) * 1 + (video.shares || 0) * 2
    if (engagementScore > 10000) return "high"
    if (engagementScore > 3000) return "medium"
    return "low"
  }


  const displayVideos = videos
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId)

  return (
    <ScrollReveal direction="up">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl animate-ping opacity-20" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                {selectedCollection?.name || "All Videos"}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {displayVideos.length} videos •{" "}
                {displayVideos.reduce((acc, video) => acc + (video?.views || 0), 0).toLocaleString()} total views
              </p>
            </div>
          </div>
        </div>

        {/* Video Grid - Using CSS Grid with auto-fit for better responsive control */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayVideos.map((video, index) => {
            if (!video?.id) return null // Skip invalid videos

            const performance = getPerformanceLevel(video)
            const isHovered = hoveredVideo === String(video.id)

            return (
              <div key={video.id} className="w-full">
                <ScrollReveal delay={index * 80} direction="up">
                  <Card
                    className="bg-gray-800/40 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800/60 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 group cursor-pointer relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-red-500/10 w-full"
                    onClick={() => setSelectedVideo(String(video.id))}
                    onMouseEnter={() => setHoveredVideo(String(video.id))}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    <CardContent className="p-0 relative">
                      {/* Video Thumbnail Container */}
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-700 to-gray-800 rounded-t-lg overflow-hidden">
                        <VideoPlayer src={video.thumbnail || ""} />
              
                        {/* Collection Manager Button */}
                        <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <VideoCollectionManager
                            video={video}
                            collections={collections}
                            onAddToCollection={async (collectionId, videoId) => {
                              try {
                                await onAddToCollection(collectionId,videoId)
                              } catch (error) {
                                console.error("Failed to add to collection:", error)
                              }
                            }}
                            onRemoveFromCollection={async (collectionId, videoId) => {
                              try {
                                await onRemoveFromCollection(collectionId, videoId)
                              } catch (error) {
                                console.error("Failed to remove from collection:", error)
                              }
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-9 h-9 p-0 bg-black/60 hover:bg-black/80 text-white border border-white/20 hover:border-white/40 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Folder className="w-4 h-4" />
                            </Button>
                          </VideoCollectionManager>
                        </div>

                        {/* Performance Badge */}
                        <div className="absolute bottom-3 left-3 z-20">
                          <div
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all duration-300 ${
                              performance === "high"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                                : performance === "medium"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/20"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20"
                            }`}
                          >
                            {performance.toUpperCase()}
                          </div>
                        </div>

                        {/* Hover Overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
                        />
                      </div>

                      {/* Video Info */}
                      <div className="p-4 flex-1 flex flex-col min-h-[180px]">
                        <h4 className="font-semibold text-white text-sm line-clamp-2 leading-relaxed mb-3">
                          {video.title || "Untitled Video"}
                        </h4>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                          <div className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors duration-300">
                            <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {(video.views || 0) > 1000000
                                ? `${((video.views || 0) / 1000000).toFixed(1)}M`
                                : `${((video.views || 0) / 1000).toFixed(0)}K`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors duration-300">
                            <Heart className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {(video.likes || 0) > 1000
                                ? `${((video.likes || 0) / 1000).toFixed(0)}K`
                                : video.likes || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors duration-300">
                            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {(video.comments || 0) > 1000
                                ? `${((video.comments || 0) / 1000).toFixed(0)}K`
                                : video.comments || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors duration-300">
                            <Share className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {(video.shares || 0) > 1000
                                ? `${((video.shares || 0) / 1000).toFixed(0)}K`
                                : video.shares || 0}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto grid grid-cols-2 gap-2">
                          <VideoChatModal videoId={video.id} videoTitle={video.title || "Untitled"}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 h-8 px-3 text-xs bg-gradient-to-r from-red-500/15 to-pink-500/15 hover:from-red-500/25 hover:to-pink-500/25 text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-full transition-all duration-300 hover:scale-105 font-medium"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              <span className="truncate">Chat</span>
                            </Button>
                          </VideoChatModal>

                          <VideoSummaryModal video={video}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-8 px-3 text-xs bg-gradient-to-r from-pink-500/15 to-red-500/15 hover:from-pink-500/25 hover:to-red-500/25 text-pink-300 border border-pink-500/30 hover:border-pink-400/50 rounded-full transition-all duration-300 hover:scale-105 font-medium"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                              <span className="truncate">Summary</span>
                            </Button>
                          </VideoSummaryModal>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {displayVideos.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No videos found</h3>
            <p className="text-gray-500">
              {selectedCollection ? `No videos in "${selectedCollection.name}" collection` : "No videos available"}
            </p>
          </div>
        )}
      </div>
    </ScrollReveal>
  )
}
