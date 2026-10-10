import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/hooks/useAuth"

// Layouts
import { RootLayout } from "@/layouts/RootLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { ProtectedRoute } from "@/components/common/ProtectedRoute"

// Pages
import { HomePage } from "@/pages/HomePage"
import { NotFoundPage } from "@/pages/NotFoundPage"

// Public Discover & Profiles
import { PublicCreatorProfilePage } from "@/pages/public/PublicCreatorProfilePage"

// Dedicated Security & Auth Pages
import { AuthLandingPage } from "@/pages/auth/AuthLandingPage"
import { CreatorAuthPage } from "@/pages/auth/CreatorAuthPage"
import { BrandAuthPage } from "@/pages/auth/BrandAuthPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

// Onboarding Pages (Master Prompt 04 & 05 previews)
import { CreatorOnboardingPage } from "@/pages/creator/CreatorOnboardingPage"
import { BrandOnboardingPage } from "@/pages/brand/BrandOnboardingPage"

// Creator Pages
import { CreatorDashboardPage } from "@/pages/creator/CreatorDashboardPage"
import { CreatorProfilePage } from "@/pages/creator/CreatorProfilePage"
import { CreatorPortfolioPage } from "@/pages/creator/CreatorPortfolioPage"
import { CreatorStudioPage } from "@/pages/creator/CreatorStudioPage"
import { CreatorProjectsPage } from "@/pages/creator/CreatorProjectsPage"

// Brand Pages
import { BrandDashboardPage } from "@/pages/brand/BrandDashboardPage"
import { BrandBriefsPage } from "@/pages/brand/BrandBriefsPage"
import { BrandBriefBuilderPage } from "@/pages/brand/BrandBriefBuilderPage"
import { BrandDiscoverPage } from "@/pages/brand/BrandDiscoverPage"
import { BrandCampaignsPage } from "@/pages/brand/BrandCampaignsPage"
import { BrandProjectsPage } from "@/pages/brand/BrandProjectsPage"

// Settings & Infrastructure
import { IntegrationsSettingsPage } from "@/pages/settings/IntegrationsSettingsPage"

const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />
  }
  return <Navigate to={user.role === "CREATOR" ? "/creator/dashboard" : "/brand/dashboard"} replace />
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing / Home Route */}
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<BrandDiscoverPage isPublicView={true} />} />
            <Route path="/creators/:creatorId" element={<PublicCreatorProfilePage />} />
            <Route path="/404" element={<NotFoundPage />} />
          </Route>

          {/* Role-Separated Authentication Routes */}
          <Route path="/auth" element={<AuthLandingPage />} />
          <Route path="/auth/creator" element={<CreatorAuthPage />} />
          <Route path="/auth/brand" element={<BrandAuthPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Legacy & Shared Redirects */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />

          {/* Onboarding Routes */}
          <Route path="/creator/onboarding" element={<CreatorOnboardingPage />} />
          <Route path="/brand/onboarding" element={<BrandOnboardingPage />} />

          {/* Creator Portal Routes (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={["CREATOR"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/creator" element={<Navigate to="/creator/dashboard" replace />} />
              <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />
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
              <Route path="/brand/briefs" element={<BrandBriefsPage />} />
              <Route path="/brand/briefs/new" element={<BrandBriefBuilderPage />} />
              <Route path="/brand/briefs/:briefId/edit" element={<BrandBriefBuilderPage />} />
              <Route path="/brand/discover" element={<BrandDiscoverPage />} />
              <Route path="/brand/campaigns" element={<BrandCampaignsPage />} />
              <Route path="/brand/projects" element={<BrandProjectsPage />} />
              <Route path="/brand/settings" element={<Navigate to="/brand/settings/integrations" replace />} />
              <Route path="/brand/settings/integrations" element={<IntegrationsSettingsPage />} />
            </Route>
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
