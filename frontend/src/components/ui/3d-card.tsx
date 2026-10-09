import React, { createContext, useState, useContext, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined)

export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMouseEntered, setIsMouseEntered] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || prefersReducedMotion) return

    // On small touch screens / mobile, disable tilt
    if (window.innerWidth < 768) return

    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) / (window.innerWidth < 1024 ? 35 : 22)
    const y = (e.clientY - top - height / 2) / (window.innerWidth < 1024 ? 35 : 22)

    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`
  }

  const handleMouseEnter = () => {
    if (prefersReducedMotion) return
    setIsMouseEntered(true)
  }

  const handleMouseLeave = () => {
    if (!containerRef.current || prefersReducedMotion) return
    setIsMouseEntered(false)
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn("flex items-center justify-center py-2", containerClassName)}
        style={{
          perspective: prefersReducedMotion ? "none" : "1000px",
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "relative flex items-center justify-center transition-all duration-300 ease-out",
            className
          )}
          style={{
            transformStyle: prefersReducedMotion ? "flat" : "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  )
}

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        "h-auto w-full [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  )
}

export const CardItem = ({
  as: Component = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: React.ElementType
  children?: React.ReactNode
  className?: string
  translateX?: number | string
  translateY?: number | string
  translateZ?: number | string
  rotateX?: number | string
  rotateY?: number | string
  rotateZ?: number | string
  [key: string]: unknown
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isMouseEntered] = useCardHover()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
  }, [])

  useEffect(() => {
    if (!ref.current) return

    // If reduced motion is requested or viewport is mobile, keep flat
    if (prefersReducedMotion || (typeof window !== "undefined" && window.innerWidth < 768)) {
      ref.current.style.transform = "none"
      return
    }

    if (isMouseEntered) {
      // Moderate intensity for tablet screens
      const scaleFactor = window.innerWidth < 1024 ? 0.6 : 1.0
      const tz = typeof translateZ === "number" ? translateZ * scaleFactor : translateZ
      const tx = typeof translateX === "number" ? translateX * scaleFactor : translateX
      const ty = typeof translateY === "number" ? translateY * scaleFactor : translateY
      const rx = typeof rotateX === "number" ? rotateX * scaleFactor : rotateX
      const ry = typeof rotateY === "number" ? rotateY * scaleFactor : rotateY
      const rz = typeof rotateZ === "number" ? rotateZ * scaleFactor : rotateZ

      ref.current.style.transform = `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ, prefersReducedMotion])

  return (
    <Component
      ref={ref}
      className={cn("w-fit transition duration-300 ease-out", className)}
      {...rest}
    >
      {children}
    </Component>
  )
}

export const useCardHover = () => {
  const context = useContext(MouseEnterContext)
  if (!context) {
    return [false, () => {}] as const
  }
  return context
}
