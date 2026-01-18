import type { YouTubeVideoMetadata, YouTubeAPIResponse } from '@/types/queue'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!
const API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * Получает метаданные YouTube видео через YouTube Data API v3
 *
 * @param videoId - YouTube video ID (11 символов)
 * @returns Метаданные видео или null в случае ошибки
 *
 * Требуется:
 * - YouTube Data API v3 должен быть включен в Google Cloud Console
 * - Переменная окружения YOUTUBE_API_KEY должна быть установлена
 *
 * Ограничения API:
 * - Бесплатный лимит: 10,000 квот в день
 * - Этот запрос стоит 1 квоту
 *
 * @example
 * ```ts
 * const metadata = await getVideoMetadata('dQw4w9WgXcQ')
 * if (metadata) {
 *   console.log(metadata.title) // "Rick Astley - Never Gonna Give You Up"
 *   console.log(metadata.duration) // 212 (секунды)
 * }
 * ```
 */
export async function getVideoMetadata(
  videoId: string
): Promise<YouTubeVideoMetadata | null> {
  try {
    const url = new URL(`${API_BASE}/videos`)
    url.searchParams.set('id', videoId)
    url.searchParams.set('key', YOUTUBE_API_KEY)
    url.searchParams.set('part', 'snippet,contentDetails')

    const response = await fetch(url.toString(), {
      next: {
        revalidate: 3600, // Кэшировать на 1 час
      },
    })

    if (!response.ok) {
      console.error(
        `YouTube API error: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data: YouTubeAPIResponse = await response.json()

    if (!data.items || data.items.length === 0) {
      console.error(`Video not found: ${videoId}`)
      return null
    }

    const video = data.items[0]
    const duration = parseDuration(video.contentDetails.duration)

    return {
      id: videoId,
      title: video.snippet.title,
      duration,
      thumbnailUrl: video.snippet.thumbnails.medium.url,
    }
  } catch (error) {
    console.error('YouTube API error:', error)
    return null
  }
}

/**
 * Парсит ISO 8601 duration в секунды
 *
 * ISO 8601 формат: PT[hours]H[minutes]M[seconds]S
 *
 * @example
 * ```ts
 * parseDuration('PT15M33S')  // 933 (15 минут 33 секунды)
 * parseDuration('PT1H30M')   // 5400 (1 час 30 минут)
 * parseDuration('PT45S')     // 45 (45 секунд)
 * parseDuration('PT2H15M10S') // 8110 (2 часа 15 минут 10 секунд)
 * ```
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Форматирует секунды в читаемый формат (H:MM:SS или M:SS)
 *
 * @example
 * ```ts
 * formatDuration(933)   // "15:33"
 * formatDuration(5400)  // "1:30:00"
 * formatDuration(45)    // "0:45"
 * formatDuration(3661)  // "1:01:01"
 * ```
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
