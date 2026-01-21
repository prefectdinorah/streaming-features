'use client'

import { useState, useTransition } from 'react'
import {
  pausePlayer,
  resumePlayer,
  stopPlayer,
  skipCurrentVideo,
} from '@/app/actions/player'

interface PlayerControlsProps {
  isPaused: boolean
  hasVideo: boolean
}

/**
 * Панель управления плеером
 *
 * Кнопки для паузы, возобновления, остановки и пропуска видео.
 * Использует Server Actions для изменения состояния в БД.
 */
export function PlayerControls({ isPaused, hasVideo }: PlayerControlsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handlePause = () => {
    startTransition(async () => {
      setError(null)
      const result = await pausePlayer()
      if (!result.success) {
        setError(result.error || 'Ошибка паузы')
      }
    })
  }

  const handleResume = () => {
    startTransition(async () => {
      setError(null)
      const result = await resumePlayer()
      if (!result.success) {
        setError(result.error || 'Ошибка возобновления')
      }
    })
  }

  const handleStop = () => {
    startTransition(async () => {
      setError(null)
      const result = await stopPlayer()
      if (!result.success) {
        setError(result.error || 'Ошибка остановки')
      }
    })
  }

  const handleSkip = () => {
    startTransition(async () => {
      setError(null)
      const result = await skipCurrentVideo()
      if (!result.success) {
        setError(result.error || 'Ошибка пропуска')
      }
    })
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Управление плеером
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isPaused ? 'На паузе' : hasVideo ? 'Воспроизводится' : 'Остановлен'}
          </p>
        </div>

        {/* Статус */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              hasVideo && !isPaused
                ? 'bg-green-500 animate-pulse'
                : isPaused
                  ? 'bg-yellow-500'
                  : 'bg-gray-600'
            }`}
          />
          <span className="text-sm text-gray-400">
            {hasVideo && !isPaused
              ? 'Активен'
              : isPaused
                ? 'Пауза'
                : 'Неактивен'}
          </span>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center space-x-3">
        {/* Pause/Resume */}
        {isPaused ? (
          <button
            onClick={handleResume}
            disabled={isPending || !hasVideo}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Продолжить</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            disabled={isPending || !hasVideo}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Пауза</span>
          </button>
        )}

        {/* Stop */}
        <button
          onClick={handleStop}
          disabled={isPending || !hasVideo}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
          <span>Стоп</span>
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          disabled={isPending || !hasVideo}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
          <span>Пропустить</span>
        </button>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Подсказки */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          <strong>Пауза:</strong> приостановить воспроизведение текущего видео
          <br />
          <strong>Стоп:</strong> остановить и очистить текущее видео
          <br />
          <strong>Пропустить:</strong> перейти к следующему видео в очереди
        </p>
      </div>
    </div>
  )
}
