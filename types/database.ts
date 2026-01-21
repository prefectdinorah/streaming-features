// Этот файл будет сгенерирован автоматически после создания Supabase проекта
// Команда: npx supabase gen types typescript --project-id <project-id> > types/database.ts
//
// Пока используем ручную типизацию для разработки

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
  twitch_player: {
    Tables: {
      video_queue: {
        Row: {
          id: string
          youtube_id: string
          title: string
          duration: number | null
          thumbnail_url: string | null
          requested_by: string
          requested_at: string
          status: 'pending' | 'playing' | 'completed' | 'skipped'
          played_at: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          youtube_id: string
          title: string
          duration?: number | null
          thumbnail_url?: string | null
          requested_by: string
          requested_at?: string
          status?: 'pending' | 'playing' | 'completed' | 'skipped'
          played_at?: string | null
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          youtube_id?: string
          title?: string
          duration?: number | null
          thumbnail_url?: string | null
          requested_by?: string
          requested_at?: string
          status?: 'pending' | 'playing' | 'completed' | 'skipped'
          played_at?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      player_settings: {
        Row: {
          id: string
          is_paused: boolean
          current_video_id: string | null
          max_queue_size: number
          max_video_duration: number
          allow_duplicates: boolean
          seek_to_seconds: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          is_paused?: boolean
          current_video_id?: string | null
          max_queue_size?: number
          max_video_duration?: number
          allow_duplicates?: boolean
          seek_to_seconds?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          is_paused?: boolean
          current_video_id?: string | null
          max_queue_size?: number
          max_video_duration?: number
          allow_duplicates?: boolean
          seek_to_seconds?: number | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
