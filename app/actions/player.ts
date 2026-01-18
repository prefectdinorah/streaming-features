'use server'

import { createServiceClient } from '@/lib/supabase/server'

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
