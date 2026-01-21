'use client'

import { useState, useTransition } from 'react'
import { returnVideoToQueue } from '@/app/actions/player'
import type { VideoQueue } from '@/types/queue'

interface HistoryVideoItemProps {
  video: VideoQueue
}

/**
 * Элемент истории воспроизведенных видео с кнопкой "Вернуть в очередь"
 */
export function HistoryVideoItem({ video }: HistoryVideoItemProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleReturn = () => {
    startTransition(async () => {
      setError(null)
      const result = await returnVideoToQueue(video.id)
      if (!result.success) {
        setError(result.error || 'Ошибка возврата видео')
      }
    })
  }

  return (
    <div className="px-6 py-4 flex items-start space-x-4 hover:bg-gray-800/50 transition-colors">
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
          <span className="flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {video.requested_by}
          </span>
          {video.played_at && (
            <span className="flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {new Date(video.played_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Ошибка */}
        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
      </div>

      {/* Действия */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        {/* Статус */}
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            video.status === 'completed'
              ? 'bg-green-900 text-green-300'
              : 'bg-yellow-900 text-yellow-300'
          }`}
        >
          {video.status === 'completed' ? 'Завершено' : 'Пропущено'}
        </span>

        {/* Кнопка возврата */}
        <button
          onClick={handleReturn}
          disabled={isPending}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
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
          <span>Вернуть</span>
        </button>
      </div>
    </div>
  )
}
