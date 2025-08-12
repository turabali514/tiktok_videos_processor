"use client"

import { useRef, useState, useEffect } from "react"
import { VideoPlayer } from "./video-player"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VideoCollectionManager } from "./video-collection-manager"
import { FileText, Video, Eye, Heart, MessageCircle, Share, Folder } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { VideoChatModal } from "./video-chat-modal"
import { VideoSummaryModal } from "./video-summary-modal"
import useDynamicColumns from "@/hooks/use-column-count"
import type { VideoData, Collection } from "@/types/collection"

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
  videoStatus?: Record<string, string>
}

export function EnhancedVideoLibrary({
  videos = [],
  isLoading,
  collections = [],
  selectedCollectionId,
  onAddToCollection,
  onRemoveFromCollection,
  videoStatus = {}
}: VideoLibraryProps) {
  const [progress] = useState<Record<string, string>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)
  const { containerRef, columns } = useDynamicColumns(350)
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: '1.5rem',
    width: '100%'
  };
  // Only poll if there are videos processing
  const processingVideos = videos.filter(video => {
    const status = videoStatus[video.id] || "";
    return status && !status.includes("Completed") && !status.includes("Failed");
  })
  const ITEMS_PER_BATCH = 10
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH)

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_BATCH, videos.length))
  }

  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH)
  }, [videos])

  const displayedVideos = videos.slice(0, visibleCount)
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId)

  const getPerformanceLevel = (video: VideoData): "high" | "medium" | "low" => {
    const engagementScore =
      (video.likes || 0) * 0.5 +
      (video.comments || 0) * 1 +
      (video.shares || 0) * 2
    if (engagementScore > 10000) return "high"
    if (engagementScore > 3000) return "medium"
    return "low"
  }
  const NICHE_COLOR_CLASSES = [
  "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/20",
  "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20",
  "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-lg shadow-orange-500/20",
  "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-lg shadow-pink-500/20",
  "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-lg shadow-yellow-500/20",
  "bg-green-500/20 text-green-300 border border-green-500/40 shadow-lg shadow-green-500/20",
  "bg-red-500/20 text-red-300 border border-red-500/40 shadow-lg shadow-red-500/20",
  "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-500/20"
];
function getRandomColorForNiche(niche: string) {
  if (!niche) return NICHE_COLOR_CLASSES[0];
  let hash = 0;
  for (let i = 0; i < niche.length; i++) {
    hash = niche.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NICHE_COLOR_CLASSES.length;
  return NICHE_COLOR_CLASSES[index];
}
  return (
    <ScrollReveal direction="up">
      <div ref={containerRef} className="w-full px-4" style={{ minHeight: "100vh" }}>
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
                {videos.length} videos -{" "}
                {videos.reduce((acc, video) => acc + (video?.views || 0), 0).toLocaleString()} total views
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
            gap: "1.5rem"
          }}
        >
          {displayedVideos.map((video, index) => {
            if (!video?.id) return null
            const performance = getPerformanceLevel(video)
            const isHovered = hoveredVideo === String(video.id)

            return (
              <div key={video.id} className="w-full">
                <ScrollReveal delay={index * 80} direction="up">
                  <Card
                    className="bg-gray-800/40 hover:bg-gray-800/60 border-gray-700/50 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 group cursor-pointer relative overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-red-500/10 flex flex-col"
                    onClick={() => setSelectedVideo(String(video.id))}
                    onMouseEnter={() => setHoveredVideo(String(video.id))}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-700 to-gray-800 rounded-t-lg overflow-hidden w-full min-h-[180px]">
                        <VideoPlayer src={video.thumbnail || ""} className="absolute inset-0 w-full h-full" />

                        <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <VideoCollectionManager
                            video={video}
                            collections={collections}
                            onAddToCollection={onAddToCollection}
                            onRemoveFromCollection={onRemoveFromCollection}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-9 h-9 p-0 bg-black/60 text-white border border-white/20 hover:border-white/40 rounded-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Folder className="w-4 h-4" />
                            </Button>
                          </VideoCollectionManager>
                        </div>
                        {/* Performance + Niche Badges */}
                        <div className="absolute bottom-3 left-3 z-20 flex gap-2">
                          {/* Performance */}
                          <div
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              performance === "high"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : performance === "medium"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {performance.toUpperCase()}
                          </div>

                          {/* Niche */}
                          <div
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-all duration-300 ${
                            getRandomColorForNiche(video.niche || "")
                          }`}
                        >
                          {video.niche || "Uncategorized"}
                        </div>
                        </div>

                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                            isHovered ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>

                      <div className="p-4 flex-1 flex flex-col min-h-[180px]">
                        <h4 className="font-semibold text-white text-sm line-clamp-2 leading-relaxed mb-3">
                          {video.title || "Untitled Video"}
                        </h4>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{(video.views || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{(video.likes || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{(video.comments || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Share className="w-3.5 h-3.5" />
                            <span>{(video.shares || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-2">
                          <VideoChatModal videoId={video.id} videoTitle={video.title || "Untitled"}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 px-3 text-xs text-red-300"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              Chat
                            </Button>
                          </VideoChatModal>

                          <VideoSummaryModal video={video}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs text-pink-300"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              Summary
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

        {/* Load More Button */}
        {visibleCount < videos.length && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMore}
              className="px-6 py-3 bg-pink-600 text-white hover:bg-pink-700 rounded-md"
            >
              Load More Videos
            </Button>
          </div>
        )}

        {/* No videos fallback */}
        {videos.length === 0 && !isLoading && (
          <div className="text-center py-16 text-gray-400">No videos available.</div>
        )}
      </div>
    </ScrollReveal>
  )
}
