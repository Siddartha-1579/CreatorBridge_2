import React, { useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { PolicyRenewalGate } from "@/components/policy/PolicyRenewalGate"
import type { UserRole } from "@/types"

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = "/login",
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [renewalCompleted, setRenewalCompleted] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    const isBrandPath = typeof window !== "undefined" && window.location.pathname.startsWith("/brand")
    const targetAuth = isBrandPath ? "/auth/brand?mode=login" : "/auth/creator?mode=login"
    return <Navigate to={redirectTo !== "/login" ? redirectTo : targetAuth} replace />
  }

  // Enforce mandatory policy renewal if user policy is outdated
  if (user.policyAccepted === false && !renewalCompleted) {
    return (
      <PolicyRenewalGate
        user={user}
        onAccepted={() => setRenewalCompleted(true)}
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== "ADMIN") {
    // If authenticated user does not have permission for this section, redirect to their home
    const fallbackPath = user.role === "CREATOR" ? "/creator/dashboard" : "/brand/dashboard"
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}
