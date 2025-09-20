import type { NextRequest } from 'next/server'
import { ipAddress } from '@vercel/functions'
import { PLAYLIST_FETCH_LIMITS } from './constants'
import { playlistFetchLimiter } from './ratelimiter'

export function getClientIp(req: NextRequest) {
  return ipAddress(req) || '127.0.0.1'
}

export function generatePlaylistFetchLimiterKey(req: NextRequest) {
  return getClientIp(req)
}

export async function getPlaylistFetchUsage(key: string) {
  const res = await playlistFetchLimiter.get(key)
  let fetchesUsed = 0
  let fetchesRemaining = PLAYLIST_FETCH_LIMITS.MAX_FETCHES
  if (res) {
    fetchesUsed = Math.min(
      res.consumedPoints,
      PLAYLIST_FETCH_LIMITS.MAX_FETCHES
    )
    fetchesRemaining = res.remainingPoints
  }
  return { fetchesUsed, fetchesRemaining }
}
