'use server'

import { createServiceClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Инициализирует настройки плеера в БД
 *
 * Создает запись в таблице player_settings с дефолтными значениями,
 * если её еще нет.
 *
 * Вызывается автоматически при первом запуске приложения через root layout.
 *
 * Дефолтные настройки:
 * - max_queue_size: 50
 * - max_video_duration: 600 секунд (10 минут)
 * - allow_duplicates: false
 * - transparent_background: true (для наложения в OBS)
 * - background_color: #000000
 */
export async function initializePlayerSettings() {
  try {
    const supabase = createServiceClient()

    // Проверить, существуют ли уже настройки
    const { data: existing, error: selectError } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('id')
      .maybeSingle()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (это нормально)
      console.error('Error checking player settings:', selectError)
      return
    }

    // Если настройки уже существуют, ничего не делаем
    if (existing) {
      console.log('Player settings already initialized')
      return
    }

    // Создать дефолтные настройки
    const { error: insertError } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .insert({
        max_queue_size: 50,
        max_video_duration: 600, // 10 минут
        allow_duplicates: false,
        transparent_background: true,
        background_color: '#000000',
      })

    if (insertError) {
      console.error('Error initializing player settings:', insertError)
      return
    }

    console.log('✅ Player settings initialized with default values')
  } catch (error) {
    console.error('Unexpected error initializing player settings:', error)
  }
}


/**
 * Пропустить текущее видео
 */
export async function skipCurrentVideo() {
  const supabase = createServiceClient()

  // Получить текущее видео из очереди
  const { data: videos, error: fetchError } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*')
    .eq('status', 'pending')
    .order('position', { ascending: true })
    .limit(1)

  if (fetchError) {
    console.error('Error fetching current video:', fetchError)
    return { success: false, error: fetchError.message }
  }

  if (!videos || videos.length === 0) {
    return { success: false, error: 'No video to skip' }
  }

  const currentVideo = videos[0]

  // Пометить как пропущенное
  const { error: updateError } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .update({
      status: 'skipped',
      played_at: new Date().toISOString(),
    })
    .eq('id', currentVideo.id)

  if (updateError) {
    console.error('Error skipping video:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Пометить видео как завершенное
 * Используется плеером когда видео заканчивается
 */
export async function markVideoAsCompleted(videoId: string) {
  const supabase = createServiceClient()

  // Детальное логирование с stack trace
  console.log('[markVideoAsCompleted] ========================================')
  console.log('[markVideoAsCompleted] CALLED! Video ID:', videoId)
  console.log('[markVideoAsCompleted] Timestamp:', new Date().toISOString())
  console.log('[markVideoAsCompleted] Stack trace:', new Error().stack)
  console.log('[markVideoAsCompleted] ========================================')

  const { error } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .update({
      status: 'completed',
      played_at: new Date().toISOString(),
    })
    .eq('id', videoId)

  if (error) {
    console.error('[markVideoAsCompleted] ❌ Error:', error)
    return { success: false, error: error.message }
  }

  console.log('[markVideoAsCompleted] ✅ Success - video marked as completed')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Запустить конкретное видео из очереди
 * Текущее видео удаляется, указанное становится первым
 */
export async function playSpecificVideo(videoId: string) {
  const supabase = createServiceClient()

  // Получить текущее первое видео
  const { data: currentVideos, error: fetchError } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*')
    .eq('status', 'pending')
    .order('position', { ascending: true })
    .limit(1)

  if (fetchError) {
    console.error('Error fetching current video:', fetchError)
    return { success: false, error: fetchError.message }
  }

  // Удалить текущее видео если есть
  if (currentVideos && currentVideos.length > 0) {
    const currentVideo = currentVideos[0]

    // Не удалять если это то же видео
    if (currentVideo.id === videoId) {
      return { success: true }
    }

    const { error: deleteError } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .delete()
      .eq('id', currentVideo.id)

    if (deleteError) {
      console.error('Error deleting current video:', deleteError)
      return { success: false, error: deleteError.message }
    }
  }

  // Поставить выбранное видео на первую позицию
  const { error: updateError } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .update({ position: 0 })
    .eq('id', videoId)

  if (updateError) {
    console.error('Error updating video position:', updateError)
    return { success: false, error: updateError.message }
  }

  // Триггер автоматически переиндексирует позиции
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Вернуть видео обратно в очередь из истории
 */
export async function returnVideoToQueue(videoId: string) {
  const supabase = createServiceClient()

  // Получить максимальную позицию в очереди
  const { data: queueVideos } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('position')
    .eq('status', 'pending')
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = queueVideos && queueVideos.length > 0
    ? queueVideos[0].position + 1
    : 1

  // Вернуть видео в очередь
  const { error } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .update({
      status: 'pending',
      position: nextPosition,
      played_at: null,
    })
    .eq('id', videoId)

  if (error) {
    console.error('Error returning video to queue:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Получить ID настроек плеера (всегда одна запись)
 */
async function getSettingsId(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .select('id')
    .maybeSingle()

  return data?.id
}
