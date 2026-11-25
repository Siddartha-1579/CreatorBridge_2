import React, { useState } from "react"
import { motion } from "framer-motion"

interface FlipShowcaseCardProps {
    front: React.ReactNode
    back: React.ReactNode
    className?: string
}

export const FlipShowcaseCard: React.FC<FlipShowcaseCardProps> = ({
    front,
    back,
    className = "",
}) => {
    const [flipped, setFlipped] = useState(false)

    return (
        <div
            className={`cb-3d-stage cursor-pointer select-none ${className}`}
            onClick={() => setFlipped((prev) => !prev)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setFlipped((prev) => !prev)
                }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
        >
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full"
            >
                <div style={{ backfaceVisibility: "hidden" }}>{front}</div>
                <div
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                    className="absolute inset-0"
                >
                    {back}
                </div>
            </motion.div>
        </div>
    )
}

interface ReactionPopButtonProps {
    active?: boolean
    onClick?: () => void
    children: React.ReactNode
    className?: string
}

export const ReactionPopButton: React.FC<ReactionPopButtonProps> = ({
    active = false,
    onClick,
    children,
    className = "",
}) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ y: -1, z: 6 }}
            whileTap={{ scale: 0.9, rotateZ: active ? -4 : 4, z: 2 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            style={{ transformStyle: "preserve-3d" }}
            className={`inline-flex items-center gap-1.5 ${className}`}
        >
            {children}
        </motion.button>
    )
}