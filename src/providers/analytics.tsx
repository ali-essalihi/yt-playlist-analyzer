'use client'

import type { PlaylistResData } from '@/shared/types'
import { createContext, useContext, useMemo } from 'react'

interface Summary {
  totalDurationSeconds: number
  totalVideoViews: number
  totalChannels: number
}

interface AnalyticsContextValue {
  playlist: PlaylistResData
  summary: Summary
}

interface Props {
  children: React.ReactNode
  playlist: PlaylistResData
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(
  undefined
)

export function AnalyticsProvider({ playlist, children }: Props) {
  const summary = useMemo<Summary>(() => {
    const channels = new Set()
    let views = 0,
      seconds = 0
    for (const video of playlist.videos) {
      views += video.viewCount
      seconds += video.durationSeconds
      channels.add(video.channelId)
    }
    return {
      totalDurationSeconds: seconds,
      totalVideoViews: views,
      totalChannels: channels.size,
    }
  }, [playlist])

  const value = useMemo<AnalyticsContextValue>(() => {
    return { playlist, summary }
  }, [playlist, summary])

  return <AnalyticsContext value={value}>{children}</AnalyticsContext>
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return ctx
}
