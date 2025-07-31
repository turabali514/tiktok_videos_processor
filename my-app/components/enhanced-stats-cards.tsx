"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Video, TrendingUp, CheckCircle, ArrowUp, ArrowDown } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { useEffect, useState } from "react"

interface StatsCardsProps {
  stats: {
    videosAnalyzed: number
    totalViews: number
    successfulImports: number
  }
}

export function EnhancedStatsCards({ stats }: StatsCardsProps) {
  const [animatedStats, setAnimatedStats] = useState({
    videosAnalyzed: 0,
    totalViews: 0,
    successfulImports: 0,
  })

  useEffect(() => {
    const animateValue = (key: keyof typeof stats, target: number) => {
      const duration = 2000
      const steps = 60
      const increment = target / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setAnimatedStats((prev) => ({ ...prev, [key]: Math.floor(current) }))
      }, duration / steps)
    }

    animateValue("videosAnalyzed", stats.videosAnalyzed)
    animateValue("totalViews", stats.totalViews)
    animateValue("successfulImports", stats.successfulImports)
  }, [stats])

  const cards = [
    {
      title: "Videos Analyzed",
      value: animatedStats.videosAnalyzed,
      icon: Video,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      change: "+12%",
      isPositive: true,
    },
    {
      title: "Total Views",
      value: animatedStats.totalViews,
      icon: TrendingUp,
      color: "from-pink-500 to-red-600",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      change: "+24%",
      isPositive: true,
    },
    {
      title: "Successful Imports",
      value: animatedStats.successfulImports,
      icon: CheckCircle,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      change: "+8%",
      isPositive: true,
    },
  ]

  return (
    <ScrollReveal direction="up" className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <ScrollReveal key={index} delay={index * 150} direction="up">
            <Card
              className={`bg-gray-800/50 backdrop-blur-sm border ${card.borderColor} hover:bg-gray-800/70 transition-all duration-500 transform hover:scale-[1.05] hover:-translate-y-2 group relative overflow-hidden`}
            >
              {/* Animated background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              />

              {/* Animated border */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm`}
              />

              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden`}
                  >
                    {/* Icon background animation */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                    />
                    <div className={`w-7 h-7 bg-gradient-to-r ${card.color} rounded-lg p-1.5 relative z-10`}>
                      <card.icon className="w-full h-full text-white" />
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${card.isPositive ? "text-green-400" : "text-red-400"} opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0`}
                  >
                    {card.isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {card.change}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-3xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-white group-hover:to-gray-300 transition-all duration-500">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-500">
                    {card.title}
                  </p>
                </div>

                {/* Progress bar animation */}
                <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${card.color} rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out`}
                  />
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  )
}
