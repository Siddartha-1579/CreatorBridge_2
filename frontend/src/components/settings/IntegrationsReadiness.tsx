import React, { useEffect, useState, useCallback } from "react"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Server,
  Layers,
  Database,
  Bot,
  Video,
  Image as ImageIcon,
  Mic,
  FileAudio,
  Mail,
  CreditCard,
  ExternalLink,
  Info,
} from "lucide-react"
import { apiClient, ApiError } from "@/lib/apiClient"
import type { SystemReadinessReport, IntegrationDetail } from "@/types"
import { isValidReadinessReport, extractReadinessPayload } from "@/lib/readinessValidator"

export { isValidReadinessReport, extractReadinessPayload }

export const IntegrationsReadiness: React.FC<{
  className?: string
  showAsCard?: boolean
}> = ({ className = "", showAsCard = true }) => {
  const [report, setReport] = useState<SystemReadinessReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [errorTitle, setErrorTitle] = useState<string>("Unable to connect to readiness endpoint")
  const [filterCategory, setFilterCategory] = useState<string>("ALL")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchReadiness = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setErrorTitle("Unable to connect to readiness endpoint")

      const res = await apiClient.get<SystemReadinessReport>("/health/readiness")
      const payload = extractReadinessPayload(res)

      if (isValidReadinessReport(payload)) {
        setReport(payload)
      } else {
        setErrorTitle("Unexpected readiness response format")
        setError(
          "The server responded, but the readiness report was missing required fields (system_status, total_integrations, or integrations array)."
        )
      }
      setLastChecked(new Date())
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 0) {
          setErrorTitle("Unable to connect to readiness endpoint")
          setError(err.message || "Network error: failed to reach backend server")
        } else {
          setErrorTitle(`Readiness service error (HTTP ${err.statusCode})`)
          setError(err.message || `Server returned error status ${err.statusCode}`)
        }
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load readiness status"
        setErrorTitle("Unable to connect to readiness endpoint")
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReadiness()
  }, [fetchReadiness])

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case "supabase":
        return <Database className="w-5 h-5 text-indigo-600" />
      case "core_ai":
      case "openai":
        return <Bot className="w-5 h-5 text-purple-600" />
      case "turnstile":
        return <ShieldCheck className="w-5 h-5 text-amber-600" />
      case "image_generation":
        return <ImageIcon className="w-5 h-5 text-pink-600" />
      case "video_generation":
        return <Video className="w-5 h-5 text-rose-600" />
      case "voiceover":
      case "tts_voiceover":
        return <Mic className="w-5 h-5 text-blue-600" />
      case "transcription":
        return <FileAudio className="w-5 h-5 text-violet-600" />
      case "email":
      case "email_service":
        return <Mail className="w-5 h-5 text-emerald-600" />
      case "payments":
      case "payments_escrow":
        return <CreditCard className="w-5 h-5 text-cyan-600" />
      default:
        return <Server className="w-5 h-5 text-purple-600" />
    }
  }

  const getStatusBadge = (status: IntegrationDetail["status"]) => {
    switch (status) {
      case "CONFIGURED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Configured & Ready
          </span>
        )
      case "REUSES_OPENAI":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Reuses OpenAI Key
          </span>
        )
      case "DEVELOPMENT_MOCK":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Development Mock
          </span>
        )
      case "MISSING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            Awaiting Key
          </span>
        )
    }
  }

  const filteredIntegrations = (report?.integrations || []).filter((item) => {
    if (filterCategory === "ALL") return true
    if (filterCategory === "PRODUCTION") return item.category === "REQUIRED_FOR_PRODUCTION"
    if (filterCategory === "AI") return item.category.includes("AI") || item.category === "CREATIVE_MODALITY"
    if (filterCategory === "SERVICES") return item.category === "OPTIONAL_SERVICE" || item.category === "COMMERCIAL_ESCROW"
    return true
  })

  const content = (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-purple-100/60">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              API & Infrastructure Readiness
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized environment monitor for all AI models, external providers, and database services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              Checked {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchReadiness()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
            <p className="text-xs font-medium text-slate-500">System State</p>
            <p className="text-lg font-bold text-purple-900 mt-1 uppercase">
              {report.system_status}
            </p>
            <span className="text-[11px] text-purple-600/80">Env: {report.app_env}</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <p className="text-xs font-medium text-slate-500">Configured / Active</p>
            <p className="text-lg font-bold text-emerald-700 mt-1">
              {report.configured_count}{" "}
              <span className="text-xs font-normal text-emerald-600">/ {report.total_integrations}</span>
            </p>
            <span className="text-[11px] text-emerald-600/80">Active services</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <p className="text-xs font-medium text-slate-500">Development Mocks</p>
            <p className="text-lg font-bold text-amber-700 mt-1">
              {report.mock_count}
            </p>
            <span className="text-[11px] text-amber-600/80">Local development safe</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-medium text-slate-500">Awaiting Keys</p>
            <p className="text-lg font-bold text-slate-700 mt-1">
              {report.missing_count}
            </p>
            <span className="text-[11px] text-slate-500">Optional or pending</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
        {[
          { key: "ALL", label: "All Integrations (9)" },
          { key: "PRODUCTION", label: "Production Critical" },
          { key: "AI", label: "AI & Generative Models" },
          { key: "SERVICES", label: "Auxiliary & Payments" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCategory === tab.key
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-semibold">{errorTitle}</p>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !report && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Integrations List */}
      <div className="space-y-3">
        {filteredIntegrations?.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-purple-200 hover:shadow-xs transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                  {getCategoryIcon(item.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.guidance}</p>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-400 block">Active Provider</span>
                  <span className="text-xs font-semibold text-slate-700 capitalize">
                    {item.provider_selected || "None"}
                  </span>
                </div>
                {item.model_or_endpoint && (
                  <span className="text-[11px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded mt-1">
                    {item.model_or_endpoint}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Meta & Env Key Badges */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium">Checked keys:</span>
                {(item.env_keys_checked || []).map((k) => (
                  <code
                    key={k}
                    className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/60"
                  >
                    {k}
                  </code>
                ))}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-slate-400">Masked status:</span>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded font-medium ${
                    item.masked_key && item.masked_key !== "mock-development-key"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : item.masked_key === "mock-development-key"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.masked_key || "None configured"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Guidance Banner */}
      <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-purple-950">
            How to configure your API integrations:
          </p>
          <p className="text-purple-800 leading-relaxed">
            All integrations are managed through centralized environment variables. To activate any service,
            open your <code className="bg-purple-100/80 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> or{" "}
            <code className="bg-purple-100/80 px-1 py-0.5 rounded font-mono text-[11px]">backend/.env</code> file,
            supply the corresponding key, and restart the backend server. No secret keys are ever logged or transmitted to the client.
          </p>
        </div>
      </div>
    </div>
  )

  if (showAsCard) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        {content}
      </div>
    )
  }

  return content
}
