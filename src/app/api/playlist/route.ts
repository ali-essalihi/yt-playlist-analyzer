import type { NextRequest } from 'next/server'
import type { PlaylistResData } from '@/shared/types'
import ApiError from '@/server/ApiError'
import YoutubeService, { defaultService } from '@/server/youtube.service'
import YoutubeAPIClient, { YouTubeApiError } from '@/server/youtube.client'
import { RateLimiterRes } from 'rate-limiter-flexible'
import { generatePlaylistFetchLimiterKey } from '@/server/utils'
import { playlistFetchLimiter } from '@/server/ratelimiter'
import { PLAYLIST_FETCH_LIMITS } from '@/server/constants'
import { playlistIdSchema, ytApiKeySchema } from '@/shared/schemas'

export async function GET(req: NextRequest) {
  try {
    const playlistId = getPlaylistIdFromReq(req)
    const userKey = getUserKeyFromReq(req)

    if (userKey) {
      return Response.json(await fetchPlaylistWithUserKey(playlistId, userKey))
    }

    const ratelimitKey = generatePlaylistFetchLimiterKey(req)
    return Response.json(
      await fetchPlaylistWithServerKey(playlistId, ratelimitKey)
    )
  } catch (err) {
    if (err instanceof ApiError) {
      return err.getResponse()
    }
    return ApiError.unexpected().getResponse()
  }
}

export function getPlaylistIdFromReq(req: NextRequest) {
  const playlistIdParsed = playlistIdSchema.safeParse(
    req.nextUrl.searchParams.get('id')
  )
  if (!playlistIdParsed.success) {
    throw new ApiError(400, 'Invalid playlist id')
  }
  return playlistIdParsed.data
}

export function getUserKeyFromReq(req: Request) {
  const keyHeader = req.headers.get('X-Youtube-API-Key')
  if (!keyHeader) {
    return null
  }
  const userKeyParsed = ytApiKeySchema.safeParse(keyHeader)
  if (!userKeyParsed.success) {
    throw new ApiError(400, 'Invalid YouTube API key')
  }
  return userKeyParsed.data
}

export async function fetchPlaylistWithUserKey(
  playlistId: string,
  userKey: string
): Promise<PlaylistResData> {
  try {
    const client = new YoutubeAPIClient(userKey)
    const service = new YoutubeService(client)

    const metadata = await service.fetchPlaylistMetadata(playlistId)
    if (!metadata) {
      throw new ApiError(404, 'Playlist not found.')
    }

    const { videosCount, videos } =
      await service.fetchPlaylistVideos(playlistId)

    return { metadata, videosCount, videos }
  } catch (err) {
    if (err instanceof YouTubeApiError) {
      throw new ApiError(400, `Youtube API Error: ${err.message}`)
    }
    throw err
  }
}

export async function fetchPlaylistWithServerKey(
  playlistId: string,
  ratelimitKey: string
): Promise<PlaylistResData> {
  try {
    const service = defaultService

    await playlistFetchLimiter.consume(ratelimitKey, 1)

    const metadata = await service.fetchPlaylistMetadata(playlistId)
    if (!metadata) {
      throw new ApiError(404, 'Playlist not found.')
    }

    if (metadata.totalVideos > PLAYLIST_FETCH_LIMITS.MAX_VIDEOS_PER_FETCH) {
      throw new ApiError(
        422,
        `This playlist has ${metadata.totalVideos} videos, which exceeds the maximum allowed of ${PLAYLIST_FETCH_LIMITS.MAX_VIDEOS_PER_FETCH}. Please try a smaller playlist or use your own API key.`
      )
    }

    const { videosCount, videos } =
      await service.fetchPlaylistVideos(playlistId)

    return { metadata, videosCount, videos }
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      throw new ApiError(
        429,
        `Rate limit reached: Please try again later or come back tomorrow after the daily reset. To avoid limits, use your own YouTube API key.`
      )
    }

    if (err instanceof YouTubeApiError && err.isQuotaExceeded()) {
      throw new ApiError(
        503,
        `Service temporarily unavailable: The server’s YouTube API quota has been exceeded. Please use your own API key for unlimited access.`
      )
    }
    throw err
  }
}
