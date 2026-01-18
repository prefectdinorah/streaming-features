import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Загрузить .env файл
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

/**
 * Конфигурация Twitch бота
 *
 * Все переменные окружения должны быть определены в файле .env
 * в корне директории twitch-bot/
 */
export const config = {
  twitch: {
    botUsername: process.env.TWITCH_BOT_USERNAME || '',
    oauthToken: process.env.TWITCH_OAUTH_TOKEN || '',
    channel: process.env.TWITCH_CHANNEL || '',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    apiKey: process.env.API_KEY || '',
  },
} as const

/**
 * Валидирует конфигурацию
 * Выбрасывает ошибку если обязательные переменные не заданы
 */
export function validateConfig() {
  const required = {
    'TWITCH_BOT_USERNAME': config.twitch.botUsername,
    'TWITCH_OAUTH_TOKEN': config.twitch.oauthToken,
    'TWITCH_CHANNEL': config.twitch.channel,
    'API_KEY': config.api.apiKey,
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Отсутствуют обязательные переменные окружения:\n${missing.join('\n')}\n\n` +
        'Создайте файл .env в директории twitch-bot/ по образцу .env.example'
    )
  }
}
