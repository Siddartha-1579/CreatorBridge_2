import React from "react"
import { Link } from "react-router-dom"
import { Sparkles, ArrowUpRight, ShieldCheck, Heart } from "lucide-react"

export const PublicFooter: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const headerOffset = 80
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }

  return (
    <footer className="border-t border-[#F4E7FF] bg-[#FFFDFD] py-12 md:py-16 text-[#4B4652]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block" aria-label="CreatorBridge - Where Brands Meet Creativity">
              <img
                src="/creatorbridge-logo-transparent.png"
                alt="CreatorBridge - Where Brands Meet Creativity"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-[#4B4652] leading-relaxed max-w-xs">
              Where Brands Meet Creativity. The intelligent marketplace connecting specialized generative artists with world-class commercial brands.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#9A6ADF] font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#9A6ADF]" />
              Verified Commercial Generative Standards
            </div>
          </div>

          {/* Col 2: Marketplace Navigation */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Platform
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollTo("problem")}
                  className="hover:text-[#9A6ADF] transition-colors cursor-pointer"
                >
                  The Marketplace Gap
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("economy")}
                  className="hover:text-[#9A6ADF] transition-colors cursor-pointer"
                >
                  AI Creative Economy
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="hover:text-[#9A6ADF] transition-colors cursor-pointer"
                >
                  End-to-End Workflow
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("trust")}
                  className="hover:text-[#9A6ADF] transition-colors cursor-pointer"
                >
                  Trust & Verification Standards
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Creator Portals */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Creator Hub
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/creator/dashboard"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] transition-colors"
                >
                  Creator Dashboard <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/creator/campaigns"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] transition-colors"
                >
                  Creator Campaigns <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/creator/portfolio"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] transition-colors"
                >
                  AI Portfolio Showcase <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] transition-colors"
                >
                  Explore AI Creators <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Pillars */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Commercial Guarantee
            </p>
            <p className="text-xs text-[#4B4652] leading-relaxed">
              Every commission on CreatorBridge includes commercial IP handover, milestone escrow safety, and explainable AI match scoring.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#F4E7FF] text-[#9A6ADF] text-[11px] font-semibold border border-[#D8B8FF]">
                100% Commercial IP Protection
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#FFF4E5] text-[#b46b14] text-[11px] font-semibold border border-[#FFD7A8]">
                Milestone Escrow
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#F4E7FF] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4B4652]">
          <p>© 2026 CreatorBridge. All rights reserved. Where Brands Meet Creativity.</p>
          <p className="text-xs text-[#4B4652]">
            Intelligent AI Creator Marketplace
          </p>
        </div>
      </div>
    </footer>
  )
}
