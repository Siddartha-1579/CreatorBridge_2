import React from "react"
import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  FolderKanban,
  Wand2,
  Briefcase,
  Search,
  Megaphone,
  FileText,
  Sparkles,
  Settings,
  ExternalLink,
  Video,
  MessageSquare,
} from "lucide-react"

interface SidebarProps {
  type: "creator" | "brand"
}

export const Sidebar: React.FC<SidebarProps> = ({ type }) => {
  const creatorLinks = [
    { to: "/creator/dashboard", label: "Creator Dashboard", icon: LayoutDashboard },
    { to: "/creator/campaigns", label: "Campaigns & Rewards", icon: Megaphone },
    { to: "/creator/submissions", label: "My Submissions", icon: Video },
    { to: "/creator/community", label: "Brand Updates Feed", icon: MessageSquare },
    { to: "/creator/profile", label: "Profile & Skills", icon: User },
    { to: "/creator/portfolio", label: "Portfolio", icon: FolderKanban },
    { to: "/creator/studio", label: "AI Creation Studio", icon: Wand2 },
    { to: "/creator/projects", label: "Projects & Bids", icon: Briefcase },
    { to: "/discover", label: "Explore Creators", icon: Search },
  ]

  const brandLinks = [
    { to: "/brand/dashboard", label: "Brand Dashboard", icon: LayoutDashboard },
    { to: "/brand/campaigns", label: "Campaigns & Rewards", icon: Megaphone },
    { to: "/brand/community", label: "Community Board", icon: MessageSquare },
    { to: "/brand/briefs", label: "Campaign Briefs", icon: FileText },
    { to: "/brand/briefs/new", label: "AI Brief Builder", icon: Sparkles },
    { to: "/brand/discover", label: "Discover Creators", icon: Search },
    { to: "/brand/projects", label: "Active Projects", icon: Briefcase },
  ]

  const links = type === "creator" ? creatorLinks : brandLinks

  return (
    <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shrink-0 hidden md:flex flex-col justify-between transition-colors duration-200">
      <div>
        <div className="mb-5 px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
            {type === "creator" ? "Creator Hub" : "Brand Hub"}
          </p>
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
            {type === "creator"
              ? "Generative Artist Workspace"
              : "Commercial Brand Management"}
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/creator/dashboard" || link.to === "/brand/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "relative isolate flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "text-[var(--accent-primary)] dark:text-white font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId={`sidebar-active-pill-${type}`}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 -z-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-glow)] shadow-xs"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 cb-3d-icon-badge transition-transform",
                        isActive
                          ? "scale-105 text-[var(--accent-primary)]"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    />
                    <span>{link.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
          Hub Configuration
        </p>
        <NavLink
          to={`/${type}/settings/integrations`}
          className={({ isActive }) =>
            cn(
              "relative isolate flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors",
              isActive
                ? "text-[var(--accent-primary)] dark:text-white font-bold"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId={`sidebar-active-pill-${type}`}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 -z-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-glow)] shadow-xs"
                />
              )}
              <Settings
                className={cn(
                  "h-4 w-4 shrink-0 cb-3d-icon-badge transition-transform",
                  isActive
                    ? "scale-105 text-[var(--accent-primary)]"
                    : "text-slate-600 dark:text-slate-400"
                )}
              />
              <span>{type === "creator" ? "Creator Settings" : "Brand Settings"}</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/discover"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[var(--bg-subtle)] hover:text-slate-950 dark:hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--accent-primary)] cb-3d-icon-badge" />
            <span>Explore Creators</span>
          </div>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </NavLink>
      </div>
    </aside>
  )
}