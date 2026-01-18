'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VideoQueue } from '@/types/queue'
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
  const [isLoading, setIsLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  /**
   * Загружает очередь из БД
   */
  const loadQueue = useCallback(async () => {
    const { data, error } = await supabase
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

  // Загрузить очередь при монтировании компонента
  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // Подписаться на Realtime изменения
  useEffect(() => {
    let channel: RealtimeChannel

    const subscribe = async () => {
      channel = supabase
        .channel('video-queue-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'video_queue',
          },
          (payload) => {
            console.log('Realtime update:', payload)
            // Перезагрузить очередь при любом изменении
            loadQueue()
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
        })
    }

    subscribe()

    // Cleanup при размонтировании
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, loadQueue])

  return {
    queue,
    currentVideo,
    nextVideo: queue[1] || null,
    isLoading,
    markAsCompleted,
  }
}
