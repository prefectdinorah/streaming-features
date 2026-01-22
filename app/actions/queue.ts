'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { extractVideoId } from '@/lib/youtube/parser'
import { getVideoMetadata } from '@/lib/youtube/api'
import { revalidatePath } from 'next/cache'

/**
 * Добавить видео в очередь (Server Action для UI)
 */
export async function addVideoToQueue(
  youtubeUrl: string,
  requestedBy: string
) {
  try {
    // Валидация
    if (!youtubeUrl || !youtubeUrl.trim()) {
      return { success: false, error: 'Введите YouTube URL' }
    }

    if (!requestedBy || !requestedBy.trim()) {
      return { success: false, error: 'Введите имя' }
    }

    if (requestedBy.length > 100) {
      return { success: false, error: 'Имя слишком длинное (макс 100 символов)' }
    }

    // Извлечь video ID из URL
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return { success: false, error: 'Неверная YouTube ссылка' }
    }

    // Получить метаданные видео через YouTube API
    const metadata = await getVideoMetadata(videoId)
    if (!metadata) {
      return {
        success: false,
        error: 'Не удалось загрузить видео. Проверьте ссылку.',
      }
    }

    // Создать Supabase клиент с service role
    const supabase = createServiceClient()

    // Получить настройки плеера
    const { data: settings } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .maybeSingle()

    if (settings) {
      // Проверка длительности видео
      if (
        settings.max_video_duration &&
        metadata.duration > settings.max_video_duration
      ) {
        const maxMinutes = Math.floor(settings.max_video_duration / 60)
        return {
          success: false,
          error: `Видео слишком длинное. Максимум ${maxMinutes} минут.`,
        }
      }

      // Проверка дубликатов
      if (!settings.allow_duplicates) {
        const { data: existing } = await supabase
          .schema('twitch_player')
          .from('video_queue')
          .select('id')
          .eq('youtube_id', videoId)
          .eq('status', 'pending')
          .maybeSingle()

        if (existing) {
          return {
            success: false,
            error: 'Это видео уже в очереди',
          }
        }
      }

      // Проверка размера очереди
      const { count } = await supabase
        .schema('twitch_player')
        .from('video_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (
        count !== null &&
        settings.max_queue_size &&
        count >= settings.max_queue_size
      ) {
        return {
          success: false,
          error: `Очередь переполнена. Максимум ${settings.max_queue_size} видео.`,
        }
      }
    }

    // Получить следующую позицию в очереди
    const { data: lastVideo } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('position')
      .eq('status', 'pending')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPosition = lastVideo ? lastVideo.position + 1 : 1

    // Добавить видео в очередь
    const { data: newVideo, error: insertError } = await supabase
      .schema('twitch_player')
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
      return {
        success: false,
        error: 'Ошибка сервера. Попробуйте позже.',
      }
    }

    // Обновить страницу
    revalidatePath('/dashboard/queue')

    return {
      success: true,
      data: {
        id: newVideo.id,
        position: newVideo.position,
        title: newVideo.title,
      },
    }
  } catch (error) {
    console.error('Error in addVideoToQueue:', error)
    return {
      success: false,
      error: 'Ошибка сервера. Попробуйте позже.',
    }
  }
}
