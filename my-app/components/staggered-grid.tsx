"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import type React from "react"

interface StaggeredGridProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}

export function StaggeredGrid({ children, className = "", staggerDelay = 100 }: StaggeredGridProps) {
  const { elementRef, isVisible } = useScrollAnimation()

  return (
    <div ref={elementRef} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 40px, 0)",
            transition: `all 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
