export interface LimitsResData {
  fetchesUsed: number
  fetchesRemaining: number
  maxFetches: number
  maxVideosPerFetch: number
}

export interface ApiErrorResData {
  message: string
}

export type Thumbnails = {
  [key in 'default' | 'medium' | 'high' | 'standard' | 'maxres']: {
    url: string
    width: number
    height: number
  }
}

export interface PlaylistMetadata {
  id: string
  publishedAt: string
  title: string
  description: string
  thumbnails: Thumbnails
  totalVideos: number
  channelTitle: string
  channelId: string
}

export interface PlaylistVideo {
  id: string
  order: number
  channelId: string
  publishedAt: string
  title: string
  channelTitle: string
  durationSeconds: number
  viewCount: number
}

export interface VideosCount {
  available: number
  unavailable: number
  deleted: number
  private: number
  excluded: number
  final: number
}

export interface PlaylistResData {
  metadata: PlaylistMetadata
  videosCount: VideosCount
  videos: PlaylistVideo[]
}
