import React, { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface Point3D {
    x: number
    y: number
    z: number
    vx?: number
    vy?: number
    vz?: number
}

// Convert any CSS hex/rgb color to "r, g, b" for canvas rgba()
function parseColorToRGB(color: string): string {
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return "45, 212, 191"
    ctx.fillStyle = color.trim() || "#2DD4BF"
    const computed = ctx.fillStyle

    if (computed.startsWith("#")) {
        const hex = computed.slice(1)
        const fullHex =
            hex.length === 3
                ? hex.split("").map((c) => c + c).join("")
                : hex
        const num = parseInt(fullHex, 16)
        return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`
    }

    const match = computed.match(/\d+/g)
    if (match && match.length >= 3) {
        return `${match[0]}, ${match[1]}, ${match[2]}`
    }
    return "45, 212, 191"
}

export const Background3D: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId = 0
        let width = window.innerWidth
        let height = window.innerHeight

        // Dynamic theme color state
        let accentRGB = "45, 212, 191"
        let isDark = document.documentElement.classList.contains("dark")

        const syncThemeColor = () => {
            const styles = getComputedStyle(document.documentElement)
            const primary = styles.getPropertyValue("--accent-primary").trim()
            accentRGB = parseColorToRGB(primary || "#2DD4BF")
            isDark = document.documentElement.classList.contains("dark")
        }
        syncThemeColor()

        // Watch for theme switches on <html>
        const observer = new MutationObserver(syncThemeColor)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "class"],
        })

        // Resize handler with sharp Retina/DPI scaling
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            width = window.innerWidth
            height = window.innerHeight
            canvas.width = width * dpr
            canvas.height = height * dpr
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener("resize", resize)

        // Build 3D Icosahedron vertices (12 vertices, 30 edges)
        const phi = (1 + Math.sqrt(5)) / 2
        const rawVertices: [number, number, number][] = [
            [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
            [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
            [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
        ]

        const icoVertices: Point3D[] = rawVertices.map(([x, y, z]) => {
            const len = Math.hypot(x, y, z)
            return { x: x / len, y: y / len, z: z / len }
        })

        const icoEdges: [number, number][] = []
        for (let i = 0; i < icoVertices.length; i++) {
            for (let j = i + 1; j < icoVertices.length; j++) {
                const d = Math.hypot(
                    icoVertices[i].x - icoVertices[j].x,
                    icoVertices[i].y - icoVertices[j].y,
                    icoVertices[i].z - icoVertices[j].z
                )
                if (d < 1.15) icoEdges.push([i, j])
            }
        }

        // Build floating 3D particle cloud
        const particles: Point3D[] = Array.from({ length: 48 }, () => ({
            x: (Math.random() - 0.5) * 1200,
            y: (Math.random() - 0.5) * 800,
            z: (Math.random() - 0.5) * 600,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            vz: (Math.random() - 0.5) * 0.25,
        }))

        // Mouse parallax tracking
        let mouseX = 0
        let mouseY = 0
        let smoothMouseX = 0
        let smoothMouseY = 0

        const onMouseMove = (e: MouseEvent) => {
            mouseX = (e.clientX / width - 0.5) * 2
            mouseY = (e.clientY / height - 0.5) * 2
        }
        window.addEventListener("mousemove", onMouseMove, { passive: true })

        // 3D rotation helper
        const rotate3D = (p: Point3D, rx: number, ry: number): Point3D => {
            const cosY = Math.cos(ry)
            const sinY = Math.sin(ry)
            const x1 = p.x * cosY - p.z * sinY
            const z1 = p.x * sinY + p.z * cosY

            const cosX = Math.cos(rx)
            const sinX = Math.sin(rx)
            const y2 = p.y * cosX - z1 * sinX
            const z2 = p.y * sinX + z1 * cosX

            return { x: x1, y: y2, z: z2 }
        }

        let angleX = 0.2
        let angleY = 0

        const render = () => {
            ctx.clearRect(0, 0, width, height)

            // Smoothly follow mouse
            smoothMouseX += (mouseX - smoothMouseX) * 0.05
            smoothMouseY += (mouseY - smoothMouseY) * 0.05

            angleY += 0.0028
            angleX += 0.0014

            const rotY = angleY + smoothMouseX * 0.55
            const rotX = angleX + smoothMouseY * 0.35

            const fov = 700
            const baseAlpha = isDark ? 0.22 : 0.16

            // 1. Draw Floating 3D Particle Constellation
            const projectedParticles: { x: number; y: number; z: number; scale: number }[] = []

            for (const p of particles) {
                p.x += p.vx || 0
                p.y += p.vy || 0
                p.z += p.vz || 0

                if (Math.abs(p.x) > 650) p.vx = -(p.vx || 0)
                if (Math.abs(p.y) > 450) p.vy = -(p.vy || 0)
                if (Math.abs(p.z) > 350) p.vz = -(p.vz || 0)

                const rotated = rotate3D(p, smoothMouseY * 0.18, smoothMouseX * 0.22)
                const depth = fov + rotated.z + 450
                if (depth <= 10) continue

                const scale = fov / depth
                const sx = width / 2 + rotated.x * scale
                const sy = height / 2 + rotated.y * scale

                projectedParticles.push({ x: sx, y: sy, z: rotated.z, scale })

                ctx.beginPath()
                ctx.arc(sx, sy, Math.max(1.2, 2.2 * scale), 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${accentRGB}, ${Math.min(0.6, baseAlpha * 1.8 * scale)})`
                ctx.fill()
            }

            // Connect nearby 3D particles
            ctx.lineWidth = 0.75
            for (let i = 0; i < projectedParticles.length; i++) {
                for (let j = i + 1; j < projectedParticles.length; j++) {
                    const a = projectedParticles[i]
                    const b = projectedParticles[j]
                    const dist = Math.hypot(a.x - b.x, a.y - b.y)
                    if (dist < 135) {
                        const lineAlpha = (1 - dist / 135) * (isDark ? 0.16 : 0.12)
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = `rgba(${accentRGB}, ${lineAlpha})`
                        ctx.stroke()
                    }
                }
            }

            // 2. Draw Two Floating 3D Wireframe Polyhedrons (Left & Right Depth Anchors)
            const shapes = [
                { cx: width * 0.14, cy: height * 0.34, radius: Math.min(width, height) * 0.17, mult: 1 },
                { cx: width * 0.86, cy: height * 0.68, radius: Math.min(width, height) * 0.19, mult: -0.85 },
            ]

            for (const shape of shapes) {
                const projected = icoVertices.map((v) => {
                    const r = rotate3D(
                        { x: v.x * shape.radius, y: v.y * shape.radius, z: v.z * shape.radius },
                        rotX * shape.mult,
                        rotY * shape.mult
                    )
                    const scale = fov / (fov + r.z + 320)
                    return {
                        x: shape.cx + r.x * scale,
                        y: shape.cy + r.y * scale,
                        z: r.z,
                        scale,
                    }
                })

                // Wireframe edges
                ctx.lineWidth = 1.15
                for (const [i, j] of icoEdges) {
                    const a = projected[i]
                    const b = projected[j]
                    const avgScale = (a.scale + b.scale) / 2
                    ctx.beginPath()
                    ctx.moveTo(a.x, a.y)
                    ctx.lineTo(b.x, b.y)
                    ctx.strokeStyle = `rgba(${accentRGB}, ${baseAlpha * avgScale * 1.15})`
                    ctx.stroke()
                }

                // Glowing vertices
                for (const pt of projected) {
                    ctx.beginPath()
                    ctx.arc(pt.x, pt.y, Math.max(1.8, 2.8 * pt.scale), 0, Math.PI * 2)
                    ctx.fillStyle = `rgba(${accentRGB}, ${Math.min(0.7, baseAlpha * 2.1 * pt.scale)})`
                    ctx.fill()
                }
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener("resize", resize)
            window.removeEventListener("mousemove", onMouseMove)
            observer.disconnect()
        }
    }, [])

    return createPortal(
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 25 }}
        />,
        document.body
    )
}

export default Background3D