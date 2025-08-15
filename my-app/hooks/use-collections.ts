"use client"

import type { Collection, CreateCollectionData, VideoData } from "@/types/collection"
import { useState, useEffect } from 'react'
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export const useCollections = (userId: number | null) => {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Performance level calculator
  const getPerformanceLevel = (
    views: number, 
    likes: number, 
    comments: number, 
    shares: number
  ): "high" | "medium" | "low" => {
    const engagementScore = (likes * 0.5) + (comments * 1) + (shares * 2)
    if (engagementScore > 10000) return "high"
    if (engagementScore > 3000) return "medium"
    return "low"
  }

  const fetchCollections = async (id: number|null) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${BASE_URL}/collections/${id}`, {
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Failed to fetch collections')
      
      const data = await response.json()
      const transformedCollections = data.collections.map((collection: any) => ({
        id: collection.id,
        user_id: collection.user_id,
        name: collection.name,
        color: collection.color || '#ef4444',
        icon: collection.icon || 'Folder',
        created_at: collection.created_at,
        videoIds: collection.video_ids || collection.videos?.map((v: any) => v.id.toString()) || []
      }))
      
      setCollections(transformedCollections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections')
    } finally {
      setIsLoading(false)
    }
  }
  const cleanTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) {
      return tags.map(t => 
        typeof t === 'string'
          ? t.replace(/^\[|\]|'|"/g, '').trim()
          : String(t).replace(/^\[|\]|'|"/g, '').trim()
      ).filter(t => t.length > 0);
    }
    if (typeof tags === 'string') {
      return tags
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(t => t.replace(/^'|'$|^"|"$/g, '').trim())
        .filter(t => t.length > 0);
    }
    return [];
  };
  const fetchCollectionVideos = async (collectionId: number): Promise<VideoData[]> => {
  setIsLoading(true);
  try {
    const response = await fetch(`${BASE_URL}/collections/${collectionId}/videos`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to fetch collection videos');
    
    const data = await response.json();
    
    // Check if response has the expected structure
    if (!data.success || !Array.isArray(data.videos)) {
      throw new Error('Invalid response format');
    }

    return data.videos.map((video: any) => {
      // Ensure we have a valid video ID
      const videoId = video?.id || video?.id;
      if (!videoId) {
        console.warn('Skipping video with missing ID:', video);
        return null;
      }

      return {
        id: videoId.toString(),
        title: video.video_description || "Untitled Video",
        views: video.video_playcount || 0,
        likes: video.video_diggcount || 0,
        comments: video.video_commentcount || 0,
        shares: video.video_sharecount || 0,
        tags: cleanTags(video?.tags),
        uploadDate: video.video_timestamp || new Date().toLocaleDateString(),
        performance: getPerformanceLevel(
          video.video_playcount || 0,
          video.video_diggcount || 0,
          video.video_commentcount || 0,
          video.video_sharecount || 0
        ),
        thumbnail: video.file_path 
          ? `${BASE_URL}/${video.file_path.replace(/\\/g, '/')}`
          : "/placeholder.svg",
        summary: video.summary || "",
        niche: video?.niche || "Uncategorized",
        author_name:video?.author_name || "",
        author_username:video?.author_username || "",
        transcript: video.transcript || "",
        clean_url: video.url,
        collectionIds: [collectionId.toString()]
      };
    }).filter(Boolean) as VideoData[]; // Remove null entries and assert type
  } catch (err) {
    console.error('Error fetching collection videos:', err);
    setError(err instanceof Error ? err.message : 'Failed to fetch collection videos');
    return [];
  } finally {
    setIsLoading(false);
  }
};

  const createCollection = async (collectionData: CreateCollectionData) => {
    try {
      const response = await fetch(`${BASE_URL}/collections/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(collectionData),
      })
  
      if (!response.ok) throw new Error('Failed to create collection')
      
      const newCollection = await response.json()
      
      await fetchCollections(userId)
      return newCollection.collection_id
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create collection')
    }
  }

    // ... rest of the hook remains the same ...
    const deleteCollection = async (collectionId: number) => {
      try {
        const response = await fetch(
          `${BASE_URL}/collections/delete/${userId}/${collectionId}`, {
            method: 'DELETE',
            credentials: 'include'
          }
        );
        
        if (!response.ok) throw new Error('Failed to delete collection');
        
        setCollections(prev => prev.filter(c => c.id !== collectionId));
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to delete collection');
      }
    };
    

    const addVideoToCollection = async (collectionId: number, videoId: string) => {
      try {

        const response = await fetch(`${BASE_URL}/collections/add_video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            collection_id: collectionId, 
            video_id: videoId 
          })
          
        });
        
        if (!response.ok) throw new Error('Failed to add video to collection');
        
        // Optimistic update
        setCollections(prev => prev.map(c => 
          c.id === collectionId 
            ? { ...c, videoIds: [...c.videoIds, videoId] } 
            : c
        ));
      } catch (err) {
    console.error('Failed to add video to collection:', err)
    // Revert optimistic update
    setCollections(prev => prev.map(c => 
      c.id === collectionId 
        ? { ...c, videoIds: c.videoIds.filter(id => id !== videoId) } 
        : c
    ))
    throw err instanceof Error ? err : new Error('Failed to add video to collection')
  }
    };

    const removeVideoFromCollection = async (collectionId: number, videoId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/collections/remove_video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            collection_id: collectionId, 
            video_id: videoId 
          })
        });
        
        if (!response.ok) throw new Error('Failed to remove video from collection');
        
        // Optimistic update
        setCollections(prev => prev.map(c => 
          c.id === collectionId 
            ? { ...c, videoIds: c.videoIds.filter(id => id !== videoId) } 
            : c
        ));
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to remove video from collection');
      }
    };

     useEffect(() => {
       if (userId && userId > 0) {
    fetchCollections(userId);
  }
    fetchCollections(userId)
  }, [userId])

      return {
    collections,
    isLoading,
    error,
    createCollection,
    deleteCollection,
    addVideoToCollection,
    removeVideoFromCollection,
    fetchCollectionVideos,
    refetchCollections: fetchCollections
  };
};