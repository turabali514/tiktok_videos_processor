export interface Collection {
  id: number
  name: string
  description?: string
  color: string
  icon: string
  userId: number
  createdAt: string 
  videoIds: string[]
}

export interface CollectionWithVideos extends Collection {
  videos: VideoData[]
  videoCount: number
}

export interface VideoData {
  id: number
  title: string
  thumbnail: string
  views: number
  likes: number
  comments: number
  shares: number
  duration: string
  uploadDate: string
  performance: "high" | "medium" | "low"
  collectionIds?: string[]
  clean_url: string
  summary?: string | null
  transcript?: string | null
  tags?: string[] | null
}

export interface CreateCollectionData {
  user_id: number
  name: string
  color: string
  icon: string
}
