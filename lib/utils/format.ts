/**
 * Форматирует timestamp в читаемый формат
 *
 * @param timestamp - ISO 8601 timestamp
 * @returns Читаемая дата и время
 *
 * @example
 * ```ts
 * formatTimestamp('2024-01-19T12:30:00Z')
 * // => '19.01.2024, 12:30'
 * ```
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

/**
 * Форматирует относительное время (сколько времени прошло)
 *
 * @param timestamp - ISO 8601 timestamp
 * @returns Относительное время ("2 минуты назад")
 *
 * @example
 * ```ts
 * formatRelativeTime('2024-01-19T12:25:00Z') // текущее время 12:30
 * // => '5 минут назад'
 * ```
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return `${diffSec} секунд назад`
  if (diffMin < 60) return `${diffMin} минут назад`
  if (diffHour < 24) return `${diffHour} часов назад`
  if (diffDay < 7) return `${diffDay} дней назад`

  return formatTimestamp(timestamp)
}

/**
 * Сокращает текст до заданной длины
 *
 * @param text - Исходный текст
 * @param maxLength - Максимальная длина
 * @returns Сокращенный текст с многоточием
 *
 * @example
 * ```ts
 * truncate('Very long video title that needs to be shortened', 20)
 * // => 'Very long video ti...'
 * ```
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Форматирует число с разделителями тысяч
 *
 * @param num - Число
 * @returns Отформатированное число
 *
 * @example
 * ```ts
 * formatNumber(1234567)
 * // => '1 234 567'
 * ```
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num)
}

/**
 * Склоняет существительное в зависимости от числа
 *
 * @param count - Количество
 * @param forms - Формы слова [1, 2-4, 5+]
 * @returns Правильная форма слова
 *
 * @example
 * ```ts
 * pluralize(1, ['видео', 'видео', 'видео'])
 * // => '1 видео'
 *
 * pluralize(2, ['минута', 'минуты', 'минут'])
 * // => '2 минуты'
 *
 * pluralize(5, ['минута', 'минуты', 'минут'])
 * // => '5 минут'
 * ```
 */
export function pluralize(
  count: number,
  forms: [string, string, string]
): string {
  const cases = [2, 0, 1, 1, 1, 2]
  const index =
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[Math.min(count % 10, 5)]

  return `${count} ${forms[index]}`
}
