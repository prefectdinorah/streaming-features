# YouTube Player Twitch Bot

Twitch бот для управления YouTube плеером через чат команды.

## Установка

```bash
cd twitch-bot
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

2. Получите OAuth токен для бота:
   - Перейдите на https://twitchapps.com/tmi/
   - Авторизуйтесь под аккаунтом бота
   - Скопируйте токен (должен начинаться с `oauth:`)

3. Заполните `.env`:
   ```env
   TWITCH_BOT_USERNAME=my_youtube_bot
   TWITCH_OAUTH_TOKEN=oauth:xxxxxxxxxxxxxxxxxxxxxxxxx
   TWITCH_CHANNEL=your_channel
   API_BASE_URL=http://localhost:3000
   API_KEY=your-api-key-from-nextjs-env
   ```

## Запуск

### Development (с автоперезагрузкой)
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Команды

### !play <YouTube_URL>
Добавляет YouTube видео в очередь.

**Примеры:**
```
!play https://www.youtube.com/watch?v=dQw4w9WgXcQ
!play https://youtu.be/dQw4w9WgXcQ
```

**Ответы бота:**
- ✅ "[название видео]" добавлено в очередь на позицию 1.
- ❌ Неверная YouTube ссылка.
- ❌ Видео слишком длинное. Максимум 10 минут.
- ❌ Это видео уже в очереди.
- ❌ Очередь переполнена. Максимум 50 видео.

## Структура проекта

```
twitch-bot/
├── src/
│   ├── index.ts              # Точка входа
│   ├── config.ts             # Конфигурация
│   ├── commands/
│   │   └── play.ts           # !play команда
│   └── services/
│       ├── api.ts            # HTTP клиент для Vercel API
│       └── youtube.ts        # Валидация YouTube URL
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Troubleshooting

### Бот не подключается к Twitch
- Проверьте, что `TWITCH_OAUTH_TOKEN` начинается с `oauth:`
- Убедитесь, что `TWITCH_BOT_USERNAME` корректен
- Проверьте интернет соединение

### Бот не может добавить видео
- Убедитесь, что Next.js приложение запущено (`npm run dev` в корне проекта)
- Проверьте `API_BASE_URL` в `.env`
- Проверьте `API_KEY` совпадает с `API_SECRET_KEY` в Next.js `.env.local`

### Twitch API errors
- Убедитесь, что канал существует и доступен
- Проверьте, что бот не забанен на канале
