'use client'

import { useState, useTransition } from 'react'
import { seekToPosition } from '@/app/actions/player'

interface SeekControlsProps {
  hasVideo: boolean
  videoDuration?: number
}

/**
 * Элементы управления перемоткой видео
 */
export function SeekControls({ hasVideo, videoDuration }: SeekControlsProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [seekValue, setSeekValue] = useState<string>('')

  const handleSeek = (seconds: number) => {
    startTransition(async () => {
      setError(null)
      const result = await seekToPosition(seconds)
      if (!result.success) {
        setError(result.error || 'Ошибка перемотки')
      }
    })
  }

  const handleSeekByInput = () => {
    const seconds = parseInt(seekValue, 10)
    if (isNaN(seconds) || seconds < 0) {
      setError('Введите корректное время в секундах')
      return
    }
    handleSeek(seconds)
    setSeekValue('')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Перемотка</h2>
        <p className="text-sm text-gray-400 mt-1">
          Быстрая перемотка или точная позиция
        </p>
      </div>

      {/* Быстрая перемотка */}
      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={() => handleSeek(0)}
          disabled={isPending || !hasVideo}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          <span>В начало (0:00)</span>
        </button>

        {videoDuration && (
          <>
            <button
              onClick={() => handleSeek(Math.floor(videoDuration * 0.25))}
              disabled={isPending || !hasVideo}
              className="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              25%
            </button>

            <button
              onClick={() => handleSeek(Math.floor(videoDuration * 0.5))}
              disabled={isPending || !hasVideo}
              className="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              50%
            </button>

            <button
              onClick={() => handleSeek(Math.floor(videoDuration * 0.75))}
              disabled={isPending || !hasVideo}
              className="px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              75%
            </button>

            <button
              onClick={() => handleSeek(videoDuration - 5)}
              disabled={isPending || !hasVideo}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <span>Почти конец</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Точная перемотка */}
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={seekValue}
          onChange={(e) => setSeekValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSeekByInput()
            }
          }}
          placeholder="Секунды..."
          disabled={isPending || !hasVideo}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:bg-gray-700 disabled:text-gray-500"
        />
        <button
          onClick={handleSeekByInput}
          disabled={isPending || !hasVideo || !seekValue}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          Перейти
        </button>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Подсказка */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          <strong>Подсказка:</strong> Используйте кнопки для быстрой перемотки на нужную позицию
          или введите точное время в секундах. Перемотка работает мгновенно через Supabase Realtime.
        </p>
      </div>
    </div>
  )
}
