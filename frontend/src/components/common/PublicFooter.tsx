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
    <footer className="border-t border-[var(--color-border,#F4E7FF)] bg-[var(--color-surface,#FFFDFD)] py-12 md:py-16 text-[var(--color-text-muted,#4B4652)] transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="inline-block" aria-label="CreatorBridge - Where Brands Meet Creativity">
              <img
                src="/creatorbridge-logo-transparent.png"
                alt="CreatorBridge - Where Brands Meet Creativity"
                className="h-9 w-auto object-contain dark:brightness-110"
              />
            </Link>
            <p className="text-xs text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed max-w-xs">
              Where Brands Meet Creativity. The intelligent marketplace connecting specialized generative artists with world-class commercial brands.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#9A6ADF] dark:text-[#B78AF7] font-semibold">
              <ShieldCheck className="h-4 w-4 text-[#9A6ADF] dark:text-[#B78AF7]" />
              Verified Commercial Generative Standards
            </div>
          </div>

          {/* Col 2: Marketplace Navigation */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#F5F3F8]">
              Platform
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollTo("problem")}
                  className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors cursor-pointer"
                >
                  The Marketplace Gap
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("economy")}
                  className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors cursor-pointer"
                >
                  AI Creative Economy
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("how-it-works")}
                  className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors cursor-pointer"
                >
                  End-to-End Workflow
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo("trust")}
                  className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors cursor-pointer"
                >
                  Trust & Verification Standards
                </button>
              </li>
              <li>
                <Link
                  to="/policies"
                  className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors inline-flex items-center gap-1"
                >
                  Platform Policies & Legal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Creator Portals */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#F5F3F8]">
              Creator Hub
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/creator/dashboard"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
                >
                  Creator Dashboard <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/creator/campaigns"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
                >
                  Creator Campaigns <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/creator/portfolio"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
                >
                  AI Portfolio Showcase <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-1 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
                >
                  Explore AI Creators <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Pillars */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#F5F3F8]">
              Commercial Guarantee
            </p>
            <p className="text-xs text-[#4B4652] dark:text-[#C7C3D4] leading-relaxed">
              Every commission on CreatorBridge includes commercial IP handover, milestone escrow safety, and explainable AI match scoring.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#F4E7FF] dark:bg-[#231C35] text-[#9A6ADF] dark:text-[#B78AF7] text-[11px] font-semibold border border-[#D8B8FF] dark:border-[#3E325D]">
                100% Commercial IP Protection
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#FFF4E5] dark:bg-[#342416] text-[#b46b14] dark:text-[#f0b561] text-[11px] font-semibold border border-[#FFD7A8] dark:border-[#523E28]">
                Milestone Escrow
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#F4E7FF] dark:border-[#2D2447] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4B4652] dark:text-[#C7C3D4]">
          <p>© 2026 CreatorBridge. All rights reserved. Where Brands Meet Creativity.</p>
          <div className="flex items-center gap-2">
            <Link to="/policies" className="hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors underline-offset-2 hover:underline">
              Platform Policies
            </Link>
            <span>•</span>
            <span>Intelligent AI Creator Marketplace</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
