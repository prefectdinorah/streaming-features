import type { VideoQueue } from './queue'

// YouTube IFrame Player API типы
// Документация: https://developers.google.com/youtube/iframe_api_reference

export interface YouTubePlayerConfig {
  width?: string | number
  height?: string | number
  videoId: string
  playerVars?: {
    autoplay?: 0 | 1
    controls?: 0 | 1
    modestbranding?: 0 | 1
    rel?: 0 | 1
    showinfo?: 0 | 1
    fs?: 0 | 1
    iv_load_policy?: 1 | 3
    loop?: 0 | 1
    playlist?: string
    start?: number
    end?: number
  }
  events?: {
    onReady?: (event: YT.PlayerEvent) => void
    onStateChange?: (event: YT.OnStateChangeEvent) => void
    onError?: (event: YT.OnErrorEvent) => void
  }
}

// Custom hook типы

export interface UseRealtimeQueueResult {
  queue: VideoQueue[]
  currentVideo: VideoQueue | null
  nextVideo: VideoQueue | null
  isLoading: boolean
  markAsCompleted: (videoId: string) => Promise<void>
}

// Player state

export interface PlayerState {
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  duration: number
  volume: number
}
