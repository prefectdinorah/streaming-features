import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { PlayerControls } from '@/components/player/PlayerControls'
import { SeekControls } from '@/components/player/SeekControls'
import { VideoQueueItem } from '@/components/player/VideoQueueItem'

export const metadata: Metadata = {
  title: 'Очередь - YouTube Player',
  description: 'Управление очередью видео',
}

/**
 * Страница управления очередью видео
 */
export default async function QueuePage() {
  const supabase = await createClient()

  // Получить настройки плеера
  const { data: settings } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .select('*')
    .maybeSingle()

  // Получить всю очередь
  const { data: queue } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*')
    .eq('status', 'pending')
    .order('position', { ascending: true })

  // Получить недавно завершенные видео
  const { data: completed } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*')
    .in('status', ['completed', 'skipped'])
    .order('played_at', { ascending: false })
    .limit(10)

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
          Всего в очереди: {queue?.length || 0}
        </div>
      </div>

      {/* Панель управления плеером */}
      <PlayerControls
        isPaused={settings?.is_paused ?? false}
        hasVideo={(queue?.length ?? 0) > 0}
      />

      {/* Перемотка */}
      <SeekControls
        hasVideo={(queue?.length ?? 0) > 0}
        videoDuration={queue?.[0]?.duration ?? undefined}
      />

      {/* Текущая очередь */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Текущая очередь
          </h2>
        </div>

        {queue && queue.length > 0 ? (
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
      {completed && completed.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Недавно воспроизведенные
            </h2>
          </div>

          <div className="divide-y divide-gray-800">
            {completed.map((video) => (
              <div
                key={video.id}
                className="px-6 py-4 flex items-start space-x-4"
              >
                {/* Миниатюра */}
                {video.thumbnail_url && (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-24 h-18 object-cover rounded opacity-75"
                  />
                )}

                {/* Информация */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-300 truncate">
                    {video.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{video.requested_by}</span>
                    {video.played_at && (
                      <span>
                        {new Date(video.played_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Статус */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      video.status === 'completed'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}
                  >
                    {video.status === 'completed' ? 'Завершено' : 'Пропущено'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
