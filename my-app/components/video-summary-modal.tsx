"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Sparkles, Copy, Download, MessageSquare, Hash, Edit3, Trash2, X, Loader2 } from "lucide-react"
import { VideoData } from "@/types/collection"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
interface VideoSummaryModalProps {
  video: VideoData
  children: React.ReactNode
}

interface Highlight {
  id: number
  text: string
  color: string
  sectionId: string
  name: string
}

interface ApiHighlight {
  id: number
  title: string
  text: string
  color: string
  created_at: string
  video_id: number
}

export function VideoSummaryModal({ video, children }: VideoSummaryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [highlights, setHighlights] = useState<Record<number, Highlight>>({})
  const [selectedColor, setSelectedColor] = useState("#ef4444")
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [pendingHighlight, setPendingHighlight] = useState<{
    text: string
    sectionId: string
  } | null>(null)
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null)
  const [highlightName, setHighlightName] = useState("")
  const [showHighlightsList, setShowHighlightsList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const highlightColors = useMemo(() => [
    { color: "#fca5a5", name: "Red", class: "bg-red-300/20 border-red-300/30 text-red-100" },
    { color: "#fde68a", name: "Yellow", class: "bg-yellow-300/20 border-yellow-300/30 text-yellow-100" },
    { color: "#86efac", name: "Green", class: "bg-green-300/20 border-green-300/30 text-green-100" },
    { color: "#93c5fd", name: "Blue", class: "bg-blue-300/20 border-blue-300/30 text-blue-100" },
    { color: "#c4b5fd", name: "Purple", class: "bg-purple-300/20 border-purple-300/30 text-purple-100" },
    { color: "#f9a8d4", name: "Pink", class: "bg-pink-300/20 border-pink-300/30 text-pink-100" },
  ], [])

  // Fetch highlights from backend
  const { data: apiHighlights = [], isLoading: isLoadingHighlights } = useQuery({
    queryKey: ['highlights', video.id],
    queryFn: async (): Promise<ApiHighlight[]> => {
      try {
        const response = await axios.get(`${BASE_URL}/highlights/${video.id}`, {
      withCredentials: true,  
      headers: {
        'Content-Type': 'application/json',
      }
    })
    setError(null)
        return response.data.highlights
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.detail || "Failed to load highlights")
        } else {
          setError("An unexpected error occurred")
        }
        return []
      }
    },
    enabled: isOpen,
  })

  // Transform API data to frontend format
  useEffect(() => {
    if (apiHighlights && apiHighlights.length > 0) {
      const newHighlights = apiHighlights.reduce((acc, highlight) => {
        acc[highlight.id] = {
          id: highlight.id,
          text: highlight.text,
          color: highlight.color,
          sectionId: "transcript",
          name: highlight.title
        }
        return acc
      }, {} as Record<number, Highlight>)

      if (JSON.stringify(newHighlights) !== JSON.stringify(highlights)) {
        setHighlights(newHighlights)
      }
    } else if (Object.keys(highlights).length > 0) {
      setHighlights({})
    }
  }, [apiHighlights, highlights])

  // Highlight mutations
  const addHighlightMutation = useMutation({
    mutationFn: async (highlight: { 
      title: string
      text: string
      color: string
      video_id: number 
    }) => {
      const response = await axios.post(`${BASE_URL}/highlights/`, highlight, {
      withCredentials: true,  // This is the key addition
      headers: {
        'Content-Type': 'application/json',
      }
    })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
  queryKey: ['highlights', video.id] 
})
      setError(null)
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || "Failed to save highlight")
      } else {
        setError("Failed to save highlight. Please try again.")
      }
    }
  })

  const updateHighlightMutation = useMutation({
    mutationFn: async ({ id, ...highlight }: { 
      id: number
      title: string
      color: string 
    }) => {
      const response = await axios.put(`${BASE_URL}/highlights/${id}`, highlight, {
      withCredentials: true,  // This is the key addition
      headers: {
        'Content-Type': 'application/json',
      }
    })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
  queryKey: ['highlights', video.id] 
})
      setError(null)
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || "Failed to update highlight")
      } else {
        setError("Failed to update highlight. Please try again.")
      }
    }
  })

  const deleteHighlightMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`${BASE_URL}/highlights/${id}`, {
      withCredentials: true,  // This is the key addition
      headers: {
        'Content-Type': 'application/json',
      }
    })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
  queryKey: ['highlights', video.id] 
})
      setError(null)
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.detail || "Failed to delete highlight")
      } else {
        setError("Failed to delete highlight. Please try again.")
      }
    }
  })

  // Event handlers
  const handleTextSelection = useCallback((sectionId: string) => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      setPendingHighlight({
        text: selectedText,
        sectionId,
      })
      setShowNameDialog(true)
      setHighlightName("")
      selection.removeAllRanges()
    }
  }, [])

  const confirmHighlight = useCallback(async () => {
    if (pendingHighlight && highlightName.trim()) {
      try {
        await addHighlightMutation.mutateAsync({
          title: highlightName.trim(),
          text: pendingHighlight.text,
          color: selectedColor,
          video_id: Number(video.id)
        })
        setShowNameDialog(false)
        setPendingHighlight(null)
        setHighlightName("")
      } catch (error) {
        console.error("Failed to save highlight:", error)
      }
    }
  }, [pendingHighlight, highlightName, selectedColor, video.id, addHighlightMutation])

  const cancelHighlight = useCallback(() => {
    setShowNameDialog(false)
    setPendingHighlight(null)
    setHighlightName("")
  }, [])

  const removeHighlight = useCallback(async (highlightId: number) => {
    try {
      await deleteHighlightMutation.mutateAsync(highlightId)
    } catch (error) {
      console.error("Failed to delete highlight:", error)
    }
  }, [deleteHighlightMutation])

  const startEditHighlight = useCallback((highlight: Highlight) => {
    setEditingHighlight(highlight)
    setHighlightName(highlight.name)
    setSelectedColor(highlight.color)
    setShowEditDialog(true)
  }, [])

  const confirmEditHighlight = useCallback(async () => {
    if (editingHighlight && highlightName.trim()) {
      try {
        await updateHighlightMutation.mutateAsync({
          id: editingHighlight.id,
          title: highlightName.trim(),
          color: selectedColor
        })
        setShowEditDialog(false)
        setEditingHighlight(null)
        setHighlightName("")
      } catch (error) {
        console.error("Failed to update highlight:", error)
      }
    }
  }, [editingHighlight, highlightName, selectedColor, updateHighlightMutation])

  const cancelEditHighlight = useCallback(() => {
    setShowEditDialog(false)
    setEditingHighlight(null)
    setHighlightName("")
  }, [])

  const handleHighlightClick = useCallback((highlightId: number) => {
    const highlight = highlights[highlightId]
    if (highlight) {
      startEditHighlight(highlight)
    }
  }, [highlights, startEditHighlight])

  // Render highlighted text
  const renderHighlightedText = useCallback((text: string, sectionId: string) => {
    if (!text) return ""
    
    let highlightedText = text
    const sectionHighlights = Object.values(highlights).filter((h) => h.sectionId === sectionId)

    sectionHighlights.forEach((highlight) => {
      const colorClass = highlightColors.find((c) => c.color === highlight.color)?.class || "bg-red-300/20 border-red-300/30 text-red-100"
      const regex = new RegExp(`(${highlight.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
      highlightedText = highlightedText.replace(
        regex,
        `<span class="relative inline-block group">
          <mark 
            class="${colorClass} px-1.5 py-0.5 rounded-md border transition-all duration-200 hover:scale-105 cursor-pointer" 
            data-highlight-id="${highlight.id}"
          >${highlight.text}</mark>
          <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-gray-600">
            ${highlight.name}
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </span>`
      )
    })

    return highlightedText
  }, [highlights, highlightColors])

  const highlightedTranscript = useMemo(() => {
    return renderHighlightedText(video.transcript || "", "transcript")
  }, [video.transcript, renderHighlightedText])

  // Set up click handler for highlights
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const highlightElement = target.closest('mark[data-highlight-id]')
      if (highlightElement) {
        const highlightId = parseInt(highlightElement.getAttribute('data-highlight-id') || '0', 10)
        handleHighlightClick(highlightId)
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [handleHighlightClick])

  // Utility functions
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }, [])

  const downloadTranscript = useCallback(() => {
  if (!video.transcript) return;
  
  const safeTitle = (video.title || 'transcript').toString();
  const blob = new Blob([video.transcript], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}_transcript.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, [video.transcript, video.title]);

const exportHighlights = useCallback(() => {
  const highlightsList = Object.values(highlights)
    .map((h) => `${h.name}: "${h.text}"`)
    .join("\n");

  const safeTitle = (video.title || 'highlights').toString();
  const blob = new Blob([highlightsList], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}_highlights.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, [highlights, video.title]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setIsOpen(true)
      setTimeout(() => setAnimateIn(true), 50)
    } else {
      setAnimateIn(false)
      setTimeout(() => setIsOpen(false), 300)
    }
  }, [])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[60vw] min-w-[300px] max-w-[1000px] h-[80vh] max-h-[90vh] bg-gray-900 border-red-500/20 text-white transition-all duration-300 ${animateIn ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <DialogHeader className="border-b border-gray-800 pb-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-red-400" />
                  <span className="animate-in slide-in-from-left-2 duration-300">Video Summary & Transcript</span>
                </DialogTitle>
                <p className="text-gray-400 text-base animate-in slide-in-from-left-3 duration-300 delay-100">
                  {video.title}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHighlightsList(!showHighlightsList)}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 h-8 px-3 text-xs"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Highlights ({Object.keys(highlights).length})
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col h-[calc(100%-80px)] min-h-0">
            <Tabs defaultValue="summary" className="flex flex-col h-full min-h-0">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700 flex-shrink-0">
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Summary & Tags
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Transcript
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 custom-scrollbar">
                {error && (
                  <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-700/50">
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}

                {showHighlightsList && (
                  <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-purple-400" />
                        Your Highlights
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportHighlights}
                        className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10 h-8 px-3 text-xs"
                        disabled={Object.keys(highlights).length === 0}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export All
                      </Button>
                    </div>
                    {isLoadingHighlights ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : Object.values(highlights).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No highlights yet. Select text to create one.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {Object.values(highlights).map((highlight) => (
                          <div 
                            key={highlight.id}
                            className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-white/30" 
                                    style={{ backgroundColor: highlight.color }}
                                  />
                                  <p className="font-medium text-white">{highlight.name}</p>
                                </div>
                                <p className="text-sm text-gray-300 italic">"{highlight.text}"</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditHighlight(highlight)}
                                  className="text-gray-400 hover:text-white h-8 w-8 p-0"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeHighlight(highlight.id)}
                                  className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <TabsContent value="summary" className="m-0 h-full">
                  <div className="space-y-6 py-4">
                    <Card className="bg-gray-800/50 border-gray-700 w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-red-400" />
                          AI-Generated Summary
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => video.summary && copyToClipboard(video.summary, "summary")}
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10 h-8 px-3 text-xs"
                          disabled={!video.summary}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copiedText === "summary" ? "Copied!" : "Copy"}
                        </Button>
                      </CardHeader>
                      <CardContent className="break-words overflow-wrap-anywhere">
                        <div className="prose prose-invert max-w-none">
                          <div className="text-gray-300 leading-relaxed">
                            {video.summary || "No summary available"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/50 border-gray-700 w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Hash className="w-5 h-5 text-red-400" />
                          Generated Tags
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard((video.tags || []).join(" "), "tags")}
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10 h-8 px-3 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          {copiedText === "tags" ? "Copied!" : "Copy All"}
                        </Button>
                      </CardHeader>
                      <CardContent className="break-words overflow-wrap-anywhere">
                        <div className="space-y-6">
                          <div>
                            <p className="text-gray-300 leading-relaxed mb-4">
                              AI-generated hashtags optimized for maximum reach and engagement based on your video
                              content and trending patterns.
                            </p>
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-semibold text-white flex items-center gap-2">
                              <Hash className="w-4 h-4 text-pink-400" />
                              Recommended Hashtags:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(video.tags || []).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className={`border-red-500/30 text-red-300 bg-red-500/10 hover:bg-red-500/20 cursor-pointer transition-all duration-300 hover:scale-105 ${
                                    index < 3
                                      ? "border-pink-500/30 text-pink-300 bg-pink-500/10 hover:bg-pink-500/20"
                                      : ""
                                  }`}
                                  onClick={() => copyToClipboard(tag, `tag-${index}`)}
                                >
                                  {tag}
                                  {copiedText === `tag-${index}` && <span className="ml-1 text-xs">✓</span>}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="transcript" className="m-0 h-full">
                  <div className="py-4">
                    <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <strong>Tip:</strong> Select any text to highlight it and give it a custom name. Hover over
                        highlights to see their names, or click to edit them.
                      </p>
                    </div>

                    <Card className="bg-gray-800/50 border-gray-700 w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-400" />
                          Video Transcript
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            {highlightColors.map((colorOption) => (
                              <button
                                key={colorOption.color}
                                onClick={() => setSelectedColor(colorOption.color)}
                                className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                                  selectedColor === colorOption.color
                                    ? "border-white scale-110 shadow-lg"
                                    : "border-gray-500"
                                }`}
                                style={{ backgroundColor: colorOption.color }}
                                title={`Highlight with ${colorOption.name}`}
                              />
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => video.transcript && copyToClipboard(video.transcript, "transcript")}
                            className="border-red-500/30 text-red-300 hover:bg-red-500/10 h-8 px-3 text-xs"
                            disabled={!video.transcript}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {copiedText === "transcript" ? "Copied!" : "Copy"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadTranscript}
                            className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10 bg-transparent h-8 px-3 text-xs"
                            disabled={!video.transcript}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="break-words overflow-wrap-anywhere">
                        <div className="prose prose-invert max-w-none">
                          <div
                            className="text-gray-300 leading-relaxed select-text cursor-text relative"
                            onMouseUp={(e) => {
                              const selection = window.getSelection()
                              if (selection && selection.toString().trim() && !(e.target as HTMLElement).closest('mark')) {
                                handleTextSelection("transcript")
                              }
                            }}
                            dangerouslySetInnerHTML={{ __html: highlightedTranscript }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="w-[500px] bg-gray-900 border-red-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-red-400" />
              Name Your Highlight
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="highlight-name" className="text-sm font-medium text-gray-300">
                Highlight Name
              </Label>
              <Input
                id="highlight-name"
                value={highlightName}
                onChange={(e) => setHighlightName(e.target.value)}
                placeholder="Enter a name for this highlight..."
                className="mt-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    confirmHighlight()
                  } else if (e.key === "Escape") {
                    cancelHighlight()
                  }
                }}
                autoFocus
              />
            </div>
            {pendingHighlight && (
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Selected text:</p>
                <p className="text-sm text-gray-300 italic">"{pendingHighlight.text}"</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">Color:</p>
              <div className="flex gap-1.5">
                {highlightColors.map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => setSelectedColor(colorOption.color)}
                    className={`w-6 h-6 rounded border-2 transition-all duration-200 hover:scale-110 ${
                      selectedColor === colorOption.color ? "border-white scale-110" : "border-gray-500"
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={cancelHighlight}
                className="border-gray-500/30 text-gray-300 hover:bg-gray-500/10 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmHighlight}
                disabled={!highlightName.trim() || addHighlightMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {addHighlightMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Highlight"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-gray-900 border-blue-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" />
              Edit Highlight
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-highlight-name" className="text-sm font-medium text-gray-300">
                Highlight Name
              </Label>
              <Input
                id="edit-highlight-name"
                value={highlightName}
                onChange={(e) => setHighlightName(e.target.value)}
                placeholder="Enter a name for this highlight..."
                className="mt-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    confirmEditHighlight()
                  } else if (e.key === "Escape") {
                    cancelEditHighlight()
                  }
                }}
                autoFocus
              />
            </div>
            {editingHighlight && (
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Highlighted text:</p>
                <p className="text-sm text-gray-300 italic">"{editingHighlight.text}"</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-400">Color:</p>
              <div className="flex gap-1.5">
                {highlightColors.map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => setSelectedColor(colorOption.color)}
                    className={`w-6 h-6 rounded border-2 transition-all duration-200 hover:scale-110 ${
                      selectedColor === colorOption.color ? "border-white scale-110" : "border-gray-500"
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (editingHighlight) {
                    removeHighlight(editingHighlight.id)
                    cancelEditHighlight()
                  }
                }}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 bg-transparent"
                disabled={deleteHighlightMutation.isPending}
              >
                {deleteHighlightMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEditHighlight}
                  className="border-gray-500/30 text-gray-300 hover:bg-gray-500/10 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmEditHighlight}
                  disabled={!highlightName.trim() || updateHighlightMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  {updateHighlightMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}