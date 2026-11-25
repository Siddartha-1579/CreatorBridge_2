import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  delayMs?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  threshold = 0.15,
  delayMs = 0,
  direction = "up",
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If user prefers reduced motion, reveal immediately
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (domRef.current) {
              observer.unobserve(domRef.current)
            }
          }
        })
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    )

    const currentElem = domRef.current
    if (currentElem) {
      observer.observe(currentElem)
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem)
      }
    }
  }, [threshold])

  const getTransformClasses = () => {
    if (isVisible) return "opacity-100 translate-x-0 translate-y-0"

    switch (direction) {
      case "up":
        return "opacity-0 translate-y-8"
      case "down":
        return "opacity-0 -translate-y-8"
      case "left":
        return "opacity-0 translate-x-8"
      case "right":
        return "opacity-0 -translate-x-8"
      default:
        return "opacity-0"
    }
  }

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-[opacity,transform]",
        getTransformClasses(),
        className
      )}
    >
      {children}
    </div>
  )
}
