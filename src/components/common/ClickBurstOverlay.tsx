import React, { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

const REACTIONS = ["👍", "❤️", "🔥", "✨", "👏"] as const

export const ClickBurstOverlay: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const prefersReducedMotion = useReducedMotion()

    useEffect(() => {
        if (prefersReducedMotion || typeof document === "undefined") return
        const container = containerRef.current
        if (!container) return

        const handlePointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return

            const x = e.clientX
            const y = e.clientY
            const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
            const driftX = `${(Math.random() * 48 - 24).toFixed(1)}px`
            const tilt = `${(Math.random() * 28 - 14).toFixed(1)}deg`

            const badge = document.createElement("span")
            badge.className = "cb-social-reaction"
            badge.textContent = reaction
            badge.style.left = `${x}px`
            badge.style.top = `${y}px`
            badge.style.setProperty("--drift-x", driftX)
            badge.style.setProperty("--tilt", tilt)

            container.appendChild(badge)

            window.setTimeout(() => {
                badge.remove()
            }, 960)
        }

        document.addEventListener("pointerdown", handlePointerDown, {
            capture: true,
            passive: true,
        })

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown, {
                capture: true,
            })
        }
    }, [prefersReducedMotion])

    if (prefersReducedMotion) return null

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
            aria-hidden="true"
        />
    )
}