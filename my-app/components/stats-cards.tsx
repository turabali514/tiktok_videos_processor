"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Video, TrendingUp, CheckCircle } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"

interface StatsCardsProps {
  stats: {
    videosAnalyzed: number
    totalViews: number
    successfulImports: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Videos Analyzed",
      value: stats.videosAnalyzed,
      icon: Video,
      color: "from-pink-500 to-purple-600",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Successful Imports",
      value: stats.successfulImports,
      icon: CheckCircle,
      color: "from-pink-500 to-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <ScrollReveal direction="up" className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <ScrollReveal key={index} delay={index * 100} direction="up">
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 transform hover:scale-[1.02] group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className={`w-6 h-6 bg-gradient-to-r ${card.color} rounded p-1`}>
                      <card.icon className="w-full h-full text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">{card.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  )
}
