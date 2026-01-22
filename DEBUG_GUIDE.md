# Руководство по отладке YouTube Player

## Проблема: Кнопки управления не работают

### Шаг 1: Проверить что миграции применены

Откройте Supabase SQL Editor и выполните:

```sql
-- Проверить что Realtime включен для таблиц
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Ожидаемый результат:** В списке должны быть:
- `twitch_player.video_queue`
- `twitch_player.player_settings`

Если их нет, выполните миграцию `20260121000005_enable_realtime.sql`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE twitch_player.video_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE twitch_player.player_settings;
```

### Шаг 2: Проверить логи в браузере

1. Откройте https://streaming-features.vercel.app/player (OBS плеер)
2. Откройте DevTools (F12)
3. Перейдите на вкладку Console

**Что должно быть в логах:**
```
[useRealtimeQueue] Loading settings...
[useRealtimeQueue] Settings loaded: { id: "...", is_paused: false, ... }
[useRealtimeQueue] Settings subscription status: SUBSCRIBED
[useRealtimeQueue] ✅ Successfully subscribed to player_settings changes
```

**Если видите ошибки:**
- `❌ Failed to subscribe` → Проверьте что Realtime включен (Шаг 1)
- `No settings found` → Выполните инициализацию настроек (см. ниже)

### Шаг 3: Проверить что настройки существуют

```sql
SELECT * FROM twitch_player.player_settings;
```

**Если таблица пуста:**
```sql
INSERT INTO twitch_player.player_settings (is_paused, max_queue_size, max_video_duration, allow_duplicates)
VALUES (false, 50, 600, false);
```

### Шаг 4: Тестирование кнопок

1. Откройте Dashboard: https://streaming-features.vercel.app/dashboard/queue
2. Откройте DevTools Console
3. Нажмите кнопку "Пауза"

**Что должно быть в логах Dashboard:**
```
[pausePlayer] Starting pause action...
[pausePlayer] Settings ID: "abc-123-def"
[pausePlayer] Successfully paused. Updated data: [{ is_paused: true, ... }]
```

**Что должно быть в логах OBS Player (/player):**
```
[useRealtimeQueue] Settings realtime update received: { ... }
[useRealtimeQueue] New settings data: { is_paused: true, ... }
[useRealtimeQueue] Settings loaded: { is_paused: true, ... }
[YouTubePlayer] Pause effect triggered: { hasPlayer: true, isPaused: true, ... }
[YouTubePlayer] Applying pause state: true
[YouTubePlayer] Pausing video...
```

### Шаг 5: Проверить Realtime в Supabase Dashboard

1. Откройте Supabase Dashboard → Database → Replication
2. Убедитесь, что Realtime включен
3. Проверьте что таблицы `video_queue` и `player_settings` в списке

### Шаг 6: Проверить Environment Variables в Vercel

1. Откройте Vercel Dashboard → Settings → Environment Variables
2. Убедитесь что установлены:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `API_SECRET_KEY`
   - `YOUTUBE_API_KEY`

3. Если изменили переменные - передеплойте:
   ```bash
   git commit --allow-empty -m "redeploy"
   git push origin dev
   ```

## Частые проблемы

### Realtime не работает

**Симптомы:**
- Кнопки не влияют на плеер
- В логах: `CHANNEL_ERROR` или `CLOSED`

**Решение:**
1. Проверьте что Realtime включен в Supabase Project Settings
2. Проверьте что таблицы добавлены в publication (Шаг 1)
3. Перезапустите Supabase Realtime:
   - Supabase Dashboard → Database → Replication → Restart

### Server Actions не выполняются

**Симптомы:**
- Нет логов `[pausePlayer]` в консоли
- Кнопки не реагируют

**Решение:**
1. Проверьте что `SUPABASE_SERVICE_ROLE_KEY` установлен в Vercel
2. Проверьте логи в Vercel Dashboard → Deployments → [latest] → Logs
3. Убедитесь что нет ошибок 500 в Network tab браузера

### Player не создается

**Симптомы:**
- В логах: `No player ref, skipping pause control`
- Видео не воспроизводится

**Решение:**
1. Проверьте что YouTube IFrame API загрузился: `window.YT` должен существовать
2. Проверьте что есть видео в очереди
3. Откройте Network tab и проверьте что `iframe_api` загрузился

## Полезные SQL запросы

### Проверить текущее состояние плеера
```sql
SELECT * FROM twitch_player.player_settings;
```

### Сбросить паузу вручную
```sql
UPDATE twitch_player.player_settings SET is_paused = false;
```

### Проверить очередь
```sql
SELECT id, title, status, position
FROM twitch_player.video_queue
WHERE status = 'pending'
ORDER BY position;
```

### Проверить RLS политики
```sql
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'twitch_player';
```

### Проверить права доступа
```sql
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'twitch_player' AND table_name = 'player_settings';
```

## Логирование

Все логи имеют префикс для удобства:
- `[pausePlayer]` - Server Action для паузы
- `[resumePlayer]` - Server Action для возобновления
- `[useRealtimeQueue]` - Hook для подписки на изменения
- `[YouTubePlayer]` - Компонент плеера

## Контакты для поддержки

Если проблема не решается:
1. Скопируйте все логи из Console
2. Сделайте скриншот Network tab (запрос к `/api/...`)
3. Экспортируйте логи из Vercel
