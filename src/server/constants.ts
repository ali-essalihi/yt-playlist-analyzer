import ms from 'ms'

export const RATELIMITER_TABLE_NAME = 'rate_limits'

export const PLAYLIST_FETCH_LIMITS = {
  MAX_FETCHES: 5,
  MAX_VIDEOS_PER_FETCH: 500,
  WINDOW_MS: ms('24h'),
}
