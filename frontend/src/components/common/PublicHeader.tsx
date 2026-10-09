import React, { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Menu, X, ArrowRight, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  targetId: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "For Brands", targetId: "for-brands" },
  { label: "For Creators", targetId: "for-creators" },
  { label: "AI Matching", targetId: "economy" },
  { label: "Briefs", targetId: "brief-preview" },
  { label: "How It Works", targetId: "how-it-works" },
  { label: "Trust", targetId: "trust" },
]

export const PublicHeader: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("hero")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Track scroll position for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // IntersectionObserver to detect active visible section on homepage
  useEffect(() => {
    if (location.pathname !== "/") return

    const sectionIds = ["hero", ...NAV_ITEMS.map((item) => item.targetId), "get-started"]
    const observedElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (observedElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        threshold: 0.25,
        rootMargin: "-80px 0px -40% 0px",
      }
    )

    observedElements.forEach((el) => observer.observe(el))

    return () => {
      observedElements.forEach((el) => observer.unobserve(el))
    }
  }, [location.pathname])

  const scrollToSection = (targetId: string) => {
    setMobileMenuOpen(false)

    if (location.pathname !== "/") {
      navigate(`/#${targetId}`)
      return
    }

    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      const headerOffset = 80
      const elementPosition = targetElement.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-[#FFFDFD]/95 backdrop-blur-md border-b border-[#F4E7FF] shadow-xs"
          : "bg-[#FFFDFD]/80 backdrop-blur-sm border-b border-[#F4E7FF]/60"
      )}
    >
      <div className="container mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* CreatorBridge Official Logo (Top-Left) */}
        <Link
          to="/"
          onClick={() => scrollToSection("hero")}
          className="flex items-center group focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40 rounded-lg p-0.5"
          aria-label="CreatorBridge - Where Brands Meet Creativity"
        >
          <img
            src="/creatorbridge-logo-transparent.png"
            alt="CreatorBridge - Where Brands Meet Creativity"
            className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          aria-label="Public Navigation"
          className="hidden lg:flex items-center gap-1 bg-[#F4E7FF]/60 p-1 rounded-full border border-[#D8B8FF]/60"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.targetId
            return (
              <button
                key={item.targetId}
                onClick={() => scrollToSection(item.targetId)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]/40",
                  isActive
                    ? "bg-white text-[#9A6ADF] font-bold shadow-xs border border-[#F4E7FF]"
                    : "text-[#4B4652] hover:text-[#9A6ADF] hover:bg-white/50"
                )}
              >
                {item.label}
              </button>
            )
          })}
          <Link
            to="/discover"
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#9A6ADF] text-white hover:bg-[#8552D4] transition-colors shadow-2xs ml-1"
          >
            Find Talent
          </Link>
        </nav>

        {/* Auth CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to={user.role === "CREATOR" ? "/creator/dashboard" : "/brand/dashboard"}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F4E7FF] text-[#9A6ADF] border border-[#D8B8FF] hover:bg-[#F4E7FF]/80 transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Go to Portal</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-xs text-[#4B4652] hover:text-red-600"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold text-[#4B4652] hover:text-[#9A6ADF]"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs font-semibold gap-1.5"
                >
                  Get Started <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-[#111111] hover:bg-[#F4E7FF]/50 border border-[#D8B8FF] focus:outline-none focus:ring-2 focus:ring-[#9A6ADF]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#F4E7FF] bg-[#FFFDFD]/98 backdrop-blur-xl px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.targetId}
                onClick={() => scrollToSection(item.targetId)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left font-medium transition-colors",
                  activeSection === item.targetId
                    ? "bg-[#F4E7FF] text-[#9A6ADF] font-bold"
                    : "text-[#4B4652] hover:bg-[#F4E7FF]/40"
                )}
              >
                <span>{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-60 text-[#9A6ADF]" />
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#F4E7FF] flex flex-col gap-2">
            <Link to="/discover" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full text-xs font-semibold py-2.5 text-[#9A6ADF]">
                Find & Discover Creators
              </Button>
            </Link>
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full text-xs font-semibold py-2.5">
                Join CreatorBridge
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
