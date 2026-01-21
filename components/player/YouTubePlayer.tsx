'use client'

import { useEffect, useRef, useState } from 'react'
import { useRealtimeQueue } from '@/hooks/useRealtimeQueue'

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
  const { currentVideo, isPaused, markAsCompleted, isLoading } = useRealtimeQueue()
  const [isApiReady, setIsApiReady] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)

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
      console.log('YouTube IFrame API ready')
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

    console.log('Creating YouTube player for:', currentVideo.youtube_id)

    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        width: '1920',
        height: '1080',
        videoId: currentVideo.youtube_id,
        playerVars: {
          autoplay: 1, // Автоматически воспроизводить
          controls: 0, // Скрыть элементы управления (для OBS)
          modestbranding: 1, // Минимальный брендинг YouTube
          rel: 0, // Не показывать похожие видео
          showinfo: 0, // Не показывать информацию о видео
          fs: 0, // Отключить полноэкранный режим
          iv_load_policy: 3, // Отключить аннотации
          disablekb: 1, // Отключить клавиатурные управления
        },
        events: {
          onReady: (event) => {
            console.log('Player ready')
            event.target.playVideo()
          },
          onStateChange: (event) => {
            console.log('Player state changed:', event.data)

            // YT.PlayerState.ENDED = 0
            if (event.data === window.YT.PlayerState.ENDED) {
              console.log('Video ended, marking as completed')
              markAsCompleted(currentVideo.id)
            }
          },
          onError: (event) => {
            console.error('Player error:', event.data)
            // Автоматически пропустить видео при ошибке
            markAsCompleted(currentVideo.id)
          },
        },
      })

      setCurrentVideoId(currentVideo.id)
    } catch (error) {
      console.error('Error creating YouTube player:', error)
    }
  }, [isApiReady, currentVideo, markAsCompleted])

  // Шаг 3: Автоматическое переключение на следующее видео
  useEffect(() => {
    // Если видео нет в очереди - остановить и уничтожить плеер
    if (!currentVideo && playerRef.current) {
      console.log('Queue is empty, stopping player')
      try {
        playerRef.current.stopVideo()
        playerRef.current.destroy()
        playerRef.current = null
        setCurrentVideoId(null)
      } catch (error) {
        console.error('Error destroying player:', error)
      }
      return
    }

    if (
      !playerRef.current ||
      !currentVideo ||
      currentVideo.id === currentVideoId
    ) {
      return
    }

    console.log('Switching to next video:', currentVideo.youtube_id)

    try {
      playerRef.current.loadVideoById(currentVideo.youtube_id)
      setCurrentVideoId(currentVideo.id)
    } catch (error) {
      console.error('Error switching video:', error)
    }
  }, [currentVideo, currentVideoId])

  // Шаг 4: Управление паузой через Realtime
  useEffect(() => {
    if (!playerRef.current) {
      return
    }

    console.log('Pause state changed:', isPaused)

    try {
      if (isPaused) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    } catch (error) {
      console.error('Error toggling pause:', error)
    }
  }, [isPaused])

  // UI States

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
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="text-center">
          <div className="text-white text-3xl mb-4">
            Очередь пуста
          </div>
          <div className="text-gray-500 text-sm">
            Добавьте видео через Twitch чат: !play &lt;YouTube_URL&gt;
          </div>
        </div>
      </div>
    )
  }

  // YouTube Player
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <div id="youtube-player" className="w-full h-full" />

      {/* Debug info (можно удалить в production) */}
      <div className="fixed bottom-4 left-4 text-white text-xs bg-black/50 p-2 rounded">
        <div>Now playing: {currentVideo.title}</div>
        <div className="text-gray-400">
          Requested by: {currentVideo.requested_by}
        </div>
      </div>
    </div>
  )
}
