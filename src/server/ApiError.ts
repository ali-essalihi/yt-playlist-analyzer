import type { ApiErrorResData } from '@/shared/types'

export default class ApiError extends Error {
  status: number
  headers: Record<string, string>

  constructor(
    status: number,
    message: string,
    headers: Record<string, string> = {}
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.headers = headers
  }

  getResponse() {
    const errData: ApiErrorResData = {
      message: this.message,
    }
    return Response.json(errData, {
      status: this.status,
      headers: this.headers,
    })
  }

  static unexpected() {
    return new ApiError(500, 'Something went wrong!')
  }
}
