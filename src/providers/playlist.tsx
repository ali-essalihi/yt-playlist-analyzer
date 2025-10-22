'use client'

import type { PlaylistResData } from '@/shared/types'
import { api } from '@/lib/api'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSWRConfig } from 'swr'
import { HTTPError } from 'ky'
import { toast } from 'react-hot-toast'
import PlaylistFetchOverlay from '@/components/PlaylistFetchOverlay'

interface PlaylistContextValue {
  isLoading: boolean
  fetchPlaylist: (id: string, apiKey?: string) => void
  playlist: PlaylistResData | null
}

const PlaylistContext = createContext<PlaylistContextValue>({
  isLoading: false,
  fetchPlaylist: () => {},
  playlist: null,
})

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig()
  const [isLoading, setIsLoading] = useState(false)
  const [playlist, setPlaylist] = useState<PlaylistResData | null>(null)
  const controllerRef = useRef<AbortController>(undefined)

  const fetchPlaylist = useCallback(
    async (id: string, apiKey?: string) => {
      const isApiKeyUsed = typeof apiKey === 'string'

      if (controllerRef.current) {
        controllerRef.current.abort()
      }

      try {
        controllerRef.current = new AbortController()
        setIsLoading(true)
        const res = await api.get('api/playlist', {
          signal: controllerRef.current.signal,
          searchParams: { id },
          headers: {
            'X-Youtube-API-Key': apiKey,
          },
        })

        const data = (await res.json()) as PlaylistResData
        setPlaylist(data)
        if (isApiKeyUsed) localStorage.setItem('yt_api_key', apiKey)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          toast.error('Request canceled.')
          return
        }

        if (err instanceof HTTPError) {
          const { response } = err
          response.json().then((data) => toast.error(data.message))
          return
        }

        toast.error('Something went wrong!')
      } finally {
        controllerRef.current = undefined
        setIsLoading(false)
        mutate('api/limits')
      }
    },
    [controllerRef, mutate]
  )

  const value = useMemo<PlaylistContextValue>(() => {
    return {
      isLoading,
      fetchPlaylist,
      playlist,
    }
  }, [isLoading, playlist, fetchPlaylist])

  const cancelRequest = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
  }, [controllerRef])

  return (
    <PlaylistContext value={value}>
      {children}
      <PlaylistFetchOverlay isLoading={isLoading} onCancel={cancelRequest} />
    </PlaylistContext>
  )
}

export const usePlaylist = () => useContext(PlaylistContext)
