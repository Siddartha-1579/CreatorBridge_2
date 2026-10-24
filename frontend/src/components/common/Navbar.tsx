import React, { useState, useRef, useEffect } from "react"
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeSelector } from "@/components/common/ThemeSelector"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOutsideClick } from "@/hooks/useOutsideClick"
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
  Video,
  MessageSquare,
  ChevronDown,
  Menu,
  X,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const isBrandHub = location.pathname.startsWith("/brand")

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setMoreMenuOpen(false)
  }, [location.pathname])

  // Close "More" dropdown when clicking outside
  useOutsideClick(moreMenuRef, () => {
    setMoreMenuOpen(false)
  })

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false)
        setMoreMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/auth")
  }

  // Hub-specific primary navigation links (strictly separated concerns)
  const creatorNavItems = [
    { to: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/creator/campaigns", label: "Campaigns & Rewards", icon: Megaphone },
    { to: "/creator/submissions", label: "My Submissions", icon: Video },
    { to: "/creator/community", label: "Brand Updates", icon: MessageSquare },
    { to: "/creator/profile", label: "Profile", icon: User },
    { to: "/creator/portfolio", label: "Portfolio", icon: FolderKanban },
    { to: "/creator/studio", label: "Studio", icon: Wand2 },
    { to: "/discover", label: "Explore Creators", icon: Search },
    { to: "/creator/settings/integrations", label: "Settings", icon: Settings },
  ]

  const brandNavItems = [
    { to: "/brand/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/brand/campaigns", label: "Campaigns & Rewards", icon: Megaphone },
    { to: "/brand/community", label: "Community", icon: MessageSquare },
    { to: "/brand/briefs", label: "Briefs", icon: FileText },
    { to: "/brand/briefs/new", label: "AI Brief Builder", icon: Sparkles },
    { to: "/brand/discover", label: "Discover", icon: Search },
    { to: "/brand/projects", label: "Projects", icon: Briefcase },
    { to: "/brand/settings/integrations", label: "Settings", icon: Settings },
  ]

  const allNavItems = isBrandHub ? brandNavItems : creatorNavItems
  const primaryNavItems = allNavItems.slice(0, 4)
  const secondaryNavItems = allNavItems.slice(4)

  const isSecondaryActive = secondaryNavItems.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/")
  )

  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U"

  const notificationsUrl = isBrandHub ? "/brand/community" : "/creator/community"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-2xs transition-colors duration-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
        {/* =================================================================== */}
        {/* ZONE 1 (LEFT): Official Logo + Hub Badge                            */}
        {/* =================================================================== */}
        <div className="flex items-center shrink-0">
          <CreatorBridgeLogo
            to={isBrandHub ? "/brand/dashboard" : "/creator/dashboard"}
            badgeText={isBrandHub ? "Brand Hub" : "Creator Hub"}
          />
        </div>

        {/* =================================================================== */}
        {/* ZONE 2 (MIDDLE): Navigation in the Middle (Clean & Centered)        */}
        {/* =================================================================== */}
        <nav
          className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0 px-2"
          aria-label="Portal Navigation"
        >
          {/* Top Primary Navigation Items */}
          <div className="flex items-center gap-1 shrink-0">
            {primaryNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/creator/dashboard" || item.to === "/brand/dashboard"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-[#F4E7FF] text-[#9A6ADF] dark:bg-[#231C35] dark:text-[#B78AF7] font-bold shadow-2xs border border-[#D8B8FF]/60 dark:border-[#3E325D]"
                        : "text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/50"
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}

            {/* "More" Accessible Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                aria-label="More navigation items"
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                  isSecondaryActive || moreMenuOpen
                    ? "bg-[#F4E7FF] text-[#9A6ADF] dark:bg-[#231C35] dark:text-[#B78AF7] font-bold border border-[#D8B8FF]/60 dark:border-[#3E325D]"
                    : "text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/50"
                )}
              >
                <span>More</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", moreMenuOpen && "rotate-180")} />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl border border-[#D8B8FF] dark:border-[#2D2447] bg-white dark:bg-[#181524] p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 z-50">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            isActive
                              ? "bg-[#F4E7FF] text-[#9A6ADF] dark:bg-[#231C35] dark:text-[#B78AF7] font-bold"
                              : "text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/50"
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* =================================================================== */}
        {/* ZONE 3 (RIGHT): Theme Toggle, Notifications & Account Controls      */}
        {/* =================================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Notifications Shortcut Link */}
          {isAuthenticated && (
            <Link
              to={notificationsUrl}
              className="relative p-2 rounded-lg text-[#4B4652] dark:text-[#C7C3D4] hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/50 transition-colors"
              title="Feed & Notifications"
              aria-label="Feed & Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#9A6ADF] dark:bg-[#B78AF7] ring-2 ring-white dark:ring-[#0F0D15]" />
            </Link>
          )}

          {/* Theme Selector (All 6 Bespoke Marble Themes) */}
          <ThemeSelector showLabel={true} />

          {/* Authenticated User Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* User Avatar + Name Pill */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-[#F4E7FF]/40 dark:bg-[#231C35]/50 border border-[#D8B8FF]/40 dark:border-[#3E325D]">
                <div className="h-6 w-6 rounded-full bg-[#9A6ADF] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left pr-1 max-w-[110px] md:max-w-[130px] truncate">
                  <p className="text-xs font-semibold text-[#111111] dark:text-[#F5F3F8] leading-none truncate">
                    {user.fullName || user.email.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-[#9A6ADF] dark:text-[#B78AF7] font-medium leading-tight">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-[#4B4652] dark:text-[#C7C3D4] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 sm:px-3 h-8"
                aria-label="Sign out of CreatorBridge"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-xs h-8">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="primary" size="sm" className="text-xs h-8">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle Button (Visible on screens < lg) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle portal navigation"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-lg text-[#111111] dark:text-[#F5F3F8] hover:bg-[#F4E7FF]/50 dark:hover:bg-[#231C35] border border-[#D8B8FF] dark:border-[#3E325D] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RESPONSIVE MOBILE DRAWER MENU (< 1024px: Tablets & Mobile)          */}
      {/* =================================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#F4E7FF] dark:border-[#2D2447] bg-[#FFFDFD]/98 dark:bg-[#0F0D15]/98 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2">
          {/* User info banner inside drawer */}
          {isAuthenticated && user && (
            <div className="pb-3 border-b border-[#F4E7FF] dark:border-[#2D2447] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#9A6ADF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitial}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#111111] dark:text-[#F5F3F8]">{user.fullName || "User"}</p>
                  <p className="text-xs text-[#4B4652] dark:text-[#A9A3B8]">{user.email}</p>
                </div>
              </div>
              <Badge variant="purple" className="text-[10px] font-semibold">
                {user.role}
              </Badge>
            </div>
          )}

          {/* All Navigation Links */}
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {allNavItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.to === "/creator/dashboard" || item.to === "/brand/dashboard"
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#F4E7FF] text-[#9A6ADF] dark:bg-[#231C35] dark:text-[#B78AF7] font-bold border-l-3 border-[#9A6ADF] dark:border-[#B78AF7]"
                      : "text-[#4B4652] dark:text-[#C7C3D4] hover:bg-[#F4E7FF]/40 dark:hover:bg-[#231C35]/50 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Secondary Actions & Theme Controls */}
          <div className="pt-3 border-t border-[var(--color-border)] flex flex-col gap-2">
            <div className="p-3 bg-[var(--color-surface-muted)]/50 rounded-2xl border border-[var(--color-border)]">
              <ThemeSelector isMobileDrawer />
            </div>

            <Link to="/discover" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full text-xs font-semibold py-2.5 text-[#9A6ADF] dark:text-[#B78AF7]">
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Explore Creators
              </Button>
            </Link>

            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-xs font-medium py-2 text-[#4B4652] dark:text-[#C7C3D4]">
                CreatorBridge Homepage
              </Button>
            </Link>

            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full text-xs font-semibold py-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
