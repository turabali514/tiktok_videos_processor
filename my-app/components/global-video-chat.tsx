"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, MessageCircle, Bot, User, Sparkles, TrendingUp, BarChart3, Minimize2, Maximize2 } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

interface VideoData {
  id: number
  title: string
  views: number
  likes: number
  comments: number
  shares: number
  performance: "high" | "medium" | "low"
  uploadDate: string
}

interface GlobalVideoChatProps {
  videos: VideoData[]
}

export function GlobalVideoChat({ videos }: GlobalVideoChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hi! I'm your AI analytics assistant. I can help you analyze your entire video library (${videos.length} videos) and provide insights across all your content. What would you like to know?`,
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  const handleSendMessage = async () => {
  if (!inputMessage.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    text: inputMessage,
    sender: "user",
    timestamp: new Date(),
  }

  setMessages([userMessage])
  const currentQuery = inputMessage
  setInputMessage("")
  setIsTyping(true)

  try {
    // Call the backend API with improved error handling
    const response = await fetch(`${BASE_URL}/query_across_videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        question: currentQuery
      }),
      credentials: 'include' // Include if your API requires authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Server responded with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data.answer) {
      throw new Error('Received invalid response format from server');
    }
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: data.answer,
      sender: "ai",
      timestamp: new Date(),
    }

    setMessages([userMessage, aiMessage])
  } catch (error) {
    console.error('API Error:', error);
    
    let errorMessage = "Sorry, I encountered an error while processing your request. Please try again.";
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = "Unable to connect to the server. Please check your network connection.";
      } else if (error.message.includes('status 401')) {
        errorMessage = "Session expired. Please refresh the page and try again.";
      } else if (error.message.includes('status 500')) {
        errorMessage = "Server error occurred. Our team has been notified. Please try again later.";
      } else {
        errorMessage = error.message;
      }
    }
    
    const errorMessageObj: Message = {
      id: (Date.now() + 1).toString(),
      text: errorMessage,
      sender: "ai",
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, errorMessageObj]);
  } finally {
    setIsTyping(false);
  }
}

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <ScrollReveal direction="up" className="mb-8">
      <Card className="bg-gray-900/50 backdrop-blur-sm border-red-500/20 hover:border-red-500/40 transition-all duration-300 relative overflow-hidden group">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center relative">
                <BarChart3 className="w-5 h-5 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl animate-ping opacity-20" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                  Global Analytics Assistant
                  <Sparkles className="w-5 h-5 text-red-400" />
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  AI-powered insights across your entire video library • {videos.length} videos analyzed
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="relative z-10">
  
            {/* Chat messages */}
            <div className="h-64 overflow-y-auto mb-4 space-y-4 custom-scrollbar">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""} animate-in slide-in-from-bottom-2`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-red-500 to-pink-500"
                        : "bg-gradient-to-r from-gray-600 to-gray-700"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                        : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                    } group hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300`}
                  >
                    <div className="whitespace-pre-line text-sm leading-relaxed">{message.text}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.sender === "ai" && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <Sparkles className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-3 animate-in fade-in-50 duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">Analyzing your video library...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="flex gap-3">
              <Input
                placeholder="Ask about your video performance, trends, or optimization strategies..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 h-12"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 h-12 transition-all duration-300 transform hover:scale-105"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">AI Assistant ready • Analyzing {videos.length} videos</span>
            </div>
          </CardContent>
        )}
      </Card>
    </ScrollReveal>
  )
}