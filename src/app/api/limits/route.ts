import type { NextRequest } from 'next/server'
import type { LimitsResData } from '@/shared/types'
import { PLAYLIST_FETCH_LIMITS } from '@/server/constants'
import {
  generatePlaylistFetchLimiterKey,
  getPlaylistFetchUsage,
} from '@/server/utils'
import ApiError from '@/server/ApiError'

export async function GET(req: NextRequest) {
  try {
    const key = generatePlaylistFetchLimiterKey(req)
    const usage = await getPlaylistFetchUsage(key)

    const data: LimitsResData = {
      fetchesUsed: usage.fetchesUsed,
      fetchesRemaining: usage.fetchesRemaining,
      maxFetches: PLAYLIST_FETCH_LIMITS.MAX_FETCHES,
      maxVideosPerFetch: PLAYLIST_FETCH_LIMITS.MAX_VIDEOS_PER_FETCH,
    }

    return Response.json(data)
  } catch (err) {
    return ApiError.unexpected().getResponse()
  }
}
