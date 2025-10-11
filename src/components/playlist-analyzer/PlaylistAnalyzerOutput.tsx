'use client'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { SquarePlay } from 'lucide-react'
import PlaylistAnalytics from './PlaylistAnalytics'
import { usePlaylist } from '@/providers/playlist'
import { AnalyticsProvider } from '@/providers/analytics'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-8 bg-secondary">
      <div className="px-4 max-w-3xl mx-auto">{children}</div>
    </div>
  )
}

export default function PlaylistAnalyzerOutput() {
  const { playlist } = usePlaylist()

  if (playlist) {
    return (
      <Wrapper>
        <AnalyticsProvider playlist={playlist}>
          <PlaylistAnalytics />
        </AnalyticsProvider>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Empty>
        <EmptyHeader>
          <EmptyMedia className="text-muted-foreground">
            <SquarePlay size={48} />
          </EmptyMedia>
          <EmptyTitle>Enter a playlist ID or URL to get started</EmptyTitle>
          <EmptyDescription>
            Detailed insights will appear here
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Wrapper>
  )
}
