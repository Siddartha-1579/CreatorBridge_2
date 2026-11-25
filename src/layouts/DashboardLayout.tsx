import React from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Navbar } from "@/components/common/Navbar"
import { Sidebar } from "@/components/common/Sidebar"
import { Footer } from "@/components/common/Footer"

export const DashboardLayout: React.FC = () => {
  const location = useLocation()
  const isBrand = location.pathname.startsWith("/brand")
  const sidebarType = isBrand ? "brand" : "creator"

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[var(--bg-page)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-soft)] selection:text-[var(--accent-primary)] transition-colors duration-200">
      {/* Background Cubes, Spheres & Subtle Wave Motion */}
      <div className="cb-bg-motion-stage" aria-hidden="true">
        <div className="cb-bg-wave-layer" />

        <span className="cb-bg-sphere cb-bg-sphere--1" />
        <span className="cb-bg-sphere cb-bg-sphere--2" />
        <span className="cb-bg-sphere cb-bg-sphere--3" />

        <div className="cb-bg-cube cb-bg-cube--1">
          <span className="cb-cube-face cb-cube-front" />
          <span className="cb-cube-face cb-cube-back" />
          <span className="cb-cube-face cb-cube-left" />
          <span className="cb-cube-face cb-cube-right" />
          <span className="cb-cube-face cb-cube-top" />
          <span className="cb-cube-face cb-cube-bottom" />
        </div>

        <div className="cb-bg-cube cb-bg-cube--2">
          <span className="cb-cube-face cb-cube-front" />
          <span className="cb-cube-face cb-cube-back" />
          <span className="cb-cube-face cb-cube-left" />
          <span className="cb-cube-face cb-cube-right" />
          <span className="cb-cube-face cb-cube-top" />
          <span className="cb-cube-face cb-cube-bottom" />
        </div>

        <div className="cb-bg-cube cb-bg-cube--3">
          <span className="cb-cube-face cb-cube-front" />
          <span className="cb-cube-face cb-cube-back" />
          <span className="cb-cube-face cb-cube-left" />
          <span className="cb-cube-face cb-cube-right" />
          <span className="cb-cube-face cb-cube-top" />
          <span className="cb-cube-face cb-cube-bottom" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <Navbar />
        <div className="flex-1 flex w-full">
          <Sidebar type={sidebarType} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0 bg-transparent">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </div>
  )
}