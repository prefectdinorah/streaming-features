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
 * - is_paused: false
 * - max_queue_size: 50
 * - max_video_duration: 600 секунд (10 минут)
 * - allow_duplicates: false
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
        is_paused: false,
        max_queue_size: 50,
        max_video_duration: 600, // 10 минут
        allow_duplicates: false,
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
 * Поставить плеер на паузу
 */
export async function pausePlayer() {
  const supabase = createServiceClient()

  const settingsId = await getSettingsId(supabase)
  if (!settingsId) {
    return { success: false, error: 'Settings not found' }
  }

  const { error } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .update({ is_paused: true })
    .eq('id', settingsId)

  if (error) {
    console.error('Error pausing player:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Возобновить воспроизведение
 */
export async function resumePlayer() {
  const supabase = createServiceClient()

  const settingsId = await getSettingsId(supabase)
  if (!settingsId) {
    return { success: false, error: 'Settings not found' }
  }

  const { error } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .update({ is_paused: false })
    .eq('id', settingsId)

  if (error) {
    console.error('Error resuming player:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Остановить плеер (пауза + сброс текущего видео)
 */
export async function stopPlayer() {
  const supabase = createServiceClient()

  const settingsId = await getSettingsId(supabase)
  if (!settingsId) {
    return { success: false, error: 'Settings not found' }
  }

  const { error } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .update({
      is_paused: true,
      current_video_id: null,
    })
    .eq('id', settingsId)

  if (error) {
    console.error('Error stopping player:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
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
 * Перемотать видео на указанную секунду
 */
export async function seekToPosition(seconds: number) {
  const supabase = createServiceClient()

  const settingsId = await getSettingsId(supabase)
  if (!settingsId) {
    return { success: false, error: 'Settings not found' }
  }

  const { error } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .update({ seek_to_seconds: seconds })
    .eq('id', settingsId)

  if (error) {
    console.error('Error seeking video:', error)
    return { success: false, error: error.message }
  }

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
