import React from "react"
import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#F4E7FF] bg-[#FFFDFD] py-6 text-xs text-[#4B4652] mt-auto">
      <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#111111]">CreatorBridge</span>
          <span className="text-[#9A6ADF]">•</span>
          <span>Where Brands Meet Creativity</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <Link to="/policies" className="hover:text-[#9A6ADF] transition-colors underline-offset-2 hover:underline">
            Platform Policies
          </Link>
          <span className="inline-flex items-center gap-1 text-[#9A6ADF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Commercial Generative Standards
          </span>
          <span className="text-[#4B4652]/60">© 2026 CreatorBridge</span>
        </div>
      </div>
    </footer>
  )
}
