"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Eye,
  Heart,
  MessageCircle,
  Share,
  TrendingUp,
  Clock,
  Users,
  Target,
  BarChart3,
  FileText,
  Sparkles,
  X,
  Copy,
  Download,
  Play,
} from "lucide-react"

interface VideoDetailsModalProps {
  video: {
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
  children: React.ReactNode
}

export function VideoDetailsModal({ video, children }: VideoDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Generate dynamic content based on video title and performance
  const generateSummary = () => {
    const summaries = {
      dance: `This viral dance challenge video showcases exceptional creativity and timing. The content features a trending dance routine with smooth transitions and engaging visual effects. Key success factors include perfect music synchronization, high-quality production, and strategic hashtag usage. The video demonstrates strong storytelling elements that resonate with the target demographic, particularly Gen Z audiences aged 16-24. The choreography is accessible yet impressive, making it highly shareable and encouraging user participation.`,

      cooking: `This cooking hack video delivers practical value through clear, step-by-step demonstrations. The content excels in visual presentation with close-up shots and perfect timing. Success drivers include immediate value delivery, easy-to-follow instructions, and surprising results that encourage sharing. The video targets food enthusiasts and home cooks, with strong appeal across multiple age groups. The hack's simplicity and effectiveness make it highly memorable and actionable.`,

      pet: `This pet reaction video captures authentic, heartwarming moments that resonate universally. The content succeeds through genuine emotion, perfect timing, and relatable pet behavior. Key performance factors include the pet's natural charisma, high-quality video capture, and emotional storytelling without words. The video appeals to pet lovers and general audiences seeking feel-good content. The authentic reactions create strong emotional connections driving engagement.`,

      diy: `This DIY transformation video provides substantial value through detailed before-and-after documentation. The content excels in showing dramatic visual changes with clear process documentation. Success elements include budget-conscious approach, achievable results, and inspiring transformation. The video targets home improvement enthusiasts and budget-conscious viewers. The practical nature and impressive results encourage saves and shares for future reference.`,

      art: `This street art time-lapse video showcases artistic talent through mesmerizing creation process documentation. The content succeeds through visual storytelling, artistic skill demonstration, and satisfying progression. Key factors include high-quality time-lapse technique, impressive final result, and artistic process revelation. The video appeals to art enthusiasts and general audiences appreciating creativity. The meditative quality and skill display create strong viewer retention.`,

      default: `This TikTok video demonstrates strong content strategy with engaging visual elements and strategic timing. The content succeeds through clear messaging, high production quality, and audience-focused approach. Key performance drivers include trending audio usage, optimal posting timing, and effective hashtag strategy. The video shows strong engagement metrics indicating successful audience connection and content resonance.`,
    }

    const title = video.title.toLowerCase()
    if (title.includes("dance") || title.includes("challenge")) return summaries.dance
    if (title.includes("cooking") || title.includes("hack") || title.includes("recipe")) return summaries.cooking
    if (title.includes("pet") || title.includes("cat") || title.includes("dog") || title.includes("animal"))
      return summaries.pet
    if (title.includes("diy") || title.includes("makeover") || title.includes("room")) return summaries.diy
    if (title.includes("art") || title.includes("drawing") || title.includes("paint")) return summaries.art
    return summaries.default
  }

  const generateTranscript = () => {
    const transcripts = {
      dance: [
        { time: "0:00", text: "[Upbeat trending music starts - 'Oh No' by Capone]", speaker: "audio" },
        { time: "0:02", text: "Hey TikTok! Ready for the ultimate dance challenge?", speaker: "creator" },
        { time: "0:04", text: "[First dance move - arm wave with hip pop]", speaker: "action" },
        { time: "0:06", text: "Follow along if you can keep up!", speaker: "creator" },
        { time: "0:08", text: "[Signature move - spin with freeze pose]", speaker: "action" },
        { time: "0:10", text: "[Transition to floor work - smooth drop]", speaker: "action" },
        { time: "0:12", text: "Tag your friends who need to see this!", speaker: "creator" },
        { time: "0:14", text: "[Final pose with confident smile]", speaker: "action" },
        { time: "0:15", text: "#DanceChallenge #Viral #ForYou", speaker: "text" },
      ],

      cooking: [
        { time: "0:00", text: "[Kitchen setup with ingredients visible]", speaker: "action" },
        { time: "0:03", text: "This cooking hack will change your life!", speaker: "creator" },
        { time: "0:06", text: "[Demonstrates technique - close-up shot]", speaker: "action" },
        { time: "0:10", text: "I can't believe I didn't know this before!", speaker: "creator" },
        { time: "0:15", text: "[Shows final result - perfectly cooked]", speaker: "action" },
        { time: "0:20", text: "Save this for later - you'll thank me!", speaker: "creator" },
        { time: "0:25", text: "[Text overlay: 'Follow for more hacks']", speaker: "text" },
        { time: "0:28", text: "#CookingHack #FoodTips #Kitchen", speaker: "text" },
      ],

      pet: [
        { time: "0:00", text: "[Pet notices new toy on the floor]", speaker: "action" },
        { time: "0:03", text: "[Cautious approach - sniffing and investigating]", speaker: "action" },
        { time: "0:06", text: "[First tentative paw touch]", speaker: "action" },
        { time: "0:08", text: "[Sudden excitement - tail wagging intensifies]", speaker: "action" },
        { time: "0:12", text: "[Full engagement - playing enthusiastically]", speaker: "action" },
        { time: "0:16", text: "[Owner laughing in background]", speaker: "audio" },
        { time: "0:18", text: "[Pet completely absorbed in play]", speaker: "action" },
        { time: "0:20", text: "#PetsOfTikTok #Cute #Wholesome", speaker: "text" },
      ],

      default: [
        { time: "0:00", text: "[Video begins with engaging hook]", speaker: "action" },
        { time: "0:03", text: "[Creator introduces main concept]", speaker: "creator" },
        { time: "0:08", text: "[Key content delivery with visual aids]", speaker: "action" },
        { time: "0:12", text: "[Engaging interaction with audience]", speaker: "creator" },
        { time: "0:15", text: "[Call-to-action for engagement]", speaker: "creator" },
        { time: "0:18", text: "[Closing with memorable moment]", speaker: "action" },
        { time: "0:20", text: "#Trending #ForYou #Viral", speaker: "text" },
      ],
    }

    const title = video.title.toLowerCase()
    if (title.includes("dance") || title.includes("challenge")) return transcripts.dance
    if (title.includes("cooking") || title.includes("hack")) return transcripts.cooking
    if (title.includes("pet") || title.includes("cat") || title.includes("dog")) return transcripts.pet
    return transcripts.default
  }

  const mockSummary = generateSummary()
  const mockTranscript = generateTranscript()

  const engagementRate = (((video.likes + video.comments + video.shares) / video.views) * 100).toFixed(2)
  const avgWatchTime = video.performance === "high" ? "85%" : video.performance === "medium" ? "68%" : "45%"
  const reachRate = video.performance === "high" ? "180%" : video.performance === "medium" ? "120%" : "85%"

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const downloadTranscript = () => {
    const transcriptText = mockTranscript.map((item) => `${item.time} [${item.speaker}]: ${item.text}`).join("\n")

    const blob = new Blob([transcriptText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${video.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-gray-900 border-red-500/20 text-white">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Video Analytics Dashboard
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-base">
                Comprehensive insights, AI summary, and full transcript analysis
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex gap-6 h-full overflow-hidden">
          {/* Video Preview */}
          <div className="w-80 flex-shrink-0">
            <Card className="bg-gray-800/50 border-gray-700 h-full">
              <CardContent className="p-4">
                <div className="relative aspect-[3/4] bg-gray-700 rounded-lg overflow-hidden mb-4 group">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  <Badge
                    className={`absolute top-2 left-2 ${
                      video.performance === "high"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : video.performance === "medium"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                    }`}
                  >
                    {video.performance.toUpperCase()}
                  </Badge>
                </div>

                <h3 className="font-semibold text-white mb-3 line-clamp-2">{video.title}</h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Eye className="w-4 h-4 text-red-400" />
                    <span>{video.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span>{video.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span>{video.comments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Share className="w-4 h-4 text-green-400" />
                    <span>{video.shares.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Upload Date</p>
                  <p className="text-sm text-white">{video.uploadDate}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="analytics" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="ai-summary"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Summary
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Transcript
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="analytics" className="space-y-4 m-0">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gray-800/50 border-red-500/20">
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{engagementRate}%</p>
                        <p className="text-sm text-gray-400">Engagement Rate</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/50 border-pink-500/20">
                      <CardContent className="p-4 text-center">
                        <Clock className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{avgWatchTime}</p>
                        <p className="text-sm text-gray-400">Avg Watch Time</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800/50 border-red-500/20">
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{reachRate}</p>
                        <p className="text-sm text-gray-400">Reach Rate</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-red-400" />
                        Performance Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Audience Retention</span>
                            <span className="text-white">{avgWatchTime}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                              style={{ width: avgWatchTime }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Social Sharing</span>
                            <span className="text-white">92%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full w-[92%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">Comment Engagement</span>
                            <span className="text-white">65%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full w-[65%]" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ai-summary" className="m-0">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-red-400" />
                        AI-Generated Summary
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(mockSummary, "summary")}
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copiedText === "summary" ? "Copied!" : "Copy"}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 leading-relaxed mb-6">{mockSummary}</p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-400" />
                          Key Success Factors:
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Perfect timing",
                            "Trending audio",
                            "High production quality",
                            "Strategic hashtags",
                            "Engaging transitions",
                            "Target audience appeal",
                            "Authentic content",
                            "Clear messaging",
                          ].map((factor, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-red-500/30 text-red-300 bg-red-500/10 justify-start"
                            >
                              {factor}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-red-500/20">
                          <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-pink-400" />
                            Optimization Recommendations:
                          </h5>
                          <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Post during peak engagement hours (7-9 PM EST)</li>
                            <li>• Use trending hashtags within first hour of posting</li>
                            <li>• Engage with comments within first 30 minutes</li>
                            <li>• Cross-promote on other social platforms</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transcript" className="m-0">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-400" />
                        Video Transcript
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              mockTranscript.map((item) => `${item.time} [${item.speaker}]: ${item.text}`).join("\n"),
                              "transcript",
                            )
                          }
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copiedText === "transcript" ? "Copied!" : "Copy"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadTranscript}
                          className="border-pink-500/30 text-pink-300 hover:bg-pink-500/10 bg-transparent"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {mockTranscript.map((item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 transition-colors duration-200 group"
                          >
                            <Badge
                              variant="outline"
                              className="border-red-500/30 text-red-300 bg-red-500/10 font-mono text-xs shrink-0"
                            >
                              {item.time}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs shrink-0 ${
                                item.speaker === "creator"
                                  ? "border-pink-500/30 text-pink-300 bg-pink-500/10"
                                  : item.speaker === "action"
                                    ? "border-blue-500/30 text-blue-300 bg-blue-500/10"
                                    : item.speaker === "audio"
                                      ? "border-green-500/30 text-green-300 bg-green-500/10"
                                      : "border-gray-500/30 text-gray-300 bg-gray-500/10"
                              }`}
                            >
                              {item.speaker}
                            </Badge>
                            <p className="text-gray-300 flex-1 group-hover:text-white transition-colors duration-200">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Transcript Legend:</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge className="border-pink-500/30 text-pink-300 bg-pink-500/10">Creator Speech</Badge>
                          <Badge className="border-blue-500/30 text-blue-300 bg-blue-500/10">Visual Action</Badge>
                          <Badge className="border-green-500/30 text-green-300 bg-green-500/10">Audio/Music</Badge>
                          <Badge className="border-gray-500/30 text-gray-300 bg-gray-500/10">Text Overlay</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
