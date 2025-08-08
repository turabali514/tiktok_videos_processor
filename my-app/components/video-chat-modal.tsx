"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Send, MessageCircle, Bot, User, Sparkles } from "lucide-react"
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Message {
  id: string
  text: string
  sender: "user" | "ai"
  timestamp: Date
}

interface VideoChatModalProps {
  videoId: number
  videoTitle: string
  children: React.ReactNode
}

export function VideoChatModal({ videoId, videoTitle, children }: VideoChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hi! I'm your AI assistant. I can help you analyze "${videoTitle}". What would you like to know about this video's performance?`,
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)
  

  const handleSendMessage = async () => {
  if (!inputMessage.trim()) return

  const userMessage: Message = {
    id: Date.now().toString(),
    text: inputMessage,
    sender: "user",
    timestamp: new Date(),
  }

  setMessages([userMessage])
  setInputMessage("")
  setIsTyping(true)

  try {
    const response = await fetch(`${BASE_URL}/query`, {  // Update this URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // If using auth
      },
      body: JSON.stringify({
        question: inputMessage,
        video_id: videoId
      }),
      credentials: 'include' // If using cookies
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: data.answer || data.error || "Sorry, I couldn't process your request.",
      sender: "ai",
      timestamp: new Date(),
    }

    setMessages([userMessage, aiMessage]);
  } catch (error) {
    console.error('Error fetching response:', error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "Sorry, there was an error processing your request. Please try again.",
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }}

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true)
      setTimeout(() => setAnimateIn(true), 50)
    } else {
      setAnimateIn(false)
      setTimeout(() => setIsOpen(false), 300)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={`fixed top-1/2 left-1/2 overflow-y-auto -translate-x-1/2 -translate-y-1/2 z-50 grid max-w-2xl w-[60vw] max-h-[90vh] overflow-hidden bg-gray-900 border-red-500/20 text-white transition-all duration-300 ${
          animateIn ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <DialogHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-red-400" />
                <span className="animate-in slide-in-from-left-2 duration-300">AI Video Assistant</span>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[70vh] animate-in fade-in-50 duration-500 delay-200">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                      : "bg-gray-800/50 text-gray-200 border border-gray-700/50"
                  } group hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {message.sender === "ai" && (
                      <Sparkles className="w-3 h-3 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-2xl">
                  <div className="flex gap-2">
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
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-800 flex-shrink-0">
            <div className="flex gap-3">
              <Input
                placeholder="Ask about video performance, engagement, or insights..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 h-10"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 h-10 transition-all duration-300 transform hover:scale-105"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">AI Assistant is ready to help</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}