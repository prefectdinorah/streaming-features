'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { skipCurrentVideo } from '@/app/actions/player'
import type { PlayerSettings, VideoQueue } from '@/types/queue'

export default function DebugPage() {
  const [settings, setSettings] = useState<PlayerSettings | null>(null)
  const [queue, setQueue] = useState<VideoQueue[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Not connected')
  const [supabase] = useState(() => createClient())

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50))
  }

  // Загрузить данные из БД
  const loadData = async () => {
    addLog('Loading data from database...')

    // Настройки
    const { data: settingsData, error: settingsError } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('*')
      .maybeSingle()

    if (settingsError) {
      addLog(`❌ Error loading settings: ${settingsError.message}`)
    } else if (settingsData) {
      addLog('✅ Settings loaded successfully')
      setSettings(settingsData)
    } else {
      addLog('⚠️ No settings found in database')
    }

    // Очередь
    const { data: queueData, error: queueError } = await supabase
      .schema('twitch_player')
      .from('video_queue')
      .select('*')
      .eq('status', 'pending')
      .order('position', { ascending: true })
      .limit(5)

    if (queueError) {
      addLog(`❌ Error loading queue: ${queueError.message}`)
    } else {
      addLog(`✅ Queue loaded: ${queueData?.length || 0} videos`)
      setQueue(queueData || [])
    }
  }

  // Проверить подключение к Supabase
  const checkConnection = async () => {
    addLog('Testing Supabase connection...')

    const { error } = await supabase
      .schema('twitch_player')
      .from('player_settings')
      .select('id')
      .limit(1)

    if (error) {
      addLog(`❌ Connection error: ${error.message}`)
    } else {
      addLog('✅ Successfully connected to Supabase')
    }
  }

  // Тест: Пропуск
  const testSkip = async () => {
    addLog('Testing skipCurrentVideo()...')
    const result = await skipCurrentVideo()
    if (result.success) {
      addLog('✅ skipCurrentVideo() returned success')
    } else {
      addLog(`❌ skipCurrentVideo() failed: ${result.error}`)
    }
  }

  // Загрузить данные при монтировании
  useEffect(() => {
    loadData()
    checkConnection()
  }, [])

  // Подписаться на Realtime изменения
  useEffect(() => {
    addLog('Setting up Realtime subscription...')

    const channel = supabase
      .channel('debug-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'twitch_player',
          table: 'player_settings',
        },
        (payload) => {
          addLog('🔄 Realtime update received!')
          addLog(`New data: ${JSON.stringify(payload.new)}`)
          setSettings(payload.new as PlayerSettings)
        }
      )
      .subscribe((status) => {
        addLog(`Realtime subscription status: ${status}`)
        setRealtimeStatus(status)

        if (status === 'SUBSCRIBED') {
          addLog('✅ Successfully subscribed to Realtime')
        } else if (status === 'CHANNEL_ERROR') {
          addLog('❌ Failed to subscribe to Realtime')
        } else if (status === 'CLOSED') {
          addLog('⚠️ Realtime connection closed')
        }
      })

    return () => {
      addLog('Cleaning up Realtime subscription...')
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">YouTube Player Debug Console</h1>
          <p className="text-gray-400">
            Диагностика работы Realtime и Server Actions
          </p>
        </div>

        {/* Realtime Status */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Realtime Connection Status</h2>
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                realtimeStatus === 'SUBSCRIBED'
                  ? 'bg-green-500 animate-pulse'
                  : realtimeStatus === 'CHANNEL_ERROR'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
            />
            <span className="text-lg font-mono">{realtimeStatus}</span>
          </div>
          {realtimeStatus !== 'SUBSCRIBED' && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded">
              <p className="text-red-400 text-sm">
                ⚠️ Realtime не подключен. Проверьте:
              </p>
              <ul className="text-red-300 text-xs mt-2 space-y-1 ml-4">
                <li>• Применена ли миграция 20260121000005_enable_realtime.sql</li>
                <li>• Включен ли Realtime в Supabase Dashboard</li>
                <li>• Правильные ли environment variables</li>
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Current Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Current Settings</h2>
            {settings ? (
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID:</span>
                  <span>{settings.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transparent BG:</span>
                  <span
                    className={
                      settings.transparent_background ? 'text-green-400' : 'text-yellow-400'
                    }
                  >
                    {settings.transparent_background ? 'true' : 'false'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BG Color:</span>
                  <span className="flex items-center gap-2">
                    {settings.background_color}
                    <div
                      className="w-4 h-4 rounded border border-gray-600"
                      style={{ backgroundColor: settings.background_color || '#000000' }}
                    />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Queue Size:</span>
                  <span>{settings.max_queue_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Duration:</span>
                  <span>{settings.max_video_duration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Allow Duplicates:</span>
                  <span>{settings.allow_duplicates ? 'Yes' : 'No'}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No settings found</p>
            )}

            <button
              onClick={loadData}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Reload Data
            </button>
          </div>

          {/* Queue Preview */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Queue Preview (Top 5)</h2>
            {queue.length > 0 ? (
              <div className="space-y-2">
                {queue.map((video, index) => (
                  <div
                    key={video.id}
                    className="text-sm p-2 bg-gray-800 rounded border border-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="truncate">{video.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Queue is empty</p>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Test Server Actions</h2>
          <p className="text-sm text-gray-400 mb-4">
            Плеер работает автономно. Управление только через очередь видео.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={testSkip}
              disabled={queue.length === 0}
              className="py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors font-medium"
            >
              ⏭️ Test Skip Current Video
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Event Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-xs space-y-1">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('❌')
                      ? 'text-red-400'
                      : log.includes('✅')
                      ? 'text-green-400'
                      : log.includes('🔄')
                      ? 'text-blue-400'
                      : log.includes('⚠️')
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-300">
            Как использовать эту страницу:
          </h3>
          <ol className="text-sm text-blue-200 space-y-2 list-decimal list-inside">
            <li>
              Убедитесь что Realtime Status показывает "SUBSCRIBED" (зелёный
              индикатор)
            </li>
            <li>
              Если нет - примените миграцию 20260121000005_enable_realtime.sql в
              Supabase
            </li>
            <li>Добавьте видео в очередь через Dashboard</li>
            <li>Откройте /player в другой вкладке и проверьте что видео начинает играть</li>
            <li>Нажмите "Test Skip" и проверьте что следующее видео начинает воспроизводиться</li>
            <li>
              Если изменения происходят мгновенно - Realtime работает ✅
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
