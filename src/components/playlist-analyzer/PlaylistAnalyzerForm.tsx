'use client'

import type { LimitsResData } from '@/shared/types'
import { playlistIdSchema, ytApiKeySchema } from '@/shared/schemas'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useEffect, useRef, useState } from 'react'
import { usePlaylist } from '@/providers/playlist'
import toast from 'react-hot-toast'
import useSWR from 'swr'

const ytUrlSchema = z
  .string()
  .regex(/^https?:\/\/(www\.)?youtube\.com\/playlist\?/i)

async function fetchLimits(url: string): Promise<LimitsResData> {
  const res = await api.get(url)
  return res.json()
}

function UserLimits({ hidden }: { hidden: boolean }) {
  const { data: limits, isLoading } = useSWR('api/limits', fetchLimits)
  let content

  if (isLoading) {
    content = 'Loading limits'
  } else if (limits) {
    const { fetchesUsed, maxFetches, maxVideosPerFetch } = limits
    content = (
      <>
        <div>
          Playlists per day: {fetchesUsed}/{maxFetches} used
        </div>
        <div>Videos per playlist: {maxVideosPerFetch} max</div>
      </>
    )
  } else {
    content = 'Error loading limits'
  }

  return (
    <Card className="bg-secondary" hidden={hidden}>
      <CardHeader>
        <CardTitle>Daily limits</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

export default function PlaylistAnalyzerForm() {
  const { isLoading, fetchPlaylist } = usePlaylist()
  const [useApiKey, setUseApiKey] = useState(false)
  const idInputRef = useRef<HTMLInputElement | null>(null)
  const apiKeyInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (apiKeyInputRef.current) {
      apiKeyInputRef.current.value = localStorage.getItem('yt_api_key') || ''
    }
  }, [apiKeyInputRef])

  const handleCheck = (checked: boolean) => setUseApiKey(checked)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!idInputRef.current || !apiKeyInputRef.current) {
      return
    }

    const idValue = idInputRef.current.value
    const ytUrlParsed = ytUrlSchema.safeParse(idValue)
    const idParsed = playlistIdSchema.safeParse(
      ytUrlParsed.success
        ? new URL(ytUrlParsed.data).searchParams.get('list')
        : idValue
    )
    let apiKey

    if (!idParsed.success) {
      return toast.error('Invalid Youtube Playlist URL or ID')
    }

    if (useApiKey) {
      const apiKeyParsed = ytApiKeySchema.safeParse(
        apiKeyInputRef.current.value
      )
      if (!apiKeyParsed.success) {
        return toast.error('Invalid Youtube API Key')
      }
      apiKey = apiKeyParsed.data
    }

    fetchPlaylist(idParsed.data, apiKey)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex w-full gap-2">
        <Input
          disabled={isLoading}
          type="text"
          placeholder="Youtube Playlist URL or ID"
          ref={idInputRef}
        />
        <Button disabled={isLoading}>Analyze</Button>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="use-api-key"
          onCheckedChange={handleCheck}
          disabled={isLoading}
        />
        <Label htmlFor="use-api-key">Use my own Youtube API Key</Label>
      </div>

      <UserLimits hidden={useApiKey} />

      <Card className="bg-secondary" hidden={!useApiKey}>
        <CardContent>
          <div className="grid w-full items-center gap-3 mb-2">
            <Label htmlFor="api-key">Youtube API Key</Label>
            <Input
              disabled={isLoading}
              type="text"
              id="api-key"
              className="bg-white"
              ref={apiKeyInputRef}
            />
          </div>
          <p className="text-secondary-foreground">
            Using your own API key removes all limits. Need help getting an API
            key?{' '}
            <a
              href="https://www.youtube.com/watch?v=EPeDTRNKAVo"
              target="_blank"
              className="underline text-destructive"
            >
              Watch tutorial video (under 3 minutes)
            </a>
          </p>
        </CardContent>
      </Card>
    </form>
  )
}
