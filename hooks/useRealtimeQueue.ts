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
 * @returns Объект с данными очереди и настройками
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * function PlayerComponent() {
 *   const { currentVideo, queue, settings, isLoading } = useRealtimeQueue()
 *
 *   if (isLoading) return <div>Загрузка...</div>
 *   if (!currentVideo) return <div>Очередь пуста</div>
 *
 *   return (
 *     <div>
 *       <h1>{currentVideo.title}</h1>
 *       <p>Requested by: {currentVideo.requested_by}</p>
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
    console.log('[useRealtimeQueue] Loading settings...')
    const { data, error } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('[useRealtimeQueue] Error loading settings:', error)
      return
    }

    if (data) {
      console.log('[useRealtimeQueue] Settings loaded:', data)
      setSettings(data)
    } else {
      console.warn('[useRealtimeQueue] No settings found in database')
    }
  }, [supabase])

  /**
   * Загружает очередь из БД
   */
  const loadQueue = useCallback(async () => {
    console.log('[useRealtimeQueue] Loading queue...')
    const { data, error } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })

    if (error) {
      console.error('[useRealtimeQueue] Error loading queue:', error)
      return
    }

    if (data) {
      console.log('[useRealtimeQueue] Queue loaded:', {
        count: data.length,
        currentVideo: data[0]?.title || 'None'
      })
      setQueue(data)
      setCurrentVideo(data[0] || null)
    }

    setIsLoading(false)
  }, [supabase])

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
            console.log('[useRealtimeQueue] ========================================')
            console.log('[useRealtimeQueue] 🔄 Realtime update received!')
            console.log('[useRealtimeQueue] Event type:', payload.eventType)
            console.log('[useRealtimeQueue] Table:', payload.table)
            console.log('[useRealtimeQueue] OLD data:', JSON.stringify(payload.old, null, 2))
            console.log('[useRealtimeQueue] NEW data:', JSON.stringify(payload.new, null, 2))
            console.log('[useRealtimeQueue] ========================================')
            loadQueue()
          }
        )
        .subscribe((status) => {
          console.log('[useRealtimeQueue] Queue subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('[useRealtimeQueue] ✅ Successfully subscribed to video_queue changes')
          }
        })

      // Подписка на изменения настроек (фон и др.)
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
            console.log('[useRealtimeQueue] Settings realtime update received:', payload)
            console.log('[useRealtimeQueue] New settings data:', payload.new)
            loadSettings()
          }
        )
        .subscribe((status) => {
          console.log('[useRealtimeQueue] Settings subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('[useRealtimeQueue] ✅ Successfully subscribed to player_settings changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useRealtimeQueue] ❌ Failed to subscribe to player_settings')
          }
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
    isLoading,
  }
}
