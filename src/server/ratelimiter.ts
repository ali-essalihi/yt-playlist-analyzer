import { RateLimiterSQLite } from 'rate-limiter-flexible'
import { db } from './db'
import { RATELIMITER_TABLE_NAME, PLAYLIST_FETCH_LIMITS } from './constants'

export const playlistFetchLimiter = new RateLimiterSQLite({
  storeClient: db,
  storeType: 'better-sqlite3',
  points: PLAYLIST_FETCH_LIMITS.MAX_FETCHES,
  duration: PLAYLIST_FETCH_LIMITS.WINDOW_MS / 1000,
  keyPrefix: 'playlist-fetch',
  tableName: RATELIMITER_TABLE_NAME,
})
