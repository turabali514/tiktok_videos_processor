"use client"
import { Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  FolderPlus,
  Video,
  Folder,
  Heart,
  TrendingUp,
  Star,
  Bookmark,
  Tag,
  Users,
  Zap,
  Target,
  PlayCircle,
} from "lucide-react"
import { CreateCollectionModal } from "./create-collection-modal"
import type { Collection, VideoData, CreateCollectionData } from "@/types/collection"

interface CollectionSidebarProps {
  userId: number
  collections: Collection[]
  selectedCollectionId: number | null
  onCollectionSelect: (collectionId: number) => void
  onCreateCollection: (data: CreateCollectionData) => Promise<void>
  onDeleteCollection: (id: number) => Promise<void>
  allVideos: VideoData[]
  isLoading: boolean
}

type IconName = "Folder" | "Video" | "Heart" | "TrendingUp" | "Star" | "Bookmark" | "Tag" | "Users" | "Zap" | "Target"

export function CollectionSidebar({
  userId,
  collections = [],
  selectedCollectionId,
  onCollectionSelect,
  onCreateCollection,
  onDeleteCollection,
  allVideos = [],
  isLoading,
}: CollectionSidebarProps) {
  // Default "All Videos" collection (frontend-only)
  const allVideosCollection = {
    id: -1,
    name: "All Videos",
    color: "#ef4444", // Default red color
    icon: "Video" as IconName,
    user_id: userId,
    created_at: new Date().toISOString(),
    videoIds: allVideos.map((v) => v.id),
  }

  const getIconComponent = (iconName: IconName, color?: string) => {
    const iconMap = {
      Video,
      Folder,
      Heart,
      TrendingUp,
      Star,
      Bookmark,
      Tag,
      Users,
      Zap,
      Target,
    }

    const IconComponent = iconMap[iconName] || Folder
    return <IconComponent className="w-5 h-5" style={{ color }} />
  }

  return (
    <Card className="bg-gray-900/90 backdrop-blur-sm border border-red-500/30 h-full shadow-xl shadow-red-500/5 w-72"> {/* Increased width */}
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Folder className="w-5 h-5 text-red-400" />
            Collections
          </h2>
          <p className="text-gray-400 text-sm mt-1">Organize your videos</p>
        </div>
          
          
      
        {/* Collections List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ul className="space-y-3">
            {/* All Videos Collection */}
            <li key="all-videos">
              <Button
                variant="ghost"
                className={`w-full justify-start p-4 h-auto rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                  selectedCollectionId === allVideosCollection.id
                    ? "bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20"
                    : "bg-gray-800/30 border-gray-700/50 hover:bg-red-500/10 hover:border-red-500/30"
                } border`}
                onClick={() => onCollectionSelect(allVideosCollection.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <PlayCircle className="w-6 h-6 text-red-400" /> {/* Larger icon */}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-white truncate">{allVideosCollection.name}</div>
                  </div>
                </div>
              </Button>
            </li>

            {/* User Collections */}
            
          
            {collections.map((collection) => (

              <li key={`collection-${collection.id}`}>
    <div className="relative group">
      <Button
        variant="ghost"
        className={`w-full justify-start p-4 h-auto rounded-xl transition-all duration-300 hover:scale-[1.02] ${
          selectedCollectionId === collection.id
            ? "shadow-lg"
            : "bg-gray-800/30 border-gray-700/50 hover:border-opacity-70"
        } border`}
        style={{
          borderColor:
            selectedCollectionId === collection.id ? `${collection.color}80` : `${collection.color}30`,
          backgroundColor:
            selectedCollectionId === collection.id ? `${collection.color}20` : "rgba(31, 41, 55, 0.3)",
          boxShadow: selectedCollectionId === collection.id ? `0 10px 25px ${collection.color}20` : "none",
        }}
        onClick={() => onCollectionSelect(collection.id)}
      >
        <div className="flex items-center gap-3 w-full">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110"
            style={{
              backgroundColor: `${collection.color}20`,
              border: `1px solid ${collection.color}40`,
            }}
          >
            {getIconComponent(collection.icon as IconName, collection.color)}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-semibold text-white truncate">{collection.name}</div>
          </div>
        </div>
      </Button>

      {/* Delete dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-gray-800 border border-gray-700">
          <DropdownMenuItem
            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteCollection(collection.id)
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Collection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </li>
))}
          </ul>
        </div>

        {/* Create Collection Button */}
        <div className="mt-6 pt-6 border-t border-red-500/30">
          <CreateCollectionModal userId={userId} onCreateCollection={onCreateCollection}>
            <Button
              variant="outline"
              className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 bg-transparent transition-all duration-300 hover:scale-[1.02] p-4 h-auto rounded-xl"
              disabled={isLoading}
            >
              <FolderPlus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">New Collection</div>
              </div>
            </Button>
          </CreateCollectionModal>
        </div>
      </CardContent>
    </Card>
  )
}