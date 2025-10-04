interface YouTubeApiListResponse<I> {
  kind: string
  etag: string
  nextPageToken?: string
  prevPageToken?: string
  items: I[]
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

interface YouTubeApiErrorResponse {
  error: {
    code: number
    message: string
    errors: {
      message: string
      domain: string
      reason: string
    }[]
  }
}

type Thumbnails = {
  [key in 'default' | 'medium' | 'high' | 'standard' | 'maxres']: {
    url: string
    width: number
    height: number
  }
}

type Resource = 'playlists' | 'playlistItems' | 'videos'

const BASE_FIELDS = 'kind,etag,nextPageToken,prevPageToken,pageInfo'

// Playlist

type PlaylistResponse = YouTubeApiListResponse<{
  kind: string
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: Thumbnails
    channelTitle: string
  }
  contentDetails: {
    itemCount: number
  }
}>

const PLAYLIST_PART = 'snippet,contentDetails'
const PLAYLIST_FIELDS = `${BASE_FIELDS},items(id,snippet(publishedAt,channelId,title,description,thumbnails,channelTitle),contentDetails(itemCount))`

// PlaylistItem

type PlaylistItemResponse = YouTubeApiListResponse<{
  kind: string
  etag: string
  id: string
  snippet: {
    position: number
  }
  contentDetails: {
    videoId: string
  }
  status: {
    privacyStatus:
      | 'public'
      | 'private'
      | 'unlisted'
      | 'privacyStatusUnspecified'
  }
}>

const PLAYLIST_ITEM_PART = 'snippet,contentDetails,status'
const PLAYLIST_ITEM_FIELDS = `${BASE_FIELDS},items(id,snippet(position),contentDetails(videoId),status(privacyStatus))`

// Video

type VideoResponse = YouTubeApiListResponse<{
  kind: string
  etag: string
  id: string
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    thumbnails: Thumbnails
    channelTitle: string
    liveBroadcastContent: 'none' | 'live' | 'upcoming'
  }
  contentDetails: {
    duration: string
  }
  status: {
    uploadStatus: 'deleted' | 'failed' | 'processed' | 'rejected' | 'uploaded'
  }
}>

const VIDEO_PART = 'snippet,contentDetails,status'
const VIDEO_FIELDS = `${BASE_FIELDS},items(id,snippet(publishedAt,channelId,title,thumbnails,channelTitle,liveBroadcastContent),contentDetails(duration),status(uploadStatus))`

class YouTubeApiError extends Error {
  constructor(public readonly response: YouTubeApiErrorResponse) {
    super(response.error.message)
    this.name = 'YouTubeApiError'
  }

  isQuotaExceeded() {
    return (
      this.response.error.code === 403 &&
      this.response.error.errors[0].reason === 'quotaExceeded'
    )
  }
}

class YoutubeAPIClient {
  constructor(private readonly apiKey: string) {}

  private async fetchData<R>(resource: Resource, params: URLSearchParams) {
    // Build URL
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`)
    params.set('key', this.apiKey)
    url.search = params.toString()

    // Fetch response
    const res = await fetch(url, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    })

    // Handle error
    if (!res.ok) {
      const err = (await res.json()) as YouTubeApiErrorResponse
      throw new YouTubeApiError(err)
    }

    // Return data
    const data = (await res.json()) as R
    return data
  }

  public fetchPlaylists(ids: string[]) {
    return this.fetchData<PlaylistResponse>(
      'playlists',
      new URLSearchParams({
        id: ids.join(','),
        part: PLAYLIST_PART,
        fields: PLAYLIST_FIELDS,
        maxResults: '50',
      })
    )
  }

  public fetchPlaylistItems(playlistId: string, pageToken: string = '') {
    return this.fetchData<PlaylistItemResponse>(
      'playlistItems',
      new URLSearchParams({
        playlistId,
        part: PLAYLIST_ITEM_PART,
        fields: PLAYLIST_ITEM_FIELDS,
        maxResults: '50',
        pageToken,
      })
    )
  }

  public fetchVideos(ids: string[]) {
    return this.fetchData<VideoResponse>(
      'videos',
      new URLSearchParams({
        id: ids.join(','),
        part: VIDEO_PART,
        fields: VIDEO_FIELDS,
        maxResults: '50',
      })
    )
  }
}

export const defaultClient = new YoutubeAPIClient(process.env.YOUTUBE_API_KEY)
export { YouTubeApiError }
export default YoutubeAPIClient
