import { Video, Clock, Eye, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAnalytics } from '@/providers/analytics'
import { formatTotalDuration, formatViews } from '@/lib/utils'

export default function Summary() {
  const { playlist, summary } = useAnalytics()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="space-y-1">
          <div className="rounded bg-blue-50 text-blue-500 inline-block p-2">
            <Video />
          </div>
          <div className="text-secondary-foreground text-sm">
            Available videos
          </div>
          <div className="font-semibold text-xl">
            {playlist.videosCount.final}
          </div>
          <div className="text-xs text-muted-foreground">
            {playlist.videosCount.unavailable + playlist.videosCount.excluded}{' '}
            unavailable
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1">
          <div className="rounded bg-green-50 text-green-500 inline-block p-2">
            <Clock />
          </div>
          <div className="text-secondary-foreground text-sm">
            Total Duration
          </div>
          <div className="font-semibold text-xl">
            {formatTotalDuration(summary.totalDurationSeconds)}
          </div>
          <div className="text-xs text-muted-foreground">
            Avg:{' '}
            {formatTotalDuration(
              Math.floor(
                summary.totalDurationSeconds / playlist.videosCount.final
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1">
          <div className="rounded bg-purple-50 text-purple-500 inline-block p-2">
            <Eye />
          </div>
          <div className="text-secondary-foreground text-sm">
            Total Video Views
          </div>
          <div className="font-semibold text-xl">
            {formatViews(summary.totalVideoViews)}
          </div>
          <div className="text-xs text-muted-foreground">
            Avg:{' '}
            {formatViews(
              Math.floor(summary.totalVideoViews / playlist.videosCount.final)
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1">
          <div className="rounded bg-orange-50 text-orange-500 inline-block p-2">
            <Users />
          </div>
          <div className="text-secondary-foreground text-sm">Channels</div>
          <div className="font-semibold text-xl">{summary.totalChannels}</div>
        </CardContent>
      </Card>
    </div>
  )
}
