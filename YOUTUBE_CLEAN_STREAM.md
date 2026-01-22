# YouTube чистый видеопоток

## Что сделано

### ✅ Максимальная очистка YouTube UI

Мы используем YouTube IFrame API с параметрами для минимизации всех элементов интерфейса:

**IFrame параметры:**
- `controls: 0` - скрыть все элементы управления
- `modestbranding: 1` - минимальный брендинг (скрыть логотип)
- `iv_load_policy: 3` - отключить аннотации
- `rel: 0` - не показывать похожие видео
- `showinfo: 0` - не показывать информацию о видео
- `cc_load_policy: 0` - не показывать субтитры
- `disablekb: 1` - отключить клавиатурное управление
- `fs: 0` - отключить кнопку полного экрана

**CSS скрытие элементов:**
- Водяной знак YouTube (`.ytp-watermark`)
- Кнопка паузы при наведении (`.ytp-pause-overlay`)
- Градиенты вверху и внизу (`.ytp-gradient-*`)
- Кнопки управления (`.ytp-chrome-bottom`)
- Большая кнопка play (`.ytp-cued-thumbnail-overlay`)
- Endscreen с похожими видео (`.ytp-endscreen-content`)
- Карточки в видео (`.ytp-cards-teaser`, `.ytp-ce-element`)

### Результат

**Вы получаете максимально чистый видеопоток:**
- Нет элементов управления
- Нет логотипа YouTube
- Нет аннотаций и карточек
- Нет похожих видео в конце
- Только само видео

## Ограничения YouTube IFrame API

⚠️ **ВАЖНО:** Получить прямой видеопоток (raw video stream) с YouTube официально **невозможно**.

YouTube не предоставляет:
- Прямые ссылки на MP4/WEBM файлы через API
- Доступ к видеопотоку без их IFrame
- Способ полностью убрать брендинг

Любые попытки обойти это (через youtube-dl, yt-dlp и т.д.):
1. ❌ Нарушают Terms of Service YouTube
2. ❌ Могут привести к блокировке API ключа
3. ❌ Ссылки истекают через несколько часов
4. ❌ Требуют постоянного обновления

## Альтернативные решения

Если нужен **полностью чистый поток без YouTube UI**:

### Вариант 1: Self-hosted видео
```typescript
// Вместо YouTube использовать свой сервер
<video src="/api/stream/video123.mp4" autoPlay />
```

**Плюсы:**
- Полный контроль
- Нет брендинга
- Чистый поток

**Минусы:**
- Нужен сервер для хостинга
- Трафик и storage
- Нет YouTube контента

### Вариант 2: Twitch Clips/VODs
```typescript
// Twitch Embed Player
<iframe src="https://player.twitch.tv/?video=v123456" />
```

**Плюсы:**
- Чище чем YouTube
- Меньше оверлеев
- Легальный API

**Минусы:**
- Только Twitch контент
- Все равно есть UI элементы

### Вариант 3: Vimeo Pro
```typescript
// Vimeo Player без брендинга
<iframe src="https://player.vimeo.com/video/123?title=0&byline=0&portrait=0" />
```

**Плюсы:**
- Официально можно убрать весь UI
- Профессиональный вид
- Без рекламы

**Минусы:**
- Платная подписка ($20/месяц)
- Нужно загружать видео на Vimeo

## Рекомендации

**Для Twitch стрима:**
Текущее решение с YouTube IFrame API + CSS очистка - **оптимальное**:

✅ Легально
✅ Стабильно
✅ Максимально чистый поток в рамках ToS
✅ Не требует дополнительных затрат
✅ Работает с любым YouTube видео

## Debug логирование

В консоли браузера теперь видно весь процесс:

```
[YouTubePlayer] Player ready, starting playback
[YouTubePlayer] State changed: PLAYING (1)
[YouTubePlayer] State changed: ENDED (0)
[YouTubePlayer] 🎬 Video ENDED, marking as completed
[useRealtimeQueue] Marking video as completed: abc123
[useRealtimeQueue] ✅ Video marked as completed, waiting for Realtime update...
[useRealtimeQueue] 🔄 Realtime update received: { event: 'UPDATE', ... }
[useRealtimeQueue] Loading queue...
[useRealtimeQueue] Queue loaded: { count: 2, currentVideo: 'Next Video' }
[YouTubePlayer] Switching video: { from: 'abc123', to: 'def456', ... }
[YouTubePlayer] Starting playback of new video
[YouTubePlayer] State changed: PLAYING (1)
```

Если видео не переключается автоматически - смотри логи в консоли.

## Настройки OBS

**Browser Source:**
- URL: `http://localhost:3000/player`
- Width: 1920
- Height: 1080
- FPS: 30
- ✅ Shutdown source when not visible: **OFF**
- ✅ Refresh browser when scene becomes active: **ON**
- ✅ Control audio via OBS: **ON** (если нужно)

**CSS для еще большей прозрачности (опционально):**
```css
body {
  background: transparent !important;
  margin: 0;
  overflow: hidden;
}
```
