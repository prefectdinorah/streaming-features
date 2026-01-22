'use client'

import { useState, useTransition, useEffect } from 'react'
import { addVideoToQueue } from '@/app/actions/queue'

/**
 * Форма добавления видео в очередь
 */
export function AddVideoForm() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Загрузить сохраненное имя из localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('requestedBy')
    if (savedName) {
      setRequestedBy(savedName)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!youtubeUrl.trim()) {
      setError('Введите YouTube URL')
      return
    }

    if (!requestedBy.trim()) {
      setError('Введите имя')
      return
    }

    startTransition(async () => {
      try {
        // Вызвать Server Action
        const result = await addVideoToQueue(youtubeUrl, requestedBy)

        if (!result.success) {
          setError(result.error || 'Ошибка при добавлении видео')
          return
        }

        // Успешно добавлено
        setSuccess(true)
        setYoutubeUrl('')

        // Сохранить имя в localStorage
        localStorage.setItem('requestedBy', requestedBy)

        // Убрать сообщение об успехе через 3 секунды
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        console.error('Error adding video:', err)
        setError('Не удалось добавить видео')
      }
    })
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4">
        Добавить видео в очередь
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* YouTube URL */}
        <div>
          <label
            htmlFor="youtube-url"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            YouTube URL
          </label>
          <input
            id="youtube-url"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isPending}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Requested By */}
        <div>
          <label
            htmlFor="requested-by"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Ваше имя
          </label>
          <input
            id="requested-by"
            type="text"
            value={requestedBy}
            onChange={(e) => setRequestedBy(e.target.value)}
            placeholder="Введите ваше имя"
            disabled={isPending}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-sm text-green-400">✅ Видео добавлено в очередь!</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Добавление...</span>
            </>
          ) : (
            <>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Добавить в очередь</span>
            </>
          )}
        </button>
      </form>

      {/* Подсказка */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
        <p className="text-xs text-blue-300 mb-2">
          💡 <strong>Поддерживаемые форматы ссылок:</strong>
        </p>
        <ul className="text-xs text-blue-200 space-y-1 ml-4">
          <li>• https://www.youtube.com/watch?v=dQw4w9WgXcQ</li>
          <li>• https://youtu.be/dQw4w9WgXcQ</li>
          <li>• https://m.youtube.com/watch?v=dQw4w9WgXcQ</li>
        </ul>
      </div>
    </div>
  )
}
