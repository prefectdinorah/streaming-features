# YouTube Player для Twitch Трансляций

Система для воспроизведения YouTube видео на Twitch трансляции через OBS Browser Source с управлением через Twitch чат.

## 🚀 Возможности

- ✅ **YouTube плеер** для OBS Browser Source с автоматической очередью
- ✅ **Twitch бот** для добавления видео через команду `!play <URL>`
- ✅ **Real-time синхронизация** через Supabase Realtime
- ✅ **Валидация видео** (длительность, дубликаты, размер очереди)
- ✅ **YouTube Data API** для получения метаданных
- ✅ **TypeScript** strict mode
- ✅ **REST API** для программного управления

## 📋 Технологический стек

- **Frontend:** Next.js 15 (App Router, Server Components)
- **Backend:** Supabase (Database, Realtime, RLS)
- **Bot:** Node.js + tmi.js
- **Styling:** Tailwind CSS
- **Language:** TypeScript (strict mode)
- **Deploy:** Vercel

## 🏗️ Архитектура

```
┌──────────────┐      !play <url>       ┌─────────────────┐
│ Twitch Chat  │─────────────────────────>│  Twitch Bot     │
└──────────────┘                          │  (Node.js)      │
                                          └────────┬────────┘
                                                   │ HTTP POST
                                                   ▼
                                          ┌─────────────────┐
                                          │  Vercel API     │
                                          │  (Next.js)      │
                                          └────────┬────────┘
                                                   │
                                                   ▼
┌──────────────┐     WebSocket          ┌─────────────────┐
│ OBS Browser  │<────────────────────────│  Supabase       │
│ Source       │     Realtime            │  (DB+Realtime)  │
│ (/player)    │                         └─────────────────┘
└──────────────┘
```

## 📦 Установка

### 1. Клонировать репозиторий
```bash
git clone <your-repo-url>
cd twitch
```

### 2. Установить зависимости Next.js
```bash
npm install
```

### 3. Установить зависимости Twitch Bot
```bash
cd twitch-bot
npm install
cd ..
```

### 4. Настроить Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Примените SQL миграцию из `supabase/migrations/20260119000001_init_youtube_player.sql`
3. Скопируйте URL и ключи

### 5. Настроить YouTube Data API

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте проект и включите YouTube Data API v3
3. Создайте API ключ

### 6. Настроить переменные окружения

**`.env.local` (Next.js):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_SECRET_KEY=your-secret-key
YOUTUBE_API_KEY=your-youtube-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**`twitch-bot/.env` (Twitch Bot):**
```env
TWITCH_BOT_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_oauth_token
TWITCH_CHANNEL=your_channel_name
API_BASE_URL=http://localhost:3000
API_KEY=your-secret-key
```

Подробные инструкции: [docs/SETUP.md](docs/SETUP.md)

## 🎮 Запуск

### Development

**Terminal 1 (Next.js):**
```bash
npm run dev
```

**Terminal 2 (Twitch Bot):**
```bash
cd twitch-bot
npm run dev
```

### Production

**Next.js (Vercel):**
```bash
npm run build
npm start
```

**Twitch Bot (локально):**
```bash
cd twitch-bot
npm run build
npm start
```

## 🎥 Настройка OBS

1. Добавьте **Browser Source**
2. URL: `http://localhost:3000/player`
3. Width: `1920`, Height: `1080`
4. Отключите "Shutdown source when not visible"
5. Включите "Refresh browser when scene becomes active"

Подробнее: [docs/OBS.md](docs/OBS.md)

## 📝 Использование

### Twitch чат команды

**!play <YouTube_URL>**
```
!play https://www.youtube.com/watch?v=dQw4w9WgXcQ
!play https://youtu.be/dQw4w9WgXcQ
```

Бот проверит:
- ✅ Валидность YouTube URL
- ✅ Длительность видео (макс 10 минут)
- ✅ Дубликаты (если запрещены)
- ✅ Размер очереди (макс 50 видео)

### API Endpoints

**POST /api/queue/add** - Добавить видео
```bash
curl -X POST http://localhost:3000/api/queue/add \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{"youtubeUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","requestedBy":"test_user"}'
```

**GET /api/queue/list** - Получить очередь
```bash
curl http://localhost:3000/api/queue/list
```

**POST /api/queue/skip** - Пропустить текущее видео
```bash
curl -X POST http://localhost:3000/api/queue/skip \
  -H "x-api-key: your-secret-key"
```

**GET /api/player/status** - Статус плеера
```bash
curl http://localhost:3000/api/player/status
```

## 📁 Структура проекта

```
twitch/
├── app/                          # Next.js App Router
│   ├── (public)/player/          # Browser Source для OBS
│   ├── api/queue/                # API endpoints
│   └── actions/player.ts         # Server Actions
├── components/player/            # YouTube Player компонент
├── hooks/useRealtimeQueue.ts     # Realtime подписка
├── lib/
│   ├── supabase/                 # Supabase клиенты
│   └── youtube/                  # YouTube API интеграция
├── types/                        # TypeScript типы
├── supabase/migrations/          # SQL миграции
├── twitch-bot/                   # Twitch бот (Node.js)
│   └── src/
│       ├── commands/play.ts      # !play команда
│       └── services/             # API и YouTube сервисы
└── docs/                         # Документация
```

## 🛠️ Настройки плеера

Настройки хранятся в таблице `player_settings`:

- `max_queue_size` - Максимум видео в очереди (по умолчанию: 50)
- `max_video_duration` - Максимальная длительность видео в секундах (по умолчанию: 600 = 10 минут)
- `allow_duplicates` - Разрешить дубликаты видео (по умолчанию: false)
- `is_paused` - Пауза плеера (по умолчанию: false)

Изменяйте через Supabase Dashboard или SQL:
```sql
UPDATE player_settings SET max_video_duration = 900; -- 15 минут
```

## 🐛 Troubleshooting

### Twitch бот не подключается
- Проверьте `TWITCH_OAUTH_TOKEN` начинается с `oauth:`
- Убедитесь `TWITCH_BOT_USERNAME` корректен
- Проверьте интернет соединение

### Видео не добавляются
- Запустите Next.js приложение (`npm run dev`)
- Проверьте `API_BASE_URL` в `twitch-bot/.env`
- Проверьте `API_KEY` совпадает с `API_SECRET_KEY`

### Browser Source не работает в OBS
- Проверьте URL: `http://localhost:3000/player`
- Refresh browser source (Right click → Refresh)
- Проверьте логи в Dev Tools (Right click → Interact)

## 📚 Документация

- [SETUP.md](docs/SETUP.md) - Подробная инструкция по настройке
- [OBS.md](docs/OBS.md) - Настройка OBS Browser Source
- [План реализации](C:\Users\anton\.claude\plans\quirky-bubbling-hopper.md) - Детальный план MVP

## 🤝 Вклад

Проект создан с использованием [Claude Code](https://claude.ai/code).

## 📄 Лицензия

MIT
