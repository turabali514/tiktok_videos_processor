"use client"
import { Trash2, MoreVertical, X, Menu, ChevronLeft, ChevronRight } from "lucide-react"
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
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface CollectionSidebarProps {
  userId: number
  collections: Collection[]
  selectedCollectionId: number | null
  onCollectionSelect: (collectionId: number) => void
  onCreateCollection: (data: CreateCollectionData) => Promise<void>
  onDeleteCollection: (id: number) => Promise<void>
  allVideos: VideoData[]
  isLoading: boolean
  isMobile?: boolean
  onClose?: () => void
  isCollapsed?: boolean
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
  isMobile = false,
  onClose,
  isCollapsed = true,
}: CollectionSidebarProps) {
  const isSmallScreen = useMediaQuery('(max-width: 6px)')
  
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
    return <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
  }

  const handleCollectionClick = (collectionId: number) => {
    onCollectionSelect(collectionId)
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <Card className={cn(
      "bg-gray-900/90 backdrop-blur-sm border border-red-500/30 h-full shadow-xl shadow-red-500/5",
      "w-full sm:w-64 md:w-72", // Responsive width
      "fixed sm:relative z-50", // Fixed on mobile, relative on larger screens
      "transition-all duration-300 ease-in-out", 
      isMobile ? "inset-0" : "",
      isCollapsed && "sm:w-20" // Collapsed width
    )}>
      <CardContent className="p-4 sm:p-2 h-full flex flex-col">
        <div className={cn(
          "p-4 sm:p-6 h-full flex flex-col overflow-y-auto",
          isCollapsed && "sm:p-2"
        )}>
          {/* Header with close button for mobile */}
          <div className={cn(
            "mb-6 flex justify-between items-center",
            isCollapsed && "sm:flex-col sm:gap-4"
          )}>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Folder className="w-5 h-5 text-red-400" />
                  Collections
                </h2>
                <p className="text-gray-400 text-sm mt-1">Organize your videos</p>
              </div>
            ) 
            }
          </div>
        
          {/* Collections List */}
          <div className="flex-1 custom-scrollbar pr-1">
            <ul className="space-y-2 sm:space-y-3">
              {/* All Videos Collection */}
              <li key="all-videos">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-3 sm:p-4 h-auto rounded-lg sm:rounded-xl transition-all duration-300",
                    "hover:scale-[1.02] active:scale-95",
                    selectedCollectionId === allVideosCollection.id
                      ? "bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20"
                      : "bg-gray-800/30 border-gray-700/50 hover:bg-red-500/10 hover:border-red-500/30",
                    "border",
                    isCollapsed && "sm:justify-center sm:p-3"
                  )}
                  onClick={() => handleCollectionClick(allVideosCollection.id)}
                >
                  <div className="flex items-center gap-3 w-full sm:justify-center">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0",
                      isCollapsed && "sm:w-10 sm:h-10"
                    )}>
                      <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-white truncate text-sm sm:text-base">
                          {allVideosCollection.name}
                        </div>
                      </div>
                    )}
                  </div>
                </Button>
              </li>

              {/* User Collections */}
              {collections.map((collection) => (
                <li key={`collection-${collection.id}`}>
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start p-3 sm:p-4 h-auto rounded-lg sm:rounded-xl transition-all duration-300",
                        "hover:scale-[1.02] active:scale-95",
                        selectedCollectionId === collection.id
                          ? "shadow-lg"
                          : "bg-gray-800/30 border-gray-700/50 hover:border-opacity-70",
                        "border",
                        isCollapsed && "sm:justify-center sm:p-3"
                      )}
                      style={{
                        borderColor:
                          selectedCollectionId === collection.id ? `${collection.color}80` : `${collection.color}30`,
                        backgroundColor:
                          selectedCollectionId === collection.id ? `${collection.color}20` : "rgba(31, 41, 55, 0.3)",
                        boxShadow: selectedCollectionId === collection.id ? `0 10px 25px ${collection.color}20` : "none",
                      }}
                      onClick={() => handleCollectionClick(collection.id)}
                    >
                      <div className="flex items-center gap-3 w-full sm:justify-center">
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110",
                            isCollapsed && "sm:w-10 sm:h-10"
                          )}
                          style={{
                            backgroundColor: `${collection.color}20`,
                            border: `1px solid ${collection.color}40`,
                          }}
                        >
                          {getIconComponent(collection.icon as IconName, collection.color)}
                        </div>
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-semibold text-white truncate text-sm sm:text-base">
                              {collection.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </Button>

                    {/* Delete dropdown menu - hidden on small screens */}
                    {!isSmallScreen && !isCollapsed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50"
                          >
                            <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
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
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Create Collection Button */}
        <div className={cn(
          "mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-red-500/30",
          isCollapsed && "sm:pt-3 sm:mt-3"
        )}>
          <CreateCollectionModal userId={userId} onCreateCollection={onCreateCollection}>
            <Button
              variant="outline"
              className={cn(
                "w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 bg-transparent",
                "transition-all duration-300 hover:scale-[1.02] active:scale-95",
                "p-3 sm:p-4 h-auto rounded-lg sm:rounded-xl flex items-center",
                isCollapsed && "sm:justify-center sm:p-3"
              )}
              disabled={isLoading}
            >
              <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              {!isCollapsed && (
                <div className="text-left overflow-hidden">
                  <div className="font-semibold text-sm sm:text-base truncate">New Collection</div>
                </div>
              )}
            </Button>
          </CreateCollectionModal>
        </div>
      </CardContent>
    </Card>
  )
}