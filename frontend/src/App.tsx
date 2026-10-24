import React from "react"
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { ThemeProvider } from "@/context/ThemeContext"

// Layouts
import { RootLayout } from "@/layouts/RootLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { ProtectedRoute } from "@/components/common/ProtectedRoute"

// Pages
import { HomePage } from "@/pages/HomePage"
import { NotFoundPage } from "@/pages/NotFoundPage"

// Public Discover & Profiles
import { PublicCreatorProfilePage } from "@/pages/public/PublicCreatorProfilePage"
import { PlatformPoliciesPage } from "@/pages/public/PlatformPoliciesPage"

// Dedicated Security & Auth Pages
import { AuthLandingPage } from "@/pages/auth/AuthLandingPage"
import { CreatorAuthPage } from "@/pages/auth/CreatorAuthPage"
import { BrandAuthPage } from "@/pages/auth/BrandAuthPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

// Onboarding Pages
import { CreatorOnboardingPage } from "@/pages/creator/CreatorOnboardingPage"
import { BrandOnboardingPage } from "@/pages/brand/BrandOnboardingPage"

// Creator Pages
import { CreatorDashboardPage } from "@/pages/creator/CreatorDashboardPage"
import { CreatorProfilePage } from "@/pages/creator/CreatorProfilePage"
import { CreatorPortfolioPage } from "@/pages/creator/CreatorPortfolioPage"
import { CreatorStudioPage } from "@/pages/creator/CreatorStudioPage"
import { CreatorProjectsPage } from "@/pages/creator/CreatorProjectsPage"
import { CreatorCampaignsPage } from "@/pages/creator/CreatorCampaignsPage"
import { CreatorCampaignDetailPage } from "@/pages/creator/CreatorCampaignDetailPage"
import { CreatorSubmissionsPage } from "@/pages/creator/CreatorSubmissionsPage"
import { CreatorCommunityPage } from "@/pages/creator/CreatorCommunityPage"

// Brand Pages
import { BrandDashboardPage } from "@/pages/brand/BrandDashboardPage"
import { BrandBriefsPage } from "@/pages/brand/BrandBriefsPage"
import { BrandBriefBuilderPage } from "@/pages/brand/BrandBriefBuilderPage"
import { BrandDiscoverPage } from "@/pages/brand/BrandDiscoverPage"
import { BrandCampaignsPage } from "@/pages/brand/BrandCampaignsPage"
import { BrandCampaignDetailPage } from "@/pages/brand/BrandCampaignDetailPage"
import { BrandCampaignSubmissionsPage } from "@/pages/brand/BrandCampaignSubmissionsPage"
import { BrandCampaignAnalyticsPage } from "@/pages/brand/BrandCampaignAnalyticsPage"
import { BrandCommunityPage } from "@/pages/brand/BrandCommunityPage"
import { BrandProjectsPage } from "@/pages/brand/BrandProjectsPage"

// Settings & Infrastructure
import { IntegrationsSettingsPage } from "@/pages/settings/IntegrationsSettingsPage"

// Support Chatbot
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget"

const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />
  }
  return <Navigate to={user.role === "CREATOR" ? "/creator/dashboard" : "/brand/dashboard"} replace />
}

const RegisterRedirect: React.FC = () => {
  const [searchParams] = useSearchParams()
  const role = searchParams.get("role")?.toUpperCase()
  if (role === "BRAND" || role === "AGENCY") {
    return <Navigate to="/auth/brand?mode=register" replace />
  }
  if (role === "CREATOR") {
    return <Navigate to="/auth/creator?mode=register" replace />
  }
  return <Navigate to="/auth?mode=register" replace />
}

const LoginRedirect: React.FC = () => {
  const [searchParams] = useSearchParams()
  const role = searchParams.get("role")?.toUpperCase()
  if (role === "BRAND" || role === "AGENCY") {
    return <Navigate to="/auth/brand?mode=login" replace />
  }
  if (role === "CREATOR") {
    return <Navigate to="/auth/creator?mode=login" replace />
  }
  return <Navigate to="/auth?mode=login" replace />
}

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing / Home Route */}
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<BrandDiscoverPage isPublicView={true} />} />
            <Route path="/creators/:creatorId" element={<PublicCreatorProfilePage />} />
            <Route path="/policies" element={<PlatformPoliciesPage />} />
            <Route path="/404" element={<NotFoundPage />} />
          </Route>

          {/* Authentication Routes */}
          <Route path="/auth" element={<AuthLandingPage />} />
          <Route path="/auth/creator" element={<CreatorAuthPage />} />
          <Route path="/auth/brand" element={<BrandAuthPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Legacy & Shared Redirects with Role/Mode Forwarding */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<RegisterRedirect />} />

          {/* Onboarding Routes */}
          <Route path="/creator/onboarding" element={<CreatorOnboardingPage />} />
          <Route path="/brand/onboarding" element={<BrandOnboardingPage />} />

          {/* Creator Portal Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={["CREATOR"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/creator" element={<Navigate to="/creator/dashboard" replace />} />
              <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />
              <Route path="/creator/campaigns" element={<CreatorCampaignsPage />} />
              <Route path="/creator/campaigns/:campaignId" element={<CreatorCampaignDetailPage />} />
              <Route path="/creator/submissions" element={<CreatorSubmissionsPage />} />
              <Route path="/creator/community" element={<CreatorCommunityPage />} />
              <Route path="/creator/profile" element={<CreatorProfilePage />} />
              <Route path="/creator/portfolio" element={<CreatorPortfolioPage />} />
              <Route path="/creator/studio" element={<CreatorStudioPage />} />
              <Route path="/creator/projects" element={<CreatorProjectsPage />} />
              <Route path="/creator/settings" element={<Navigate to="/creator/settings/integrations" replace />} />
              <Route path="/creator/settings/integrations" element={<IntegrationsSettingsPage />} />
            </Route>
          </Route>

          {/* Brand & Agency Portal Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={["BRAND", "AGENCY"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/brand" element={<Navigate to="/brand/dashboard" replace />} />
              <Route path="/brand/dashboard" element={<BrandDashboardPage />} />
              <Route path="/brand/campaigns" element={<BrandCampaignsPage />} />
              <Route path="/brand/campaigns/:campaignId" element={<BrandCampaignDetailPage />} />
              <Route path="/brand/campaigns/:campaignId/submissions" element={<BrandCampaignSubmissionsPage />} />
              <Route path="/brand/campaigns/:campaignId/analytics" element={<BrandCampaignAnalyticsPage />} />
              <Route path="/brand/community" element={<BrandCommunityPage />} />
              <Route path="/brand/briefs" element={<BrandBriefsPage />} />
              <Route path="/brand/briefs/new" element={<BrandBriefBuilderPage />} />
              <Route path="/brand/briefs/:briefId/edit" element={<BrandBriefBuilderPage />} />
              <Route path="/brand/discover" element={<BrandDiscoverPage />} />
              <Route path="/brand/projects" element={<BrandProjectsPage />} />
              <Route path="/brand/settings" element={<Navigate to="/brand/settings/integrations" replace />} />
              <Route path="/brand/settings/integrations" element={<IntegrationsSettingsPage />} />
            </Route>
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <ChatbotWidget />
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
