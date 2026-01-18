/**
 * Валидирует YouTube URL
 *
 * Поддерживаемые форматы:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 *
 * @param url - YouTube URL
 * @returns true если URL валиден
 */
export function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^https?:\/\/youtu\.be\/[\w-]{11}/,
  ]

  return patterns.some((pattern) => pattern.test(url))
}

/**
 * Извлекает video ID из YouTube URL
 *
 * @param url - YouTube URL
 * @returns Video ID или null
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}
