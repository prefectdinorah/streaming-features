# Настройка Twitch Бота для YouTube Player

## Шаг 1: Создать Twitch аккаунт для бота (если нет)

1. Перейдите на https://www.twitch.tv/
2. Нажмите "Регистрация"
3. Создайте аккаунт с именем вашего бота (например, `my_yt_player_bot`)
4. Подтвердите email

## Шаг 2: Получить OAuth токен

1. Откройте https://twitchapps.com/tmi/
2. Нажмите "Connect" и авторизуйтесь под **аккаунтом бота**
3. Скопируйте полученный токен (начинается с `oauth:`)
   ```
   Пример: oauth:abc123def456ghi789jkl012mno345pqr
   ```

## Шаг 3: Настроить `.env` файл

1. Перейдите в папку `twitch-bot`:
   ```bash
   cd twitch-bot
   ```

2. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

3. Откройте `.env` и заполните переменные:

```env
# Username вашего бота (например, "my_yt_player_bot")
TWITCH_BOT_USERNAME=my_yt_player_bot

# OAuth токен (должен начинаться с "oauth:")
TWITCH_OAUTH_TOKEN=oauth:abc123def456ghi789jkl012mno345pqr

# Название вашего Twitch канала (ваш основной аккаунт стримера)
TWITCH_CHANNEL=your_streaming_channel

# URL вашего Next.js приложения
# Production (Vercel): https://streaming-features.vercel.app
# Локально: http://localhost:3000
API_BASE_URL=https://streaming-features.vercel.app

# API ключ из Vercel Environment Variables (API_SECRET_KEY)
# Найдите в Vercel Dashboard → Settings → Environment Variables
API_KEY=A8lHR4ccwiVU/P2VlmR6hy9MG2kJZLqZn9YleK7I688=
```

## Шаг 4: Установить зависимости

```bash
npm install
```

## Шаг 5: Запустить бота

### Development (с автоперезагрузкой)
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Шаг 6: Проверить работу

1. Убедитесь, что бот подключился к Twitch:
   ```
   🤖 YouTube Player Twitch Bot
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Подключено к irc.chat.twitch.tv:443
   📺 Канал: your_streaming_channel
   🔗 API: https://streaming-features.vercel.app
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Бот готов к работе! Используйте команду !play <YouTube_URL>
   ```

2. Зайдите на свой Twitch канал в чат

3. Отправьте команду:
   ```
   !play https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

4. Бот должен ответить:
   ```
   ✅ "Rick Astley - Never Gonna Give You Up" добавлено в очередь на позицию 1.
   ```

## Команды бота

### !play <YouTube_URL>
Добавляет YouTube видео в очередь.

**Поддерживаемые форматы URL:**
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`

**Ограничения:**
- Максимальная длительность видео: 10 минут (настраивается в БД)
- Максимальный размер очереди: 50 видео (настраивается в БД)
- Дубликаты: запрещены по умолчанию (настраивается в БД)

**Примеры:**
```
!play https://www.youtube.com/watch?v=dQw4w9WgXcQ
!play https://youtu.be/dQw4w9WgXcQ
```

**Ответы бота:**
- ✅ "[название видео]" добавлено в очередь на позицию X.
- ❌ Неверная YouTube ссылка.
- ❌ Видео слишком длинное. Максимум 10 минут.
- ❌ Это видео уже в очереди.
- ❌ Очередь переполнена. Максимум 50 видео.

## Troubleshooting

### Бот не подключается к Twitch

**Ошибка:** `❌ Не удалось подключиться к Twitch`

**Решение:**
1. Проверьте, что `TWITCH_OAUTH_TOKEN` начинается с `oauth:`
2. Убедитесь, что `TWITCH_BOT_USERNAME` совпадает с именем аккаунта бота
3. Проверьте интернет соединение
4. Убедитесь, что токен не истек (перегенерируйте на https://twitchapps.com/tmi/)

### Бот не может добавить видео

**Ошибка:** `❌ Не удалось добавить видео. Попробуйте позже.`

**Решение:**
1. Убедитесь, что Next.js приложение запущено на Vercel
2. Проверьте `API_BASE_URL` в `.env` (должен быть https://streaming-features.vercel.app)
3. Проверьте `API_KEY` совпадает с `API_SECRET_KEY` в Vercel Environment Variables
4. Проверьте что YouTube API key настроен в Vercel Environment Variables

### Бот подключен, но не отвечает на команды

**Решение:**
1. Убедитесь, что бот не забанен на канале
2. Проверьте, что `TWITCH_CHANNEL` указан корректно (без символа #)
3. Проверьте логи бота - команды должны отображаться

### Permission denied ошибки

**Ошибка:** `permission denied for table player_settings`

**Решение:**
- Это уже исправлено в последнем коммите
- Убедитесь, что Vercel развернул последнюю версию
- Проверьте что миграции применены в Supabase

## Запуск бота в фоне (Production)

### Linux/macOS (с pm2)

```bash
# Установить pm2
npm install -g pm2

# Запустить бота
cd twitch-bot
npm run build
pm2 start dist/index.js --name youtube-bot

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Просмотр логов
pm2 logs youtube-bot

# Остановка
pm2 stop youtube-bot
```

### Windows (с nssm)

```bash
# 1. Скачать nssm: https://nssm.cc/download
# 2. Установить сервис:
nssm install YouTubeBot "C:\Program Files\nodejs\node.exe"
nssm set YouTubeBot AppDirectory "C:\dev\twitch\twitch-bot"
nssm set YouTubeBot AppParameters "dist\index.js"

# 3. Запустить сервис
nssm start YouTubeBot

# Просмотр логов
nssm set YouTubeBot AppStdout "C:\dev\twitch\twitch-bot\logs\output.log"
nssm set YouTubeBot AppStderr "C:\dev\twitch\twitch-bot\logs\error.log"
```

## Поддержка

Если возникают проблемы:
1. Проверьте логи бота
2. Проверьте логи в Vercel Dashboard
3. Проверьте что все environment variables настроены
4. Убедитесь что миграции Supabase применены
