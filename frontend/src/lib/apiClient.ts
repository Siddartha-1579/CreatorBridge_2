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

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "/api/v1") {
    let clean = baseUrl.replace(/\/$/, "")
    // If the base URL is an absolute URL (e.g. https://api.onrender.com) and doesn't contain /api/,
    // automatically append /api/v1 so backend router paths line up.
    if (/^https?:\/\//i.test(clean) && !clean.includes("/api")) {
      clean = `${clean}/api/v1`
    }
    this.baseUrl = clean
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

      let defaultMessage = "Request failed"
      if (response.status === 401) {
        defaultMessage = "Invalid credentials. Please verify your email and password."
      } else if (response.status === 403) {
        defaultMessage = "Access denied: your account role does not have permission for this portal."
      } else if (response.status === 404) {
        const isStaticHostNotFound =
          responseText.includes("The page could not be found") ||
          responseText.includes("NOT_FOUND") ||
          url.includes("vercel.app") ||
          url.startsWith("/api")
        if (isStaticHostNotFound) {
          defaultMessage =
            "Backend API is unreachable (HTTP 404: The page could not be found). The frontend is hosted on Vercel, but API requests cannot be handled by the static frontend host. Please configure VITE_API_URL in your Vercel project environment variables with your deployed FastAPI backend URL."
        } else {
          defaultMessage = "API endpoint not found (HTTP 404). Please ensure the backend server route exists."
        }
      } else if (response.status === 405) {
        defaultMessage =
          "Backend API is not reachable on this host (HTTP 405 Method Not Allowed). Please ensure the FastAPI backend is running and VITE_API_URL is configured in Vercel."
      } else if (response.status === 422) {
        defaultMessage = "Validation error: please check your input and try again."
      } else if (response.status >= 500) {
        defaultMessage = `Server error (HTTP ${response.status}). Please try again shortly.`
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
