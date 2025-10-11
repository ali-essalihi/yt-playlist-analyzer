import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVideoDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)

  if (h > 0) {
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
  }
  return [m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function formatViews(views: number) {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  })
  return formatter.format(views)
}

export function formatTotalDuration(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)

  if (h > 0) {
    return `${h}h ${m}m`
  } else {
    return `${m}m`
  }
}
