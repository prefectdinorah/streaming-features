import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { QueueListResponse } from '@/types/queue'

/**
 * GET /api/queue/list
 *
 * Получает список всех видео в очереди (pending status)
 *
 * Response:
 * - success: boolean
 * - data?: VideoQueue[]
 * - error?: string
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json<QueueListResponse>(
        {
          success: false,
          error: 'Ошибка сервера',
        },
        { status: 500 }
      )
    }

    return NextResponse.json<QueueListResponse>(
      {
        success: true,
        data: data || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in /api/queue/list:', error)

    return NextResponse.json<QueueListResponse>(
      {
        success: false,
        error: 'Ошибка сервера',
      },
      { status: 500 }
    )
  }
}
