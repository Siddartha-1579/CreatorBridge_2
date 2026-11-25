import type { ApiResponse, ApiErrorResponse } from "@/types"

export class ApiError extends Error {
  code: string
  details?: Record<string, unknown>
  statusCode: number

  constructor(message: string, code: string = "UNKNOWN_ERROR", statusCode: number = 500, details?: Record<string, unknown>) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

export type UnauthorizedListener = (info: { endpoint: string; message: string }) => void

class ApiClient {
  private baseUrl: string
  private unauthorizedListeners: Set<UnauthorizedListener> = new Set()
  private isNotifyingUnauthorized = false

  constructor(baseUrl?: string) {
    const defaultUrl =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
      "/api/v1"
    let clean = (baseUrl || defaultUrl).replace(/\/$/, "")
    // If the base URL is an absolute URL (e.g. https://api.onrender.com) and doesn't contain /api/,
    // automatically append /api/v1 so backend router paths line up.
    if (/^https?:\/\//i.test(clean) && !clean.includes("/api")) {
      clean = `${clean}/api/v1`
    }
    this.baseUrl = clean
  }

  public onUnauthorized(listener: UnauthorizedListener): () => void {
    this.unauthorizedListeners.add(listener)
    return () => {
      this.unauthorizedListeners.delete(listener)
    }
  }

  public notifyUnauthorized(endpoint: string, message: string): void {
    if (this.isNotifyingUnauthorized) return
    this.isNotifyingUnauthorized = true

    try {
      localStorage.removeItem("creatorbridge_auth_token")
      localStorage.removeItem("creatorbridge_user")
      localStorage.removeItem("hacxlerate_auth_token")
      localStorage.removeItem("hacxlerate_user")
    } catch {
      // Ignore localStorage access failures
    }

    this.unauthorizedListeners.forEach((listener) => {
      try {
        listener({ endpoint, message })
      } catch (e) {
        console.error("Error in onUnauthorized listener:", e)
      }
    })

    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("creatorbridge:auth-expired", {
            detail: { endpoint, message },
          })
        )
      } catch {
        // Ignore custom event dispatch failures
      }
    }

    setTimeout(() => {
      this.isNotifyingUnauthorized = false
    }, 500)
  }

  private getAuthToken(): string | null {
    try {
      return (
        localStorage.getItem("creatorbridge_auth_token") ||
        localStorage.getItem("hacxlerate_auth_token")
      )
    } catch {
      return null
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...rest } = options

    let url = `${this.baseUrl}/${endpoint.replace(/^\//, "")}`

    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      }
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData
    const token = this.getAuthToken()
    const requestHeaders: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    }
    if (isFormData) {
      delete requestHeaders["Content-Type"]
    }

    let response: Response
    try {
      response = await fetch(url, {
        ...rest,
        headers: requestHeaders,
      })
    } catch (err: unknown) {
      throw new ApiError(
        err instanceof Error ? err.message : "Network error - failed to reach server",
        "NETWORK_ERROR",
        0
      )
    }

    // Try parsing JSON body or text body
    let responseData: unknown = null
    let responseText: string = ""
    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }
    } else {
      try {
        responseText = await response.text()
      } catch {
        responseText = ""
      }
    }

    if (!response.ok) {
      const errorData = responseData as ApiErrorResponse | null
      const errorCode = errorData?.error?.code || `HTTP_${response.status}`

      // Check if this was an authenticated request where the session token expired or became invalid
      const isAuthAction = endpoint.includes("auth/login") || endpoint.includes("auth/register")
      if (response.status === 401 && token && !isAuthAction) {
        this.notifyUnauthorized(endpoint, errorData?.error?.message || "Invalid or expired authentication token")
      }

      let defaultMessage = "Request failed"
      if (response.status === 401) {
        defaultMessage = isAuthAction
          ? "Invalid email or password. Please verify your credentials."
          : "Your session has expired or is invalid. Please sign in again."
      } else if (response.status === 403) {
        defaultMessage = "Access denied: you do not have permission to view or manage this resource."
      } else if (response.status === 404) {
        const isStaticHostNotFound =
          responseText.includes("The page could not be found") &&
          (url.includes("vercel.app") || !this.baseUrl.startsWith("http"))
        if (isStaticHostNotFound) {
          defaultMessage =
            "Backend API is unreachable (HTTP 404: The page could not be found). Please configure VITE_API_URL in your deployment environment variables."
        } else {
          defaultMessage = "The requested campaign or resource could not be found (HTTP 404)."
        }
      } else if (response.status === 405) {
        defaultMessage = "Method not allowed for this endpoint (HTTP 405)."
      } else if (response.status === 422) {
        defaultMessage = "Validation error: please check your input and try again."
      } else if (response.status === 429) {
        defaultMessage = "Too many requests. Please wait a moment before trying again."
      } else if (response.status >= 500) {
        defaultMessage = `Server error (HTTP ${response.status}). The service is temporarily unavailable. Please try again shortly.`
      }

      const errorMessage =
        errorData?.error?.message ||
        defaultMessage
      const errorDetails = errorData?.error?.details

      throw new ApiError(errorMessage, errorCode, response.status, errorDetails)
    }

    // If unwrapped standard ApiResponse envelope is returned
    const envelope = responseData as ApiResponse<T>
    if (envelope && typeof envelope === "object" && "success" in envelope && "data" in envelope) {
      return envelope.data as T
    }

    return responseData as T
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
