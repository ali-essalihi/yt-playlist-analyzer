import Overview from './Overview'
import Summary from './Summary'
import SpeedImpact from './SpeedImpact'
import VideosList from './VideosList'

export default function PlaylistAnalytics() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Overview />
      <Summary />
      <VideosList />
      <SpeedImpact />
    </div>
  )
}
