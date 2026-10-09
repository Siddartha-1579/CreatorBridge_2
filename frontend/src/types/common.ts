export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  meta?: Record<string, unknown>
}

export interface ApiErrorDetail {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiErrorResponse {
  success: false
  error: ApiErrorDetail
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
