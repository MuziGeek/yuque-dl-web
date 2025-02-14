export interface ErrorResponse {
  message: string
  code?: number
  details?: Record<string, unknown>
}
