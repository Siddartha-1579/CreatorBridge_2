import React from "react"
import { Outlet } from "react-router-dom"
import { PublicHeader } from "@/components/common/PublicHeader"
import { PublicFooter } from "@/components/common/PublicFooter"

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDFD] text-[#111111] font-sans selection:bg-[#9A6ADF]/20 selection:text-[#9A6ADF]">
      <PublicHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
