import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { extractVideoId } from '@/lib/youtube/parser'
import { getVideoMetadata } from '@/lib/youtube/api'
import { z } from 'zod'
import type { AddVideoResponse } from '@/types/queue'

// Валидация входных данных
const addVideoSchema = z.object({
  youtubeUrl: z.string().url('Неверный формат URL'),
  requestedBy: z
    .string()
    .min(1, 'Username не может быть пустым')
    .max(100, 'Username слишком длинный'),
})

/**
 * POST /api/queue/add
 *
 * Добавляет YouTube видео в очередь
 *
 * Body:
 * - youtubeUrl: YouTube URL (https://www.youtube.com/watch?v=...)
 * - requestedBy: Twitch username
 *
 * Headers:
 * - x-api-key: API ключ (из .env.local)
 *
 * Response:
 * - success: boolean
 * - data?: { id, position, title }
 * - error?: string
 */
export async function POST(request: NextRequest) {
  try {
    // Парсинг и валидация тела запроса
    const body = await request.json()
    const parseResult = addVideoSchema.safeParse(body)

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]
      return NextResponse.json<AddVideoResponse>(
        {
          success: false,
          error: firstError?.message || 'Неверные данные',
        },
        { status: 400 }
      )
    }

    const { youtubeUrl, requestedBy } = parseResult.data

    // Извлечь video ID из URL
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json<AddVideoResponse>(
        {
          success: false,
          error: 'Неверная YouTube ссылка',
        },
        { status: 400 }
      )
    }

    // Получить метаданные видео через YouTube API
    const metadata = await getVideoMetadata(videoId)
    if (!metadata) {
      return NextResponse.json<AddVideoResponse>(
        {
          success: false,
          error: 'Не удалось загрузить видео. Проверьте ссылку.',
        },
        { status: 400 }
      )
    }

    // Создать Supabase клиент с service role (обход RLS)
    const supabase = createServiceClient()

    // Получить настройки плеера
    const { data: settings } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .single()

    if (settings) {
      // 1. Проверка длительности видео
      if (
        settings.max_video_duration &&
        metadata.duration > settings.max_video_duration
      ) {
        const maxMinutes = Math.floor(settings.max_video_duration / 60)
        return NextResponse.json<AddVideoResponse>(
          {
            success: false,
            error: `Видео слишком длинное. Максимум ${maxMinutes} минут.`,
          },
          { status: 400 }
        )
      }

      // 2. Проверка дубликатов (если запрещены)
      if (!settings.allow_duplicates) {
        const { data: existing } = await supabase
          .schema('twitch_player')
          .from('video_queue')
          .select('id')
          .eq('youtube_id', videoId)
          .eq('status', 'pending')
          .maybeSingle()

        if (existing) {
          return NextResponse.json<AddVideoResponse>(
            {
              success: false,
              error: 'Это видео уже в очереди',
            },
            { status: 400 }
          )
        }
      }

      // 3. Проверка размера очереди
      const { count } = await supabase
        .from('video_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (count !== null && settings.max_queue_size && count >= settings.max_queue_size) {
        return NextResponse.json<AddVideoResponse>(
          {
            success: false,
            error: `Очередь переполнена. Максимум ${settings.max_queue_size} видео.`,
          },
          { status: 400 }
        )
      }
    }

    // Получить следующую позицию в очереди
    const { data: lastVideo } = await supabase
      .from('video_queue')
      .select('position')
      .eq('status', 'pending')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPosition = lastVideo ? lastVideo.position + 1 : 1

    // Добавить видео в очередь
    const { data: newVideo, error: insertError } = await supabase
      .from('video_queue')
      .insert({
        youtube_id: videoId,
        title: metadata.title,
        duration: metadata.duration,
        thumbnail_url: metadata.thumbnailUrl,
        requested_by: requestedBy,
        position: nextPosition,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json<AddVideoResponse>(
        {
          success: false,
          error: 'Ошибка сервера. Попробуйте позже.',
        },
        { status: 500 }
      )
    }

    // Успешный ответ
    return NextResponse.json<AddVideoResponse>(
      {
        success: true,
        data: {
          id: newVideo.id,
          position: newVideo.position,
          title: newVideo.title,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in /api/queue/add:', error)

    return NextResponse.json<AddVideoResponse>(
      {
        success: false,
        error: 'Ошибка сервера. Попробуйте позже.',
      },
      { status: 500 }
    )
  }
}
