import React from "react"
import { useNavigate, Link } from "react-router-dom"
import { AdaptiveSurveyEngine } from "@/components/survey/AdaptiveSurveyEngine"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"
import { ThemeToggle } from "@/components/common/ThemeToggle"

export const CreatorOnboardingPage: React.FC = () => {
  const navigate = useNavigate()

  const handleComplete = () => {
    navigate("/creator/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#FFFDFD] dark:bg-[#0F0D15] py-6 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="container mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between py-2 border-b border-[#F4E7FF] dark:border-zinc-800">
          <CreatorBridgeLogo size="sm" badgeText="Creator Onboarding" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/creator/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B4652] dark:text-zinc-400 hover:text-[#9A6ADF] dark:hover:text-[#B78AF7] transition-colors"
            >
              <span>Skip to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <AdaptiveSurveyEngine surveyType="creator" onComplete={handleComplete} />
      </main>
    </div>
  )
}
