"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Play, Eye, Heart, MessageCircle, Share, MoreHorizontal, TrendingUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollReveal } from "./scroll-reveal"

interface VideoData {
  id: string
  title: string
  thumbnail: string
  views: number
  likes: number
  comments: number
  shares: number
  duration: string
  uploadDate: string
  performance: "high" | "medium" | "low"
}

interface VideoLibraryProps {
  videos: VideoData[]
  isLoading: boolean
}

export function VideoLibrary({ videos, isLoading }: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  // Sample video data for demonstration
  const sampleVideos: VideoData[] = [
    {
      id: "1",
      title: "Epic Dance Challenge Goes Viral! 🔥",
      thumbnail: "/placeholder.svg?height=400&width=300&text=Dance+Challenge",
      views: 2500000,
      likes: 180000,
      comments: 12500,
      shares: 8900,
      duration: "0:15",
      uploadDate: "2024-01-15",
      performance: "high",
    },
    {
      id: "2",
      title: "Cooking Hack That Will Blow Your Mind",
      thumbnail: "/placeholder.svg?height=400&width=300&text=Cooking+Hack",
      views: 1200000,
      likes: 95000,
      comments: 6800,
      shares: 4200,
      duration: "0:30",
      uploadDate: "2024-01-14",
      performance: "high",
    },
    {
      id: "3",
      title: "Pet Reaction to New Toy is Priceless",
      thumbnail: "/placeholder.svg?height=400&width=300&text=Pet+Video",
      views: 850000,
      likes: 67000,
      comments: 4200,
      shares: 2800,
      duration: "0:22",
      uploadDate: "2024-01-13",
      performance: "medium",
    },
    {
      id: "4",
      title: "DIY Room Makeover on a Budget",
      thumbnail: "/placeholder.svg?height=400&width=300&text=DIY+Room",
      views: 650000,
      likes: 45000,
      comments: 3100,
      shares: 1900,
      duration: "0:45",
      uploadDate: "2024-01-12",
      performance: "medium",
    },
    {
      id: "5",
      title: "Street Art Time-lapse Creation",
      thumbnail: "/placeholder.svg?height=400&width=300&text=Street+Art",
      views: 420000,
      likes: 32000,
      comments: 1800,
      shares: 1200,
      duration: "0:28",
      uploadDate: "2024-01-11",
      performance: "medium",
    },
    {
      id: "6",
      title: "Funny Cat Compilation #shorts",
      thumbnail: "/placeholder.svg?height=400&width=300&text=Cat+Video",
      views: 180000,
      likes: 15000,
      comments: 890,
      shares: 450,
      duration: "0:18",
      uploadDate: "2024-01-10",
      performance: "low",
    },
  ]

  // Use sample videos if no real videos exist and not loading
  const displayVideos = videos.length > 0 ? videos : isLoading ? [] : sampleVideos

  if (isLoading) {
    return (
      <ScrollReveal direction="up">
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Your Video Library
                </h3>
                <p className="text-gray-400 mb-4">
                  Your video collection awaits - import your first TikTok video above!
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                  Waiting for your first video...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    )
  }

  if (displayVideos.length === 0) {
    return (
      <ScrollReveal direction="up">
        <Card className="bg-gray-800/30 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Ready to Unlock Insights?
                </h3>
                <p className="text-gray-400">
                  Import your first TikTok video above to unlock powerful analytics, AI insights, and comprehensive
                  performance metrics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    )
  }

  return (
    <ScrollReveal direction="up">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Your Video Library
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayVideos.map((video, index) => (
            <ScrollReveal key={video.id} delay={index * 100} direction="up">
              <Card
                key={video.id}
                className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-[1.02] group cursor-pointer"
                onClick={() => setSelectedVideo(video.id)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-[9/16] bg-gray-700 rounded-t-lg overflow-hidden">
                    <img
                      src={video.thumbnail || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem className="text-gray-300 hover:text-white">View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:text-white">
                            Download Report
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <h4 className="font-medium text-white line-clamp-2 text-sm">{video.title}</h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {video.likes.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {video.comments.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share className="w-3 h-3" />
                        {video.shares.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{video.uploadDate}</span>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          video.performance === "high"
                            ? "bg-green-500/20 text-green-400"
                            : video.performance === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {video.performance}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </ScrollReveal>
  )
}
