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
  KeyRound,
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
    <aside className="w-64 border-r border-[#F4E7FF] dark:border-[#2D2447] bg-white/70 dark:bg-[#181524]/80 p-4 shrink-0 hidden md:flex flex-col justify-between transition-colors duration-200">
      <div>
        <div className="mb-4 px-3 py-2 rounded-xl bg-[#F4E7FF]/50 dark:bg-[#231C35]/60 border border-[#D8B8FF]/50 dark:border-[#3E325D]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A6ADF] dark:text-[#B78AF7]">
            {type === "creator" ? "Creator Hub" : "Brand Hub"}
          </p>
          <p className="text-[10px] text-[#4B4652] dark:text-[#C7C3D4] mt-0.5">
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
                      ? "bg-[#F4E7FF] text-[#9A6ADF] dark:bg-[#231C35] dark:text-[#B78AF7] font-bold shadow-2xs border-l-3 border-[#9A6ADF] dark:border-[#B78AF7]"
                      : "text-[#4B4652] dark:text-[#C7C3D4] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/40 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7]"
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

      <div className="pt-4 border-t border-[#F4E7FF] dark:border-[#2D2447] space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#4B4652] dark:text-[#A9A3B8] mb-2">
          Hub Configuration
        </p>
        <NavLink
          to={`/${type}/settings/integrations`}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-[#F4E7FF] text-[#9A6ADF] dark:bg-[#231C35] dark:text-[#B78AF7] font-bold shadow-2xs border-l-3 border-[#9A6ADF] dark:border-[#B78AF7]"
                : "text-[#4B4652] dark:text-[#C7C3D4] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/40 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7]"
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>{type === "creator" ? "Creator Settings" : "Brand Settings"}</span>
        </NavLink>

        <NavLink
          to="/discover"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#4B4652] dark:text-[#C7C3D4] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/40 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[#9A6ADF] dark:text-[#B78AF7]" />
            <span>Explore Creators</span>
          </div>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </NavLink>
      </div>
    </aside>
  )
}
