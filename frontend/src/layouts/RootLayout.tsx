import React from "react"
import { Outlet } from "react-router-dom"
import { PublicHeader } from "@/components/common/PublicHeader"
import { PublicFooter } from "@/components/common/PublicFooter"

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDFD] dark:bg-[#0F0D15] text-[#111111] dark:text-[#F5F3F8] font-sans selection:bg-[#9A6ADF]/20 selection:text-[#9A6ADF] w-full max-w-full overflow-x-hidden transition-colors duration-200">
      <PublicHeader />
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
