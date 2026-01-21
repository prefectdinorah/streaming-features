import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Настройки - YouTube Player',
  description: 'Настройки плеера и ограничений',
}

/**
 * Страница настроек плеера
 */
export default async function SettingsPage() {
  const supabase = await createClient()

  // Получить текущие настройки
  const { data: settings } = await supabase
    .schema('twitch_player')
    .from('player_settings')
    .select('*')
    .maybeSingle()

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-white">Настройки</h1>
        <p className="text-gray-400 mt-1">
          Управление параметрами плеера и ограничениями
        </p>
      </div>

      {/* Текущие настройки */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Текущие настройки
          </h2>
        </div>

        <div className="divide-y divide-gray-800">
          {/* Статус плеера */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">
                Статус плеера
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Воспроизведение видео из очереди
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  settings?.is_paused
                    ? 'bg-yellow-900 text-yellow-300'
                    : 'bg-green-900 text-green-300'
                }`}
              >
                {settings?.is_paused ? 'Пауза' : 'Активен'}
              </span>
            </div>
          </div>

          {/* Макс размер очереди */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">
                Максимальный размер очереди
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Максимальное количество видео в очереди
              </p>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">
                {settings?.max_queue_size || 50}
              </span>
            </div>
          </div>

          {/* Макс длительность видео */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">
                Максимальная длительность видео
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Максимальная длительность одного видео
              </p>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">
                {settings?.max_video_duration
                  ? `${Math.floor(settings.max_video_duration / 60)} мин`
                  : '10 мин'}
              </span>
            </div>
          </div>

          {/* Дубликаты */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">
                Разрешить дубликаты
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Можно ли добавлять одно видео несколько раз
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  settings?.allow_duplicates
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                {settings?.allow_duplicates ? 'Разрешено' : 'Запрещено'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API информация */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">API информация</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Добавить видео
            </h3>
            <div className="bg-gray-950 border border-gray-700 rounded p-3">
              <code className="text-sm text-gray-300">
                POST /api/queue/add
              </code>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Получить очередь
            </h3>
            <div className="bg-gray-950 border border-gray-700 rounded p-3">
              <code className="text-sm text-gray-300">
                GET /api/queue/list
              </code>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Пропустить видео
            </h3>
            <div className="bg-gray-950 border border-gray-700 rounded p-3">
              <code className="text-sm text-gray-300">
                POST /api/queue/skip
              </code>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Статус плеера
            </h3>
            <div className="bg-gray-950 border border-gray-700 rounded p-3">
              <code className="text-sm text-gray-300">
                GET /api/player/status
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* OBS настройки */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            OBS Browser Source
          </h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">URL</h3>
            <div className="bg-gray-950 border border-gray-700 rounded p-3">
              <code className="text-sm text-gray-300">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/player`
                  : '/player'}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Ширина
              </h3>
              <div className="bg-gray-950 border border-gray-700 rounded p-3">
                <code className="text-sm text-gray-300">1920</code>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Высота
              </h3>
              <div className="bg-gray-950 border border-gray-700 rounded p-3">
                <code className="text-sm text-gray-300">1080</code>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              Не забудьте отключить "Shutdown source when not visible" и
              включить "Refresh browser when scene becomes active" в настройках
              Browser Source
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
