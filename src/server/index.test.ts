import type { NextRequest } from 'next/server'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import * as utils from '@/server/utils'
import * as limitsRoute from '@/app/api/limits/route'
import { PLAYLIST_FETCH_LIMITS } from './constants'
import { playlistFetchLimiter } from './ratelimiter'
import { RateLimiterRes } from 'rate-limiter-flexible'
import YoutubeAPIClient, { YouTubeApiError } from './youtube.client'
import YoutubeService from './youtube.service'

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

describe('Youtube API Service', () => {
  const mockApiKey = 'TEST_KEY'
  let client: YoutubeAPIClient
  let service: YoutubeService

  beforeEach(() => {
    client = new YoutubeAPIClient(mockApiKey)
    service = new YoutubeService(client)
  })

  describe('fetchPlaylistMetadata', () => {
    it('returns playlist metadata when playlist exists', async () => {
      const mockPlaylist = {
        id: '123',
        snippet: {
          title: 'My Playlist',
          description: 'A test playlist',
          thumbnails: { default: { url: 'http://img' } },
          channelTitle: 'Test Channel',
        },
        contentDetails: {
          itemCount: 10,
        },
      }

      vi.spyOn(client, 'fetchPlaylists').mockResolvedValue({
        items: [mockPlaylist],
      } as any)

      const result = await service.fetchPlaylistMetadata('123')

      expect(result).toEqual({
        id: '123',
        title: 'My Playlist',
        description: 'A test playlist',
        thumbnails: { default: { url: 'http://img' } },
        channelTitle: 'Test Channel',
        totalVideos: 10,
      })
    })

    it('returns null when no playlist is found', async () => {
      vi.spyOn(client, 'fetchPlaylists').mockResolvedValue({
        items: [],
      } as any)

      const result = await service.fetchPlaylistMetadata('not-found')

      expect(result).toBeNull()
    })
  })

  describe('fetchPlaylistVideos', () => {
    it('fetches playlist videos with correct counts', async () => {
      vi.spyOn(client, 'fetchPlaylistItems')
        .mockResolvedValueOnce({
          items: [
            {
              contentDetails: { videoId: 'vid1' },
              status: { privacyStatus: 'public' },
            },
            {
              contentDetails: { videoId: 'vid2' },
              status: { privacyStatus: 'unlisted' },
            },
            {
              contentDetails: { videoId: 'vid3' },
              status: { privacyStatus: 'private' },
            },
          ],
          nextPageToken: 'NEXT',
        } as any)
        .mockResolvedValueOnce({
          items: [
            {
              contentDetails: { videoId: 'vid4' },
              status: { privacyStatus: 'privacyStatusUnspecified' },
            },
            {
              contentDetails: { videoId: 'vid5' },
              status: { privacyStatus: 'public' },
            },
            {
              contentDetails: { videoId: 'vid6' },
              status: { privacyStatus: 'public' },
            },
          ],
          nextPageToken: undefined,
        } as any)

      vi.spyOn(client, 'fetchVideos')
        .mockResolvedValueOnce({
          items: [
            {
              id: 'vid1',
              snippet: {
                title: 'Public Video',
                channelTitle: 'Channel A',
                liveBroadcastContent: 'none',
              },
              status: { uploadStatus: 'processed' },
              contentDetails: { duration: 'PT2M10S' },
            },
            {
              id: 'vid2',
              snippet: {
                title: 'Unlisted Video',
                channelTitle: 'Channel A',
                liveBroadcastContent: 'none',
              },
              status: { uploadStatus: 'processed' },
              contentDetails: { duration: 'PT5M' },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          items: [
            {
              id: 'vid5',
              snippet: {
                title: 'Live Stream',
                channelTitle: 'Channel B',
                liveBroadcastContent: 'live',
              },
              status: { uploadStatus: 'processed' },
              contentDetails: { duration: 'PT10M' },
            },
            {
              id: 'vid6',
              snippet: {
                title: 'Unprocessed Upload',
                channelTitle: 'Channel B',
                liveBroadcastContent: 'none',
              },
              status: { uploadStatus: 'uploaded' },
              contentDetails: { duration: 'PT3M' },
            },
          ],
        } as any)

      const result = await service.fetchPlaylistVideos('playlist123')

      expect(result.videosCount).toEqual({
        available: 4,
        private: 1,
        deleted: 1,
        unavailable: 2,
        excluded: 2,
        final: 2,
      })

      expect(result.videos).toEqual([
        {
          id: 'vid1',
          title: 'Public Video',
          channelTitle: 'Channel A',
          durationSeconds: 130,
        },
        {
          id: 'vid2',
          title: 'Unlisted Video',
          channelTitle: 'Channel A',
          durationSeconds: 300,
        },
      ])
    })
  })
})
