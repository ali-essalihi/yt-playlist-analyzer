import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { formatTotalDuration } from '@/lib/utils'
import { useAnalytics } from '@/providers/analytics'
import { Clock, FastForward, TrendingDown } from 'lucide-react'
import { useState } from 'react'

const speeds = [1, 1.25, 1.5, 1.75, 2]
const minSpeed = 1
const maxSpeed = 2
const defaultSpeed = 1.4

function SpeedCard({ seconds, speed }: { seconds: number; speed: number }) {
  const newSeconds = Math.floor(seconds / speed)
  const saved = seconds - newSeconds
  return (
    <Card className="bg-secondary">
      <CardContent>
        <div className="text-center text-xl font-semibold mb-3">{speed}x</div>
        <div className="flex items-center gap-2 mb-1 text-sm">
          <Clock size={16} className="text-primary" />
          <span>{formatTotalDuration(newSeconds)}</span>
        </div>
        <div className="flex items-center gap-2 text-green-500 text-sm">
          <TrendingDown size={16} />
          <span>Save {formatTotalDuration(saved)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomSpeedCard({ seconds }: { seconds: number }) {
  const [speed, setSpeed] = useState(defaultSpeed)
  const newSeconds = Math.floor(seconds / speed)
  const saved = seconds - newSeconds

  return (
    <Card className="bg-blue-50 border border-blue-200">
      <CardContent className="space-y-4">
        <Label htmlFor="custom-speed">Custom Speed</Label>
        <div className="flex items-center gap-4">
          <Slider
            onValueChange={(value) => setSpeed(value[0])}
            id="custom-speed"
            value={[speed]}
            step={0.05}
            min={minSpeed}
            max={maxSpeed}
          />
          <div className="text-xl font-semibold">{speed}x</div>
        </div>
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2 mb-1 text-sm">
            <Clock size={16} className="text-primary" />
            <span>{formatTotalDuration(newSeconds)}</span>
          </div>
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <TrendingDown size={16} />
            <span>Save {formatTotalDuration(saved)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SpeedImpact() {
  const { summary } = useAnalytics()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FastForward className="text-primary shrink-0" />
          <span className="text-xl">Playback Speed Impact</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {speeds.map((speed) => (
            <SpeedCard
              key={speed}
              seconds={summary.totalDurationSeconds}
              speed={speed}
            />
          ))}
        </div>
        <CustomSpeedCard seconds={summary.totalDurationSeconds} />
      </CardContent>
    </Card>
  )
}
