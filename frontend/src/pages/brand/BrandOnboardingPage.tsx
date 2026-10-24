import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { AdaptiveSurveyEngine } from "@/components/survey/AdaptiveSurveyEngine"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"

export const BrandOnboardingPage: React.FC = () => {
  const navigate = useNavigate()

  const handleComplete = () => {
    navigate("/brand/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#FFFDFD] dark:bg-[#0F0D15] py-6 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="container mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-[#F4E7FF] dark:border-zinc-800">
          <CreatorBridgeLogo size="sm" badgeText="Brand Onboarding" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/brand/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B4652] dark:text-zinc-400 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
            >
              <span>Skip to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <AdaptiveSurveyEngine surveyType="brand" onComplete={handleComplete} />
      </main>
    </div>
  )
}
