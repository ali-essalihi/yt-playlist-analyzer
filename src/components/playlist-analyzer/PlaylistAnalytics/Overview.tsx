import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAnalytics } from '@/providers/analytics'
import dayjs from '@/lib/dayjs'

export default function Overview() {
  const { playlist } = useAnalytics()
  const thumbnail = playlist.metadata.thumbnails.medium

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Image
          className="w-full"
          src={thumbnail.url}
          alt=""
          width={thumbnail.width}
          height={thumbnail.height}
          unoptimized
        />
        <div className="space-y-2">
          <a
            href={`https://www.youtube.com/playlist?list=${playlist.metadata.id}`}
            className="block scroll-m-20 text-xl font-medium tracking-tight hover:underline"
            target="_blank"
          >
            {playlist.metadata.title}
          </a>
          <div className="text-sm text-secondary-foreground">
            By{' '}
            <a
              href={`https://www.youtube.com/channel/${playlist.metadata.channelId}`}
              className="inline font-medium hover:underline"
              target="_blank"
            >
              {playlist.metadata.channelTitle}
            </a>
          </div>
          <div className="text-xs text-muted-foreground">
            {playlist.metadata.totalVideos} Videos • Created{' '}
            <span>{dayjs(playlist.metadata.publishedAt).fromNow()}</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0">
                Description
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Description</DialogTitle>
                <DialogDescription>
                  {playlist.metadata.description}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
