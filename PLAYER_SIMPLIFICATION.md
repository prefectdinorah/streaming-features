# Упрощение архитектуры плеера

## Что изменилось

### ✅ Убрано
- ❌ Управление паузой (`is_paused`, `pausePlayer()`, `resumePlayer()`, `stopPlayer()`)
- ❌ Перемотка (`seek_to_seconds`, `seekToPosition()`)
- ❌ Сохранение позиции (`current_position`)
- ❌ `PlayerControls` компонент (кнопки Play/Pause)
- ❌ `SeekControls` компонент (слайдер перемотки)

### ✅ Добавлено
- ✅ `transparent_background` - прозрачный фон для OBS (по умолчанию `true`)
- ✅ `background_color` - цвет фона если прозрачность выключена (по умолчанию `#000000`)

## Философия

**Плеер теперь работает полностью автономно:**
- Видео просто играет на эндпоинте `/player`
- Никакого внешнего управления (паузы, перемотки)
- Единственный способ управления - через очередь видео

## Как это работает

1. **Добавление видео** → попадает в очередь
2. **Плеер** → автоматически воспроизводит первое видео из очереди
3. **Завершение видео** → автоматически помечается как `completed` и удаляется
4. **Следующее видео** → автоматически начинает воспроизводиться

## Применение миграции

Когда запустишь Docker:

```bash
npx supabase db reset
```

Миграция `20260122000002_simplify_player_remove_pause.sql`:
- Удалит колонки `is_paused`, `seek_to_seconds`, `current_position`
- Добавит `transparent_background` и `background_color`

## Настройка прозрачного фона

В OBS Browser Source:
- **URL:** `http://localhost:3000/player`
- По умолчанию фон прозрачный (`transparent_background = true`)
- Для изменения обнови запись в `player_settings`:

```sql
UPDATE twitch_player.player_settings
SET transparent_background = false,
    background_color = '#FF0000' -- любой hex цвет
WHERE id = (SELECT id FROM twitch_player.player_settings LIMIT 1);
```

## Преимущества

1. **Простота** - меньше кода, меньше багов
2. **Надежность** - нет рассинхрона между разными вкладками
3. **Производительность** - не нужно сохранять позицию каждые 5 секунд
4. **Прозрачность** - полная прозрачность для OBS из коробки

## Что осталось

Управление через очередь:
- `skipCurrentVideo()` - пропустить текущее видео
- `playSpecificVideo(videoId)` - запустить конкретное видео
- `returnVideoToQueue(videoId)` - вернуть видео в очередь из истории

## Debug Console

Страница `/debug` обновлена:
- Показывает новые настройки (`transparent_background`, `background_color`)
- Убраны кнопки Test Pause / Test Resume
- Оставлена кнопка Test Skip для проверки Realtime

## Файлы изменены

```
supabase/migrations/20260122000002_simplify_player_remove_pause.sql
app/actions/player.ts
components/player/YouTubePlayer.tsx
hooks/useRealtimeQueue.ts
app/(dashboard)/dashboard/queue/page.tsx
app/debug/page.tsx
types/queue.ts
```
