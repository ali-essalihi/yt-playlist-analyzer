export interface LimitsResData {
  fetchesUsed: number
  fetchesRemaining: number
  maxFetches: number
  maxVideosPerFetch: number
}

export interface ApiErrorResData {
  message: string
}
