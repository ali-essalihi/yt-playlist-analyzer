import React from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { FocusTrap } from 'focus-trap-react'

interface Props {
  isLoading: boolean
  onCancel: () => void
}

export default function PlaylistFetchOverlay({
  isLoading = false,
  onCancel,
}: Props) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <FocusTrap>
        <Empty>
          <EmptyHeader>
            <EmptyMedia className="text-white">
              <Spinner className="size-8" />
            </EmptyMedia>
            <EmptyTitle className="text-white">
              Analyzing Your YouTube Playlist...
            </EmptyTitle>
            <EmptyDescription className="text-white">
              Please wait while we fetch your playlist details. Large playlists
              may take a bit longer to load.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </EmptyContent>
        </Empty>
      </FocusTrap>
    </div>
  )
}
