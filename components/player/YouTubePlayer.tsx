'use client'

import { useEffect, useRef, useState } from 'react'
import { useRealtimeQueue } from '@/hooks/useRealtimeQueue'
import { markVideoAsCompleted } from '@/app/actions/player'

// Минимальная типизация для YouTube IFrame API
interface YT {
  Player: {
    new (elementId: string, config: {
      height?: string
      width?: string
      videoId?: string
      playerVars?: Record<string, unknown>
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { data: number; target: YTPlayer }) => void
        onError?: (event: { data: number }) => void
      }
    }): YTPlayer
  }
  PlayerState: {
    ENDED: number
    PLAYING: number
    PAUSED: number
    BUFFERING: number
    CUED: number
  }
}

interface YTPlayer {
  loadVideoById(videoId: string): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

// Глобальный тип для YouTube IFrame API
declare global {
  interface Window {
    YT: YT
    onYouTubeIframeAPIReady: () => void
  }
}

/**
 * YouTube Player компонент для OBS Browser Source
 *
 * Автоматически воспроизводит видео из очереди через YouTube IFrame API
 * с поддержкой Realtime обновлений через Supabase.
 *
 * Использование в OBS:
 * 1. Добавить Browser Source
 * 2. URL: http://localhost:3000/player
 * 3. Width: 1920, Height: 1080
 * 4. Отключить "Shutdown source when not visible"
 *
 * @example
 * ```tsx
 * import { YouTubePlayer } from '@/components/player/YouTubePlayer'
 *
 * export default function PlayerPage() {
 *   return <YouTubePlayer />
 * }
 * ```
 */
export function YouTubePlayer() {
  const playerRef = useRef<YTPlayer | null>(null)
  const { currentVideo, settings, isLoading } = useRealtimeQueue()
  const [isApiReady, setIsApiReady] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const hasPlayedRef = useRef(false) // Отслеживание началось ли воспроизведение
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false)

  // Уникальный ID для этого экземпляра плеера (для отладки)
  const playerInstanceId = useRef(`player-${Math.random().toString(36).substr(2, 9)}`)

  // ЗАЩИТА: Плеер работает только на localhost (для разработки)
  // На production (Vercel) плеер отключен, чтобы избежать конфликтов с локальной версией
  const [isLocalhost, setIsLocalhost] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const localhost = hostname === 'localhost' || hostname === '127.0.0.1'
      setIsLocalhost(localhost)

      if (!localhost) {
        console.warn(`[${playerInstanceId.current}] Player disabled on production (${hostname})`)
      }
    }
  }, [])

  // Шаг 1: Загрузить YouTube IFrame API
  useEffect(() => {
    // Проверить, загружен ли уже API
    if (window.YT && window.YT.Player) {
      setIsApiReady(true)
      return
    }

    // Загрузить скрипт YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true

    const firstScriptTag = document.getElementsByTagName('script')[0]
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    } else {
      document.head.appendChild(tag)
    }

    // Callback вызывается когда API готов
    window.onYouTubeIframeAPIReady = () => {
      console.log(`[${playerInstanceId.current}] YouTube IFrame API ready`)
      setIsApiReady(true)
    }

    return () => {
      // Cleanup
      window.onYouTubeIframeAPIReady = () => {}
    }
  }, [])

  // Шаг 2: Создать YouTube плеер
  useEffect(() => {
    if (!isApiReady || !currentVideo || playerRef.current) {
      return
    }

    console.log(`[${playerInstanceId.current}] Creating YouTube player for:`, currentVideo.youtube_id)

    // Сбросить флаг воспроизведения для нового видео
    hasPlayedRef.current = false

    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        width: '1920',
        height: '1080',
        videoId: currentVideo.youtube_id,
        playerVars: {
          // Воспроизведение
          autoplay: 1, // Автоматически воспроизводить

          // Интерфейс (максимально чистый поток)
          controls: 0, // Скрыть все элементы управления
          disablekb: 1, // Отключить клавиатурное управление
          fs: 0, // Отключить кнопку полного экрана
          modestbranding: 1, // Минимальный брендинг YouTube (скрыть логотип)

          // Информация и аннотации
          iv_load_policy: 3, // Отключить видео аннотации
          rel: 0, // Не показывать похожие видео в конце

          // Субтитры
          cc_load_policy: 0, // Не показывать субтитры по умолчанию

          // Качество
          playsinline: 1, // Воспроизводить inline (важно для встраивания)

          // Прочее
          enablejsapi: 1, // Включить JavaScript API (обязательно для IFrame API)
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
        events: {
          onReady: (event) => {
            console.log('[YouTubePlayer] Player ready, starting playback')
            // Видео начнет воспроизводиться автоматически благодаря autoplay: 1
            event.target.playVideo()
          },
          onStateChange: (event) => {
            const states: Record<string, string> = {
              '-1': 'UNSTARTED',
              '0': 'ENDED',
              '1': 'PLAYING',
              '2': 'PAUSED',
              '3': 'BUFFERING',
              '5': 'CUED'
            }

            const stateName = states[event.data.toString()] || 'UNKNOWN'
            console.log(`[YouTubePlayer] State changed: ${stateName} (${event.data})`, {
              videoId: currentVideo.id,
              youtube_id: currentVideo.youtube_id,
              title: currentVideo.title,
              hasPlayed: hasPlayedRef.current
            })

            // YT.PlayerState.PLAYING = 1
            if (event.data === window.YT.PlayerState.PLAYING) {
              // Видео начало воспроизводиться
              hasPlayedRef.current = true
              console.log('[YouTubePlayer] ✅ Video started playing')
            }

            // YT.PlayerState.ENDED = 0
            if (event.data === window.YT.PlayerState.ENDED) {
              console.log(`[${playerInstanceId.current}] 🎬 Video ENDED, marking as completed:`, {
                videoId: currentVideo.id,
                title: currentVideo.title
              })
              markVideoAsCompleted(currentVideo.id).catch(err => {
                console.error(`[${playerInstanceId.current}] Failed to mark video as completed:`, err)
              })
            }

            // YT.PlayerState.PAUSED = 2
            if (event.data === window.YT.PlayerState.PAUSED) {
              console.warn('[YouTubePlayer] ⚠️ Video PAUSED unexpectedly!', {
                videoId: currentVideo.id,
                hasPlayed: hasPlayedRef.current,
                currentTime: playerRef.current?.getCurrentTime(),
                duration: playerRef.current?.getDuration()
              })
            }
          },
          onError: (event) => {
            const errorCodes: Record<number, string> = {
              2: 'Invalid video ID',
              5: 'HTML5 player error',
              100: 'Video not found or private',
              101: 'Video owner does not allow embedding',
              150: 'Video owner does not allow embedding',
            }

            const errorCode = event.data
            const errorMessage = errorCodes[errorCode] || `Unknown error`

            console.error(`[${playerInstanceId.current}] ❌ Player error:`, {
              code: errorCode,
              codeType: typeof errorCode,
              message: errorMessage,
              videoId: currentVideo.id,
              youtubeId: currentVideo.youtube_id,
              title: currentVideo.title,
              hasPlayed: hasPlayedRef.current,
              rawEvent: event
            })

            console.error(`[${playerInstanceId.current}] Error code: ${errorCode}, Message: ${errorMessage}`)

            // Показать предупреждение о блокировщике рекламы при ошибках загрузки
            if (!hasPlayedRef.current && (errorCode === 5 || errorCode === 150)) {
              setShowAdBlockerWarning(true)
              setTimeout(() => setShowAdBlockerWarning(false), 10000) // Скрыть через 10 сек
            }

            // Только пропускать видео если оно хотя бы начало воспроизводиться
            // Это предотвращает мгновенный пропуск видео при ошибках загрузки
            if (hasPlayedRef.current) {
              console.log(`[${playerInstanceId.current}] Video had started playing, marking as completed`)
              markVideoAsCompleted(currentVideo.id).catch(err => {
                console.error(`[${playerInstanceId.current}] Failed to mark video as completed on error:`, err)
              })
            } else {
              console.warn(`[${playerInstanceId.current}] Video never started playing, waiting 3 seconds before skipping...`)
              // Даем YouTube 3 секунды загрузиться
              // Если за это время видео не начнет играть - пропускаем
              setTimeout(() => {
                if (!hasPlayedRef.current) {
                  console.warn(`[${playerInstanceId.current}] Video still not playing after 3 seconds, skipping it`)
                  markVideoAsCompleted(currentVideo.id).catch(err => {
                    console.error(`[${playerInstanceId.current}] Failed to skip video on error:`, err)
                  })
                } else {
                  console.log(`[${playerInstanceId.current}] Video started playing during wait period, not skipping`)
                }
              }, 3000)
            }
          },
        },
      })

      setCurrentVideoId(currentVideo.id)
    } catch (error) {
      console.error('Error creating YouTube player:', error)
    }
  }, [isApiReady, currentVideo])

  // Шаг 3: Автоматическое переключение на следующее видео
  useEffect(() => {
    // Если видео нет в очереди - остановить и уничтожить плеер
    if (!currentVideo && playerRef.current) {
      console.log(`[${playerInstanceId.current}] Queue is empty, destroying player`)
      try {
        playerRef.current.stopVideo()
        playerRef.current.destroy()
        playerRef.current = null
        setCurrentVideoId(null)
      } catch (error) {
        console.error(`[${playerInstanceId.current}] Error destroying player:`, error)
      }
      return
    }

    // Если плеера нет или это то же видео - ничего не делаем
    if (!playerRef.current || !currentVideo) {
      return
    }

    // Проверяем нужно ли переключить видео
    const needsSwitch = currentVideo.id !== currentVideoId

    if (!needsSwitch) {
      console.log('[YouTubePlayer] Same video, no switch needed')
      return
    }

    console.log('[YouTubePlayer] Switching video:', {
      from: currentVideoId,
      to: currentVideo.id,
      youtube_id: currentVideo.youtube_id,
      title: currentVideo.title
    })

    try {
      // Проверить что playerRef.current является валидным YouTube плеером
      if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') {
        console.error('[YouTubePlayer] Player not ready for switching, waiting...')
        return
      }

      // Сбросить флаг воспроизведения для нового видео
      hasPlayedRef.current = false

      // Загрузить новое видео
      playerRef.current.loadVideoById(currentVideo.youtube_id)
      setCurrentVideoId(currentVideo.id)

      // Явно запустить воспроизведение после небольшой задержки
      // Это критично для автоматического переключения после завершения предыдущего видео
      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          console.log('[YouTubePlayer] Starting playback of new video')
          playerRef.current.playVideo()
        }
      }, 1000) // Увеличил задержку до 1 секунды для надежности
    } catch (error) {
      console.error('[YouTubePlayer] Error switching video:', error)
    }
  }, [currentVideo, currentVideoId])

  // UI States

  // Если не localhost - показать предупреждение
  if (!isLocalhost) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Плеер отключен на production
          </h1>
          <p className="text-gray-400 mb-4">
            Плеер работает только на localhost для разработки, чтобы избежать конфликтов
            между локальной версией и Vercel деплоем.
          </p>
          <p className="text-sm text-gray-500">
            Для использования плеера откройте: <br />
            <code className="text-blue-400">http://localhost:3000/player</code>
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
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

  if (!currentVideo) {
    return (
      <div
        className="flex items-center justify-center w-screen h-screen"
        style={{
          backgroundColor: settings?.transparent_background
            ? 'transparent'
            : settings?.background_color || '#000000',
        }}
      >
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-white">Очередь пуста</h2>
          <p className="text-gray-400 max-w-md">
            Добавьте видео через Dashboard или Twitch бота
          </p>
        </div>
      </div>
    )
  }

  // YouTube Player
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        backgroundColor: settings?.transparent_background
          ? 'transparent'
          : settings?.background_color || '#000000',
      }}
    >
      <div id="youtube-player" className="w-full h-full" />

      {/* Скрыть YouTube UI элементы через CSS */}
      <style jsx global>{`
        /* Скрыть водяной знак YouTube */
        .ytp-watermark {
          display: none !important;
        }

        /* Скрыть кнопку паузы при наведении */
        .ytp-pause-overlay {
          display: none !important;
        }

        /* Скрыть градиент внизу */
        .ytp-gradient-bottom {
          display: none !important;
        }

        /* Скрыть градиент вверху */
        .ytp-gradient-top {
          display: none !important;
        }

        /* Скрыть кнопки управления */
        .ytp-chrome-bottom {
          display: none !important;
        }

        /* Скрыть большую кнопку play в центре */
        .ytp-cued-thumbnail-overlay {
          display: none !important;
        }

        /* Скрыть endscreen (похожие видео в конце) */
        .ytp-endscreen-content {
          display: none !important;
        }

        /* Скрыть карточки (cards) в видео */
        .ytp-cards-teaser {
          display: none !important;
        }

        .ytp-ce-element {
          display: none !important;
        }
      `}</style>

      {/* Ad Blocker Warning */}
      {showAdBlockerWarning && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-600/95 text-white px-8 py-6 rounded-lg shadow-2xl z-50 max-w-md">
          <div className="text-center space-y-3">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-bold">Блокировщик рекламы обнаружен</h3>
            <p className="text-sm">
              Блокировщик рекламы может препятствовать воспроизведению YouTube видео.
              Отключите блокировщик для этого сайта.
            </p>
          </div>
        </div>
      )}

      {/* Debug info (можно удалить в production) */}
      <div className="fixed bottom-4 left-4 text-white text-xs bg-black/50 p-2 rounded z-50">
        <div>Now playing: {currentVideo.title}</div>
        <div className="text-gray-400">
          Requested by: {currentVideo.requested_by}
        </div>
      </div>
    </div>
  )
}
