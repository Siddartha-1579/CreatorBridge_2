import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation } from "react-router-dom"

interface FloatingBadge {
    id: number
    kind: "like" | "comment" | "spark"
    label: string
    x: number
    y: number
    z: number
    rotX: number
    rotY: number
    scale: number
    delay: number
    duration: number
}

// Anchored to far outer edges so main content, search bars, and cards stay clear
const BADGES: FloatingBadge[] = [
    { id: 1, kind: "like", label: "4.8K Likes", x: 1.5, y: 15, z: 16, rotX: 8, rotY: -10, scale: 0.9, delay: 0, duration: 5.8 },
    { id: 2, kind: "comment", label: "320 Comments", x: 88.5, y: 15, z: 16, rotX: -8, rotY: 10, scale: 0.9, delay: 0.7, duration: 6.2 },
    { id: 3, kind: "spark", label: "98% AI Match", x: 1.5, y: 84, z: 18, rotX: 8, rotY: 8, scale: 0.88, delay: 1.3, duration: 6.0 },
    { id: 4, kind: "like", label: "+1.4K Boost", x: 88.5, y: 84, z: 18, rotX: -8, rotY: -8, scale: 0.9, delay: 0.4, duration: 5.6 },
]

export const CreatorBurst3D: React.FC = () => {
    const { pathname } = useLocation()
    const [pulseKey, setPulseKey] = useState(0)
    const [scrollFade, setScrollFade] = useState(1)
    const [scrollOffsetY, setScrollOffsetY] = useState(0)

    // Only show floating margin badges on the home page so discovery & portal screens stay clean
    const isAllowedRoute = pathname === "/"

    useEffect(() => {
        if (!isAllowedRoute) return
        const observer = new MutationObserver(() => {
            setPulseKey((prev) => prev + 1)
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "class"],
        })
        return () => observer.disconnect()
    }, [isAllowedRoute])

    useEffect(() => {
        if (!isAllowedRoute) return
        const handleScroll = () => {
            const y = window.scrollY || window.pageYOffset || 0
            const fade = Math.max(0, Math.min(1, 1 - y / 220))
            setScrollFade(fade)
            setScrollOffsetY(-Math.min(90, y * 0.25))
        }

        handleScroll()
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isAllowedRoute])

    if (!isAllowedRoute || scrollFade <= 0.01) return null

    return createPortal(
        <div
            key={pulseKey}
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-150 hidden xl:block"
            style={{
                zIndex: 15,
                perspective: "1000px",
                opacity: scrollFade * 0.78,
                transform: `translate3d(0, ${scrollOffsetY}px, 0)`,
            }}
        >
            {BADGES.map((b) => (
                <div
                    key={b.id}
                    className="cb-creator-float-3d absolute flex items-center gap-1.5 px-2.5 py-1 rounded-xl border backdrop-blur-md"
                    style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                        boxShadow:
                            "0 8px 20px -8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                        ["--start-rot-x" as string]: `${b.rotX}deg`,
                        ["--start-rot-y" as string]: `${b.rotY}deg`,
                        ["--start-z" as string]: `${b.z}px`,
                        ["--badge-scale" as string]: `${b.scale}`,
                        animation: `cbCreatorDrift3D ${b.duration}s ease-in-out ${b.delay}s infinite`,
                    }}
                >
                    <span
                        className="flex items-center justify-center w-4 h-4 rounded-full"
                        style={{
                            backgroundColor: "var(--accent-soft)",
                            color: "var(--accent-primary)",
                        }}
                    >
                        {b.kind === "like" && (
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        )}
                        {b.kind === "comment" && (
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                            </svg>
                        )}
                        {b.kind === "spark" && (
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
                            </svg>
                        )}
                    </span>
                    <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                        {b.label}
                    </span>
                </div>
            ))}
        </div>,
        document.body
    )
}

export default CreatorBurst3D