import React from "react"
import { Outlet } from "react-router-dom"
import { Navbar } from "@/components/common/Navbar"
import { Footer } from "@/components/common/Footer"

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDFD] text-[#111111] dark:bg-[#0F0D15] dark:text-zinc-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
