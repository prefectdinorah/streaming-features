import tmi from 'tmi.js'
import { config, validateConfig } from './config.js'
import { handlePlayCommand } from './commands/play.js'

/**
 * YouTube Player Twitch Bot
 *
 * Позволяет пользователям добавлять YouTube видео в очередь
 * через команды в Twitch чате
 *
 * Команды:
 * - !play <YouTube_URL> - Добавить видео в очередь
 */

// Валидировать конфигурацию перед запуском
try {
  validateConfig()
} catch (error) {
  if (error instanceof Error) {
    console.error(`\n❌ Ошибка конфигурации:\n${error.message}\n`)
    process.exit(1)
  }
}

// Создать Twitch клиент
const client = new tmi.Client({
  options: {
    debug: false, // Включить debug для отладки
    messagesLogLevel: 'info',
  },
  connection: {
    reconnect: true,
    secure: true,
  },
  identity: {
    username: config.twitch.botUsername,
    password: config.twitch.oauthToken,
  },
  channels: [config.twitch.channel],
})

// Event: Подключение к Twitch
client.on('connected', (address, port) => {
  console.log('\n🤖 YouTube Player Twitch Bot')
  console.log('━'.repeat(50))
  console.log(`✅ Подключено к ${address}:${port}`)
  console.log(`📺 Канал: ${config.twitch.channel}`)
  console.log(`🔗 API: ${config.api.baseUrl}`)
  console.log('━'.repeat(50))
  console.log('\nБот готов к работе! Используйте команду !play <YouTube_URL>\n')
})

// Event: Отключение от Twitch
client.on('disconnected', (reason) => {
  console.log(`\n⚠️  Отключено от Twitch: ${reason}\n`)
})

// Event: Ошибка подключения
client.on('connectfail', () => {
  console.error('\n❌ Не удалось подключиться к Twitch')
  console.error('Проверьте:')
  console.error('1. TWITCH_BOT_USERNAME корректен')
  console.error('2. TWITCH_OAUTH_TOKEN начинается с "oauth:"')
  console.error('3. Интернет соединение работает\n')
})

// Event: Сообщения в чате
client.on('message', async (channel, tags, message, self) => {
  // Игнорировать собственные сообщения
  if (self) return

  const username = tags.username || 'Anonymous'
  const args = message.trim().split(/\s+/)
  const command = args[0].toLowerCase()

  // Логировать команды
  if (command.startsWith('!')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${username}: ${message}`)
  }

  try {
    // Обработать команды
    switch (command) {
      case '!play':
        await handlePlayCommand(client, channel, username, args[1])
        break

      // Добавить дополнительные команды здесь
      // case '!skip':
      //   await handleSkipCommand(client, channel, username)
      //   break

      default:
        // Неизвестная команда, игнорируем
        break
    }
  } catch (error) {
    console.error('Error handling command:', error)
    client.say(channel, `@${username} Произошла ошибка. Попробуйте позже.`)
  }
})

// Подключиться к Twitch
console.log('\n🔄 Подключение к Twitch...\n')
client.connect().catch((error) => {
  console.error('\n❌ Критическая ошибка:', error)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Выключение бота...')
  client.disconnect()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n👋 Выключение бота...')
  client.disconnect()
  process.exit(0)
})
