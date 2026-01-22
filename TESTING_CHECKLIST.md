# Чеклист для проверки работоспособности плеера

## Критическая проблема

**Симптомы:** Плеер начинает играть видео, но никакие кнопки (пауза, стоп, пропустить, перемотка, "играть сейчас") не работают.

## Решение проблемы - 3 шага

### Шаг 1: Применить миграцию Realtime

**Что делать:**

1. Откройте Supabase Dashboard → SQL Editor
2. Выполните SQL из файла `supabase/migrations/20260121000005_enable_realtime.sql`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE twitch_player.video_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE twitch_player.player_settings;
```

3. Проверьте что миграция применилась:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Ожидаемый результат:** В списке должны быть `twitch_player.video_queue` и `twitch_player.player_settings`

---

### Шаг 2: Использовать Debug Console

**Что делать:**

1. Откройте http://localhost:3000/debug (или ваш Vercel URL + /debug)
2. Проверьте секцию "Realtime Connection Status"

**Что должно быть:**
- ✅ Зелёный индикатор
- Статус: `SUBSCRIBED`
- В логах: `✅ Successfully subscribed to Realtime`

**Если статус не SUBSCRIBED:**
- ❌ Проверьте что миграция применена (Шаг 1)
- ❌ Проверьте Supabase Dashboard → Database → Replication (Realtime должен быть включен)
- ❌ Проверьте что environment variables правильные в Vercel

3. Нажмите кнопку "Test Pause"

**Что должно произойти:**
- В логах: `✅ pausePlayer() returned success`
- В секции "Current Settings" значение "Is Paused" должно **МГНОВЕННО** измениться на `true ⏸️`
- Если нужно нажать "Reload Data" чтобы увидеть изменения → Realtime НЕ работает

---

### Шаг 3: Проверить работу в OBS Player

**Что делать:**

1. Откройте http://localhost:3000/player в новой вкладке (или в OBS Browser Source)
2. Откройте DevTools (F12) → Console
3. В другой вкладке откройте Dashboard и нажмите "Пауза"

**Что должно быть в логах OBS Player:**

```
[useRealtimeQueue] Settings realtime update received: { ... }
[useRealtimeQueue] New settings data: { is_paused: true, ... }
[useRealtimeQueue] Settings loaded: { is_paused: true, ... }
[YouTubePlayer] Pause effect triggered: { hasPlayer: true, isPaused: true }
[YouTubePlayer] Applying pause state: true
[YouTubePlayer] Pausing video...
```

**И видео должно приостановиться! ✅**

---

## Если всё равно не работает

### Проверка 1: Настройки существуют в БД

```sql
SELECT * FROM twitch_player.player_settings;
```

**Если таблица пуста:**
- Перезапустите приложение (настройки должны создаться автоматически через root layout)
- Или создайте вручную:

```sql
INSERT INTO twitch_player.player_settings (is_paused, max_queue_size, max_video_duration, allow_duplicates)
VALUES (false, 50, 600, false);
```

### Проверка 2: RLS политики

```sql
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'twitch_player';
```

Должны быть политики для обеих таблиц.

### Проверка 3: Environment Variables в Vercel

Проверьте что установлены:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

После изменения переменных - передеплойте:
```bash
git commit --allow-empty -m "redeploy"
git push origin dev
```

---

## Что было исправлено

### 1. Timing Issue с применением pause state

**Проблема:** Если настройки загружались до создания YouTube плеера, pause state не применялся.

**Решение:** Теперь в `onReady` callback плеера сразу применяется текущее состояние паузы:

```typescript:components/player/YouTubePlayer.tsx
onReady: (event) => {
  console.log('[YouTubePlayer] Player ready, isPaused:', isPaused)
  if (isPaused) {
    console.log('[YouTubePlayer] Initial state is paused, pausing video')
    event.target.pauseVideo()
  } else {
    console.log('[YouTubePlayer] Initial state is playing, starting video')
    event.target.playVideo()
  }
}
```

### 2. Упрощена зависимость effect

**Было:** `useEffect(..., [isPaused, settings])`
**Стало:** `useEffect(..., [isPaused])`

Теперь effect триггерится только когда меняется `isPaused`, а не при каждом обновлении объекта `settings`.

### 3. Добавлена Debug Console

Новая страница `/debug` показывает:
- ✅ Realtime connection status в реальном времени
- ✅ Текущие настройки плеера
- ✅ Предпросмотр очереди
- ✅ Кнопки для тестирования Server Actions
- ✅ Логи всех событий

---

## Быстрые ссылки

- 🎮 **OBS Player:** http://localhost:3000/player
- 🎛️ **Dashboard:** http://localhost:3000/dashboard/queue
- 🐛 **Debug Console:** http://localhost:3000/debug
- 📖 **Полный гайд по отладке:** [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

---

## Итог

После выполнения всех 3 шагов, кнопки управления должны работать:

✅ Пауза/Возобновление работает мгновенно
✅ Пропуск видео работает
✅ "Играть сейчас" из очереди работает
✅ Перемотка работает
✅ Все изменения синхронизируются между Dashboard и OBS Player в реальном времени

Если проблема сохраняется - отправьте:
1. Скриншот /debug страницы с секцией Realtime Status
2. Логи из браузерной консоли OBS Player (/player)
3. Результат SQL запроса проверки Realtime publication
