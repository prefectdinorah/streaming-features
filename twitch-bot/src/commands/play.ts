import type { Client } from 'tmi.js'
import { validateYouTubeUrl } from '../services/youtube.js'
import { addVideoToQueue } from '../services/api.js'

/**
 * Обработчик команды !play
 *
 * Добавляет YouTube видео в очередь
 *
 * Использование: !play <YouTube_URL>
 *
 * @param client - Twitch клиент
 * @param channel - Канал Twitch
 * @param username - Username пользователя
 * @param url - YouTube URL (необязательный)
 */
export async function handlePlayCommand(
  client: Client,
  channel: string,
  username: string,
  url?: string
) {
  // Проверка наличия URL
  if (!url) {
    client.say(
      channel,
      `@${username} Использование: !play <YouTube_URL>`
    )
    return
  }

  // Валидация YouTube URL
  if (!validateYouTubeUrl(url)) {
    client.say(
      channel,
      `@${username} ❌ Неверная YouTube ссылка. Используйте формат: https://www.youtube.com/watch?v=VIDEO_ID`
    )
    return
  }

  try {
    // Отправить запрос к API
    const result = await addVideoToQueue(url, username)

    if (result.success && result.data) {
      // Успешно добавлено
      client.say(
        channel,
        `@${username} ✅ "${result.data.title}" добавлено в очередь на позицию ${result.data.position}.`
      )
    } else {
      // Ошибка от API
      client.say(
        channel,
        `@${username} ❌ ${result.error || 'Не удалось добавить видео'}`
      )
    }
  } catch (error) {
    console.error('Error in handlePlayCommand:', error)
    client.say(
      channel,
      `@${username} ❌ Произошла ошибка. Попробуйте позже.`
    )
  }
}
