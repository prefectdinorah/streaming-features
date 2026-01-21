'use client'

import { useState, useTransition } from 'react'
import { playSpecificVideo } from '@/app/actions/player'
import type { VideoQueue } from '@/types/queue'

interface VideoQueueItemProps {
  video: VideoQueue
  index: number
  isFirst: boolean
}

/**
 * Элемент очереди видео с кнопкой "Играть сейчас"
 */
export function VideoQueueItem({
  video,
  index,
  isFirst,
}: VideoQueueItemProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handlePlay = () => {
    startTransition(async () => {
      setError(null)
      const result = await playSpecificVideo(video.id)
      if (!result.success) {
        setError(result.error || 'Ошибка запуска видео')
      }
    })
  }

  return (
    <div className="px-6 py-4 flex items-start space-x-4 hover:bg-gray-800 transition-colors">
      {/* Позиция */}
      <div className="flex-shrink-0 w-8 text-center">
        <span
          className={`text-lg font-bold ${
            isFirst ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {index + 1}
        </span>
      </div>

      {/* Миниатюра */}
      {video.thumbnail_url && (
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-32 h-24 object-cover rounded"
        />
      )}

      {/* Информация */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-white truncate">
          {video.title}
        </h3>
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
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
          {video.duration && (
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
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
              {Math.floor(video.duration / 60)}:
              {String(video.duration % 60).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mt-2 text-xs text-red-400">{error}</div>
        )}
      </div>

      {/* Действия */}
      <div className="flex-shrink-0 flex items-center space-x-3">
        {isFirst ? (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white shadow-lg">
            <svg
              className="w-4 h-4 mr-2 animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
            </svg>
            Воспроизводится
          </span>
        ) : (
          <button
            onClick={handlePlay}
            disabled={isPending}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
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
            <span>Играть сейчас</span>
          </button>
        )}
      </div>
    </div>
  )
}
