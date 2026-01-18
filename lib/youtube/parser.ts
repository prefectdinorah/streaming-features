/**
 * Извлекает YouTube video ID из URL
 *
 * Поддерживаемые форматы:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 *
 * @param url - YouTube URL
 * @returns Video ID (11 символов) или null если URL невалиден
 *
 * @example
 * ```ts
 * extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // => 'dQw4w9WgXcQ'
 *
 * extractVideoId('https://youtu.be/dQw4w9WgXcQ')
 * // => 'dQw4w9WgXcQ'
 *
 * extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')
 * // => 'dQw4w9WgXcQ'
 *
 * extractVideoId('not-a-youtube-url')
 * // => null
 * ```
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    // youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([\w-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    // youtube.com/v/VIDEO_ID
    /(?:youtube\.com\/v\/)([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Проверяет, является ли URL валидным YouTube URL
 *
 * @param url - URL для проверки
 * @returns true если URL валиден, иначе false
 *
 * @example
 * ```ts
 * validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // => true
 *
 * validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')
 * // => true
 *
 * validateYouTubeUrl('https://vimeo.com/123456')
 * // => false
 * ```
 */
export function validateYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null
}

/**
 * Нормализует YouTube URL к стандартному формату
 *
 * @param url - YouTube URL
 * @returns Нормализованный URL или null если невалиден
 *
 * @example
 * ```ts
 * normalizeYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')
 * // => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
 *
 * normalizeYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')
 * // => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
 * ```
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractVideoId(url)
  if (!videoId) return null

  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * Создает URL для YouTube thumbnail
 *
 * @param videoId - YouTube video ID
 * @param quality - Качество изображения ('default' | 'medium' | 'high' | 'maxres')
 * @returns URL thumbnail изображения
 *
 * @example
 * ```ts
 * getThumbnailUrl('dQw4w9WgXcQ', 'medium')
 * // => 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
 * ```
 */
export function getThumbnailUrl(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'
): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}
