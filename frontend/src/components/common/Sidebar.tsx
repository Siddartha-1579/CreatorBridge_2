import React from "react"
import { NavLink } from "react-router-dom"
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
    <aside className="w-64 border-r border-[var(--color-border,#F4E7FF)] bg-[var(--color-surface,#FFFFFF)]/75 p-4 shrink-0 hidden md:flex flex-col justify-between transition-colors duration-200">
      <div>
        <div className="mb-4 px-3 py-2 rounded-xl bg-[var(--color-surface-muted,#F4EEE8)]/70 border border-[var(--color-border,#EADCDF)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary,#8B0015)]">
            {type === "creator" ? "Creator Hub" : "Brand Hub"}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted,#5E454B)] mt-0.5">
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-primary,#8B0015)] font-bold shadow-2xs border-l-3 border-[var(--color-primary,#8B0015)]"
                      : "text-[var(--color-text-muted,#5E454B)] hover:bg-[var(--color-surface-muted,#F4EEE8)]/60 hover:text-[var(--color-primary,#8B0015)]"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[var(--color-border,#F4E7FF)] space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted,#5E454B)] mb-2">
          Hub Configuration
        </p>
        <NavLink
          to={`/${type}/settings/integrations`}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-[var(--color-surface-muted,#F4EEE8)] text-[var(--color-primary,#8B0015)] font-bold shadow-2xs border-l-3 border-[var(--color-primary,#8B0015)]"
                : "text-[var(--color-text-muted,#5E454B)] hover:bg-[var(--color-surface-muted,#F4EEE8)]/60 hover:text-[var(--color-primary,#8B0015)]"
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{type === "creator" ? "Creator Settings" : "Brand Settings"}</span>
        </NavLink>

        <NavLink
          to="/discover"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-text-muted,#5E454B)] hover:bg-[var(--color-surface-muted,#F4EEE8)]/60 hover:text-[var(--color-primary,#8B0015)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-primary,#8B0015)]" />
            <span>Explore Creators</span>
          </div>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </NavLink>
      </div>
    </aside>
  )
}
