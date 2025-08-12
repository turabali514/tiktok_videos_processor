"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { EnhancedVideoImport } from "@/components/enhanced-video-import";
import { EnhancedVideoLibrary } from "@/components/enhanced-video-library";
import { GlobalVideoChat } from "@/components/global-video-chat";
import { CollectionSidebar } from "@/components/collection-sidebar";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ParallaxBackground } from "@/components/parallax-background";
import { ScrollProgress } from "@/components/scroll-progress";
import { Button } from "@/components/ui/button"; 
import { cn } from "@/lib/utils"
import { useCollections } from "@/hooks/use-collections";
import type { VideoData} from "@/types/collection";
import { Menu, X, Eye, EyeOff, Activity } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type VideoJob = {
  job_id: string;
  url: string;
  status: 'Queued' | 'Downloading' | 'Transcribing' | 'Analyzing' | 'Saving' | 'Completed' | 'Failed';
  progress: number;
  message: string;
  timestamp: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(-1);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [collectionVideos, setCollectionVideos] = useState<VideoData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [showJobProgress, setShowJobProgress] = useState(true);
  const jobsRef = useRef<VideoJob[]>([]);
  
  const {
    collections,
    isLoading: collectionsLoading,
    createCollection,
    deleteCollection,
    addVideoToCollection,
    removeVideoFromCollection,
    fetchCollectionVideos,
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

  const getPerformanceLevel = (
    views: number, 
    likes: number, 
    comments: number, 
    shares: number
  ): "high" | "medium" | "low" => {
    const engagementScore = (likes * 0.5) + (comments * 1) + (shares * 2);
    if (engagementScore > 10000) return "high";
    if (engagementScore > 3000) return "medium";
    return "low";
  };

  const fetchUserVideos =useCallback( async () => {
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
      console.log(data)
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
          ? `${BASE_URL}${video.file_path.replace(/\\/g, '/')}`
          : "/placeholder.svg",
        collectionIds: [],
        niche: video?.niche || "Uncategorized",
        summary: video?.summary || "",
        transcript: video?.transcript || "",
        clean_url: video?.url || ""
      }));
      console.log(transformedVideos)
      setVideos(transformedVideos);
      if (selectedCollectionId === -1 || !selectedCollectionId) {
        setCollectionVideos(transformedVideos);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setIsLoading(false);
    }
  },[selectedCollectionId])

  useEffect(() => {
    const handleCollectionSelection = async () => {
      if (selectedCollectionId === -1) {
        setCollectionVideos(videos);
      } else if (selectedCollectionId) {
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
  let cancelled = false;
  const run = async () => {
    if (cancelled) return;
    try {
      const now = Date.now();
      const currentJobs = [...jobsRef.current];
      // Poll only active (non-final) jobs
      const jobsToPoll = currentJobs.filter(
        job => job.status !== 'Completed' && job.status !== 'Failed'
      );
      let updatedJobs = currentJobs;
      if (jobsToPoll.length > 0) {
        const updates = await Promise.all(
          jobsToPoll.map(async job => {
            try {
              const res = await fetch(`${BASE_URL}/progress`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_id: job.job_id }),
              });
              const data = await res.json();
              console.log("response from backend:", data);
              if (!res.ok) {
                return { job_id: job.job_id, error: true };
              }
              if (!data.job_id) data.job_id = job.job_id; // safety
              return data;
            } catch (err) {
              return { job_id: job.job_id, error: true };
            }
          })
        );
        updatedJobs = currentJobs.map(job => {
          const update = updates.find(u => u?.job_id === job.job_id);
          console.log("update job",update)
          if (!update || update.error) return job;
          console.log("Job progress from backend is:",job.progress)
          const newProgress = Math.max(job.progress, update.progress || 0);
          console.log("new Progress",newProgress)
          return {
            ...job,
            status: update.status || job.status,
            progress: newProgress,
            message: update.message || job.message,
            timestamp: now,
          };
        });
        // Refresh if any just completed
        if (updates.some(u => u?.status === 'Completed')) {
          await fetchUserVideos();
        }
      }
      // Prune stale completed/failed jobs (keep active ones always)
      const filteredJobs = updatedJobs.filter(job =>
        job.status === 'Completed'
          ? now - job.timestamp < 10000
          : job.status === 'Failed'
          ? now - job.timestamp < 30000
          : true
      );
      jobsRef.current = filteredJobs;
      setActiveJobs(filteredJobs);
      console.log("Progress updated:", filteredJobs);
    } catch (err) {
      console.error("Polling error:", err);
    } finally {
      if (!cancelled) {
        setTimeout(run, 1000);
      }
    }
  };
  run();
  return () => {
    cancelled = true;
  };
}, [fetchUserVideos]);

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
      const newJob = {
        job_id: data.job_id,
        url: data.clean_url,
        status: data.status,
        progress: data.progress,
        message: data.message || "Starting processing",
        timestamp: Date.now()
      };
      jobsRef.current = [...jobsRef.current, newJob];
      setActiveJobs(prev => [...prev, newJob]);
    } catch (err) {
      console.error("Error importing video:", err);
      setError(err instanceof Error ? err.message : "Failed to import video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefetchVideos = async () => {
    await fetchUserVideos();
  };

  const JobProgressToggle = () => (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "fixed bottom-4 left-4 z-50 transition-all duration-300",
        "bg-gray-800/90 backdrop-blur-sm border border-gray-700/50",
        "text-gray-300 hover:text-white hover:bg-gray-700/80",
        "shadow-lg hover:shadow-xl",
        "group flex items-center gap-2 px-3 py-2 h-auto",
        activeJobs.length === 0 && "opacity-50 pointer-events-none"
      )}
      onClick={() => setShowJobProgress(!showJobProgress)}
      disabled={activeJobs.length === 0}
    >
      <div className="flex items-center gap-2">
        <Activity className={cn(
          "w-4 h-4 transition-all duration-300",
          activeJobs.some(job => job.status !== 'Completed' && job.status !== 'Failed') && "animate-pulse text-blue-400"
        )} />
        {showJobProgress ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {showJobProgress ? 'Hide' : 'Show'} Progress
        </span>
        {activeJobs.length > 0 && (
          <div className={cn(
            "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
            "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
            "animate-pulse"
          )}>
            {activeJobs.length}
          </div>
        )}
      </div>
    </Button>
  );

  const JobProgressIndicator = () => {
    if (!showJobProgress || activeJobs.length === 0) return null;
    
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-h-[50vh] overflow-y-auto">
        {activeJobs.map(job => (
          <div 
            key={job.job_id}
            className={cn(
              "bg-gray-800/90 backdrop-blur-sm border rounded-lg p-4 w-64 shadow-lg transition-all",
              "animate-in slide-in-from-right duration-300",
              job.status === 'Failed' ? 'border-red-500/30' : 
              job.status === 'Completed' ? 'border-green-500/30' : 
              'border-gray-700'
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white truncate">
                {job.url.split('/').pop() || 'New video'}
              </span>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                job.status === 'Failed' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              )}>
                {job.status}
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-500 ease-out",
                  job.status === 'Failed' ? 'bg-red-500' :
                  job.status === 'Completed' ? 'bg-green-500' :
                  'bg-gradient-to-r from-blue-400 to-purple-500'
                )}
                style={{ 
                  width: `${job.progress}%`,
                  transitionProperty: 'width',
                  transitionDuration: '300ms'
                }}
              />
            </div>
            
            <p className="text-xs text-gray-400 truncate" title={job.message}>
              {job.status === 'Completed' ? '✓ ' : ''}
              {job.message || "Processing..."}
            </p>
            
            {/* Add progress percentage text */}
            <p className="text-xs text-right mt-1 text-gray-500">
              {job.progress}% complete
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <ScrollProgress />
      <ParallaxBackground />
      <DashboardHeader onLogout={handleLogout} />
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-20 left-4 z-50 sm:show",
          "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50",
          "text-gray-300 hover:text-white hover:bg-gray-700/80",
          "transition-all duration-300"
        )}
        onClick={() => {
          setIsSidebarOpen(!isSidebarOpen);
          setIsSidebarCollapsed(prev => !prev);
        }}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      <div className="flex h-[calc(100vh-64px)]">
        <div className={cn(
          "flex-shrink-0 border-r border-gray-800 overflow-y-auto transition-all duration-300 ease-in-out",
          "fixed sm:relative z-40 bg-gray-900/90 backdrop-blur-sm",
          "h-[calc(100vh-64px)]",
          isSidebarOpen ? "left-0 w-64" : "-left-full w-0",
          "sm:left-0",
          !isSidebarCollapsed && "sm:w-64"
        )}>
          <CollectionSidebar
            userId={userId || 0}
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onCollectionSelect={(id: number) => setSelectedCollectionId(id)}
            onCreateCollection={createCollection}
            onDeleteCollection={deleteCollection}
            allVideos={videos}
            isLoading={collectionsLoading}
            isMobile={!isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
        
        <main className={cn(
          "relative z-10 flex-1 overflow-auto",
          "transition-all duration-300 ease-in-out",
          isSidebarOpen ? "ml-0" : "ml-0",
          isSidebarCollapsed ? "sm:ml-16" : "sm:ml-16"
        )} style={{ minHeight: "calc(100vh - 64px)" }}>
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
              </div>
            )}
            
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-white mb-2">TikTok Insights</h1>
              <p className="text-gray-400 text-lg">Video Analytics Platform</p>
            </div>

            <div className="max-w-3xl mx-auto">
              <ScrollReveal direction="fade" className="text-center mb-12">
                <p className="text-gray-400 text-lg leading-relaxed">
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

              <div id="import-section" className="mb-12">
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
                    setError(err instanceof Error ? err.message : "Collection Already exists");
                    throw err;
                  }
                }}
                onRefetchVideos={handleRefetchVideos}
              />
            </div>
          </div>
        </main>
      </div>

      <JobProgressToggle />
      <JobProgressIndicator />
    </div>
  );
}
