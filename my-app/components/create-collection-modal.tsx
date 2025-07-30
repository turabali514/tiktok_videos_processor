"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Folder,
  Video,
  Heart,
  TrendingUp,
  Star,
  Bookmark,
  Tag,
  Users,
  Zap,
  Target,
  Palette,
  Sparkles,
} from "lucide-react"
import type { CreateCollectionData } from "@/types/collection"

interface CreateCollectionModalProps {
  userId: number
  onCreateCollection: (data: CreateCollectionData) => Promise<void>
  children: React.ReactNode
}

const availableIcons = [
  { icon: Folder, name: "Folder", value: "Folder" },
  { icon: Video, name: "Video", value: "Video" },
  { icon: Heart, name: "Heart", value: "Heart" },
  { icon: TrendingUp, name: "Trending", value: "TrendingUp" },
  { icon: Star, name: "Star", value: "Star" },
  { icon: Bookmark, name: "Bookmark", value: "Bookmark" },
  { icon: Tag, name: "Tag", value: "Tag" },
  { icon: Users, name: "Users", value: "Users" },
  { icon: Zap, name: "Zap", value: "Zap" },
  { icon: Target, name: "Target", value: "Target" },
]

const availableColors = [
  { color: "#ef4444", name: "Red" },
  { color: "#f59e0b", name: "Amber" },
  { color: "#10b981", name: "Emerald" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#8b5cf6", name: "Violet" },
  { color: "#ec4899", name: "Pink" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#84cc16", name: "Lime" },
  { color: "#f97316", name: "Orange" },
  { color: "#6366f1", name: "Indigo" },
]

export function CreateCollectionModal({ userId, onCreateCollection, children }: CreateCollectionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6", // Default from DB schema
    icon: "Folder", // Default from DB schema
  })

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    if (!formData.name.trim()) return
    setIsLoading(true)
    console.log(userId)
    try {
      await onCreateCollection({
        user_id: userId,
        name: formData.name,
        color: formData.color,
        icon: formData.icon,
      })
      setFormData({
        name: "",
        color: "#3b82f6",
        icon: "Folder",
      })
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to create collection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-red-500/20 text-white shadow-2xl shadow-red-500/10">
        <DialogHeader className="pb-6 border-b border-gray-700/50">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-400" />
            Create New Collection
          </DialogTitle>
          <p className="text-gray-400 text-sm mt-2">Organize your videos with a custom collection</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          {/* Collection Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-gray-300 font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Collection Name*
            </Label>
            <Input
              id="name"
              placeholder="Enter collection name..."
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 rounded-xl py-3 transition-all duration-300"
              required
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-4">
            <Label className="text-gray-300 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Choose Icon
            </Label>
            <div className="grid grid-cols-5 gap-3">
              {availableIcons.map(({ icon: IconComponent, name, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon: value }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-110 group ${
                    formData.icon === value
                      ? "border-red-500 bg-red-500/20 shadow-lg shadow-red-500/25"
                      : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70"
                  }`}
                  title={name}
                >
                  <IconComponent
                    className={`w-6 h-6 mx-auto transition-colors duration-300 ${
                      formData.icon === value ? "text-red-400" : "text-gray-300 group-hover:text-white"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <Label className="text-gray-300 font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Choose Color
            </Label>
            <div className="grid grid-cols-5 gap-3">
              {availableColors.map(({ color, name }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-12 h-12 rounded-xl border-2 transition-all duration-300 hover:scale-110 relative ${
                    formData.color === color ? "border-white scale-110 shadow-lg" : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color }}
                  title={name}
                >
                  {formData.color === color && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Preview */}
          <div className="p-6 bg-gradient-to-r from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            <Label className="text-gray-300 text-sm mb-4 block font-semibold">Preview</Label>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110"
                style={{
                  backgroundColor: `${formData.color}20`,
                  border: `1px solid ${formData.color}40`,
                  boxShadow: `0 4px 12px ${formData.color}20`,
                }}
              >
                {(() => {
                  const IconComponent = availableIcons.find((i) => i.value === formData.icon)?.icon || Folder
                  return <IconComponent className="w-6 h-6" style={{ color: formData.color }} />
                })()}
              </div>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 py-3 rounded-xl"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Collection
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
