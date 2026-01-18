# Инструкция по настройке YouTube Player для Twitch

Подробное руководство по установке и настройке проекта.

## Требования

- Node.js 20+
- npm или yarn
- Аккаунт Supabase (бесплатный план)
- Аккаунт Google Cloud (для YouTube Data API)
- Аккаунт Twitch (для бота)

## Шаг 1: Supabase

### 1.1. Создать проект

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New project"
3. Введите название проекта и пароль БД
4. Выберите регион (ближайший к вам)
5. Дождитесь создания проекта (~2 минуты)

### 1.2. Применить SQL миграцию

1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое файла `supabase/migrations/20260119000001_init_youtube_player.sql`
3. Вставьте в SQL Editor и нажмите "Run"
4. Убедитесь, что миграция выполнена успешно

### 1.3. Получить ключи

1. Перейдите в Settings → API
2. Скопируйте:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Секретный ключ!)

## Шаг 2: YouTube Data API

### 2.1. Создать проект в Google Cloud

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Нажмите "Select a project" → "New Project"
3. Введите название проекта
4. Нажмите "Create"

### 2.2. Включить YouTube Data API v3

1. В Google Cloud Console перейдите в "APIs & Services" → "Library"
2. Найдите "YouTube Data API v3"
3. Нажмите "Enable"

### 2.3. Создать API ключ

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "API key"
3. Скопируйте ключ → `YOUTUBE_API_KEY`
4. (Опционально) Ограничьте ключ только для YouTube Data API v3

**Квоты:**
- Бесплатно: 10,000 квот/день
- Один запрос метаданных = 1 квота
- ~10,000 видео в день бесплатно

## Шаг 3: Twitch Bot

### 3.1. Создать аккаунт для бота

1. Создайте новый Twitch аккаунт (или используйте существующий)
2. Запомните username → `TWITCH_BOT_USERNAME`

### 3.2. Получить OAuth токен

1. Перейдите на [twitchapps.com/tmi](https://twitchapps.com/tmi)
2. Нажмите "Connect" и авторизуйтесь под аккаунтом бота
3. Скопируйте OAuth токен (начинается с `oauth:`)
4. Сохраните в `TWITCH_OAUTH_TOKEN`

**⚠️ Важно:** OAuth токен должен начинаться с `oauth:`, например:
```
oauth:abc123def456ghi789
```

## Шаг 4: Настройка Next.js проекта

### 4.1. Установить зависимости

```bash
cd C:\dev\twitch
npm install
```

### 4.2. Создать .env.local

Скопируйте `.env.local.example` в `.env.local`:

```bash
cp .env.local.example .env.local
```

Заполните переменные:

```env
# Supabase (из Шага 1.3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Security (сгенерируйте случайную строку)
API_SECRET_KEY=my-super-secret-key-change-this

# YouTube Data API (из Шага 2.3)
YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.3. Запустить Next.js

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) - должна открыться главная страница.

## Шаг 5: Настройка Twitch Bot

### 5.1. Установить зависимости

```bash
cd twitch-bot
npm install
```

### 5.2. Создать .env

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Заполните переменные:

```env
# Twitch (из Шага 3)
TWITCH_BOT_USERNAME=my_youtube_bot
TWITCH_OAUTH_TOKEN=oauth:abc123def456ghi789
TWITCH_CHANNEL=your_channel_name

# API (из Шага 4.2)
API_BASE_URL=http://localhost:3000
API_KEY=my-super-secret-key-change-this
```

**⚠️ Важно:**
- `API_KEY` должен совпадать с `API_SECRET_KEY` из `.env.local` Next.js проекта
- `TWITCH_CHANNEL` - это ваш Twitch канал (без @)

### 5.3. Запустить Twitch Bot

```bash
npm run dev
```

Должно появиться сообщение:

```
✅ Подключено к irc-ws.chat.twitch.tv:443
📺 Канал: your_channel
🔗 API: http://localhost:3000

Бот готов к работе! Используйте команду !play <YouTube_URL>
```

## Шаг 6: Проверка работоспособности

### 6.1. Проверка Next.js

1. Откройте [http://localhost:3000](http://localhost:3000)
2. Откройте [http://localhost:3000/player](http://localhost:3000/player)
3. Должно отображаться "Очередь пуста"

### 6.2. Проверка Twitch Bot

1. Откройте Twitch чат вашего канала
2. Напишите:
   ```
   !play https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
3. Бот должен ответить:
   ```
   @your_username ✅ "Rick Astley - Never Gonna Give You Up" добавлено в очередь на позицию 1.
   ```
4. Обновите `/player` - видео должно начать воспроизводиться

### 6.3. Проверка API

```bash
curl -X POST http://localhost:3000/api/queue/add \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-super-secret-key-change-this" \
  -d '{"youtubeUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","requestedBy":"test_user"}'
```

Ответ:
```json
{
  "success": true,
  "data": {
    "id": "uuid...",
    "position": 1,
    "title": "Rick Astley - Never Gonna Give You Up"
  }
}
```

## Шаг 7: Настройка OBS

См. [OBS.md](OBS.md)

## Troubleshooting

### Ошибка: "Unauthorized" при запросе к API

**Причина:** `API_KEY` не совпадает с `API_SECRET_KEY`

**Решение:**
1. Откройте `.env.local` в Next.js проекте
2. Скопируйте значение `API_SECRET_KEY`
3. Вставьте в `twitch-bot/.env` как `API_KEY`

### Ошибка: "Не удалось подключиться к Twitch"

**Причина:** Неверный OAuth токен

**Решение:**
1. Получите новый токен на [twitchapps.com/tmi](https://twitchapps.com/tmi)
2. Убедитесь, что токен начинается с `oauth:`
3. Обновите `TWITCH_OAUTH_TOKEN` в `twitch-bot/.env`

### Ошибка: "YouTube API error"

**Причина:** Неверный API ключ или квота исчерпана

**Решение:**
1. Проверьте `YOUTUBE_API_KEY` в `.env.local`
2. Проверьте квоты в Google Cloud Console

### Browser Source не загружается

**Причина:** Next.js приложение не запущено

**Решение:**
1. Убедитесь, что `npm run dev` запущен
2. Проверьте [http://localhost:3000/player](http://localhost:3000/player) в браузере
3. Если работает, обновите Browser Source в OBS (Right click → Refresh)

## Production Deployment

### Vercel (Next.js)

1. Установите Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Деплой:
   ```bash
   vercel --prod
   ```

3. Добавьте environment variables в Vercel Dashboard

### Twitch Bot (локально)

Бот запускается локально на вашем ПК во время трансляции:

```bash
cd twitch-bot
npm run build
npm start
```

Для автозапуска при включении ПК:
- Windows: Task Scheduler
- Linux/Mac: systemd service или PM2

## Поддержка

Если возникли проблемы:
1. Проверьте логи в терминале (Next.js и Twitch Bot)
2. Проверьте Browser Console (F12) на `/player`
3. Проверьте Supabase logs в Dashboard
