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

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || "/api/v1") {
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem("hacxlerate_auth_token")
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

    // Try parsing JSON body
    let responseData: unknown = null
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }
    }

    if (!response.ok) {
      const errorData = responseData as ApiErrorResponse | null
      const errorCode = errorData?.error?.code || `HTTP_${response.status}`
      const errorMessage = errorData?.error?.message || response.statusText || "Request failed"
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
