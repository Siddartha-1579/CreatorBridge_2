import React, { useState, useRef, useEffect } from "react"
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"
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

  useEffect(() => {
    setMobileMenuOpen(false)
    setMoreMenuOpen(false)
  }, [location.pathname])

  useOutsideClick(moreMenuRef, () => {
    setMoreMenuOpen(false)
  })

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
    <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0c1218]/95 backdrop-blur-md shadow-xs transition-colors duration-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
        <div className="flex items-center shrink-0">
          <CreatorBridgeLogo
            to={isBrandHub ? "/brand/dashboard" : "/creator/dashboard"}
            badgeText={isBrandHub ? "Brand Hub" : "Creator Hub"}
          />
        </div>

        <nav
          className="hidden lg:flex items-center justify-center gap-1 flex-1 min-w-0 px-2"
          aria-label="Portal Navigation"
        >
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
                      "relative isolate flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-[#0F766E] dark:text-white font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="navbar-active-pill"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          className="absolute inset-0 -z-10 rounded-lg bg-[var(--accent-primary,#0D9488)]/15 dark:bg-[var(--accent-primary,#2DD4BF)]/15 border border-[var(--accent-primary,#0D9488)]/35 dark:border-[var(--accent-primary,#2DD4BF)]/35 shadow-sm"
                        />
                      )}
                      <Icon className="h-3.5 w-3.5 cb-3d-icon-badge" />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}

            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                aria-label="More navigation items"
                className={cn(
                  "relative isolate flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                  isSecondaryActive || moreMenuOpen
                    ? "text-[#0F766E] dark:text-white font-bold bg-[var(--accent-primary,#0D9488)]/15 dark:bg-[var(--accent-primary,#2DD4BF)]/15 border border-[var(--accent-primary,#0D9488)]/35 dark:border-[var(--accent-primary,#2DD4BF)]/35"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                )}
              >
                <span>More</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", moreMenuOpen && "rotate-180")} />
              </button>

              {moreMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121a22] p-1.5 shadow-xl z-50">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "relative isolate flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            isActive
                              ? "text-[#0F766E] dark:text-white font-bold"
                              : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.span
                                layoutId="navbar-more-pill"
                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                className="absolute inset-0 -z-10 rounded-lg bg-[var(--accent-primary,#0D9488)]/15 dark:bg-[var(--accent-primary,#2DD4BF)]/15 border border-[var(--accent-primary,#0D9488)]/35 dark:border-[var(--accent-primary,#2DD4BF)]/35"
                              />
                            )}
                            <Icon className="h-4 w-4 shrink-0 cb-3d-icon-badge" />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isAuthenticated && (
            <Link
              to={notificationsUrl}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
              title="Feed & Notifications"
              aria-label="Feed & Notifications"
            >
              <Bell className="h-4 w-4 cb-3d-icon-badge" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--accent-primary,#0D9488)] dark:bg-[var(--accent-primary,#2DD4BF)] ring-2 ring-white dark:ring-[#0c1218]" />
            </Link>
          )}

          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
                <div className="h-6 w-6 rounded-full bg-[var(--accent-primary,#0D9488)] dark:bg-[var(--accent-primary,#2DD4BF)] text-white dark:text-[#071014] flex items-center justify-center text-[11px] font-bold shrink-0 cb-3d-icon-badge">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left pr-1 max-w-[110px] md:max-w-[130px] truncate">
                  <p className="text-xs font-semibold text-[#111111] dark:text-[#F5F3F8] leading-none truncate">
                    {user.fullName || user.email.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-[#0F766E] dark:text-[var(--accent-primary,#2DD4BF)] font-semibold leading-tight mt-0.5">
                    {user.role}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 sm:px-3 h-8"
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle portal navigation"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#0D9488)] dark:focus:ring-[var(--accent-primary,#2DD4BF)]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-black/10 dark:border-white/10 bg-white/98 dark:bg-[#0c1218]/98 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl">
          {isAuthenticated && user && (
            <div className="pb-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[var(--accent-primary,#0D9488)] dark:bg-[var(--accent-primary,#2DD4BF)] text-white dark:text-[#071014] flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitial}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#111111] dark:text-[#F5F3F8]">{user.fullName || "User"}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
              <Badge variant="purple" className="text-[10px] font-semibold">
                {user.role}
              </Badge>
            </div>
          )}

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
                      ? "bg-[var(--accent-primary,#0D9488)]/15 dark:bg-[var(--accent-primary,#2DD4BF)]/15 text-[#0F766E] dark:text-white font-bold border-l-2 border-[var(--accent-primary,#0D9488)] dark:border-[var(--accent-primary,#2DD4BF)]"
                      : "text-slate-600 dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-slate-950 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 py-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl border border-black/10 dark:border-white/10">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Theme Appearance</span>
              <ThemeToggle showLabel />
            </div>

            <Link to="/discover" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full text-xs font-semibold py-2.5 text-slate-900 dark:text-slate-100">
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Explore Creators
              </Button>
            </Link>

            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-xs font-medium py-2 text-slate-600 dark:text-slate-400">
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