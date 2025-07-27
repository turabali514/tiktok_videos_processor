"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { EnhancedVideoImport } from "@/components/enhanced-video-import";
import { EnhancedVideoLibrary } from "@/components/enhanced-video-library";
import { GlobalVideoChat } from "@/components/global-video-chat";
import { CollectionSidebar } from "@/components/collection-sidebar";
import { AnimatedTitle } from "@/components/animated-title";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ParallaxBackground } from "@/components/parallax-background";
import { ScrollProgress } from "@/components/scroll-progress";
import { EnhancedFloatingElements } from "@/components/enhanced-floating-elements";
import { useCollections } from "@/hooks/use-collections";
import type { VideoData, Collection } from "@/types/collection";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DashboardPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(-1);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [collectionVideos, setCollectionVideos] = useState<VideoData[]>([]);
  const [processingUrls, setProcessingUrls] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [videoStatus, setVideoStatus] = useState<Record<string, string>>({});
  const {
    collections,
    isLoading: collectionsLoading,
    createCollection,
    deleteCollection,
    addVideoToCollection,
    removeVideoFromCollection,
    fetchCollectionVideos,
    error: collectionsError
  } = useCollections(userId || 0);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include"
      });
      setVideos([]);
      setSelectedCollectionId(null);
      setUserId(null);
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const cleanTags = (tags: any): string[] => {
    if (!tags) return []
    if (Array.isArray(tags)) {
      return tags.map(t => 
        typeof t === 'string' 
          ? t.replace(/^\[|\]|'|"/g, '').trim() 
          : String(t).replace(/^\[|\]|'|"/g, '').trim()
      ).filter(t => t.length > 0)
    }
    if (typeof tags === 'string') {
      return tags
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(t => t.replace(/^'|'$|^"|"$/g, '').trim())
        .filter(t => t.length > 0)
    }
    return []
  }
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
  const fetchUserVideos = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await fetch(`${BASE_URL}/videos`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });
  
    if (!response.ok) throw new Error("Failed to fetch videos");

    const data = await response.json();
    const transformedVideos = data.map((video: any) => ({
      id: video?.id?.toString() || `temp-${Math.random().toString(36).substr(2, 9)}`,
      title: video?.description || "Untitled Video", 
      views: video?.video_playcount || 0,
      likes: video?.video_diggcount || 0,
      comments: video?.video_commentcount || 0,
      shares: video?.video_sharecount || 0,
      tags: cleanTags(video?.tags),
      uploadDate: video?.video_timestamp || new Date().toLocaleDateString(),
      performance: getPerformanceLevel(
        video?.video_playcount || 0,
        video?.video_diggcount || 0,
        video?.video_commentcount || 0,
        video?.video_sharecount || 0
      ),
      thumbnail: video?.file_path 
        ? `http://localhost:8000${video.file_path.replace(/\\/g, '/')}`
        : "/placeholder.svg",
      
      collectionIds: [], // Will be populated when added to collections
      summary: video?.summary || "",
      transcript: video?.transcript || "",
      clean_url: video?.url || ""
    }));
    
    setVideos(transformedVideos);
    // Always update collectionVideos when fetching all videos
    if (selectedCollectionId === -1 || !selectedCollectionId) {
      setCollectionVideos(transformedVideos);
    }
  } catch (err) {
    console.error("Error fetching videos:", err);
    setError(err instanceof Error ? err.message : "Failed to load videos");
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
  const handleCollectionSelection = async () => {
    if (selectedCollectionId === -1) {
      // For "All Videos", use the main videos list
      setCollectionVideos(videos);
    } else if (selectedCollectionId) {
      // For specific collections, fetch their videos
      try {
        setIsLoading(true);
        const videos = await fetchCollectionVideos(selectedCollectionId);
        setCollectionVideos(videos);
      } catch (error) {
        console.error("Error fetching collection videos:", error);
        setCollectionVideos([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  handleCollectionSelection();
}, [selectedCollectionId, videos]);

  useEffect(() => {
  const fetchProgress = async () => {
    try {
      if (processingUrls.length === 0) return;

      const res = await fetch(`${BASE_URL}/progress`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: processingUrls })
      });

      if (!res.ok) throw new Error("Failed to fetch progress");
      
      const data = await res.json();

      // Handle error case
      if (data.error) {
        console.error("Progress check error:", data.error);
        return;
      }

      // Stop polling when backend indicates all jobs are complete
      if (data.status === "completed") {
        await fetchUserVideos(); // Refresh the video list
        setProcessingUrls([]);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      // Continue polling if status is "processing"
    } catch (err) {
      console.error("Error fetching progress:", err);
      // Optional: implement retry logic here if needed
    }
  };

  if (processingUrls.length > 0) {
    // Initial fetch
    fetchProgress();
    
    // Set up interval
    const interval = setInterval(fetchProgress, 3000);
    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  } fetchUserVideos()
}, [processingUrls]);;
 useEffect(() => {
  const checkAuth = async () => {
    try {
      await new Promise(res => setTimeout(res, 300));
      
      const response = await fetch(`${BASE_URL}/check-auth`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user_id);
        // Set default collection to "All Videos" (-1)
        setSelectedCollectionId(-1);
        await fetchUserVideos();
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  checkAuth();
}, [router]);


  const handleVideoImport = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setProcessingUrls(prev => [...prev, url]);
    
    try {
      const response = await fetch(`${BASE_URL}/import_video`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Failed to import video");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
    } catch (err) {
      console.error("Error importing video:", err);
      setError(err instanceof Error ? err.message : "Failed to import video");
      setProcessingUrls(prev => prev.filter(u => u !== url));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefetchVideos = async () => {
    await fetchUserVideos();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <ScrollProgress />
      <ParallaxBackground />
      <DashboardHeader onLogout={handleLogout} />
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-80 flex-shrink-0 p-4 border-r border-gray-800 overflow-y-auto" style={{ height: "calc(100vh - 64px)" }}>
          <CollectionSidebar
            userId={userId || 0}
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onCollectionSelect={(id: number) => setSelectedCollectionId(id)}
            onCreateCollection={createCollection}
            onDeleteCollection={deleteCollection}
            allVideos={videos}
            isLoading={collectionsLoading}
          />
        </div>
        
        <main className="relative z-10 flex" style={{ minHeight: "calc(100vh - 64px)" }}>
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 py-8">
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  {error}
                </div>
              )}
              
              <ScrollReveal direction="fade" className="text-center mb-16">
                <AnimatedTitle />
                <ScrollReveal delay={500} direction="up">
                  <p className="text-gray-400 text-lg max-w-4xl mx-auto leading-relaxed">
                    Import TikTok videos and unlock powerful{" "}
                    <span className="text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text font-semibold">
                      AI-driven analytics
                    </span>{" "}
                    and insights with{" "}
                    <span className="text-transparent bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text font-semibold">
                      cutting-edge technology
                    </span>
                  </p>
                </ScrollReveal>
              </ScrollReveal>

              <div id="import-section">
                <EnhancedVideoImport onImport={handleVideoImport} />
              </div>

              {videos.length > 0 && <GlobalVideoChat videos={videos} />}
  
              <EnhancedVideoLibrary
                videos={selectedCollectionId === -1 ? videos : collectionVideos}
                isLoading={isLoading}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onAddToCollection={async (collectionId, videoId) => {
                  try {
                    await addVideoToCollection(collectionId, videoId);
                    if (selectedCollectionId === collectionId) {
                      const updatedVideos = await fetchCollectionVideos(collectionId);
                      setCollectionVideos(updatedVideos);
                    }
                    await fetchUserVideos();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to add to collection");
                  }
                }}
                onRemoveFromCollection={async (collectionId, videoId) => {
                  try {
                    await removeVideoFromCollection(collectionId, videoId);
                    if (selectedCollectionId === collectionId) {
                      const updatedVideos = await fetchCollectionVideos(collectionId);
                      setCollectionVideos(updatedVideos);
                    }
                    await fetchUserVideos();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to remove from collection");
                  }
                }}
                onCreateCollection={async (data) => {
                  try {
                    if (!userId) throw new Error("User ID is required");
                    return await createCollection({
                      user_id: userId,
                      name: data.name,
                      color: data.color,
                      icon: data.icon,
                    });
                  } catch (err) {
                    console.error("Failed to create collection:", err);
                    throw err;
                  }
                }}
                onRefetchVideos={handleRefetchVideos}
                videoStatus={videoStatus}
              />
            </div>
          </div>
        </main>
      </div>
      <EnhancedFloatingElements
        onImportClick={() => {
          const importSection = document.getElementById("import-section");
          if (importSection) {
            importSection.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />
    </div>
  );
}