import { RateLimiterSQLite, RateLimiterPostgres } from 'rate-limiter-flexible'
import { Pool } from 'pg'
import Database from 'better-sqlite3'
import { RATELIMITER_TABLE_NAME, PLAYLIST_FETCH_LIMITS } from './constants'

const isTest = process.env.NODE_ENV === 'test'
const isProd = process.env.NODE_ENV === 'production'

const shared = {
  points: PLAYLIST_FETCH_LIMITS.MAX_FETCHES,
  duration: PLAYLIST_FETCH_LIMITS.WINDOW_MS / 1000,
  keyPrefix: 'playlist-fetch',
  tableName: RATELIMITER_TABLE_NAME,
}

let playlistFetchLimiter: RateLimiterPostgres | RateLimiterSQLite

if (isProd) {
  playlistFetchLimiter = new RateLimiterPostgres({
    ...shared,
    storeClient: new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    tableCreated: true,
  })
} else {
  playlistFetchLimiter = new RateLimiterSQLite({
    ...shared,
    storeClient: new Database(isTest ? ':memory:' : 'app.db'),
    storeType: 'better-sqlite3',
  })
}

export { playlistFetchLimiter }
