import { Youtube } from 'lucide-react'
import { PlaylistProvider } from '@/providers/playlist'
import PlaylistAnalyzerForm from '@/components/playlist-analyzer/PlaylistAnalyzerForm'
import PlaylistAnalyzerOutput from '@/components/playlist-analyzer/PlaylistAnalyzerOutput'

export default function Home() {
  return (
    <PlaylistProvider>
      <div className="shadow py-8">
        <div className="px-4 max-w-3xl mx-auto space-y-6">
          <h1 className="scroll-m-20 flex items-center justify-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            <Youtube size={48} color="red" />
            <span className="ml-4">Playlist Analyzer</span>
          </h1>
          <p className="text-xl text-center leading-8 text-secondary-foreground">
            Get detailed insights and breakdowns of YouTube playlists. Perfect
            planning tool to understand what you&apos;re getting into before you
            start watching
          </p>
          <PlaylistAnalyzerForm />
        </div>
      </div>
      <PlaylistAnalyzerOutput />
    </PlaylistProvider>
  )
}
