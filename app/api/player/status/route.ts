import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlayerStatusResponse } from '@/types/queue'

/**
 * GET /api/player/status
 *
 * Получает текущий статус плеера
 *
 * Response:
 * - success: boolean
 * - data?: {
 *     isPaused: boolean
 *     currentVideo: VideoQueue | null
 *     queueLength: number
 *   }
 * - error?: string
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Получить настройки плеера
    const { data: settings } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .maybeSingle()

    // Получить текущее видео (первое pending)
    const { data: currentVideo } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    // Получить количество видео в очереди
    const { count } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json<PlayerStatusResponse>(
      {
        success: true,
        data: {
          isPaused: settings?.is_paused || false,
          currentVideo: currentVideo || null,
          queueLength: count || 0,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in /api/player/status:', error)

    return NextResponse.json<PlayerStatusResponse>(
      {
        success: false,
        error: 'Ошибка сервера',
      },
      { status: 500 }
    )
  }
}
