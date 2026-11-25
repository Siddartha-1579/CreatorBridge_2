import React, { useRef } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
} from "framer-motion"

interface TiltCardProps {
    children: React.ReactNode
    className?: string
    maxTilt?: number // Capped to 2deg - 4deg for sharp dashboard readability
    entranceDelay?: number
}

export const TiltDashboardCard: React.FC<TiltCardProps> = ({
    children,
    className = "",
    maxTilt = 3,
    entranceDelay = 0,
}) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const prefersReducedMotion = useReducedMotion()

    const pointerX = useMotionValue(0.5)
    const pointerY = useMotionValue(0.5)

    const smoothX = useSpring(pointerX, { stiffness: 260, damping: 24, mass: 0.6 })
    const smoothY = useSpring(pointerY, { stiffness: 260, damping: 24, mass: 0.6 })

    const rotateY = useTransform(smoothX, [0, 1], [-maxTilt, maxTilt])
    const rotateX = useTransform(smoothY, [0, 1], [maxTilt, -maxTilt])

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (prefersReducedMotion || !cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const nx = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
        const ny = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1)

        pointerX.set(nx)
        pointerY.set(ny)

        cardRef.current.style.setProperty("--sheen-x", `${(nx * 100).toFixed(1)}%`)
        cardRef.current.style.setProperty("--sheen-y", `${(ny * 100).toFixed(1)}%`)
    }

    const handlePointerLeave = () => {
        pointerX.set(0.5)
        pointerY.set(0.5)
        if (cardRef.current) {
            cardRef.current.style.setProperty("--sheen-x", "50%")
            cardRef.current.style.setProperty("--sheen-y", "50%")
        }
    }

    return (
        <div className="cb-3d-stage">
            <motion.div
                ref={cardRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                initial={
                    prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.3,
                    delay: entranceDelay,
                    ease: [0.22, 1, 0.36, 1],
                }}
                style={
                    prefersReducedMotion
                        ? undefined
                        : {
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d",
                        }
                }
                className={`cb-3d-card ${className}`}
            >
                <div className="cb-3d-sheen" aria-hidden="true" />
                {children}
            </motion.div>
        </div>
    )
}

interface DepthEntranceProps {
    children: React.ReactNode
    className?: string
    delay?: number
}

export const DepthEntrancePanel: React.FC<DepthEntranceProps> = ({
    children,
    className = "",
    delay = 0,
}) => {
    const prefersReducedMotion = useReducedMotion()

    return (
        <div className="cb-3d-stage">
            <motion.div
                initial={
                    prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.3,
                    delay,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className={className}
            >
                {children}
            </motion.div>
        </div>
    )
}

interface NavPillItemProps {
    layoutId: string
    active: boolean
    onClick: () => void
    children: React.ReactNode
    className?: string
    pillClassName?: string
}

export const NavPillItem: React.FC<NavPillItemProps> = ({
    layoutId,
    active,
    onClick,
    children,
    className = "",
    pillClassName = "",
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative isolate flex items-center gap-2 transition-colors ${className}`}
        >
            {active && (
                <motion.span
                    layoutId={layoutId}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className={`absolute inset-0 -z-10 rounded-lg shadow-xs ${pillClassName}`}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </button>
    )
}