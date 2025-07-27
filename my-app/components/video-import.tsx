"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Link, Loader2, Sparkles } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"

interface VideoImportProps {
  onImport: (url: string) => void
}

export function VideoImport({ onImport }: VideoImportProps) {
  const [url, setUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!url.trim()) return

    setIsImporting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    onImport(url)
    setUrl("")
    setIsImporting(false)
  }

  return (
    <ScrollReveal direction="up" className="mb-8">
      <Card className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 backdrop-blur-sm shadow-2xl shadow-pink-500/5">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto space-y-8">
            {/* Enhanced Icon */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto transform transition-all duration-500 hover:rotate-12 hover:scale-110 shadow-lg shadow-pink-500/25">
                <Download className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl mx-auto animate-ping opacity-20" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
            </div>

            {/* Enhanced Header */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Import Video
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Paste any TikTok video URL to start analyzing with our{" "}
                <span className="text-pink-400 font-medium">AI engine</span>
              </p>
            </div>

            {/* Enhanced Input Section */}
            <div className="space-y-6">
              <div className="relative group">
                <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-pink-400 transition-colors duration-300" />
                <Input
                  placeholder="https://www.tiktok.com/@username/video/123..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-pink-500 focus:ring-pink-500/20 rounded-xl text-sm transition-all duration-300 hover:bg-gray-800/70"
                  disabled={isImporting}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              <Button
                onClick={handleImport}
                disabled={!url.trim() || isImporting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:transform-none"
              >
                {isImporting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Video...</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div
                        className="w-1 h-1 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1 h-1 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Import & Analyze
                  </div>
                )}
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
              <div className="text-center">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </div>
                <p className="text-xs text-gray-400">AI Analysis</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Download className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-gray-400">Fast Import</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Link className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-xs text-gray-400">URL Support</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollReveal>
  )
}
