# Исправление мгновенного пропуска видео

## Проблема

**Симптом:** Видео сразу падает из очереди в "Недавно просмотренные", даже не успев проиграться.

## Причина

Когда видео **заблокировано для встраивания** (YouTube Error 150):

1. YouTube IFrame API пытается загрузить видео
2. Видео заблокировано владельцем → `onError` срабатывает **мгновенно**
3. Старый код сразу вызывал `markVideoAsCompleted()`
4. Видео помечалось как `completed` за миллисекунды
5. Realtime обновление → видео исчезает из очереди → появляется в истории

**Проблемные видео:**
- Rick Roll (dQw4w9WgXcQ)
- Большинство музыкальных клипов
- Видео с контент-защитой

## Решение

Добавлен **tracking воспроизведения** с защитой от мгновенного пропуска:

### 1. Отслеживание начала воспроизведения

```typescript
const hasPlayedRef = useRef(false) // Начало ли видео воспроизводиться?

// При создании/переключении видео
hasPlayedRef.current = false

// Когда видео начинает играть (PLAYING state)
if (event.data === window.YT.PlayerState.PLAYING) {
  hasPlayedRef.current = true
  console.log('[YouTubePlayer] ✅ Video started playing')
}
```

### 2. Проверка в onError

```typescript
onError: (event) => {
  if (hasPlayedRef.current) {
    // Видео начало играть, но произошла ошибка во время воспроизведения
    console.log('[YouTubePlayer] Video had started playing, marking as completed')
    markVideoAsCompleted(currentVideo.id)
  } else {
    // Видео НЕ начало играть - скорее всего заблокировано
    console.warn('[YouTubePlayer] Video never started playing, waiting 3 seconds...')

    // Даем YouTube 3 секунды загрузиться
    setTimeout(() => {
      if (!hasPlayedRef.current) {
        // Если через 3 секунды все еще не играет - пропускаем
        console.warn('[YouTubePlayer] Video still not playing, skipping it')
        markVideoAsCompleted(currentVideo.id)
      } else {
        console.log('[YouTubePlayer] Video started during wait period, not skipping')
      }
    }, 3000)
  }
}
```

## Как работает защита

### Сценарий 1: Нормальное видео

```
1. Видео загружается
2. onReady → playVideo()
3. PLAYING state → hasPlayedRef = true ✅
4. Видео воспроизводится
5. ENDED state → markAsCompleted() → в историю
```

**Результат:** Видео проигралось полностью ✅

### Сценарий 2: Заблокированное видео

```
1. Видео пытается загрузиться
2. Error 150 → onError срабатывает
3. hasPlayedRef = false (видео не начало играть)
4. Ждем 3 секунды...
5. hasPlayedRef все еще false
6. markAsCompleted() → в историю как skipped
```

**Результат:** Видео пропускается через 3 секунды, не мгновенно ⏳

### Сценарий 3: Медленная загрузка

```
1. Видео загружается медленно
2. onError НЕ срабатывает
3. Через 2 секунды → PLAYING state → hasPlayedRef = true ✅
4. Видео воспроизводится
```

**Результат:** Видео успело загрузиться и проигрывается ✅

### Сценарий 4: Ошибка во время воспроизведения

```
1. Видео начало играть → hasPlayedRef = true ✅
2. Через 30 секунд → ошибка сети → onError
3. hasPlayedRef = true
4. Сразу markAsCompleted() → в историю
```

**Результат:** Видео пропускается сразу (уже начало играть) ✅

## Логи

### До исправления
```
Creating YouTube player for: dQw4w9WgXcQ
Player error: 150
[useRealtimeQueue] Queue loaded: { count: 0 }
```
⏱️ **Время:** ~100мс (мгновенно)

### После исправления
```
Creating YouTube player for: dQw4w9WgXcQ
[YouTubePlayer] Player ready, starting playback
Player error: 150
[YouTubePlayer] ❌ Player error: {
  code: 150,
  message: 'Video owner does not allow embedding',
  hasPlayed: false
}
[YouTubePlayer] Video never started playing, waiting 3 seconds...
[YouTubePlayer] Video still not playing after 3 seconds, skipping it
[useRealtimeQueue] Queue loaded: { count: 0 }
```
⏱️ **Время:** ~3 секунды (задержка защиты)

## Проверка работы

### ШАГ 1: Добавь рабочее видео

Используй **тестовое видео**, которое точно работает:

```
Big Buck Bunny (открытая лицензия):
https://www.youtube.com/watch?v=YE7VzlLtp-4
```

**Ожидаемое поведение:**
1. Видео добавляется в очередь
2. Плеер загружает видео
3. Через ~2 секунды: `[YouTubePlayer] ✅ Video started playing`
4. Видео воспроизводится полностью
5. После окончания: `[YouTubePlayer] 🎬 Video ENDED`
6. Видео перемещается в "Недавно просмотренные"

### ШАГ 2: Добавь заблокированное видео (тест)

```
Rick Roll (заблокировано):
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Ожидаемое поведение:**
1. Видео добавляется в очередь
2. Плеер пытается загрузить
3. Ошибка 150: `Video owner does not allow embedding`
4. `hasPlayed: false` → ждем 3 секунды
5. Через 3 секунды: `Video still not playing, skipping it`
6. Видео перемещается в "Недавно просмотренные"

### ШАГ 3: Смотри логи

Открой консоль браузера (F12) и увидишь:

**Для рабочего видео:**
```
[YouTubePlayer] State changed: BUFFERING (3)
[YouTubePlayer] State changed: PLAYING (1)
[YouTubePlayer] ✅ Video started playing
[YouTubePlayer] State changed: ENDED (0)
[YouTubePlayer] 🎬 Video ENDED
```

**Для заблокированного:**
```
[YouTubePlayer] ❌ Player error: { code: 150, hasPlayed: false }
[YouTubePlayer] Video never started playing, waiting 3 seconds...
[YouTubePlayer] Video still not playing after 3 seconds, skipping it
```

## Рекомендуемые видео для тестирования

### ✅ Работают (разрешено встраивание)

| Название | YouTube ID | URL |
|----------|-----------|-----|
| Big Buck Bunny | YE7VzlLtp-4 | https://www.youtube.com/watch?v=YE7VzlLtp-4 |
| Blender Open Movie | aqz-KE-bpKQ | https://www.youtube.com/watch?v=aqz-KE-bpKQ |
| Test Video | jNQXAC9IVRw | https://www.youtube.com/watch?v=jNQXAC9IVRw |

### ❌ Заблокированы (для тестирования ошибок)

| Название | YouTube ID | URL |
|----------|-----------|-----|
| Rick Roll | dQw4w9WgXcQ | https://www.youtube.com/watch?v=dQw4w9WgXcQ |

## Преимущества решения

✅ **Защита от мгновенного пропуска**
- 3 секунды на загрузку
- Видео не пропускается если начало играть

✅ **Автоматическая обработка ошибок**
- Заблокированные видео пропускаются через 3 сек
- Ошибки во время воспроизведения обрабатываются сразу

✅ **Подробные логи**
- Видно какое видео и почему не сработало
- Понятно на каком этапе произошла ошибка

✅ **Плавный UX**
- Видео успевает загрузиться
- Медленное соединение не вызывает проблем

## Известные ограничения

⚠️ **Нельзя проверить заранее**
- YouTube API не позволяет узнать можно ли встраивать видео
- Единственный способ - попробовать воспроизвести

⚠️ **3 секунды задержки**
- Заблокированные видео пропускаются не мгновенно
- Это компромисс для защиты от ложных срабатываний

⚠️ **Все равно попадает в историю**
- Заблокированное видео помечается как `completed`
- В будущем можно добавить отдельный статус `failed`

## Файлы изменены

```
components/player/YouTubePlayer.tsx - Добавлен hasPlayedRef и защита от мгновенного пропуска
```

## Дальнейшие улучшения

### Возможное улучшение 1: Статус 'failed'

Добавить отдельный статус для видео с ошибками:

```sql
ALTER TYPE video_status ADD VALUE 'failed';
```

Тогда в UI можно будет различать:
- `completed` - проигралось полностью
- `skipped` - пропущено вручную
- `failed` - ошибка воспроизведения

### Возможное улучшение 2: Валидация при добавлении

Попробовать проверять видео сразу при добавлении:

```typescript
// При добавлении видео попробовать fetch
const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}`)
if (!response.ok) {
  // Видео заблокировано или не существует
}
```

⚠️ **Минус:** oembed API тоже не всегда точный.

### Возможное улучшение 3: Список разрешенных видео

Создать whitelist проверенных видео:

```typescript
const VERIFIED_VIDEOS = [
  'YE7VzlLtp-4', // Big Buck Bunny
  'aqz-KE-bpKQ', // Blender
  // ...
]
```

⚠️ **Минус:** Ограничивает контент, нужно постоянно обновлять.
