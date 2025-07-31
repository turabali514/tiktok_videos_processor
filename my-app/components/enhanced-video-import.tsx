"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Link, Loader2, Sparkles, Zap } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"

interface VideoImportProps {
  onImport: (url: string) => void
}

export function EnhancedVideoImport({ onImport }: VideoImportProps) {
  const [url, setUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

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
      <Card className="bg-gray-800/30 backdrop-blur-xl border-gray-700/50 hover:border-red-500/30 transition-all duration-500 relative overflow-hidden group">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-red-400/30 rounded-full animate-pulse"
              style={{
                left: `${20 + i * 10}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i * 0.3}s`,
              }}
            />
          ))}
        </div>

        <CardContent className="p-8 text-center relative z-10">
          <div className="w-[450px] mx-auto space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto transform transition-all duration-500 hover:rotate-12 hover:scale-110 group-hover:shadow-2xl group-hover:shadow-red-500/25">
                <Download className="w-10 h-10 text-white" />

                {/* Animated rings */}
                <div className="absolute w-20 h-20  rounded-3xl border-2 border-red-400/30 animate-ping" />
                <div
                  className="absolute w-24 h-24 rounded-3xl border-2 border-pink-400/30 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>

              {/* Floating icons */}
              <Sparkles
                className="absolute -top-2 -right-2 w-6 h-6 text-red-400 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <Zap
                className="absolute -bottom-2 -left-2 w-6 h-6 text-pink-400 animate-bounce"
                style={{ animationDelay: "0.8s" }}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                Import Video
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-500">
                Paste any TikTok video URL to start analyzing with our AI engine
              </p>
            </div>

            <div className="space-y-4">
              <div className={`relative transition-all duration-300 ${isFocused ? "scale-105" : ""}`}>
                <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors duration-300" />
                <Input
                  placeholder="https://www.tiktok.com/@username/video/123..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 focus:ring-4 transition-all duration-300 rounded-xl"
                  disabled={isImporting}
                />

                {/* Input glow effect */}
                {isFocused && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur-xl -z-10" />
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={!url.trim() || isImporting}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium py-4 rounded-xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25 disabled:opacity-50 disabled:transform-none relative overflow-hidden group/button"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000" />

                {isImporting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Video...</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Import & Analyze
                    <Zap className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollReveal>
  )
}
