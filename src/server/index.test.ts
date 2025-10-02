import type { NextRequest } from 'next/server'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import * as utils from '@/server/utils'
import * as limitsRoute from '@/app/api/limits/route'
import { PLAYLIST_FETCH_LIMITS } from './constants'
import { playlistFetchLimiter } from './ratelimiter'
import { RateLimiterRes } from 'rate-limiter-flexible'
import YoutubeAPIClient, { YouTubeApiError } from './youtube.client'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Utils', () => {
  describe('getPlaylistFetchUsage', () => {
    const mockKey = 'test-key'

    it('returns default limits when ratelimiter returns null', async () => {
      vi.spyOn(playlistFetchLimiter, 'get').mockResolvedValue(null)

      const usage = await utils.getPlaylistFetchUsage(mockKey)

      expect(usage).toEqual({
        fetchesUsed: 0,
        fetchesRemaining: PLAYLIST_FETCH_LIMITS.MAX_FETCHES,
      })
    })

    it('returns usage values when ratelimiter returns valid result', async () => {
      vi.spyOn(playlistFetchLimiter, 'get').mockResolvedValue({
        consumedPoints: 2,
        remainingPoints: 3,
      } as RateLimiterRes)

      const usage = await utils.getPlaylistFetchUsage(mockKey)

      expect(usage).toEqual({
        fetchesUsed: 2,
        fetchesRemaining: 3,
      })
    })

    it('caps fetchesUsed at MAX_FETCHES when consumedPoints exceed limit', async () => {
      vi.spyOn(playlistFetchLimiter, 'get').mockResolvedValue({
        consumedPoints: PLAYLIST_FETCH_LIMITS.MAX_FETCHES + 1,
        remainingPoints: 0,
      } as RateLimiterRes)

      const usage = await utils.getPlaylistFetchUsage(mockKey)

      expect(usage).toEqual({
        fetchesUsed: PLAYLIST_FETCH_LIMITS.MAX_FETCHES,
        fetchesRemaining: 0,
      })
    })
  })
})

describe('Route Handlers', () => {
  describe('GET /limits', () => {
    it('returns 200 with correct limits data', async () => {
      const req = {} as NextRequest
      vi.spyOn(utils, 'getPlaylistFetchUsage').mockResolvedValue({
        fetchesUsed: 2,
        fetchesRemaining: 3,
      })
      vi.spyOn(utils, 'generatePlaylistFetchLimiterKey').mockReturnValue(
        'test-key'
      )
      const res = await limitsRoute.GET(req)
      const resData = await res.json()

      expect(res.status).toBe(200)
      expect(resData).toEqual({
        fetchesUsed: 2,
        fetchesRemaining: 3,
        maxFetches: PLAYLIST_FETCH_LIMITS.MAX_FETCHES,
        maxVideosPerFetch: PLAYLIST_FETCH_LIMITS.MAX_VIDEOS_PER_FETCH,
      })
    })
  })
})

describe('Youtube API Client', () => {
  const mockApiKey = 'TEST_KEY'
  let client: YoutubeAPIClient

  beforeEach(() => {
    client = new YoutubeAPIClient(mockApiKey)
  })

  describe('fetchData', () => {
    it('returns data on success', async () => {
      const mockData = { kind: 'youtube#playlistListResponse' }
      const mockResource = 'playlists'
      const mockParams = new URLSearchParams({
        maxResults: '50',
        part: 'snippet',
      })
      const fetchMock = vi
        .spyOn(global, 'fetch')
        .mockResolvedValue({ ok: true, json: async () => mockData } as Response)

      // @ts-ignore
      const data = await client.fetchData(mockResource, mockParams)
      expect(fetchMock).toHaveBeenCalledOnce()
      expect(data).toBe(mockData)

      const urlArg = new URL(fetchMock.mock.calls[0][0] as string)
      expect(urlArg.origin + urlArg.pathname).toBe(
        `https://www.googleapis.com/youtube/v3/${mockResource}`
      )
      expect(urlArg.searchParams.get('key')).toBe(mockApiKey)
      expect(urlArg.searchParams.get('part')).toBe('snippet')
      expect(urlArg.searchParams.get('maxResults')).toBe('50')
    })

    it('throws YouTubeApiError on failure', async () => {
      const mockError = { error: { code: 400, message: 'Invalid API key' } }
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => mockError,
      } as Response)
      await expect(
        // @ts-ignore
        client.fetchData('playlists', new URLSearchParams())
      ).rejects.toThrow(YouTubeApiError)
    })
  })
})
