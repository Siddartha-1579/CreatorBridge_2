import React from "react"
import { Outlet } from "react-router-dom"
import { PublicHeader } from "@/components/common/PublicHeader"
import { PublicFooter } from "@/components/common/PublicFooter"

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] font-sans selection:bg-[var(--color-primary)]/20 selection:text-[var(--color-primary)] w-full max-w-full overflow-x-hidden transition-colors duration-200">
      <PublicHeader />
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
