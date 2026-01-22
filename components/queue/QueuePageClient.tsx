'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VideoQueue } from '@/types/queue'
import { VideoQueueItem } from '@/components/player/VideoQueueItem'
import { HistoryVideoItem } from '@/components/player/HistoryVideoItem'
import { AddVideoForm } from '@/components/queue/AddVideoForm'
import { SkipButton } from '@/components/player/SkipButton'

/**
 * Client-side компонент страницы очереди с Realtime обновлениями
 */
export function QueuePageClient() {
  const [queue, setQueue] = useState<VideoQueue[]>([])
  const [completed, setCompleted] = useState<VideoQueue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  // Загрузить очередь
  const loadQueue = async () => {
    const { data } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })

    if (data) {
      setQueue(data)
    }
  }

  // Загрузить историю
  const loadCompleted = async () => {
    const { data } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*')
      .in('status', ['completed', 'skipped'])
      .order('played_at', { ascending: false })
      .limit(10)

    if (data) {
      setCompleted(data)
    }
  }

  // Загрузить все при монтировании
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadQueue(), loadCompleted()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Подписаться на Realtime изменения
  useEffect(() => {
    const channel = supabase
      .channel('queue-page-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'twitch_player',
          table: 'video_queue',
        },
        (payload) => {
          console.log('[QueuePageClient] Realtime update received:', payload.eventType)
          // Перезагрузить обе таблицы при любом изменении
          loadQueue()
          loadCompleted()
        }
      )
      .subscribe((status) => {
        console.log('[QueuePageClient] Realtime subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse text-white text-2xl mb-4">
            Загрузка...
          </div>
          <div className="text-gray-500 text-sm">
            Подключение к Supabase
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Очередь видео</h1>
          <p className="text-gray-400 mt-1">
            Управление очередью воспроизведения
          </p>
        </div>
        <div className="text-sm text-gray-400">
          Всего в очереди: {queue.length}
        </div>
      </div>

      {/* Управление плеером */}
      <div className="flex items-center gap-4">
        <SkipButton hasVideo={queue.length > 0} />
        <p className="text-sm text-gray-400">
          Плеер работает автономно. Управление только через очередь.
        </p>
      </div>

      {/* Форма добавления видео */}
      <AddVideoForm />

      {/* Текущая очередь */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Текущая очередь
          </h2>
        </div>

        {queue.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {queue.map((video, index) => (
              <VideoQueueItem
                key={video.id}
                video={video}
                index={index}
                isFirst={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400">Очередь пуста</p>
          </div>
        )}
      </div>

      {/* История */}
      {completed.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Недавно воспроизведенные
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              История последних {completed.length} видео
            </p>
          </div>

          <div className="divide-y divide-gray-800">
            {completed.map((video) => (
              <HistoryVideoItem key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
