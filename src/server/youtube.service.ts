import type {
  PlaylistMetadata,
  PlaylistVideo,
  VideosCount,
} from '@/shared/types'
import YoutubeAPIClient, { defaultClient } from './youtube.client'
import iso8601Dur from 'iso8601-duration'

class YoutubeService {
  constructor(private readonly client: YoutubeAPIClient) {}

  async fetchPlaylistMetadata(
    playlistId: string
  ): Promise<PlaylistMetadata | null> {
    const playlist = (await this.client.fetchPlaylists([playlistId])).items[0]
    if (!playlist) return null
    return {
      id: playlist.id,
      publishedAt: playlist.snippet.publishedAt,
      title: playlist.snippet.title,
      description: playlist.snippet.description,
      thumbnails: playlist.snippet.thumbnails,
      channelTitle: playlist.snippet.channelTitle,
      totalVideos: playlist.contentDetails.itemCount,
    }
  }

  async fetchPlaylistVideos(playlistId: string): Promise<{
    videosCount: VideosCount
    videos: PlaylistVideo[]
  }> {
    const videosCount: VideosCount = {
      available: 0,
      unavailable: 0,
      deleted: 0,
      private: 0,
      excluded: 0,
      final: 0,
    }
    const videos: PlaylistVideo[] = []

    let nextPageToken: string | undefined

    do {
      const videoIds: string[] = []
      const playlistItems = await this.client.fetchPlaylistItems(
        playlistId,
        nextPageToken
      )

      for (const item of playlistItems.items) {
        switch (item.status.privacyStatus) {
          case 'public':
          case 'unlisted':
            videosCount.available++
            videoIds.push(item.contentDetails.videoId)
            break
          case 'private':
            videosCount.private++
            break
          default:
            videosCount.deleted++
        }
      }

      const fetchedVideos = await this.client.fetchVideos(videoIds)

      for (const video of fetchedVideos.items) {
        const isExcluded =
          video.snippet.liveBroadcastContent !== 'none' ||
          video.status.uploadStatus !== 'processed'

        if (isExcluded) {
          videosCount.excluded++
          continue
        }

        videos.push({
          id: video.id,
          publishedAt: video.snippet.publishedAt,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          durationSeconds: iso8601Dur.toSeconds(
            iso8601Dur.parse(video.contentDetails.duration)
          ),
          viewCount: parseInt(video.statistics.viewCount, 10),
        })
      }

      nextPageToken = playlistItems.nextPageToken
    } while (nextPageToken)

    videosCount.unavailable = videosCount.deleted + videosCount.private
    videosCount.final = videos.length

    return { videosCount, videos }
  }
}

export const defaultService = new YoutubeService(defaultClient)
export default YoutubeService
