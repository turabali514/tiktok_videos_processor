"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Folder, Video, Heart, TrendingUp, Star, Bookmark, Tag, Users, Zap, Target, Loader2 } from "lucide-react"
import type { Collection, VideoData } from "@/types/collection"
import { Trash2, MoreVertical, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
interface VideoCollectionManagerProps {
  video: VideoData | undefined
  collections: Collection[]
  onAddToCollection: (collectionId: number, videoId: string) => Promise<void>
  onRemoveFromCollection: (collectionId: number, videoId: string) => Promise<void>
  onCreateCollection?: (data: { name: string; description: string; color: string; icon: string }) => Promise<Collection>
  children: React.ReactNode
}

const iconMap = {
  Video,
  Heart,
  TrendingUp,
  Folder,
  Star,
  Bookmark,
  Tag,
  Users,
  Zap,
  Target,
}

export function VideoCollectionManager({
  video,
  collections = [],
  onAddToCollection,
  onRemoveFromCollection,
  onCreateCollection,
  children,
}: VideoCollectionManagerProps): React.ReactElement | null {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedCollections, setSelectedCollections] = React.useState<Record<string, boolean>>({})

  const videoId = video?.id?.toString()

  React.useEffect(() => {
    if (!videoId) return

    const initialSelection: Record<string, boolean> = {}
    collections.forEach((collection) => {
      initialSelection[collection.id] = collection.videoIds?.includes(videoId) || false
    })
    setSelectedCollections(initialSelection)
  }, [collections, videoId])

  const handleSave = async () => {
    if (!videoId) return

    setIsLoading(true)
    try {
      for (const collection of collections) {
        const collectionId = collection.id
        const wasSelected = collection.videoIds?.includes(videoId) || false
        const nowSelected = selectedCollections[collectionId] || false

        if (nowSelected && !wasSelected) {
          await onAddToCollection(collectionId, videoId)
        } else if (!nowSelected && wasSelected) {
          await onRemoveFromCollection(collectionId, videoId)
        }
      }
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to update collections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Optional: Avoid rendering if video or video.id is missing
  if (!video || !videoId) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-gray-900/95 backdrop-blur-xl border border-red-500/20 text-white w-[90vw] max-w-md max-h-[85vh] flex flex-col shadow-2xl shadow-red-500/10">
        <DialogHeader className="pb-4 border-b border-gray-700/50">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            Manage Collections
          </DialogTitle>
          <p className="text-gray-400 text-sm mt-1">
            Select collections for "{video?.title || "this video"}"
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-6 overflow-hidden py-4 h-[calc(100%-120px)]">
          <div className="flex flex-col flex-1 min-h-0">
            <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Select Collections:
            </h4>

            {collections.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                {/* Empty state content */}
              </div>
            ) : (
              <div className="h-[300px] pr-2 [&::-webkit-scrollbar-thumb]:bg-red-600 overflow-y-auto">
                <div className="space-y-3">

                  {collections.map((collection) => {
                    if (!collection?.id) return null;
                    const IconComponent = iconMap[collection?.icon as keyof typeof iconMap] || Folder
                    const isSelected = selectedCollections[collection.id] || false
                    const videoInCollection = collection.videoIds?.includes(videoId) || false
                    return (
                      <div
                        key={collection.id}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
                      >
                        <Checkbox
                          id={collection.id.toString()}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setSelectedCollections((prev) => ({
                              ...prev,
                              [collection.id]: checked as boolean,
                            }))
                          }}
                          className="border-gray-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                        />

                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                          style={{
                            backgroundColor: `${collection.color}20`,
                            border: `1px solid ${collection.color}40`,
                          }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: collection.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={collection.id.toString()}
                            className="font-semibold text-white text-sm cursor-pointer truncate block leading-relaxed"
                          >
                            {collection.name}
                          </label>
                        </div>

                        <Badge
                          variant="outline"
                          className="text-xs bg-gray-700/50 border-gray-600 text-gray-300 font-medium px-2 py-1"
                        >
                          {collection.videoIds?.length || 0}
                        </Badge>
                        {videoInCollection && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveFromCollection(collection.id, videoId)
              setSelectedCollections(prev => ({
                ...prev,
                [collection.id]: false
              }))
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700/50">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
