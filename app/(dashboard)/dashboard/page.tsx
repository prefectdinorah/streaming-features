import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - YouTube Player',
  description: 'Панель управления YouTube плеером для Twitch',
}

/**
 * Главная страница Dashboard
 * Показывает общую статистику и текущее состояние системы
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  // Получить статистику
  const { count: queueCount } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: completedCount } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { data: currentVideo } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .select('*')
    .eq('status', 'pending')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data: settings } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .select('*')
    .maybeSingle()

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Панель управления YouTube плеером для Twitch
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Видео в очереди */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">В очереди</p>
              <p className="text-3xl font-bold text-white mt-1">
                {queueCount || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Завершено */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Завершено</p>
              <p className="text-3xl font-bold text-white mt-1">
                {completedCount || 0}
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Статус плеера */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Статус</p>
              <p className="text-3xl font-bold text-white mt-1">
                {currentVideo ? 'Активен' : 'Ожидание'}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                currentVideo ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Текущее видео */}
      {currentVideo ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Текущее видео
          </h2>
          <div className="flex items-start space-x-4">
            {currentVideo.thumbnail_url && (
              <img
                src={currentVideo.thumbnail_url}
                alt={currentVideo.title}
                className="w-32 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">
                {currentVideo.title}
              </h3>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span>Запросил: {currentVideo.requested_by}</span>
                {currentVideo.duration && (
                  <span>
                    Длительность: {Math.floor(currentVideo.duration / 60)}:
                    {String(currentVideo.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">Очередь пуста</p>
        </div>
      )}

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/dashboard/queue"
          className="block bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-600 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-2">
            Управление очередью
          </h3>
          <p className="text-gray-400 text-sm">
            Просмотр и управление очередью видео
          </p>
        </a>

        <a
          href="/dashboard/settings"
          className="block bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-600 transition-colors"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Настройки</h3>
          <p className="text-gray-400 text-sm">
            Настройка параметров плеера и ограничений
          </p>
        </a>
      </div>
    </div>
  )
}
