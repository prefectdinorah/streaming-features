import { z } from 'zod'
import { validateYouTubeUrl } from './parser'

/**
 * Zod схема для валидации YouTube URL
 *
 * Проверяет:
 * - URL является валидным
 * - URL является YouTube ссылкой
 * - URL содержит валидный video ID
 *
 * @example
 * ```ts
 * const result = youtubeUrlSchema.safeParse('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * if (result.success) {
 *   console.log('Valid URL:', result.data)
 * } else {
 *   console.error('Invalid URL:', result.error.errors)
 * }
 * ```
 */
export const youtubeUrlSchema = z
  .string()
  .url('Неверный формат URL')
  .refine(
    (url) => validateYouTubeUrl(url),
    { message: 'Неверная YouTube ссылка' }
  )

/**
 * Zod схема для video ID
 *
 * YouTube video ID всегда состоит из 11 символов:
 * - Латинские буквы (a-z, A-Z)
 * - Цифры (0-9)
 * - Дефис (-) и подчеркивание (_)
 *
 * @example
 * ```ts
 * const result = videoIdSchema.safeParse('dQw4w9WgXcQ')
 * // => { success: true, data: 'dQw4w9WgXcQ' }
 *
 * const invalid = videoIdSchema.safeParse('invalid')
 * // => { success: false, error: ... }
 * ```
 */
export const videoIdSchema = z
  .string()
  .length(11, 'Video ID должен быть 11 символов')
  .regex(
    /^[\w-]{11}$/,
    'Video ID содержит недопустимые символы'
  )

/**
 * Zod схема для Twitch username
 *
 * Правила Twitch username:
 * - От 1 до 25 символов
 * - Только латинские буквы, цифры и подчеркивание
 * - Начинается с буквы
 *
 * @example
 * ```ts
 * const result = twitchUsernameSchema.safeParse('example_user')
 * // => { success: true, data: 'example_user' }
 * ```
 */
export const twitchUsernameSchema = z
  .string()
  .min(1, 'Username не может быть пустым')
  .max(25, 'Username не может быть длиннее 25 символов')
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'Username может содержать только латинские буквы, цифры и подчеркивание'
  )

/**
 * Валидирует длительность видео
 *
 * @param duration - Длительность в секундах
 * @param maxDuration - Максимальная длительность в секундах
 * @returns true если длительность допустима
 *
 * @example
 * ```ts
 * validateDuration(300, 600) // 5 минут <= 10 минут
 * // => true
 *
 * validateDuration(900, 600) // 15 минут > 10 минут
 * // => false
 * ```
 */
export function validateDuration(
  duration: number,
  maxDuration: number
): boolean {
  return duration > 0 && duration <= maxDuration
}

/**
 * Создает сообщение об ошибке валидации YouTube URL
 *
 * @param url - Проверяемый URL
 * @returns Сообщение об ошибке или null если URL валиден
 *
 * @example
 * ```ts
 * getYouTubeUrlError('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // => null
 *
 * getYouTubeUrlError('not-a-url')
 * // => 'Неверный формат URL'
 *
 * getYouTubeUrlError('https://vimeo.com/123')
 * // => 'Неверная YouTube ссылка'
 * ```
 */
export function getYouTubeUrlError(url: string): string | null {
  const result = youtubeUrlSchema.safeParse(url)
  if (result.success) return null

  // Вернуть первую ошибку
  return result.error.errors[0]?.message || 'Неверная YouTube ссылка'
}
