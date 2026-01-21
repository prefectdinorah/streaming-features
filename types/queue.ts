import type { Database } from './database'

// Типы из базы данных
export type VideoQueue = Database['twitch_player']['Tables']['video_queue']['Row']
export type VideoQueueInsert = Database['twitch_player']['Tables']['video_queue']['Insert']
export type VideoQueueUpdate = Database['twitch_player']['Tables']['video_queue']['Update']
export type PlayerSettings = Database['twitch_player']['Tables']['player_settings']['Row']

// Enum для статусов видео
export type VideoStatus = 'pending' | 'playing' | 'completed' | 'skipped'

// API типы

export interface AddVideoRequest {
  youtubeUrl: string
  requestedBy: string
}

export interface AddVideoResponse {
  success: boolean
  data?: {
    id: string
    position: number
    title: string
  }
  error?: string
}

export interface SkipVideoResponse {
  success: boolean
  error?: string
}

export interface QueueListResponse {
  success: boolean
  data?: VideoQueue[]
  error?: string
}

export interface PlayerStatusResponse {
  success: boolean
  data?: {
    isPaused: boolean
    currentVideo: VideoQueue | null
    queueLength: number
  }
  error?: string
}

// YouTube API типы

export interface YouTubeVideoMetadata {
  id: string
  title: string
  duration: number // секунды
  thumbnailUrl: string
}

export interface YouTubeAPIResponse {
  items?: Array<{
    id: string
    snippet: {
      title: string
      thumbnails: {
        default: { url: string }
        medium: { url: string }
        high: { url: string }
      }
    }
    contentDetails: {
      duration: string // ISO 8601 format (PT15M33S)
    }
  }>
}
