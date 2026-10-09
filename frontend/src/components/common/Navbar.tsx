import React from "react"
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  User,
  FolderKanban,
  Wand2,
  Briefcase,
  FileText,
  Search,
  Sparkles,
  Megaphone,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isBrandHub = location.pathname.startsWith("/brand")

  const handleLogout = () => {
    logout()
    navigate("/auth")
  }

  // Hub-specific primary navigation links (strictly separated concerns)
  const creatorNavItems = [
    { to: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/creator/profile", label: "Profile & Skills", icon: User },
    { to: "/creator/portfolio", label: "Portfolio", icon: FolderKanban },
    { to: "/creator/studio", label: "AI Creation Studio", icon: Wand2 },
    { to: "/creator/projects", label: "Projects & Briefs", icon: Briefcase },
    { to: "/creator/settings/integrations", label: "Settings", icon: Settings },
  ]

  const brandNavItems = [
    { to: "/brand/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/brand/briefs", label: "Campaign Briefs", icon: FileText },
    { to: "/brand/briefs/new", label: "AI Brief Builder", icon: Sparkles },
    { to: "/brand/discover", label: "Discover Creators", icon: Search },
    { to: "/brand/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/brand/projects", label: "Active Projects", icon: Briefcase },
    { to: "/brand/settings/integrations", label: "Settings", icon: Settings },
  ]

  const navItems = isBrandHub ? brandNavItems : creatorNavItems

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#F4E7FF] bg-[#FFFDFD]/95 backdrop-blur-md shadow-2xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Top-Left: Official CreatorBridge Logo + Hub Badge */}
        <div className="flex items-center gap-6">
          <CreatorBridgeLogo
            to={isBrandHub ? "/brand/dashboard" : "/creator/dashboard"}
            badgeText={isBrandHub ? "Brand Hub" : "Creator Hub"}
          />

          {/* Desktop Hub Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/creator/dashboard" || item.to === "/brand/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-[#F4E7FF] text-[#9A6ADF] font-bold shadow-2xs border border-[#D8B8FF]/60"
                        : "text-[#4B4652] hover:text-[#9A6ADF] hover:bg-[#F4E7FF]/40"
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Right Actions: Public Switcher, Role Badge & Auth */}
        <div className="flex items-center gap-3">
          {/* Quick link to public view or home */}
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1 text-xs text-[#4B4652] hover:text-[#9A6ADF] px-2.5 py-1 rounded-lg border border-transparent hover:border-[#F4E7FF] hover:bg-[#F4E7FF]/30 transition-colors"
            title="Go to CreatorBridge Homepage"
          >
            <span>Home</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          {/* Public Talent Discovery Link for Quick Access */}
          <Link
            to="/discover"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold text-[#9A6ADF] bg-[#F4E7FF]/60 hover:bg-[#F4E7FF] px-2.5 py-1 rounded-lg border border-[#D8B8FF] transition-colors"
          >
            <Search className="h-3 w-3" />
            <span>Find Talent</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Badge variant="purple" className="hidden sm:inline-flex text-[11px] font-semibold">
                {user.role}
              </Badge>

              <div className="text-xs text-right hidden md:block">
                <p className="font-semibold text-[#111111] leading-tight">
                  {user.fullName || user.email}
                </p>
                <p className="text-[11px] text-[#4B4652]">{user.email}</p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-[#4B4652] hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="primary" size="sm" className="text-xs">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
