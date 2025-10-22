import type { PlaylistVideo } from '@/shared/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import { ListVideo } from 'lucide-react'
import Image from 'next/image'
import {
  Item,
  ItemMedia,
  ItemTitle,
  ItemDescription,
  ItemGroup,
  ItemContent,
  ItemSeparator,
} from '@/components/ui/item'
import { Virtuoso } from 'react-virtuoso'
import { useAnalytics } from '@/providers/analytics'
import { formatVideoDuration, formatViews } from '@/lib/utils'
import dayjs from '@/lib/dayjs'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'

type SortKey = 'views' | 'duration' | 'date' | 'order'

const sortFunctions: Record<
  SortKey,
  (a: PlaylistVideo, b: PlaylistVideo) => number
> = {
  views: (a, b) => a.viewCount - b.viewCount,
  duration: (a, b) => a.durationSeconds - b.durationSeconds,
  date: (a, b) =>
    new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  order: (a, b) => a.order - b.order,
}

interface SortOption {
  value: `${SortKey}_${'asc' | 'desc'}`
  label: string
}

const sortOptions: SortOption[] = [
  { value: 'order_asc', label: 'Default order' },
  { value: 'order_desc', label: 'Reverse order' },
  { value: 'date_desc', label: 'Newest' },
  { value: 'date_asc', label: 'Oldest' },
  { value: 'duration_desc', label: 'Longest' },
  { value: 'duration_asc', label: 'Shortest' },
  { value: 'views_desc', label: 'Most viewed' },
  { value: 'views_asc', label: 'Least viewed' },
]

export default function VideosList() {
  const { playlist } = useAnalytics()

  const [selectedChannel, setSelectedChannel] = useState('all')
  const [sortBy, setSortBy] = useState('order_asc')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    setSelectedChannel('all')
    setSortBy('order_asc')
    setSearch('')
  }, [playlist])

  const channels = useMemo(() => {
    const set = new Set()
    const arr = []
    for (const video of playlist.videos) {
      if (set.has(video.channelId)) continue
      set.add(video.channelId)
      arr.push({ id: video.channelId, title: video.channelTitle })
    }
    return arr
  }, [playlist])

  const videosToShow = useMemo(() => {
    const searchTerm = deferredSearch.trim().toLowerCase()

    // Filter
    const filtered = playlist.videos.filter((video) => {
      const matchesSearch =
        searchTerm === '' || video.title.toLowerCase().includes(searchTerm)
      const matchesChannel =
        selectedChannel === 'all' || video.channelId === selectedChannel
      return matchesSearch && matchesChannel
    })

    // Sort
    const [key, direction] = sortBy.split('_') as [SortKey, 'asc' | 'desc']
    const sortFn = sortFunctions[key]
    const sorted = filtered.sort((a, b) => {
      const result = sortFn(a, b)
      return direction === 'desc' ? -result : result
    })

    return sorted
  }, [deferredSearch, sortBy, selectedChannel, playlist])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  }

  const handleSortChange = (value: SortOption['value']) => {
    setSortBy(value)
  }

  const handleChannelChange = (value: string) => {
    setSelectedChannel(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListVideo className="text-primary shrink-0" />
          <span className="text-xl">Videos</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <Input
            value={search}
            type="search"
            placeholder="Search videos"
            className="col-span-4 lg:col-span-2"
            onChange={handleSearchChange}
          />
          <div className="col-span-2 lg:col-span-1">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort" className="grow" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <Select value={selectedChannel} onValueChange={handleChannelChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-secondary-foreground">
          Showing {videosToShow.length} of {playlist.videosCount.final} videos
        </div>

        <ItemGroup className="overflow-auto">
          <Virtuoso
            style={{ height: '70vh', overflow: 'auto' }}
            data={videosToShow}
            itemContent={(index, video) => (
              <div key={video.id}>
                <ItemSeparator />
                <Item
                  className="relative hover:bg-secondary pl-8"
                  key={video.id}
                >
                  <span className="text-muted-foreground absolute left-0 top-1/2 -translate-y-1/2 text-xs">
                    {video.order}
                  </span>
                  <ItemMedia className="relative">
                    <Image
                      src={`https://i.ytimg.com/vi/${video.id}/default.jpg`}
                      alt=""
                      width={120}
                      height={90}
                      unoptimized
                    />
                    <span className="absolute bottom-1 right-1 inline-block bg-black text-white text-[10px] py-0.5 px-1 font-semibold rounded-md">
                      {formatVideoDuration(video.durationSeconds)}
                    </span>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="line-clamp-2">
                      {video.title}
                    </ItemTitle>
                    <ItemDescription className="line-clamp-none text-xs">
                      {video.channelTitle} • {formatViews(video.viewCount)}{' '}
                      views • {dayjs(video.publishedAt).fromNow()}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            )}
          />
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
