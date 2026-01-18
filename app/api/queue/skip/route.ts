import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { SkipVideoResponse } from '@/types/queue'

/**
 * POST /api/queue/skip
 *
 * Пропускает текущее видео в очереди (первое pending видео)
 *
 * Headers:
 * - x-api-key: API ключ (из .env.local)
 *
 * Response:
 * - success: boolean
 * - error?: string
 */
export async function POST() {
  try {
    const supabase = createServiceClient()

    // Получить текущее видео (первое pending)
    const { data: currentVideo } = await supabase
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!currentVideo) {
      return NextResponse.json<SkipVideoResponse>(
        {
          success: false,
          error: 'Очередь пуста',
        },
        { status: 400 }
      )
    }

    // Пометить текущее видео как skipped
    const { error } = await supabase
      .from('video_queue')
      .update({
        status: 'skipped',
        played_at: new Date().toISOString(),
      })
      .eq('id', currentVideo.id)

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json<SkipVideoResponse>(
        {
          success: false,
          error: 'Ошибка сервера',
        },
        { status: 500 }
      )
    }

    return NextResponse.json<SkipVideoResponse>(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in /api/queue/skip:', error)

    return NextResponse.json<SkipVideoResponse>(
      {
        success: false,
        error: 'Ошибка сервера',
      },
      { status: 500 }
    )
  }
}
