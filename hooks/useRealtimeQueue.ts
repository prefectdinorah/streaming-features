'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VideoQueue, PlayerSettings } from '@/types/queue'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook для Realtime подписки на очередь видео
 *
 * Автоматически подписывается на изменения в таблице video_queue
 * и обновляет локальный стейт при любых изменениях.
 *
 * @returns Объект с данными очереди и методами
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * function PlayerComponent() {
 *   const { currentVideo, queue, isLoading, markAsCompleted } = useRealtimeQueue()
 *
 *   if (isLoading) return <div>Загрузка...</div>
 *   if (!currentVideo) return <div>Очередь пуста</div>
 *
 *   return (
 *     <div>
 *       <h1>{currentVideo.title}</h1>
 *       <button onClick={() => markAsCompleted(currentVideo.id)}>
 *         Завершить
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRealtimeQueue() {
  const [queue, setQueue] = useState<VideoQueue[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoQueue | null>(null)
  const [settings, setSettings] = useState<PlayerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  /**
   * Загружает настройки плеера из БД
   */
  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Error loading settings:', error)
      return
    }

    if (data) {
      setSettings(data)
    }
  }, [supabase])

  /**
   * Загружает очередь из БД
   */
  const loadQueue = useCallback(async () => {
    const { data, error } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })

    if (error) {
      console.error('Error loading queue:', error)
      return
    }

    if (data) {
      setQueue(data)
      setCurrentVideo(data[0] || null)
    }

    setIsLoading(false)
  }, [supabase])

  /**
   * Помечает видео как завершенное
   */
  const markAsCompleted = useCallback(
    async (videoId: string) => {
      const { error } = await supabase
        .schema('twitch_player')
        .from('video_queue')
        .update({
          status: 'completed',
          played_at: new Date().toISOString(),
        })
        .eq('id', videoId)

      if (error) {
        console.error('Error marking video as completed:', error)
      }

      // Обновление произойдет автоматически через Realtime
    },
    [supabase]
  )

  // Загрузить очередь и настройки при монтировании компонента
  useEffect(() => {
    loadQueue()
    loadSettings()
  }, [loadQueue, loadSettings])

  // Подписаться на Realtime изменения
  useEffect(() => {
    let queueChannel: RealtimeChannel
    let settingsChannel: RealtimeChannel

    const subscribe = async () => {
      // Подписка на изменения очереди
      queueChannel = supabase
        .channel('video-queue-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'twitch_player',
            table: 'video_queue',
          },
          (payload) => {
            console.log('Queue realtime update:', payload)
            loadQueue()
          }
        )
        .subscribe((status) => {
          console.log('Queue subscription status:', status)
        })

      // Подписка на изменения настроек (пауза/стоп)
      settingsChannel = supabase
        .channel('player-settings-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'twitch_player',
            table: 'player_settings',
          },
          (payload) => {
            console.log('Settings realtime update:', payload)
            loadSettings()
          }
        )
        .subscribe((status) => {
          console.log('Settings subscription status:', status)
        })
    }

    subscribe()

    // Cleanup при размонтировании
    return () => {
      if (queueChannel) {
        supabase.removeChannel(queueChannel)
      }
      if (settingsChannel) {
        supabase.removeChannel(settingsChannel)
      }
    }
  }, [supabase, loadQueue, loadSettings])

  return {
    queue,
    currentVideo,
    nextVideo: queue[1] || null,
    settings,
    isPaused: settings?.is_paused ?? false,
    isLoading,
    markAsCompleted,
  }
}
