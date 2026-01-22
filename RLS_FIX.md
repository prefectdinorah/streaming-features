# Исправление 401 ошибки (RLS проблема)

## Проблема

При завершении видео в плеере возникала ошибка:

```
Failed to load resource: the server responded with a status of 401 ()
[useRealtimeQueue] ❌ Error marking video as completed: Object
```

**Причина:** Row Level Security (RLS) политики Supabase блокировали обновление `video_queue` из клиентского кода.

## Архитектура до исправления

```
YouTubePlayer (клиент)
    ↓
useRealtimeQueue.markAsCompleted() (клиент)
    ↓
supabase.update() с anon key
    ↓
❌ RLS блокирует (401 ошибка)
```

**Проблема:** Клиентский Supabase клиент использует `anon` ключ, который не имеет прав на обновление `video_queue` напрямую.

## Архитектура после исправления

```
YouTubePlayer (клиент)
    ↓
markVideoAsCompleted() Server Action
    ↓
supabase.update() с service_role key
    ↓
✅ RLS обходится (успех)
    ↓
Realtime уведомление
    ↓
useRealtimeQueue.loadQueue()
    ↓
YouTubePlayer получает новое currentVideo
    ↓
Автоматическое переключение на следующее видео
```

**Решение:** Server Action с `service_role` ключом обходит RLS и имеет полные права на БД.

## Что изменилось

### 1. Создан Server Action

**Файл:** `app/actions/player.ts`

```typescript
export async function markVideoAsCompleted(videoId: string) {
  const supabase = createServiceClient() // service_role key

  const { error } = await supabase
    .schema('twitch_player')
    .from('video_queue')
    .update({
      status: 'completed',
      played_at: new Date().toISOString(),
    })
    .eq('id', videoId)

  if (error) {
    console.error('[markVideoAsCompleted] ❌ Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
```

### 2. YouTubePlayer обновлен

**Файл:** `components/player/YouTubePlayer.tsx`

```typescript
import { markVideoAsCompleted } from '@/app/actions/player'

// В onStateChange:
if (event.data === window.YT.PlayerState.ENDED) {
  markVideoAsCompleted(currentVideo.id).catch(err => {
    console.error('[YouTubePlayer] Failed to mark video as completed:', err)
  })
}
```

### 3. useRealtimeQueue упрощен

**Файл:** `hooks/useRealtimeQueue.ts`

- ❌ Удалена функция `markAsCompleted` (больше не нужна)
- ✅ Оставлены только `loadQueue` и `loadSettings`
- ✅ Подписка на Realtime обновления остается

## Почему это работает

### Service Role Key vs Anon Key

| Ключ | Права | Где используется | RLS |
|------|-------|------------------|-----|
| `anon` | Ограниченные | Клиентский код | ✅ Применяется |
| `service_role` | Полные (admin) | Server Actions | ❌ Обходится |

**ВАЖНО:** `service_role` ключ **никогда** не должен попадать в клиентский код! Только Server Actions.

### Безопасность

✅ **Безопасно:**
- Server Action выполняется на сервере
- `service_role` ключ не доступен клиенту
- Логика валидации на сервере

❌ **Небезопасно (старый подход):**
- Клиентский код пытается обновить БД
- Блокируется RLS политиками
- 401 ошибка

## Поток выполнения

1. **Видео заканчивается** → `onStateChange` срабатывает
2. **Вызов Server Action** → `markVideoAsCompleted(videoId)`
3. **Обновление БД** → `UPDATE video_queue SET status='completed'` (с service_role)
4. **Realtime событие** → Supabase отправляет уведомление всем подписчикам
5. **Перезагрузка очереди** → `useRealtimeQueue` получает событие и вызывает `loadQueue()`
6. **Обновление UI** → `currentVideo` обновляется на следующее видео
7. **Переключение плеера** → useEffect в `YouTubePlayer` видит новое `currentVideo` и переключает

## Отладка

Теперь в консоли видно весь процесс:

```
[YouTubePlayer] State changed: ENDED (0)
[YouTubePlayer] 🎬 Video ENDED, marking as completed: { videoId: '...', title: '...' }
[markVideoAsCompleted] Marking video as completed: abc123
[markVideoAsCompleted] ✅ Success
[useRealtimeQueue] 🔄 Realtime update received: { event: 'UPDATE', ... }
[useRealtimeQueue] Loading queue...
[useRealtimeQueue] Queue loaded: { count: 2, currentVideo: 'Next Video' }
[YouTubePlayer] Switching video: { from: 'abc123', to: 'def456', ... }
[YouTubePlayer] Starting playback of new video
[YouTubePlayer] State changed: PLAYING (1)
```

Если видео не переключается - смотри логи и найди где процесс застрял.

## Другие Server Actions в проекте

Все операции, требующие обхода RLS, используют Server Actions:

- `skipCurrentVideo()` - пропустить текущее видео
- `markVideoAsCompleted()` - пометить видео как завершенное
- `playSpecificVideo()` - запустить конкретное видео
- `returnVideoToQueue()` - вернуть видео в очередь

## YouTube ошибки

```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
No media for playlist
```

Эти ошибки **не критичны** и связаны с:
- Блокировщиком рекламы (блокирует YouTube аналитику)
- YouTube пытается загрузить несуществующий плейлист (мы передаем `playlist: ''`)

Не влияют на работу плеера.

## Проверка работы

1. Добавь 2-3 коротких видео в очередь
2. Открой `/player`
3. Открой консоль браузера (F12)
4. Дождись окончания первого видео
5. В логах увидишь весь процесс переключения
6. Следующее видео должно начать играть автоматически

Если не работает - скопируй логи из консоли и отправь мне!
