import React from "react"
import {
  AlertCircle,
  ShieldAlert,
  WifiOff,
  ServerCrash,
  ArrowLeft,
  RefreshCw,
  LogIn,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export interface ErrorStateProps {
  title?: string
  message?: string
  statusCode?: number
  errorCode?: string
  onRetry?: () => void
  backTo?: string
  backLabel?: string
  portal?: "creator" | "brand"
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  statusCode,
  errorCode,
  onRetry,
  backTo = "/creator/campaigns",
  backLabel = "Back to Campaigns Marketplace",
  portal = "creator",
  className = "",
}) => {
  const isAuthError =
    statusCode === 401 ||
    errorCode === "UNAUTHORIZED" ||
    (message && message.toLowerCase().includes("authentication token"))
  const isForbiddenError = statusCode === 403 || errorCode === "FORBIDDEN"
  const isNotFoundError = statusCode === 404 || errorCode === "NOT_FOUND"
  const isNetworkError =
    statusCode === 0 ||
    errorCode === "NETWORK_ERROR" ||
    (message && message.toLowerCase().includes("network error"))
  const isServerError =
    (statusCode !== undefined && statusCode >= 500) ||
    errorCode === "SERVER_ERROR"

  const loginPath =
    portal === "brand" ? "/auth/brand?mode=login" : "/auth/creator?mode=login"

  // 1. Session Expiry / Authentication Failure (401)
  if (isAuthError) {
    return (
      <div className={`p-8 rounded-3xl bg-white border border-amber-200/80 shadow-sm text-center space-y-4 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">
            {title || "Session Expired"}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {message ||
              "Your authentication session has expired or is invalid. Please sign in again to access this page."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to={loginPath}>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl gap-2 shadow-xs transition-colors">
              <LogIn className="w-4 h-4" />
              Sign In Again
            </Button>
          </Link>
          {backTo && (
            <Link to={backTo}>
              <Button variant="outline" className="text-sm font-semibold rounded-xl gap-1.5 text-slate-700">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // 2. Permission / Forbidden Failure (403)
  if (isForbiddenError) {
    return (
      <div className={`p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-4 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">
            {title || "Access Restricted"}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {message ||
              "You do not have permission to view or manage this campaign. It may be in draft mode or reserved for the owning brand."}
          </p>
        </div>
        <div className="flex items-center justify-center pt-2">
          {backTo && (
            <Link to={backTo}>
              <Button variant="outline" className="text-sm font-semibold rounded-xl gap-1.5 text-slate-700">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // 3. Genuine Not Found (404)
  if (isNotFoundError) {
    return (
      <div className={`p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">
            {title || "Campaign Not Found"}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {message || "This campaign brief does not exist or has been removed from the marketplace."}
          </p>
        </div>
        <div className="flex items-center justify-center pt-2">
          {backTo && (
            <Link to={backTo}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl gap-2 shadow-xs transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // 4. Network Offline or Connection Failure
  if (isNetworkError) {
    return (
      <div className={`p-8 rounded-3xl bg-white border border-indigo-200/80 shadow-sm text-center space-y-4 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto">
          <WifiOff className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">
            {title || "Connection Error"}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {message || "Unable to reach the CreatorBridge server. Please check your internet connection."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl gap-2 shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          {backTo && (
            <Link to={backTo}>
              <Button variant="outline" className="text-sm font-semibold rounded-xl gap-1.5 text-slate-700">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // 5. Temporary Server Error (5xx)
  if (isServerError) {
    return (
      <div className={`p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center space-y-4 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
          <ServerCrash className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">
            {title || "Server Error"}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {message || "The CreatorBridge server encountered a temporary issue. Please try again shortly."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl gap-2 shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          {backTo && (
            <Link to={backTo}>
              <Button variant="outline" className="text-sm font-semibold rounded-xl gap-1.5 text-slate-700">
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // 6. Generic Fallback Error
  return (
    <div className={`p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-slate-900">
          {title || "Unable to Load Resource"}
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {message || "An unexpected error occurred while loading this page."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        {backTo && (
          <Link to={backTo}>
            <Button variant="outline" className="text-sm font-semibold rounded-xl gap-1.5 text-slate-700">
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
