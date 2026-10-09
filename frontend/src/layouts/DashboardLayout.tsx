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
    <div className="min-h-screen flex flex-col bg-[#FFFDFD] text-[#111111] font-sans selection:bg-[#9A6ADF]/20 selection:text-[#9A6ADF]">
      <Navbar />
      <div className="flex-1 flex container mx-auto px-4 sm:px-6">
        <Sidebar type={sidebarType} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
